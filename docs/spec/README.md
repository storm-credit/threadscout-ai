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
8. `ORCHESTRATOR_STATE_MACHINE.md`
9. `PROMPT_SYSTEM_SPEC.md`
10. `DATA_MODEL.md`
11. `SOURCE_STRATEGY.md`
12. `RANKING_SCORING_SPEC.md`
13. `DAILY_CANDIDATE_SELECTION_EXAMPLE.md`
14. `EVIDENCE_THRESHOLDS.md`
15. `MEDIA_STRATEGY_OPTIONS.md`
16. `MEDIA_PIPELINE.md`
17. `MEDIA_USAGE_SCENARIOS.md`
18. `ISSUE_CONTENT_OPTIONS.md`
19. `TREND_ISSUE_PIPELINE.md`
20. `ISSUE_SOURCE_GRADING.md`
21. `ISSUE_PRODUCT_DECISION_TABLE.md`
22. `PRODUCT_MATCHING.md`
23. `CONTENT_STRATEGY.md`
24. `CONTENT_OUTPUT_SPEC.md`
25. `REVIEW_BINDING_SPEC.md`
26. `AFFILIATE_SPEC.md`
27. `DAILY_OPERATING_MODEL.md`
28. `PUBLISHING_SPEC.md`
29. `ANALYTICS_SPEC.md`
30. `SAFETY_COMPLIANCE.md`
31. `EDGE_CASES.md`
32. `END_TO_END_SCENARIOS.md`
33. `MVP_SCOPE.md`
34. `P0_P1_DECISION_TABLE.md`
35. `TRACEABILITY_MATRIX.md`
36. `TRACEABILITY_ADDENDUM.md`
37. `ACCEPTANCE_TESTS.md`
38. `ACCEPTANCE_TESTS_ADDENDUM.md`
39. `DESIGN_CONTRADICTION_REVIEW.md`
40. `DESIGN_REVIEW_ROUND2.md`
41. `DESIGN_CI_SPEC.md`
42. `DESIGN_REVIEW_CHECKLIST.md`
43. `DESIGN_FREEZE.md`
44. `IMPLEMENTATION_GAP_ANALYSIS.md`

## Design domains covered

- product purpose, reader value, and MVP boundaries
- mobile-first screen hierarchy and four structural wireframes
- fixed six-agent orchestra, explicit handoffs, and orchestration states
- canonical prompt lifecycle and prompt/schema version discipline
- conceptual data model and artifact lineage
- source hierarchy and live-source gates
- opportunity ranking separated from evidence/risk/freshness
- worked 20→5 candidate selection with portfolio constraints
- evidence thresholds matched to claim strength
- photo/video research versus final-use strategy and fallback
- issue-trigger source grading, relationship grading, and action matrix
- exact vs likely vs substitute product mapping
- four-angle content strategy and draft output contract
- review decisions bound to exact artifact revisions
- affiliate mapping and disclosure
- daily operating rhythm and suppression controls
- publishing states and stale-evidence preflight
- analytics learning boundaries
- safety/privacy/compliance and edge cases
- P0 blockers and provisional P1 defaults
- end-to-end scenarios, contradiction review, traceability, and behavioral acceptance
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
