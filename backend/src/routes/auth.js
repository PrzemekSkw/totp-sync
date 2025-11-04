const ALLOW_REGISTRATION = process.env.ALLOW_REGISTRATION !== 'false'; // default: true
const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticator } = require('otplib');
const crypto = require('crypto');
const { hashPassword, verifyPassword, encryptSecret, decryptSecret } = require('../services/crypto');
const { generateToken, authenticateToken, refreshToken } = require('../middleware/auth');
const db = require('../services/database');

const router = express.Router();
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');

// Check if 2FA is required during registration
const REQUIRE_2FA_ON_REGISTER = process.env.REQUIRE_2FA_ON_REGISTER === 'true';

// Generate backup codes
const generateBackupCodes = () => {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  return codes;
};

// Helper: Parse backup codes (SQLite returns JSON string, PostgreSQL array)
const parseBackupCodes = (backupCodes) => {
  if (!backupCodes) return [];
  if (Array.isArray(backupCodes)) return backupCodes;
  if (typeof backupCodes === 'string') {
    try {
      return JSON.parse(backupCodes);
    } catch (e) {
      return [];
    }
  }
  return [];
};

// Validation
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

// Registration
router.post('/register', registerValidation, async (req, res) => {
  // Check if registration is allowed
  if (!ALLOW_REGISTRATION) {
    return res.status(403).json({ error: 'Registration is currently disabled' });
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // If 2FA required during registration
    if (REQUIRE_2FA_ON_REGISTER) {
      // Generate TOTP secret (but DON'T create account yet!)
      const secret = authenticator.generateSecret();
      const backupCodes = generateBackupCodes();

      // Generate otpauth URL for QR code
      const otpauthUrl = authenticator.keyuri(
        email,
        'TOTP Sync',
        secret
      );

      // Encrypt password and secret
      const passwordHash = await hashPassword(password);
      const encryptedSecret = encryptSecret(secret);

      // DON'T save to database - only send data to frontend
      res.status(200).json({
        message: 'Please setup 2FA to complete registration',
        requires2FA: true,
        twoFactor: {
          secret,
          otpauthUrl,
          backupCodes
        },
        // Data to pass during verification
        pendingRegistration: {
          email,
          passwordHash,
          encryptedSecret,
          backupCodes
        }
      });
    } else {
      // Standard registration without 2FA
      const passwordHash = await hashPassword(password);

      const result = await db.query(
        'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
        [email, passwordHash]
      );

      const user = result.rows[0];
      const token = generateToken(user.id, user.email);

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.created_at
        }
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Complete registration after 2FA verification
router.post('/register/verify-2fa', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  body('token').isLength({ min: 6, max: 6 }),
  body('pendingData').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, token, pendingData } = req.body;

  try {
    // Check if user doesn't already exist (double check)
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Verify password (make sure it's the same user)
    const isPasswordValid = await verifyPassword(password, pendingData.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Decrypt secret
    const secret = decryptSecret(pendingData.encryptedSecret);

    // Verify 2FA token
    const isTokenValid = authenticator.verify({ token, secret });

    if (!isTokenValid) {
      return res.status(400).json({ error: 'Invalid 2FA code. Please try again.' });
    }

    // Token correct - NOW create account
    const result = await db.query(
      'INSERT INTO users (email, password_hash, totp_secret_encrypted, backup_codes, totp_enabled) VALUES ($1, $2, $3, $4, TRUE) RETURNING id, email, created_at',
      [email, pendingData.passwordHash, pendingData.encryptedSecret, pendingData.backupCodes]
    );

    const user = result.rows[0];

    // Give JWT token
    const jwtToken = generateToken(user.id, user.email);

    res.json({
      message: 'Registration completed successfully',
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        twoFactorEnabled: true
      }
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({ error: 'Failed to complete registration' });
  }
});

// Login
router.post('/login', loginValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, token: totpToken } = req.body;

  try {
    // Find user
    const result = await db.query(
      'SELECT id, email, password_hash, totp_enabled, totp_secret_encrypted, backup_codes, created_at FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // If 2FA enabled, require code
    if (user.totp_enabled) {
      if (!totpToken) {
        return res.status(200).json({ 
          requires2FA: true,
          message: '2FA code required' 
        });
      }

      // Verify TOTP code
      const secret = decryptSecret(user.totp_secret_encrypted);
      const isTokenValid = authenticator.verify({ token: totpToken, secret });

      // If TOTP incorrect, check backup codes
      if (!isTokenValid) {
        // Parse backup codes (SQLite returns JSON string)
        const backupCodesArray = parseBackupCodes(user.backup_codes);
        const normalizedToken = totpToken.toUpperCase().trim();
        
        if (backupCodesArray.includes(normalizedToken)) {
          // Remove used backup code
          const newBackupCodes = backupCodesArray.filter(code => code !== normalizedToken);
          await db.query(
            'UPDATE users SET backup_codes = $1 WHERE id = $2',
            [newBackupCodes, user.id]
          );
        } else {
          return res.status(401).json({ error: 'Invalid 2FA code' });
        }
      }
    }

    // Generate token
    const token = generateToken(user.id, user.email);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
        twoFactorEnabled: user.totp_enabled || false
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Refresh token
router.post('/refresh', refreshToken);

// Verify token
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, totp_enabled, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      valid: true,
      user: {
        ...result.rows[0],
        twoFactorEnabled: result.rows[0].totp_enabled || false
      }
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Failed to verify token' });
  }
});

// Change password
router.post('/change-password', authenticateToken, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { currentPassword, newPassword } = req.body;

  try {
    const result = await db.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValid = await verifyPassword(currentPassword, result.rows[0].password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const newPasswordHash = await hashPassword(newPassword);

    await db.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, req.user.userId]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Setup 2FA
router.post('/2fa/setup', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT totp_enabled FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows[0].totp_enabled) {
      return res.status(400).json({ error: '2FA is already enabled' });
    }

    const secret = authenticator.generateSecret();
    const encryptedSecret = encryptSecret(secret);
    const backupCodes = generateBackupCodes();

    await db.query(
      'UPDATE users SET totp_secret_encrypted = $1, backup_codes = $2 WHERE id = $3',
      [encryptedSecret, backupCodes, req.user.userId]
    );

    const otpauthUrl = authenticator.keyuri(
      req.user.email,
      'TOTP Sync',
      secret
    );

    res.json({
      secret,
      otpauthUrl,
      backupCodes
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ error: 'Failed to setup 2FA' });
  }
});

// Enable 2FA
router.post('/2fa/enable', authenticateToken, [
  body('token').notEmpty().isLength({ min: 6, max: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { token } = req.body;

  try {
    const result = await db.query(
      'SELECT totp_secret_encrypted, totp_enabled FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (result.rows[0].totp_enabled) {
      return res.status(400).json({ error: '2FA is already enabled' });
    }

    if (!result.rows[0].totp_secret_encrypted) {
      return res.status(400).json({ error: 'Please setup 2FA first' });
    }

    const secret = decryptSecret(result.rows[0].totp_secret_encrypted);
    const isValid = authenticator.verify({ token, secret });

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid 2FA code' });
    }

    await db.query(
      'UPDATE users SET totp_enabled = TRUE WHERE id = $1',
      [req.user.userId]
    );

    res.json({ message: '2FA enabled successfully' });
  } catch (error) {
    console.error('2FA enable error:', error);
    res.status(500).json({ error: 'Failed to enable 2FA' });
  }
});

// Disable 2FA
router.post('/2fa/disable', authenticateToken, [
  body('password').notEmpty(),
  body('token').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { password, token } = req.body;

  try {
    const result = await db.query(
      'SELECT password_hash, totp_secret_encrypted, totp_enabled FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    if (!user.totp_enabled) {
      return res.status(400).json({ error: '2FA is not enabled' });
    }

    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const secret = decryptSecret(user.totp_secret_encrypted);
    const isTokenValid = authenticator.verify({ token, secret });

    if (!isTokenValid) {
      return res.status(400).json({ error: 'Invalid 2FA code' });
    }

    await db.query(
      'UPDATE users SET totp_enabled = FALSE, totp_secret_encrypted = NULL, backup_codes = NULL WHERE id = $1',
      [req.user.userId]
    );

    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({ error: 'Failed to disable 2FA' });
  }
});

// Check 2FA status
router.get('/2fa/status', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT totp_enabled FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      enabled: result.rows[0].totp_enabled || false 
    });
  } catch (error) {
    console.error('2FA status error:', error);
    res.status(500).json({ error: 'Failed to check 2FA status' });
  }
});

