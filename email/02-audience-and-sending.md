# Track B — Audience, segmentation, and sending

Who receives the newsletter, what each group should see, and what has to be true before a
send happens. Track A ([01-delivery-and-security.md](01-delivery-and-security.md)) covers
the mechanics of getting mail delivered safely; this document covers the harder question
of who it goes to.

---

## 1. The audience lives in Notion, not Decile Hub

The recipient list is the **Notion Contacts DB** (`👥 Contacts`,
`collection://702aa5db-5b07-43a3-8c36-05bb5dae06ec`), segmented by its `Tags` multi-select.
Decile Hub supplies deal and fund *content* and can send, but it has no list management,
so it cannot be the system of record for who gets mail.

Counts as of 2026-07-24:

| Tag | Contacts | With email | Notes |
|---|---:|---:|---|
| `LP Lead` | 485 | **269** | Prospective LPs |
| *(untagged)* | 145 | 75 | Unclassified |
| `Founder` | 117 | 40 | Portfolio + deal-flow founders |
| `LP` | 51 | **48** | Committed Fund I LPs |
| `Connector` | 9 | 8 | Referrers / network |
| `Support Partner` | 1 | 1 | |

The shape of that table is the single most important fact about this newsletter.
**Emailable prospects outnumber committed LPs 5.6 to 1.** Whatever it is called
internally, by volume this is a prospect-marketing vehicle, not an LP report — and it
should be designed, reviewed, and governed as one.

---

## 2. Two blocking gaps

**No consent state exists.** The Contacts schema has no subscription, opt-in, opt-out, or
suppression field anywhere. There is currently no way to record that someone unsubscribed,
and no way for a send to check. Rebuilding the list from Notion each month would silently
resurrect every past opt-out — which, if any recipient has ever asked to be removed, is a
live CAN-SPAM problem under §7704(a)(4)(A)(i) today, entirely independent of the
securities-law question below. This must be fixed before any bulk send — see §6.

**Prospect relationships are undocumented.** Of 485 `LP Lead` contacts, exactly **1** has a
linked meeting, **0** have encounter records, and **1** has a named introducer. 444 carry
`Source: Other`, and the Drive artifacts behind them look like bulk data (a Preqin LP
export, institutional contact sheets, an enriched conference attendee list) rather than
relationships. By contrast the 51 committed `LP` contacts show meetings, encounters, and
introducers.

That asymmetry matters well beyond email hygiene, because of what the newsletter is for.

---

## 3. What this newsletter is actually for

The 2026-07-21 partner meeting records it plainly: the newsletter design targets
**prospective LPs for Fund II, not current LPs**, and the discussion of TVPI was that
strong numbers "should be shown prominently to provoke interest from prospective LPs,"
benchmarked against public 2024-vintage medians.

So the accurate framing is not "informing contacts about a closed fund's performance." It
is **using Fund I performance to generate Fund II demand among prospects**, most of whom
have no documented prior relationship with the firm. Fund I being closed does not neutralize
this, because the audience and the stated purpose both point at the next fund.

That combination — unrealized performance figures, sent to bulk-sourced prospects, in
service of an upcoming offering — is the fact pattern that needs a lawyer's eyes before it
goes out, not a template change. Treat it as blocking for the `LP Lead` segment.

### Why, specifically (research summary — not legal advice)

The concern is not vague. Under Securities Act §2(a)(3) an "offer" is defined expansively,
and publicity that conditions the public mind or arouses interest in securities counts as
one. SEC staff applied this to Reg D in **C&DI 256.25**, which says factual business
information — the stuff you *can* distribute freely — "generally does not include
predictions, projections, forecasts or **opinions with respect to valuation of a security**,
nor for a continuously offered fund would it include **information about past performance of
the fund**."

A 2024-vintage TVPI is precisely an opinion about the valuation of securities: it is the
GP's own marks on private companies expressed as a multiple. On the face of 256.25 it sits
outside the safe harbour. And **Rule 152(c)(2)** provides that a Reg D offering commences on
the date the issuer first makes an offer — so if the newsletter is an offer of Fund II, it
*commences that offering by mass email to a bulk-sourced list*, which Rule 502(c) prohibits
inside a 506(b) raise.

