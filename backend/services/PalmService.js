// backend/services/PalmService.js
// ─── Palm Reading AI analysis (uses claude-sonnet with vision) ───────────────

const { withSonnet, imageBlock } = require('./AIService');
const { MODELS, FEATURES }       = require('../../shared/constants');

const SYSTEM_PROMPT = `You are Guruji Anand, a 40-year master of Vedic palmistry trained in the Jaipur gurukul tradition. You read palms with clinical precision, spiritual depth, and compassionate insight. You integrate both Western chirology and Vedic hasta-samudrika-shastra.

CRITICAL: Return ONLY valid, parseable JSON — no markdown fences, no explanatory text before or after the JSON object. Your entire response must be a single JSON object.`;

/**
 * Analyse a palm image (or provide a general reading if no image).
 * @param {object} opts
 * @param {string}  [opts.imageBase64] - base64 image data
 * @param {string}  [opts.mimeType]    - image MIME type
 * @param {number}  [opts.userId]
 * @returns {Promise<object>}
 */
async function analyzePalm({ imageBase64, mimeType = 'image/jpeg', userId = null }) {
  const hasImage = Boolean(imageBase64);

  const userContent = hasImage
    ? [
        imageBlock(imageBase64, mimeType),
        { type: 'text', text: buildPalmPrompt(true) },
      ]
    : [{ type: 'text', text: buildPalmPrompt(false) }];

  return withSonnet({
    feature  : FEATURES.PALM,
    system   : SYSTEM_PROMPT,
    messages : [{ role: 'user', content: userContent }],
    maxTokens: 2000,
    userId,
  });
}

function buildPalmPrompt(hasImage) {
  const ctx = hasImage
    ? 'Analyse the palm photograph provided.'
    : 'Provide a deeply insightful general palm reading (no image provided — use archetypally rich interpretations).';

  return `${ctx}

Return a single JSON object exactly matching this structure:
{
  "life_line":  { "strength": "Strong|Moderate|Faint", "color": "#hex", "summary": "...", "detail": "...", "prediction": "...", "age_timeline": "..." },
  "heart_line": { "strength": "Deep|Normal|Faint",     "color": "#hex", "summary": "...", "detail": "...", "prediction": "..." },
  "head_line":  { "strength": "Long|Medium|Short",      "color": "#hex", "summary": "...", "detail": "...", "prediction": "..." },
  "fate_line":  { "strength": "Clear|Faint|Absent",     "color": "#hex", "summary": "...", "detail": "...", "prediction": "..." },
  "mounts": {
    "Venus": "...", "Jupiter": "...", "Saturn": "...", "Apollo": "...",
    "Mercury": "...", "Moon": "...", "Mars_positive": "...", "Mars_negative": "..."
  },
  "special_marks":        ["mark1", "mark2"],
  "dominant_hand_type":   "Square|Conic|Spatulate|Psychic|Mixed",
  "overall_score":        { "vitality": 78, "love": 65, "career": 82, "wealth": 70, "spiritual": 55 },
  "remedies":             ["remedy1", "remedy2", "remedy3", "remedy4", "remedy5"],
  "overall":              "2-sentence overall reading verdict"
}`;
}

module.exports = { analyzePalm };
