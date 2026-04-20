-- ============================================================
--  AstroVision · Database Schema  (SQLite / PostgreSQL compat)
--  Version: 1.0   Engine: SQLite WAL mode
-- ============================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ────────────────────────────────────────────────────────────
--  TABLE: users
--  Core authentication & account record
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid          TEXT    NOT NULL UNIQUE DEFAULT (lower(hex(randomblob(16)))),
  name          TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT,                         -- NULL for SSO-only accounts
  provider      TEXT    NOT NULL DEFAULT 'email', -- email | google | apple
  provider_id   TEXT,                         -- OAuth provider user ID
  avatar_url    TEXT,
  role          TEXT    NOT NULL DEFAULT 'user',  -- user | admin
  is_verified   INTEGER NOT NULL DEFAULT 0,
  last_login_at TEXT,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email    ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_uuid     ON users(uuid);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider, provider_id);

-- ────────────────────────────────────────────────────────────
--  TABLE: user_sessions
--  JWT refresh token store & session tracking
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_sessions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token TEXT    NOT NULL UNIQUE,
  device_info   TEXT,                         -- JSON: { ua, ip, platform }
  expires_at    TEXT    NOT NULL,
  revoked       INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token   ON user_sessions(refresh_token);

-- ────────────────────────────────────────────────────────────
--  TABLE: profiles
--  A user can have multiple astrological profiles (self, family)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid          TEXT    NOT NULL UNIQUE DEFAULT (lower(hex(randomblob(16)))),
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          TEXT    NOT NULL,
  relation      TEXT    NOT NULL DEFAULT 'Self',  -- Self | Spouse | Child | Parent | Friend
  gender        TEXT    NOT NULL DEFAULT 'Other', -- Male | Female | Other
  date_of_birth TEXT,                         -- ISO date: YYYY-MM-DD
  time_of_birth TEXT,                         -- HH:MM (24h), nullable
  place_of_birth TEXT,
  latitude      REAL,
  longitude     REAL,
  moon_sign     TEXT,
  nakshatra     TEXT,
  lagna         TEXT,
  is_default    INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_uuid    ON profiles(uuid);

-- ────────────────────────────────────────────────────────────
--  TABLE: reports
--  Stores every generated palm / kundali report
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid          TEXT    NOT NULL UNIQUE DEFAULT (lower(hex(randomblob(16)))),
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id    INTEGER REFERENCES profiles(id) ON DELETE SET NULL,
  type          TEXT    NOT NULL,             -- palm | kundali
  title         TEXT    NOT NULL,
  model_used    TEXT    NOT NULL,             -- claude-sonnet-* | claude-haiku-*
  input_data    TEXT,                         -- JSON: form inputs / image metadata
  report_data   TEXT    NOT NULL,             -- JSON: full AI response
  image_key     TEXT,                         -- Cloudflare R2 / S3 object key
  tokens_used   INTEGER DEFAULT 0,
  duration_ms   INTEGER DEFAULT 0,
  is_starred    INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reports_user_id    ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_profile_id ON reports(profile_id);
CREATE INDEX IF NOT EXISTS idx_reports_type       ON reports(type);
CREATE INDEX IF NOT EXISTS idx_reports_uuid       ON reports(uuid);

-- ────────────────────────────────────────────────────────────
--  TABLE: daily_transits
--  Cached daily cosmic readings (keyed by date + moon_sign)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_transits (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  transit_date  TEXT    NOT NULL,             -- YYYY-MM-DD
  moon_sign     TEXT    NOT NULL,
  model_used    TEXT    NOT NULL,
  transit_data  TEXT    NOT NULL,             -- JSON: full AI response
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(transit_date, moon_sign)
);

CREATE INDEX IF NOT EXISTS idx_transits_date_sign ON daily_transits(transit_date, moon_sign);

-- ────────────────────────────────────────────────────────────
--  TABLE: remedies
--  Cached remedy suggestions (keyed by lagna + issues hash)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS remedies (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  lagna         TEXT    NOT NULL,
  issues_hash   TEXT    NOT NULL,             -- MD5/SHA of sorted issues array
  issues        TEXT    NOT NULL,             -- JSON array of issue strings
  model_used    TEXT    NOT NULL,
  remedy_data   TEXT    NOT NULL,             -- JSON: full AI response
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(lagna, issues_hash)
);

-- ────────────────────────────────────────────────────────────
--  TABLE: ai_usage_logs
--  Audit trail for every AI API call (billing, rate-limiting)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  feature       TEXT    NOT NULL,             -- palm | kundali | transit | remedy
  model         TEXT    NOT NULL,
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens  INTEGER NOT NULL DEFAULT 0,
  duration_ms   INTEGER NOT NULL DEFAULT 0,
  success       INTEGER NOT NULL DEFAULT 1,
  error_code    TEXT,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ai_logs_user_id    ON ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_feature    ON ai_usage_logs(feature);
CREATE INDEX IF NOT EXISTS idx_ai_logs_created_at ON ai_usage_logs(created_at);

-- ────────────────────────────────────────────────────────────
--  TABLE: subscriptions
--  Track user plan & credits (future billing)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  plan            TEXT    NOT NULL DEFAULT 'free', -- free | lite | pro | cosmic
  credits_total   INTEGER NOT NULL DEFAULT 5,
  credits_used    INTEGER NOT NULL DEFAULT 0,
  plan_started_at TEXT,
  plan_expires_at TEXT,
  stripe_customer_id    TEXT,
  stripe_subscription_id TEXT,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ────────────────────────────────────────────────────────────
--  TABLE: notifications
--  In-app notification queue
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          TEXT    NOT NULL,             -- transit | report_ready | system
  title         TEXT    NOT NULL,
  body          TEXT    NOT NULL,
  data          TEXT,                         -- JSON extra payload
  is_read       INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- ────────────────────────────────────────────────────────────
--  TRIGGERS: auto-update updated_at
-- ────────────────────────────────────────────────────────────
CREATE TRIGGER IF NOT EXISTS trg_users_updated
  AFTER UPDATE ON users
  BEGIN UPDATE users SET updated_at = datetime('now') WHERE id = NEW.id; END;

CREATE TRIGGER IF NOT EXISTS trg_profiles_updated
  AFTER UPDATE ON profiles
  BEGIN UPDATE profiles SET updated_at = datetime('now') WHERE id = NEW.id; END;

CREATE TRIGGER IF NOT EXISTS trg_subscriptions_updated
  AFTER UPDATE ON subscriptions
  BEGIN UPDATE subscriptions SET updated_at = datetime('now') WHERE id = NEW.id; END;

-- ────────────────────────────────────────────────────────────
--  SEED: default data
-- ────────────────────────────────────────────────────────────
-- (run separately via db:seed script)
