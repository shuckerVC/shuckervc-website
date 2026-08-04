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

## Canonical data + agent-readable surfaces

Portfolio, team, and the fund card now live in **`site/data/*.json`**, not in
`app.js`. `scripts/build-agent-surfaces.mjs` (`npm run agents`) reads them and
writes everything a non-JS reader needs — a research agent, a crawler, reader
mode, `curl`:

- **`llms.txt`** — the index: fund facts, what exists, where the canonical copy is.
- **`llms-full.txt`** — thesis, support model, portfolio, team, and every article
  in full. One fetch instead of a crawl.
- **`thesis.md` · `portfolio.md` · `team.md` · `writing.md`** — prose twins.
  `thesis.md` is extracted from the live `#strategy` / `#focus` markup, so the copy
  can't drift from the page.
- **`robots.txt`** (explicitly allows the agent crawlers) and **`sitemap.xml`**.
- Injected between markers into `index.html`, `v2/index.html`, `writing.html`:
  JSON-LD (`Organization`, `Person`, portfolio `ItemList`, per-article
  `Article`/`NewsArticle`) plus `<script type="application/json">` data blocks.

**Both `app.js` files read those data blocks** (`svData()`), so the JSON is the
single source of truth for the rendered site *and* the machine-readable copies —
they cannot disagree. It's embedded in the HTML rather than fetched, so `file://`
still works.

**After editing `site/data/*.json`, run `npm run agents`.** The deploy workflow
runs it too, so a forgotten rebuild can't ship stale data, and the Notion sync
re-runs it whenever new writing lands.

`site/data/fund.json` carries a `_needs_confirmation` list — fields a partner
still has to confirm (whether we lead, the explicit "not a fit" list, response
SLA). They're deliberately `null` rather than guessed: anything published here
gets quoted back as fact.

Roles live in `site/data/roles.json`. A role only becomes `JobPosting` structured
data — the thing that makes it findable by a candidate's agent or Google Jobs —
when its `published` flag is `true`; the Support Partner role is scaffolded but
off pending real dates and an application URL.

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
