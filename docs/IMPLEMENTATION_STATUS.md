# Implementation Status

## Existing prototype completed before Master Design v1

- Phase 0: definition, interviews, success conditions, blind spots, traps, four designs, references
- Phase 1: mobile local approval workspace
- Phase 2A: fixed six-agent orchestra and bounded state machine
- Phase 2B: practical novel-item niche, prompts/schemas, synthetic full simulation
- Phase 2C: provider-neutral replay runtime, budgets, receipts, tool broker
- Phase 2D: versioned content-addressed evidence/artifact store and hash-chained run events
- Phase 2E: read-only fixture research, validated source records, candidate evidence, invalidation index
- Phase 2F: official-source readiness registry and disabled Threads/NAVER request contracts

These assets predate Master Design v1 and remain prototype/regression evidence unless explicitly promoted by a Master-Design implementation slice.

## Master Design v1 — COMPLETE

The canonical product/system design in `docs/spec/` is approved and covers the product, platform, six-agent contracts, handoffs, evidence, media, public-event/product matching, content, approval, publishing, analytics, security/privacy, blind spots, P0/P1 disposition, traceability, and AT-01 through AT-44.

## Harness Design v1 — COMPLETE

The canonical harness handoff is defined by:

- `docs/spec/HARNESS_BLUEPRINT.md`
- `docs/spec/HARNESS_ACCEPTANCE_MATRIX.md`
- `docs/spec/IMPLEMENTATION_GAP_ANALYSIS.md`
- `docs/spec/CODING_SPIKE_ENTRY.md`

The selected approach is contract-first adaptation of the existing orchestra/replay/versioning assets, not a rewrite and not live-provider-first.

## Coding Spike 0 — IMPLEMENTED AND VERIFIED

The owner explicitly resumed implementation on 2026-08-15. Spike 0 implements the no-network Master Harness Contract Spine around the existing runtime.

Implemented execution path:

`owner-supplied fixture → Orchestrator → Scout skipped by approved exception → Verifier → Strategist(4) → Writer(4) → Guardian → bound human decision → material mutation → stale/CAS rejection`

Implemented harness evidence:

- canonical deterministic fixture runner in `packages/orchestra/src/master-harness.mjs`
- F01, F02, F04, F11, F12, F13, F15, F20, F21
- exact-vs-unresolved ProductMatch gate
- Verifier-bounded factual-authority checks
- four-strategy / four-draft 1:1 mapping
- Guardian revise for unsupported endorsement and fake first-hand wording
- prompt/schema/config manifest hashes and immutable parent/evidence refs
- human approval revision binding at domain level
- material upstream mutation invalidating prior approval
- compare-and-set rejection for stale revision decisions
- deterministic semantic replay digest
- explicit receipts for successful and preflight-rejected replay invocations
- AT-linked suite/report via `npm run harness:spike0`

Required Spike 0 AT set is green:

`AT-04, AT-06, AT-07, AT-08, AT-09, AT-13, AT-16, AT-17, AT-18, AT-19, AT-20, AT-21, AT-23, AT-25, AT-36, AT-38, AT-39, AT-41`.

GitHub Actions PR verification passed with 69 tests and the full `npm run verify` chain, including the new harness runner. Legacy simulation/replay/store/research checks also remained green.

## Deviation found and resolved during Spike 0

Original plan: reuse the existing replay runtime receipts unchanged.

Mismatch: F12 budget exhaustion showed that an invocation rejected by the runtime's preflight budget check threw before a receipt was written. That violated AT-18 and the Harness Design requirement that every attempted specialist invocation be auditable.

Change: `model-runtime.mjs` now records a failure receipt for attempt/run/elapsed/input-budget and missing-handler preflight rejection before throwing.

Impact: this is a narrow observability correction inside the approved allowed-change surface. It does not widen agent authority, add a provider, activate network access, or change product behavior.

Residual risk: provider-specific live runtimes will need the same receipt guarantee when they are implemented; Spike 0 proves it only for the deterministic replay runtime.

## Current precise status

**DESIGN COMPLETE / HARNESS DESIGN COMPLETE / MASTER HARNESS CONTRACT SPINE IMPLEMENTED / SPIKE 0 VERIFIED / FULL MASTER-DESIGN HARNESS + C VERTICAL SLICE NOT YET COMPLETE / LIVE CAPABILITIES OFF.**

This means the highest-risk harness migration question is answered: the existing runtime can be adapted to Master Design authority/revision semantics without a rewrite. It does not mean all AT-01~44 are executable or the product UI/live stack is complete.

## Live capability state

Still intentionally disabled:

- Threads keyword discovery for the target app/account
- Threads insights
- Threads publishing
- live Coupang Partners commercial posting
- automated listing discovery beyond owner-supplied destinations
- third-party media download/transform/republish without action-specific rights evidence

No credential, network enablement, public publishing, dependency, or workflow-file change was required for Spike 0.

## Next implementation entry

The next bounded product slice unlocked by Spike 0 is the manual-product C vertical slice:

`input → verified candidate → Opportunity Inbox → four strategies → four drafts → Guardian → owner approve/hold/reject`

External publishing stays stubbed/off. Before that slice starts, refresh its applicable `KEEP / MODIFY / RETIRE / MISSING` map, B0/trap mapping, UI acceptance IDs, and 360px completion proof.
