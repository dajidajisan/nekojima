// POST /.netlify/functions/generate-sentence
// body: { prompt: string }
// Forwards the prompt to the real Anthropic API using ANTHROPIC_API_KEY,
// which is set as a Netlify environment variable (never shipped to the
// browser). Returns the raw Anthropic response so the frontend's existing
// parsing code (data.content[].text) keeps working unchanged.

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'ANTHROPIC_API_KEY is not configured on the server.' }),
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

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await anthropicRes.json();

    if (!anthropicRes.ok) {
      return {
        statusCode: anthropicRes.status,
        body: JSON.stringify({ error: data.error || 'Anthropic API error' }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