If the exemption fails the consequences are not cosmetic: a §5 violation, **§12(a)(1)
rescission rights** (LPs can demand their capital back with interest), loss of NSMIA
preemption reopening state blue-sky authority, and no fallback — **C&DI 260.13** states that
general solicitation "continues to be incompatible with a claim of exemption under Section
4(a)(2)."

Two things cut in your favour. The taint is **per-purchaser**, not fund-wide: Rule
152(a)(1) turns on reasonable belief, as to each purchaser, that they were not solicited
through general solicitation *or* had a substantive relationship beforehand. Committed Fund I
LPs and genuinely-known prospects who never received a performance blast are not tainted by
one. And practitioners treat the taint as fading with time — though the SEC has never
specified a cooling-off period, so that is genuinely unsettled.

**The newsletter does not help build the relationship that would cure this — it works
against it.** A pre-existing substantive relationship requires that the issuer has
sufficient information to evaluate a prospect's financial circumstances and sophistication
*and does in fact evaluate it* (**C&DI 256.31**; self-certification by checkbox is expressly
insufficient). A newsletter is unilateral outbound broadcast: no information flows in and
nothing is evaluated. Worse, it timestamps an offer made *before* any relationship existed.
**C&DI 256.33**, revised in March 2025, reads almost against this fact pattern — the more
people without prior relationship contacted through "impersonal, non-selective means of
communication," the more likely it is general solicitation. A monthly HTML blast to 269
addresses is definitionally that, and §2 of this document shows the relationship evidence
is not there to rebut it.

One framing correction worth recording: this is **not** an integration problem. Integration
doctrine resolves whether two offerings collapse into one. If the newsletter is an offer of
Fund II there is only one offering, and the issue is direct.

---

## 4. Segment design

Four distinct audiences, and they want genuinely different things. The current single
template serves only the first.

### `LP` — committed Fund I LPs (48)
The one segment where the full template is clearly appropriate. Existing-investor
reporting on a fund they are already in: fund snapshot including TVPI and deployed capital,
portfolio detail, market view, upcoming events. Send from the fund-communications stream.
Consider mirroring content already required under the LPA rather than inventing a parallel
channel.

### `LP Lead` — prospective LPs (269)
The contested segment. Recommended default until counsel says otherwise: **the same
newsletter with the fund-snapshot block removed** — thesis, portfolio wins, market insight,
where-to-find-us, and a clear call to start a conversation. That preserves the relationship-
building purpose while removing the performance-marketing exposure, and the template already
supports it since the snapshot is a self-contained block.

If counsel green-lights performance to prospects, it should still be gated on a documented
substantive relationship and known accreditation status — neither of which the CRM currently
records for this group.

### `Connector` — referrers and network (8)
They refer deals and LPs; they are not investors. Give them thesis, what shuckerVC is
actively looking for, portfolio wins worth sharing, and an explicit ask. No fund
performance — routing performance data through connectors to reach LPs is the same
solicitation question wearing a hat.

### `Founder` — portfolio and deal-flow founders (40)
Different newsletter entirely. Support-model resources, hiring, portfolio introductions,
what the firm is seeing in the market. **Not** fund performance, and take care with the
"Across the portfolio" block: it names other portfolio companies' ARR, enterprise logos,
and hiring. Founders generally have no right to each other's metrics, and portfolio
companies would not expect their numbers circulated to peers. Either drop that block for
this segment or restrict it to items each company has already made public.

### *(untagged)* — 145 contacts, 75 emailable
**Do not send.** Classify first. An unclassified contact is one whose consent, relationship,
and appropriate content are all unknown.

---

## 5. Presenting performance: a bare TVPI is below every published standard

The template's fund-snapshot block shows three numbers — portfolio count, deployed capital,
and a single unqualified TVPI. Measured against the published reporting standards, that
presentation is incomplete, and the gap is worth closing regardless of how the audience
question in §3 resolves.

