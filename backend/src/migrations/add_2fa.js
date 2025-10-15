const db = require('../services/database');

const migrate = async () => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');

    // Dodaj kolumny 2FA do tabeli users
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS totp_secret_encrypted TEXT,
      ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS backup_codes TEXT[]
    `);

    console.log('✅ 2FA migration completed');
    
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ 2FA migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { migrate };
