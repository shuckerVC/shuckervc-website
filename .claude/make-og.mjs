// Generate a 1200x630 social share image: the gold+white shuckerVC lockup
// centered on the brand ink background, with a soft gold glow. Pure JS (pngjs).
import { PNG } from 'pngjs';
import { readFileSync, writeFileSync } from 'node:fs';

const W = 1200, H = 630;
const out = new PNG({ width: W, height: H });

// Brand ink background with a subtle warm radial toward upper-right (echoes the hero).
const cx = W * 0.68, cy = H * 0.42, R = W * 0.72;
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const d = Math.hypot(x - cx, y - cy) / R;
    const t = Math.max(0, 1 - d);              // 1 at center → 0 at edge
    const base = 17;                            // #111
    const warm = Math.round(base + 10 * t * t); // lift toward #1b1a17-ish
    const i = (y * W + x) * 4;
    out.data[i] = warm; out.data[i + 1] = Math.round(warm * 0.98); out.data[i + 2] = Math.round(warm * 0.9); out.data[i + 3] = 255;
  }
}

// Soft gold glow behind where the mark sits.
const gx = W * 0.5, gy = H * 0.46, gR = 320;
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const d = Math.hypot(x - gx, y - gy) / gR;
    if (d >= 1) continue;
    const a = Math.pow(1 - d, 2) * 0.10;        // faint
    const i = (y * W + x) * 4;
    out.data[i]     = Math.round(out.data[i]     * (1 - a) + 255 * a);
    out.data[i + 1] = Math.round(out.data[i + 1] * (1 - a) + 205 * a);
    out.data[i + 2] = Math.round(out.data[i + 2] * (1 - a) + 60 * a);
  }
}

// Composite the lockup (gold mark + white wordmark), centered, via bilinear downscale.
const src = PNG.sync.read(readFileSync('site/assets/logo/lockup-gold-white.png'));
const targetW = 820;
const scale = targetW / src.width;
const targetH = Math.round(src.height * scale);
const ox = Math.round((W - targetW) / 2), oy = Math.round((H - targetH) / 2);
const clamp = (v, hi) => v < 0 ? 0 : v > hi ? hi : v;
for (let y = 0; y < targetH; y++) {
  for (let x = 0; x < targetW; x++) {
    const sx = (x + 0.5) / scale - 0.5, sy = (y + 0.5) / scale - 0.5;
    const x0 = clamp(Math.floor(sx), src.width - 1), y0 = clamp(Math.floor(sy), src.height - 1);
    const x1 = Math.min(src.width - 1, x0 + 1), y1 = Math.min(src.height - 1, y0 + 1);
    const fx = sx - Math.floor(sx), fy = sy - Math.floor(sy);
    const samp = (c) => {
      const p00 = src.data[(y0 * src.width + x0) * 4 + c], p10 = src.data[(y0 * src.width + x1) * 4 + c];
      const p01 = src.data[(y1 * src.width + x0) * 4 + c], p11 = src.data[(y1 * src.width + x1) * 4 + c];
      return (p00 * (1 - fx) + p10 * fx) * (1 - fy) + (p01 * (1 - fx) + p11 * fx) * fy;
    };
    const a = samp(3) / 255;
    if (a <= 0) continue;
    const di = ((oy + y) * W + (ox + x)) * 4;
    out.data[di]     = Math.round(samp(0) * a + out.data[di]     * (1 - a));
    out.data[di + 1] = Math.round(samp(1) * a + out.data[di + 1] * (1 - a));
    out.data[di + 2] = Math.round(samp(2) * a + out.data[di + 2] * (1 - a));
    out.data[di + 3] = 255;
  }
}

writeFileSync('site/assets/og-image.png', PNG.sync.write(out));
console.log(`wrote site/assets/og-image.png (${W}x${H}), lockup ${targetW}x${targetH} centered`);
