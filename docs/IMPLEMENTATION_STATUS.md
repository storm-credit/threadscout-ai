# Implementation Status

## Existing prototype completed before design freeze

- Phase 0: definition, interviews, success conditions, blind spots, traps, four designs, references
- Phase 1: mobile local approval workspace
- Phase 2A: fixed six-agent orchestra and bounded state machine
- Phase 2B: practical novel-item niche, prompts/schemas, synthetic full simulation
- Phase 2C: provider-neutral replay runtime, budgets, receipts, tool broker
- Phase 2D: versioned content-addressed evidence/artifact store and hash-chained run events
- Phase 2E: read-only fixture research, validated source records, candidate evidence, invalidation index
- Phase 2F: official-source readiness registry and disabled Threads/NAVER request contracts

## Current mode — DESIGN ONLY

Runtime/product implementation is intentionally frozen while the canonical design is completed.

The design baseline lives in `docs/spec/` and now defines:

- Master Product & System Specification
- requirements and complete user flows
- detailed mobile screens and CTA states
- fixed six-agent contracts and explicit handoffs
- conceptual data model
- source strategy
- opportunity ranking separate from evidence readiness/risk/freshness
- image/video discovery, rights, and publication scenarios
- celebrity/broadcast/trend issue pipeline
- issue-source and product-relation grading
- exact product matching
- content and affiliate strategy
- daily operating model
- publishing/reconciliation design
- analytics/learning design
- safety/privacy/compliance rules
- end-to-end scenarios
- traceability matrix
- behavioral acceptance tests
- future design-focused GitHub Actions semantics
- design freeze/open questions
- existing-code gap analysis

## No code changes in this design cycle

This design branch must not change:

- `apps/`
- `packages/`
- `scripts/`
- `tests/`
- workflows
- runtime dependencies
- live source enablement

Existing prototype behavior remains unchanged.

## Current design milestone

**Master Design v1 — reviewable baseline**

This is more detailed than the initial baseline but is not yet labeled `DESIGN COMPLETE`.

The remaining blocking questions are live/account-specific P0 items plus selected P1 operating defaults documented in `docs/spec/DESIGN_FREEZE.md`.

## GitHub Actions interpretation

The current Actions workflow still runs the existing prototype verification suite and orchestra demo. A green check means those validation assets continue to pass after documentation changes.

It does not yet prove:

- master design approval
- design traceability automation
- P0/P1 closure
- implementation of the new design

Future design-CI semantics are specified in `docs/spec/DESIGN_CI_SPEC.md`, but the workflow itself is intentionally unchanged under the code freeze.

## Implementation-resume gate

See `docs/spec/DESIGN_FREEZE.md`. The next implementation cycle may begin only after the master design direction is approved and P0 gates are answered or explicitly disabled/deferred.
