#!/usr/bin/env node
/**
 * sync-notion.mjs — Build-time sync of the shuckerVC Insights feed.
 *
 * Pulls posts from the Notion "🥁 shuckerVC Blog" database, maps them to the
 * shape the site's Insights section renders, merges in the hand-maintained
 * white papers (scripts/whitepapers.json), and writes site/insights.json.
 *
 * Notion is the source of truth for the Welcome/Perspective/News posts.
 * A post appears in the feed only when it has BOTH a Category and a Published
 * date set (undated rows are treated as drafts).
 *
 * Usage:
 *   NOTION_TOKEN=secret_xxx node scripts/sync-notion.mjs
 *
 * Env:
 *   NOTION_TOKEN          (required) Notion internal integration token. The
 *                         integration must be shared with the Blog database.
 *   NOTION_BLOG_DB_ID     (optional) Blog database id. Defaults to the known id.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const TOKEN = process.env.NOTION_TOKEN;
const DB_ID = process.env.NOTION_BLOG_DB_ID || '20211beb3a438102811cea97a109c25e';
const NOTION_VERSION = '2022-06-28';
const WPM = 200;

// Map a Notion Editor (person) user-id -> byline. Extend as needed.
const EDITOR_MAP = {
  // 'notion-user-uuid': { author: 'JP Persico', initials: 'JP' },
};
const DEFAULT_AUTHOR = { author: 'shuckerVC', initials: 'sV' };

if (!TOKEN) {
  console.error('Missing NOTION_TOKEN. Set it and re-run.');
  process.exit(1);
}

async function notion(path, body) {
  const res = await fetch(`https://api.notion.com/v1/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Notion ${path} -> ${res.status} ${await res.text()}`);
  return res.json();
}

const richText = (arr) => (arr || []).map((t) => t.plain_text).join('').trim();

function monthYear(iso) {
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00Z' : ''));
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}
const sortKey = (iso) => parseInt(iso.slice(0, 10).replace(/-/g, ''), 10);

// Pull a page's blocks into reader content ({t:'h'|'p'|'q', text}) and a
// word-count-based read-time estimate. The article H1 is the post title, so we
// map Notion heading_1/2/3 -> 'h', quotes/callouts -> 'q', paragraphs -> 'p'.
async function fetchContent(pageId) {
  const body = [];
  let words = 0, cursor;
  try {
    do {
      const q = cursor ? `?start_cursor=${cursor}` : '';
      const data = await notion(`blocks/${pageId}/children${q}`);
      for (const b of data.results) {
        const rt = b[b.type]?.rich_text;
        const text = Array.isArray(rt) ? richText(rt) : '';
        if (!text) continue;
        words += text.split(/\s+/).filter(Boolean).length;
        if (/^heading_/.test(b.type)) body.push({ t: 'h', text });
        else if (b.type === 'quote' || b.type === 'callout') body.push({ t: 'q', text });
        else if (b.type === 'paragraph') body.push({ t: 'p', text });
      }
      cursor = data.has_more ? data.next_cursor : null;
    } while (cursor);
  } catch { /* fall through with whatever we collected */ }
  return { body, read: `${Math.max(2, Math.round(words / WPM))} min read` };
}

// Resolve a post's featured cover from its Notion page cover. External covers
// are referenced by URL; Notion-hosted (file) covers have expiring URLs, so we
// download them into site/assets/insights/ and reference the local copy.
async function coverFor(page) {
  const c = page.cover;
  if (!c) return undefined;
  if (c.type === 'external') return c.external?.url || undefined;
  if (c.type === 'file' && c.file?.url) {
    try {
      const res = await fetch(c.file.url);
      if (!res.ok) return undefined;
      const ext = (new URL(c.file.url).pathname.match(/\.(jpe?g|png|webp|gif)$/i) || ['', 'jpg'])[1].toLowerCase();
      const id = page.id.replace(/-/g, '').slice(0, 12);
      const rel = `assets/insights/${id}.${ext}`;
      await writeFile(join(ROOT, 'site', rel), Buffer.from(await res.arrayBuffer()));
      return rel;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

async function main() {
  // Query all pages in the Blog DB.
  const pages = [];
  let cursor;
  do {
    const data = await notion(`databases/${DB_ID}/query`, cursor ? { start_cursor: cursor } : {});
    pages.push(...data.results);
    cursor = data.has_more ? data.next_cursor : null;
  } while (cursor);

  const posts = [];
  for (const p of pages) {
    const props = p.properties || {};
    const category = props.Category?.select?.name;
    const published = props.Published?.date?.start;
    if (!category || !published) continue; // drafts / uncategorised are skipped

    const editorId = props.Editor?.people?.[0]?.id;
    const byline = EDITOR_MAP[editorId] || DEFAULT_AUTHOR;
    const content = await fetchContent(p.id);

    posts.push({
      id: p.id.replace(/-/g, '').slice(0, 12),
      tag: category,
      sort: sortKey(published),
      title: richText(props.Name?.title),
      excerpt: richText(props['AI custom autofill']?.rich_text),
      author: byline.author,
      initials: byline.initials,
      date: monthYear(published),
      read: content.read,
      cover: await coverFor(p),
      url: p.public_url || p.url,
      body: content.body,
    });
  }

  // Merge hand-maintained evergreen essays (white paper, perspectives) that
  // aren't Notion blog posts. Notion wins on id/title collisions.
  const haveId = new Set(posts.map((p) => p.id));
  const haveTitle = new Set(posts.map((p) => p.title.toLowerCase().trim()));
  const essays = JSON.parse(await readFile(join(ROOT, 'scripts/essays.json'), 'utf8'));
  for (const e of essays.essays || []) {
    if (haveId.has(e.id) || haveTitle.has((e.title || '').toLowerCase().trim())) continue;
    posts.push({ ...e, sort: sortKey(e.date), date: monthYear(e.date) });
  }

  posts.sort((a, b) => b.sort - a.sort);

  const out = {
    _generated: `from Notion 🥁 shuckerVC Blog (${new Date().toISOString()})`,
    posts,
  };
  await writeFile(join(ROOT, 'site/insights.json'), JSON.stringify(out, null, 2) + '\n');
  console.log(`Wrote site/insights.json with ${posts.length} posts.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
