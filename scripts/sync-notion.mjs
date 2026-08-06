#!/usr/bin/env node
/**
 * sync-notion.mjs — Build-time sync of the shuckerVC Insights feed.
 *
 * Pulls posts from the Notion "🥁 shuckerVC Blog" database, maps them to the
 * shape the site's Insights section renders, merges in the evergreen essays
 * (scripts/essays.json, incl. full bodies), and writes site/insights.json.
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
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { spawn } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const TOKEN = process.env.NOTION_TOKEN;
const DB_ID = process.env.NOTION_BLOG_DB_ID || '20211beb3a438102811cea97a109c25e';
const NOTION_VERSION = '2022-06-28';
const WPM = 200;

// Map a Notion Editor (person) user-id -> byline. Extend as needed.
const EDITOR_MAP = {
  // Add editor mappings here: 'notion-user-uuid': { author: 'Name', initials: 'XX' }
  // Run sync once to see unknown editor IDs logged to console.
};
const DEFAULT_AUTHOR = { author: 'shuckerVC', initials: 'sV' };
const unknownEditors = new Set();

// Stable, friendly post ids (used in deep-links #<id> and cover filenames
// assets/insights/<id>.jpg). Keep these matching the committed covers so a live
// sync doesn't change URLs or drop featured images. Unmapped titles fall back to
// a slug. Add new posts here as they're published.
const TITLE_ID = {
  'Welcome Lodg': 'lodg',
  'Welcome Cascade': 'cascade',
  'Welcome Brev.io': 'brev',
  'Notes from Liquidity 2026': 'liquidity-2026',
};
const slugify = (t) => (t || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24) || 'post';

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

// sharp is optional (installed ad hoc in the sync workflow). Without it the
// sync still works — covers just skip the responsive-variant step.
let sharp = null;
try { sharp = (await import('sharp')).default; } catch { /* variants skipped */ }
const COVER_WIDTHS = [480, 960, 1600];

