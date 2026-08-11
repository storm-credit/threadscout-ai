# Master Design Review Checklist

Use this before declaring design complete.

## Product

- [x] Core user and job-to-be-done defined
- [x] Primary content lanes defined
- [x] Issue/public-figure lane bounded
- [x] Non-goals defined
- [x] Daily operating model defined
- [ ] User approves Master Spec direction

## UX / decision support

- [x] Four first-screen layout options compared
- [x] Opportunity Inbox selected as mobile primary view
- [x] Detailed screen set S01–S10 defined
- [x] Critical first-card fields defined for 360 px width
- [x] Guardian status placed before approval CTA
- [x] Suppression controls defined
- [ ] Final visual density and interaction pattern approved

## Ranking

- [x] Four ranking architecture options compared
- [x] Opportunity score separated from evidence readiness, risk, and freshness
- [x] Score weights defined conceptually
- [x] Portfolio diversity behavior defined
- [x] High score cannot bypass a blocker
- [ ] Final production thresholds and evidence TTLs approved

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
- [x] Source roles/independence rule defined
- [x] Exact product states defined
- [x] Media analysis vs publication-right distinction defined
- [x] Media usage scenario matrix defined
- [x] Owned/licensed/embed/link/text-only fallback order defined
- [x] Public-figure relationship classes defined
- [x] Issue source grades G0–G4 defined
- [x] Product relation grades R0–R5 defined
- [x] Rumor/private-life content blocked
- [ ] Exact live issue/news source allowlist approved
- [ ] Exact media source/action policy reviewed at implementation time

## Commerce and affiliate

- [x] Commerce snapshot concept defined
- [x] Exact vs alternative affiliate mapping defined
- [x] Stale price/listing behavior defined conceptually
- [ ] First affiliate network/program confirmed
- [ ] Current disclosure/link policy confirmed
- [ ] Authorized exact-product listing evidence source confirmed

## Publishing

- [x] State model defined
- [x] Human approval binding defined
- [x] Idempotency and unknown-remote-state design defined
- [x] Preflight invalidation defined
- [ ] Live Threads publishing capability/permission confirmed

## Analytics

- [x] Attention/intent/commercial/trust metrics separated
- [x] Learning output bounded
- [x] Viral-but-unsafe pattern excluded from learning
- [x] Daily vs weekly learning behavior defined
- [ ] Actual available metrics confirmed from live source/account

## Scenarios

- [x] Evergreen practical product scenario defined
- [x] Celebrity/broadcast product scenario defined
- [x] Viral video without reuse-rights scenario defined
- [x] Substitute affiliate mapping scenario defined
- [x] User-owned media scenario defined
- [x] High-score-but-blocked scenario defined
- [x] Stale price scenario defined
- [x] No-good-candidate day defined
- [x] Disputed/expired issue scenario defined
- [x] Unsafe analytics pattern scenario defined
- [x] Acceptance tests AT-25–AT-28 cover ranking/media/issue/daily-operation details

## Security / operations

- [x] Secret boundary defined
- [x] Fail-closed behavior defined
- [x] Traceability matrix exists
- [x] Behavioral acceptance tests exist
- [x] Design-CI target semantics documented
- [ ] Deployment target selected
- [ ] Secret manager/environment selected
- [ ] Retention/TTL defaults approved

## GitHub / design governance

- [x] `docs/spec/` is design authority
- [x] Runtime/product code freeze is explicit
- [x] Design PR scope is documentation-only
- [x] Future Actions design checks are specified
- [x] Detailed-design requirements are mapped into traceability
- [ ] Master Design v1 is approved and promoted from draft baseline

## Resume condition

Design is not “done” until all P0 items are checked or explicitly deferred behind disabled features and the user approves the Master Spec direction.

Implementation remains frozen even when the existing GitHub Actions prototype regression job is green.
