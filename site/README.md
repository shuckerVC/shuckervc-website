# shuckerVC — Interactive Website (build)

A faithful, framework-free recreation of the design prototype in
`../design/`, built as a static site ready to deploy (GitHub Pages /
Netlify / Vercel).

## Structure
- `index.html` — full page markup (nav, hero, strategy, founder focus, portfolio, team, insights, CTA, footer).
- `styles.css` — all styles, wired from the shuckerVC Design System tokens. Single responsive breakpoint at `max-width: 760px`.
- `app.js` — vanilla JS: nav scrim/crossfade, mobile hamburger, reveal-on-scroll, stat counters, cursor spotlight + magnetic buttons, the scroll-driven Founder-Focus timeline, the hero oyster-mark canvas (traces `assets/logo/mark-white.png` and morphs to it on cursor proximity), and the data-driven Portfolio (filter + hover + click-to-open showcase) and Insights (tag filter, featured + list) sections.
- `assets/` — logos + team headshots (copied from the design bundle).

## Writing page + Insights — fed from Notion (build-time sync)
Both the homepage **Insights** section and the full **`writing.html`** page read the
same feed, **`insights.json`**, generated from the Notion **🥁 shuckerVC Blog**
database (`scripts/sync-notion.mjs`, which also pulls each post's article **body**
and **page cover**) and merged with the evergreen essays in `scripts/essays.json`
(Notion wins on id/title collisions). `app.js` and `writing.js` fetch it at runtime
(homepage falls back to an embedded copy for `file://`).

- **`writing.html`** is a standalone archive + in-site reader: filter chips, a
  piece count + newest/oldest sort, a featured card, a 3-up grid, and a full-article
  reader (with a "More writing" carousel). Each post body is the `body` array
  (`{t:'h'|'p'|'q', text}`) in `insights.json`.
- **Deep-linking:** homepage Insights cards link to `writing.html#<id>`, which opens
  that post's reader directly. The "All writing →" link goes to `writing.html`.
- **Covers:** posts with a `cover` show the image; without one, the card/reader shows
  a branded dark "sV" gradient (e.g. the white paper). Covers live in
  `assets/insights/` or come from the Notion page cover via the sync.

- **Category convention:** each Blog post maps to a chip via a **Category** select
  property in Notion (`White paper` / `Perspective` / `News`). A post appears only
  when it has both a Category **and** a Published date (undated rows = drafts).
- **Refresh:** `NOTION_TOKEN=secret_xxx node scripts/sync-notion.mjs` regenerates
  `insights.json`. A GitHub Action (`.github/workflows/sync-notion.yml`) re-syncs
  hourly — add a repo secret **`NOTION_TOKEN`** (an internal Notion integration
  shared with the Blog DB) to enable it.
- **Evergreen essays** (white paper, Support Partner model, Atlas, Algorized) live in
  `scripts/essays.json` with their full `body`, since they aren't Notion blog posts.
  To make one fully Notion-driven, add it as a Blog post (Category set) and remove it
  from that file — the sync dedupes by id/title so Notion wins.

## Portfolio — links + screenshots
Tiles are intentionally text-only (no logos). Opening a company shows a **feature
screenshot of its own website** (`assets/portfolio/<id>.jpg`) plus a "Visit ↗"
link and founder links. Screenshots were captured from each company's live site;
swap any file in `assets/portfolio/` to update. Runreal has no resolvable site, so
it shows a "Product preview coming soon" placeholder until a URL/screenshot is added.

## ⚠️ One asset still to add
- **Founder Focus video** — drop `shuckerVC_Support_Partner_Teaser.mp4`
  into `assets/video/` (1384×2460 portrait, ~27 MB). The `<video>` player
  already points at it; no code change needed. See `assets/video/README.md`.

## Run locally
Any static server works, e.g.:
```
cd site && python3 -m http.server 8000   # http://localhost:8000
```

## Deploy (GitHub Pages)
1. Init a repo at the project root (or move `site/` contents to the repo root / `docs/`).
2. Commit and push to `main`.
3. Enable GitHub Pages → deploy from `main` (root or `/docs`).
4. Verify the video streams and the Insights filter + mobile hamburger work on the live URL.

## Content notes
- Portfolio and Insights data live as arrays at the top of their sections in `app.js` — edit there to update copy or wire to a CMS/Notion later.
- Per the handoff: only Insights post #1 (the SaaS white paper) is verbatim client copy; posts 2–5 use placeholder dates/excerpts pending real Notion content.
