# Track A — Template security and delivery

How the email is built, merged, authenticated, and delivered safely. Track B
([02-audience-and-sending.md](02-audience-and-sending.md)) covers who receives it and what
each group should see — that track has open questions this one does not.

`newsletter-template-gmail.html` is the newsletter shell. It lives **outside `site/`** on
purpose: `site/` deploys publicly, and there is no reason for the internal template, its
merge contract, or this document to be world-readable.

The design-source copy in `design/` is the untouched import from Claude Design and is kept
only as a reference. **Send from this file, not that one.**

---

## 1. Merge contract

Seven values are supplied per issue. All use a neutral `custom.*` namespace that maps to
no system's schema:

| Tag | Example | Notes |
|---|---|---|
| `{{custom.investment_name}}` | `Northwind Labs` | |
| `{{custom.investment_summary}}` | `Agentic claims triage for…` | Founder-authored prose — escape it |
| `{{custom.investment_check}}` | `$250K` | Pre-formatted string, not a number |
| `{{custom.investment_round}}` | `Seed` | |
| `{{custom.stat_portfolio}}` | `14` | |
| `{{custom.stat_deployed}}` | `$5.2M` | LP-confidential |
| `{{custom.stat_tvpi}}` | `1.3x` | LP-confidential |

Three rules make this safe, and all three matter:

**Supply-only.** These are passed in explicitly at send time. Nothing in the template
auto-resolves against a connected system, so rendering it never triggers an API read and
a leaked render never pulls live data.

**Identical for every recipient.** The template has no per-recipient personalisation —
not even a first name. Every LP receives byte-identical HTML, so there is no per-recipient
data path to get wrong.

**Escaped.** `investment_summary` originates from founder-authored pitch material. Merge
it unescaped and a crafted description can inject markup or links into an email that
arrives carrying your name — a phishing vector aimed at your LPs. HTML-escape every
supplied value.

### The failure mode to avoid

Decile Hub's merge tags come in two kinds, and the distinction is the whole ballgame:

- **Auto-resolving** (`prospectable.*`, `sender.*`, `fund_details.*`, `global.*`) — these
  resolve *from the recipient's own CRM record* at render time. The catalog includes
  `prospectable.data_aum`, `prospectable.data_lp_type`, and `prospectable.email`.
- **Supplied** (`custom.*`) — inert unless you pass a value.

The realistic breach here is not an attacker calling your API. It is an auto-resolving tag
finding its way into a bulk template and quietly rendering one LP's AUM, LP type, or email
into a message. Keeping this template 100% `custom.*` closes that channel structurally
rather than by discipline. The stock "Newsletter Template (v1)" in the Connectors pipeline
uses auto-resolving tags — don't copy that pattern here.

> Verify the exact `custom.*` syntax with a `preview_email` call before the first real
> send; unresolved variables should surface there rather than in an LP's inbox.

---

## 2. Unsubscribe

### Two streams, and never one

| Stream | Contents | Unsubscribe? |
|---|---|---|
| **Fund communications** | Capital calls, K-1s, capital account statements, LPA notices | **No.** Contractual/transactional. |
| **Founder Focus Dispatch** | This newsletter | **Yes.** Full opt-out. |

Keep the consent state for these separate and never let an opt-out cascade. The compliance
argument is that transactional messages aren't commercial email; the operational argument
is blunter — an LP who unsubscribes from the newsletter must not stop receiving capital
calls. Scope every suppression to the newsletter list explicitly.

### Current design: mailto, no token

Decile Hub has **no unsubscribe primitive** — 72 merge variables in the Connectors
pipeline and not one relates to opt-out or list management. It's a CRM built for 1:1
relationship email, not bulk marketing. So `{{unsubscribe_url}}` (in the original design)
would never have resolved; it would have shipped to LPs as literal `{{unsubscribe_url}}`
text. It's now a plain mailto:

