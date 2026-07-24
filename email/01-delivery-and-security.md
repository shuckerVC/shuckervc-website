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

## 0. Fix the domain authentication first — this is not about the newsletter

Verified by direct DNS query on 2026-07-24:

```
MX                            1 smtp.google.com
TXT shucker.vc                google-site-verification=…
                              notion-domain-verification=…
                              zoom-domain-verification=…
                              ← no SPF record of any kind
TXT _dmarc.shucker.vc         "v=DMARC1; p=none;"
google._domainkey.shucker.vc  present, 1024-bit RSA
news.shucker.vc               does not exist
```

**There is no SPF record on shucker.vc.** Not a permissive one — none. Every email the firm
sends today, including capital calls and LP statements, authenticates on DKIM alone. Any
delivery path that breaks the DKIM signature (most forwarding, some list servers, certain
gateway rewrites) fails DMARC with no SPF fallback to catch it. Nothing about this is
caused by the newsletter, and fixing it does not depend on any newsletter decision — it is
the highest-value action on this page and it protects the mail that actually matters.

The DMARC record is also reporting-blind: `p=none` with no `rua=`, so no aggregate reports
are being collected anywhere. There is currently no way to see who is sending as the domain
or what is failing authentication. That visibility should exist *before* any policy is
tightened or any new sending source is added.

Three records to fix it:

```dns
; SPF — authorizes Google Workspace to send for the domain
shucker.vc.         TXT  "v=spf1 include:_spf.google.com ~all"

; DMARC — keep p=none, but start collecting aggregate reports
_dmarc.shucker.vc.  TXT  "v=DMARC1; p=none; rua=mailto:dmarc@shucker.vc; fo=1;"
```

Then rotate the DKIM key to 2048-bit in the Workspace Admin console — the current key is
1024-bit, below present norms, and rotation is a one-click operation.

Sequence matters: publish SPF, turn on `rua=` reporting, read reports for a few weeks to
confirm every legitimate sending source passes, and only then consider moving `p=` to
`quarantine` and later `reject`. Tightening before you can see the traffic is how firms
accidentally start rejecting their own mail.

> If an ESP is adopted later, add its `include:` to the SPF record and CNAME a bounce
> subdomain to it so the Return-Path stays inside shucker.vc. SPF authenticates the
> envelope sender, not the visible `From:`, so an ESP sending with its own bounce domain
> misaligns SPF and leaves you on DKIM alone again. This is invisible under `p=none` and
> becomes a delivery failure under enforcement.

**Standards note.** DMARC is now **RFC 9989** (May 2026, Standards Track), which obsoletes
RFC 7489. Two changes matter if you write records: policy discovery moved from a Public
Suffix List lookup to a **DNS tree walk**, and a new `np=` tag sets policy for *non-existent*
subdomains separately from `sp=` for existing ones. As before, **if `sp=` is absent,
subdomains inherit `p=`** — which is the trap in the subdomain discussion below.

---

## 1. Sending platform

The volume is small enough that capacity is not the question. Google Workspace allows
2,000 messages/day and 3,000 external recipients/day; a monthly send to a few hundred
people fits easily. The question is what happens around the send.

**Do not send it from the Workspace account directly.** Two reasons, and the first is the
serious one:

- **Quota exhaustion locks the account out of sending for up to 24 hours.** That is the
  same account and domain that issues capital calls. A newsletter mistake should never be
  able to delay a capital call. Note also that authenticating over SMTP or IMAP caps
  recipients at **100 per message**, and the Gmail API at 500 — so a few-hundred-recipient
  send is already multiple transactions.
- **Gmail's native mail merge cannot give you an unsubscribe record.** Google's own
  documentation states you "can't get a list of all unsubscribed recipients" — you are
  notified per-unsubscribe by email and maintain suppression by hand. For a fund, an
  opt-out audit trail living in someone's inbox is not a record. It also cannot send from
  a subdomain, which forecloses combining it with any stream separation.

**Do not use a CRM's built-in bulk email either**, but be precise about why, because the
two ways a CRM can send fail in opposite directions:

- *Sending through your Gmail over OAuth* **authenticates correctly** — the envelope sender
  is your own address and Workspace signs with your domain, so SPF and DKIM both align and
  DMARC passes. Authentication is the one thing this approach gets right. It fails on
  everything else above: quota, no suppression, bounces landing as ordinary mail in someone's
  inbox, and complaints attaching to the exact account that sends wire instructions.
- *Sending through the CRM's own infrastructure* has the reverse problem. DKIM and
  Return-Path sit in *its* domain, so both legs misalign with `From: @shucker.vc` unless the
  vendor supports custom domain authentication. Today, under `p=none`, that failure is
  completely invisible — and it becomes a quarantine or rejection the moment you enforce.

