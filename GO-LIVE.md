# shuckerVC website — go-live requirements

What has to be connected for the site to run in a live/production environment.
This lists **requirements and capabilities**, not specific vendors — any provider
that meets each requirement will work.

The site itself is a **static site**: plain HTML/CSS/JS served from the `site/`
folder. Everything dynamic is either a build-time content sync or an external
endpoint the browser calls.

---

## 1. Static hosting

- A host that serves the **`site/`** directory as the web root over **HTTPS**,
  including the **`/v2/`** subpath.
- Deploy on every change to the production branch (today: push to `main`).
- The `/v2/` pages use **relative parent paths** (`../assets/`, `../insights.json`,
  `../writing.html`). So the parent `site/` files must be served alongside `/v2/`.
  If `/v2/` is ever promoted to the site root, those `../` references must be
  updated.

## 2. Domain, DNS, TLS

- If using a custom domain: **DNS** records pointing at the host and a valid
  **TLS certificate**.
- Update the hard-coded absolute URLs to the production domain (currently point at
  `shuckervc.github.io/...`):
  - `<link rel="canonical">` (site/v2/index.html)
  - `og:url`, `og:image`, `twitter:image` meta tags
- Decide the canonical entry point (serve v2 at root, or redirect root → `/v2/`),
  and make the canonical tag match.

## 3. Content sync: Notion → Insights

The **Insights** section and **writing.html** are populated from a Notion blog
database via `scripts/sync-notion.mjs`, which writes `site/insights.json` and
downloads images to `site/assets/insights/`.

Requirements:
- A **scheduler / job runner** that runs the sync on a cadence (today: hourly) and
  on demand.
- A **Node 18+ (currently 22) runtime** to execute the script.
- Secret: **`NOTION_TOKEN`** — a Notion integration token with **read** access,
  stored as a secret (never committed).
- The Notion integration must be **shared with the blog database**
  (`NOTION_BLOG_DB_ID`, defaults to a known id in the script).
- The job must be able to **commit the regenerated `insights.json` / assets** back
  to the repo (or write them to the host) and **trigger a redeploy**.
- If this is not connected, the page still renders from bundled fallback data —
  but Insights content will be **stale**.

## 4. "Submit your company" form → Decile (currently NOT wired)

The branded intake form (`#contact` on `/v2/`) is built but stubbed. A form on a
static site **cannot call Decile directly** — the API key would be exposed in the
browser. It needs a small server-side relay.

Requirements:
- A **server-side endpoint** (a function/host that can run code and hold secrets) that:
  - accepts a `POST` of the form fields from the site's origin (**CORS** must allow it),
  - verifies a bot/spam check server-side,
  - calls the **Decile API** to create a prospect/organization, then returns success/error.
- **Decile API key** with **write** scope, stored as a **server-side secret**
  (never in client JS or the repo).
- **Target pipeline + field mapping**: pipeline **"Deals - shuckerVC Fund I, LP"**
  (id `2nEb978Z`); map each form field to the Decile prospect/org fields.
- **Spam/abuse protection**: a CAPTCHA/bot-check token (verified on the server) +
  the honeypot/rate-limiting on the endpoint.
- Set the endpoint URL as `RELAY_URL` and replace the stub in `initApplyForm()`
  (`site/v2/app.js`) with the `fetch()` (marked `TODO(wire-up)`).
- Optional: a **notification** on new submissions (email/Slack/etc.).
- Confirm the form's field set matches the current Decile submission form.

## 5. Assets that must be present and served

- All images under `site/assets/**` (team, portfolio, logos) — committed.
- **`site/assets/og-image.png`** — referenced by the social/share meta tags.
- **Favicon / apple-touch-icon** under `site/assets/logo/`.
- **Support Partner teaser video**: `site/assets/video/shuckerVC_Support_Partner_Teaser.mp4`
  (~27 MB). The host must serve large static files (ideally with HTTP range
  requests for seeking). Confirm it's within the host's file-size/bandwidth limits.

## 6. Fonts / outbound network

- The pages load **Alice** and **Lato** from Google Fonts
  (`fonts.googleapis.com`, `fonts.gstatic.com`).
- Works on the open web as-is. If a strict **Content-Security-Policy** is added,
  it must allow those hosts — or self-host the fonts.

## 7. External links that must stay live

- Careers **"Now hiring"** cards link to **`https://shuckervc.notion.site/`** — that
  Notion site must remain **published/public**.
- Team **LinkedIn** links (external, informational).

## 8. CI/CD (whatever host is chosen)

Two automated jobs must exist in production:
1. **Deploy**: build/publish `site/` on push to the production branch.
2. **Content sync**: the scheduled Notion sync (Section 3), which then triggers a
   redeploy when content changes.

Requirements: the deploy identity needs permission to publish; the sync job needs
the `NOTION_TOKEN` secret and permission to commit + trigger a deploy.

## 9. Optional / decide before launch

- **Analytics + cookie/consent**: none is wired today. Add a snippet (and a consent
  banner if required by jurisdiction) if you want traffic data.
- **Form submission notifications** (Section 4).
- **Error monitoring/uptime** for the form relay endpoint.

---

### Secrets summary (store outside the repo)

| Secret | Used by | Scope |
| --- | --- | --- |
| `NOTION_TOKEN` | Notion → Insights sync | Read blog database |
| Decile API key | Form relay endpoint | Write prospects to the deal pipeline |
| Bot-check secret key | Form relay endpoint | Verify CAPTCHA tokens |

### Currently working vs. pending

- ✅ Static site + `/v2/` pages, assets, fonts, styling
- ✅ Notion → Insights sync (given `NOTION_TOKEN` is set in the environment)
- ✅ Deploy on push to `main`
- ⛔ **Submit-your-company form** — UI done, **relay endpoint + Decile wiring pending**
- ⚙️ Absolute URLs / canonical — update when the production domain is set
