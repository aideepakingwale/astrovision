// backend/services/TransitService.js
// ─── Daily transit & remedy advisor — uses Groq Llama 3.1 8B (free, fast) ───
// Both results are cached in SQLite so AI is called at most once per sign/day.

const { callTextAI }      = require('./AIService');
const { getDb }           = require('../config/database');
const { FEATURES, MODELS }= require('../../shared/constants');
const crypto              = require('crypto');

// ── Daily Transit ─────────────────────────────────────────────────────────────

/**
 * Get today's cosmic reading for a given moon sign.
 * Caches in DB for the current date (shared across all users with same moon sign).
 */
async function getDailyTransit({ moonSign = 'Taurus', userId = null }) {
  const db          = getDb();
  const today       = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const normalised  = moonSign.trim();

  // Cache hit
  const cached = db.prepare(`
    SELECT transit_data FROM daily_transits
    WHERE transit_date = ? AND moon_sign = ?
  `).get(today, normalised);

  if (cached) return JSON.parse(cached.transit_data);

  // Generate new
  const todayFull = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const { provider, model, data: result } = await callTextAI({
    prompt       : `Today is ${todayFull}. Moon sign: ${normalised}.
Write an inspiring, accurate daily cosmic reading.
Return JSON:
{
  "message":        "2 vivid, poetic sentences about today's planetary energy and how it affects this moon sign",
  "moon_phase":     "Current moon phase (e.g. Waxing Gibbous)",
  "ruling_planet":  "Today's ruling planet name",
  "power_color":    "An evocative color name",
  "lucky_number":   7,
  "affirmation":    "Short empowering affirmation (max 12 words)",
  "avoid":          "One concise thing to avoid today",
  "best_time":      "Best time window for important actions today"
}`,
    systemPrompt : 'You are a Vedic astrologer. Return ONLY valid JSON — no markdown, no prose outside the JSON.',
    preferSpeed  : true,   // Groq 8B is fast and sufficient for daily transit
    feature      : FEATURES.TRANSIT,
    maxTokens    : 400,
    userId,
  });

  // Persist to cache — model_used records which provider actually served this
  db.prepare(`
    INSERT OR REPLACE INTO daily_transits (transit_date, moon_sign, model_used, transit_data)
    VALUES (?, ?, ?, ?)
  `).run(today, normalised, `${provider}/${model}`, JSON.stringify(result));

  return result;
}

// ── Remedy Advisor ────────────────────────────────────────────────────────────

/**
 * Get personalised Vedic remedies for a set of life issues.
 * Caches by lagna + sorted issues hash.
 */
async function getRemedies({ lagna = 'Scorpio', issues = [], userId = null }) {
  const db = getDb();
  const sortedIssues = [...new Set(issues)].sort();
  const issuesHash   = crypto.createHash('md5').update(sortedIssues.join('|')).digest('hex');
  const issueList    = sortedIssues.length ? sortedIssues.join(', ') : 'General wellbeing';

  // Cache hit
  const cached = db.prepare(`
    SELECT remedy_data FROM remedies WHERE lagna = ? AND issues_hash = ?
  `).get(lagna, issuesHash);

  if (cached) return JSON.parse(cached.remedy_data);

  const { provider, model, data: result } = await callTextAI({
    prompt       : `Lagna: ${lagna}. Life challenges: ${issueList}.
Provide 3 highly specific, actionable Vedic remedies.
Return JSON:
{
  "remedies": [
    { "title": "...", "description": "Detailed, specific instructions", "day": "Monday|Tuesday|...|Daily", "duration": "40 days|Ongoing|..." },
    { "title": "...", "description": "...", "day": "...", "duration": "..." },
    { "title": "...", "description": "...", "day": "...", "duration": "..." }
  ],
  "mantra":    "Mantra with Sanskrit and transliteration",
  "gemstone":  "Specific gemstone recommendation with finger and metal",
  "yantra":    "Relevant yantra with brief use instruction"
}`,
    systemPrompt : 'You are a Vedic remedy specialist (jyotish upaya). Return ONLY valid JSON.',
    preferSpeed  : true,   // Groq 8B is sufficient for remedies
    feature      : FEATURES.REMEDY,
    maxTokens    : 600,
    userId,
  });

  // Persist to cache
  db.prepare(`
    INSERT OR REPLACE INTO remedies (lagna, issues_hash, issues, model_used, remedy_data)
    VALUES (?, ?, ?, ?, ?)
  `).run(lagna, issuesHash, JSON.stringify(sortedIssues), `${provider}/${model}`, JSON.stringify(result));

  return result;
}

module.exports = { getDailyTransit, getRemedies };