```
List-Unsubscribe: <mailto:unsubscribe@shucker.vc?subject=unsubscribe>
```

Gmail renders its native "Unsubscribe" affordance from that header, and the footer link is
the same mailto as a fallback.

This is the most privacy-preserving option available, not a stopgap: **there is no
capability token, so there is nothing to leak, enumerate, or forward.** The sender's own
`From:` address identifies them. At LP-list scale, a filtered `unsubscribe@` mailbox
reviewed weekly is a genuinely adequate mechanism — honor requests promptly and log them.

### If you move to HTTPS one-click later

Worth doing if the list outgrows manual handling, and it needs a real ESP (a backend the
static site doesn't have). Then the token rules matter:

- **Opaque and unguessable** — 128-bit random, or an HMAC over `(subscriber_id, list_id)`
  keyed by a server-side secret. Never a sequential ID.
- **Never `?email=…`.** `prospectable.email` is available as a merge tag, which makes
  `…/unsubscribe?email={{prospectable.email}}` the obvious thing to build. It is also the
  worst thing to build: it puts an LP's address in a URL that traverses proxies, referrer
  headers, and forwarded mail, and it lets anyone unsubscribe anyone by editing the
  querystring. It turns your unsubscribe endpoint into a list-membership oracle.
- **GET confirms, POST acts.** Security appliances (Outlook Safe Links, Proofpoint,
  Mimecast) prefetch links in mail; a GET that unsubscribes on load produces phantom
  opt-outs. Render a confirmation page on GET and change state only on POST. RFC 8058
  one-click sends a real POST, so it coexists cleanly:

  ```
  List-Unsubscribe: <mailto:unsubscribe@shucker.vc?subject=unsubscribe>, <https://…/u/TOKEN>
  List-Unsubscribe-Post: List-Unsubscribe=One-Click
  ```
- **Unsubscribe-only capability.** The token must not create a session or authorize
  anything else. Serve the page with `Referrer-Policy: no-referrer`, no third-party
  analytics, and don't echo the address back on the confirmation screen.
- **Suppression is authoritative.** If the send list is rebuilt from the CRM each month,
  an opt-out gets silently re-added unless suppression is checked at send time. Check it
  at send time.

---

## 3. Pre-send checklist

- [ ] All seven `{{custom.*}}` values supplied and HTML-escaped; no unresolved tags in preview
- [ ] Both `img src` paths switched to absolute hosted URLs — relative paths don't resolve
      in mail clients, and `shucker.vc` still serves the **old Duda site**, so
      `https://www.shucker.vc/assets/logo/…` will 404 until the new site ships
- [ ] `List-Unsubscribe` header set
- [ ] No fund metrics, names, or IDs in any URL or tracking pixel
- [ ] Fact-check pass complete (the newsletter workflow's existing gate)
- [ ] Rendered issue is **not** published to the public site — TVPI and deployed capital
      are LP-confidential once merged

---

## 4. Open decisions

**Sending platform.** Decile Hub can send it but has no list management or suppression.
A dedicated ESP would bring native suppression and one-click opt-out, at the cost of
another system holding LP addresses. The mailto design above works either way, so this
can wait — but note that the recipient list is governed in Notion, not Decile Hub, so
whichever platform sends must read its audience from there. See Track B §1.

**Who receives it, and what each group sees**, is resolved in
[02-audience-and-sending.md](02-audience-and-sending.md). That track carries a blocking
question — sending fund performance to prospective LPs while Fund II is in pre-marketing —
that should be settled before the first send, independently of anything in this document.

---

## 5. Credential handling

The Decile Hub API key currently sits in plaintext at `~/Documents/shucker-env.txt` on the
host Mac. That is workable for local scripted use but has no rotation story and travels
with any backup or sync of the Documents folder. If the send pipeline ever moves to a
server or a shared runner, the key belongs in a secret manager, scoped read-only, and
should never be echoed into logs, files, or generated output.