There is also a module trap: within one CRM, the marketing/bulk module usually emits proper
unsubscribe headers and maintains suppression, while the 1:1 sales-sequence module usually
does not, because it models mail as person-to-person. Routing a newsletter through the wrong
module inherits the wrong compliance posture entirely.

**Use a dedicated ESP on a shared IP pool.** Not for capacity — for the things that cannot
be replicated in a mail client: platform-level suppression and bounce handling, RFC 8058
one-click unsubscribe, an aligned Return-Path, and a compliance-grade record of who opted
out and when. Take the **shared** pool deliberately: dedicated IPs need continuous volume
to build and hold a reputation, and published vendor thresholds run from 50,000/month
(SendGrid) to 100,000 and 300,000/month (Salesforce, Postmark) — one to two orders of
magnitude above this newsletter.

The decisive detail is decay, not just volume. Reputation systems typically retain roughly
**30 days** of history, so a sender that goes a month without sending has to warm the IP
again. **A monthly newsletter sits exactly on that boundary** — on a dedicated IP it would
cold-start every single send, forever, never accumulating anything. A shared pool solves
precisely this: your traffic joins a continuous aggregate stream, and a single complaint is
diluted into a much larger denominator instead of being attributed entirely to you.

### The number that actually constrains you

Google asks senders to keep spam complaints below **0.1%**, and never at or above 0.3%.
At roughly 500 recipients, **0.1% is half a complaint** — a single "mark as spam" is about
0.2%. There is no statistical room at this size.

This is the real argument for the consent and segmentation work in Track B, and it is worth
stating plainly: the formal Gmail *bulk sender* requirements do not apply to you (that
threshold is ~5,000 messages/day to personal Gmail accounts, and much of an LP list sits at
corporate Workspace domains where they formally don't apply at all). What binds you is not
the rulebook — it is that one irritated recipient blows your entire complaint budget. List
quality is the control that matters, not volume management.

**And you will be flying blind on it.** Google runs no per-message ARF feedback loop — by
design, so complaints can never be traced to an individual recipient. What it offers is
aggregate-only reporting keyed on a `Feedback-ID` header, and only once an identifier
appears in enough volume from enough distinct reporters. At this size those thresholds are
never met. So you will not learn who complained, or which issue caused it, from Google.
That asymmetry — a complaint budget of roughly one, and no instrument to measure it — is
the strongest technical case for an ESP: it aggregates you into a stream large enough to
produce signal, and holds real feedback-loop registrations at the providers where
per-message loops do exist.

### Warm-up: skip it

Standard domain warm-up guidance starts at 100–500 messages/day and ramps. Your *entire
monthly volume* is at or below the recommended first day. There is no ramp to build. You
will also get little feedback: Google suppresses Postmaster Tools data below a privacy
threshold, and it has retired the domain and IP reputation dashboards outright in favour of
a Compliance Status view. Set Postmaster Tools up anyway — it is free and shows the
authentication picture — but expect sparse dashboards. Spend the effort on list hygiene
instead, and smoke-test the first send to 20–30 engaged recipients to catch rendering and
authentication problems before the full list.

### Subdomain separation: defensible, but don't oversell it

The instinct to put the newsletter on `news.shucker.vc` to protect the root domain that
sends capital calls is reasonable, and it is standard practice. Two findings temper it:

- **Google explicitly rolls subdomain data up to the primary domain.** Its documentation
  states the Compliance Status dashboard "uses data from subdomains to determine
  compliance, but provides status for primary domains only," and that bulk-sender volume
  counts "all messages sent from the same primary domain." A subdomain is a partial
  firewall, not an air gap.
- **A segment needs steady volume to build its own reputation.** M3AAWG's guidance is
  explicit that segmentation requires "sufficient and relatively consistent traffic
  volume," and warns that lapses in sending impair forming and sustaining reputation.
  Twelve sends a year is close to the worst case: low volume with 30-day gaps.

So separating is cheap and defensible — M3AAWG notes a subdomain benefits from the
organizational domain's existing reputation rather than starting cold like an unrelated
domain — but it should not be presented internally as protecting the capital calls. At this
volume what protects those is correct authentication and a clean list.

> **If you do stand up `news.shucker.vc`, this is the thing that will break you.** With
> `sp=` absent, subdomains inherit `p=`. The day the root moves to `p=reject`, an
> unauthenticated subdomain send is *rejected outright*. Provision SPF, a subdomain-specific
> DKIM selector, and an aligned Return-Path on the subdomain **before** the first send, and
> publish an explicit `_dmarc.news.shucker.vc` record so it never silently inherits root
> enforcement.
>
> A defensible middle path: keep the visible `From:` on `shucker.vc` for LP recognition
> while putting the Return-Path and DKIM `d=` on the subdomain. You get separated
> authentication identities and cleaner troubleshooting without splitting the identity LPs
> see — at the cost of leaving the most reputation-salient identity on the root, so it
> insulates less.

---

## 2. Merge contract

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

## 3. Unsubscribe

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

This is the most privacy-preserving option available: **there is no capability token, so
there is nothing to leak, enumerate, or forward.** The sender's own `From:` address
identifies them. At LP-list scale, a filtered `unsubscribe@` mailbox reviewed weekly is a
genuinely adequate mechanism — honor requests promptly and log them.

There is also a concrete security argument for it that I did not appreciate initially.
Enterprise mail gateways fetch URLs *before* a human ever sees the message: Microsoft
documents that Safe Links scans URLs prior to delivery unconditionally — holding the message
until the scan completes — and detonates unknown-reputation URLs in a real headless browser;
Mimecast enabled pre-delivery URL scanning for all customers in November 2025. A
per-recipient unsubscribe URL is by definition unknown-reputation, so it gets fetched every
time. **Safe Links and Barracuda only touch HTTP, HTTPS and FTP** — which means a `mailto:`
has *zero* prefetch surface. There is no endpoint for a scanner to hit and no token for it
to burn.

Be clear about what it is and isn't, though. **A mailto does not satisfy RFC 8058
one-click.** That spec requires an HTTPS URI plus a `List-Unsubscribe-Post` header, and the
mailbox provider then issues an HTTP POST that something must answer without a human in the
loop — which no mail client can do. Mailto-only is defensible here specifically because
Google's one-click mandate rides on bulk-sender status (~5,000 messages/day to personal
Gmail accounts) and this newsletter is nowhere near it. It is a correct choice at this
volume, not a compliant substitute in general.

