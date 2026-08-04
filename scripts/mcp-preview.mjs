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

/* This repo is PUBLIC. scripts/fit-criteria.json holds only criteria sourced from
   what shuckerVC already publishes. The authoritative internal gate — its
   assessment guidance and its thresholds — is confidential and lives outside
   this repository; set SHUCKERVC_RUBRIC to its path to run against it instead. */
const rubric = JSON.parse(fs.readFileSync(
  process.env.SHUCKERVC_RUBRIC || path.join(ROOT, 'scripts/fit-criteria.json'), 'utf8'));

/* LP profile is internal and intentionally absent from this repo. Without it,
   lp_fit runs on the published fund card alone and says so. */
const lpIcp = process.env.SHUCKERVC_LP_ICP
  ? JSON.parse(fs.readFileSync(process.env.SHUCKERVC_LP_ICP, 'utf8'))
  : null;

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
     check_fit — a provisional read in the same shape as the internal
     qualification review: per-criterion pass / needs_more_info / fail, with
     evidence and confidence, and a score.

     Two things it deliberately does NOT do. It never claims to be the real
     decision — a partner reviews with evidence a caller cannot supply. And it
     never advances a pipeline stage: an anonymous caller must not be able to
     move a prospect forward.

     In the Worker, the per-criterion assessment is an LLM pass constrained to
     the criteria file. Here it is a transparent keyword heuristic so the gate,
     the arithmetic and the thresholds are demonstrable offline — and so the
     LLM's job is narrowed to one step that cannot reach the hard gate.
     ---------------------------------------------------------- */
  check_fit({ company = {}, assessments: given } = {}) {
    const text = [company.description, company.traction, company.team, company.sector]
      .filter(Boolean).join(' ').toLowerCase();
    const has = (...w) => w.some((s) => text.includes(s));
    const disclaimer = 'Provisional read against shuckerVC\'s published criteria, from the description supplied. Not a decision, and not the fund\'s full review.';

    // 1. Published exclusions. Terminal, and deliberately not persuadable.
    const gateHits = [];
    if (has('consumer app', 'b2c', 'direct-to-consumer')) gateHits.push('consumer / B2C');
    if (has('therapeutic', 'biotech', 'drug discovery', 'medical device')) gateHits.push('biotech, therapeutics, medical devices');
    if (has('crypto', 'web3', 'blockchain', 'token')) gateHits.push('crypto / web3');
    if (has('agency', 'consultancy', 'consulting services')) gateHits.push('services, agencies, consultancies');
    if (has('pre-product', 'no product yet', 'idea stage')) gateHits.push('pre-product (no working product or design partner)');
    if (company.stage === 'series-a' || company.stage === 'series-b-plus') gateHits.push('raising beyond seed');

    // 2. Assess each published criterion. Unassessable → needs_more_info, never a guess.
    const NMI = (evidence) => ({ result: 'needs_more_info', evidence, confidence: 'low' });
    const auto = {
      software: has('platform', 'software', 'saas', 'api', 'agents', 'app')
        ? { result: 'pass', evidence: 'Description indicates a software product.', confidence: 'medium' }
        : NMI('Delivery mechanism not clear from the description.'),
      b2b: has('b2b', 'brokers', 'firms', 'enterprises', 'businesses', 'teams', 'customers', 'mid-market')
        ? { result: 'pass', evidence: 'Sells to businesses.', confidence: 'medium' }
        : NMI('Customer segment not stated.'),
      stage: company.stage
        ? (['pre-seed', 'seed'].includes(company.stage)
            ? { result: 'pass', evidence: `Raising at ${company.stage}.`, confidence: 'high' }
            : { result: 'fail', evidence: `${company.stage} is beyond the fund's stage.`, confidence: 'high' })
        : NMI('Stage not stated.'),
      us_based: company.geography
        ? (/united states|usa|us$|u\.s\./i.test(company.geography)
            ? { result: 'pass', evidence: `Based in ${company.geography}.`, confidence: 'high' }
            : { result: 'needs_more_info', evidence: `${company.geography} — outside the US focus, though the portfolio includes European-founded companies. A discussion, not a rejection.`, confidence: 'medium' })
        : NMI('Location not stated.'),
      market: has('mid-market', 'enterprise', 'industry', 'sector', 'market')
        ? { result: 'pass', evidence: 'Targets an identifiable business market.', confidence: 'low' }
        : NMI('Market size not evidenced.'),
      team: has('ex-google', 'ex-meta', 'ex-microsoft', 'phd', 'technical founder', 'cto', 'founded')
        ? { result: 'pass', evidence: 'Technical founding background indicated.', confidence: 'low' }
        : NMI('Team depth is judged in conversation, not from a description.'),
      ai: has(' ai', 'ai ', 'machine learning', 'llm', 'agents', 'model')
        ? { result: 'pass', evidence: 'AI is central to the product.', confidence: 'medium' }
        : NMI('No AI functionality or roadmap described.'),
      support_model: NMI('Depends on current back-office headcount, which the description does not state.')
    };

    const criteria = rubric.criteria.map((c) => {
      const a = (given && given[c.id]) || auto[c.id] || NMI('Not assessed.');
      const hardFail = c.hard && (a.result === 'fail' ||
        (c.id === 'software' && gateHits.some((g) => /hardware|services/.test(g))) ||
        (c.id === 'b2b' && gateHits.some((g) => /consumer/.test(g))));
      return { criterion: c.id, label: c.label, hard: !!c.hard,
               result: hardFail ? 'fail' : a.result, evidence: a.evidence, confidence: a.confidence };
    });

    const passed = criteria.filter((c) => c.result === 'pass').length;
    const nmi = criteria.filter((c) => c.result === 'needs_more_info').length;
    const hardFailed = criteria.some((c) => c.hard && c.result === 'fail');
    const score = { passed, of: criteria.length, needs_more_info: nmi };

    if (gateHits.length || hardFailed) {
      const why = gateHits.length ? gateHits.join('; ') : criteria.filter((c) => c.hard && c.result === 'fail').map((c) => c.label).join('; ');
      return {
        verdict: 'out_of_scope', confidence: 'high', score, criteria,
        reasoning: `Ruled out by published criteria: ${why}.`,
        message_to_founder: `shuckerVC publishes what it doesn't invest in, and this falls inside that list (${why}). That's a firm no rather than a maybe — better to spend the time on funds whose stated scope covers you.`,
        gaps: [], next_step: { type: 'none' }, disclaimer
      };
    }

    const t = rubric.thresholds;
    let verdict = passed >= t.strong_min_pass ? 'strong' : passed >= t.possible_min_pass ? 'possible' : 'not_now';
    if (nmi >= 2 && verdict === 'strong') verdict = 'possible';   // thin evidence never buys a strong read

    const msg = {
      strong: 'This lines up with shuckerVC\'s published criteria on the points the description covers. Worth submitting — the assessment goes with it, so the partners see the reasoning rather than starting cold.',
      possible: 'Plausibly a fit, but the description didn\'t evidence everything the criteria look for. Submitting is the right next step; a partner reviews it directly.',
      not_now: 'On what was described this doesn\'t clear the bar today. That is a read on the description, not a verdict on the company — you can still submit, and a partner will look.'
    }[verdict];

    return {
      verdict,
      confidence: nmi >= 3 ? 'low' : nmi >= 1 ? 'medium' : 'high',
      score, criteria,
      reasoning: `${passed} of ${criteria.length} published criteria met` +
        (nmi ? `, ${nmi} needing more information` : '') +
        `. Thresholds: strong ≥ ${t.strong_min_pass}, possible ≥ ${t.possible_min_pass}.`,
      message_to_founder: msg,
      gaps: criteria.filter((c) => c.result === 'needs_more_info').map((c) => `${c.label} — ${c.evidence}`),
      next_step: { type: 'submit', prescreen_ref: 'pf_preview_' + (company.name || 'unnamed').toLowerCase().replace(/\W+/g, '') },
      disclaimer
    };
  },

  /* ----------------------------------------------------------
     lp_fit — Fund I is closed and Fund II is undefined, so this offers
     nothing. It reads mutual fit at the manager level and routes interest.
     The LP profile it scores against is internal and not in this public repo;
     without it, this runs on the published fund card and says so.
     ---------------------------------------------------------- */
  lp_fit({ mandate = {} } = {}) {
    const blockers = [];
    const fundSize = fund.fund.size_usd;

    if (mandate.emerging_manager_appetite === false) {
      blockers.push('We are an emerging manager. If the mandate excludes first- and second-time funds, we are not a fit and will not be one soon.');
    }
    if (mandate.ticket_usd_min && mandate.ticket_usd_min > fundSize / 4) {
      blockers.push(`A $${(mandate.ticket_usd_min / 1e6).toFixed(1)}M minimum ticket is out of range for a vehicle of this scale — Fund I was $${fundSize / 1e6}M in total. This is arithmetic, not preference.`);
    }
    const institutional = ['pension', 'endowment', 'sovereign', 'insurance'];
    if (institutional.includes(mandate.investor_type)) {
      blockers.push(`${mandate.investor_type}: minimum allocations are typically larger than a fund of this scale can accept.`);
    }

    const fits = ['family_office', 'individual', 'fund_of_funds', 'emerging_manager_program'];
    const goodType = fits.includes(mandate.investor_type);
    const mutual_fit = blockers.length ? 'mismatch' : goodType ? 'strong' : 'partial';

    return {
      mutual_fit,
      why: blockers.length
        ? 'We are not the right shape for this mandate. Fund I is closed and Fund II is not yet defined, so there is nothing being offered either way.'
        : 'Fund I is closed to new commitments and Fund II is not yet defined — there is no offering here. On mandate shape you look like the kind of LP this manager is built for, so the useful next step is to see the Fund I track record and be told when Fund II is defined.',
      we_fit_you: blockers.length ? [] : [
        'Emerging manager — Fund I is the first institutional vehicle.',
        'Pre-seed and seed, B2B software with applied AI.',
        'Differentiated by the Support Partner model: a full-time operator embedded in each company, paid by the fund.',
        'Partners are operators, not only investors.'
      ],
      you_fit_us: goodType ? [`${mandate.investor_type} is within the LP profile this fund is built for.`] : [],
      blockers,
      what_we_can_share: [
        'Strategy, team, portfolio and the Support Partner model — everything already on the website.',
        'That Fund I is closed and no offering is currently being made.'
      ],
      what_requires_verification: [
        'Fund I track record and portfolio performance detail.',
        'Portfolio construction and deployment pace.',
        'Notification when Fund II is defined.'
      ],
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
