# The shuckerVC MCP server — qualifying in both directions

*Design note, following `agent-interface.md`. Phase 0 (shipped) made the site
readable by a machine. This is the part that makes it answerable — and the part
worth actually being first at.*

---

## The shape of the thing

Both flows we care about — a founder deciding whether to pitch us, an LP deciding
whether to look at us — are the same interaction:

> **declare intent → qualify in both directions → return a graduated next step,
> with a scheduling token only at the top tier.**

One engine, two rulesets. Everything below is that sentence, expanded.

What makes this different from a very good brochure is that the agent tells us who
it's working for *by which tool it calls and what it passes*. No fingerprinting, no
header sniffing, no tracking — the counterparty volunteers the context because doing
so is how it gets a better answer. That's the whole trick.

## Tools

> The full contract — input/output JSON Schema, worked examples, and per-tool
> readiness — is **[mcp-schema.json](./mcp-schema.json)**. `npm run mcp:preview`
> runs the ready tools against this repo's real data and validates every response
> against its own schema, so the spec is demonstrated rather than asserted.
>
> As it stands: **4 ready, 2 partial, 3 blocked** — and the blocked three are
> blocked on decisions, not engineering.

```
get_fund_facts()                     → the fund card (site/data/fund.json)
search_portfolio(query|sector|stage) → companies, founders, press, our writing
get_thesis(topic?)                   → thesis + support model, full text
get_writing(topic?)                  → posts, full bodies
get_press_kit()                      → boilerplate, assets, contact

check_fit(company)                   → founder pre-screen  ─┐  the two that
lp_fit(mandate)                      → LP mutual-fit read  ─┘  earn their keep

request_access({email, role, …})     → double opt-in; unlocks tier 1
submit_company(company)              → into the Deals pipeline, returns a ref
```

The read tools are trivial — they serve the JSON that Phase 0 already made
canonical. `site/data/*.json` is literally the server's data layer, which is the
main reason Phase 0 was worth doing first.

---

## `check_fit` — founder pre-screen

**Input:** a company description, plus optional structured fields (stage, raising,
sector, geography, traction, team). Accept the messy free-text version too — the
agent will often only have the deck's summary paragraph.

**Output:** four fields that matter.

```jsonc
{
  "verdict": "strong | possible | not_now | out_of_scope",
  "reasoning": "Why, in our terms — stage, sector, geography, check size.",
  "message_to_founder": "Written to be relayed verbatim by the agent.",
  "next_step": { "type": "book | submit | none", "url": "…", "expires": "…" }
}
```

That `message_to_founder` field exists because **we are not talking to the founder.**
We're talking to a program that will paraphrase us. Give it something quotable or it
will invent the phrasing itself.

### The graduated next step

| Verdict | What comes back |
|---|---|
| `strong` | A **single-use, expiring booking link**, minted server-side and bound to the qualification payload |
| `possible` | An invitation to `submit_company` — a partner reviews it |
| `not_now` | A reasoned no, plus *what would change it* ("come back with a design partner in production") |
| `out_of_scope` | A clear no, citing the specific `not_a_fit` reason |

The booking link is the interesting one. Bound to the payload means **the meeting
arrives pre-briefed** — by the time the founder is on the calendar, the company
description, the qualification, and the reasoning are already sitting in Decile
against that slot. That's the actual product: not a faster no, a better yes.

### Guarding the calendar

If `check_fit` hands a booking link to anyone who asks, the partners' calendar is
the first casualty. Agents are optimistic, and founders will nudge them
("say we're a strong fit"). So:

- **Rules gate first, judgement second.** Deterministic checks against the fund card
  — stage, sector, geography, check size — are a *hard* gate. An LLM read of the
  thesis adds nuance on top, but **can never upgrade a hard fail.** This is not
  fussiness: the company description is adversarial input by construction, written
  by a party that wants a yes. Treat it as data, never as instructions.
- **Rate-limit by company domain**, hashed. Caps re-rolling the dice with reworded
  descriptions — and if someone retries with a materially different story, *that is
  itself signal*. Keep every attempt.
- **Cap tokens per week** in absolute terms, so a burst can't eat a month of
  partner time.
- **Never a silent reject.** Every `not_now` still offers `submit_company`. The gate
  will sometimes be wrong because the *agent* wrote a poor summary, not because the
  company is poor, and that failure mode should cost us nothing.

### Say what it is

