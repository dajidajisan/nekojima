// POST /api/generate-sentence
// body: { prompt: string }
// Forwards the prompt to the Google Gemini API (free tier) using
// GEMINI_API_KEY, set as a Vercel environment variable (never shipped to
// the browser).
//
// Uses the official @google/genai SDK (loaded via dynamic import, which
// works regardless of whether the package ships as ESM or CJS) rather than
// a raw fetch() to the REST endpoint, since raw REST calls were rejected
// for the newer "AQ."-prefixed Gemini API key format on some accounts.
//
// The response is normalized into { content: [{ text }] }, matching what
// the frontend already expects.

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    return;
  }

  let prompt;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    prompt = body && body.prompt;
  } catch (e) {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }
  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'prompt (string) is required' });
    return;
  }
  if (prompt.length > 4000) {
    res.status(400).json({ error: 'prompt too long' });
    return;
  }

  // gemini-3.5-flash-lite: thinking OFF by default (unlike the "Flash"
  // tier, which thinks for several extra seconds before answering even on
  // 'low'), and fast/cheap enough for this short a generation task. If
  // Google retires this model name later, swap in whatever the current
  // free-tier Flash-Lite model is called.
  const model = 'gemini-3.5-flash-lite';

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: 'low' },
        maxOutputTokens: 350,
      },
    });

    const text =
      result.text ||
      (result.response && result.response.text && result.response.text()) ||
      ((result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts) || [])
        .map((p) => p.text || '')
        .join('') ||
      '';

    res.status(200).json({ content: [{ text }] });
  } catch (e) {
    console.error('generate-sentence error:', e);
    res.status(500).json({ error: e.message, stack: e.stack });
  }
};
