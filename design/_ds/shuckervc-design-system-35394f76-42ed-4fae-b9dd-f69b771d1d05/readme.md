# shuckerVC — Design System

Brand, tokens, components, and UI kits for **shuckerVC**, a Bay Area seed fund. This is the source of truth for designing anything that wears the shuckerVC brand — decks, the website, one-pagers, throwaway mocks, or production UI.

> **Mission: Fueling Founder Focus.** A $8M Bay Area seed fund backing AI-powered B2B software companies in the US. Pre-seed/seed, checks up to $500K, co-investing alongside top-tier VCs rather than leading. Founded by Managing Partners **Graham Siegel** (ex-COO, Unlearn.AI) and **Jean-Philippe "JP" Persico** (ex-Head of Strategy & CVC, Bosch Mobility). The differentiator is a hands-on **Founder Focus** operating model — a dedicated Support Partner plus at-cost back-office (finance, people, growth) so founders can stay on product and customers.

## Sources this system was built from
- **Brand_Guidelines.pdf** (`uploads/`) — logo rules, color palette (hex/rgb/hsl), typography (Header & Slogan = Alice).
- **Company website:** https://www.shucker.vc
- **Logo asset pack** (`uploads/logo_graphic*`, `uploads/*logo*`) — mark, wordmark, and lockups in gold / black / white. Curated set copied into `assets/logo/`.
- **Matching Palette.png** — secondary accent colors (teal/sand/bark).
- **Team headshots** — `uploads/` → `assets/team/` (Graham, JP).
- **getting_started_guide.html**, **Letterhead.gdoc**, **Template Empty.gslides** — applied brand references.

Readers may not have access to every upload above; paths are recorded so they can be re-supplied if needed.

---

## CONTENT FUNDAMENTALS — how shuckerVC writes

- **Voice:** confident, plain-spoken, operator-to-founder. No hype, no jargon, no buzzword salad. Short declarative sentences.
- **Person:** "We" for the fund, "you/founders" for the audience. Founder-centric — the founder is the hero, the fund is the support crew.
- **Casing:** sentence case for headings and UI. The brand name is always **shuckerVC** — lowercase "shucker", uppercase "VC", one word, no space. Eyebrows/overlines are UPPERCASE with wide tracking.
- **Tone words:** focus, hands-on, transparent, operational, co-invest, milestones, Series A. Concrete and metric-friendly.
- **Numbers carry weight:** specific figures are a brand signature — "$8M fund", "$500K checks", "3.08 DPI", "$80M raised". Use the `Stat` component; set numbers in Alice.
- **Emoji:** none. Not part of the brand.
- **Examples:**
  - "Backing top technical founders together with top venture capital firms."
  - "We believe focused founders build the strongest companies."
  - "We co-invest in oversubscribed rounds alongside top lead investors."
  - "By handling non-core functions, founders reach milestones faster."

---

## VISUAL FOUNDATIONS

**Color.** Core triad: **Bright-Sun gold** (`--gold-400 #ffcd3c` primary, `--gold-500 #ffc009` deep), **near-black ink** (`--ink-900 #111111`), and **white**. Gold is the single hero accent — used for marks, key numbers, focus rings, small fills, and one CTA per view, never as large flat fields of body background. Text on gold is always dark ink (gold is too light for white text). Neutrals are **warm** (off-whites tinted toward cream: `--gray-50 #faf8f2`, `--gray-100 #f4f1ea`), not cool gray. Secondary accents (teal `--teal-600`, sand, bark) exist for charts/illustration variety and should be used sparingly. Dark feature sections use `--surface-ink`.

**Type.** Two families:
- **Alice** (serif) — Headers, Slogans, and big Stat numbers. Per the brand book. Regular weight, tight tracking. Gives the brand its editorial, considered feel.
- **Lato** (humanist sans) — all UI, body, secondary headers, eyebrows. **This is the company font.** Ships 300/400/700/900 on Google Fonts; there is no true 500/600, so `--weight-medium/semibold` round to the nearest available (600 → 700 bold). If a licensed Lato with medium weights becomes available, wire it in as `@font-face`.
- Mono is a system fallback stack; the brand has no bespoke mono.

**Spacing & layout.** 4px base grid (`--space-*`). Containers cap at `--container-max 1200px` (narrow `760px`). Generous whitespace; content breathes. Center-aligned heroes, left-aligned body.

**Corners & cards.** Soft, friendly radii (`--radius-md 10px` default, up to `--radius-2xl 32px`, `--radius-pill` for chips/avatars/buttons). Cards are white on warm page tint, hairline `--border (#e6e2d9)` warm border, soft warm-tinted shadow (`--shadow-sm/md`). No hard 1px black outlines, no colored left-border accent stripes.

**Shadows.** Warm-tinted and soft (ink at 6–12% alpha), never harsh. A special `--shadow-gold` glow exists for emphasis on gold elements. Elevation comes from blur + spread, not darkness.

**Motion.** Restrained and crisp. `--ease-out cubic-bezier(0.22,1,0.36,1)` for entrances, durations `--dur-fast 140ms` / `--dur-base 220ms` / `--dur-slow 420ms`. Fades and short rises; no bounce, no infinite decorative loops.

