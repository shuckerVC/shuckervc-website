#!/usr/bin/env node
/* ============================================================
   mcp-preview.mjs

   Runs the read-only tools from docs/mcp-schema.json against the data that is
   actually in this repo, and validates every response against its own
   outputSchema. The point is that the schema is *demonstrated* rather than
   asserted: if a tool is listed as ready, this proves it, and if the data
   can't support it, this fails instead of the Worker failing later.

   The four ready tools are implemented for real below — this is the reference
   implementation the Worker would port. check_fit / lp_fit / request_access
   are reported as blocked, with what they're waiting on.

   Run: npm run mcp:preview
        npm run mcp:preview -- get_writing '{"tag":"White paper"}'
   ============================================================ */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = path.join(ROOT, 'site');
const read = (p) => JSON.parse(fs.readFileSync(path.join(SITE, p), 'utf8'));

const schema = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/mcp-schema.json'), 'utf8'));
const fund = read('data/fund.json');
const portfolio = read('data/portfolio.json').companies;
const posts = read('insights.json').posts || [];
const press = read('press.json');
const team = read('data/team.json').members;

/* Not under site/ — the rubric and the LP profile are deliberately undeployed.
   See the _comment in each file. */
const readConfig = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, 'config', p), 'utf8'));
const rubric = readConfig('fit-rubric.json');
const lpIcp = readConfig('lp-icp.json');

const BASE = 'https://shuckervc.github.io/shuckervc-website';

/* ------------------------------------------------------------
   The ready tools. Deliberately small — they are file lookups.
   ------------------------------------------------------------ */

