// POST /.netlify/functions/generate-sentence
// body: { prompt: string }
// Forwards the prompt to the Google Gemini API (free tier — no credit card
// required, generous daily quota) using GEMINI_API_KEY, set as a Netlify
// environment variable (never shipped to the browser). The response is
// normalized into the same shape the frontend already expects
// ({ content: [{ text }] }), so no frontend changes are needed even though
// Gemini's raw response format differs from Anthropic's.

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
  // simple guardrail so a runaway client can't send a huge prompt
  if (prompt.length > 4000) {
    return { statusCode: 400, body: JSON.stringify({ error: 'prompt too long' }) };
  }

  // gemini-2.5-flash is on Google's free tier as of 2026. If Google changes
  // free-tier model availability later, swap this string for whichever
  // Flash-class model is current — the free tier consistently favors
  // Flash/Flash-Lite models over Pro-class ones.
  const model = 'gemini-2.5-flash';

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      return {
        statusCode: geminiRes.status,
        body: JSON.stringify({ error: data.error || 'Gemini API error' }),
      };
    }

    const text = (data.candidates?.[0]?.content?.parts || [])
      .map((p) => p.text || '')
      .join('');

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: [{ text }] }),
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