// Resolve a post's featured cover from its Notion page cover (the header
// image). Both external and Notion-hosted covers are DOWNLOADED (hosted URLs
// expire; hotlinks rot) and re-encoded into responsive JPEG variants:
//   assets/insights/<id>.jpg (1600w) + <id>-960.jpg + <id>-480.jpg
// The post carries coverSet (a ready srcset string) so the front-end can let
// the browser pick a size. Encoding is deterministic, so an unchanged Notion
// cover produces byte-identical files and the sync's commit-only-on-change
// behavior is preserved.
async function coverFor(page, id) {
  const c = page.cover;
  if (!c) return undefined;
  const url = c.type === 'external' ? c.external?.url : c.file?.url;
  if (!url) return undefined;
  try {
    const res = await fetch(url);
    if (!res.ok) return c.type === 'external' ? url : undefined;
    const buf = Buffer.from(await res.arrayBuffer());
    if (sharp) {
      // Compose card-ready 16:10 images so the front-end never has to crop
      // (cropping clips typography on designed covers). Two treatments:
      //  - near-card-ratio images (photos/screenshots): plain cover-crop.
      //  - ultra-wide Notion banners (or very tall images): the FULL image
      //    centered over a blurred+darkened fill of itself — text never clips.
      // Editors can force a mode with an optional Notion select property
      // "Cover fit": "Full image" | "Crop". Absent → ratio decides.
      const meta = await sharp(buf).rotate().metadata();
      const r = (meta.width || 1600) / (meta.height || 1000);
      const override = page.properties?.['Cover fit']?.select?.name;
      const banner = override === 'Full image' ? true
        : override === 'Crop' ? false
        : (r > 2.05 || r < 1.15);
      const set = [];
      for (const w of COVER_WIDTHS) {
        const h = Math.round(w / 1.6);
        const name = w === 1600 ? `${id}.jpg` : `${id}-${w}.jpg`;
        const out = join(ROOT, 'site', 'assets', 'insights', name);
        if (!banner) {
          await sharp(buf).rotate().flatten({ background: '#111111' })
            .resize(w, h, { fit: 'cover' })
            .jpeg({ quality: 82, mozjpeg: true }).toFile(out);
        } else {
          const bg = await sharp(buf).rotate().flatten({ background: '#111111' })
            .resize(w, h, { fit: 'cover' })
            .blur(24).modulate({ brightness: 0.55, saturation: 0.9 }).toBuffer();
          const fg = await sharp(buf).rotate().flatten({ background: '#111111' })
            .resize(w, h, { fit: 'inside' }).toBuffer();
          await sharp(bg).composite([{ input: fg, gravity: 'centre' }])
            .jpeg({ quality: 82, mozjpeg: true }).toFile(out);
        }
        set.push(`assets/insights/${name} ${w}w`);
      }
      return { cover: `assets/insights/${id}.jpg`, coverSet: set.join(', ') };
    }
    // sharp unavailable: previous behavior (store original; hotlink external).
    if (c.type === 'external') return url;
    const ext = (new URL(url).pathname.match(/\.(jpe?g|png|webp|gif)$/i) || ['', 'jpg'])[1].toLowerCase();
    const rel = `assets/insights/${id}.${ext}`;
    await writeFile(join(ROOT, 'site', rel), buf);
    return rel;
  } catch {
    return undefined;
  }
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
    console.log(`  page: "${richText(props.Name?.title)}" cat=${category || '∅'} pub=${published || '∅'}`);
    if (!category || !published) continue; // drafts / uncategorised are skipped

    const editorId = props.Editor?.people?.[0]?.id;
    const editorName = props.Editor?.people?.[0]?.name;
    if (editorId && !EDITOR_MAP[editorId]) {
      unknownEditors.add({ id: editorId, name: editorName });
    }
    const byline = EDITOR_MAP[editorId] || DEFAULT_AUTHOR;
    const title = richText(props.Name?.title);
    const id = TITLE_ID[title] || slugify(title);
    const content = await fetchContent(p.id);
    // Notion page cover wins; otherwise fall back to a committed local cover.
    const localCover = `assets/insights/${id}.jpg`;
    const cv = await coverFor(p, id);
    const cover = (cv && typeof cv === 'object' ? cv.cover : cv) ||
      (existsSync(join(ROOT, 'site', localCover)) ? localCover : undefined);
    const coverSet = cv && typeof cv === 'object' ? cv.coverSet : undefined;

    posts.push({
      id,
      tag: category,
      sort: sortKey(published),
      title,
      excerpt: richText(props['AI custom autofill']?.rich_text),
      author: byline.author,
      initials: byline.initials,
      date: monthYear(published),
      read: content.read,
      cover,
      ...(coverSet ? { coverSet } : {}),
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

  if (unknownEditors.size > 0) {
    console.log('Unknown editor IDs found (add to EDITOR_MAP to credit them):');
    unknownEditors.forEach(({ id, name }) => {
      const initials = (name || 'Name').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      console.log(`  '${id}': { author: '${name || 'Name'}', initials: '${initials}' },`);
    });
  }

  // Auto-generate covers for posts missing them (from Notion only; essays should have manual covers)
  const postsNeedingCovers = posts.filter(p => !p.cover && p.url.includes('notion.site'));
  for (const post of postsNeedingCovers) {
    await generateCover(post);
  }

  const out = {
    _generated: 'from Notion 🥁 shuckerVC Blog + scripts/essays.json',
    posts,
  };
  await writeFile(join(ROOT, 'site/insights.json'), JSON.stringify(out, null, 2) + '\n');
  console.log(`Wrote site/insights.json with ${posts.length} posts.`);
}

async function generateCover(post) {
  return new Promise((resolve) => {
    const args = [
      join(ROOT, '.claude/make-post-cover.mjs'),
      '--id', post.id,
      '--title', post.title,
      '--tag', post.tag,
      '--author', post.author,
    ];
    const proc = spawn('node', args, { stdio: 'inherit' });
    proc.on('close', (code) => {
      if (code === 0) {
        post.cover = `assets/insights/${post.id}.jpg`;
      }
      resolve();
    });
  });
}

main().catch((e) => { console.error(e); process.exit(1); });
