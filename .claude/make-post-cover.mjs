#!/usr/bin/env node
/**
 * make-post-cover.mjs — Generate a branded cover image for an Insights post.
 *
 * Creates a post cover matching the shuckerVC brand (dark bg, gold accents) with
 * the post title, category, and optionally the author byline.
 *
 * Usage:
 *   node .claude/make-post-cover.mjs --id lodg --title "Welcome Lodg" --tag News [--author "shuckerVC"]
 *
 * Outputs to: site/assets/insights/<id>.jpg
 */
import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Parse CLI args
const args = process.argv.slice(2);
const opts = {};
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    const key = args[i].slice(2);
    opts[key] = args[i + 1];
    i++;
  }
}

if (!opts.id || !opts.title || !opts.tag) {
  console.error('Usage: node make-post-cover.mjs --id <id> --title <title> --tag <tag> [--author <author>]');
  process.exit(1);
}

const { id, title, tag, author } = opts;

// Brand colors from shuckerVC design system
const colors = {
  // Core brand
  bg: '#111111',        // ink-900 (primary text / dark surfaces)
  bgSecondary: '#2a2a2a', // ink-700 (secondary dark)
  gold: '#ffcd3c',      // gold-400 (PRIMARY brand gold)
  goldDeep: '#ffc009',  // gold-500 (deep amber)
  goldLight: '#ffda6f', // gold-300 (light gold)
  white: '#ffffff',

  // Secondary accents
  teal: '#00b49b',      // teal-600 (preferred accent)
  sand: '#b5aa99',      // sand-300 (warm stone)
  bark: '#4e4637',      // bark-700 (olive-brown)

  // Status colors
  success: '#1f9d6b',   // Algorized green
  warning: '#e8a317',   // Warning amber
  danger: '#d2452b',    // Danger red
  info: '#00b49b',      // Teal (same as accent)

  // Tag styling per category
  tagBg: {
    'News': '#e6e2d9',           // warm hairline (gray-200)
    'Perspective': '#f4f1ea',    // warm off-white surface (gray-100)
    'White paper': '#faf8f2',    // page tint (gray-50)
    'Newsletter': '#f4f1ea',     // warm surface
  },
  tagText: {
    'News': '#111111',           // ink-900
    'Perspective': '#3d3b37',    // ink-600
    'White paper': '#3d3b37',    // ink-600
    'Newsletter': '#111111',     // ink-900
  },
};

// Create canvas
const width = 1200;
const height = 630;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Dark background (brand ink-900)
ctx.fillStyle = colors.bg;
ctx.fillRect(0, 0, width, height);

// Add brand gold accent bar on left (gold-400)
ctx.fillStyle = colors.gold;
ctx.fillRect(0, 0, 8, height);

// Subtle gradient overlay for depth
const grad = ctx.createLinearGradient(0, 0, width, height);
grad.addColorStop(0, 'rgba(255, 205, 60, 0.02)'); // Subtle gold tint top-left
grad.addColorStop(1, 'rgba(0, 0, 0, 0.1)');      // Subtle dark bottom-right
ctx.fillStyle = grad;
ctx.fillRect(0, 0, width, height);

// No baked category badge — the site cards + article reader overlay the
// category, so the title gets the whole frame.

// Subtle concentric ring motif (lower-right) for balance
for (let i = 0; i < 5; i++) {
  ctx.beginPath();
  ctx.strokeStyle = `rgba(255, 205, 60, ${Math.max(0.03, 0.12 - i * 0.016)})`;
  ctx.lineWidth = 2;
  ctx.arc(1090, 250, 70 + i * 46, 0, Math.PI * 2);
  ctx.stroke();
}

// Title — auto-size to fill the frame; left aligned, block vertically centred
const titleMaxWidth = 950;
let titleFontSize = 100;
let lines = [];
for (let s = 100; s >= 54; s -= 2) {
  ctx.font = `bold ${s}px "Liberation Serif", Georgia, "Times New Roman", serif`;
  const words = title.split(' ');
  lines = [];
  let cur = '';
  for (const word of words) {
    const test = cur ? `${cur} ${word}` : word;
    if (ctx.measureText(test).width > titleMaxWidth) {
      if (cur) lines.push(cur);
      cur = word;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  if (lines.length <= 3) { titleFontSize = s; break; }
}
lines = lines.slice(0, 3);

ctx.fillStyle = colors.white;
ctx.font = `bold ${titleFontSize}px "Liberation Serif", Georgia, "Times New Roman", serif`;
ctx.textAlign = 'left';
ctx.textBaseline = 'top';
const lineHeight = Math.round(titleFontSize * 1.12);
const blockH = lineHeight * lines.length;
const titleStartY = Math.round(height * 0.48 - blockH / 2);
lines.forEach((line, i) => ctx.fillText(line, 64, titleStartY + i * lineHeight));

// Gold rule under the title
ctx.fillStyle = colors.gold;
ctx.fillRect(66, titleStartY + blockH + 26, 84, 5);

// Footer: shuckerVC mark (left); byline (right) for a named author only
ctx.fillStyle = colors.gold;
ctx.font = 'bold 23px "Liberation Sans", Arial, sans-serif';
ctx.textAlign = 'left';
ctx.textBaseline = 'alphabetic';
ctx.fillText('shuckerVC', 64, height - 40);
if (author && author.trim().toLowerCase() !== 'shuckervc') {
  ctx.fillStyle = colors.goldLight;
  ctx.font = '19px "Liberation Sans", Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`— ${author}`, width - 56, height - 40);
}

// Save as JPEG
const outDir = path.join(ROOT, 'site/assets/insights');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}
const outPath = path.join(outDir, `${id}.jpg`);

const buffer = canvas.toBuffer('image/jpeg', { quality: 0.9 });
fs.writeFileSync(outPath, buffer);
console.log(`✓ Generated ${outPath} (${width}×${height})`);
