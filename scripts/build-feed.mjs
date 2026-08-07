#!/usr/bin/env node
/**
 * build-feed.mjs — generate site/feed.xml (RSS 2.0) from site/insights.json.
 *
 * Runs after insights.json is (re)built so the feed always mirrors the Writing
 * archive. Invoked by scripts/build-insights.mjs and by the Notion sync
 * workflow. Can also be run standalone:  node scripts/build-feed.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
import { statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// Absolute base for feed links. Update alongside the <link rel=canonical> tags
// if the production domain changes.
const BASE = 'https://shucker.vc/';

const esc = (s) =>
  String(s == null ? '' : s).replace(/[<>&'"]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));

// insights.json stores dates as a YYYYMMDD `sort` int; turn it into RFC-822.
const rfc822 = (sort) => {
  const s = String(sort || '');
  const y = +s.slice(0, 4) || 1970, m = (+s.slice(4, 6) || 1) - 1, d = +s.slice(6, 8) || 1;
  return new Date(Date.UTC(y, m, d, 12)).toUTCString();
};

export async function buildFeed() {
  const data = JSON.parse(await readFile(join(ROOT, 'site/insights.json'), 'utf8'));
  const posts = (data.posts || []).slice().sort((a, b) => b.sort - a.sort);
  // Derive lastBuildDate from the newest post (not the wall clock) so the feed
  // only changes when content changes — otherwise the hourly sync would commit
  // and redeploy every run just because the timestamp moved.
  const newest = posts[0];
  const lastBuild = newest ? rfc822(newest.sort) : new Date(0).toUTCString();

  const items = posts.map((p) => {
    const link = BASE + 'writing#' + encodeURIComponent(p.id);
    let enclosure = '';
    if (p.cover) {
      const rel = p.cover.replace(/^\/+/, '');
      let len = 0;
      try { len = statSync(join(ROOT, 'site', rel)).size; } catch { /* missing on disk */ }
      const type = rel.endsWith('.png') ? 'image/png' : 'image/jpeg';
      enclosure = `      <enclosure url="${esc(BASE + rel)}" length="${len}" type="${type}" />`;
    }
    return [
      '    <item>',
      `      <title>${esc(p.title)}</title>`,
      `      <link>${esc(link)}</link>`,
      `      <guid isPermaLink="true">${esc(link)}</guid>`,
      p.tag ? `      <category>${esc(p.tag)}</category>` : '',
      p.author ? `      <dc:creator>${esc(p.author)}</dc:creator>` : '',
      `      <pubDate>${rfc822(p.sort)}</pubDate>`,
      `      <description>${esc(p.excerpt || '')}</description>`,
      enclosure,
      '    </item>'
    ].filter(Boolean).join('\n');
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>shuckerVC — Writing</title>
    <link>${BASE}writing</link>
    <atom:link href="${BASE}feed.xml" rel="self" type="application/rss+xml" />
    <description>White papers, perspectives, and portfolio news from the shuckerVC team.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
${items}
  </channel>
</rss>
`;

  await writeFile(join(ROOT, 'site/feed.xml'), xml);
  return posts.length;
}

// Run standalone when invoked directly.
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  buildFeed().then((n) => console.log(`Wrote site/feed.xml with ${n} items.`));
}
