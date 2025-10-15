const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticator } = require('otplib');
const crypto = require('crypto');
const { hashPassword, verifyPassword, encryptSecret, decryptSecret } = require('../services/crypto');
const { generateToken, authenticateToken, refreshToken } = require('../middleware/auth');
const db = require('../services/database');

const router = express.Router();

// Sprawdź czy 2FA jest wymagane przy rejestracji
const REQUIRE_2FA_ON_REGISTER = process.env.REQUIRE_2FA_ON_REGISTER === 'true';

// Generuj backup kody
const generateBackupCodes = () => {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  return codes;
};

// Walidacja
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

// Rejestracja
router.post('/register', registerValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Sprawdź czy użytkownik już istnieje
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // ✅ Jeśli 2FA wymagane przy rejestracji
    if (REQUIRE_2FA_ON_REGISTER) {
      // Generuj TOTP secret (ale NIE twórz konta jeszcze!)
      const secret = authenticator.generateSecret();
      const backupCodes = generateBackupCodes();

      // Generuj otpauth URL dla QR kodu
      const otpauthUrl = authenticator.keyuri(
        email,
        'TOTP Sync',
        secret
      );

      // Zaszyfruj hasło i secret
      const passwordHash = await hashPassword(password);
      const encryptedSecret = encryptSecret(secret);

      // ❌ NIE zapisuj w bazie - tylko wyślij dane do frontendu
      res.status(200).json({
        message: 'Please setup 2FA to complete registration',
        requires2FA: true,
        twoFactor: {
          secret,
          otpauthUrl,
          backupCodes
        },
        // Dane do przekazania przy weryfikacji
        pendingRegistration: {
          email,
          passwordHash,
          encryptedSecret,
          backupCodes
        }
      });
    } else {
      // ✅ Standardowa rejestracja bez 2FA
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

// ✅ Dokończ rejestrację po weryfikacji 2FA
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
    // Sprawdź czy użytkownik już nie istnieje (double check)
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Weryfikuj hasło (upewnij się że to ten sam użytkownik)
    const isPasswordValid = await verifyPassword(password, pendingData.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Deszyfruj secret
    const secret = decryptSecret(pendingData.encryptedSecret);

    // Weryfikuj token 2FA
    const isTokenValid = authenticator.verify({ token, secret });

    if (!isTokenValid) {
      return res.status(400).json({ error: 'Invalid 2FA code. Please try again.' });
    }

    // ✅ Token poprawny - TERAZ utwórz konto
    const result = await db.query(
      'INSERT INTO users (email, password_hash, totp_secret_encrypted, backup_codes, totp_enabled) VALUES ($1, $2, $3, $4, TRUE) RETURNING id, email, created_at',
      [email, pendingData.passwordHash, pendingData.encryptedSecret, pendingData.backupCodes]
    );

    const user = result.rows[0];

    // ✅ Daj token JWT
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

// Logowanie
router.post('/login', loginValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, token: totpToken } = req.body;

  try {
    // Znajdź użytkownika
    const result = await db.query(
      'SELECT id, email, password_hash, totp_enabled, totp_secret_encrypted, backup_codes, created_at FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Weryfikuj hasło
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Jeśli 2FA włączone, wymagaj kodu
    if (user.totp_enabled) {
      if (!totpToken) {
        return res.status(200).json({ 
          requires2FA: true,
          message: '2FA code required' 
        });
      }

      // Weryfikuj kod TOTP
      const secret = decryptSecret(user.totp_secret_encrypted);
      const isTokenValid = authenticator.verify({ token: totpToken, secret });

      // Jeśli TOTP niepoprawny, sprawdź backup kody
      if (!isTokenValid) {
        if (user.backup_codes && user.backup_codes.includes(totpToken)) {
          // Usuń użyty backup kod
          const newBackupCodes = user.backup_codes.filter(code => code !== totpToken);
          await db.query(
            'UPDATE users SET backup_codes = $1 WHERE id = $2',
            [newBackupCodes, user.id]
          );
        } else {
          return res.status(401).json({ error: 'Invalid 2FA code' });
        }
      }
    }

    // Generuj token
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

// Odświeżanie tokena
router.post('/refresh', refreshToken);

// Weryfikacja tokena
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

// Zmiana hasła
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

// Włącz 2FA
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

// Wyłącz 2FA
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

// Sprawdź status 2FA
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

module.exports = router;
