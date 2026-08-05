/**
 * /api/health — verifies the Decile API key + base URL (GET /accounts).
 */
export default async function handler(req, res) {
  const base = (process.env.DECILE_API_BASE || 'https://decilehub.com/api/v1').replace(/\/$/, '');
  const r = await fetch(base + '/accounts', {
    headers: {
      'Authorization': process.env.DECILE_API_KEY,
      'User-Agent': 'shuckerVC-relay/1.0 (+https://shucker.vc)',
      'Accept': 'application/json',
    },
  });
  return res.status(r.ok ? 200 : 502).json({ ok: r.ok, decile_status: r.status });
}