const TOOLS = {
  get_fund_facts({ fields } = {}) {
    const { _comment, ...card } = fund;
    // Publish the gaps explicitly. An agent told "we don't publish this" will
    // say so; an agent told nothing will estimate.
    const out = { ...card, unpublished: (fund.unpublished || []).map((s) => s.split(' — ')[0]) };
    if (!fields) return out;
    return Object.fromEntries(Object.entries(out).filter(([k]) => fields.includes(k) || k === 'updated' || k === 'unpublished'));
  },

  search_portfolio({ query, tag, has_press, limit = 10 } = {}) {
    const q = (query || '').toLowerCase();
    const hit = portfolio.filter((c) => {
      if (tag && !(c.tags || []).includes(tag)) return false;
      if (has_press && !(press[c.id] || []).length) return false;
      if (!q) return true;
      return [c.name, c.cat, c.desc].join(' ').toLowerCase().includes(q);
    }).slice(0, limit);

    return {
      count: hit.length,
      companies: hit.map((c) => ({
        id: c.id,
        name: c.name,
        category: c.cat,
        description: c.desc,
        website: c.site || null,
        tags: c.tags || [],
        co_investors: c.coInvestor || null,
        milestone: c.milestone || null,
        founders: (c.founders || []).map((f) => ({ name: f.name, role: f.note, linkedin: f.url })),
        press: (press[c.id] || []).map((p) => ({ outlet: p.outlet, title: p.title, url: p.url })),
        our_writing_url: posts.some((p) => p.id === c.id) ? `${BASE}/writing.html#${c.id}` : null
      }))
    };
  },

  get_thesis({ topic = 'all' } = {}) {
    const md = fs.readFileSync(path.join(SITE, 'thesis.md'), 'utf8')
      .replace(/^<!--[\s\S]*?-->\n\n/, '');
    const cut = (from, to) => {
      const a = md.indexOf(from);
      if (a < 0) return md;
      const b = to ? md.indexOf(to, a) : -1;
      return md.slice(a, b < 0 ? undefined : b).trim();
    };
    const markdown =
      topic === 'strategy' ? cut('# Strategy', '# The Support Partner model') :
      topic === 'support_model' ? cut('# The Support Partner model') : md;
    return { markdown, source_url: `${BASE}/thesis.md`, updated: fund.updated };
  },

  get_writing({ query, tag, full_text = false, limit = 5 } = {}) {
    const q = (query || '').toLowerCase();
    const hit = posts
      .filter((p) => (!tag || p.tag === tag) && (!q || [p.title, p.excerpt].join(' ').toLowerCase().includes(q)))
      .sort((a, b) => b.sort - a.sort)
      .slice(0, limit);
    return {
      count: hit.length,
      posts: hit.map((p) => {
        const o = {
          id: p.id, title: p.title, tag: p.tag, author: p.author,
          date: p.date, read: p.read, excerpt: p.excerpt,
          url: `${BASE}/writing.html#${p.id}`
        };
        if (full_text && p.body) {
          o.body_markdown = p.body
            .map((b) => (b.t === 'h' ? `## ${b.text}` : b.t === 'q' ? `> ${b.text}` : b.text))
            .join('\n\n');
        }
        return o;
      })
    };
  },

  /* ----------------------------------------------------------
     check_fit — hard gate, then an anchored 1–5 weighted rubric with a
     threshold. Same shape as the support-partner-screener already in use.

     In the Worker, step 2 (scoring) is an LLM pass constrained to the anchors
     in config/fit-rubric.json. Here it's a transparent keyword heuristic so the
     gate, the arithmetic, and the thresholds are all demonstrable offline —
     and so the LLM's job is narrowed to exactly one step that cannot reach
     the gate.
     ---------------------------------------------------------- */
  check_fit({ company = {}, scores: given } = {}) {
    const text = [company.description, company.traction, company.team, company.sector]
      .filter(Boolean).join(' ').toLowerCase();
    const has = (...w) => w.some((s) => text.includes(s));

    // 1. Hard gate. Terminal, and deliberately not persuadable.
    const exclusions = fund.investing.not_a_fit || [];
    const gateHits = [];
    if (has('consumer app', 'b2c', 'direct-to-consumer')) gateHits.push('consumer / B2C');
    if (has('therapeutic', 'biotech', 'drug discovery', 'medical device')) gateHits.push('biotech, therapeutics, medical devices');
    if (has('crypto', 'web3', 'blockchain', 'token')) gateHits.push('crypto / web3');
    if (has('agency', 'consultancy', 'consulting services')) gateHits.push('services, agencies, consultancies');
    if (has('pre-product', 'no product yet', 'idea stage')) gateHits.push('pre-product (no working product or design partner)');
    if (company.stage === 'series-a' || company.stage === 'series-b-plus') gateHits.push('stage beyond seed');

    const criteria = [
      { criterion: 'stage', result: !company.stage ? 'unknown' : gateHits.includes('stage beyond seed') ? 'fail' : 'pass',
        detail: company.stage ? `${company.stage} against pre-seed, seed.` : 'Stage not stated.' },
      { criterion: 'sector', result: gateHits.length && !gateHits.includes('stage beyond seed') ? 'fail' : 'pass',
        detail: gateHits.filter((g) => g !== 'stage beyond seed').join('; ') || 'B2B software, within scope.' },
      { criterion: 'geography', result: company.geography ? 'pass' : 'unknown',
        detail: company.geography ? `${company.geography}. US-focused, European-founded companies in portfolio.` : 'Not stated — not disqualifying.' },
      { criterion: 'check_size', result: company.raising_usd ? (company.raising_usd >= 750000 ? 'pass' : 'unknown') : 'unknown',
        detail: company.raising_usd ? `$${(company.raising_usd / 1e6).toFixed(1)}M round; a cheque up to $500K fits.` : 'Round size not stated.' }
    ];

    const disclaimer = 'Automated pre-screen against published criteria. Not a decision from the shuckerVC partners.';

    if (gateHits.length) {
      return {
        verdict: 'out_of_scope', confidence: 'high',
        reasoning: `Excluded by published criteria: ${gateHits.join('; ')}.`,
        message_to_founder: `shuckerVC publishes an explicit list of what they don't invest in, and this falls inside it (${gateHits.join('; ')}). That's a firm no rather than a maybe, so it's not worth the pitch — better to spend the time on funds whose stated scope covers you.`,
        criteria, scores: null, weighted_score: null,
        next_step: { type: 'none' }, disclaimer
      };
    }

    // 2. Anchored scoring. Callers (or the Worker's LLM stage) may supply scores.
    const heuristic = {
      icp_clarity: has('mid-market', 'brokers', 'managers', 'teams at', 'sell to', 'buyer') ? 4 : has('smb', 'enterprise') ? 3 : null,
      technical_depth: has('ex-google', 'ex-meta', 'ex-microsoft', 'phd', 'cto', 'technical founder') ? 4 : null,
      customer_evidence: has('mrr', 'arr', 'paying') ? 5 : has('design partner', 'in production', 'pilot') ? 4 : has('waitlist', 'loi') ? 2 : null,
      velocity: has('shipping', 'iterating', 'weekly release', 'in production') ? 4 : null,
      sp_leverage: has('two founders', 'small team', 'no ops', 'wearing every hat') ? 4 : 3,
      round_fit: company.raising_usd ? (company.raising_usd >= 1e6 ? 4 : 3) : null
    };
    const scores = { ...heuristic, ...(given || {}) };

    const dims = rubric.dimensions.filter((d) => scores[d.id] != null);
    const unknown = rubric.dimensions.length - dims.length;
    const weighted = dims.reduce((a, d) => a + scores[d.id] * d.weight, 0) / (dims.reduce((a, d) => a + d.weight, 0) || 1);

    let verdict = weighted >= rubric.thresholds.strong ? 'strong'
      : weighted >= rubric.thresholds.possible ? 'possible' : 'not_now';

    // Thin descriptions never buy a strong verdict.
    const confidence = unknown >= 3 ? 'low' : unknown >= 1 ? 'medium' : 'high';
    if (unknown >= 3 && verdict === 'strong') verdict = 'possible';

    const msg = {
      strong: 'This looks like a real fit against shuckerVC\'s published criteria — stage, sector, and round all line up. Worth submitting; the pre-screen goes with it so the partners see the reasoning.',
      possible: 'This is plausibly a fit, but the description didn\'t evidence everything the criteria look for. Submitting is the right next step — a partner reads it directly.',
      not_now: 'On what was described this doesn\'t clear the bar today. That is a read on the description, not a verdict on the company — you can still submit, and a partner will look.'
    }[verdict];

    return {
      verdict, confidence,
      reasoning: `Weighted ${weighted.toFixed(2)}/5 across ${dims.length} scored dimension(s)` +
        (unknown ? `, ${unknown} not evidenced` : '') +
        `. Thresholds: strong ≥ ${rubric.thresholds.strong}, possible ≥ ${rubric.thresholds.possible}.`,
      message_to_founder: msg,
      criteria,
      scores,
      weighted_score: Number(weighted.toFixed(2)),
      // Booking is not wired: strong fits route to submit_company carrying the
      // qualification, so the brief lands in Decile and a partner books.
      next_step: verdict === 'not_now'
        ? { type: 'submit', note: 'Optional — the gate can be wrong when the summary is thin.' }
        : { type: 'submit', prescreen_ref: 'pf_preview_' + (company.name || 'unnamed').toLowerCase().replace(/\W+/g, '') },
      disclaimer
    };
  },

  /* ----------------------------------------------------------
     lp_fit — Fund I is closed and Fund II is undefined, so this offers
     nothing. It reads mutual fit at the manager level and routes interest.
     ---------------------------------------------------------- */
  lp_fit({ mandate = {} } = {}) {
    const blockers = [];
    if (mandate.emerging_manager_appetite === false) {
      blockers.push(lpIcp.hard_blockers.find((b) => b.id === 'no_emerging_manager_appetite').message);
    }
    const badType = lpIcp.lp_types_we_do_not_fit.find((t) => t.type === mandate.investor_type);
    if (badType) blockers.push(`${mandate.investor_type}: ${badType.why}`);
    if (mandate.ticket_usd_min && mandate.ticket_usd_min > 2000000) {
      blockers.push(`A $${(mandate.ticket_usd_min / 1e6).toFixed(1)}M minimum ticket is out of range for a vehicle of this scale — Fund I was $8M in total. This is arithmetic, not preference.`);
    }

    const goodType = lpIcp.lp_types_we_fit.includes(
      ({ family_office: 'family offices', individual: 'individuals and angels', fund_of_funds: 'small funds-of-funds', emerging_manager_program: 'emerging-manager programmes' })[mandate.investor_type]
    );

    const mutual_fit = blockers.length ? 'mismatch' : goodType ? 'strong' : 'partial';

    return {
      mutual_fit,
      why: blockers.length
        ? 'We are not the right shape for this mandate. Fund I is closed and Fund II is not yet defined, so there is nothing being offered either way.'
        : 'Fund I is closed to new commitments and Fund II is not yet defined — there is no offering here. On mandate shape you look like the kind of LP this manager is built for, so the useful next step is to see the Fund I track record and be told when Fund II is defined.',
      we_fit_you: blockers.length ? [] : lpIcp.what_we_are,
      you_fit_us: goodType ? [`${mandate.investor_type} is within the LP profile this fund is built for.`] : [],
      blockers,
      what_we_can_share: lpIcp.disclosure.tier_0,
      what_requires_verification: lpIcp.disclosure.tier_1_behind_request_access,
      next_step: blockers.length ? { type: 'none' } : { type: 'request_access' },
      disclaimer: 'shuckerVC Fund I is closed to new commitments. Fund II is not defined and nothing is being offered. This is an informational mutual-fit read, not a solicitation.'
    };
  },

  get_press_kit() {
    const logos = fs.readdirSync(path.join(SITE, 'assets/logo')).map((f) => `${BASE}/assets/logo/${f}`);
    return {
      // Standing in for approved boilerplate, which does not exist yet.
      boilerplate: fund.description,
      assets: {
        logos,
        partner_headshots: team.map((m) => `${BASE}/${m.photo}`)
      },
      partners: team.map((m) => ({ name: m.name, title: m.title, linkedin: m.linkedin })),
      portfolio_press: Object.entries(press)
        .filter(([k]) => k !== '_comment')
        .flatMap(([id, items]) => (Array.isArray(items) ? items : []).map((p) => ({ company: id, outlet: p.outlet, title: p.title, url: p.url }))),
      contact: null
    };
  }
};

