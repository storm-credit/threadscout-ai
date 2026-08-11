# ThreadScout Design Authority

This directory is the canonical design baseline for the next implementation cycle.

## Precedence

1. `MASTER_SPEC.md`
2. domain specs in this directory
3. `TRACEABILITY_MATRIX.md` and `ACCEPTANCE_TESTS.md`
4. existing legacy/phase documents under `docs/`
5. current prototype implementation

If the prototype conflicts with an approved spec, the prototype is considered out of date; do not rewrite the spec merely to match existing code.

## Required reading order

1. `MASTER_SPEC.md`
2. `PRODUCT_REQUIREMENTS.md`
3. `USER_FLOWS.md`
4. `UI_SCREEN_SPEC.md`
5. `AGENT_CONTRACTS.md`
6. `AGENT_HANDOFFS.md`
7. `DATA_MODEL.md`
8. `SOURCE_STRATEGY.md`
9. `RANKING_SCORING_SPEC.md`
10. `MEDIA_STRATEGY_OPTIONS.md`
11. `MEDIA_PIPELINE.md`
12. `MEDIA_USAGE_SCENARIOS.md`
13. `ISSUE_CONTENT_OPTIONS.md`
14. `TREND_ISSUE_PIPELINE.md`
15. `ISSUE_SOURCE_GRADING.md`
16. `PRODUCT_MATCHING.md`
17. `CONTENT_STRATEGY.md`
18. `AFFILIATE_SPEC.md`
19. `DAILY_OPERATING_MODEL.md`
20. `PUBLISHING_SPEC.md`
21. `ANALYTICS_SPEC.md`
22. `SAFETY_COMPLIANCE.md`
23. `END_TO_END_SCENARIOS.md`
24. `TRACEABILITY_MATRIX.md`
25. `ACCEPTANCE_TESTS.md`
26. `DESIGN_CI_SPEC.md`
27. `DESIGN_REVIEW_CHECKLIST.md`
28. `DESIGN_FREEZE.md`
29. `IMPLEMENTATION_GAP_ANALYSIS.md`

## Design domains now covered

- product purpose, reader value, and content lanes
- mobile-first screen hierarchy and CTAs
- fixed six-agent orchestra and explicit handoffs
- conceptual data model and artifact lineage
- source hierarchy and live-source gates
- opportunity ranking separate from evidence/risk/freshness
- photo/video discovery, rights, and publication scenarios
- public-figure/broadcast issue source grading and product-relation grading
- exact vs likely vs substitute product mapping
- four-angle content strategy
- affiliate mapping and disclosure
- daily operating rhythm and suppression controls
- publishing states and stale-evidence preflight
- analytics learning boundaries
- safety/privacy/compliance
- end-to-end scenarios, traceability, and behavioral acceptance
- future design-focused GitHub Actions semantics

## Design status terminology

- **reviewable baseline** — enough detail for structured review, but open P0/P1 decisions remain
- **design approved** — user accepts direction and required unresolved items are explicitly resolved/deferred
- **design complete for implementation slice** — that slice has requirements, authority, acceptance tests, and no unresolved blocking gate
- **implemented** — code exists and has passed implementation verification; design documents alone never imply this state

## Current mode

**Design-only.** No runtime/product code or workflow-logic changes until the implementation-resume gate in `DESIGN_FREEZE.md` is satisfied.

Current prototype code is a validation asset, not the source of design truth.
