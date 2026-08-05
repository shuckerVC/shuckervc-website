# decile-relay — form → Decile pipeline

Cloudflare Worker that receives the website's submit-your-company form and
creates an organization prospect in the Decile pipeline
**"Deals - shuckerVC Fund I, LP"** (`2nEb978Z`), stage
**"Added by Investment Inquiries Form"** (`315550`), tagged `website-inbound`,
with a human-readable submission note attached.

## Architecture (why MCP, not REST)

Writes go through **Decile's MCP endpoint** (`https://decilehub.com/mcp`,
Streamable HTTP, `X-Decile-API-Key` header) calling the
`upsert_pipeline_prospect` and `add_pipeline_prospect_note` tools.

This is deliberate: Decile's edge **401s POSTs to the REST write routes when
they originate from Cloudflare Workers** (identical requests succeed from
curl/servers — verified 2026-08-05), while `/mcp` accepts Worker traffic.
Reads still use REST (`GET /accounts` for `/health`, raw `Authorization` key
per their swagger). If Decile ever unblocks Worker REST writes, the submit
path could go back to `POST /api/v1/pipeline_prospect` — but MCP is their
stated preference for agent integrations anyway.

## Endpoints

- `POST /submit` — JSON body matching the form field names
  (`company, website, name, email, role?, location?, round, amount?, deck?,
  referral?, pitch, website2?` — `website2` is the honeypot).
- `GET /health` — verifies the API key against Decile (`GET /accounts`).

## Deploy / operate

```bash
cd workers/decile-relay
npx wrangler login                       # once per machine
npx wrangler secret put DECILE_API_KEY   # set/rotate the key
npx wrangler deploy
```

Live at `https://shuckervc-decile-relay.shuckervcwebsite.workers.dev`.
The site's `RELAY_URL` (site/home.js) points at `/submit`.

Note: this Worker is deployed manually from this directory. (The site itself
deploys via the Git-connected Workers build using the repo-root wrangler.toml.)

## Hardening

- **CORS/origin**: only origins in `ALLOWED_ORIGINS` (wrangler.toml) may call
  `/submit`.
- **Honeypot**: hidden `website2` field — bots that fill it get a fake 200.
- **Rate limit**: 5/min/IP best-effort in the worker; add a Cloudflare WAF
  rate rule for a hard guarantee.
- **Secrets**: the Decile key lives only as a Worker secret; rotate with
  `npx wrangler secret put DECILE_API_KEY` (takes effect without redeploy).
- **Failure mode**: upstream errors return `{ok:false}`; the site form shows
  its error state with an email fallback. Details are logged (wrangler tail).
