const express = require('express');
const { body, validationResult } = require('express-validator');
const { encryptSecret, decryptSecret } = require('../services/crypto');
const { authenticateToken } = require('../middleware/auth');
const db = require('../services/database');

const router = express.Router();
router.use(authenticateToken);

// Parsowanie URI otpauth://
const parseOtpAuthUri = (uri) => {
  try {
    const url = new URL(uri);
    
    if (url.protocol !== 'otpauth:') {
      throw new Error('Invalid protocol');
    }

    const type = url.hostname; // totp lub hotp
    if (type !== 'totp') {
      throw new Error('Only TOTP is supported');
    }

    const label = decodeURIComponent(url.pathname.slice(1));
    const params = new URLSearchParams(url.search);

    const secret = params.get('secret');
    if (!secret) {
      throw new Error('Secret is required');
    }

    let issuer = params.get('issuer') || '';
    let name = label;

    // Format: issuer:account
    if (label.includes(':')) {
      const parts = label.split(':');
      issuer = issuer || parts[0];
      name = parts[1] || parts[0];
    }

    return {
      name: name.trim(),
      issuer: issuer.trim(),
      secret: secret.replace(/\s/g, ''),
      algorithm: params.get('algorithm') || 'SHA1',
      digits: parseInt(params.get('digits') || '6'),
      period: parseInt(params.get('period') || '30')
    };
  } catch (error) {
    throw new Error(`Failed to parse URI: ${error.message}`);
  }
};

// Export wszystkich wpisów do JSON (format FreeOTP+)
router.get('/export', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, issuer, secret_encrypted, algorithm, digits, period, icon, color
       FROM totp_entries 
       WHERE user_id = $1 AND deleted_at IS NULL
       ORDER BY position ASC, created_at DESC`,
      [req.user.userId]
    );

    const entries = result.rows.map(entry => {
      const secret = decryptSecret(entry.secret_encrypted);
      
      return {
        name: entry.name,
        issuer: entry.issuer || '',
        secret: secret,
        algorithm: entry.algorithm,
        digits: entry.digits,
        period: entry.period,
        type: 'TOTP',
        icon: entry.icon,
        color: entry.color
      };
    });

    res.json({
      version: '1.0',
      type: 'totp-sync-export',
      exportDate: new Date().toISOString(),
      entries: entries
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export entries' });
  }
});

// Export jako URI list
router.get('/export/uri', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT name, issuer, secret_encrypted, algorithm, digits, period
       FROM totp_entries 
       WHERE user_id = $1 AND deleted_at IS NULL
       ORDER BY position ASC, created_at DESC`,
      [req.user.userId]
    );

    const uris = result.rows.map(entry => {
      const secret = decryptSecret(entry.secret_encrypted);
      const label = entry.issuer 
        ? `${encodeURIComponent(entry.issuer)}:${encodeURIComponent(entry.name)}`
        : encodeURIComponent(entry.name);
      
      const params = new URLSearchParams({
        secret: secret,
        issuer: entry.issuer || '',
        algorithm: entry.algorithm,
        digits: entry.digits.toString(),
        period: entry.period.toString()
      });

      return `otpauth://totp/${label}?${params.toString()}`;
    });

    res.json({
      uris: uris,
      count: uris.length
    });
  } catch (error) {
    console.error('Export URI error:', error);
    res.status(500).json({ error: 'Failed to export URIs' });
  }
});

// Import z JSON (FreeOTP+, 2FAuth, własny format)
router.post('/import/json', [
  body('entries').isArray().withMessage('Entries must be an array')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { entries, replaceAll = false } = req.body;
  const imported = [];
  const failed = [];

  try {
    // Jeśli replaceAll, usuń wszystkie obecne wpisy
    if (replaceAll) {
      await db.query(
        'UPDATE totp_entries SET deleted_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND deleted_at IS NULL',
        [req.user.userId]
      );
    }

    // Importuj każdy wpis
    for (const entry of entries) {
      try {
        // Sprawdź wymagane pola
        if (!entry.name || !entry.secret) {
          failed.push({ entry, reason: 'Missing required fields: name or secret' });
          continue;
        }

        const encryptedSecret = encryptSecret(entry.secret);

        const result = await db.query(
          `INSERT INTO totp_entries 
           (user_id, name, issuer, secret_encrypted, algorithm, digits, period, icon, color)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING id, name, issuer`,
          [
            req.user.userId,
            entry.name,
            entry.issuer || '',
            encryptedSecret,
            entry.algorithm || 'SHA1',
            entry.digits || 6,
            entry.period || 30,
            entry.icon || null,
            entry.color || null
          ]
        );

        imported.push(result.rows[0]);
      } catch (err) {
        failed.push({ entry, reason: err.message });
      }
    }

    res.json({
      message: 'Import completed',
      imported: imported.length,
      failed: failed.length,
      details: {
        imported,
        failed
      }
    });
  } catch (error) {
    console.error('Import JSON error:', error);
    res.status(500).json({ error: 'Failed to import entries' });
  }
});

