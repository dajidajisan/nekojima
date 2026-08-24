// POST /api/generate-sentence
// body: { prompt: string }
// Forwards the prompt to the Groq API (free tier — no credit card
// required, ~30 requests/min, very fast LPU inference) using
// GROQ_API_KEY, set as a Vercel environment variable (never shipped to
// the browser).
//
// We switched here from Google Gemini: as of August 2026, Google is
// mid-rollout on a new "Auth key" API key format (prefixed "AQ." instead
// of "AIza"), and accounts that only get issued AQ. keys have every
// request to generativelanguage.googleapis.com rejected with a 401
// ACCESS_TOKEN_TYPE_UNSUPPORTED error — this reproduces with the official
// @google/genai SDK too, not just raw REST calls. It's a widely-reported,
// unresolved issue on Google's side (see the Google AI Developers Forum),
// not something fixable from our code. Groq's API doesn't have this
// problem and is OpenAI-compatible, so this is a straightforward swap.
//
// The response is normalized into { content: [{ text }] }, matching what
// the frontend already expects.

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'GROQ_API_KEY is not configured on the server.' });
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

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        // llama-3.3-70b-versatile was deprecated by Groq on 2026-08-16;
        // openai/gpt-oss-120b is Groq's official recommended replacement.
        model: 'openai/gpt-oss-120b',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 350,
        temperature: 0.8,
      }),
    });

    const data = await groqRes.json();

    if (!groqRes.ok) {
      console.error('generate-sentence: Groq returned non-OK status', groqRes.status, JSON.stringify(data));
      res.status(groqRes.status).json({ error: data.error || 'Groq API error' });
      return;
    }

    const text =
      (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';

    res.status(200).json({ content: [{ text }] });
  } catch (e) {
    console.error('generate-sentence error:', e);
    res.status(500).json({ error: e.message });
  }
};
