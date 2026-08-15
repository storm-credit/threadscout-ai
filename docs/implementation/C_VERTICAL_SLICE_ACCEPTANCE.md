# Manual Product C Vertical Slice — Acceptance Proof

Status: **AUTOMATED SLICE PROOF.** This report does not claim live-provider, production-deployment, or real-device certification.

Baseline: `c444a3e29834cfdef42d17537c8400e9f6960086`.

## Implemented behavior

`manual input → server candidate → Verifier → Strategist(4) → Writer(4) → Guardian → owner approve/hold/reject`

The browser is a renderer/command client. Durable candidate/review state lives in server-owned atomic JSON for this single-process local slice. `POST /api/commands` goes through the manual-product Orchestrator service; specialist commands map only to the fixed Verifier/Strategist/Writer/Guardian roles and return control to Orchestrator. No live provider is invoked.

## Acceptance mapping

| AT | Automated evidence in this slice | Result / scope |
|---|---|---|
| AT-01 | Opportunity Inbox read model caps primary cards at 5 and exposes score/readiness/risk/blocker | pass for local/manual slice |
| AT-09 | Guardian pass required; approval binds material revision | pass for local/server domain |
| AT-15 | responsive 360-ish breakpoint, stacked mobile actions, 48px nav targets | structural automated pass; real-device visual check not claimed |
| AT-22 | semantic buttons/forms/native dialogs, text status labels, focus-visible styling, touch target checks | structural automated pass; formal assistive-tech audit not claimed |
| AT-25 | score-96 unresolved fixture cannot dispatch Strategist | pass |
| AT-32 | first card shows why-now, reader value, score, readiness/risk/exact/media/blocker, safe CTA | pass by markup/read-model tests |
| AT-34 | mobile-first CSS and touch-oriented card/nav layout | structural automated pass; device matrix not claimed |
| AT-35 | no localStorage/sessionStorage authority; state survives server/browser reload; publishing/background work remains outside browser | pass for local application state boundary |
| AT-36 | expected revision conflicts return 409 + latest read model; stale decision rejected | pass for server/domain cross-client semantics |
| AT-38 | material change invalidates prior approval; draft-only stale state requires a new Guardian review, while evidence-changing stale state rebuilds downstream content from current evidence | pass for local/server binding |
| AT-42 | top blocker is first-class on card/workspace and approval stays disabled until Guardian/current revision is valid | pass for implemented UI state hierarchy |

Regression coverage continues to prove Spike 0 ATs for product identity, four outputs, Guardian independence, fail-closed behavior, secret handling, and agent agreement not manufacturing truth.

## Automated scenarios

The C-slice test suite covers:

- score separated from evidence readiness
- manual product full approval path
- material change → stale approval → stale CAS rejection
- duplicate request ID idempotency
- unresolved high-score progression block
- fake first-hand wording → Guardian revise
- server-state reload persistence
- no credential-name leakage / publishing disabled
- Orchestrator-only specialist dispatch receipts
- invalid specialist-state dispatch rejection
- draft-only stale recovery through a fresh Guardian review and owner decision
- Opportunity Inbox/mobile navigation/static safety and 360px structural checks

## Blind-spot recheck

- BS-01: reader value is separately rendered; opportunity score cannot unlock content generation.
- BS-06: browser storage is not application authority; scheduling/publishing remains unimplemented rather than browser-owned.
- BS-31: C slice only creates downstream identity claims from Verifier evidence; Spike 0 continues stronger contaminated-fact coverage.
- BS-32: Guardian independently blocks unverified first-hand/endorsement/disclosure problems.
- BS-36: blockers/material stale state precede approval and disable approval.
- BS-37: approval binds material revision; edits invalidate it; expected-revision CAS rejects old clients.
- BS-51: read models/receipts do not contain credential values or enable live sources.

## Remaining limits before production or live activation

- atomic JSON is intentionally single-process/local; multi-process workers need transactional persistence/locking
- actual mobile devices and assistive technologies still need a supported-browser/device acceptance pass
- no live source has been activated; owner-supplied evidence is not equivalent to independently verified current public truth
- no scheduling/publication/reconciliation path is implemented by this slice
- no analytics/learning path is enabled
- provider-backed agents must later preserve the same Orchestrator, evidence-authority, receipt, budget, and stale-binding guarantees

A green C-slice result therefore means **manual-product application flow is executable and server-authoritative under its bounded local assumptions**, not that ThreadScout is production-ready.
