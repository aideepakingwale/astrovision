// backend/services/providers/groq.js
// ─── Groq API — Llama 3.3 70B + Llama 3.1 8B (free tier: 14,400 req/day) ───
// Uses the openai npm package with Groq's OpenAI-compatible base URL.

const OpenAI = require('openai');

let _client = null;

function getClient() {
  if (!_client) {
    if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY is not set');
    _client = new OpenAI({
      apiKey  : process.env.GROQ_API_KEY,
      baseURL : 'https://api.groq.com/openai/v1',
    });
  }
  return _client;
}

/**
 * Call Groq — text only (no vision support).
 *
 * @param {object}  opts
 * @param {string}  opts.prompt        - User message
 * @param {string}  [opts.systemPrompt]- System message
 * @param {string}  [opts.model]       - Groq model ID (default: llama-3.3-70b-versatile)
 * @param {number}  [opts.maxTokens]   - Max output tokens (default: 1500)
 * @returns {Promise<string>}            - Raw text response
 */
async function callGroq({ prompt, systemPrompt, model = 'llama-3.3-70b-versatile', maxTokens = 1500 }) {
  const client   = getClient();
  const messages = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const response = await client.chat.completions.create({
    model,
    messages,
    max_tokens  : maxTokens,
    temperature : 0.7,
  });

  const text = response.choices?.[0]?.message?.content;
  if (!text) throw new Error(`Groq (${model}) returned empty response`);
  return text;
}

module.exports = { callGroq };
