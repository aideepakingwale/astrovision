// backend/models/index.js
// ─── Data Access Object layer — all DB interactions live here ────────────────

const { getDb } = require('../config/database');
const bcrypt    = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// ══════════════════════════════════════════════════════════════════════════════
// UserModel
// ══════════════════════════════════════════════════════════════════════════════
const UserModel = {
  findById(id) {
    return getDb().prepare('SELECT * FROM users WHERE id = ?').get(id);
  },

  findByUuid(uuid) {
    return getDb().prepare('SELECT * FROM users WHERE uuid = ?').get(uuid);
  },

  findByEmail(email) {
    return getDb().prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  },

  create({ name, email, password, provider = 'email', providerId = null }) {
    const db = getDb();
    const passwordHash = password ? bcrypt.hashSync(password, 12) : null;
    const stmt = db.prepare(`
      INSERT INTO users (name, email, password_hash, provider, provider_id)
      VALUES (?, ?, ?, ?, ?)
    `);
    const info = stmt.run(name, email.toLowerCase(), passwordHash, provider, providerId);

    // Create default subscription (free plan)
    db.prepare(`
      INSERT INTO subscriptions (user_id, plan, credits_total, credits_used)
      VALUES (?, 'free', 5, 0)
    `).run(info.lastInsertRowid);

    return this.findById(info.lastInsertRowid);
  },

  updateLastLogin(id) {
    getDb().prepare(`UPDATE users SET last_login_at = datetime('now') WHERE id = ?`).run(id);
  },

  verifyPassword(plainText, hash) {
    return bcrypt.compareSync(plainText, hash);
  },

  safeData(user) {
    if (!user) return null;
    const { password_hash, ...safe } = user;
    return safe;
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// ProfileModel
// ══════════════════════════════════════════════════════════════════════════════
const ProfileModel = {
  findAllByUser(userId) {
    return getDb().prepare('SELECT * FROM profiles WHERE user_id = ? ORDER BY is_default DESC, id ASC').all(userId);
  },

  findByUuid(uuid, userId) {
    return getDb().prepare('SELECT * FROM profiles WHERE uuid = ? AND user_id = ?').get(uuid, userId);
  },

  findById(id, userId) {
    return getDb().prepare('SELECT * FROM profiles WHERE id = ? AND user_id = ?').get(id, userId);
  },

  create(userId, data) {
    const db = getDb();
    const { name, relation = 'Self', gender = 'Other', date_of_birth, time_of_birth, place_of_birth, latitude, longitude, moon_sign, nakshatra, lagna, is_default = 0 } = data;

    if (is_default) {
      db.prepare('UPDATE profiles SET is_default = 0 WHERE user_id = ?').run(userId);
    }

    const info = db.prepare(`
      INSERT INTO profiles
        (user_id, name, relation, gender, date_of_birth, time_of_birth, place_of_birth, latitude, longitude, moon_sign, nakshatra, lagna, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, name, relation, gender, date_of_birth || null, time_of_birth || null,
           place_of_birth || null, latitude || null, longitude || null,
           moon_sign || null, nakshatra || null, lagna || null, is_default ? 1 : 0);

    return this.findById(info.lastInsertRowid, userId);
  },

  update(uuid, userId, data) {
    const db = getDb();
    const fields = ['name', 'relation', 'gender', 'date_of_birth', 'time_of_birth', 'place_of_birth', 'latitude', 'longitude', 'moon_sign', 'nakshatra', 'lagna'];
    const updates = [];
    const vals    = [];

    for (const f of fields) {
      if (data[f] !== undefined) { updates.push(`${f} = ?`); vals.push(data[f]); }
    }
    if (!updates.length) return this.findByUuid(uuid, userId);

    vals.push(uuid, userId);
    db.prepare(`UPDATE profiles SET ${updates.join(', ')} WHERE uuid = ? AND user_id = ?`).run(...vals);
    return this.findByUuid(uuid, userId);
  },

  delete(uuid, userId) {
    return getDb().prepare('DELETE FROM profiles WHERE uuid = ? AND user_id = ?').run(uuid, userId);
  },

  setDefault(uuid, userId) {
    const db = getDb();
    db.prepare('UPDATE profiles SET is_default = 0 WHERE user_id = ?').run(userId);
    db.prepare('UPDATE profiles SET is_default = 1 WHERE uuid = ? AND user_id = ?').run(uuid, userId);
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// ReportModel
// ══════════════════════════════════════════════════════════════════════════════
const ReportModel = {
  findAllByUser(userId, { type, limit = 20, offset = 0 } = {}) {
    let sql = 'SELECT * FROM reports WHERE user_id = ?';
    const vals = [userId];
    if (type) { sql += ' AND type = ?'; vals.push(type); }
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    vals.push(limit, offset);
    return getDb().prepare(sql).all(...vals);
  },

  countByUser(userId, type) {
    let sql = 'SELECT COUNT(*) as total FROM reports WHERE user_id = ?';
    const vals = [userId];
    if (type) { sql += ' AND type = ?'; vals.push(type); }
    return getDb().prepare(sql).get(...vals)?.total || 0;
  },

  findByUuid(uuid, userId) {
    return getDb().prepare('SELECT * FROM reports WHERE uuid = ? AND user_id = ?').get(uuid, userId);
  },

  create({ userId, profileId, type, title, modelUsed, inputData, reportData, imageKey, tokensUsed = 0, durationMs = 0 }) {
    const db = getDb();
    const info = db.prepare(`
      INSERT INTO reports
        (user_id, profile_id, type, title, model_used, input_data, report_data, image_key, tokens_used, duration_ms)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      profileId || null,
      type,
      title,
      modelUsed,
      inputData ? JSON.stringify(inputData) : null,
      JSON.stringify(reportData),
      imageKey || null,
      tokensUsed,
      durationMs,
    );
    return this.findById(info.lastInsertRowid, userId);
  },

  findById(id, userId) {
    return getDb().prepare('SELECT * FROM reports WHERE id = ? AND user_id = ?').get(id, userId);
  },

  toggleStar(uuid, userId) {
    const db = getDb();
    const r  = this.findByUuid(uuid, userId);
    if (!r) return null;
    db.prepare('UPDATE reports SET is_starred = ? WHERE uuid = ? AND user_id = ?').run(r.is_starred ? 0 : 1, uuid, userId);
    return this.findByUuid(uuid, userId);
  },

  delete(uuid, userId) {
    return getDb().prepare('DELETE FROM reports WHERE uuid = ? AND user_id = ?').run(uuid, userId);
  },

  parseData(report) {
    if (!report) return null;
    return {
      ...report,
      input_data  : report.input_data   ? JSON.parse(report.input_data)  : null,
      report_data : report.report_data  ? JSON.parse(report.report_data) : null,
    };
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// SubscriptionModel
// ══════════════════════════════════════════════════════════════════════════════
const SubscriptionModel = {
  findByUser(userId) {
    return getDb().prepare('SELECT * FROM subscriptions WHERE user_id = ?').get(userId);
  },

  hasCredits(userId) {
    const sub = this.findByUser(userId);
    if (!sub) return false;
    if (sub.credits_total === -1) return true; // Unlimited (Cosmic plan)
    return sub.credits_used < sub.credits_total;
  },

  deductCredit(userId) {
    getDb().prepare(`
      UPDATE subscriptions SET credits_used = credits_used + 1 WHERE user_id = ? AND credits_total != -1
    `).run(userId);
  },

  creditsRemaining(userId) {
    const sub = this.findByUser(userId);
    if (!sub) return 0;
    if (sub.credits_total === -1) return Infinity;
    return Math.max(0, sub.credits_total - sub.credits_used);
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// SessionModel
// ══════════════════════════════════════════════════════════════════════════════
const SessionModel = {
  create(userId, refreshToken, deviceInfo, expiresAt) {
    return getDb().prepare(`
      INSERT INTO user_sessions (user_id, refresh_token, device_info, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(userId, refreshToken, JSON.stringify(deviceInfo || {}), expiresAt);
  },

  findByToken(token) {
    return getDb().prepare(`
      SELECT * FROM user_sessions WHERE refresh_token = ? AND revoked = 0
    `).get(token);
  },

  revoke(token) {
    return getDb().prepare('UPDATE user_sessions SET revoked = 1 WHERE refresh_token = ?').run(token);
  },

  revokeAll(userId) {
    return getDb().prepare('UPDATE user_sessions SET revoked = 1 WHERE user_id = ?').run(userId);
  },
};

module.exports = { UserModel, ProfileModel, ReportModel, SubscriptionModel, SessionModel };