// Import z URI list
router.post('/import/uri', [
  body('uris').isArray().withMessage('URIs must be an array')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { uris } = req.body;
  const imported = [];
  const failed = [];

  try {
    for (const uri of uris) {
      try {
        const parsed = parseOtpAuthUri(uri);
        const encryptedSecret = encryptSecret(parsed.secret);

        const result = await db.query(
          `INSERT INTO totp_entries 
           (user_id, name, issuer, secret_encrypted, algorithm, digits, period)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, name, issuer`,
          [
            req.user.userId,
            parsed.name,
            parsed.issuer,
            encryptedSecret,
            parsed.algorithm,
            parsed.digits,
            parsed.period
          ]
        );

        imported.push(result.rows[0]);
      } catch (err) {
        failed.push({ uri, reason: err.message });
      }
    }

    res.json({
      message: 'Import completed',
      imported: imported.length,
      failed: failed.length,
      details: {
        imported,
        failed
      }
    });
  } catch (error) {
    console.error('Import URI error:', error);
    res.status(500).json({ error: 'Failed to import URIs' });
  }
});

// Synchronizacja - pobierz zmiany od ostatniej synchronizacji
router.post('/pull', [
  body('lastSyncTime').optional().isISO8601(),
  body('deviceId').notEmpty()
], async (req, res) => {
  const { lastSyncTime, deviceId } = req.body;

  try {
    // Pobierz wpisy zmienione po lastSyncTime
    const query = lastSyncTime
      ? `SELECT id, name, issuer, secret_encrypted, algorithm, digits, period, icon, color, position, 
                updated_at, deleted_at
         FROM totp_entries 
         WHERE user_id = $1 AND updated_at > $2
         ORDER BY updated_at ASC`
      : `SELECT id, name, issuer, secret_encrypted, algorithm, digits, period, icon, color, position, 
                updated_at, deleted_at
         FROM totp_entries 
         WHERE user_id = $1 AND deleted_at IS NULL
         ORDER BY position ASC`;

    const params = lastSyncTime ? [req.user.userId, lastSyncTime] : [req.user.userId];
    const result = await db.query(query, params);

    // Deszyfruj sekrety
    const entries = result.rows.map(entry => ({
      ...entry,
      secret: entry.deleted_at ? null : decryptSecret(entry.secret_encrypted),
      secret_encrypted: undefined
    }));

    // Zapisz log synchronizacji
    await db.query(
      'INSERT INTO sync_log (user_id, device_id, sync_type) VALUES ($1, $2, $3)',
      [req.user.userId, deviceId, 'pull']
    );

    res.json({
      entries,
      syncTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Sync pull error:', error);
    res.status(500).json({ error: 'Failed to sync entries' });
  }
});

// Synchronizacja - wyślij lokalne zmiany
router.post('/push', [
  body('entries').isArray(),
  body('deviceId').notEmpty()
], async (req, res) => {
  const { entries, deviceId } = req.body;

  try {
    const updated = [];
    const failed = [];

    for (const entry of entries) {
      try {
        if (entry.deleted_at) {
          // Soft delete
          await db.query(
            'UPDATE totp_entries SET deleted_at = $1 WHERE id = $2 AND user_id = $3',
            [entry.deleted_at, entry.id, req.user.userId]
          );
        } else if (entry.id) {
          // Update istniejącego
          const encryptedSecret = entry.secret ? encryptSecret(entry.secret) : null;
          
          await db.query(
            `UPDATE totp_entries 
             SET name = $1, issuer = $2, secret_encrypted = COALESCE($3, secret_encrypted),
                 algorithm = $4, digits = $5, period = $6, icon = $7, color = $8, 
                 position = $9, updated_at = CURRENT_TIMESTAMP
             WHERE id = $10 AND user_id = $11`,
            [
              entry.name, entry.issuer, encryptedSecret, entry.algorithm,
              entry.digits, entry.period, entry.icon, entry.color, entry.position,
              entry.id, req.user.userId
            ]
          );
        } else {
          // Nowy wpis
          const encryptedSecret = encryptSecret(entry.secret);
          
          const result = await db.query(
            `INSERT INTO totp_entries 
             (user_id, name, issuer, secret_encrypted, algorithm, digits, period, icon, color, position)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING id`,
            [
              req.user.userId, entry.name, entry.issuer, encryptedSecret,
              entry.algorithm, entry.digits, entry.period, entry.icon, entry.color, entry.position
            ]
          );
          
          entry.id = result.rows[0].id;
        }

        updated.push(entry.id);
      } catch (err) {
        failed.push({ entry, reason: err.message });
      }
    }

    // Zapisz log synchronizacji
    await db.query(
      'INSERT INTO sync_log (user_id, device_id, sync_type) VALUES ($1, $2, $3)',
      [req.user.userId, deviceId, 'push']
    );

    res.json({
      message: 'Push completed',
      updated: updated.length,
      failed: failed.length,
      syncTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Sync push error:', error);
    res.status(500).json({ error: 'Failed to push entries' });
  }
});

module.exports = router;
