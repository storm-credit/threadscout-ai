# Design Baseline & Implementation Entry Gate v1

## Current status

**Master Design v1 is complete and approved as design authority.**

The design-only cycle is finished. Runtime/product code remains unchanged and is still treated as a pre-baseline prototype/validation asset.

Code stays frozen until a separate implementation request selects a bounded slice from this baseline. This prevents implementation from resuming automatically merely because the design PR is merged.

## Canonical authority

- `docs/spec/MASTER_SPEC.md` is top-level product/system authority.
- `docs/spec/` domain specifications refine it.
- `TRACEABILITY_MATRIX.md`, `B0_TRACEABILITY_MATRIX.md`, and `ACCEPTANCE_TESTS.md` define coverage and behavioral expectations.
- existing runtime code does not override approved design.

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
- user-supplied commercial destination as sufficient MVP entry point for exact-product verification
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

## Live capabilities that remain disabled until activation preflight

Design completion does not require guessing account-specific facts. The following are designed but fail-closed until configured and verified:

1. Threads keyword discovery for the target account/app
2. Threads insights retrieval for the target account/app
3. Threads publishing
4. live Coupang Partners commercial posting
5. automated product/listing discovery beyond user-supplied destinations
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

A code task may start only when the user explicitly requests implementation and the task:

- names Master Design v1 as authority
- selects a bounded implementation slice
- maps the slice to requirements and acceptance behavior
- checks applicable B0 items and pre-implementation traps
- declares which live capabilities remain disabled
- identifies affected prototype code as keep/modify/remove/missing
- defines real verification before completion

## Design baseline state

The design baseline itself is no longer `reviewable only`; it is **approved**.

This does not label any existing implementation as complete, production-ready, or live-enabled.