Adopting an ESP resolves this as a side effect — proper one-click comes with the platform.
Take it when you get there; the mailto can stay alongside it, since RFC 8058 permits
additional non-HTTPS URIs in the same header.

### If you move to HTTPS one-click later

Needs a real ESP or backend (the static site has neither). Then the token rules matter:

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

## 4. Pre-send checklist

**Blocking, one time, before any send:**

- [ ] SPF record published (§0) — this protects capital calls and is not optional
- [ ] DMARC `rua=` reporting on, and reports read for a few weeks
- [ ] DKIM rotated to 2048-bit
- [ ] `Newsletter Status` and the other consent fields added in Notion (Track B §5)

**Every send:**

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

## 5. Open decisions

**An honest disagreement on the ESP question.** The research behind §1 did not fully
converge. The case *for* an ESP rests on governance — suppression, bounce handling, an
exportable opt-out record, and quota isolation from the account that sends capital calls.
The case *against* is a deliverability argument: at 500 recipients, a shared IP pool means
inheriting other tenants' reputation, and a shared click-tracking domain carries real
blocklist risk, whereas Workspace authenticates natively and cleanly.

Both are right about different things, and the tie-breaker is that the ESP objections are
avoidable while the Workspace ones are not. Shared-pool risk is managed by choosing a
provider that vets its senders; click-domain risk disappears entirely if you turn tracking
off (§7). But Workspace cannot produce an unsubscribe audit trail at all, and cannot stop a
newsletter mistake from locking the capital-call mailbox for 24 hours. For a regulated
entity those are structural, so the recommendation stands — with lower confidence than the
rest of this document, and it is worth revisiting if the list stays small and manually
managed.

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

## 6. Credential handling

The Decile Hub API key currently sits in plaintext at `~/Documents/shucker-env.txt` on the
host Mac. That is workable for local scripted use but has no rotation story and travels
with any backup or sync of the Documents folder. If the send pipeline ever moves to a
server or a shared runner, the key belongs in a secret manager, scoped read-only, and
should never be echoed into logs, files, or generated output.

---

## 7. Message construction and tracking

**Size.** Gmail clips messages whose HTML payload exceeds roughly 102 KB, hiding the rest
behind "View entire message" and truncating mid-markup. The current template is **15.5 KB**
— comfortably clear. It stays clear as long as images are referenced by `https://` URL
rather than base64-inlined, which is also the right call for load time.

**Add a plain-text alternative.** The template is HTML-only today. Send it as
`multipart/alternative` with `text/plain` **first** and `text/html` last — RFC 2046 §5.1.4
makes order significant, and clients render the *last* alternative they support, so
reversing them shows everyone the plain-text version. Write real prose in the text part; an
empty one or "this email requires HTML" is worse than none, and it is what an Apple Watch
preview will show. Any normal mail library builds this nesting correctly; hand-rolling MIME
is where it goes wrong.

