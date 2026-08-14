# Master Design v1 Baseline Manifest

Status: **APPROVED DESIGN BASELINE**.

Purpose: provide one compact handoff document for the next implementation cycle. This manifest does not replace `MASTER_SPEC.md`; it identifies what is fixed, what is configurable, what is disabled until activation, and what implementation must prove.

## Product identity

- Name: ThreadScout AI
- Primary user: one Korean-speaking owner
- Primary surface: mobile-first responsive web
- Secondary surface: desktop web for deeper review
- PWA: optional enhancement
- Native iOS/Android: outside MVP
- Core job: find useful product opportunities, verify truth/rights/identity, create four useful content approaches, obtain human approval, publish safely, and learn without optimizing into spam/gossip

## Fixed architecture invariants

1. Exactly six agents exist:
   - Orchestrator
   - Product Scout
   - Evidence Verifier
   - Content Strategist
   - Threads Writer
   - Integrity Guardian
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
- MVP commercial entry path: user-supplied destination URL + versioned product/variant/seller snapshot
- automated product search: not required for v1
- seller-management APIs or undocumented scraping: not substitutes for authorized affiliate discovery
- live commercial posting: disabled until current account/program disclosure/link rules are reviewed

## External platform baseline

### Threads

Architecture includes separate adapters for:

- keyword discovery
- insights
- publishing

Meta-published Threads API material reviewed for this baseline documents OAuth authorization, keyword search, publishing, and insight endpoints. Actual target app/account permission and token state remain activation-time facts.

### NAVER

NAVER search-trend/shopping-insight corroboration is designed against the current NAVER API HUB direction. Legacy NAVER Developers shopping-search API is not an exact-product source for this design.

### Media

Unknown publication rights are blocked. Discovery/viewability does not imply download, transform, or republication rights.

## Capability states at design completion

| Capability | Designed | Configured | Enabled | Live verified |
|---|---:|---:|---:|---:|
| local/manual opportunity workflow | yes | no | no | no |
| user-supplied destination verification | yes | no | no | no |
| six-agent orchestration against approved contracts | yes | no | no | no |
| Threads keyword discovery | yes | no | no | no |
| Threads insights | yes | no | no | no |
| Threads publishing | yes | no | no | no |
| Coupang live affiliate publishing | yes | no | no | no |
| third-party media republication | policy designed | asset-specific | fail-closed | no |

Design completion does not collapse these columns.

## Canonical verification artifacts

- `FINAL_BLIND_SPOT_SWEEP.md`
- `B0_TRACEABILITY_MATRIX.md`
- `TRACEABILITY_MATRIX.md`
- `ACCEPTANCE_TESTS.md` (AT-01 through AT-44)
- `DESIGN_CONTRADICTION_REVIEW.md`
- `DESIGN_REVIEW_CHECKLIST.md`
- `DESIGN_FINALIZATION_PLAN.md`
- `P0_P1_DECISION_TABLE.md`
- `USER_DECISION_REGISTER.md`
- `../PRE_IMPLEMENTATION_TRAPS.md`

## Prototype treatment

Anything under the repository that predates this baseline is one of:

- `keep` — already compatible with the approved design
- `modify` — useful but does not satisfy the approved contract
- `remove` — conflicts with the approved design or is temporary scaffolding
- `missing` — approved design capability not yet implemented

`IMPLEMENTATION_GAP_ANALYSIS.md` is the starting point; every future implementation slice must refresh the relevant gap classification before coding.

## Implementation entry contract

A future code task must state:

- baseline: Master Design v1 / PR #8 merge
- chosen implementation slice
- requirements and acceptance IDs in scope
- B0 items applicable to the slice
- pre-implementation traps checked
- live capabilities intentionally disabled/enabled
- files/components allowed to change
- tests/verification to run
- rollback/stop conditions

## Completion meaning

This manifest certifies **design completion only**. It makes no claim that ThreadScout is production-ready, live-connected, or capable of posting to Threads today.
