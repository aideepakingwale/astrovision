// backend/services/providers/openrouter.js
// ─── OpenRouter — free model fallback (used only when Gemini + Groq are exhausted) ──
// OpenAI-compatible API — single key covers 20+ free models.

const OpenAI = require('openai');

let _client = null;

function getClient() {
  if (!_client) {
    if (!process.env.OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY is not set');
    _client = new OpenAI({
      apiKey          : process.env.OPENROUTER_API_KEY,
      baseURL         : 'https://openrouter.ai/api/v1',
      defaultHeaders  : {
        'HTTP-Referer' : process.env.FRONTEND_URL || 'https://astrovision.app',
        'X-Title'      : 'AstroVision',
      },
    });
  }
  return _client;
}

/**
 * Call OpenRouter with a free model (fallback only).
 *
 * @param {object}  opts
 * @param {string}  opts.prompt     - User message
 * @param {string}  [opts.model]    - OpenRouter model ID (default: Llama 3.1 8B free)
 * @param {number}  [opts.maxTokens]
 * @returns {Promise<string>}
 */
async function callOpenRouter({
  prompt,
  model      = 'meta-llama/llama-3.1-8b-instruct:free',
  maxTokens  = 1200,
}) {
  const client = getClient();

  const response = await client.chat.completions.create({
    model,
    max_tokens : maxTokens,
    messages   : [{ role: 'user', content: prompt }],
  });

  const text = response.choices?.[0]?.message?.content;
  if (!text) throw new Error(`OpenRouter (${model}) returned empty response`);
  return text;
}

module.exports = { callOpenRouter };
