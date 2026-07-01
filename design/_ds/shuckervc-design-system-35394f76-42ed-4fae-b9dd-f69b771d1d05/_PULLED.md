# Pulled from Claude Design

This folder is a local reference copy of the **shuckerVC Design System** Claude
Design project (`claude.ai/design`, project `35394f76-42ed-4fae-b9dd-f69b771d1d05`).
The **canonical source of truth is the live Claude Design project** — this copy
can go stale; re-run `/design-sync` (pull) to refresh it.

Pulled on 2026-07-01.

## What's here
- **Compiled bundle + manifest:** `_ds_bundle.js`, `_ds_manifest.json` (exposes `window.ShuckerVCDesignSystem_35394f.*`)
- **Tokens + styles:** `tokens/*.css`, `styles.css` (the `@import` entry), `readme.md` (brand guide)
- **Components (7)** — `components/core/<Name>.{jsx,d.ts,prompt.md}`: Avatar, Badge, Button, Card, Eyebrow, Input, Stat
- **Website UI kit** — `ui_kits/website/{App,Hero,Nav,Sections}.jsx`

## Still only in the live project (not pulled)
These are available in the Claude Design project; ask to pull them if you want a byte-complete local mirror:
- **Preview cards** (static HTML used by the component picker): `components/core/core.card.html`, `guidelines/*.card.html` (brand, colors, spacing, type)
- **Binary brand assets:** `assets/logo/*` (extra variants), `assets/team/*`, `scraps/*`, and the full `uploads/*` library (Brand_Guidelines.pdf, logo variants, palettes, headshots) — these are binary and some exceed the per-file read cap, so they weren't transcribed here.
