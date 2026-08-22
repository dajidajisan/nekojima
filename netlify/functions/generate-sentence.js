// POST /.netlify/functions/generate-sentence
// body: { prompt: string }
// Forwards the prompt to the Google Gemini API (free tier — no credit card
// required) using GEMINI_API_KEY, set as a Netlify environment variable
// (never shipped to the browser).
//
// IMPORTANT: this uses the official @google/genai SDK rather than a raw
// fetch() to the REST endpoint. Google has been rolling out a newer
// "Auth key" format (keys prefixed "AQ." instead of "AIza") since mid-2026,
// and as of this writing, many accounts that only get AQ.-format keys see
// every raw REST call to /v1beta/models/*:generateContent rejected with a
// 401 ACCESS_TOKEN_TYPE_UNSUPPORTED error — regardless of whether the key is
// sent via ?key= or the x-goog-api-key header. The official SDK handles
// this key format correctly, so it's the reliable choice here even though
// it pulls in a dependency.
//
// The response is normalized into the same shape the frontend already
// expects ({ content: [{ text }] }), so no frontend changes are needed.

// dynamic import instead of require(): @google/genai may ship as an ES
// module, and require()'ing an ESM-only package inside a CommonJS Netlify
// Function can throw at load time even when the package itself is fine.
// Dynamic import() works regardless of which module format the package uses.

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'GEMINI_API_KEY is not configured on the server.' }),
    };
  }

  let prompt;
  try {
    ({ prompt } = JSON.parse(event.body || '{}'));
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }
  if (!prompt || typeof prompt !== 'string') {
    return { statusCode: 400, body: JSON.stringify({ error: 'prompt (string) is required' }) };
  }
  if (prompt.length > 4000) {
    return { statusCode: 400, body: JSON.stringify({ error: 'prompt too long' }) };
  }

  // gemini-2.5-flash is Google's current free-tier Flash model, and the
  // model shown in @google/genai's own official usage example.
  const model = 'gemini-2.5-flash';

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    // the SDK's response shape has varied across versions — try the
    // documented shortcuts first, then fall back to walking the raw
    // candidates array so this doesn't silently break on a minor SDK bump
    const text =
      result.text ||
      result.response?.text?.() ||
      (result.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('') ||
      '';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: [{ text }] }),
    };
  } catch (e) {
    // log full detail server-side (visible in Netlify's function logs)
    console.error('generate-sentence error:', e);
    return { statusCode: 500, body: JSON.stringify({ error: e.message, stack: e.stack }) };
  }
};
