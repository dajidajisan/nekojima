// POST /.netlify/functions/save-data
// body: { code: string, key: string, value: string }
// Upserts one (code, key) -> value row in Supabase. Used for progress,
// custom NPCs, and the AI sentence cache — anything the frontend used to
// hand to window.storage.set(key, value).

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // service-role key: bypasses RLS, server-side only
);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const { code, key, value } = body;
  if (!code || !key || typeof value !== 'string') {
    return { statusCode: 400, body: JSON.stringify({ error: 'code, key, and value (string) are required' }) };
  }
  if (code.length > 64 || key.length > 128) {
    return { statusCode: 400, body: JSON.stringify({ error: 'code or key too long' }) };
  }
  // rough size guardrail — a single save shouldn't need more than a few hundred KB
  if (value.length > 500000) {
    return { statusCode: 400, body: JSON.stringify({ error: 'value too large' }) };
  }

  try {
    const { error } = await supabase
      .from('player_data')
      .upsert(
        { code, key, value, updated_at: new Date().toISOString() },
        { onConflict: 'code,key' }
      );

    if (error) throw error;

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
