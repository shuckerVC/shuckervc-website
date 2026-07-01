# Pulled from Claude Design

This folder is a local reference copy of the **shuckerVC Design System** Claude
Design project (`claude.ai/design`, project `35394f76-42ed-4fae-b9dd-f69b771d1d05`).
The **canonical source of truth is the live Claude Design project** — this copy
can go stale; re-run `/design-sync` (pull) to refresh it.

Pulled on 2026-07-01.

## What's here (a complete code + cards mirror)
- **Compiled bundle + manifest:** `_ds_bundle.js`, `_ds_manifest.json` (exposes `window.ShuckerVCDesignSystem_35394f.*`)
- **Tokens + styles:** `tokens/*.css`, `styles.css` (the `@import` entry), `readme.md` (brand guide)
- **Components (7):** `components/core/<Name>.{jsx,d.ts,prompt.md}` — Avatar, Badge, Button, Card, Eyebrow, Input, Stat
- **Component preview:** `components/core/core.card.html`
- **Guideline cards (13):** `guidelines/*.card.html` (brand logo/mark, colors, spacing, type)
- **Website UI kit:** `ui_kits/website/{App,Hero,Nav,Sections}.jsx`
- **Assets the cards reference:** `assets/logo/` (logo-color, logo-white, lockup-gold-white, mark-gold/-white/-black, favicon) and `assets/team/` (JP, Graham)

## Still only in the live project (not pulled)
Binary assets don't transfer cleanly through the pull channel (base64, and several exceed the per-file read cap). For a **byte-complete binary mirror, download/export the project from claude.ai/design** — that's how this `_ds/` bundle was originally produced. Not pulled here:
- Extra logo variants not referenced by any card: `assets/logo/logo-black.png`, `lockup-gold-black.png`
- The `uploads/` brand-asset library (Brand_Guidelines.pdf, logo graphics, palettes, headshots) and `scraps/`
- Claude Design project metadata: `SKILL.md`, `.thumbnail`
