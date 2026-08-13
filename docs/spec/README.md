# ThreadScout Design Authority

This directory is the canonical design baseline for the next implementation cycle.

## Precedence

1. `MASTER_SPEC.md`
2. domain specs in this directory
3. traceability and acceptance artifacts
4. legacy/phase documents under `docs/`
5. prototype implementation

If the prototype conflicts with an approved spec, the prototype is out of date.

## Required reading order

1. `MASTER_SPEC.md`
2. `PRODUCT_REQUIREMENTS.md`
3. `USER_FLOWS.md`
4. `UI_SCREEN_SPEC.md`
5. `MOBILE_WIREFRAMES.md`
6. `AGENT_CONTRACTS.md`
7. `AGENT_HANDOFFS.md`
8. `DATA_MODEL.md`
9. `SOURCE_STRATEGY.md`
10. `RANKING_SCORING_SPEC.md`
11. `DAILY_CANDIDATE_SELECTION_EXAMPLE.md`
12. `MEDIA_STRATEGY_OPTIONS.md`
13. `MEDIA_PIPELINE.md`
14. `MEDIA_USAGE_SCENARIOS.md`
15. `ISSUE_CONTENT_OPTIONS.md`
16. `TREND_ISSUE_PIPELINE.md`
17. `ISSUE_SOURCE_GRADING.md`
18. `ISSUE_PRODUCT_DECISION_TABLE.md`
19. `PRODUCT_MATCHING.md`
20. `CONTENT_STRATEGY.md`
21. `AFFILIATE_SPEC.md`
22. `DAILY_OPERATING_MODEL.md`
23. `PUBLISHING_SPEC.md`
24. `ANALYTICS_SPEC.md`
25. `SAFETY_COMPLIANCE.md`
26. `END_TO_END_SCENARIOS.md`
27. `P0_P1_DECISION_TABLE.md`
28. `TRACEABILITY_MATRIX.md`
29. `TRACEABILITY_ADDENDUM.md`
30. `ACCEPTANCE_TESTS.md`
31. `ACCEPTANCE_TESTS_ADDENDUM.md`
32. `DESIGN_CI_SPEC.md`
33. `DESIGN_REVIEW_CHECKLIST.md`
34. `DESIGN_FREEZE.md`
35. `IMPLEMENTATION_GAP_ANALYSIS.md`

## Design domains covered

- product purpose, reader value, and content lanes
- mobile-first screen hierarchy and four structural wireframes
- fixed six-agent orchestra and explicit handoffs
- conceptual data model and artifact lineage
- source hierarchy and live-source gates
- opportunity ranking separated from evidence/risk/freshness
- worked 20→5 candidate selection with portfolio constraints
- photo/video research versus final-use strategy and fallback
- issue-trigger source grading, relationship grading, and action matrix
- exact vs likely vs substitute product mapping
- four-angle content strategy
- affiliate mapping and disclosure
- daily operating rhythm and suppression controls
- publishing states and stale-evidence preflight
- analytics learning boundaries
- safety/privacy/compliance
- P0 blockers and provisional P1 defaults
- end-to-end scenarios, traceability, and behavioral acceptance
- future design-focused GitHub Actions semantics

## Design status terminology

- **reviewable baseline** — enough detail for structured review, but open decisions remain
- **design approved** — direction accepted and required unresolved items are explicitly resolved/deferred
- **design complete for implementation slice** — that slice has requirements, authority, acceptance tests, and no unresolved blocking gate
- **implemented** — code exists and has passed implementation verification; design documents alone never imply this state

## GitHub Actions interpretation

The current workflow executes the existing prototype regression/verification suite. A green check means the pre-freeze validation assets continue to pass after documentation changes. It does not mean the new specs are implemented.

Future design-specific Actions behavior is defined in `DESIGN_CI_SPEC.md` but intentionally not implemented during the design freeze.

## Current baseline

Branch: `docs/master-design-v1`

PR: #8 (draft design review)

## Current mode

**Design-only.** No runtime/product code or workflow-logic changes until the implementation-resume gate in `DESIGN_FREEZE.md` is satisfied.
