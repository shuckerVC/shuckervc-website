#!/usr/bin/env node
/* ============================================================
   build-agent-surfaces.mjs

   Makes the site legible to something that fetches it without running
   JavaScript — a research agent, a crawler, a reader mode, curl.

   Today the homepage ships empty containers (#portGrid, #teamGrid, the
   insights slots) that app.js fills at runtime, so a plain GET returns
   headings and no content. Rather than pre-render markup that app.js would
   immediately throw away (brittle, and it would drift), this script publishes
   the *data* — which is what a machine wants anyway — plus prose twins of the
   pages for anything that prefers text.

   Reads (canonical, hand-edited):
     site/data/fund.json        the fund card
     site/data/portfolio.json   companies, founders, links
     site/data/team.json        partners
     site/data/roles.json       open roles (JobPosting emitted only when published)
     site/insights.json         Notion-synced writing (see sync-notion.mjs)
     site/press.json            per-company press coverage
     site/v2/index.html         prose for the thesis + support-model sections

   Writes (all generated — do not hand-edit):
     site/llms.txt              index: what exists and where the canonical copy is
     site/llms-full.txt         the whole corpus in one fetch
     site/robots.txt            explicit allow for agent crawlers + pointers
     site/sitemap.xml
     site/thesis.md  site/portfolio.md  site/team.md  site/writing.md
     …and, injected between markers into site/index.html, site/v2/index.html
     and site/writing.html: JSON-LD plus the <script type="application/json">
     data blocks that both app.js files now read.

   Run: npm run agents
   ============================================================ */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = path.join(ROOT, 'site');

/* The deployed origin. This is a GitHub *project* page, so everything lives
   under /shuckervc-website/. Conventions like /llms.txt and /.well-known/ are
   defined at the domain root, so agents looking for them by convention will
   miss ours until the site moves to an apex domain — at which point only this
   constant changes. */
const BASE = 'https://shuckervc.github.io/shuckervc-website';

const readJSON = (p) => JSON.parse(fs.readFileSync(path.join(SITE, p), 'utf8'));
const write = (rel, body) => {
  fs.writeFileSync(path.join(SITE, rel), body);
  console.log('  wrote site/' + rel + '  (' + body.length.toLocaleString() + ' bytes)');
};

const fund = readJSON('data/fund.json');
const portfolio = readJSON('data/portfolio.json').companies;
const team = readJSON('data/team.json').members;
const roles = fs.existsSync(path.join(SITE, 'data/roles.json')) ? readJSON('data/roles.json').roles : [];
const posts = readJSON('insights.json').posts || [];
const press = readJSON('press.json');

