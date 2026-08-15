# Master Design v1 Baseline Manifest

Status: **APPROVED DESIGN BASELINE + HARNESS DESIGN COMPLETE.**

Purpose: provide one compact handoff document for the next implementation cycle. This manifest does not replace `MASTER_SPEC.md`; it identifies what is fixed, what is configurable, what is disabled until activation, what the executable harness must prove, and how the first Coding Spike is bounded.

## Product identity

- Name: ThreadScout AI
- Primary user: one Korean-speaking owner
- Primary surface: mobile-first responsive web
- Secondary surface: desktop web for deeper review
- PWA: optional enhancement
- Native iOS/Android: outside MVP
- Core job: find useful product opportunities, verify truth/rights/identity, create four useful content approaches, obtain human approval, publish safely, and learn without optimizing into spam/gossip

## Fixed architecture invariants

1. Exactly six agents exist: Orchestrator, Product Scout, Evidence Verifier, Content Strategist, Threads Writer, Integrity Guardian.
2. There is no price agent.
3. Factual confidence comes from evidence, not from multiple agents repeating the same statement.
4. Verifier owns downstream factual authority through versioned evidence packets.
5. Infrastructure/state/publishing/metrics remain deterministic services.
6. Agents do not receive direct publishing or payment authority.
7. Guardian review and explicit human approval are required before external publication.
8. Approval binds exact draft/evidence/media/affiliate/config revisions.
9. Browser/PWA lifecycle is never authority for scheduling, publication, or durable approval state.
10. Exact/likely/substitute/unresolved product states remain distinct.
11. Research media and final-use media are separate states.
12. Rumor/private-life public-figure content is not a monetization lane.
13. Public appearance/use is not rewritten into endorsement without evidence.
14. High opportunity score cannot override evidence, risk, freshness, suppression, or rights blockers.
15. `오늘 추천 없음` and zero posts are valid outcomes.
16. Unknown live capability state fails closed.

## Approved v1 product defaults

- daily capacity: 0–3 posts
- affiliate-heavy posts: normally <= 1/day
- first-screen recommendations: <= 5
- initial opportunity review floor: 65/100, non-sovereign
- price/stock TTL when explicitly claimed: 4h
- listing identity revalidation: within 24h of scheduled publication plus dispatch preflight as applicable
- fast issue-linked freshness: 12h
- attention ranking freshness: 6h
- suppression: until explicit restore
- source excerpt retention: 30d default ceiling
- media metadata retention: 90d default ceiling
- audit retention: 365d default ceiling
- notifications: blocker/material-change/approval/publish-incident first

## Commercial baseline

- first affiliate target: Coupang Partners
- MVP commercial entry path: owner-supplied destination URL + versioned product/variant/seller snapshot
- automated product search: not required for v1
- seller-management APIs or undocumented scraping: not substitutes for authorized affiliate discovery
- live commercial posting: disabled until current account/program disclosure/link rules are reviewed

## External platform baseline

### Threads

Architecture includes separate adapters for keyword discovery, insights, and publishing. Actual target app/account permission and token state remain activation-time facts.

### NAVER

NAVER search-trend/shopping-insight corroboration follows the approved API-HUB direction in the source strategy. Legacy shopping-search behavior is not an exact-product authority.

### Media

Unknown publication rights are blocked. Discovery/viewability does not imply download, transform, or republication rights.

## Harness Design v1

The selected harness architecture is **contract-first adaptation of existing runtime assets**.

It does not rewrite the Phase2A–2F prototype from scratch and does not jump directly to live providers. It wraps/adapts the existing orchestra, replay, store, broker, fixture research, and readiness concepts behind Master Design contracts and deterministic acceptance oracles.

Canonical harness handoff:

- `HARNESS_BLUEPRINT.md` — architecture, layers, modes, success/stop conditions
- `HARNESS_ACCEPTANCE_MATRIX.md` — fixture catalog, AT-01~44 validation ownership, first-spike subset
- `IMPLEMENTATION_GAP_ANALYSIS.md` — prototype `KEEP / MODIFY / RETIRE / MISSING`
- `CODING_SPIKE_ENTRY.md` — exact first spike boundary

## Capability states at harness-design completion

| Capability | Designed | Harness contract specified | Implemented to Master Design | Enabled/live verified |
|---|---:|---:|---:|---:|
| local/manual opportunity workflow | yes | yes | no | no |
| owner-supplied destination verification | yes | yes | no | no |
| six-agent orchestration against approved contracts | yes | yes | no | no |
| deterministic replay/store prototype | pre-baseline | migration specified | legacy only | n/a |
| stale review/approval binding | yes | yes | no | no |
| Threads keyword discovery | yes | later harness slice | no | no |
| Threads insights | yes | later harness slice | no | no |
| Threads publishing | yes | later preflight/reconciliation slice | no | no |
| Coupang live affiliate publishing | yes | later commercial slice | no | no |
| third-party media republication | policy designed | fail-closed scenario specified | no | no |

Design, harness specification, implementation, configuration, enablement, and live verification are distinct states.

## First Coding Spike contract

When the owner explicitly resumes coding, Spike 0 must prove the no-network contract spine:

`owner-supplied fixture product → Verifier → Strategist(4) → Writer(4) → Guardian → human-decision domain binding → material upstream mutation → stale approval rejection`.

Scout is skipped only through the explicit-owner-product routing exception. The roster still contains exactly six agents.

The spike excludes live Threads/Coupang, public posting, automated product search, third-party media reuse, analytics learning, and full UI redesign.

## Canonical verification artifacts

- `FINAL_BLIND_SPOT_SWEEP.md`
- `B0_TRACEABILITY_MATRIX.md`
- `TRACEABILITY_MATRIX.md`
- `ACCEPTANCE_TESTS.md` (AT-01 through AT-44)
- `HARNESS_BLUEPRINT.md`
- `HARNESS_ACCEPTANCE_MATRIX.md`
- `IMPLEMENTATION_GAP_ANALYSIS.md`
- `CODING_SPIKE_ENTRY.md`
- `DESIGN_CONTRADICTION_REVIEW.md`
- `DESIGN_REVIEW_CHECKLIST.md`
- `DESIGN_FINALIZATION_PLAN.md`
- `P0_P1_DECISION_TABLE.md`
- `USER_DECISION_REGISTER.md`
- `../PRE_IMPLEMENTATION_TRAPS.md`

## Prototype treatment

Anything under the repository that predates this baseline is classified as:

- `KEEP` — compatible/reusable foundation
- `MODIFY` — useful but insufficient for the approved contract
- `RETIRE` — obsolete behavior after replacement and regression coverage; no automatic deletion
- `MISSING` — approved capability not sufficiently implemented

`IMPLEMENTATION_GAP_ANALYSIS.md` is the current authoritative migration classification.

## Implementation entry contract

A future code task must state:

- exact current main baseline SHA
- chosen implementation slice / Spike ID
- requirements and acceptance IDs in scope
- Harness fixtures in scope
- B0 items applicable to the slice
- pre-implementation traps checked
- live capabilities intentionally disabled/enabled
- files/components allowed to change
- tests/verification to run
- rollback/stop conditions
- reference review and four-option decision when a major implementation choice remains

## Completion meaning

This manifest certifies **Master Design completion and Harness Design completion only**.

It does not claim that ThreadScout is production-ready, live-connected, or capable of posting to Threads today. The pre-baseline prototype harness is executable, but the Master-Design-aware harness defined here is not yet implemented.