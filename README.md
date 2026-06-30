# Handoff: shuckerVC Interactive Website

## Overview
A single-page marketing website for **shuckerVC**, an $8M Bay Area seed fund backing AI-powered B2B software companies. The page presents the fund's thesis, its hands-on "Founder Focus" operating model (including a teaser video), portfolio, team, a filterable **Insights / thought-leadership** section, and a "submit your company" CTA. It is fully responsive (desktop + mobile).

## About the Design Files
The files in `design/` are a **design reference created in HTML** — a working prototype that shows the intended look, content, and behavior. They are **not** meant to be shipped as-is.

The prototype is authored as a "Design Component" (`.dc.html`): a custom HTML template + a `Component` logic class, mounted by the bundled runtime `support.js`. **Do not** try to deploy `support.js` / the `.dc.html` format into production. Instead, **recreate these designs in the target codebase's environment** (React, Next.js, Astro, plain HTML/CSS, etc.) using its established patterns.

If there is no existing codebase yet: this is a static marketing site with light interactivity (nav, tabs/filters, a video, a form). **Astro, Next.js (static export), or even a single hand-written `index.html` + CSS + a small JS file** are all appropriate. Pick one and implement the design faithfully.

### How to view the prototype
Open `design/Shucker VC Website.dc.html` in a browser via a local static server (it loads sibling files, so `file://` won't work):
```
cd design && python3 -m http.server 8000   # then open http://localhost:8000/Shucker%20VC%20Website.dc.html
```

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, copy, and interactions are all intended as shown. Recreate pixel-faithfully, using the design tokens listed below (they come from the bound **shuckerVC Design System** — see `design/_ds/`).

---

## ⚠️ Action required: the Founder Focus video file
The Founder Focus section plays a **self-hosted MP4** (the client explicitly does NOT want a YouTube embed — YouTube Shorts block embedding). The video file is **not included in this bundle** and must be added:

- **Filename:** `shuckerVC_Support_Partner_Teaser.mp4`
- **Expected path (relative to the site root):** `assets/video/shuckerVC_Support_Partner_Teaser.mp4`
- **Dimensions:** 1384 × 2460 (portrait, ~9:16), ~27 MB.
- **Player markup:** native `<video controls playsinline preload="metadata">` in a portrait frame (`aspect-ratio: 1384 / 2460`, `max-width: 348px`, centered). On mobile it goes full-width within the column.
- Because the file is ~27 MB, prefer serving it from the static host / CDN rather than inlining. Use `preload="metadata"` so the browser streams rather than downloading it all up front.

Place the MP4 at that path and the player works with no code changes.

---

## Screens / Views
This is one continuously-scrolling page. A fixed top nav links to each anchored section. Order top-to-bottom:

### 1. Top Nav (fixed)
- **Layout:** fixed bar, full width, ~66px tall, logo left, links + CTA right.
- **Links:** Strategy · Founder Focus · Portfolio · Team · Insights, then a gold pill CTA "Submit your company" → `#contact`.
- **Scroll behavior:** transparent over the dark hero; after scrolling past ~72% of viewport height it gains a cream scrim (`rgba(250,248,242,0.85)`, `backdrop-filter: blur(12px)`, hairline bottom shadow). Link text + logo crossfade white → dark ink on scroll.
- **Mobile (≤760px):** links + CTA collapse into a hamburger button (three 24×2px bars; white over hero, dark ink on scroll). Tapping opens a cream dropdown panel (`#faf8f2`, hairline `#e6e2d9` border, `border-radius: 16px`, positioned `top:66px; left/right:12px`). Each link closes the menu on click.

### 2. Hero
- **Layout:** dark section, centered column, `min-height:100vh`, `padding:150px 32px 64px` (mobile `116px 20px 64px`). Headline in Alice, supporting line in Lato, gold CTA.
- An animated decorative spotlight that follows the cursor exists on desktop and is **hidden on mobile** (`.sv-spot { display:none }` ≤760px).

### 3. Strategy / Thesis (`#strategy`)
- Cream background (`#faf8f2`), `padding:110px 0` (mobile `64px 0`). Eyebrow + Alice heading + supporting copy, and a set of strategy tags/pills.

### 4. Founder Focus (`#focus`)
- White background. Two-column grid `grid-template-columns: 1.05fr 0.95fr`, `gap: clamp(40px,6vw,80px)`, `align-items:start`, `margin-top:64px`.
- **Left column:** the "how it works" content, including a 3-up grid (`repeat(3,1fr)`, `gap:40px`).
- **Right column (sticky, `top:100px`):** the **portrait video player** (see video section above), with a small gold "NOW SHOWING" eyebrow + caption beneath, centered, `max-width:348px`.
- **Mobile (≤760px):** grid collapses to one column (`gap:36px`); the video column un-sticks (`position:static`) and sits below the content; the 3-up grid becomes one column (`gap:28px`).

### 5. Portfolio (`#portfolio`)
- Warm tint (`#f4f1ea`). Auto-fitting card grid (already reflows; no fixed breakpoint needed). Cards = white, hairline warm border, soft shadow, hover-lift.

### 6. Team (`#team`)
- White. Headshots (`assets/team/graham-siegel.jpeg`, `assets/team/jp-persico.jpg`) as circular avatars, names in Alice, roles in Lato.

### 7. Insights / Thought Leadership (`#insights`)  ← recently added
- Warm tint (`#f4f1ea`), `padding:110px 0`. Editorial layout:
  - **Header row:** gold eyebrow "INSIGHTS" + Alice heading **"What we're thinking about."**, with an "All writing ↗" link (gold 2px underline) top-right, aligned to the top of the header.
  - **Filter chips** (below header, `gap:10px`, wrap): **All · White paper · Perspective · News**. Pill buttons, `height:38px`, `padding:0 18px`, `border-radius:999px`. Inactive = white fill, `#e6e2d9` border, `#2a2a2a` text. Active = `#111111` fill, `#ffcd3c` text. Clicking filters the list; "All" shows every post newest-first.
  - **Body:** two-column grid `1.18fr 0.82fr`, `gap:clamp(40px,5vw,56px)`.
    - **Featured (left):** the newest matching post as a large card — 16:10 image (use an `<img>`/cover slot), a solid tag badge over the image (top-left), read-time bottom-left, then Alice title, excerpt, and an author row (round initials chip in `#fff6da`/`#b97e00`, name + date).
    - **List (right):** remaining posts as rows separated by hairline `#ddd6c8` top borders. Each row is `display:flex; align-items:center; gap:20px`, with the post content on the left and a gold ↗ arrow in its **own right-hand column** (`flex:none`). The list column has `padding-right:28px` so the arrow/text clear the edge. On row hover the title turns gold (`#b97e00`) and the arrow nudges right 6px.
  - **Mobile (≤760px):** the two-column grid collapses to one column (`gap:34px`); the list drops its right gutter (`padding-right:0`).
- **Tags → colors:** White paper = `#fff6da` bg / `#8a6400` text / `#ffc009` dot; Perspective = `#e3f1ee` / `#1f6b5e` / `#33a08f`; News = `#ece9e2` / `#4a463f` / `#111111`. Solid (over-image) badge uses the dot color as fill.

#### Insights content (5 posts)
Posts link out to Notion. **Note:** only the first post's metadata is verbatim from the client (sourced from a real white-paper PDF); the other four are placeholder copy and **placeholder dates** authored during design — the client intends to replace them with real Notion content + true publish dates. Treat dates/excerpts of posts 2–5 as TBD.

1. **White paper** — "AI's impact on SaaS: a strategic shift in value, pricing & go-to-market" — JP Persico, May 2026, 18 min read. → `https://shuckervc.notion.site/shuckervc-news`
2. **Perspective** — "The Support Partner model" — shuckerVC, Apr 2026, 6 min. → `https://shuckervc.notion.site/our-support-partner-model`
3. **Perspective** — "Why we backed Atlas: monetizing impact, not tokens" — Graham Siegel, Mar 2026, 5 min. → `…/shuckervc-news`
4. **News** — "Algorized raises its Series A" — shuckerVC, Feb 2026, 3 min. → `…/shuckervc-news`
5. **News** — "Cascade joins the portfolio" — shuckerVC, Jan 2026, 2 min. → `…/shuckervc-news`

Sorting: newest-first by date; the featured slot always shows the newest post within the active filter.

### 8. CTA / Contact (`#contact`)
- **Gold background** (`#ffcd3c`), `padding:96px 0`, dark ink text (gold is too light for white text). Headline + a "submit your company" form/CTA. This is the one full gold field on the page.

### 9. Footer
- Dark. Logo (white), nav links (incl. Insights), legal line.

---

## Interactions & Behavior
- **Nav scrim + color crossfade** on scroll (threshold ≈ 72% viewport height), as above.
- **Mobile hamburger** toggles a dropdown; links close it on tap.
- **Insights tag filter:** clicking a chip sets the active tag; list re-renders to matching posts, newest-first, with the newest as the featured card. "All" = all five.
- **Video:** native `<video controls>`; the prototype persisted playback position to `localStorage` (key `sv-focus-vid-t`) and restored it on load — replicate if you want resume-on-reload, otherwise a plain controlled `<video>` is fine.
- **Hover states:** cards lift + shadow; Insights rows turn title gold and slide the ↗ arrow; links underline in gold.
- **Reveal-on-scroll:** sections fade/rise in (`opacity 0 → 1`, `translateY(22px) → 0`) using `transition: .7s cubic-bezier(.22,1,.36,1)`, often staggered with small delays. IntersectionObserver-driven.
- **Motion tokens:** `--ease-out cubic-bezier(0.22,1,0.36,1)`; durations 140 / 220 / 420ms. Restrained — no bounce, no infinite loops.

## State Management
Minimal client state:
- `insFilter` — active Insights tag (`'All' | 'White paper' | 'Perspective' | 'News'`).
- `navOpen` — mobile menu open/closed.
- nav scrolled-state (can be pure DOM/scroll listener, no framework state needed).
- video playback time (optional, localStorage).
No data fetching — content is static/hard-coded. Posts could later be sourced from a CMS/Notion; the client plans to supply real post data.

## Design Tokens
From the bound **shuckerVC Design System** (`design/_ds/shuckervc-design-system-…/tokens/`). Use these, don't invent values.

**Color**
- Gold (primary accent): `--gold-400 #ffcd3c`, deep `--gold-500 #ffc009`, `--gold-300` (selection), light tint `#fff6da`.
- Ink: `--ink-900 #111111`; body/secondary ink `#2a2a2a`, muted `#6f6a61`, faint `#938d82`.
- Warm neutrals: `--gray-50 #faf8f2`, `--gray-100 #f4f1ea`; warm border `--border #e6e2d9`, darker hairline `#ddd6c8`.
- Accents (sparingly, charts/badges): teal `#33a08f` / `#1f6b5e` / tint `#e3f1ee`; sand/bark.
- Dark feature surface: `--surface-ink` (used for hero/footer).
- **Rule:** gold is the single hero accent — marks, key numbers, focus rings, one CTA per view; never large flat gold fields except the dedicated CTA section. Text on gold is always dark ink.

**Typography**
- **Alice** (serif) — headings, slogans, big stat numbers. Regular weight, tight tracking.
- **Lato** (sans, the company font) — all UI, body, eyebrows. Weights 300/400/700/900 (no true 500/600 on Google Fonts; mediums round to 700).
- Eyebrows/overlines: UPPERCASE, wide letter-spacing (~.12–.18em), gold, ~14px, weight 700.
- Headings sentence case. Brand name always "shuckerVC" (lowercase shucker, uppercase VC, one word).
- Type scale tokens `--text-xs … --text-5xl` in `tokens/typography.css`.

**Spacing & layout**
- 4px base grid (`--space-*`). Container max `--container-max 1200px` (narrow `760px`). Section vertical padding 110px desktop / 64px mobile; side padding 32px desktop / 20px mobile.

**Radii**
- `--radius-md 10px` default, up to `--radius-2xl 32px`; `--radius-pill 999px` for chips/avatars/buttons. Cards 18–20px.

**Shadows**
- Warm-tinted, soft (ink 6–12% alpha). `--shadow-sm/md`; `--shadow-gold` glow for gold emphasis. e.g. card hover `0 18px 44px rgba(17,17,17,0.12)`.

**Breakpoint**
- Single responsive breakpoint at **`max-width: 760px`** drives the mobile layout (hamburger nav, single-column grids, tightened padding, hidden cursor spotlight).

## Assets
Included in `design/assets/`:
- `logo/` — `logo-color.png`, `logo-white.png`, `mark-gold.png`, `mark-white.png`, `lockup-gold-white.png`, `favicon.ico`.
- `team/` — `graham-siegel.jpeg`, `jp-persico.jpg`.
- **Missing — must be added:** `assets/video/shuckerVC_Support_Partner_Teaser.mp4` (see video section).
- Insights featured-post cover image: a slot exists; supply a real cover image (16:10).

Icons: brand has no house icon set — use **Lucide** (lucide.dev) for any UI glyphs, monochrome ink/gold, ~20–24px, 2px stroke. No emoji.

Design-system source (tokens, components, full brand readme) is in `design/_ds/shuckervc-design-system-35394f76-42ed-4fae-b9dd-f69b771d1d05/` — read `readme.md` there for the complete brand guide, and `tokens/*.css` for exact values.

## Files
- `design/Shucker VC Website.dc.html` — the full prototype (template + `Component` logic class). **Primary reference.**
- `design/support.js` — the prototype runtime (do not ship; for viewing only).
- `design/image-slot.js` — the drag-to-fill image placeholder used for cover images (do not ship; replace with real `<img>`).
- `design/_ds/…/` — the shuckerVC Design System: `styles.css`, `tokens/*.css`, `_ds_bundle.js`, component sources, and the brand `readme.md`.
- `design/assets/` — logos + team headshots.

### Recommended deploy (per the client's goal of testing online via GitHub)
1. Recreate the page in your chosen framework (or a clean `index.html`), wiring tokens from `_ds/tokens/*.css`.
2. Add the MP4 at `assets/video/shuckerVC_Support_Partner_Teaser.mp4`.
3. Init a GitHub repo, commit, push.
4. Enable **GitHub Pages** (deploy from `main`, root or `/docs`), or use Netlify/Vercel. Verify the video streams and the Insights filter + mobile hamburger work on the live URL.