const abs = (p) => (/^https?:/.test(p) ? p : BASE + '/' + String(p).replace(/^\.\.\//, '').replace(/^\//, ''));
const today = new Date().toISOString().slice(0, 10);

/* ============================================================
   HTML → markdown, for the prose sections we don't want to keep
   a second hand-written copy of.
   ============================================================ */

function section(html, id) {
  const open = html.indexOf('id="' + id + '"');
  if (open < 0) return '';
  const start = html.lastIndexOf('<section', open);
  // Walk forward to the matching </section>, honouring nesting.
  let depth = 0, i = start;
  const re = /<\/?section\b/gi;
  re.lastIndex = start;
  let m;
  while ((m = re.exec(html))) {
    depth += m[0][1] === '/' ? -1 : 1;
    if (depth === 0) { i = m.index + m[0].length; break; }
  }
  return html.slice(start, html.indexOf('>', i) + 1);
}

const entities = (s) => s
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

/* A few blocks carry their meaning in divs rather than prose tags — the
   Support-Model vignettes ("Finance ops · 2h/week of founder time · …") and the
   strategy list's label. Reshape those into prose tags before the walk, or the
   markdown loses the actual claims and keeps only the supporting sentence. */
function reshape(html) {
  return html
    .replace(/<article class="vignette"[\s\S]*?<\/article>/gi, (block) => {
      const pick = (cls) => {
        const m = block.match(new RegExp('<[^>]*class="' + cls + '"[^>]*>([\\s\\S]*?)<\\/', 'i'));
        return m ? entities(m[1].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim() : '';
      };
      const body = block.match(/<div class="vignette-body"[^>]*>([\s\S]*?)<\/div>/i);
      return `<p><b>${pick('vignette-cat')}</b> — ${pick('vignette-stat')} ${pick('vignette-desc')}. ` +
        `${body ? entities(body[1].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim() : ''}</p>`;
    })
    .replace(/<div class="strat-look-label"[^>]*>([\s\S]*?)<\/div>/gi, '<h3>$1</h3>');
}

function prose(html) {
  const out = [];
  // Drop comments and anything non-prose before walking.
  const cleaned = reshape(html).replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style|video|canvas)[\s\S]*?<\/\1>/gi, '');
  const re = /<(h2|h3|p|li|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(cleaned))) {
    const tag = m[1].toLowerCase();
    const text = entities(m[2].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
    if (!text) continue;
    if (tag === 'h2') out.push('\n## ' + text + '\n');
    else if (tag === 'h3') out.push('\n### ' + text + '\n');
    else if (tag === 'li') out.push('- ' + text);
    else if (tag === 'blockquote') out.push('\n> ' + text + '\n');
    else out.push('\n' + text + '\n');
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

const v2html = fs.readFileSync(path.join(SITE, 'v2/index.html'), 'utf8');
const thesisProse = prose(section(v2html, 'strategy'));
const focusProse = prose(section(v2html, 'focus'));

/* ============================================================
   Prose twins
   ============================================================ */

const GENERATED = (src) => `<!-- Generated by scripts/build-agent-surfaces.mjs from ${src}. Do not hand-edit. -->\n`;
const MDNOTE = (src) => `<!-- Generated from ${src} by scripts/build-agent-surfaces.mjs — do not hand-edit. -->\n\n`;

function fundFacts() {
  const f = fund.fund, inv = fund.investing;
  const usd = (n) => '$' + (n >= 1e6 ? (n / 1e6) + 'M' : (n / 1e3) + 'K');
  const lines = [
    `- **Fund:** ${f.name} (${f.legal_name})`,
    `- **Fund size:** ${usd(f.size_usd)}`,
    `- **Check size:** up to ${usd(f.check_size_usd_max)}`,
    `- **Target portfolio:** ${f.target_companies} companies (${f.companies_backed} backed so far)`,
    `- **Stage:** ${inv.stage.join(', ')}`,
    `- **Sectors:** ${inv.sectors.join(', ')}`,
    `- **Geography:** ${inv.geography_focus} — ${inv.geography_note}`,
    `- **HQ:** ${fund.hq}`,
    `- **Prior track record:** ${f.prior_track_record.note}`,
    `- **What makes us different:** ${fund.differentiator.summary}`,
    `- **Submit a company:** ${fund.contact.submit_company}`,
    `- **Last updated:** ${fund.updated}`
  ];
  if (inv.leads_rounds !== null) lines.splice(5, 0, `- **Leads rounds:** ${inv.leads_rounds ? 'yes' : 'no — we co-invest'}`);
  if (inv.not_a_fit) lines.push(`- **Not a fit:** ${inv.not_a_fit.join(', ')}`);
  return lines.join('\n');
}

function companyMd(c) {
  const founders = (c.founders || []).map((f) => `${f.name} (${f.note})${f.url ? ' — ' + f.url : ''}`);
  const mentions = (press[c.id] || []).map((p) => `  - ${p.outlet}: ${p.title} — ${p.url}`);
  return [
    `### ${c.name}`,
    ``,
    `${c.desc}`,
    ``,
    `- **Category:** ${c.cat}`,
    `- **Tags:** ${(c.tags || []).join(', ')}`,
    c.site ? `- **Website:** ${c.site}` : null,
    c.coInvestor ? `- **Co-investors:** ${c.coInvestor}` : null,
    c.milestone ? `- **Milestone:** ${c.milestone}` : null,
    founders.length ? `- **Founders:** ${founders.join('; ')}` : null,
    mentions.length ? `- **Press:**\n${mentions.join('\n')}` : null
  ].filter(Boolean).join('\n');
}

const portfolioMd = MDNOTE('site/data/portfolio.json + site/press.json') + [
  `# shuckerVC portfolio`,
  ``,
  `${portfolio.length} companies in ${fund.fund.name}. Updated ${fund.updated}.`,
  ``,
  ...portfolio.map(companyMd)
].join('\n') + '\n';

const teamMd = MDNOTE('site/data/team.json') + [
  `# shuckerVC team`,
  ``,
  ...team.slice().sort((a, b) => a.sortOrder - b.sortOrder).map((m) => [
    `### ${m.name} — ${m.title}`,
    ``,
    `${m.tagline}. ${m.bio}`,
    m.linkedin ? `\n- **LinkedIn:** ${m.linkedin}` : null
  ].filter(Boolean).join('\n'))
].join('\n') + '\n';

const thesisMd = MDNOTE('site/v2/index.html + site/data/fund.json') + [
  `# shuckerVC — thesis and support model`,
  ``,
  `## Fund facts`,
  ``,
  fundFacts(),
  ``,
  `# Strategy`,
  ``,
  thesisProse,
  ``,
  `# The Support Partner model`,
  ``,
  focusProse
].join('\n') + '\n';

const sorted = posts.slice().sort((a, b) => b.sort - a.sort);
const bodyText = (p) => (p.body || []).map((b) =>
  b.t === 'h' ? `\n## ${b.text}\n` : b.t === 'q' ? `\n> ${b.text}\n` : b.text).join('\n\n');

const writingMd = MDNOTE('site/insights.json') + [
  `# shuckerVC writing`,
  ``,
  `${sorted.length} pieces. Full text below; canonical HTML at ${BASE}/writing.html — RSS at ${BASE}/feed.xml.`,
  ``,
  ...sorted.map((p) => [
    `---`,
    ``,
    `## ${p.title}`,
    ``,
    `*${p.tag} · ${p.author} · ${p.date} · ${p.read}*`,
    ``,
    `${p.excerpt}`,
    ``,
    `Read: ${BASE}/writing.html#${p.id}`,
    p.body && p.body.length ? `\n${bodyText(p)}` : null
  ].filter(Boolean).join('\n'))
].join('\n') + '\n';

write('portfolio.md', portfolioMd);
write('team.md', teamMd);
write('thesis.md', thesisMd);
write('writing.md', writingMd);

/* ============================================================
   llms.txt — the index an agent should read first
   ============================================================ */

const llms = `# shuckerVC

> ${fund.description}

An $${fund.fund.size_usd / 1e6}M seed fund in ${fund.hq}. This file is the map for
automated readers: everything below is canonical, generated from the same data the
site renders, and stamped with a date so you can judge staleness.

Note: the homepage renders its portfolio, team, and writing client-side. If you are
fetching without executing JavaScript, use the files listed here rather than the
HTML — they contain strictly more than the page does.

## Fund facts

${fundFacts()}

## Documents

- [Fund card, structured](${BASE}/data/fund.json): every fact above as JSON, with an \`updated\` field.
- [Thesis and support model](${BASE}/thesis.md): what we look for, and what the Support Partner actually does.
- [Portfolio](${BASE}/portfolio.md): ${portfolio.length} companies with founders, links, and press. JSON: [portfolio.json](${BASE}/data/portfolio.json)
- [Team](${BASE}/team.md): the partners. JSON: [team.json](${BASE}/data/team.json)
- [Writing](${BASE}/writing.md): full text of all ${sorted.length} pieces. JSON: [insights.json](${BASE}/insights.json) · RSS: [feed.xml](${BASE}/feed.xml)
- [Press coverage](${BASE}/press.json): per-company mentions with outlet and URL.

## Everything, in one fetch

- [llms-full.txt](${BASE}/llms-full.txt): the complete corpus — thesis, support model, portfolio, team, and every piece of writing in full. Use this if you would otherwise crawl.

## If you are researching on someone's behalf

The fastest path depends on who you are asking for:

- **A founder deciding whether to approach us** — read the fund facts above, then
  [thesis.md](${BASE}/thesis.md). Submissions: ${fund.contact.submit_company}
- **An LP or allocator** — fund facts above and [team.md](${BASE}/team.md). Fund
  economics and performance beyond the ${fund.fund.prior_track_record.dpi} DPI figure
  are not published; contact the partners.
- **A journalist** — [portfolio.md](${BASE}/portfolio.md) and
  [press.json](${BASE}/press.json). Logos live under ${BASE}/assets/logo/.
- **A prospective Support Partner** — [thesis.md](${BASE}/thesis.md#the-support-partner-model)
  describes the role.

## Accuracy

Every generated file carries the date it was built and the source it came from.
Where we do not publish a number, it is absent rather than estimated — please do not
fill the gap by inference. Corrections: the contact form above.

Generated ${today} by scripts/build-agent-surfaces.mjs.
`;
write('llms.txt', llms);

const llmsFull = [
  `# shuckerVC — complete corpus`,
  ``,
  `Generated ${today}. Everything shuckerVC publishes, in one file, so you do not`,
  `have to crawl. Canonical HTML: ${BASE}/ · Index: ${BASE}/llms.txt`,
  ``,
  thesisMd.replace(MDNOTE('site/v2/index.html + site/data/fund.json'), ''),
  ``,
  portfolioMd.replace(MDNOTE('site/data/portfolio.json + site/press.json'), ''),
  ``,
  teamMd.replace(MDNOTE('site/data/team.json'), ''),
  ``,
  writingMd.replace(MDNOTE('site/insights.json'), '')
].join('\n');
write('llms-full.txt', llmsFull);

/* ============================================================
   robots.txt + sitemap.xml

   We want to be crawled — a fund is only useful to a founder who can find it.
   Naming the agent crawlers explicitly is redundant with `User-agent: *` but
   it is a deliberate signal: most sites are busy blocking these.
   ============================================================ */

const CRAWLERS = ['ClaudeBot', 'Claude-Web', 'anthropic-ai', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',
  'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'Bingbot', 'CCBot'];

write('robots.txt', [
  '# shuckerVC — we want to be read, including by agents.',
  '# Start with /llms.txt: it indexes machine-readable copies of everything the',
  '# homepage renders client-side.',
  '',
  'User-agent: *',
  'Allow: /',
  '',
  ...CRAWLERS.flatMap((ua) => ['User-agent: ' + ua, 'Allow: /', '']),
  'Sitemap: ' + BASE + '/sitemap.xml',
  ''
].join('\n'));

const PAGES = ['/', '/v2/', '/writing.html', '/llms.txt', '/thesis.md', '/portfolio.md', '/team.md', '/writing.md'];
write('sitemap.xml', [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...PAGES.map((p) => `  <url><loc>${BASE}${p}</loc><lastmod>${today}</lastmod></url>`),
  '</urlset>',
  ''
].join('\n'));

/* ============================================================
   Injection into the HTML pages
   ============================================================ */

const BEGIN = '  <!-- BEGIN generated: agent surfaces — scripts/build-agent-surfaces.mjs. Do not hand-edit. -->';
const END = '  <!-- END generated: agent surfaces -->';

/* JSON embedded in HTML must not contain a literal `</script>`; escaping `<`
   is the standard, parser-safe way to guarantee that. */
const embed = (id, value) =>
  `  <script type="application/json" id="${id}">${JSON.stringify(value).replace(/</g, '\\u003c')}</script>`;

const ld = (obj) =>
  `  <script type="application/ld+json">${JSON.stringify(obj, null, 2).replace(/</g, '\\u003c')}</script>`;

function inject(relFile, block) {
  const file = path.join(SITE, relFile);
  let html = fs.readFileSync(file, 'utf8');
  const payload = [BEGIN, block, END, ''].join('\n');
  const b = html.indexOf(BEGIN);
  if (b >= 0) {
    const e = html.indexOf(END, b) + END.length + 1;
    html = html.slice(0, b) + payload.slice(0, -1) + html.slice(e);
  } else {
    html = html.replace('</head>', payload + '</head>');
  }
  fs.writeFileSync(file, html);
  console.log('  injected into site/' + relFile);
}

const people = team.slice().sort((a, b) => a.sortOrder - b.sortOrder).map((m) => ({
  '@type': 'Person',
  name: m.name.replace(/\s*"[^"]*"\s*/, ' ').replace(/\s+/g, ' ').trim(),
  alternateName: m.name,
  jobTitle: m.title,
  description: m.bio,
  image: abs(m.photo),
  sameAs: m.linkedin ? [m.linkedin] : undefined,
  worksFor: { '@type': 'Organization', name: 'shuckerVC' }
}));

const organization = {
  '@context': 'https://schema.org',
  '@type': ['Organization', 'FinancialService'],
  name: fund.name,
  alternateName: 'shucker Ventures',
  url: fund.url,
  logo: BASE + '/assets/logo/logo-color.png',
  image: BASE + '/assets/og-image.png',
  description: fund.description,
  slogan: fund.tagline,
  foundingDate: String(fund.founded),
  address: { '@type': 'PostalAddress', addressRegion: 'CA', addressCountry: 'US', addressLocality: 'Silicon Valley' },
  founder: people.filter((p) => /Co-founder/i.test(p.jobTitle)),
  employee: people,
  knowsAbout: fund.investing.sectors,
  sameAs: fund.sameAs,
  makesOffer: {
    '@type': 'Offer',
    name: fund.differentiator.name,
    description: fund.differentiator.summary,
    url: fund.differentiator.url
  }
};

const portfolioList = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'shuckerVC portfolio',
  numberOfItems: portfolio.length,
  itemListElement: portfolio.map((c, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    item: {
      '@type': 'Organization',
      name: c.name,
      url: c.site || undefined,
      description: c.desc,
      knowsAbout: c.cat,
      founder: (c.founders || []).map((f) => ({
        '@type': 'Person', name: f.name, jobTitle: f.note, sameAs: f.url ? [f.url] : undefined
      })),
      funder: { '@type': 'Organization', name: 'shuckerVC', url: fund.url }
    }
  }))
};

/* JobPosting is only emitted for roles explicitly marked published — an invalid
   or speculative posting is worse than none, both for candidates and for the
   search engines that validate this markup. */
const jobPostings = roles.filter((r) => r.published).map((r) => ({
  '@context': 'https://schema.org',
  '@type': 'JobPosting',
  title: r.title,
  description: r.description,
  datePosted: r.datePosted,
  validThrough: r.validThrough,
  employmentType: r.employmentType,
  directApply: false,
  url: r.url,
  hiringOrganization: { '@type': 'Organization', name: 'shuckerVC', sameAs: fund.url, logo: BASE + '/assets/logo/logo-color.png' },
  jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: r.location, addressCountry: r.country } },
  applicantLocationRequirements: r.remote ? { '@type': 'Country', name: r.country } : undefined,
  jobLocationType: r.remote ? 'TELECOMMUTE' : undefined
}));