/* ------------------------------------------------------------
   A small structural validator — enough to catch a response that
   doesn't match its contract, without adding a dependency.
   ------------------------------------------------------------ */

function validate(value, sch, at = '$') {
  const errs = [];
  if (!sch || typeof sch !== 'object') return errs;

  const types = [].concat(sch.type || []);
  if (types.length) {
    const actual = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
    const ok = types.some((t) =>
      t === 'integer' ? Number.isInteger(value) : t === 'number' ? typeof value === 'number' : t === actual);
    if (!ok) return [`${at}: expected ${types.join('|')}, got ${actual}`];
  }
  if (sch.enum && value !== undefined && !sch.enum.includes(value)) errs.push(`${at}: ${JSON.stringify(value)} not in enum`);
  if (sch.const !== undefined && value !== sch.const) errs.push(`${at}: expected const ${JSON.stringify(sch.const)}`);

  if (types.includes('object') || sch.properties) {
    for (const k of sch.required || []) {
      if (value == null || !(k in value)) errs.push(`${at}.${k}: required but missing`);
    }
    for (const [k, sub] of Object.entries(sch.properties || {})) {
      if (value != null && value[k] !== undefined) errs.push(...validate(value[k], sub, `${at}.${k}`));
    }
  }
  if (Array.isArray(value) && sch.items) {
    value.forEach((v, i) => errs.push(...validate(v, sch.items, `${at}[${i}]`)));
  }
  return errs;
}

