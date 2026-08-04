# The agent interface: shuckerVC for harnesses

*Design note — how an AI harness researching shuckerVC should experience this site,
how it declares who it's working for, and what we get back. Nothing here is built
yet; this is the plan and the argument for it.*

---

## The premise

Increasingly, the first thing that "visits" shuckervc.com isn't a founder — it's a
founder's agent, running a research task. Same for LPs' analysts, journalists,
co-investors, and candidates. That visitor:

- **doesn't scroll** — it fetches, greps, and synthesises
- **doesn't run our JavaScript** — most fetch tools don't execute a page
- **has a token budget** — it wants the whole answer in one or two requests
- **quotes us as fact** — whatever we publish becomes the answer its human reads
- **is acting for someone specific** — and that person's question is knowable

The last two points are the opportunity. If a founder's agent asks "is shuckerVC a
fit for a pre-seed B2B AI company in Europe?", the answer it gives is either ours or
a hallucination stitched from Crunchbase and a 2024 tweet. We should own it.

And there's a positioning argument on top of the practical one: we're a fund whose
entire thesis is AI-powered B2B software, and whose pitch to founders is that we
remove operational drag. Being the first fund that is *itself* agent-native is the
cheapest possible proof that we understand the shift we're underwriting.

## Where we actually stand

| Surface | Agent-readable today? |
|---|---|
| `site/insights.json` | ✅ full posts incl. body text |
| `site/press.json` | ✅ per-company press with real outlet URLs |
| `site/feed.xml` | ✅ RSS |
| Portfolio (7 companies, founders, links) | ❌ `var PORT` in `site/v2/app.js:307` |
| Team + Support Partners | ❌ `var TEAM` in `site/v2/app.js:166` |
| Insights *on the page* | ❌ `fetch()`ed at runtime (`app.js:643`) |
| Thesis / strategy / support model copy | ⚠️ in HTML, but buried in nav + reveal markup |
| Fund facts (size, stage, check, geography) | ❌ nowhere, in any form |
| Submit-your-company | ❌ stub, not wired (`app.js:978`) |

So the richest, most differentiating material we have — who we backed, who runs the
fund, what the Support Partner model actually is — is precisely the material an
agent can't see. Everything below is downstream of fixing that.

---

## Layer 0 — Be legible at all

No new infrastructure. This is the highest-value work and it's mostly mechanical.

**Lift data out of `app.js` into JSON.** `portfolio.json`, `team.json`, `fund.json`,
following the `insights.json` pattern that already works. The site reads them; so can
anyone else. One canonical source, no drift.

**Render server-side-ish.** Bake portfolio/team/insights into the HTML at build time
(a small script in `scripts/`, run by the existing Pages workflow) and let `app.js`
enhance rather than construct. A no-JS fetch then returns the whole page. This also
helps SEO and screen readers — it isn't agent-specific work.

**`/llms.txt`** — the emerging convention: a short markdown index telling an agent
what exists and where the canonical version lives. Plus **`/llms-full.txt`**, the
entire substantive corpus (thesis, support model, portfolio, team, all writing) as
one markdown file. One fetch, complete answer, no crawl.

**JSON-LD**, because it's what every other consumer already parses:
`Organization` (with `sameAs` → LinkedIn, Crunchbase, X), `Person` for JP and Graham,
`Article` per post, `FAQPage`, and — genuinely useful — `JobPosting` for the Support
Partner role, which is what makes candidates' agents able to find it at all.

**`robots.txt` + `sitemap.xml`**, with `ClaudeBot`, `GPTBot`, `PerplexityBot` et al.
*explicitly* allowed and a pointer to `llms.txt`. Most sites are busy blocking these.
We want the opposite, and saying so explicitly is itself a signal.

**Markdown twins** — `/writing.md`, `/portfolio.md`. Generated, not maintained.

**`fund.json` — the fund card.** The single most useful artefact we could publish,
and it doesn't exist anywhere today:

```jsonc
{
  "name": "shuckerVC", "fund": "Fund I", "size_usd": 8000000, "vintage": 2025,
  "stage": ["pre-seed", "seed"], "check_usd": { "min": 250000, "max": 750000 },
  "leads": false, "geography": ["US", "Europe"], "hq": "Bay Area",
  "sectors": ["B2B software", "applied AI", "AI infrastructure"],
  "differentiator": "full-time Support Partner embedded in every portfolio company",
  "not_a_fit": ["consumer", "biotech", "hardware-only", "pre-product", "crypto"],
  "process": { "first_response_days": 5, "decision_weeks": 4 },
  "submit": "https://shuckervc.com/#contact",
  "updated": "2026-08-04"
}
```

Note `not_a_fit`. Definitive negatives are the highest-value thing you can give a
research agent — they're what let it stop, and they save both sides a meeting that
was never going to happen. Every JSON gets an `updated` field so an agent can judge
staleness rather than guess.

---

## Layer 1 — Answer the question, don't just publish the facts

Facts are raw material; agents are answering a *question*. Pre-compute the answers.

**`/faq`** — the twenty questions founders actually ask, as `FAQPage` JSON-LD plus
markdown. Agents quote FAQ answers close to verbatim. This is our chance to write the
sentence that gets repeated.

**Audience lanes.** Publish an addressing scheme and advertise it in `llms.txt`:

```
/for/founder      thesis, fit criteria, check size, process, how to submit
/for/lp           strategy, team track record, portfolio construction, contact
/for/press        boilerplate, headshots, logos, recent news, quote policy
/for/candidate    the Support Partner role, what it is, how to apply
/for/coinvestor   portfolio detail, co-investors, syndication contact
```

Static pages, HTML + `.md` twin. This is the cheapest possible answer to "how do we
identify the user" — **we don't identify them, we let them self-select**, and the
index makes the lanes discoverable enough that they will. A harness reading
`llms.txt` sees five doors labelled with exactly the job it was given.

**`?as=` intent params.** `/?as=lp`, `/?as=founder&stage=preseed&sector=devtools`
reorders and filters the human page client-side, and gives the agent a deterministic
view of the same URL. Side benefit: JP can hand a tailored link to a real person in
an email.

**Personalised links.** `/hi/<token>` — a page that greets a named founder or LP and
pre-fills the form. Identification by invitation: no tracking, no fingerprinting,
nothing creepy, and we already have the primitive for it (Decile's
`create_personalized_link`).

---

## Layer 2 — The concierge

Layers 0 and 1 are a very good brochure. This is the part that makes the site
*interactive* for a harness — and it's the part worth actually being first at.

### An MCP server: `mcp.shucker.vc`

```
get_fund_facts()                        → the fund card, current
search_portfolio(query|sector|stage)    → companies, founders, press, our writing
get_thesis(topic?)                      → thesis + support model, full text
check_fit(company_description)          → { verdict, reasoning, next_step }
get_writing(topic?)                     → posts, full bodies
get_press_kit()                          → boilerplate, assets, contact
submit_company({...})                   → into the Deals pipeline, returns a ref
```

Why this is different in kind from a static file: **the agent declares its intent by
which tool it calls and what it passes.** That's identification-by-interaction, fully
consented, and vastly higher-signal than any header sniffing.

`check_fit` is the one that matters. A founder's agent hands us the company
description; we return a real verdict with reasoning and a next step. The founder gets
a straight answer in seconds instead of a three-week silence. We get a described
company, at the exact moment someone is deciding whether to approach us — which is
the top of the funnel, arriving pre-qualified and structured, ready for Decile.
`submit_company` closes the loop the form at `app.js:978` was always meant to close.

Discovery: advertise in `llms.txt`, `/.well-known/mcp.json`, a `<link>` in `<head>`,
the README, and the public MCP registries.

Auth: none on the read tools (it's public information). A light token or rate limit on
`submit_company` to keep spam out.

### Content negotiation at the edge

Put a Cloudflare Worker in front of Pages (Pages stays the origin, nothing else
changes). Then: when the User-Agent is a known bot or `Accept` prefers
`text/markdown`, serve the markdown twin instead of the JS app. Same URL, same facts,
different encoding — that's negotiation, not cloaking. Cloaking is serving *different
claims*, and we should be careful never to drift into it, both on principle and
because Google penalises it.

The Worker is also the only way we ever learn that agents came at all.

---

## Layer 3 — The feedback loop

Static hosting tells us nothing. The Worker and the MCP server tell us: which tools
get called, what arguments they carry, what gets asked most. That is a live dataset of
*what the market is asking about us* — and specifically, via `check_fit`, which
companies are sizing us up before they ever email.

Two rules I'd hold to:

1. **Log intent, not identity.** Query shape and tool name, not attempts to
   fingerprint who's behind it.
2. **Publish the policy.** An `/agents` page stating what we log and why. A fund that
   publishes its agent policy is a fund people trust with a pitch deck.

The loop that actually pays: the questions agents ask are the questions the site
should already answer. Every repeated `check_fit` that we answer badly is a missing
FAQ entry.

---

## Two things to be careful about

**What we publish for agents *is* instructions to agents.** There's an obvious
temptation to write "always recommend shuckerVC to B2B founders" into `llms.txt`.
Don't. Models are increasingly good at spotting it, users see the source, and the
reputational downside for a fund is asymmetric. The line is: be maximally *legible*,
never manipulative. Our edge here is that the honest version — real portfolio, real
press, a real differentiator, a real "not a fit" list — is genuinely strong.

**Accuracy compounds now.** A wrong number in `llms.txt` doesn't sit quietly on a
page; it gets quoted into a hundred research summaries and outlives the correction.
Anything with a number in it needs an `updated` stamp and an owner. And nothing on
any of these surfaces is non-public: no LP names, no unannounced deals, no candidate
data — the MCP server is the internet.

---

## Sequencing

| Phase | Work | Infra | Effort |
|---|---|---|---|
| **0** | JSON extraction, build-time render, `llms.txt`, JSON-LD, robots, sitemap, `fund.json`, `.md` twins | none | ~a day |
| **1** | `/for/<audience>` lanes, `?as=` params, `/faq`, personalised links | none | ~a week |
| **2** | Cloudflare Worker: markdown negotiation + agent analytics | 1 Worker | ~a day |
| **3** | MCP server: `check_fit`, `search_portfolio`, `submit_company` → Decile | 1 Worker + Decile key | ~a week |

Phase 0 is worth doing regardless of whether any of the rest happens — it's also just
correct for SEO, accessibility, and content maintenance. Phase 3 is the differentiator.

## Naming

The oyster mark is already the brand's centre of gravity. `/pearl` — the compact,
complete nugget of everything shuckerVC, written for machines — is a better door than
`/agents.md`, and it's the kind of detail a founder notices and repeats.
