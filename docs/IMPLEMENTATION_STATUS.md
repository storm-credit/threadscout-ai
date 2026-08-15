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

## Manual-product C vertical slice — MERGED AND VERIFIED

PR #12 merged the first user-facing application slice to `main`:

`manual product input → Opportunity Inbox → owner-supplied evidence verification → four strategies → four drafts → Guardian → owner approve/hold/reject`

Implemented boundaries:

- `GET /api/today` exposes a bounded server read model.
- `POST /api/commands` accepts explicit commands with request IDs and expected revisions.
- browser `localStorage`/`sessionStorage` is not application authority.
- duplicate request IDs are idempotent; stale revisions return HTTP 409 with the current server state.
- material evidence/draft changes invalidate earlier approval.
- specialist commands map only to Verifier / Strategist / Writer / Guardian and route through the explicit Orchestrator service.
- the fixed six-agent registry is preserved; deterministic local specialist adapters do not pretend to be live model/provider calls.
- the Opportunity Inbox separates opportunity score from evidence readiness, risk, exact-product state, media-rights state and blocker state.
- Queue and Performance remain explicit disabled/read-only capability surfaces rather than simulated completion.

PR #12 merged as `644d3d202f35b4f50d4ac0654d12918231e182ae`; its post-merge main CI succeeded. `docs/implementation/C_VERTICAL_SLICE_ACCEPTANCE.md` records the bounded application proof and limitations.

## Local persistence lock hardening — IMPLEMENTED AND VERIFIED ON PR #13

The C slice originally combined atomic temp-write + rename persistence with an in-process promise chain. That was sufficient for one server instance but did not protect two independent Node processes sharing the same state path from a lost-update race.

PR #13 adds `LockedAtomicJsonApplicationStore`, which preserves the existing JSON schema and domain behavior while serializing the complete local mutation critical section:

`exclusive local lock → read state → idempotency/CAS checks → apply command → atomic persist → owner-checked release`

Implemented safety behavior:

- exclusive local-filesystem lock creation using Node standard-library file primitives
- bounded retry and fail-closed `storage_lock_timeout` / HTTP 503
- conservative stale abandoned-lock recovery
- unique lock-owner token so an old holder cannot delete a successor lock
- independent store instances preserve both concurrent writes
- duplicate `requestId` remains single-apply across independent stores
- API storage-lock failure returns an Orchestrator failure receipt and leaves state unchanged
- capability metadata explicitly reports `single_host_local_filesystem`; the implementation does not claim network-filesystem or distributed locking

GitHub Actions Run #166 on implementation head `ca4c97f6e881ceede1cc23552d7b948a84e1c9a4` completed successfully with **88 tests / 88 pass / 0 fail**, including all prior Spike 0, C-slice, simulation, replay, evidence-store, fixture-research and live-readiness regressions. Final documentation-head CI and post-merge main CI are still required before PR #13 is reported merged/complete.

`docs/implementation/PERSISTENCE_LOCK_HARDENING_PLAN.md`, `PERSISTENCE_LOCK_HARDENING_REFERENCE_REVIEW.md`, and `PERSISTENCE_LOCK_HARDENING_ACCEPTANCE.md` record the four-option decision, primary-source reference review, executable scenarios, stop conditions and limitations.

## Current precise status

**DESIGN COMPLETE / HARNESS DESIGN COMPLETE / SPIKE 0 VERIFIED / MANUAL-PRODUCT C VERTICAL SLICE MERGED / LOCAL SAME-HOST PERSISTENCE SERIALIZATION HARDENED / FULL MASTER-DESIGN HARNESS + LIVE INTEGRATIONS NOT COMPLETE / LIVE CAPABILITIES OFF.**

This status intentionally does **not** claim production readiness. The current persistence bridge is for a single host/local filesystem and short application commands. Multi-host or production background-worker deployment requires database-backed transactional persistence. Automated responsive/accessibility structure is tested, but a real-device/browser/assistive-technology acceptance matrix is still a separate verification item.

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

No credential, new dependency/framework, workflow-file change, model provider, live-network enablement, new agent, or publication path is introduced by the persistence-hardening slice.

## Next implementation boundary after persistence hardening

Do not jump directly to public posting. Safe next work should remain bounded to one of the remaining non-live gaps, with its own four-option review, trap/B0 mapping and completion proof. Strong candidates are real-device/browser acceptance for the mobile Opportunity Inbox, duplicate/near-duplicate candidate indexing, or production-store planning/spike when background/multi-host execution becomes necessary.

Before any live source or publishing slice, separately verify current account permissions/policies, credential storage, source-specific terms/rate limits, publication idempotency/reconciliation, kill switch, authorization preflight, evidence freshness, destination integrity, media rights and disclosure.
