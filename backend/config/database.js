// backend/config/database.js
// ─── SQLite database connection (better-sqlite3, synchronous API) ───────────

const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');

const DB_PATH = process.env.DB_PATH || path.resolve(__dirname, '../data/astrovision.db');

// Ensure data directory exists
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

let _db = null;

/**
 * Returns a singleton database connection.
 * better-sqlite3 is synchronous and thread-safe within a single process.
 */
function getDb() {
  if (_db) return _db;

  _db = new Database(DB_PATH, {
    verbose: process.env.NODE_ENV === 'development' ? console.log : null,
  });

  // Performance pragmas
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  _db.pragma('synchronous = NORMAL');
  _db.pragma('cache_size = -20000');   // 20 MB cache
  _db.pragma('temp_store = MEMORY');

  // Run schema on first connect
  initSchema(_db);

  console.log(`[DB] Connected → ${DB_PATH}`);
  return _db;
}

/**
 * Execute schema.sql to create tables (idempotent — uses IF NOT EXISTS).
 */
function initSchema(db) {
  const schemaPath = path.resolve(__dirname, '../schema/schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.warn('[DB] schema.sql not found, skipping init');
    return;
  }
  const sql = fs.readFileSync(schemaPath, 'utf8');
  // Execute statements split by double-newline (avoids trigger parsing issues)
  db.exec(sql);
  console.log('[DB] Schema initialised');
}

/**
 * Graceful shutdown — close DB when process exits.
 */
process.on('exit', () => { if (_db) _db.close(); });
process.on('SIGINT',  () => { if (_db) _db.close(); process.exit(0); });
process.on('SIGTERM', () => { if (_db) _db.close(); process.exit(0); });

module.exports = { getDb };