**What the standards ask for.** ILPA's Quarterly Reporting Standards specify TVPI, DPI and
RVPI as a *set*, not individually. ILPA Principles 3.0, in the section specifically on fund
marketing materials during fundraising, asks for prior-fund performance "on a gross and net
basis, including IRR, multiple of capital and distributed to paid-in capital metrics," plus
the derivation, plus unrealized values based on the most recent audited financials. ILPA's
DDQ 2.0 — which is what a prospective LP will send you — asks for net and gross TVPI, DPI
and RVPI, vintage year, and figures both with and without any credit facility. The GIPS
standards require, alongside a since-inception return, the whole set: paid-in capital,
distributions, committed capital, TVPI, DPI, PIC multiple and RVPI.

**Why it matters more here than usual.** Fund I is a 2024 vintage roughly two years in. Its
TVPI is almost entirely unrealized markup, and DPI is likely 0.0x. Showing TVPI alone is
precisely the presentation that conceals that nothing has been returned yet — which is the
thing a sophisticated LP will ask about first, and the thing that makes an incomplete
figure look like an attempt to flatter.

**The Marketing Rule point.** SEC staff guidance in March 2025 relaxed some gross-only
presentation requirements, but that relief **expressly does not extend to IRR, MOIC or
TVPI** — those remain performance figures requiring accompanying net presentation with equal
prominence. Whether the Marketing Rule binds shuckerVC directly depends on its adviser
registration status, which is a question for counsel; but the disclosure norm it encodes is
also what ILPA and GIPS ask for independently, so the practical answer converges.

**Being an Exempt Reporting Adviser is not a shield, and this is the part most often gotten
wrong.** ERA status does exempt a firm from most substantive Advisers Act rules, plausibly
including the Marketing Rule. It does **not** exempt anyone from Advisers Act §206 or from
**Rule 206(4)-8**, which by its terms applies to any adviser to a pooled investment vehicle
with no registration predicate — and which prohibits materially misleading statements to
investors *or prospective investors* in the pool. A performance figure sent to prospective
LPs sits inside that rule's plain language. The SEC's adopting release for the rule
(IA-2628) is unusually direct on all three points that matter here: it states the rule
"applies to both registered and unregistered investment advisers"; it rejects the argument
that prospects aren't harmed until they invest, saying misleading statements "are no less
objectionable when made in an attempt to draw in new investors"; and it names the exact
subject matter — "the performance of the pool" and "the valuation of the pool," reached
through "electronic solicitations." Critically, **§206(4) requires no scienter**: negligent
deception is enough, so good faith is not a defence. This is not theoretical for venture: the SEC
brought several 206(4)-8 actions against ERAs in 2022 alone, most of them VC advisers,
including Alumni Ventures Group (IA-5975), SparkLabs Global Ventures (IA-6121) and Energy
Innovation Capital (IA-6104).

The closest precedent to this specific risk is **Oppenheimer / Brian Williamson** (2013–14):
a private-equity fund-of-funds manager who marked the fund's largest holding above the
underlying manager's own estimate and circulated marketing materials to prospective
investors showing an IRR gross of fees and expenses — a reported 12.4% that was as low as
**−6.3% net**. Outcome: industry bar plus a $100,000 penalty.

To be fair about the limits of the analogy: research turned up **no** SEC action charging a
PE or VC adviser specifically for inflating portfolio-company marks while raising a
successor fund. The exposure here is the disclosure framing around the number, not the
number itself — which is exactly the part that is cheap to fix.

**The self-interested argument, which is stronger than the compliance one.** Sophisticated
LPs already discount early marks, and the research is unkind to the tactic. Studying 761
CalPERS fund investments, Jenkinson, Sousa and Stucke found NAVs are systematically inflated
during the follow-on fundraising window — peaking roughly one quarter before first close,
then reversing — and that interim performance had little power to predict final performance,
*worst of all for venture*. Harris, Jenkinson, Kaplan and Stucke found that persistence
largely disappears once you use only the information an LP actually had at fundraising time.
Cambridge Associates, across 2,100+ funds, found most take about six years to settle into
their eventual quartile, with 80–90% ranked in three different quartiles along the way.