// Delete account endpoint
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { password, twoFactorCode } = req.body;

    // Get user from database
    const userResult = await db.query(
      'SELECT id, email, password_hash, totp_enabled, totp_secret_encrypted FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Verify password
    const validPassword = await verifyPassword(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Verify 2FA if enabled
    if (user.totp_enabled) {
      if (!twoFactorCode) {
        return res.status(400).json({ error: '2FA code required' });
      }

      const secret = decryptSecret(user.totp_secret_encrypted);
      const verified = authenticator.verify({
        token: twoFactorCode,
        secret
      });

      if (!verified) {
        return res.status(401).json({ error: 'Invalid 2FA code' });
      }
    }

    // Delete all user's TOTP entries
    await db.query('DELETE FROM totp_entries WHERE user_id = $1', [userId]);
    
    // Delete WebAuthn credentials
    await db.query('DELETE FROM webauthn_credentials WHERE user_id = $1', [userId]);

    // Delete user account
    await db.query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({ 
      success: true,
      message: 'Account deleted successfully' 
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// ============================================
// WebAuthn Endpoints
// ============================================

// Get WebAuthn configuration from environment
const rpName = process.env.RP_NAME || 'TOTP Sync';
const rpID = process.env.RP_ID || 'localhost';
const origin = process.env.ORIGIN || 'http://localhost:5173';

// Helper: Convert base64url to base64 (for credential_id comparison)
const base64urlToBase64 = (base64url) => {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return base64;
};

// Generate registration options (start key registration)
router.post('/webauthn/register-options', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userEmail = req.user.email;

    // Get user's existing credentials
    const result = await db.query(
      'SELECT credential_id FROM webauthn_credentials WHERE user_id = $1',
      [userId]
    );

    const excludeCredentials = result.rows.map(row => ({
      id: Buffer.from(row.credential_id, 'base64'),
      type: 'public-key',
    }));

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: new Uint8Array(Buffer.from(userId.toString())),
      userName: userEmail,
      attestationType: 'none',
      excludeCredentials,
      authenticatorSelection: {
        residentKey: 'required',  // Required for cross-device passkeys
        userVerification: 'preferred',
      },
      supportedAlgorithmIDs: [-7, -257],  // ES256 and RS256
    });

    // Store challenge in session (we'll use a simple in-memory store for now)
    // In production, use Redis or database
    if (!global.webauthnChallenges) {
      global.webauthnChallenges = new Map();
    }
    global.webauthnChallenges.set(userId, options.challenge);

    res.json(options);
  } catch (error) {
    console.error('WebAuthn register options error:', error);
    res.status(500).json({ error: 'Failed to generate registration options' });
  }
});

