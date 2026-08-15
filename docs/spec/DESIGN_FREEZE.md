# Design Baseline & Implementation Entry Gate v1

## Current status

**Master Design v1 is complete and approved as design authority. Harness Design v1 is also complete as the executable-design handoff.**

The documentation-only design/harness-finalization cycle is finished. Runtime/product code remains unchanged and is still treated as a pre-baseline prototype/validation asset.

Code stays frozen until a separate implementation request explicitly starts a bounded slice. The existence of a ready Coding Spike contract does not itself authorize coding.

## Canonical authority

- `docs/spec/MASTER_SPEC.md` is top-level product/system authority.
- `docs/spec/` domain specifications refine it.
- `TRACEABILITY_MATRIX.md`, `B0_TRACEABILITY_MATRIX.md`, and `ACCEPTANCE_TESTS.md` define coverage and behavioral expectations.
- `HARNESS_BLUEPRINT.md` and `HARNESS_ACCEPTANCE_MATRIX.md` define how approved behavior is translated into executable scenarios/oracles.
- `IMPLEMENTATION_GAP_ANALYSIS.md` classifies pre-baseline prototype assets.
- `CODING_SPIKE_ENTRY.md` defines the default first bounded implementation experiment.
- existing runtime code does not override approved design or harness contracts.

## Completed design decisions

- product purpose and non-goals
- practical novel/useful-item focus
- issue/public-figure content boundary
- mobile-first responsive web v1 delivery platform
- desktop support and PWA-ready/non-authoritative boundary
- native-app evidence-based revisit gate
- fixed six-agent roster; no price agent
- deterministic services and irreversible-action boundaries
- canonical end-to-end flow
- agent inputs/outputs/tool boundaries
- explicit handoff protocol and semantic/evidence gates
- conceptual data model and artifact lineage
- source evidence hierarchy and source independence
- opportunity ranking separated from evidence readiness/risk/freshness
- detailed mobile screens and CTAs
- media discovery vs final-use distinction
- exact/likely/substitute/unresolved product matching
- issue source and product-relation grading
- content strategy and four-angle rule
- Coupang Partners as first commercial target
- owner-supplied commercial destination as sufficient MVP entry point for exact-product verification
- daily operating rhythm and suppression model
- publishing state/reconciliation model
- analytics learning guardrails
- safety/privacy/public-figure rules
- final cross-domain blind-spot sweep
- B0 blind-spot traceability matrix
- expanded implementation trap checklist
- end-to-end scenarios and contradiction review
- promoted reversible P1 defaults
- consolidated traceability and behavioral acceptance through AT-44
- future design-focused GitHub Actions semantics

## Completed Harness Design decisions

- four harness approaches compared
- selected contract-first adaptation around existing orchestra/replay/store/broker/fixture assets
- live-provider-first and full rewrite rejected for the first cycle
- fixture catalog and expected semantic outcomes defined
- AT-01~44 split across harness/UI/E2E/live/analytics validation layers
- first Coding Spike AT/fixture subset defined
- legacy prototype classified `KEEP / MODIFY / RETIRE / MISSING`
- normal, blocked, budget-exhausted, contaminated-evidence, and stale-approval scenarios defined
- human approval revision binding and compare-and-set behavior required before UI/live scheduling claims
- first spike success, failure, stop, allowed-change, and completion-proof conditions fixed

## Live capabilities that remain disabled until activation preflight

Design/Harness completion does not require guessing account-specific facts. The following are designed but fail-closed until configured and verified:

1. Threads keyword discovery for the target account/app
2. Threads insights retrieval for the target account/app
3. Threads publishing
4. live Coupang Partners commercial posting
5. automated product/listing discovery beyond owner-supplied destinations
6. third-party media download/transform/republish without recorded action-specific rights

## Activation checks

Before enabling a live capability, verify the applicable current/account-specific facts:

- Meta app/account scope, token, identity, and exposed capability
- authorized commercial/listing source
- current Coupang Partners account/program disclosure/link requirements
- deployed runtime identity and secret backend
- source/asset/action-specific media rights
- available analytics/attribution fields

Unknown means disabled.

## Implementation-resume gate

A code task may start only when the owner explicitly requests implementation and the task:

- names the exact current main baseline SHA
- names Master Design v1 and Harness Design v1 as authority
- selects a bounded implementation slice or the default `CODING_SPIKE_ENTRY.md`
- maps the slice to requirements, AT IDs, and Harness fixture IDs
- checks applicable B0 items and pre-implementation traps
- declares which live capabilities remain disabled
- identifies affected prototype code as KEEP/MODIFY/RETIRE/MISSING
- states files/components allowed to change
- defines success, rollback, and stop conditions
- uses the Interview/Reference/Four-options/Completion gates in `CLAUDE.md`
- defines real verification before completion

## Baseline state

The product design is **approved**.

The Harness Design is **complete as design**.

The pre-baseline prototype harness is **executable but not Master-Design-compliant by default**.

The Master-Design-aware harness is **not yet implemented**.

The first Coding Spike is **ready but not started**.

None of these labels imply production readiness or live enablement.