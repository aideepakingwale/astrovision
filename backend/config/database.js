// backend/config/database.js
// ─── Database connection — Turso LibSQL (cloud) or SQLite (local dev) ────────
//
// Production : TURSO_DATABASE_URL + TURSO_AUTH_TOKEN  → Turso LibSQL (free cloud)
// Development: DB_PATH env var or ./data/astrovision.db → local SQLite via better-sqlite3
//
// The LibSQL client uses an async API; better-sqlite3 is synchronous.
// All queries in this file return Promises so both modes are compatible.

const path = require('path');
const fs   = require('fs');

let _db     = null;
let _isLibSQL = false;

// ── Connection factory ────────────────────────────────────────────────────────

function getDb() {
  if (_db) return _db;

  if (process.env.TURSO_DATABASE_URL) {
    // ── Turso LibSQL (production — free cloud database) ───────────────────
    const { createClient } = require('@libsql/client');
    _db = createClient({
      url      : process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    _isLibSQL = true;
    console.log('[DB] Connected → Turso LibSQL:', process.env.TURSO_DATABASE_URL);
  } else {
    // ── Local SQLite (development) ─────────────────────────────────────────
    const Database = require('better-sqlite3');
    const DB_PATH  = process.env.DB_PATH || path.resolve(__dirname, '../data/astrovision.db');
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

    _db = new Database(DB_PATH, {
      verbose: process.env.NODE_ENV === 'development' ? console.log : null,
    });
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    _db.pragma('synchronous = NORMAL');
    _db.pragma('cache_size = -20000');
    _db.pragma('temp_store = MEMORY');

    // Wrap better-sqlite3 in an async-compatible shim so services can use
    // a single await db.execute() pattern regardless of environment.
    _db = _wrapSqlite(_db);
    _isLibSQL = false;
    console.log('[DB] Connected → SQLite:', DB_PATH);
  }

  _initSchema();
  return _db;
}

// ── Async shim around better-sqlite3 ─────────────────────────────────────────
// Gives better-sqlite3 the same .execute() interface as @libsql/client so
// all service code can use a single await db.execute({ sql, args }) pattern.

function _wrapSqlite(raw) {
  return {
    _raw: raw,
    async execute({ sql, args = [] }) {
      const stmt = raw.prepare(sql);
      // Detect SELECT vs mutation
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        const rows = stmt.all(...args);
        return { rows };
      } else {
        const info = stmt.run(...args);
        return { rows: [], rowsAffected: info.changes, lastInsertRowid: info.lastInsertRowid };
      }
    },
    async batch(statements) {
      const results = [];
      const tx = raw.transaction(() => {
        for (const { sql, args = [] } of statements) {
          const stmt = raw.prepare(sql);
          results.push(stmt.run(...args));
        }
      });
      tx();
      return results;
    },
    exec(sql) { raw.exec(sql); },          // for schema init
    close()   { raw.close(); },
  };
}

// ── Schema initialisation ─────────────────────────────────────────────────────

async function _initSchema() {
  const schemaPath = path.resolve(__dirname, '../schema/schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.warn('[DB] schema.sql not found — skipping init');
    return;
  }
  const sql = fs.readFileSync(schemaPath, 'utf8');
  try {
    if (_isLibSQL) {
      // LibSQL executes multi-statement SQL in one call
      await _db.executeMultiple(sql);
    } else {
      _db.exec(sql);
    }
    console.log('[DB] Schema initialised');
  } catch (e) {
    // Tables already exist — safe to ignore IF NOT EXISTS warnings
    if (!e.message.includes('already exists')) {
      console.error('[DB] Schema init error:', e.message);
    }
  }
}

// ── Graceful shutdown ─────────────────────────────────────────────────────────

process.on('exit',   () => { if (_db?.close) _db.close(); });
process.on('SIGINT',  () => { if (_db?.close) _db.close(); process.exit(0); });
process.on('SIGTERM', () => { if (_db?.close) _db.close(); process.exit(0); });

module.exports = { getDb };

