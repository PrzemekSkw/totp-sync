const Database = require('better-sqlite3');
const path = require('path');

// Path to SQLite database
const SQLITE_PATH = process.env.SQLITE_PATH || '/data/totp-sync.db';

let db = null;

// Initialize connection
const initConnection = () => {
  if (!db) {
    db = new Database(SQLITE_PATH, { verbose: console.log });
    db.pragma('foreign_keys = ON');
    console.log('✅ Database connected (SQLite)');
  }
  return db;
};

const getConnection = () => {
  if (!db) {
    initConnection();
  }
  return db;
};

// Adapter query - compatible with PostgreSQL API
const query = async (sql, params = []) => {
  try {
    const db = getConnection();
    
    // Convert PostgreSQL placeholders ($1, $2) to SQLite (?)
    let sqliteSql = sql;
    let sqliteParams = params;
    
    // Serialize arrays to JSON for SQLite
    sqliteParams = params.map(param => {
      if (Array.isArray(param)) {
        return JSON.stringify(param);
      }
      return param;
    });
    
    // If there are parameters and SQL contains $1, $2 etc.
    if (params && params.length > 0 && sql.includes('$')) {
      // Replace all $1, $2, $3... with ?
      sqliteSql = sql.replace(/\$\d+/g, '?');
    }
    
    console.log(sqliteSql); // Debug
    
    // INSERT with RETURNING
    if (sqliteSql.trim().toUpperCase().startsWith('INSERT') && sqliteSql.includes('RETURNING')) {
      // SQLite doesn't support RETURNING
      const insertSql = sqliteSql.split('RETURNING')[0].trim();
      const stmt = db.prepare(insertSql);
      const info = stmt.run(...sqliteParams);
      
      // Get inserted record
      const selectSql = `SELECT * FROM users WHERE id = ?`;
      let row = db.prepare(selectSql).get(info.lastInsertRowid);
      
      // Deserialize JSON back to arrays
      if (row && row.backup_codes) {
        try {
          row.backup_codes = JSON.parse(row.backup_codes);
        } catch (e) {
          // Already an array or null
        }
      }
      
      return { rows: [row] };
    }
    
    // UPDATE/DELETE with RETURNING
    if ((sqliteSql.trim().toUpperCase().startsWith('UPDATE') ||
         sqliteSql.trim().toUpperCase().startsWith('DELETE')) && 
        sqliteSql.includes('RETURNING')) {
      // SQLite doesn't support RETURNING - remove and return dummy row
      const mainSql = sqliteSql.split('RETURNING')[0].trim();
      const stmt = db.prepare(mainSql);
      const info = stmt.run(...sqliteParams);
      
      // Return dummy row if something was changed
      if (info.changes > 0) {
        return { rows: [{ id: sqliteParams[0] }], rowCount: info.changes };
      }
      return { rows: [], rowCount: 0 };
    }
    
    // INSERT/UPDATE/DELETE without RETURNING
    if (sqliteSql.trim().toUpperCase().startsWith('INSERT') ||
        sqliteSql.trim().toUpperCase().startsWith('UPDATE') ||
        sqliteSql.trim().toUpperCase().startsWith('DELETE')) {
      const stmt = db.prepare(sqliteSql);
      const info = stmt.run(...sqliteParams);
      return { 
        rows: [], 
        rowCount: info.changes,
        lastInsertRowid: info.lastInsertRowid 
      };
    }
    
    // SELECT
    const stmt = db.prepare(sqliteSql);
    let rows = stmt.all(...sqliteParams);
    
    // Deserialize JSON back to arrays
    rows = rows.map(row => {
      if (row.backup_codes && typeof row.backup_codes === 'string') {
        try {
          row.backup_codes = JSON.parse(row.backup_codes);
        } catch (e) {
          // Leave as string
        }
      }
      return row;
    });
    
    return { rows, rowCount: rows.length };
    
  } catch (error) {
    console.error('SQLite query error:', error);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw error;
  }
};

// Initialize database (create tables)
const initDatabase = async () => {
  const db = getConnection();

  // Begin transaction
  db.exec('BEGIN TRANSACTION');

  try {
    // Users table (SQLite uses INTEGER PRIMARY KEY AUTOINCREMENT instead of SERIAL)
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        totp_secret_encrypted TEXT,
        totp_enabled INTEGER DEFAULT 0,
        backup_codes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // TOTP entries table
    db.exec(`
      CREATE TABLE IF NOT EXISTS totp_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        issuer TEXT,
        secret_encrypted TEXT NOT NULL,
        algorithm TEXT DEFAULT 'SHA1',
        digits INTEGER DEFAULT 6,
        period INTEGER DEFAULT 30,
        icon TEXT,
        color TEXT,
        position INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        deleted_at DATETIME NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Indexes
    db.exec('CREATE INDEX IF NOT EXISTS idx_totp_user_id ON totp_entries(user_id);');
    db.exec('CREATE INDEX IF NOT EXISTS idx_totp_deleted ON totp_entries(deleted_at);');

    // Sync log table
    db.exec(`
      CREATE TABLE IF NOT EXISTS sync_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        device_id TEXT NOT NULL,
        sync_type TEXT NOT NULL,
        synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // WebAuthn credentials table
    db.exec(`
      CREATE TABLE IF NOT EXISTS webauthn_credentials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        credential_id TEXT UNIQUE NOT NULL,
        public_key TEXT NOT NULL,
        counter INTEGER DEFAULT 0,
        name TEXT,
        transports TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_used_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Indexes for WebAuthn credentials
    db.exec('CREATE INDEX IF NOT EXISTS idx_webauthn_user_id ON webauthn_credentials(user_id);');
    db.exec('CREATE INDEX IF NOT EXISTS idx_webauthn_credential_id ON webauthn_credentials(credential_id);');

    db.exec('COMMIT');
    console.log('✅ Database tables initialized (SQLite)');
  } catch (error) {
    db.exec('ROLLBACK');
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// Mock pool for PostgreSQL compatibility
const pool = {
  connect: async () => {
    return {
      query,
      release: () => {}
    };
  },
  on: (event, callback) => {
    // Mock event handlers
  }
};

module.exports = {
  query,
  pool,
  initDatabase
};
