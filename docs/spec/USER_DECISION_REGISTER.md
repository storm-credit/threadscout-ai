# Product Owner Decision Register v1

Status: **APPROVED DESIGN BASELINE**.

## Owner direction

The owner instructed the project to continue automatically through completion of the design phase. Safe, reversible design defaults are therefore promoted where the direction had already been established. Live/account-specific facts are never invented; they remain activation-time gates with the corresponding capability disabled until verified.

## Approved baseline direction

- Korean-first, one-owner, one-primary-account MVP
- mobile-first responsive web application
- desktop fully supported for evidence-heavy review
- PWA-ready but never required for correctness
- native iOS/Android outside MVP and reconsidered only on measured need
- practical demonstrable products as the primary lane
- exactly six agents including Orchestrator
- no dedicated price agent
- approval-first workflow
- Opportunity Inbox as the primary mobile screen
- four differentiated strategy paths and four draft outputs
- opportunity score separated from evidence readiness, risk, freshness, and suppression
- public-event/celebrity signals only as product-relevant triggers, never a gossip lane
- research media separated from final-use media
- exact and alternative products clearly separated
- no forced daily posting quota
- browser/PWA is not authority for scheduling, publication, durable approvals, or evidence truth
- server-authoritative cross-device state with stale approval rejection
- unsafe/high-performing patterns cannot train the system toward lower trust or policy violations

## Promoted operating defaults

- 0–3 daily posting capacity; zero is valid
- normally no more than one affiliate-heavy post per day
- maximum five recommendations in the first-screen inbox
- initial opportunity review floor 65/100, ranking-only and non-sovereign
- price/stock TTL 4h when explicitly stated
- listing identity revalidation within 24h of scheduled publication plus dispatch preflight when needed
- fast issue-linked freshness 12h
- attention input freshness 6h
- suppression persists until explicit restore
- source excerpt retention 30d, media metadata 90d, audit 365d as default ceilings subject to stricter source/privacy rules
- notification emphasis on blockers, material changes, approval needs, and publish incidents rather than informational noise

## Live-dependent decisions: explicitly deferred, not unresolved design

| Area | Baseline | Activation-time gate |
|---|---|---|
| Threads discovery/publishing/insights | official API adapter architecture retained | verify target Meta app/account scopes, token, and current capability immediately before enabling |
| product/listing evidence | user-supplied destination + versioned identity snapshot is valid MVP source | automated listing discovery requires an authorized source before activation |
| affiliate network | Coupang Partners is the first target | verify current account-specific disclosure/link/operating rules before live commercial posting |
| deployment vendor | managed server/runtime + PostgreSQL + permitted object storage architecture | choose vendor/region during implementation without changing authority boundaries |
| credential storage | managed secret storage/server-side encrypted injection | configure exact secret backend during deployment |
| media use | research-only by default; owned/licensed/explicitly permitted treatment for final use | source/asset/action-specific rights must be recorded before download/transform/republish |
| performance metrics | analytics schema supports partial/unknown metrics | confirm metrics exposed to the configured Threads account and affiliate data source |

## Decision change rule

The owner may later tune reversible defaults without reopening the whole architecture. Any proposal to remove human approval, change the six-agent roster, allow price to become a separate agent, weaken exact-product/alternative labeling, weaken media rights, let browser state become publishing authority, or permit rumor/private-life monetization requires a fresh four-option design review, blind-spot sweep, decision log entry, and acceptance-test update before implementation.
