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

const BASE = 'https://shuckervc.github.io/shuckervc-website';

/* ------------------------------------------------------------
   The ready tools. Deliberately small — they are file lookups.
   ------------------------------------------------------------ */

const TOOLS = {
  get_fund_facts({ fields } = {}) {
    const { _comment, _needs_confirmation, ...card } = fund;
    // Publish the gaps explicitly. An agent told "we don't publish this" will
    // say so; an agent told nothing will estimate.
    const out = {
      ...card,
      unpublished: (_needs_confirmation || []).map((s) => s.split(' — ')[0])
    };
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
