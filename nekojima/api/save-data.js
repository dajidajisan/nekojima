// POST /api/save-data
// body: { code: string, key: string, value: string }
// Upserts one (code, key) -> value row in Supabase.

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // service-role key: bypasses RLS, server-side only
);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (e) {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }

  const { code, key, value } = body || {};
  if (!code || !key || typeof value !== 'string') {
    res.status(400).json({ error: 'code, key, and value (string) are required' });
    return;
  }
  if (code.length > 64 || key.length > 128) {
    res.status(400).json({ error: 'code or key too long' });
    return;
  }
  if (value.length > 500000) {
    res.status(400).json({ error: 'value too large' });
    return;
  }

  try {
    const { error } = await supabase
      .from('player_data')
      .upsert(
        { code, key, value, updated_at: new Date().toISOString() },
        { onConflict: 'code,key' }
      );
    if (error) throw error;
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
