#!/usr/bin/env node
/**
 * build-insights.mjs — offline refresh of site/insights.json WITHOUT a Notion
 * token. Keeps the already-synced live Notion posts (their bodies are cached in
 * insights.json) and re-merges the evergreen essays from scripts/essays.json.
 *
 * Use this after editing scripts/essays.json locally. For a full pull from
 * Notion (bodies + covers), run scripts/sync-notion.mjs with NOTION_TOKEN.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const NOTION_IDS = new Set(['lodg', 'cascade', 'brev']); // live Notion-synced posts

const monthYear = (iso) =>
  new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
const sortKey = (iso) => parseInt(iso.slice(0, 10).replace(/-/g, ''), 10);

const current = JSON.parse(await readFile(join(ROOT, 'site/insights.json'), 'utf8'));
const essays = JSON.parse(await readFile(join(ROOT, 'scripts/essays.json'), 'utf8'));

const notionPosts = current.posts.filter((p) => NOTION_IDS.has(p.id));
const haveTitle = new Set(notionPosts.map((p) => p.title.toLowerCase().trim()));

const merged = [...notionPosts];
for (const e of essays.essays || []) {
  if (haveTitle.has((e.title || '').toLowerCase().trim())) continue;
  merged.push({ ...e, sort: sortKey(e.date), date: monthYear(e.date) });
}
merged.sort((a, b) => b.sort - a.sort);

const out = { _generated: current._generated, posts: merged };
await writeFile(join(ROOT, 'site/insights.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`Wrote site/insights.json with ${merged.length} posts (${notionPosts.length} Notion + ${merged.length - notionPosts.length} essays).`);
