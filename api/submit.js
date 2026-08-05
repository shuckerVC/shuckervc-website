/**
 * /api/submit — Vercel serverless relay: website form → Decile pipeline
 * "Deals - shuckerVC Fund I, LP".
 *
 * Port of workers/decile-relay (Cloudflare Worker), moved here because
 * Decile's edge 401s POSTs originating from Cloudflare Workers while
 * accepting identical requests from other egresses (verified 2026-08-05).
 *
 * Env (Vercel dashboard → Settings → Environment Variables):
 *   DECILE_API_KEY   (required, secret)
 *   PIPELINE_ID      (optional, default 2nEb978Z)
 *   STAGE_ID         (optional, default 315550 — "Added by Investment Inquiries Form")
 *   ALLOWED_ORIGINS  (optional, comma-separated)
 *   DECILE_API_BASE  (optional, default https://decilehub.com/api/v1)
 */

const REQUIRED = ['company', 'website', 'name', 'email', 'round', 'pitch'];
const MAX_LEN = { pitch: 4000, default: 300 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DEFAULT_ORIGINS = 'https://shuckervc.github.io,https://shucker.vc,https://www.shucker.vc';

// Best-effort per-instance rate limit (resets on cold start). For hard
// guarantees add an edge rate-limit rule in front.
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

function clean(v, key) {
  if (typeof v !== 'string') return '';
  const max = MAX_LEN[key] || MAX_LEN.default;
  return v.trim().slice(0, max);
}

export default async function handler(req, res) {
  const allowed = (process.env.ALLOWED_ORIGINS || DEFAULT_ORIGINS).split(',').map(s => s.trim()).filter(Boolean);
  const origin = req.headers.origin || '';
  res.setHeader('Vary', 'Origin');
  if (allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(404).json({ ok: false, error: 'not found' });
  if (origin && !allowed.includes(origin)) return res.status(403).json({ ok: false, error: 'origin not allowed' });

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) return res.status(429).json({ ok: false, error: 'too many requests' });

  const f = req.body || {};

  // Honeypot: hidden field real users never fill. Pretend success for bots.
  if (clean(f.website2, 'default')) return res.status(200).json({ ok: true });

  const data = {};
  for (const k of ['company', 'website', 'name', 'email', 'role', 'location', 'round', 'amount', 'deck', 'referral', 'pitch']) {
    data[k] = clean(f[k], k);
  }
  const missing = REQUIRED.filter(k => !data[k]);
  if (missing.length) return res.status(422).json({ ok: false, error: 'missing: ' + missing.join(', ') });
  if (!EMAIL_RE.test(data.email)) return res.status(422).json({ ok: false, error: 'invalid email' });
  if (!/^https?:\/\//i.test(data.website)) data.website = 'https://' + data.website;

  // Payload per swagger op upsert_pipeline_prospect (POST /pipeline_prospect),
  // proven live with a direct 201.
  const noteLines = [
    'Website submission — ' + data.name + (data.role ? ' (' + data.role + ')' : '') + ', ' + data.email,
    data.location ? 'Location: ' + data.location : '',
    'Round: ' + data.round + (data.amount ? ' — raising ' + data.amount : ''),
    data.deck ? 'Deck: ' + data.deck : '',
    data.referral ? 'Heard about us via: ' + data.referral : '',
    '',
    data.pitch,
  ].filter((l, i) => l !== '' || i === 5);

  const body = {
    pipeline_id: process.env.PIPELINE_ID || '2nEb978Z',
    stage_id: process.env.STAGE_ID || '315550',
    prospect: {
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
        source: 'shucker.vc submit form',
      },
      organization: {
        name: data.company,
        company_url: data.website,
        short_description: data.pitch,
        note: noteLines.join('\n'),
      },
    },
  };

  const base = (process.env.DECILE_API_BASE || 'https://decilehub.com/api/v1').replace(/\/$/, '');
  const r = await fetch(base + '/pipeline_prospect', {
    method: 'POST',
    headers: {
      // Swagger securitySchemes: apiKey in the Authorization header, raw.
      'Authorization': process.env.DECILE_API_KEY,
      'Content-Type': 'application/json',
      'User-Agent': 'shuckerVC-relay/1.0 (+https://shucker.vc)',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!r.ok) {
    const detail = await r.text().catch(() => '');
    console.error('Decile upsert failed', r.status, detail.slice(0, 500));
    return res.status(502).json({ ok: false, error: 'upstream error', upstream_status: r.status });
  }
  return res.status(200).json({ ok: true });
}
