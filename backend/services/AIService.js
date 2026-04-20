// backend/services/AIService.js
// ─── Base AI orchestration layer — wraps Anthropic SDK, logs usage ──────────

const Anthropic    = require('@anthropic-ai/sdk');
const { getDb }    = require('../config/database');
const { MODELS }   = require('../../shared/constants');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Core AI caller.
 * @param {object} opts
 * @param {string}   opts.model        - Anthropic model string
 * @param {string}   opts.feature      - 'palm' | 'kundali' | 'transit' | 'remedy'
 * @param {string}   opts.system       - System prompt
 * @param {Array}    opts.messages      - Anthropic messages array
 * @param {number}  [opts.maxTokens]   - Max output tokens
 * @param {number}  [opts.userId]      - For usage logging
 * @returns {Promise<object>}           - Parsed JSON result
 */
async function callAI({ model, feature, system, messages, maxTokens = 1200, userId = null }) {
  const started = Date.now();
  let success = true;
  let errorCode = null;
  let usage = { input_tokens: 0, output_tokens: 0 };

  try {
    const response = await client.messages.create({
      model,
      max_tokens : maxTokens,
      system,
      messages,
    });

    usage = response.usage || usage;
    const raw = response.content.find(b => b.type === 'text')?.text || '{}';
    const clean = raw.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(clean);

  } catch (err) {
    success   = false;
    errorCode = err.status ? String(err.status) : 'UNKNOWN';
    throw err;

  } finally {
    const duration = Date.now() - started;
    _logUsage({ userId, feature, model, usage, duration, success, errorCode });
  }
}

/**
 * Build an image content block for vision-capable models.
 */
function imageBlock(base64, mediaType = 'image/jpeg') {
  return {
    type   : 'image',
    source : { type: 'base64', media_type: mediaType, data: base64 },
  };
}

/**
 * Persist AI usage to audit log (fire-and-forget).
 */
function _logUsage({ userId, feature, model, usage, duration, success, errorCode }) {
  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO ai_usage_logs
        (user_id, feature, model, prompt_tokens, output_tokens, total_tokens, duration_ms, success, error_code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      feature,
      model,
      usage.input_tokens  || 0,
      usage.output_tokens || 0,
      (usage.input_tokens || 0) + (usage.output_tokens || 0),
      duration,
      success ? 1 : 0,
      errorCode,
    );
  } catch (e) {
    // Non-critical — don't crash request
    console.error('[AIService] Usage log failed:', e.message);
  }
}

/**
 * Convenience wrappers for each model tier.
 */
const withSonnet = (opts) => callAI({ ...opts, model: MODELS.SONNET });
const withHaiku  = (opts) => callAI({ ...opts, model: MODELS.HAIKU  });

module.exports = { callAI, imageBlock, withSonnet, withHaiku };
