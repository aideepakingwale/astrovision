// backend/services/AIService.js
// ─── Zero-cost AI waterfall — Gemini → Groq 70B → Groq 8B → OpenRouter ──────
//
// Routing logic:
//   Vision (palm images) : Gemini 1.5 Flash  →  OpenRouter vision fallback
//   Text  (kundali)      : Groq 70B           →  Groq 8B  →  OpenRouter
//   Text  (transits)     : Groq 8B (fast)     →  Groq 70B →  OpenRouter
//   Text  (remedies)     : Groq 8B (fast)     →  Groq 70B →  OpenRouter
//
// Monthly cost at 500 MAU: $0.00

const { callGemini }      = require('./providers/gemini');
const { callGroq }        = require('./providers/groq');
const { callOpenRouter }  = require('./providers/openrouter');
const { canUse, increment } = require('./RateLimitTracker');
const { getDb }           = require('../config/database');
const { MODELS }          = require('../../shared/constants');

// ── Helpers ──────────────────────────────────────────────────────────────────

function _cleanJSON(raw) {
  return raw
    .replace(/```json\n?|```/g, '')
    .replace(/^\s*\/\/.*$/gm, '')   // strip JS-style comments if model adds them
    .trim();
}

async function _logUsage({ userId, feature, provider, model, durationMs, success, errorCode }) {
  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO ai_usage_logs
        (user_id, feature, model, prompt_tokens, output_tokens, total_tokens, duration_ms, success, error_code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId || null,
      feature,
      `${provider}/${model}`,
      0, 0, 0,          // token counts not exposed by free tier APIs
      durationMs,
      success ? 1 : 0,
      errorCode || null,
    );
  } catch (e) {
    console.error('[AIService] Usage log failed:', e.message);
  }
}

// ── Vision Waterfall — for palm reading ──────────────────────────────────────

/**
 * Call the best available free provider for a vision request (image + text).
 *
 * Layer 1: Gemini 1.5 Flash   (1,500 req/day — primary)
 * Layer 2: OpenRouter          (200 req/day   — text-only fallback, image dropped)
 *
 * @param {object}  opts
 * @param {string}  opts.prompt
 * @param {string}  [opts.systemPrompt]
 * @param {string}  [opts.imageBase64]
 * @param {string}  [opts.mimeType]
 * @param {string}  [opts.feature]
 * @param {number}  [opts.maxTokens]
 * @param {number}  [opts.userId]
 * @returns {Promise<{provider:string, model:string, data:object}>}
 */
async function callVisionAI({ prompt, systemPrompt, imageBase64, mimeType = 'image/jpeg',
  feature = 'palm', maxTokens = 1500, userId = null }) {

  // ── Layer 1: Gemini Flash ────────────────────────────────────────────────
  if (await canUse('gemini')) {
    const started = Date.now();
    try {
      const raw  = await callGemini({ prompt, systemPrompt, imageBase64, mimeType, maxTokens });
      const data = JSON.parse(_cleanJSON(raw));
      await increment('gemini');
      _logUsage({ userId, feature, provider: 'gemini', model: MODELS.GEMINI_FLASH, durationMs: Date.now() - started, success: true });
      return { provider: 'gemini', model: MODELS.GEMINI_FLASH, data };
    } catch (err) {
      console.warn('[AIService] Gemini failed:', err.message);
      _logUsage({ userId, feature, provider: 'gemini', model: MODELS.GEMINI_FLASH, durationMs: Date.now() - started, success: false, errorCode: err.message.slice(0, 50) });
    }
  } else {
    console.warn('[AIService] Gemini daily limit reached');
  }

  // ── Layer 2: OpenRouter (text-only fallback — image omitted) ────────────
  if (await canUse('openrouter')) {
    const started = Date.now();
    const fallbackPrompt = imageBase64
      ? `[NOTE: A palm image was submitted but vision is unavailable. Provide a general reading.]\n\n${prompt}`
      : prompt;
    try {
      const raw  = await callOpenRouter({ prompt: fallbackPrompt, maxTokens });
      const data = JSON.parse(_cleanJSON(raw));
      await increment('openrouter');
      _logUsage({ userId, feature, provider: 'openrouter', model: MODELS.OPENROUTER, durationMs: Date.now() - started, success: true });
      return { provider: 'openrouter', model: MODELS.OPENROUTER, data };
    } catch (err) {
      console.warn('[AIService] OpenRouter fallback failed:', err.message);
      _logUsage({ userId, feature, provider: 'openrouter', model: MODELS.OPENROUTER, durationMs: Date.now() - started, success: false, errorCode: err.message.slice(0, 50) });
    }
  }

  throw new Error('All vision AI providers are at their daily limit. Please try again after midnight UTC.');
}