Most pointed for a GP: Brown, Gredil and Kaplan found that aggressive marks are associated
with a **lower** probability of raising a follow-on fund — an effect comparable in size to
being a top-tercile performer. LPs largely see through optimistic marks and penalise them.
So leading with a lone unrealised TVPI to prospects is not just a disclosure problem; on the
evidence it is a weak fundraising move. Meanwhile the context makes an early figure
unremarkable rather than impressive: per Carta, only about a quarter of 2021-vintage venture
funds had returned *any* capital by late 2025, and top-decile DPI for that vintage was around
0.12x. Nobody expects distributions from a 2024 fund — which is precisely why the honest
presentation costs you little.

**Minimum viable change to the template.** If any performance figure ships at all, show
TVPI, DPI and RVPI together, labelled net or gross explicitly, with the vintage year and a
plain statement that value is substantially unrealized. That is four short stats instead of
one — a layout change, not a rebuild — and it is defensible to any LP who asks how the
number was derived.

---

## 6. Required Notion schema additions

Add to the Contacts DB before the first bulk send:

| Field | Type | Purpose |
|---|---|---|
| `Newsletter Status` | select | `Subscribed` / `Unsubscribed` / `Never sent` / `Bounced` — the authoritative send gate |
| `Newsletter Segment` | select | `LP` / `LP Lead` / `Connector` / `Founder` — resolved audience, so send logic doesn't re-derive it from overloaded `Tags` |
| `Unsubscribed Date` | date | Evidence of when the request was honored |
| `Consent Source` | text | How they joined the list — the record you want if anyone ever asks |
| `Accreditation Status` | select | Only if counsel requires it for the prospect segment |

`Newsletter Status` is the important one: it must be checked at send time, and an
unsubscribe must survive every future re-import and re-tagging.

---

## 7. Send pipeline

1. **Resolve the segment** — query Contacts by `Newsletter Segment`, filtering to
   `Newsletter Status = Subscribed` and a non-empty email.
2. **Pick the variant** — full, prospect (no fund snapshot), connector, or founder.
3. **Merge** the seven `{{custom.*}}` values, HTML-escaped, per the contract in
   [01-delivery-and-security.md](01-delivery-and-security.md).
4. **Review** — the existing fact-check gate, plus a confidentiality pass on any
   portfolio-company detail that is not already public.
5. **Send** with the `List-Unsubscribe` header set.
6. **Write back** — log the send, and process the `unsubscribe@` mailbox into
   `Newsletter Status` before the next issue.

---

## 8. Open questions for JP and Graham

1. **Is Fund II a 506(b) or a 506(c) offering?** This is the fork everything hangs on, and
   the uncomfortable part is that it gets decided *by* the first solicitation whether or not
   anyone intends to decide it. 506(c) permits general solicitation outright — the
   newsletter, the TVPI, the whole demand-gen motion becomes available — but every purchaser
   must be verified accredited, and the verification shortcut for existing investors does
   **not** carry over from Fund I (C&DI 260.10). March 2025 staff guidance makes this much
   cheaper via a $200K individual / $1M entity minimum plus written representations, but that
   only helps if your minimums actually clear those thresholds; smaller angel cheques need
   documented third-party verification on every close. Note the door swings one way: you can
   move 506(b) → 506(c) before any sales, but 506(c) → 506(b) only if you never solicited.
2. **Does the `LP Lead` send happen at all before counsel reviews it?** Blocking until
   question 1 is settled.
3. **Has the offering already commenced?** The partner meeting records informal polling of
   "high-potential Fund 2 LPs." Worth asking counsel whether that started the clock under
   Rule 152(c)(2).
4. **Is the newsletter one template with variants, or separate newsletters?** The founder
   audience in particular wants different content, not a subset.
5. **Who owns the `unsubscribe@` mailbox** and the weekly write-back into Notion?
6. **What happens to the 145 untagged contacts** — classify, or exclude permanently?
7. The 2026-07-21 review also asked for **shorter teasers linking out to the website blog**
   rather than long inline content. That is a template change not yet made, and it would
   also reduce how much sensitive detail sits in the email body itself.
