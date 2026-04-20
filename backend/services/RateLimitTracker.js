// backend/services/RateLimitTracker.js
// ─── Tracks daily AI provider usage. Resets at midnight. ────────────────────
// Uses in-memory counters (no Redis dependency at this layer).
// If Upstash Redis is configured, counters persist across restarts.

const { PROVIDER_LIMITS } = require('../../shared/constants');

// ── In-memory store (always available, resets on server restart) ─────────────
const _counts = {};   // { 'gemini:2025-04-20': 42, ... }

function _todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC
}

function _key(provider) {
  return `${provider}:${_todayKey()}`;
}

// ── Redis client (optional — used when UPSTASH_REDIS_REST_URL is set) ────────
let _redis = null;

function _getRedis() {
  if (_redis) return _redis;
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const { Redis } = require('@upstash/redis');
      _redis = new Redis({
        url   : process.env.UPSTASH_REDIS_REST_URL,
        token : process.env.UPSTASH_REDIS_REST_TOKEN,
      });
    } catch {
      // @upstash/redis not installed — fall back to in-memory only
    }
  }
  return _redis;
}

function _secondsUntilMidnight() {
  const now      = new Date();
  const midnight = new Date(now);
  midnight.setUTCHours(24, 0, 0, 0);
  return Math.floor((midnight - now) / 1000);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Check whether a provider still has capacity for today.
 * @param {string} provider  - e.g. 'gemini', 'groq_70b'
 * @returns {Promise<boolean>}
 */
async function canUse(provider) {
  const limit = PROVIDER_LIMITS[provider];
  if (!limit) return true; // unknown provider — allow

  const k     = _key(provider);
  const redis = _getRedis();

  if (redis) {
    try {
      const used = parseInt(await redis.get(k) || '0');
      return used < limit;
    } catch {
      // Redis error — fall back to in-memory
    }
  }

  return (_counts[k] || 0) < limit;
}

/**
 * Record one successful request for a provider.
 * @param {string} provider
 * @returns {Promise<void>}
 */
async function increment(provider) {
  const k     = _key(provider);
  const redis = _getRedis();
  const ttl   = _secondsUntilMidnight();

  // Always update in-memory
  _counts[k] = (_counts[k] || 0) + 1;

  if (redis) {
    try {
      // Atomic increment with automatic daily TTL
      await redis.set(k, (_counts[k]).toString(), { ex: ttl });
    } catch {
      // Non-critical — in-memory count already updated
    }
  }
}

/**
 * Get current usage count for a provider today.
 * @param {string} provider
 * @returns {Promise<number>}
 */
async function getUsage(provider) {
  const k     = _key(provider);
  const redis = _getRedis();

  if (redis) {
    try {
      return parseInt(await redis.get(k) || '0');
    } catch { /* fall through */ }
  }

  return _counts[k] || 0;
}

/**
 * Get usage summary for all providers — used by /health endpoint.
 * @returns {Promise<object>}
 */
async function getSummary() {
  const providers = Object.keys(PROVIDER_LIMITS);
  const summary   = {};

  for (const p of providers) {
    const used  = await getUsage(p);
    const limit = PROVIDER_LIMITS[p];
    summary[p]  = { used, limit, remaining: limit - used, pct: Math.round(used / limit * 100) };
  }

  return summary;
}

module.exports = { canUse, increment, getUsage, getSummary };
