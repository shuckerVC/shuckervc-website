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
    // Streamable HTTP may answer as SSE — pull the JSON out of a data: line.
    const m = raw.match(/^data:\s*(\{.*\})\s*$/m);
    if (m) { try { payload = JSON.parse(m[1]); } catch (e2) { /* fall through */ } }
  }
  const result = payload && payload.result;
  const ok = r.status === 200 && result && !result.isError && !payload.error;
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

    // TEMP diagnostic: same minimal upsert the direct curl proved (201),
    // but sent from inside the worker. Distinguishes transport-level
    // blocking from payload-triggered rejection. Remove once diagnosed.
    if (url.pathname === '/debug-upsert') {
      const minimal = {
        pipeline_id: env.PIPELINE_ID || '2nEb978Z',
        stage_id: env.STAGE_ID || '315550',
        prospect: { organization: { name: 'ZZZ TEST worker-debug', company_url: 'https://test.invalid', short_description: 'worker debug probe — delete me' } },
      };
      const trace = [];
      const r = await decile(env, 'POST', '/pipeline_prospect', minimal, trace);
      const t = await r.text().catch(() => '');
      return json(200, { decile_status: r.status, trace, body_first_300: t.slice(0, 300) });
    }

    // TEMP diagnostic: can the Worker reach Decile's MCP endpoint (different
    // path than /api/v1/*, which 401s Worker POSTs)? Probes initialize and a
    // stateless tools/list. Remove once diagnosed.
    if (url.pathname === '/debug-mcp') {
      const mcpUrl = 'https://decilehub.com/mcp';
      async function mcpPost(payload, sessionId) {
        const headers = {
          // Per Decile's MCP docs: /mcp authenticates with X-Decile-API-Key.
          'X-Decile-API-Key': env.DECILE_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          'User-Agent': 'shuckerVC-relay/1.0 (+https://shucker.vc)',
        };
        if (sessionId) headers['Mcp-Session-Id'] = sessionId;
        const r = await fetch(mcpUrl, { method: 'POST', headers, body: JSON.stringify(payload), redirect: 'manual' });
        const t = await r.text().catch(() => '');
        return { status: r.status, session: r.headers.get('Mcp-Session-Id') || '', body_first_300: t.slice(0, 300) };
      }
      const init = await mcpPost({
        jsonrpc: '2.0', id: 1, method: 'initialize',
        params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'shuckervc-relay-probe', version: '1.0' } },
      });
      const list = await mcpPost({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }, init.session || undefined);
      return json(200, { initialize: init, tools_list: list });
    }

    if (url.pathname === '/health') {
      const r = await decile(env, 'GET', '/accounts');
      const out = { ok: r.ok, decile_status: r.status };
      if (!r.ok) {
        // Surface enough to tell a WAF/edge block (HTML challenge page,
        // cf-ray, server header) from an app-level auth rejection (JSON).
        out.content_type = r.headers.get('Content-Type') || '';
        out.server = r.headers.get('Server') || '';
        out.cf_ray = r.headers.get('CF-Ray') || '';
        const t = await r.text().catch(() => '');
        out.body_first_200 = t.slice(0, 200);
      }
      return json(r.ok ? 200 : 502, out);
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

    if (!upsert.ok) {
      console.error('Decile MCP upsert failed', upsert.http, upsert.raw_first_400);
      // Diagnostic payload (no secrets) — TODO strip once stable in prod.
      return json(502, {
        ok: false, error: 'upstream error',
        upstream_status: upsert.http,
        upstream_body_first_300: upsert.raw_first_400.slice(0, 300),
      }, cors);
    }

    // Best-effort: attach the human-readable submission note to the prospect.
    const prospectId = upsert.inner && (upsert.inner.pipeline_prospect_id ||
      (upsert.inner.changes && upsert.inner.changes.id && upsert.inner.changes.id[1]));
    if (prospectId) {
      const note = await mcpCall(env, 'add_pipeline_prospect_note', {
        pipeline_prospect_id: prospectId,
        note: { body: noteLines.join('\n'), context: 'shucker.vc submit form' },
      });
      if (!note.ok) console.error('Decile note attach failed (non-fatal)', note.http, note.raw_first_400);
    }

    return json(200, { ok: true }, cors);
  },
};
