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

```
get_fund_facts()                     → the fund card (site/data/fund.json)
search_portfolio(query|sector|stage) → companies, founders, press, our writing
get_thesis(topic?)                   → thesis + support model, full text
get_writing(topic?)                  → posts, full bodies
get_press_kit()                      → boilerplate, assets, contact

check_fit(company)                   → founder pre-screen  ─┐  the two that
lp_fit(mandate)                      → LP mutual-fit read  ─┘  earn their keep

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
