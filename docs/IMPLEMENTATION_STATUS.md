# Implementation Status

## Canonical design status

- **Master Design v1: COMPLETE** — product/platform/six-agent/evidence/media/matching/content/approval/publishing/analytics/security design and AT-01~44 are canonical in `docs/spec/`.
- **Harness Design v1: COMPLETE** — `HARNESS_BLUEPRINT`, `HARNESS_ACCEPTANCE_MATRIX`, gap analysis, and coding entry rules define the executable-specification approach.
- Live-account/policy/deployment items remain capability-gated; design completion does not mean production activation.

## Existing prototype / regression assets

Before Master Design v1, the repository implemented Phase 1 through Phase 2F: mobile prototype, fixed six-agent orchestra, practical-novel niche simulation, replay runtime/budgets/receipts/tool broker, versioned evidence store, fixture research, and disabled live-source readiness contracts.

Those assets remain regression evidence unless a later Master-Design slice explicitly promotes/adapts them.

## Coding Spike 0 — IMPLEMENTED AND VERIFIED

Spike 0 proved the no-network Master Harness Contract Spine:

`owner-supplied fixture → Orchestrator → Scout skipped by approved exception → Verifier → Strategist(4) → Writer(4) → Guardian → bound human decision → material mutation → stale/CAS rejection`

It implements F01/F02/F04/F11/F12/F13/F15/F20/F21 and the required Spike 0 acceptance set. It also corrected replay-runtime preflight rejection receipts so budget/attempt failures are auditable. This answered the migration question: the existing runtime can be adapted to Master Design authority/revision semantics without a rewrite.

## Manual-product C vertical slice — IMPLEMENTED ON THE CURRENT IMPLEMENTATION BRANCH

PR #12 implements the first user-facing application slice:

`manual product input → Opportunity Inbox → owner-supplied evidence verification → four strategies → four drafts → Guardian → owner approve/hold/reject`

### Server/application boundary

- `GET /api/today` exposes a bounded read model.
- `POST /api/commands` accepts explicit intent commands with request IDs and expected revisions.
- browser `localStorage`/`sessionStorage` is not application authority.
- state is persisted in atomic JSON under `.threadscout-data/` for this local, single-process slice.
- duplicate request IDs are idempotent; reused IDs with different commands are rejected.
- stale expected revisions return HTTP 409 and the current read model.
- material evidence/draft changes invalidate earlier approval.
- stale approval recovery requires current evidence and a new strategy/review cycle.

### Six-agent authority boundary

The first C-slice pass made specialist-shaped deterministic operations server-side but did not make Orchestrator-only dispatch explicit enough. Before merge, this was corrected with `apps/web/manual-orchestrator.mjs`.

Specialist commands now:

- map only to Verifier / Strategist / Writer / Guardian
- validate the fixed six-agent registry
- validate allowed workflow state
- return control to Orchestrator
- emit success/failure orchestration receipts
- never invoke a live model/provider in this slice

The deterministic local role adapters are implementation doubles. They are not evidence that live AI-provider execution exists.

### Opportunity Inbox / mobile UI

The old localStorage prototype was replaced by a mobile-first Opportunity Inbox that shows, separately:

- why-now
- reader value
- opportunity score
- evidence readiness
- risk
- exact-product state
- media-rights state
- top blocker/material stale state
- one safe next action

The workspace exposes Evidence Verifier → Strategy 4 → Draft 4 → Guardian → Human Approval. The bottom navigation provides Today / Verification / Drafts plus explicit read-only Queue and Performance capability states; those latter capabilities remain disabled rather than simulated as complete.

### Automated proof

`tests/c-vertical-slice.test.mjs`, `tests/c-orchestrator-bridge.test.mjs`, and updated web smoke tests cover the application path, stale/CAS behavior, idempotency, reload persistence, high-score gating, fake-first-hand Guardian rejection, Orchestrator-only dispatch, stale recovery, no browser storage authority, no credential leakage, and 360px structural rules.

`docs/implementation/C_VERTICAL_SLICE_ACCEPTANCE.md` records the exact AT scope and limitations.

## Current precise status

**DESIGN COMPLETE / HARNESS DESIGN COMPLETE / SPIKE 0 VERIFIED / MANUAL-PRODUCT C VERTICAL SLICE IMPLEMENTED UNDER LOCAL SERVER-AUTHORITATIVE ASSUMPTIONS / FULL MASTER-DESIGN HARNESS + LIVE INTEGRATIONS NOT COMPLETE / LIVE CAPABILITIES OFF.**

This status intentionally does **not** claim production readiness. Automated responsive/accessibility structure is tested, but a real-device/browser/assistive-technology acceptance matrix is still a later verification item.

## Live capability state

Still intentionally disabled:

- Threads keyword discovery for the target app/account
- Threads insights
- Threads publishing
- live Coupang Partners commercial posting
- automated listing discovery beyond owner-supplied destinations
- third-party media download/transform/republish without action-specific rights evidence
- schedule dispatch/reconciliation
- analytics learning

No credential, new dependency/framework, workflow-file change, or live network enablement is required by the C slice.

## Next implementation boundary after C slice

Do not jump directly to public posting. The next slice should be chosen from the remaining Master Design gaps with its own P0/B0/trap check. Before multi-process/background work, replace or harden local atomic JSON with transactional persistence/locking. Before any live source or publishing slice, verify current account permissions/policies, credential storage, idempotency/reconciliation, preflight freshness, destination integrity, disclosure, and kill-switch behavior.
