# decile-relay — form → Decile pipeline

Cloudflare Worker that receives the website's submit-your-company form and
creates an organization prospect in the Decile pipeline
**"Deals - shuckerVC Fund I, LP"** (`2nEb978Z`).

The prospect **payload shape is already validated against the live pipeline**
(a test prospect was created and removed): organization `{name, url,
description}`, `tag_list: "website-inbound"`, and all form fields as
`custom_data_points` (they land in the prospect's `data`). Auth is
`Authorization: Bearer <key>` against base `https://decilehub.com/api/v1`
(both verified live 2026-08-05: GET /accounts → 200).

## 1. Deploy (one-time, ~10 min)

```bash
cd workers/decile-relay
npx wrangler login                       # opens browser; free CF account is fine
npx wrangler secret put DECILE_API_KEY   # paste the Decile API key
npx wrangler deploy
```

Deploy prints the worker URL, e.g.
`https://shuckervc-decile-relay.<account>.workers.dev`.

## 2. Verify the Decile REST endpoint (one-time)

Base URL and Bearer auth are verified. For the upsert route the worker tries
known path candidates in order and uses the first the API recognizes (check
`npx wrangler tail` for "Decile upsert path used"). Verify health first:

```bash
curl https://<worker-url>/health
```

- `{"ok":true}` → base URL + key are good.
- `502` → adjust `DECILE_API_BASE` in `wrangler.toml` (Decile's API docs /
  support have the current base; the key itself was already proven valid via
  MCP), redeploy, retry.

Then a real end-to-end test:

```bash
curl -X POST https://<worker-url>/submit \
  -H 'Content-Type: application/json' \
  -d '{"company":"ZZZ TEST relay","website":"https://test.invalid","name":"Test","email":"test@shucker.vc","round":"Pre-seed","pitch":"End-to-end relay test — delete this row."}'
```

Confirm the row appears in the pipeline, then remove it in Decile.

## 3. Point the site at it

In `site/home.js`, set the constant at the top of `initApplyForm()`:

```js
var RELAY_URL = 'https://<worker-url>/submit';
```

Empty string keeps the current stub behavior, so this is safe to deploy in
either order.

## 4. Hardening notes

- **CORS/origin**: only origins in `ALLOWED_ORIGINS` may call `/submit`.
- **Honeypot**: hidden `website2` field — bots that fill it get a fake 200.
- **Rate limit**: 5/min/IP best-effort in the worker. For a hard limit, add a
  Cloudflare WAF rate-limiting rule on the route (dashboard → Security).
- **Secrets**: the Decile key lives only as a Worker secret. Rotating it =
  `npx wrangler secret put DECILE_API_KEY` again.
- **Failure mode**: on any upstream error the form shows its error state and
  the site is otherwise unaffected.
