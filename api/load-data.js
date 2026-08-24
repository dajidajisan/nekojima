// GET /api/load-data?code=...&key=...
// Returns { value: string | null }

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { code, key } = req.query || {};
  if (!code || !key) {
    res.status(400).json({ error: 'code and key query params are required' });
    return;
  }

  try {
    const { data, error } = await supabase
      .from('player_data')
      .select('value')
      .eq('code', code)
      .eq('key', key)
      .maybeSingle();
    if (error) throw error;
    res.status(200).json({ value: data ? data.value : null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
