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

const RELAY_VERSION = 'v6';

function json(status, body, extra = {}) {
  // Every response identifies its worker version — stale-edge responses are
  // otherwise indistinguishable and have burned us repeatedly.
  return new Response(JSON.stringify({ relay: RELAY_VERSION, ...body }), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra },
  });
}

function clean(v, key) {
  if (typeof v !== 'string') return '';
  const max = MAX_LEN[key] || MAX_LEN.default;
  return v.trim().slice(0, max);
}

// Canonical Cloudflare Turnstile server-side verification. Returns true only
// when the token is valid (success === true); fails closed on any error.
async function verifyTurnstile(env, token, clientIp) {
  if (typeof token !== 'string' || !token) return false;
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET,
        response: token,
        remoteip: clientIp,
      }),
    });
    if (!r.ok) return false;
    const result = await r.json();
    return result && result.success === true;
  } catch (e) {
    return false;
  }
}

function decileOnce(url, method, body, authValue) {
  return fetch(url, {
    method,
    headers: {
      'Authorization': authValue,
      'Content-Type': 'application/json',
      // Worker fetches have no default UA; WAF/bot rules commonly 403 that.
      'User-Agent': 'shuckerVC-relay/1.0 (+https://shucker.vc)',
      'Accept': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    // Follow redirects OURSELVES: fetch strips Authorization on cross-origin
    // redirects, which turns an authenticated POST into a 401.
    redirect: 'manual',
  });
}

async function followFetch(url, method, body, authValue, trace) {
  let r = null;
  for (let i = 0; i < 4; i++) {
    r = await decileOnce(url, method, body, authValue);
    const loc = r.headers.get('Location');
    if (trace) trace.push(method + ' ' + url + ' -> ' + r.status + (loc ? ' loc=' + loc : ''));
    if (![301, 302, 307, 308].includes(r.status) || !loc) return r;
    // Re-issue the SAME method+body+auth at the redirect target.
    url = new URL(loc, url).toString();
  }
  return r;
}

async function decile(env, method, path, body, trace) {
  const base = (env.DECILE_API_BASE || 'https://decilehub.com/api/v1').replace(/\/$/, '');
  // Swagger securitySchemes: apiKey in the Authorization header, RAW (no
  // Bearer prefix). Some read endpoints tolerated Bearer, so fall back once.
  let r = await followFetch(base + path, method, body, env.DECILE_API_KEY, trace);
  if (r && r.status === 401) r = await followFetch(base + path, method, body, 'Bearer ' + env.DECILE_API_KEY, trace);
  return r;
}

/**
 * Call a Decile MCP tool (https://decilehub.com/mcp, Streamable HTTP).
 * The MCP path accepts Worker-originated POSTs (verified live) while the
 * REST /api/v1 write routes 401 them — so writes go through MCP.
 * The server answers statelessly (no session needed for tools/call).
 */
async function mcpCall(env, toolName, args) {
  const r = await fetch('https://decilehub.com/mcp', {
    method: 'POST',
    headers: {
      'X-Decile-API-Key': env.DECILE_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'User-Agent': 'shuckerVC-relay/1.0 (+https://shucker.vc)',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: toolName, arguments: args } }),
    redirect: 'manual',
  });
  const raw = await r.text().catch(() => '');
  let payload = null;
  try { payload = JSON.parse(raw); } catch (e) {
    // Streamable HTTP may answer as SSE with several data: events — the FINAL
    // one carries the tools/call result, so scan them all and keep the last
    // parseable one that has a result or error.
    const lines = raw.match(/^data:\s*(\{.*\})\s*$/gm) || [];
    for (const line of lines) {
      try {
        const cand = JSON.parse(line.replace(/^data:\s*/, ''));
        if (cand && (cand.result || cand.error)) payload = cand;
      } catch (e2) { /* skip unparseable event */ }
    }
  }
  const result = payload && payload.result;
  const ok = r.status === 200 && result && !result.isError && !(payload && payload.error);
  let inner = null;
  if (result && result.content && result.content[0] && result.content[0].type === 'text') {
    try { inner = JSON.parse(result.content[0].text); } catch (e) { inner = result.content[0].text; }
  }
  return { ok, http: r.status, inner, raw_first_400: raw.slice(0, 400) };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin, env);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    if (url.pathname === '/health') {
      // Liveness only by default — does NOT call Decile, so /health can't be
      // used to burn API quota or probe whether the key is still valid.
      // Deep check (verifies the key against Decile) requires ?token=<HEALTH_TOKEN>.
      // Config visibility (booleans only — never secret values) so we can
      // confirm the serving version actually has the Turnstile secret bound.
      const cfg = { turnstile: !!env.TURNSTILE_SECRET, rl: !!(env.RELAY_RL && env.RELAY_RL.limit) };
      const wantDeep = env.HEALTH_TOKEN && url.searchParams.get('token') === env.HEALTH_TOKEN;
      if (!wantDeep) return json(200, { ok: true, alive: true, ...cfg });
      const r = await decile(env, 'GET', '/accounts');
      return json(r.ok ? 200 : 502, { ok: r.ok, decile_status: r.status, ...cfg });
    }

    if (url.pathname !== '/submit' || request.method !== 'POST') {
      return json(404, { ok: false, error: 'not found' });
    }

    // Origin gate: require a known Origin. A missing Origin (non-browser
    // client) is NOT trusted — earlier the gate only checked when Origin was
    // present, so `curl` with no Origin header sailed past it.
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!origin || !allowed.includes(origin)) {
      return json(403, { ok: false, error: 'origin not allowed' }, cors);
    }

    // Rate limit: prefer Cloudflare's cross-isolate Rate Limiting binding
    // (the in-memory map only counts within one isolate, so it never caps a
    // real fleet). Falls back to the in-memory limiter if the binding is absent.
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (env.RELAY_RL && typeof env.RELAY_RL.limit === 'function') {
      const { success } = await env.RELAY_RL.limit({ key: ip });
      if (!success) return json(429, { ok: false, error: 'too many requests' }, cors);
    } else if (rateLimited(ip)) {
      return json(429, { ok: false, error: 'too many requests' }, cors);
    }

    let f;
    try { f = await request.json(); } catch { return json(400, { ok: false, error: 'invalid JSON' }, cors); }

    // Cloudflare Turnstile: verify the bot-check token server-side before any
    // write. Enforced only once TURNSTILE_SECRET is set (safe rollout — the
    // worker skips verification until the secret is deployed).
    if (env.TURNSTILE_SECRET) {
      const ts = await verifyTurnstile(env, f['cf-turnstile-response'], ip);
      if (!ts) return json(403, { ok: false, error: 'verification failed' }, cors);
    }

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

    // Payload per swagger op upsert_pipeline_prospect (POST /pipeline_prospect):
    // org fields are company_url / short_description; extras ride along as a
    // note + prospect-level custom_data_points and tag_list.
    const noteLines = [
      'Website submission — ' + data.name + (data.role ? ' (' + data.role + ')' : '') + ', ' + data.email,
      data.location ? 'Location: ' + data.location : '',
      'Round: ' + data.round + (data.amount ? ' — raising ' + data.amount : ''),
      data.deck ? 'Deck: ' + data.deck : '',
      data.referral ? 'Heard about us via: ' + data.referral : '',
      '',
      data.pitch,
    ].filter(function (l, i) { return l !== '' || i === 5; });
    // Upsert via the MCP tool — Decile's edge 401s Worker POSTs on the REST
    // write routes but accepts /mcp (verified live). Argument shape proven
    // against this account.
    const upsert = await mcpCall(env, 'upsert_pipeline_prospect', {
      pipeline_id: env.PIPELINE_ID || '2nEb978Z',
      // Stage "Added by Investment Inquiries Form" — where inbound deal
      // submissions land in this pipeline.
      stage_id: env.STAGE_ID || '315550',
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
          url: data.website,
          description: data.pitch,
        },
      },
    });

    // STRICT success: the tool's inner result must confirm the write
    // (verified canonical shape: { success: true, pipeline_prospect_id }).
    // A transport-level 200 alone is NOT success — an earlier version
    // returned ok:true here while nothing landed in Decile.
    const prospectId = upsert.inner && (upsert.inner.pipeline_prospect_id ||
      (upsert.inner.changes && upsert.inner.changes.id && upsert.inner.changes.id[1]));
    const confirmed = upsert.ok && upsert.inner &&
      (upsert.inner.success === true || upsert.inner.status === 'success') && prospectId;
    if (!confirmed) {
      console.error('Decile MCP upsert not confirmed', upsert.http, upsert.raw_first_400);
      // Diagnostic payload (no secrets) — shows what the MCP actually said.
      return json(502, {
        ok: false, error: 'upstream error',
        upstream_status: upsert.http,
        inner: upsert.inner,
        raw_first_400: upsert.raw_first_400,
      }, cors);
    }

    // Best-effort: attach the human-readable submission note to the prospect.
    if (prospectId) {
      const note = await mcpCall(env, 'add_pipeline_prospect_note', {
        pipeline_prospect_id: prospectId,
        note: { body: noteLines.join('\n'), context: 'shucker.vc submit form' },
      });
      if (!note.ok) console.error('Decile note attach failed (non-fatal)', note.http, note.raw_first_400);
    }

    return json(200, { ok: true, prospect_id: prospectId }, cors);
  },
};
