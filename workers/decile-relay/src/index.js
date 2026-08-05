/**
 * decile-relay — Cloudflare Worker relaying the website's submit-your-company
 * form into the Decile pipeline "Deals - shuckerVC Fund I, LP".
 *
 * POST /submit  JSON body (field names match the form in site/index.html):
 *   { company, website, name, email, role?, location?, round, amount?,
 *     deck?, referral?, pitch, website2? }        (website2 = honeypot)
 * GET  /health  verifies the API key against Decile (GET /accounts).
 *
 * Payload shape was validated against the live pipeline (custom_data_points
 * land in the prospect's `data`, organization prospects only). Auth is the
 * X-Decile-API-Key header.
 *
 * Config (wrangler.toml [vars] unless noted):
 *   DECILE_API_KEY   (secret — `wrangler secret put DECILE_API_KEY`)
 *   PIPELINE_ID      Decile pipeline id (default 2nEb978Z)
 *   ALLOWED_ORIGINS  comma-separated origins allowed to call this worker
 *   DECILE_API_BASE  Decile REST base URL
 */

const REQUIRED = ['company', 'website', 'name', 'email', 'round', 'pitch'];
const MAX_LEN = { pitch: 4000, default: 300 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Best-effort per-isolate rate limit (resets on isolate recycle). For hard
// guarantees add a Cloudflare WAF rate-limiting rule on the route as well.
const hits = new Map();
const RATE = { windowMs: 60_000, max: 5 };

function rateLimited(ip) {
  const now = Date.now();
  const rec = hits.get(ip) || { n: 0, t: now };
  if (now - rec.t > RATE.windowMs) { rec.n = 0; rec.t = now; }
  rec.n += 1;
  hits.set(ip, rec);
  return rec.n > RATE.max;
}

function corsHeaders(origin, env) {
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const ok = allowed.includes(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin : allowed[0] || '',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function json(status, body, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra },
  });
}

function clean(v, key) {
  if (typeof v !== 'string') return '';
  const max = MAX_LEN[key] || MAX_LEN.default;
  return v.trim().slice(0, max);
}

async function decile(env, method, path, body) {
  const base = (env.DECILE_API_BASE || 'https://api.decilehub.com/v1').replace(/\/$/, '');
  return fetch(base + path, {
    method,
    headers: {
      'X-Decile-API-Key': env.DECILE_API_KEY,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin, env);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    if (url.pathname === '/health') {
      const r = await decile(env, 'GET', '/accounts');
      return json(r.ok ? 200 : 502, { ok: r.ok, decile_status: r.status });
    }

    if (url.pathname !== '/submit' || request.method !== 'POST') {
      return json(404, { ok: false, error: 'not found' });
    }

    // Origin gate: browser calls must come from the site.
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    if (origin && !allowed.includes(origin)) {
      return json(403, { ok: false, error: 'origin not allowed' }, cors);
    }

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (rateLimited(ip)) return json(429, { ok: false, error: 'too many requests' }, cors);

    let f;
    try { f = await request.json(); } catch { return json(400, { ok: false, error: 'invalid JSON' }, cors); }

    // Honeypot: hidden field real users never fill. Pretend success for bots.
    if (clean(f.website2, 'default')) return json(200, { ok: true }, cors);

    const data = {};
    for (const k of ['company', 'website', 'name', 'email', 'role', 'location', 'round', 'amount', 'deck', 'referral', 'pitch']) {
      data[k] = clean(f[k], k);
    }
    const missing = REQUIRED.filter(k => !data[k]);
    if (missing.length) return json(422, { ok: false, error: 'missing: ' + missing.join(', ') }, cors);
    if (!EMAIL_RE.test(data.email)) return json(422, { ok: false, error: 'invalid email' }, cors);
    if (!/^https?:\/\//i.test(data.website)) data.website = 'https://' + data.website;

    // Exact payload shape validated against the live pipeline.
    const body = {
      pipeline_id: env.PIPELINE_ID || '2nEb978Z',
      prospect: {
        organization: {
          name: data.company,
          url: data.website,
          description: data.pitch,
        },
        tag_list: 'website-inbound',
        custom_data_points: {
          submitter_name: data.name,
          submitter_email: data.email,
          submitter_role: data.role,
          location: data.location,
          round: data.round,
          raising: data.amount,
          deck_url: data.deck,
          referral: data.referral,
          pitch: data.pitch,
          source: 'shuckervc.com submit form',
        },
      },
    };

    const r = await decile(env, 'POST', `/pipelines/${body.pipeline_id}/pipeline_prospects/upsert`, body);
    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      console.error('Decile upsert failed', r.status, detail.slice(0, 500));
      return json(502, { ok: false, error: 'upstream error' }, cors);
    }
    return json(200, { ok: true }, cors);
  },
};
