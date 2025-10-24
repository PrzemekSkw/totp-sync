const Database = require('better-sqlite3');
const path = require('path');

// Ścieżka do bazy danych SQLite
const SQLITE_PATH = process.env.SQLITE_PATH || '/data/totp-sync.db';

let db = null;

// Inicjalizacja połączenia
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

// Adapter query - kompatybilny z PostgreSQL API
const query = async (sql, params = []) => {
  try {
    const db = getConnection();
    
    // Konwertuj PostgreSQL placeholders ($1, $2) na SQLite (?)
    let sqliteSql = sql;
    let sqliteParams = params;
    
    // Serializuj tablice do JSON dla SQLite
    sqliteParams = params.map(param => {
      if (Array.isArray(param)) {
        return JSON.stringify(param);
      }
      return param;
    });
    
    // Jeśli są parametry i SQL zawiera $1, $2 itd.
    if (params && params.length > 0 && sql.includes('$')) {
      // Zamień wszystkie $1, $2, $3... na ?
      sqliteSql = sql.replace(/\$\d+/g, '?');
    }
    
    console.log(sqliteSql); // Debug
    
    // INSERT/UPDATE/DELETE z RETURNING
    if (sqliteSql.trim().toUpperCase().startsWith('INSERT') && sqliteSql.includes('RETURNING')) {
      // SQLite nie obsługuje RETURNING
      const insertSql = sqliteSql.split('RETURNING')[0].trim();
      const stmt = db.prepare(insertSql);
      const info = stmt.run(...sqliteParams);
      
      // Pobierz wstawiony rekord
      const selectSql = `SELECT * FROM users WHERE id = ?`;
      let row = db.prepare(selectSql).get(info.lastInsertRowid);
      
      // Deserializuj JSON z powrotem do tablic
      if (row && row.backup_codes) {
        try {
          row.backup_codes = JSON.parse(row.backup_codes);
        } catch (e) {
          // Już jest tablicą lub null
        }
      }
      
      return { rows: [row] };
    }
    
    // INSERT/UPDATE/DELETE bez RETURNING
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
    
    // Deserializuj JSON z powrotem do tablic
    rows = rows.map(row => {
      if (row.backup_codes && typeof row.backup_codes === 'string') {
        try {
          row.backup_codes = JSON.parse(row.backup_codes);
        } catch (e) {
          // Pozostaw jako string
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

// Inicjalizacja bazy danych (tworzenie tabel)
const initDatabase = async () => {
  const db = getConnection();

  // Rozpocznij transakcję
  db.exec('BEGIN TRANSACTION');

  try {
    // Tabela users (SQLite używa INTEGER PRIMARY KEY AUTOINCREMENT zamiast SERIAL)
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

    // Tabela totp_entries
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

    // Indeksy
    db.exec('CREATE INDEX IF NOT EXISTS idx_totp_user_id ON totp_entries(user_id);');
    db.exec('CREATE INDEX IF NOT EXISTS idx_totp_deleted ON totp_entries(deleted_at);');

    // Tabela sync_log
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

    db.exec('COMMIT');
    console.log('✅ Database tables initialized (SQLite)');
  } catch (error) {
    db.exec('ROLLBACK');
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// Mock pool dla kompatybilności z PostgreSQL
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
