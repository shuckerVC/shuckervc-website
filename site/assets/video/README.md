# Founder Focus video — required asset

Place the teaser MP4 here:

**`shuckerVC_Support_Partner_Teaser.mp4`** (1384 × 2460 portrait, ~9:16, ~27 MB)

The player in the Founder Focus section already points at
`assets/video/shuckerVC_Support_Partner_Teaser.mp4` with
`<video controls playsinline preload="metadata">`. Drop the file in and it works
with no code changes. Because it's ~27 MB, prefer serving it from the static host /
CDN (GitHub Pages / Netlify / Vercel all serve it fine); `preload="metadata"` keeps
the browser from downloading it all up front.
