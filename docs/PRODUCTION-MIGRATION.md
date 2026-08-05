# Production Migration Plan — shuckerVC Website

Moving the site from the GitHub Pages **project URL**
(`https://shuckervc.github.io/shuckervc-website/`) to a **production custom
domain** (assumed `shuckervc.com`, redirecting `www`).

This is a low-risk migration: the site is static, CI already builds and deploys
it, and all asset paths are already relative (so nothing breaks when the base
path changes from `/shuckervc-website/` to `/`). The real work is: (1) point a
domain at it over HTTPS, (2) swap the hardcoded origin in a few files, (3) add
SEO essentials, and (4) wire the submit form to a real backend.

---

## 0. Inputs needed before we start

Three decisions unblock everything else:

| # | Decision | Default assumption | Owner |
|---|----------|--------------------|-------|
| 1 | **Production domain** | `shuckervc.com` (apex) + `www.shuckervc.com` → apex | JP |
| 2 | **DNS provider / registrar** | (where `shuckervc.com` is registered — Namecheap/GoDaddy/Cloudflare/etc.) | JP |
| 3 | **Form backend host** | Cloudflare Worker (free, same-day) relaying to the Decile API | Eng |

Everything below is written against those defaults; swap in the real values
where they appear.

---

## 1. The one architectural choice: hosting