/* ------------------------------------------------------------
   Run
   ------------------------------------------------------------ */

const [only, argJson] = process.argv.slice(2);
const byName = Object.fromEntries(schema.tools.map((t) => [t.name, t]));
const truncate = (s, n) => (s.length > n ? s.slice(0, n) + ` …[${s.length.toLocaleString()} chars]` : s);

if (only) {
  const out = TOOLS[only](argJson ? JSON.parse(argJson) : {});
  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
}

console.log(`\nshuckerVC MCP — ${schema.version}, previewed against the repo as it stands\n`);

let failures = 0;
for (const tool of schema.tools) {
  const impl = TOOLS[tool.name];
  const mark = tool.status === 'ready' ? '●' : tool.status === 'partial' ? '◐' : '○';

  if (!impl) {
    console.log(`${mark} ${tool.name.padEnd(18)} ${tool.status.toUpperCase()}`);
    (tool.blocked_by || []).forEach((b) => console.log(`    ↳ ${b}`));
    console.log('');
    continue;
  }

  const req = (tool.example && tool.example.request) || {};
  const res = impl(req);
  const errs = validate(res, tool.outputSchema);
  failures += errs.length;

  console.log(`${mark} ${tool.name.padEnd(18)} ${tool.status.toUpperCase()}   ${errs.length ? '✗ ' + errs.length + ' schema error(s)' : '✓ validates'}`);
  console.log(`    in   ${JSON.stringify(req)}`);
  console.log(`    out  ${truncate(JSON.stringify(res), 220)}`);
  errs.slice(0, 5).forEach((e) => console.log(`    ✗ ${e}`));
  (tool.blocked_by || []).forEach((b) => console.log(`    ↳ ${b}`));
  console.log('');
}

const s = schema.readiness_summary;
console.log(`ready ${s.ready_today.length} · partial ${s.partial.length} · blocked ${s.blocked.length}`);
console.log(s.note + '\n');

if (failures) {
  console.error(`${failures} response(s) did not match their outputSchema.`);
  process.exit(1);
}
