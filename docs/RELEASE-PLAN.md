# Release Plan — shuckerVC Website (production go-live)

Companion to `PRODUCTION-MIGRATION.md` (which covers the domain/DNS mechanics).
This is the release view: every connector the site depends on, its current
state, what's needed to go live, and who owns it.

---

## 1. Connector inventory

### 1.1 GitHub Pages (hosting + deploy) — ✅ live
- **What it does:** `deploy-pages.yml` publishes `site/` on every push to
  `main` (with retry/backoff for flaky Pages deployments).
- **State:** working; serves `https://shuckervc.github.io/shuckervc-website/`.
- **Needed for release:**
  - Custom domain added in repo Settings → Pages (`CNAME` file lands in `site/`).
  - DNS records at the registrar (4 apex `A` records + `www` CNAME → see
    PRODUCTION-MIGRATION §3).
  - "Enforce HTTPS" ticked once GitHub validates the domain.
- **Owner:** JP (domain/registrar access) + eng (repo settings).

### 1.2 Notion → site content sync — ✅ live, keep healthy
- **What it does:** `sync-notion.yml` runs hourly (`:17`) + on dispatch. Pulls
  the **🥁 shuckerVC Blog** database via `scripts/sync-notion.mjs`, writes
  `site/insights.json`, downloads post covers into `site/assets/insights/`,
  rebuilds `site/feed.xml`, commits only on real change, then dispatches the
  Pages deploy.
- **Secrets:** `NOTION_TOKEN` (GitHub Actions secret) — a Notion **internal
  integration token**; the integration must stay shared with the Blog database.
- **Needed for release:**
  - Nothing new — but verify the token is valid and the integration still has
    access (a revoked token fails silently as "no changes").
  - Editorial rule unchanged: a post goes live only when it has **both** a
    Category and a Published date in Notion.
  - After the domain swap, one manual dispatch so `feed.xml` regenerates with
    the production origin.
- **Owner:** eng (secret rotation), JP/team (Notion content).
- **Note:** this is a server-side token in GitHub Actions — unrelated to any
  Notion connector in chat tools. Publishing works even when chat-side Notion
  is disconnected.

### 1.3 Decile (submit-your-company form) — ❌ the release blocker
- **What it should do:** relay form submissions into the Decile pipeline
  **"Deals - shuckerVC Fund I, LP"**.
- **State:** the form renders and validates, but `initApplyForm()` in
  `site/home.js` is a stub — it shows a "not connected yet" notice. No
  submission reaches Decile today.
- **Needed for release:**
  1. **Decision:** serverless host for the relay — recommended: Cloudflare
     Worker (free tier is plenty; Lambda or a Vercel/Netlify function work too).
  2. **Decile API key** with permission to create pipeline prospects — stored
     as a secret on the relay host, never in client JS.
  3. Relay implementation: `POST` JSON → create prospect; CORS locked to the
     production origin; honeypot + origin check + light rate limiting.
  4. Swap the stub for a real `fetch(RELAY_URL, …)` and success/error states.
  5. End-to-end test against a test pipeline, then point at the live one and
     confirm a submission lands.
- **Owner:** JP (Decile API key + host account), eng (build).

### 1.4 YouTube thumbnails (press mentions) — ✅ live, no key
- **What it does:** video mentions in `site/press.json` hotlink
  `img.youtube.com/vi/<id>/mqdefault.jpg` client-side. No API, no auth.
- **Needed for release:** nothing. Accepted risk: if YouTube ever blocks
  hotlinking (unlikely; it's been stable for years) the cards fall back to the
  branded placeholder tile — graceful, not broken.
- **Owner:** n/a.

### 1.5 RSS feed — ✅ live, one swap
- **What it does:** `scripts/build-feed.mjs` writes `site/feed.xml`; rebuilt on
  every Notion sync. `lastBuildDate` pinned to newest post (no churn deploys).
- **Needed for release:** change the `BASE` constant to the production origin
  (single line), rebuild once.
- **Owner:** eng.

### 1.6 Analytics + Search (optional, recommended at launch)
- **State:** none installed.
- **Needed:** pick one — Plausible / Fathom (privacy-friendly, no cookie
  banner) or GA4. One snippet in both HTML heads. Then verify the domain in
  Google Search Console + Bing, submit `sitemap.xml`.
- **Owner:** JP (account choice), eng (install).

---

## 2. What's needed from JP (the complete ask)

| # | Item | Unblocks |
|---|------|----------|
| 1 | Production domain confirmation (`shucker.vc`?) | DNS, canonical URLs, CORS origin |
| 2 | Registrar/DNS access (or willingness to paste 5 records) | HTTPS on the domain |
| 3 | Decile API key (prospect-create scope) | Form relay |
| 4 | Choice of relay host (default: Cloudflare Worker — needs a free CF account) | Form relay |
| 5 | Analytics preference (Plausible / GA4 / none) | Launch metrics |
| 6 | Confirm `NOTION_TOKEN` owner knows to keep the integration shared with the Blog DB | Content pipeline durability |

Items 1–2 and 3–4 are the two critical paths; they can run in parallel.

---

## 3. Release sequence

**R-2 (prep, ~half a day of eng):**
- Origin swap PR: `<head>` tags ×2 pages, `build-feed.mjs` BASE, `robots.txt`,
  `sitemap.xml` (details in PRODUCTION-MIGRATION §2/§7).
- Build + deploy the Decile relay against a test pipeline.

**R-1 (domain):**
- Add custom domain in Pages settings; JP sets DNS records; wait for
  validation; enforce HTTPS. (Waiting-dominated: minutes to ~24 h.)

**R-0 (launch day):**
- Wire the form to the live pipeline; submit a real test entry; confirm in
  Decile.
- Manual Notion-sync dispatch → feed regenerates on the new origin.
- Run the smoke-test checklist (PRODUCTION-MIGRATION §6): pages, images,
  video, form, feed, mobile/tablet, Lighthouse.
- Re-scrape social previews (LinkedIn/Twitter validators).

**R+1 (after):**
- Search Console verification + sitemap submission.
- Watch the first week of form submissions + the hourly sync runs.
- Keep the `github.io` URL and `/v2/` redirect alive indefinitely (free
  insurance for stale links).

---

## 4. Rollback / failure modes

| Failure | Blast radius | Response |
|---------|--------------|----------|
| DNS/cert misconfig | Site unreachable on new domain | Old `github.io` URL still serves; fix records, no deploy needed |
| Relay down/broken | Form errors; site otherwise fine | Form shows error state; revert `home.js` to stub if prolonged |
| Notion token revoked | Content freezes (site stays up) | Rotate `NOTION_TOKEN` secret, re-share integration, dispatch sync |
| Pages deploy outage | Stale site (still serving) | Workflow already retries ×3; wait or re-dispatch |

Nothing in this release can take the site fully down except DNS — and DNS
rolls back by deleting records.
