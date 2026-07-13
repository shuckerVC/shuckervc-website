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

// Brand colors
const colors = {
  bg: '#1a1a1a',
  gold: '#d4af37',
  lightText: '#e8e8e8',
  tagBg: {
    'News': '#e8edf3',
    'Perspective': '#f0f4f9',
    'White paper': '#e5f5f7',
    'Newsletter': '#e8edf3',
  },
  tagText: {
    'News': '#35507a',
    'Perspective': '#2d5a6d',
    'White paper': '#1f6b7f',
    'Newsletter': '#3f5b7c',
  },
};

// Create canvas
const width = 1200;
const height = 630;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Dark background with subtle gradient
ctx.fillStyle = colors.bg;
ctx.fillRect(0, 0, width, height);

// Add subtle gold accent bar on left
ctx.fillStyle = colors.gold;
ctx.fillRect(0, 0, 8, height);

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

// Title (centered, with word wrapping)
const titleMaxWidth = width - 100;
const titleFontSize = 56;
const lineHeight = 72;

ctx.fillStyle = colors.lightText;
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

// Author byline (bottom-right)
if (author) {
  ctx.fillStyle = colors.gold;
  ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`— ${author}`, width - 50, height - 40);
}

// shuckerVC mark (bottom-left corner, small)
ctx.fillStyle = colors.gold;
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
