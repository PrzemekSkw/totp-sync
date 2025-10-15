const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticator } = require('otplib');
const { encryptSecret, decryptSecret } = require('../services/crypto');
const { authenticateToken } = require('../middleware/auth');
const db = require('../services/database');

const router = express.Router();

// Wszystkie route'y wymagają autoryzacji
router.use(authenticateToken);

// Pobierz wszystkie wpisy użytkownika
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, issuer, algorithm, digits, period, icon, color, position, created_at, updated_at
       FROM totp_entries 
       WHERE user_id = $1 AND deleted_at IS NULL
       ORDER BY position ASC, created_at DESC`,
      [req.user.userId]
    );

    res.json({ entries: result.rows });
  } catch (error) {
    console.error('Get entries error:', error);
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

// Pobierz pojedynczy wpis
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, issuer, algorithm, digits, period, icon, color, position, created_at, updated_at
       FROM totp_entries 
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [req.params.id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    res.json({ entry: result.rows[0] });
  } catch (error) {
    console.error('Get entry error:', error);
    res.status(500).json({ error: 'Failed to fetch entry' });
  }
});

// Dodaj nowy wpis
router.post('/', [
  body('name').notEmpty().trim(),
  body('secret').notEmpty().trim(),
  body('issuer').optional().trim(),
  body('algorithm').optional().isIn(['SHA1', 'SHA256', 'SHA512']),
  body('digits').optional().isInt({ min: 6, max: 8 }),
  body('period').optional().isInt({ min: 15, max: 120 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    name,
    secret,
    issuer = '',
    algorithm = 'SHA1',
    digits = 6,
    period = 30,
    icon = null,
    color = null,
    position = 0
  } = req.body;

  try {
    // Zaszyfruj sekret
    const encryptedSecret = encryptSecret(secret);

    // Dodaj do bazy
    const result = await db.query(
      `INSERT INTO totp_entries 
       (user_id, name, issuer, secret_encrypted, algorithm, digits, period, icon, color, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, name, issuer, algorithm, digits, period, icon, color, position, created_at`,
      [req.user.userId, name, issuer, encryptedSecret, algorithm, digits, period, icon, color, position]
    );

    res.status(201).json({
      message: 'Entry created successfully',
      entry: result.rows[0]
    });
  } catch (error) {
    console.error('Create entry error:', error);
    res.status(500).json({ error: 'Failed to create entry' });
  }
});

// Aktualizuj wpis
router.put('/:id', [
  body('name').optional().trim(),
  body('issuer').optional().trim(),
  body('icon').optional(),
  body('color').optional(),
  body('position').optional().isInt()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, issuer, icon, color, position } = req.body;
  const updates = [];
  const values = [];
  let paramCount = 1;

  if (name !== undefined) {
    updates.push(`name = $${paramCount++}`);
    values.push(name);
  }
  if (issuer !== undefined) {
    updates.push(`issuer = $${paramCount++}`);
    values.push(issuer);
  }
  if (icon !== undefined) {
    updates.push(`icon = $${paramCount++}`);
    values.push(icon);
  }
  if (color !== undefined) {
    updates.push(`color = $${paramCount++}`);
    values.push(color);
  }
  if (position !== undefined) {
    updates.push(`position = $${paramCount++}`);
    values.push(position);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(req.params.id, req.user.userId);

  try {
    const result = await db.query(
      `UPDATE totp_entries SET ${updates.join(', ')}
       WHERE id = $${paramCount} AND user_id = $${paramCount + 1} AND deleted_at IS NULL
       RETURNING id, name, issuer, algorithm, digits, period, icon, color, position, updated_at`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    res.json({
      message: 'Entry updated successfully',
      entry: result.rows[0]
    });
  } catch (error) {
    console.error('Update entry error:', error);
    res.status(500).json({ error: 'Failed to update entry' });
  }
});

// Usuń wpis (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query(
      `UPDATE totp_entries 
       SET deleted_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
       RETURNING id`,
      [req.params.id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    res.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    console.error('Delete entry error:', error);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

// Generuj kod TOTP dla wpisu
router.get('/:id/generate', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT secret_encrypted, algorithm, digits, period
       FROM totp_entries 
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [req.params.id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    const entry = result.rows[0];
    const secret = decryptSecret(entry.secret_encrypted);

    // Konfiguruj otplib
    authenticator.options = {
      algorithm: entry.algorithm.toLowerCase(),
      digits: entry.digits,
      step: entry.period
    };

    const token = authenticator.generate(secret);
    const timeRemaining = entry.period - (Math.floor(Date.now() / 1000) % entry.period);

    res.json({
      token,
      timeRemaining,
      period: entry.period
    });
  } catch (error) {
    console.error('Generate token error:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

module.exports = router;
