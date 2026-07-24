# Founder Focus Dispatch — LP newsletter

The email template and everything needed to send it. Kept **outside `site/`** so the
static deploy never publishes it.

| File | What it covers |
|---|---|
| [`newsletter-template-gmail.html`](newsletter-template-gmail.html) | The template itself. Send from this file, not the design-source copy in `design/`. |
| [`01-delivery-and-security.md`](01-delivery-and-security.md) | **Track A** — merge contract, template security, unsubscribe mechanics, authentication and deliverability. Largely settled. |
| [`02-audience-and-sending.md`](02-audience-and-sending.md) | **Track B** — who receives it, how the Notion CRM segments them, and what content each group should see. Carries the blocking decision. |

The two tracks are deliberately separate because they fail differently. Track A is
engineering: get it right once and it stays right. Track B is judgment about audience and
disclosure, and it has a question in it that a template change cannot answer — see Track B
§3 before scheduling a send to prospective LPs.