**Links.** The template links only to `shucker.vc` and the `mailto:`, which is exactly
right. Keep it that way: **no URL shorteners** (Spamhaus maintains a specific blocklist
category for abused redirector domains, precisely because a shared shortener inherits every
other user's reputation) and **no shared ESP click-tracking domain** — SURBL maintains a
dedicated list of click-tracker domains found in unsolicited mail, and the pooling problem
is identical. If an ESP is adopted, either turn click tracking off or point it at a CNAMEd
subdomain you control. A tracking redirect also makes every link's visible text differ from
its real destination, which is the pattern Google's "links should be visible and easy to
understand" guidance targets.

**Don't report open rates.** They do not measure what the name suggests. Gmail proxies and
caches images, so repeat opens collapse into one fetch while the initial fetch may happen at
message-processing time with no human involved. Apple's Mail Privacy Protection prefetches
everything by default. And the same gateways described above render messages during
detonation, firing the pixel with no reader present — biased toward your most
institutional LPs. The honest engagement signals at this size are replies, unsubscribes and
bounces. The template already invites replies, which is the right instinct.

### Tracking is also a consent question, not just an accuracy one

Beyond being unmeasurable, open and click tracking carry a legal obligation that is easy to
miss. Under the ePrivacy Directive Art. 5(3), storing or accessing information on a
recipient's device requires **consent** — and EDPB Guidelines 2/2023 (¶47–51) state
explicitly that this captures **both** tracking pixels in email **and** tracking links,
because the pixel is cached client-side and the decorated URL instructs the device to return
an identifier. Legitimate interest is not available here: ePrivacy is *lex specialis* and
gates the storage step before any GDPR lawful-basis analysis begins.

Two details make this sharper than the usual cookie-banner reasoning. France's CNIL adopted
a recommendation dedicated specifically to email tracking pixels in March 2026, which treats
open-rate analysis for campaign optimisation as consent-requiring, states that
business/professional addresses are **not** excluded, and that anonymising the data does not
help; its transition window for pre-existing contacts closed on **14 July 2026**. And the
UK's post-DUAA "statistical purposes" exception does not rescue per-recipient open tracking,
because the ICO frames that exception as being about how a service is used rather than *who*
uses it.

Direct exposure here looks small — a scan of the contact list found only about four EU/UK
addresses by top-level domain — but that is a floor rather than a ceiling, since European
recipients routinely use `.com` addresses and the obligation attaches to where the person
is, not what their domain says. It takes one LP.

The useful part: **no pixel and no redirect wrapper puts the newsletter outside Art. 5(3)
entirely.** Nothing to consent to, no exemption to argue, no consent records to retain, no
joint-controller question with an ESP. That is the same conclusion the accuracy argument
reached, arrived at independently — which is a good reason to hold the line on it even if
someone later asks for "just open rates."

### CAN-SPAM

Don't try to thread the transactional/relationship exemption. It is tempting — an LP has an
existing commitment, and the rules do cover periodic account statements — but the mixed
content rule says a message is **commercial** if the transactional content does not appear
"in whole or in substantial part, at the beginning of the body," and the FTC warns
explicitly against assuming an ongoing relationship converts messages into relationship
messages. A narrative newsletter that opens with portfolio news fails that test, the
classification would vary per recipient on the same send, and any Fund II solicitation makes
it commercial outright.

Complying fully costs a footer, and the template already largely does: accurate From,
honest subject, physical postal address, working unsubscribe. Keep all four, honour opt-outs
within 10 business days, and keep the mechanism live for at least 30 days after each send.
Maximum civil penalty is $53,088 **per email**, so the arithmetic favours the footer.

> Verify the footer's postal address is the fund's real registered address — it currently
> carries the placeholder from the design mock.

**Things not worth worrying about.** Several widely repeated rules have no basis in any
Google documentation: text-to-image ratios, "spam trigger word" lists, link counts, and
single- versus multi-column layout. Google's only content requirements are about deception —
don't hide content with CSS, don't fake graphical elements with characters, keep links and
subject lines honest. Also skip Gmail promotional annotation markup: it only changes
rendering *inside* the Promotions tab and amounts to declaring yourself promotional. Worth
knowing too that the Promotions tab is a consumer-Gmail feature — Google states it does not
apply to Workspace users — so for an LP list on corporate domains it is largely moot.

**If HTTPS one-click is ever added**, two traps beyond the token rules in §3: the
unsubscribe URI must **never redirect** (RFC 8058 forbids it, because redirected POSTs
historically degrade to GET — a bare-domain-to-`www` redirect would silently break every
unsubscribe), and both `List-Unsubscribe` and `List-Unsubscribe-Post` must appear in the
DKIM `h=` tag or conforming receivers will not offer one-click at all.
