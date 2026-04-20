// backend/services/providers/gemini.js
// ─── Google Gemini 1.5 Flash — vision + text (free tier: 1,500 req/day) ─────

const { GoogleGenerativeAI } = require('@google/generative-ai');

let _client = null;

function getClient() {
  if (!_client) {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set');
    _client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return _client;
}

/**
 * Call Gemini 1.5 Flash — supports both text-only and vision (image) inputs.
 *
 * @param {object}  opts
 * @param {string}  opts.prompt        - User prompt text
 * @param {string}  [opts.systemPrompt]- System instruction
 * @param {string}  [opts.imageBase64] - Base64 image data (for palm reading)
 * @param {string}  [opts.mimeType]    - Image MIME type (default: image/jpeg)
 * @param {number}  [opts.maxTokens]   - Max output tokens (default: 1500)
 * @returns {Promise<string>}            - Raw text response
 */
async function callGemini({ prompt, systemPrompt, imageBase64, mimeType = 'image/jpeg', maxTokens = 1500 }) {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    ...(systemPrompt ? { systemInstruction: systemPrompt } : {}),
    generationConfig: { maxOutputTokens: maxTokens },
  });

  const parts = [];

  // Prepend image if provided (palm reading)
  if (imageBase64) {
    parts.push({
      inlineData: { data: imageBase64, mimeType },
    });
  }

  parts.push({ text: prompt });

  const result = await model.generateContent(parts);
  const text   = result.response.text();

  if (!text) throw new Error('Gemini returned empty response');
  return text;
}

module.exports = { callGemini };
