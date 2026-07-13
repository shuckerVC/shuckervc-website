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

// Tag badge (top-left, after the accent bar)
const tagBg = colors.tagBg[tag] || '#f0f4f9';
const tagText = colors.tagText[tag] || '#35507a';
const tagPadding = 12;
const tagX = 40;
const tagY = 60;
const tagWidth = 140;
const tagHeight = 40;

ctx.fillStyle = tagBg;
ctx.fillRect(tagX, tagY, tagWidth, tagHeight);
ctx.fillStyle = tagText;
ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText(tag.toUpperCase(), tagX + tagWidth / 2, tagY + tagHeight / 2);

// Title (centered, with word wrapping) — white text on dark ink
const titleMaxWidth = width - 100;
const titleFontSize = 56;
const lineHeight = 72;

ctx.fillStyle = colors.white;
ctx.font = `bold ${titleFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", serif`;
ctx.textAlign = 'left';
ctx.textBaseline = 'top';

const words = title.split(' ');
let lines = [];
let currentLine = '';

for (const word of words) {
  const testLine = currentLine ? `${currentLine} ${word}` : word;
  const metrics = ctx.measureText(testLine);
  if (metrics.width > titleMaxWidth) {
    if (currentLine) lines.push(currentLine);
    currentLine = word;
  } else {
    currentLine = testLine;
  }
}
if (currentLine) lines.push(currentLine);

// Clamp to 3 lines max
lines = lines.slice(0, 3);

const titleStartY = height / 2 - (lines.length * lineHeight) / 2;
lines.forEach((line, i) => {
  ctx.fillText(line, 50, titleStartY + i * lineHeight);
});

// Author byline (bottom-right) — gold accent
if (author) {
  ctx.fillStyle = colors.goldLight;
  ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`— ${author}`, width - 50, height - 40);
}

// shuckerVC mark (bottom-left corner, small) — gold accent
ctx.fillStyle = colors.goldLight;
ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
ctx.textAlign = 'left';
ctx.textBaseline = 'bottom';
ctx.fillText('shuckerVC', 50, height - 40);

// Save as JPEG
const outDir = path.join(ROOT, 'site/assets/insights');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}
const outPath = path.join(outDir, `${id}.jpg`);

const buffer = canvas.toBuffer('image/jpeg', { quality: 0.9 });
fs.writeFileSync(outPath, buffer);
console.log(`✓ Generated ${outPath} (${width}×${height})`);