// Verify registration response (complete key registration)
router.post('/webauthn/register-verify', authenticateToken, [
  body('credential').notEmpty(),
  body('name').optional().isString(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const userId = req.user.userId;
    const { credential, name } = req.body;

    // Get stored challenge
    const expectedChallenge = global.webauthnChallenges?.get(userId);
    if (!expectedChallenge) {
      return res.status(400).json({ error: 'Challenge not found or expired' });
    }

    // Verify registration
    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return res.status(400).json({ error: 'Verification failed' });
    }

    const { credentialPublicKey, counter } = verification.registrationInfo;

    // Use credential.id from browser instead of credentialID from verification
    const credentialIdBase64 = credential.id;
    const publicKeyBase64 = Buffer.from(credentialPublicKey).toString('base64');
    const transports = credential.response.transports || null;

    await db.query(
      'INSERT INTO webauthn_credentials (user_id, credential_id, public_key, counter, name, transports) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, credentialIdBase64, publicKeyBase64, counter, name || 'Security Key', transports]
    );

    // Clear challenge
    global.webauthnChallenges.delete(userId);

    res.json({ 
      success: true,
      message: 'Security key registered successfully' 
    });
  } catch (error) {
    console.error('WebAuthn register verify error:', error);
    res.status(500).json({ error: 'Failed to verify registration' });
  }
});

