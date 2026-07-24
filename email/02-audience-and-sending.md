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
resurrect every past opt-out. This must be fixed before any bulk send — see §5.

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

1. **Does the `LP Lead` send happen at all before counsel reviews it?** This is the
   blocking decision; everything else is implementation.
2. **Is the newsletter one template with variants, or separate newsletters?** The founder
   audience in particular wants different content, not a subset.
3. **Who owns the `unsubscribe@` mailbox** and the weekly write-back into Notion?
4. **What happens to the 145 untagged contacts** — classify, or exclude permanently?
5. The 2026-07-21 review also asked for **shorter teasers linking out to the website blog**
   rather than long inline content. That is a template change not yet made, and it would
   also reduce how much sensitive detail sits in the email body itself.
