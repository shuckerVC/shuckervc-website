# shuckerVC Website — Architecture

One page for anyone touching the system (hi Graham 👋). Three diagrams: how the
site is built and served, how a founder's form submission reaches our deal
pipeline, and what the shucker.vc go-live changes.

---

## 1. The big picture

```mermaid
flowchart LR
    subgraph CONTENT["✍️ Content"]
        N["Notion<br/>🥁 shuckerVC Blog DB"]
    end

    subgraph GITHUB["📦 GitHub (source of truth)"]
        R["Repo<br/>shuckerVC/shuckervc-website"]
        A["GitHub Action<br/>sync-notion (hourly)"]
    end

    subgraph CF["☁️ Cloudflare (hosting)"]
        W["shuckervc-website<br/>Git-connected build<br/>serves site/ as static assets"]
        RL["decile-relay Worker<br/>(form backend)"]
    end

    subgraph DECILE["🗂 Decile Hub (CRM)"]
        MCP["MCP endpoint<br/>decilehub.com/mcp"]
        P["Pipeline: Deals —<br/>shuckerVC Fund I, LP"]
    end

    V(("👤 Visitor"))

    N -- "pull posts + covers" --> A
    A -- "commit insights.json,<br/>covers, feed.xml" --> R
    R -- "every push to main<br/>auto-builds" --> W
    V -- "https://shucker.vc" --> W
    V -- "submits the form" --> RL
    RL -- "upsert_pipeline_prospect<br/>(X-Decile-API-Key)" --> MCP
    MCP --> P
```

**Plain English:** the repo on GitHub is the single source of truth. Publishing
a blog post in Notion, or merging any code change, automatically redeploys the
site on Cloudflare within minutes — nobody deploys anything by hand. The only
separately-managed piece is the small form-relay Worker, which holds the Decile
API key as a secret.

*(GitHub Pages also still serves the old
`shuckervc.github.io/shuckervc-website` URL in parallel as stale-link
insurance. It updates from the same pushes and can be retired after go-live.)*

---

## 2. A founder submits their company

```mermaid
sequenceDiagram
    actor F as Founder
    participant S as shucker.vc<br/>(static site)
    participant W as decile-relay<br/>(CF Worker)
    participant D as Decile MCP
    participant P as Deals pipeline

    F->>S: clicks "Submit your company"
    S->>S: form expands, validates locally
    S->>W: POST /submit (JSON)
    W->>W: origin check · honeypot ·<br/>rate limit · validation
    W->>D: tools/call upsert_pipeline_prospect
    D->>P: create org prospect<br/>stage: "Added by Investment<br/>Inquiries Form" · tag: website-inbound
    W->>D: tools/call add_pipeline_prospect_note<br/>(submitter details)
    W-->>S: ok
    S-->>F: "Thanks — your company is<br/>in front of the partners."
```

**Why MCP and not the REST API:** Decile's edge rejects write requests that
originate from Cloudflare Workers on their REST routes (verified extensively —
identical requests succeed from anywhere else). Their MCP endpoint accepts
Worker traffic, and it's their stated preference for programmatic integrations
anyway. Details in `workers/decile-relay/README.md`.

---

## 3. Go-live: what changes for shucker.vc (Graham's part)

```mermaid
flowchart TD
    S1["1 · Add shucker.vc as a zone<br/>in the Cloudflare account (Free plan)"]
    S2{"2 · Compare imported DNS records<br/>vs the registrar — especially MX + TXT.<br/>Email for @shucker.vc rides on MX!"}
    S3["3 · At the registrar: switch nameservers<br/>to the two Cloudflare assigns"]
    S4["4 · Cloudflare emails when the zone is Active"]
    S5["5 · Workers & Pages → shuckervc-website →<br/>Domains & Routes → add shucker.vc + www"]
    S6["6 · Verify: site loads on https://shucker.vc<br/>AND a test email to @shucker.vc arrives"]

    S1 --> S2
    S2 -- "records complete" --> S3
    S2 -- "anything missing" --> FIX["add missing records<br/>by hand first"] --> S3
    S3 --> S4 --> S5 --> S6
```

The **only risky step is #2** — if the MX records don't survive the move,
email breaks. Everything else is reversible in minutes (switching nameservers
back undoes the whole thing). The old github.io URL keeps serving throughout,
so the website itself is never at risk.

---

## 4. Component inventory

| Component | Where | Auto-updates? | Owner |
|---|---|---|---|
| Website (static `site/`) | Cloudflare — Git-connected Workers build | ✅ on every push to `main` | eng |
| Blog content | Notion → hourly GitHub Action → commit | ✅ hourly (posts need Category + Published date) | JP / team |
| Form relay | Cloudflare Worker `shuckervc-decile-relay` | ✋ manual `wrangler deploy` (rarely changes) | eng |
| Deal intake | Decile pipeline "Deals - shuckerVC Fund I, LP" | ✅ receives form submissions live | JP |
| RSS feed | `site/feed.xml`, rebuilt by the sync | ✅ | — |
| Legacy URL | GitHub Pages (`shuckervc.github.io/…`) | ✅ same pushes | retire post-launch |
| DNS / domain | shucker.vc → Cloudflare zone (pending) | — | **Graham** |

## 5. Secrets (never in the repo)

| Secret | Lives in | Rotation |
|---|---|---|
| `NOTION_TOKEN` | GitHub Actions secrets | rotate in Notion → update repo secret; keep integration shared with the Blog DB |
| `DECILE_API_KEY` | Cloudflare Worker secret | regenerate in Decile Hub → `npx wrangler secret put DECILE_API_KEY` |