// Generate authentication options (start key login)
router.post('/webauthn/login-options', [
  body('email').isEmail().normalizeEmail(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email } = req.body;

    // Find user
    const userResult = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = userResult.rows[0].id;

    // For cross-device authentication (QR code with phone), 
    // don't specify allowCredentials - let the device discover passkeys
    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: 'preferred',
    });

    // Store challenge
    if (!global.webauthnChallenges) {
      global.webauthnChallenges = new Map();
    }
    global.webauthnChallenges.set(userId, options.challenge);

    res.json({ ...options, userId });
  } catch (error) {
    console.error('WebAuthn login options error:', error);
    res.status(500).json({ error: 'Failed to generate authentication options' });
  }
});

// Verify authentication response (complete key login)
router.post('/webauthn/login-verify', [
  body('credential').notEmpty(),
  body('userId').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { credential, userId } = req.body;

    // Get stored challenge
    const expectedChallenge = global.webauthnChallenges?.get(parseInt(userId));
    if (!expectedChallenge) {
      return res.status(400).json({ error: 'Challenge not found or expired' });
    }

    // credential.id comes from browser in base64url format
    // Convert to standard base64 for database lookup
    const credentialIdBase64 = credential.id;

    const credResult = await db.query(
      'SELECT user_id, public_key, counter, transports FROM webauthn_credentials WHERE credential_id = $1',
      [credentialIdBase64]
    );

    if (credResult.rows.length === 0) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    const dbCredential = credResult.rows[0];
    const publicKey = Buffer.from(dbCredential.public_key, 'base64');
    const transports = dbCredential.transports ? 
      (typeof dbCredential.transports === 'string' ? JSON.parse(dbCredential.transports) : dbCredential.transports) : 
      undefined;

    // Verify authentication
    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: Buffer.from(credentialIdBase64, 'base64'),
        credentialPublicKey: publicKey,
        counter: dbCredential.counter,
        transports,
      },
    });

    if (!verification.verified) {
      return res.status(400).json({ error: 'Verification failed' });
    }

    // Update counter and last used
    await db.query(
      'UPDATE webauthn_credentials SET counter = $1, last_used_at = CURRENT_TIMESTAMP WHERE credential_id = $2',
      [verification.authenticationInfo.newCounter, credentialIdBase64]
    );

    // Clear challenge
    global.webauthnChallenges.delete(parseInt(userId));

    // Get user info
    const userResult = await db.query(
      'SELECT id, email, totp_enabled, created_at FROM users WHERE id = $1',
      [dbCredential.user_id]
    );

    const user = userResult.rows[0];

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
        twoFactorEnabled: user.totp_enabled || false,
      },
    });
  } catch (error) {
    console.error('WebAuthn login verify error:', error);
    res.status(500).json({ error: 'Failed to verify authentication' });
  }
});

// Get user's registered credentials
router.get('/webauthn/credentials', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await db.query(
      'SELECT id, name, created_at, last_used_at FROM webauthn_credentials WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.json({ credentials: result.rows });
  } catch (error) {
    console.error('Get credentials error:', error);
    res.status(500).json({ error: 'Failed to get credentials' });
  }
});

// Delete a credential
router.delete('/webauthn/credentials/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const credentialId = req.params.id;

    // Verify the credential belongs to the user
    const result = await db.query(
      'DELETE FROM webauthn_credentials WHERE id = $1 AND user_id = $2',
      [credentialId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    res.json({ 
      success: true,
      message: 'Security key removed successfully' 
    });
  } catch (error) {
    console.error('Delete credential error:', error);
    res.status(500).json({ error: 'Failed to delete credential' });
  }
});

module.exports = router;