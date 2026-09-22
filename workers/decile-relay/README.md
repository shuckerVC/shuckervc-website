# decile-relay — form → Decile pipeline

Cloudflare Worker that receives the website's submit-your-company form and
creates an organization prospect in the Decile pipeline
**"Deals - shuckerVC Fund I, LP"** (`2nEb978Z`), stage
**"Added by Investment Inquiries Form"** (`315550`), tagged `website-inbound`,
with a human-readable submission note attached.

## Architecture (why MCP, not REST)

Writes go through **Decile's MCP endpoint** (`https://decilehub.com/mcp`,
Streamable HTTP, `X-Decile-API-Key` header) calling the
`upsert_pipeline_prospect`, `add_pipeline_prospect_note` and
`create_or_update_person` tools.

Decile accepts unknown keys and silently ignores them, so an argument with the
wrong name looks like a success and writes nothing. Three separate bugs of
exactly this kind were fixed on 2026-09-22: note args nested under `note`,
org fields sent as `url`/`description` instead of `company_url`/`short_description`,
and `people` passed on the upsert's nested organization object (ignored there —
the submitter is attached via `create_or_update_person`, which matches the
company by name). **Always read a write back before believing it landed.**

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

## Required Decile data points (MUST exist before writes land)

`custom_data_points` keys are silently discarded unless a matching data point
is declared on the account. Decile accepted the write, returned success, and
stored nothing — the 2026-07-26 `DnBOM` submission landed with
`custom_data_points: {}`. Decile is adding a check that rejects writes to
undeclared keys, so after that ships an undeclared key becomes a hard failure
and the form shows its error state to the founder.

These nine were created 2026-09-22 (ids 103060-103068) and are account-scoped
to `investment_data_points`, i.e. shared by all three investment pipelines:

| key | format |
| --- | --- |
| `submitter_name`  | string |
| `submitter_email` | string |
| `submitter_role`  | string |
| `location`        | string |
| `round`           | string |
| `raising`         | string |
| `deck_url`        | url    |
| `referral`        | string |
| `source`          | string |

**Adding a form field means adding its data point first**, via MCP
`create_pipeline_data_point` (or `POST /api/v1/pipelines/{pipeline_id}/data_points`).
The data point's `name` IS the `custom_data_points` key — they must match
exactly. Created without `add_as_column`, which would fan the column out to
every investment pipeline in the account.

Verify a write actually persisted by reading it back — the write echo reports
the values either way:

```bash
# get_prospects pipeline_id=2nEb978Z stage_id=315550 custom_data_points="*"
```

Note: the submission note attaches to the *organization*, not the prospect, so
it does not appear under `get_prospects include=notes`. That empty array is
expected and is not a dropped note.

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