The site is static, so hosting is cheap and flexible. The only thing that needs
a *server* is the **submit-your-company form** (it must POST somewhere that can
talk to the Decile API with a secret key — that can't live in client JS).

**Option A — Stay on GitHub Pages + a standalone form endpoint (recommended).**
- Keep the existing, proven `deploy-pages.yml` pipeline and the hourly Notion
  sync untouched.
- Add a custom domain to GitHub Pages (free managed HTTPS via Let's Encrypt).
- Host the form relay separately as a **Cloudflare Worker** (or AWS Lambda +
  API Gateway, or a Vercel/Netlify Function). The page just `fetch()`es it.
- Pros: minimal change, zero risk to current deploys. Cons: two deploy targets
  (site + worker), and a cross-origin `fetch` (fine with a CORS header).

**Option B — Move hosting to Cloudflare Pages / Netlify / Vercel.**
- Static hosting **and** serverless functions on one domain, so the form is
  same-origin and there's one deploy target.
- Pros: consolidates everything; better edge caching for the 27 MB video.
- Cons: re-plumbing CI and the Notion-sync trigger; more to validate.

**Recommendation: Option A.** It gets us to production fastest with the least
risk. We can revisit Option B later if we want functions/CDN consolidation.
The rest of this plan assumes Option A.

---

## 2. Phase 1 — Repo prep (single-source the origin)

Do this first so the cutover is a one-line change, not a scavenger hunt.

1. **Introduce one canonical origin constant.**
   - `scripts/build-feed.mjs` already centralizes it: change
     `const BASE = 'https://shuckervc.github.io/shuckervc-website/';`
     → `const BASE = 'https://shuckervc.com/';` and re-run the feed build so
     `site/feed.xml` regenerates with production URLs.
   - The HTML `<head>` origins are hardcoded per file. Replace them (see the
     file-change table in §7). There are exactly **4 per page** in
     `index.html` and `writing.html`: `canonical`, `og:url`, `og:image`,
     `twitter:image`.

2. **Add SEO essentials (currently missing).**
   - `site/robots.txt`:
     ```
     User-agent: *
     Allow: /
     Sitemap: https://shuckervc.com/sitemap.xml
     ```
   - `site/sitemap.xml` — list the two real pages (`/` and `/writing.html`).
     Keep it simple, or generate it in the same script that builds the feed.

3. **Verify no absolute-root paths.** Confirmed clean today — all assets use
   relative `assets/...`. Keep it that way (root-relative `/assets/...` would
   break the local-server preview and any future subpath hosting).

4. **Confirm the video is committed / served.** `assets/video/
   shuckerVC_Support_Partner_Teaser.mp4` (~27 MB) must exist at the deployed
   path. GitHub Pages serves it fine; just confirm it's in the artifact and
   loads over the new domain.

Ship §2 as an ordinary PR. Nothing here changes what the live project URL
serves except the (still-valid-once-domain-is-live) canonical tags — so do §3
(domain) close in time, or temporarily keep canonicals on the github.io origin
until DNS is live to avoid pointing crawlers at a domain that 404s.

---

## 3. Phase 2 — Domain + DNS + HTTPS

GitHub Pages custom-domain setup:

1. **Add the domain in the repo.** Settings → Pages → *Custom domain* →
   `shuckervc.com` → Save. This commits a `site/CNAME` file containing
   `shuckervc.com` (or add the `CNAME` file yourself — it must sit at the
   **published root**, i.e. inside `site/`, since that's our Pages artifact
   directory).

2. **DNS records at the registrar:**
   - **Apex** `shuckervc.com` → four `A` records to GitHub Pages:
     `185.199.108.153`, `185.199.109.153`, `185.199.110.153`,
     `185.199.111.153` (and the matching `AAAA` records if you want IPv6).
   - **`www`** → `CNAME` → `shuckervc.github.io`.
   - If DNS is on Cloudflare, set these records to **DNS-only (grey cloud)**
     during initial validation so GitHub can issue its cert, then optionally
     re-enable proxy afterward.

3. **Enforce HTTPS.** After DNS propagates and GitHub validates the domain
   (can take from minutes up to ~24 h), tick **Enforce HTTPS** in Settings →
   Pages. Confirm the Let's Encrypt cert is issued.

4. **Redirect `www` → apex** (or vice-versa — pick one canonical host and keep
   it consistent with the canonical tags). GitHub Pages handles the
   apex/`www` pairing automatically once both records exist.

---

## 4. Phase 3 — Wire the submit form (Option A: Cloudflare Worker)

Today `initApplyForm()` in `site/home.js` only shows a "not connected yet"
notice. To go live:

1. **Stand up the relay** (Cloudflare Worker):
   - Accepts `POST` JSON `{ company, website, name, email, role, location,
     round, amount, deck, referral, pitch }` (the form's field names).
   - Server-side, calls the Decile API to create a prospect in the pipeline
     **"Deals - shuckerVC Fund I, LP"**. Keep the Decile API key in a Worker
     **secret**, never in client JS.
   - Returns `200 {ok:true}` on success; sets a permissive CORS header for the
     site origin (`Access-Control-Allow-Origin: https://shuckervc.com`) and
     handles the `OPTIONS` preflight.
   - Add basic anti-abuse: a honeypot field, an origin check, and light rate
     limiting.

2. **Point the page at it.** Replace the stub in `initApplyForm()` with a real
   `fetch(RELAY_URL, {method:'POST', headers:{'Content-Type':'application/json'},
   body: JSON.stringify(Object.fromEntries(new FormData(form)))})`, and update
   the success/error `.apply-note` messaging. Keep the client-side
   `checkValidity()` gate that's already there.

3. **Test end-to-end** against a Decile sandbox/test pipeline before pointing
   at the live pipeline, and confirm a submission actually lands in Decile.

*(If we pick Option B instead, this becomes a same-origin function under
`/api/submit` and the CORS step goes away.)*

---

## 5. Phase 4 — SEO, analytics, verification

- **Analytics:** add a privacy-friendly tag (Plausible / Fathom / GA4) if
  wanted — one snippet in both HTML `<head>`s.
- **Search Console / Bing Webmaster:** verify the new domain, submit
  `sitemap.xml`.
- **Social preview:** re-scrape OG tags (LinkedIn Post Inspector, Twitter Card
  validator) so the new-domain preview image caches.
- **Feed:** confirm `feed.xml` `<link>`/`<guid>`/`<enclosure>` URLs all point
  at `shuckervc.com` after the rebuild.

---

## 6. Phase 5 — Launch checklist (smoke test on the live domain)

Run through this on `https://shuckervc.com` after HTTPS is enforced:

- [ ] `/` loads over HTTPS, no mixed-content or console errors.
- [ ] `www.shuckervc.com` redirects to the canonical host.
- [ ] All images render (portfolio, insights, press thumbnails, team).
- [ ] The 27 MB teaser video streams (`preload="metadata"`, plays inline).
- [ ] `/writing.html` + the "In the news" view render; press thumbnails and
      YouTube thumbnails load.
- [ ] Submit form: collapsed by default → opens → validates → **posts to
      Decile** → shows success; a test row appears in the pipeline.
- [ ] `feed.xml`, `robots.txt`, `sitemap.xml` all serve and use the new origin.
- [ ] Canonical/OG/Twitter tags all show `shuckervc.com`.
- [ ] Mobile (iPhone) + tablet (iPad) spot-check: nav, hero, form, video.
- [ ] Lighthouse pass (perf/SEO/a11y) — no regressions.

---

## 7. File-change reference

| File | Change |
|------|--------|
| `site/index.html` | 4 `<head>` tags → new origin (canonical, og:url, og:image, twitter:image) |
| `site/writing.html` | same 4 tags → new origin |
| `scripts/build-feed.mjs` | `BASE` const → `https://shuckervc.com/`, then rebuild `feed.xml` |
| `site/feed.xml` | regenerated output (don't hand-edit) |
| `site/CNAME` | **new** — `shuckervc.com` (added by Pages settings or by hand) |
| `site/robots.txt` | **new** |
| `site/sitemap.xml` | **new** |
| `site/home.js` | `initApplyForm()` stub → real `fetch()` to the relay |
| `.github/workflows/deploy-pages.yml` | `environment.url` → new domain (cosmetic) |
| *(new, separate)* | Cloudflare Worker: Decile relay + secret |

---

## 8. Rollback

Everything is reversible and low-blast-radius:

- **DNS/domain:** removing the custom domain in Pages settings (or the DNS
  records) reverts serving to `shuckervc.github.io/shuckervc-website/`
  immediately. Keep the old project URL working during the transition — don't
  delete anything.
- **Content/URL commits:** standard `git revert` on the origin-swap PR; the
  fast-forward deploy flow redeploys the prior state in ~1–2 min.
- **Form:** if the relay misbehaves, revert `home.js` to the stub — the rest of
  the page is unaffected.
- **Keep the `/v2/` → root redirect** in place; it costs nothing and protects
  any stale links.

---

## 9. Rough sequencing / effort

1. **Day 1:** §2 repo prep PR (origin constant, robots, sitemap) — ~1–2 h.
2. **Day 1–2:** §3 domain + DNS + wait for GitHub validation + enforce HTTPS.
3. **Day 2–3:** §4 form relay (Worker + Decile integration + test).
4. **Launch day:** §5–6 verification + smoke test, then announce.

Critical path is DNS propagation / cert issuance (mostly waiting) and the form
relay (the only net-new code). The URL swap itself is minutes of work.