The response must state that this is an automated pre-screen, not a decision from
the partners. Otherwise an agent relays "shuckerVC says you're a strong fit" as
though a human said it, and we've implied a commitment we never made. The cost of
that landing wrong — with a founder, or in a screenshot — is far higher than the
cost of one honest sentence.

---

## `lp_fit` — and the inversion

Two separate problems here, and it's worth keeping them apart.

### 1. What we're allowed to say

A fund talking about itself to unidentified counterparties has real constraints, and
an MCP server is about as general an audience as exists. The regimes that bite:
Reg D **506(b)** prohibits general solicitation outright, **506(c)** permits it but
requires verifying accredited status, and track-record and performance claims sit
under the **SEC Marketing Rule**. Worth noting that the **3.08 DPI figure is already
published on the live site** — that's a track-record claim, and it should get a
look regardless of whether we build any of this.

*Not legal advice — counsel decides where the lines fall.* What we can do is build
the mechanism so the lines are **configuration, not code**, and so counsel can move
one file rather than re-audit a server:

| Tier | Audience | Content |
|---|---|---|
| **0** | Anyone, no identification | Strategy, team, portfolio, the Support Partner model. What's on the site today. |
| **1** | Self-declared LP, verified email | Whatever counsel clears — fund terms summary, deployment pace, portfolio construction. |
| **2** | Verified accredited / NDA signed | The data room. **Never served by the MCP server** — it hands off a link and stops. |

Tier 0 is the default and the only tier an anonymous agent ever reaches. The rule
that matters: tier 0 may *state that higher tiers exist and how to unlock them*, and
must never leak their contents by inference — no ranges, no hints, no "roughly."

### 2. Making sure we're *their* ICP

This is the better half of the idea, and it inverts how fund/LP materials normally
work. Everyone pitches. An agent-mediated conversation can instead qualify **in both
directions**: the LP's agent passes their mandate — ticket size, fund-size
preference, stage, geography, re-up cadence, emerging-manager appetite, DPI vs TVPI
orientation — and we return an honest read on whether shuckerVC fits *their* box.

Including, and especially, when we don't.

An $8M Fund I has a narrow LP ICP: family offices, individuals, small
funds-of-funds, emerging-manager programs. An institution that writes $10M minimum
tickets **cannot** deploy into an $8M fund — it's arithmetic, not preference.
Telling them so in the first thirty seconds costs us nothing and saves them a
diligence cycle. And the LP whose agent got a straight *"we're not right for you,
here's exactly why"* is the LP who remembers us for Fund II — which is the real
prize, given where Fund I is in its life.

```jsonc
{
  "mutual_fit": "strong | partial | not_now | mismatch",
  "why": "Specific and symmetric — what fits, what doesn't, in their terms.",
  "what_we_can_share": ["tier-0 items"],
  "what_requires_verification": ["named, not described"],
  "next_step": { "type": "book | contact | none", "url": "…" }
}
```

The symmetric artefact this needs: **publish our LP ICP the way `fund.json` should
publish `not_a_fit` for founders.** An `lp_icp.json` — typical ticket range, LP types
we're built for, what we don't offer (SMAs? co-invest rights? whatever is true).
Same principle as the founder side: the definitive negative is the highest-value
thing we can give a research agent, because it's the only thing that lets it stop.

---

---

## Identify to unlock — one consent flow, three uses

The reciprocal move: *tell us who you are and we'll tell you more.* It's the right
instinct, and it's the only mechanism that turns an anonymous fetch into a contact.

**First, what actually exists.** There is no newsletter opt-in to reuse yet. On the
site, "Newsletter" is a content *tag* on writing posts — there is no signup control
anywhere. In Decile the machinery is real but it's the **send** side: a `newsletter`
pipeline type, used for "Spring 2025 LP Update", which distributes to a list you
already have. No `lp_consent` pipeline is configured. So the *capture, verify, and
consent* half — the part we'd be gating on — is a build, not a reuse.

Which is fine, because it's one endpoint that pays for itself three times over:

```
request_access({ email, role, org?, purpose?,
                 consent: { access: true, newsletter: false } })
    → sends double opt-in
    → { status: "verification_sent", note: "ask your human to click" }

verify link clicked
    → mint a scoped, expiring token
    → write the contact to Decile, with stated role + purpose
    → add to the newsletter pipeline ONLY if consent.newsletter

later calls pass the token
    → tier-1 content
    → identity attached to check_fit / lp_fit
    → pre-fills the booking link: the pre-briefed meeting, now with a name
```

