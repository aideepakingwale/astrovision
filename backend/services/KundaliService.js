// backend/services/KundaliService.js
// ─── Kundali / Birth Chart generation (claude-sonnet, complex reasoning) ─────

const { withSonnet }        = require('./AIService');
const { FEATURES }          = require('../../shared/constants');

const SYSTEM_PROMPT = `You are Pandit Vikram Sharma, a Jyotish Acharya with 35 years of practice in Parashari and Jaimini astrology. You specialise in precise Lagna chart construction, accurate Vimshottari Dasha calculations, and detailed life-domain predictions. Your readings are scholarly yet accessible.

CRITICAL: Return ONLY valid, parseable JSON — no markdown, no prose outside the JSON object. Every field must be populated — never return null or empty strings for analysis fields.`;

/**
 * Generate a full Vedic birth chart analysis.
 * @param {object} opts
 * @param {string}  opts.name
 * @param {string}  opts.dob          - YYYY-MM-DD
 * @param {string}  [opts.tob]        - HH:MM (24h)
 * @param {string}  opts.pob          - place name
 * @param {number}  [opts.latitude]
 * @param {number}  [opts.longitude]
 * @param {number}  [opts.userId]
 * @returns {Promise<object>}
 */
async function generateKundali({ name, dob, tob, pob, latitude, longitude, userId = null }) {
  const prompt = buildKundaliPrompt({ name, dob, tob, pob, latitude, longitude });

  return withSonnet({
    feature  : FEATURES.KUNDALI,
    system   : SYSTEM_PROMPT,
    messages : [{ role: 'user', content: prompt }],
    maxTokens: 3200,
    userId,
  });
}

function buildKundaliPrompt({ name, dob, tob, pob, latitude, longitude }) {
  const dobStr  = dob  || 'Unknown';
  const tobStr  = tob  || '12:00 (noon assumed — exact Lagna may vary)';
  const pobStr  = pob  || 'India';
  const coordStr = latitude ? `(${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E)` : '';
  const nameStr  = name || 'Native';

  return `Generate a complete Vedic (Jyotish) birth chart analysis using Lahiri Ayanamsa.

Input:
  Name:           ${nameStr}
  Date of Birth:  ${dobStr}
  Time of Birth:  ${tobStr}
  Place of Birth: ${pobStr} ${coordStr}

Return a single JSON object with exactly this structure:
{
  "lagna":          "SignName",
  "lagna_deg":      "14°22'",
  "sun_sign":       "SignName",
  "moon_sign":      "SignName",
  "nakshatra":      "NakshatraName",
  "nakshatra_pada": 2,
  "ayanamsa":       "Lahiri",
  "chart_type":     "Parashari",

  "planets": {
    "Sun":     { "house": 1, "sign": "...", "degree": "10°45'", "retrograde": false, "effect": "..." },
    "Moon":    { "house": 1, "sign": "...", "degree": "...",    "retrograde": false, "effect": "..." },
    "Mars":    { "house": 1, "sign": "...", "degree": "...",    "retrograde": false, "effect": "..." },
    "Mercury": { "house": 1, "sign": "...", "degree": "...",    "retrograde": false, "effect": "..." },
    "Jupiter": { "house": 1, "sign": "...", "degree": "...",    "retrograde": false, "effect": "..." },
    "Venus":   { "house": 1, "sign": "...", "degree": "...",    "retrograde": false, "effect": "..." },
    "Saturn":  { "house": 1, "sign": "...", "degree": "...",    "retrograde": true,  "effect": "..." },
    "Rahu":    { "house": 1, "sign": "...", "degree": "...",    "retrograde": true,  "effect": "..." },
    "Ketu":    { "house": 1, "sign": "...", "degree": "...",    "retrograde": true,  "effect": "..." }
  },

  "houses": {
    "1":  { "sign": "...", "lord": "...", "nature": "Kendra",   "planets": [] },
    "2":  { "sign": "...", "lord": "...", "nature": "Dhana",    "planets": [] },
    "3":  { "sign": "...", "lord": "...", "nature": "Upachaya", "planets": [] },
    "4":  { "sign": "...", "lord": "...", "nature": "Kendra",   "planets": [] },
    "5":  { "sign": "...", "lord": "...", "nature": "Trikona",  "planets": [] },
    "6":  { "sign": "...", "lord": "...", "nature": "Dusthana", "planets": [] },
    "7":  { "sign": "...", "lord": "...", "nature": "Kendra",   "planets": [] },
    "8":  { "sign": "...", "lord": "...", "nature": "Dusthana", "planets": [] },
    "9":  { "sign": "...", "lord": "...", "nature": "Trikona",  "planets": [] },
    "10": { "sign": "...", "lord": "...", "nature": "Kendra",   "planets": [] },
    "11": { "sign": "...", "lord": "...", "nature": "Upachaya", "planets": [] },
    "12": { "sign": "...", "lord": "...", "nature": "Dusthana", "planets": [] }
  },

  "yogas": [
    { "name": "...", "present": true, "description": "..." }
  ],

  "current_dasha": {
    "planet":         "Jupiter",
    "years":          "2019–2035",
    "interpretation": "3-4 sentence in-depth interpretation"
  },
  "antardasha": {
    "planet":         "Saturn",
    "period":         "2024–2027",
    "interpretation": "2-3 sentence in-depth interpretation"
  },
  "upcoming_dashas": [
    { "planet": "Saturn",  "start": "2035", "end": "2054", "brief": "..." },
    { "planet": "Mercury", "start": "2054", "end": "2071", "brief": "..." }
  ],

  "mangal_dosha": {
    "present":          true,
    "severity":         "Full|Partial|None",
    "houses_affected":  [1, 4],
    "description":      "...",
    "remedy":           "..."
  },
  "kaal_sarp": {
    "present":     false,
    "type":        "None|Anant|Kulik|Vasuki|...",
    "description": "...",
    "remedy":      ""
  },

  "predictions": {
    "career":   "4-5 sentences with specific timing",
    "finance":  "4-5 sentences with specific timing",
    "marriage": "4-5 sentences with specific timing",
    "health":   "4-5 sentences with specific timing"
  },

  "remedies": ["remedy1", "remedy2", "remedy3", "remedy4", "remedy5"],
  "overall":  "2-3 sentence eloquent summary of the chart's promise"
}`;
}

module.exports = { generateKundali };