**Interaction states.** Hover = subtle darken / lift (or underline with gold decoration on links). Press = slight scale-down, not a color flip. Focus = 2px `--focus-ring` (gold) outline, 2px offset. Selection highlight is `--gold-300` on ink.

**Imagery.** Real photography (team headshots, founder/office shots) — warm, natural, not heavily filtered. Logos come in gold/black/white; use full-color only on white, white/black versions on photos or colored backgrounds. Never rotate, distort, recolor, or place the full-color logo directly on a busy photo (per brand book).

**Borders & transparency.** Hairline warm borders for structure; blur/transparency used sparingly (e.g. a sticky nav scrim). No glassmorphism as a default motif.

---

## ICONOGRAPHY

shuckerVC has **no bespoke icon font or custom icon set** in the brand assets. The only proprietary marks are the **logo/wordmark family** (the "oyster/pearl" graphic mark + wordmark), copied into `assets/logo/`:
- `mark-gold|black|white.png` — the graphic mark alone.
- `logo-color|black|white.png` — wordmark.
- `lockup-gold-black|white.png` — mark + wordmark lockups.
- `favicon.ico`.

For UI glyphs (arrows, checks, form/nav icons), use **[Lucide](https://lucide.dev)** via CDN — its 2px rounded-stroke style matches the brand's friendly geometric feel. This is a substitution (the brand ships no icon set); swap if a house set is later provided. Keep icons monochrome (ink or gold), stroke-based, ~20–24px. **No emoji.** No multicolor/3D icons.

---

## TOKENS

`styles.css` (root) is the consumer entry point — an `@import` manifest only. It pulls:
- `tokens/fonts.css` — Alice + Lato via Google Fonts.
- `tokens/colors.css` — gold scale, warm neutrals, accents, status, and semantic aliases (`--brand`, `--text-primary`, `--surface-card`, …). **Reference the semantic aliases in product work,** not raw scale values.
- `tokens/typography.css` — families, type scale (`--text-xs`→`--text-5xl`), weights, leading, tracking, semantic roles.
- `tokens/spacing.css` — spacing, radii, borders, shadows, layout, motion.
- `tokens/base.css` — element resets + `.sv-container`, `.sv-display`, `.sv-eyebrow` helpers.

---

## COMPONENTS (`components/core/`)

React primitives, namespace `window.ShuckerVCDesignSystem_35394f`. Each is a named PascalCase export with a sibling `.d.ts` + `.prompt.md`.

| Component | What it's for |
|---|---|
| `Button` | Primary (gold) / secondary / ghost actions; sizes; with-icon; disabled. |
| `Input` | Labelled text field with focus ring; the form primitive. |
| `Card` | White surface, warm border + soft shadow; optional interactive hover-lift. |
| `Badge` | Small status/category pill. |
| `Eyebrow` | Uppercase, wide-tracked, gold section label — sits above an Alice heading. |
| `Avatar` | Circular team/portrait image with optional gold ring; initials fallback. |
| `Stat` | Big Alice number + sans label, for `$8M`, `3.08 DPI`, `$500K`. |

Showcase: `components/core/core.card.html`.

---

## UI KITS (`ui_kits/`)

- **`website/`** — recreation of the shucker.vc marketing site. `App.jsx` (interactive shell + submit-your-company form), `Nav.jsx`, `Hero.jsx`, `Sections.jsx` (thesis, founder-focus value props, team, AI/UI thesis, contact, footer). Entry: `ui_kits/website/index.html`.

---

## DESIGN SYSTEM TAB CARDS

Foundation specimens live in `guidelines/*.card.html` (Type, Colors, Spacing, Brand) and `components/core/core.card.html` (Components). Each is tagged with `@dsCard` on line 1 and renders in the Design System tab.

---

## INDEX / MANIFEST (root)

- `styles.css` — consumer CSS entry (import manifest).
- `tokens/` — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `base.css`.
- `components/core/` — Button, Input, Card, Badge, Eyebrow, Avatar, Stat (each `.jsx` + `.d.ts` + `.prompt.md`) + `core.card.html`.
- `guidelines/` — specimen cards: `type-display`, `type-sans`, `type-scale`, `colors-gold`, `colors-neutrals`, `colors-accents`, `colors-semantic`, `spacing-scale`, `spacing-radii`, `spacing-shadows`, `brand-logo`, `brand-logo-dark`, `brand-mark`.
- `assets/logo/`, `assets/team/` — brand marks and headshots.
- `ui_kits/website/` — marketing-site recreation.
- `readme.md` (this file), `SKILL.md` — docs / Claude skill manifest.
- `_ds_bundle.js`, `_ds_manifest.json`, `_adherence.oxlintrc.json` — **generated**; do not edit.

---

## CAVEATS

- **Lato weights:** Google Fonts Lato lacks 500/600; mediums render as bold. Provide a licensed cut for true mid-weights.
- **Icons** are substituted (Lucide) — no house icon set exists yet.
- Brand_Guidelines.pdf is a lightly-customized template; the gold/ink/white palette + Alice typography were treated as authoritative, Lato per direct instruction.