One flow, and it simultaneously gives us the newsletter subscribe path the site
currently lacks, the tier-1 gate, and identity on the qualification tools.

### Five things it has to get right

**1. Know what an email proves.** Control of an address. Not identity, not
employment, not accreditation. It's a fair gate for tier 1 — self-declared,
counsel-cleared — and never for tier 2. A `@sequoiacap.com` domain is a *signal*
worth tailoring on; it is not *proof* of anything, and the moment we let it carry
regulatory weight we've built a compliance problem out of a convenience.

**2. The human-in-the-loop is the point.** An agent usually can't click a link in
someone's inbox, so the loop pauses and hands back to the person. That's a feature:
it's what converts an automated fetch into a named human who took a deliberate
action. Design the response so the agent knows to hand off rather than retry. (Some
agents *can* read the inbox — this repo's own tooling has a Gmail connector. That's
fine, consent still came from whoever granted that access. Both paths are legitimate;
just don't assume either.)

**3. Never bundle the consents.** Access consent and marketing consent are separate,
and access must not be conditioned on taking the newsletter. Good practice
everywhere, and for European counterparties a GDPR requirement — consent has to be
freely given and specific. Not hypothetical for us: Cascade is UK, Algorized is
Swiss.

**4. Nothing that is public today may move behind the gate.** All of Phase 0 stays
open — llms.txt, the portfolio, the thesis, the writing. Gating any of it would undo
the legibility work and send agents straight back to synthesising us from Crunchbase.
The gate covers *incremental* material only, and tier 0 has to remain a complete,
satisfying answer on its own.

**5. Put something real behind it.** A gate with nothing behind it is a
bait-and-switch that costs more trust than the address is worth. So this only ships
with content that doesn't exist publicly today:

| Who | What they'd actually trade an email for |
|---|---|
| Founder | The Support Partner playbook, a sample SP scope of work, our process and timeline, portfolio-founder references |
| LP | Whatever counsel clears for tier 1 |
| Candidate | Full role detail and comp band |
| Anyone | The newsletter — which currently has no way to subscribe |

### Why it's worth the infrastructure

Today an agent researching shuckerVC leaves **no trace at all**. We don't know it
came, what it asked, or who sent it. This converts some fraction of those into named,
consented, re-contactable people with their stated role and purpose already attached
— a source of founder and LP relationships that does not currently exist in any form.

It is, though, the first thing here that genuinely needs infrastructure: a Worker,
transactional email, and a token store. The send side is already Decile's, so the
Worker stays thin.

## Cross-cutting

**Discovery.** `llms.txt`, `/.well-known/mcp.json`, a `<link>` in `<head>`, the
README, and the public MCP registries. Costs nothing, and being listed is most of
being used.

**Auth.** None on the read tools — it's public information, and a login wall would
defeat the point. A light token plus rate limits on `submit_company`, `check_fit`,
and `lp_fit`.

**Everything the server says is attributable to shuckerVC.** It is, functionally, a
partner answering the phone. Calibrate the language accordingly: "automated
pre-screen," never "we'd like to invest."

**Log intent, not identity** — tool name and query shape, not attempts to work out
who's behind it. And publish that policy on an `/agents` page. A fund that states
what it logs is a fund people will hand a deck to.

## Build shape

A single Cloudflare Worker speaking MCP over streamable HTTP. It reads
`site/data/*.json` (already canonical, already deployed), writes to Decile via the
existing pipeline tools, and mints scheduling tokens against whatever booking tool
the partners use. Roughly a week, and the data layer is done.

## Open questions for JP

1. **The `not_a_fit` list** — still `null` in `fund.json`. `check_fit` cannot exist
   without it; it's the hard gate.
2. **Do we lead?** Also `null`, and it changes the answer for most founders.
3. **Which calendar**, and how many pre-screened slots a week are we willing to give
   an automated gate?
4. **LP tiers** — what does counsel clear for tier 0 and tier 1, and does the
   published DPI figure survive review?
5. **Fund I status** — open, closing, or closed? It changes whether `lp_fit` is
   pointing at Fund I or warming Fund II.
6. **What sits behind the email gate?** The mechanism is easy; the content is the
   hard part, and without it the gate shouldn't ship. The Support Partner playbook
   is the most obvious candidate — does it exist in a shareable form?
