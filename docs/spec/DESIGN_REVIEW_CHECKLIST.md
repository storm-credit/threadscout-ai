# Master Design Review Checklist

Use this before declaring design complete.

## Product

- [x] Core user and job-to-be-done defined
- [x] Primary content lanes defined
- [x] Issue-trigger lane bounded
- [x] Non-goals defined
- [x] Daily operating model defined
- [x] Worked 20-to-5 selection example defined
- [ ] User approves Master Spec direction

## UX / decision support

- [x] Four first-screen layout options compared
- [x] Four structural mobile wireframes documented
- [x] Opportunity Inbox selected as mobile primary view
- [x] Detailed screen set S01–S10 defined
- [x] Critical first-card fields defined for 360 px width
- [x] Guardian status placed before approval CTA
- [x] Suppression controls defined
- [ ] Final visual styling and interaction pattern approved

## Ranking

- [x] Opportunity score separated from evidence readiness, risk, and freshness
- [x] Score weights defined conceptually
- [x] Portfolio diversity behavior defined
- [x] Worked selection demonstrates score is not sovereign
- [x] High score cannot bypass a blocker
- [ ] Production score threshold calibrated

## Orchestra

- [x] Exactly six agents fixed
- [x] Agent responsibilities defined
- [x] Agent inputs/outputs defined
- [x] Tool boundaries defined
- [x] Handoff envelope defined
- [x] Retry/escalation rules defined
- [x] Guardian/human gates defined

## Evidence and media

- [x] Source hierarchy defined
- [x] Exact product states defined
- [x] Research media and final-use media separated
- [x] Four media strategy options compared
- [x] Dual-funnel strategy selected
- [x] Media fallback order defined
- [x] Issue source grades G0–G4 defined
- [x] Product relation grades R0–R5 defined
- [x] Issue-to-product action matrix defined
- [ ] Exact live source allowlist approved
- [ ] Source-specific final-use policy reviewed at implementation time

## Commerce and publishing

- [x] Commerce snapshot concept defined
- [x] Exact vs alternative mapping defined
- [x] Stale listing behavior defined conceptually
- [x] Publishing state and reconciliation model defined
- [x] Human approval binding defined
- [ ] First affiliate program confirmed
- [ ] Current disclosure/link rules confirmed
- [ ] Authorized exact-product listing source confirmed
- [ ] Live Threads capability confirmed

## Analytics

- [x] Attention/intent/commercial/trust metrics separated
- [x] Learning output bounded
- [x] Unsafe high-performing patterns excluded from learning
- [x] Daily vs weekly learning behavior defined
- [ ] Actual available metrics confirmed

## Design governance

- [x] `docs/spec/` is design authority
- [x] Runtime/product code freeze is explicit
- [x] Design PR scope is documentation-only
- [x] Future Actions design checks are specified
- [x] P0/P1 table added
- [x] Acceptance addendum AT-29–AT-33 added
- [x] Traceability addendum added
- [ ] Deployment target selected
- [ ] Production credential storage selected
- [ ] Provisional TTL/retention defaults promoted or revised
- [ ] Master Design v1 approved and promoted from draft baseline

## Resume condition

Design is not “done” until required P0 items are resolved or explicitly deferred behind disabled features and the Master Spec direction is approved. A green prototype-regression job does not lift the implementation freeze.