// ── Text Waterfall — for kundali, transits, remedies ─────────────────────────

/**
 * Call the best available free provider for a text-only request.
 *
 * Layer 1: Groq 70B  (quality  — kundali, complex analysis)   14,400 req/day
 *        : Groq 8B   (speed    — transits, remedies, cache)    14,400 req/day
 * Layer 2: Groq 8B fallback (if 70B exhausted)
 * Layer 3: OpenRouter free model
 *
 * @param {object}  opts
 * @param {string}  opts.prompt
 * @param {string}  [opts.systemPrompt]
 * @param {boolean} [opts.preferSpeed]   - true = prefer Groq 8B over 70B
 * @param {string}  [opts.feature]
 * @param {number}  [opts.maxTokens]
 * @param {number}  [opts.userId]
 * @returns {Promise<{provider:string, model:string, data:object}>}
 */
async function callTextAI({ prompt, systemPrompt, preferSpeed = false,
  feature = 'text', maxTokens = 1500, userId = null }) {

  // Determine primary and secondary Groq models
  const primaryModel    = preferSpeed ? MODELS.GROQ_8B  : MODELS.GROQ_70B;
  const primaryProvider = preferSpeed ? 'groq_8b'       : 'groq_70b';
  const fallbackModel   = preferSpeed ? MODELS.GROQ_70B : MODELS.GROQ_8B;
  const fallbackProv    = preferSpeed ? 'groq_70b'      : 'groq_8b';

  // ── Layer 1: Primary Groq model ──────────────────────────────────────────
  if (await canUse(primaryProvider)) {
    const started = Date.now();
    try {
      const raw  = await callGroq({ prompt, systemPrompt, model: primaryModel, maxTokens });
      const data = JSON.parse(_cleanJSON(raw));
      await increment(primaryProvider);
      _logUsage({ userId, feature, provider: primaryProvider, model: primaryModel, durationMs: Date.now() - started, success: true });
      return { provider: primaryProvider, model: primaryModel, data };
    } catch (err) {
      console.warn(`[AIService] Groq ${primaryModel} failed:`, err.message);
      _logUsage({ userId, feature, provider: primaryProvider, model: primaryModel, durationMs: Date.now() - started, success: false, errorCode: err.message.slice(0, 50) });
    }
  } else {
    console.warn(`[AIService] ${primaryProvider} daily limit reached`);
  }

  // ── Layer 2: Fallback Groq model ─────────────────────────────────────────
  if (await canUse(fallbackProv)) {
    const started = Date.now();
    try {
      const raw  = await callGroq({ prompt, systemPrompt, model: fallbackModel, maxTokens });
      const data = JSON.parse(_cleanJSON(raw));
      await increment(fallbackProv);
      _logUsage({ userId, feature, provider: fallbackProv, model: fallbackModel, durationMs: Date.now() - started, success: true });
      return { provider: fallbackProv, model: fallbackModel, data };
    } catch (err) {
      console.warn(`[AIService] Groq ${fallbackModel} fallback failed:`, err.message);
      _logUsage({ userId, feature, provider: fallbackProv, model: fallbackModel, durationMs: Date.now() - started, success: false, errorCode: err.message.slice(0, 50) });
    }
  }

  // ── Layer 3: OpenRouter free model ───────────────────────────────────────
  if (await canUse('openrouter')) {
    const started = Date.now();
    try {
      const raw  = await callOpenRouter({ prompt, maxTokens });
      const data = JSON.parse(_cleanJSON(raw));
      await increment('openrouter');
      _logUsage({ userId, feature, provider: 'openrouter', model: MODELS.OPENROUTER, durationMs: Date.now() - started, success: true });
      return { provider: 'openrouter', model: MODELS.OPENROUTER, data };
    } catch (err) {
      console.warn('[AIService] OpenRouter fallback failed:', err.message);
      _logUsage({ userId, feature, provider: 'openrouter', model: MODELS.OPENROUTER, durationMs: Date.now() - started, success: false, errorCode: err.message.slice(0, 50) });
    }
  }

  throw new Error('All text AI providers are at their daily limit. Please try again after midnight UTC.');
}

module.exports = { callVisionAI, callTextAI };

