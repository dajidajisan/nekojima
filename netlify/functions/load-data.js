// GET /.netlify/functions/load-data?code=...&key=...
// Returns { value: string | null }

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const params = event.queryStringParameters || {};
  const { code, key } = params;
  if (!code || !key) {
    return { statusCode: 400, body: JSON.stringify({ error: 'code and key query params are required' }) };
  }

  try {
    const { data, error } = await supabase
      .from('player_data')
      .select('value')
      .eq('code', code)
      .eq('key', key)
      .maybeSingle();

    if (error) throw error;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: data ? data.value : null }),
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