const homeBlock = [
  '  <!-- Machine-readable index. Agents: start at /llms.txt — it maps everything below. -->',
  `  <link rel="alternate" type="text/plain" href="${BASE}/llms.txt" title="llms.txt — machine-readable index">`,
  `  <link rel="alternate" type="text/markdown" href="${BASE}/thesis.md" title="Thesis and support model (markdown)">`,
  ld(organization),
  ld(portfolioList),
  ...jobPostings.map(ld),
  '',
  '  <!-- Canonical data, read by app.js and available to anything that fetches this page',
  '       without running it. Sources: site/data/*.json. -->',
  embed('sv-data-portfolio', portfolio),
  embed('sv-data-team', team),
  embed('sv-data-fund', fund)
].join('\n');

inject('index.html', homeBlock);
inject('v2/index.html', homeBlock);

const articles = sorted.map((p) => ({
  '@context': 'https://schema.org',
  '@type': p.tag === 'News' ? 'NewsArticle' : 'Article',
  headline: p.title,
  description: p.excerpt,
  datePublished: String(p.sort).replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3'),
  author: { '@type': /^[A-Z]{2}$/.test(p.initials || '') && p.author !== 'shuckerVC' ? 'Person' : 'Organization', name: p.author },
  publisher: { '@type': 'Organization', name: 'shuckerVC', logo: { '@type': 'ImageObject', url: BASE + '/assets/logo/logo-color.png' } },
  image: p.cover ? abs(p.cover) : undefined,
  url: `${BASE}/writing.html#${p.id}`,
  mainEntityOfPage: `${BASE}/writing.html#${p.id}`,
  articleSection: p.tag
}));

inject('writing.html', [
  `  <link rel="alternate" type="text/markdown" href="${BASE}/writing.md" title="All writing, full text (markdown)">`,
  `  <link rel="alternate" type="text/plain" href="${BASE}/llms.txt" title="llms.txt — machine-readable index">`,
  ...articles.map(ld)
].join('\n'));

console.log('\nagent surfaces built. ' + portfolio.length + ' companies, ' + team.length + ' people, ' + sorted.length + ' posts.');
if (fund._needs_confirmation && fund._needs_confirmation.length) {
  console.log('\n' + fund._needs_confirmation.length + ' field(s) in site/data/fund.json still need a partner to confirm:');
  fund._needs_confirmation.forEach((f) => console.log('  · ' + f));
}
