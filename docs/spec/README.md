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
3. `MVP_SCOPE.md`
4. `USER_FLOWS.md`
5. `UI_SCREEN_SPEC.md`
6. `MOBILE_WIREFRAMES.md`
7. `UI_STATE_ACTION_MATRIX.md`
8. `AGENT_CONTRACTS.md`
9. `AGENT_HANDOFFS.md`
10. `HANDOFF_VALIDATION_RULES.md`
11. `ORCHESTRATOR_STATE_MACHINE.md`
12. `ROUTING_RULES.md`
13. `PROMPT_SYSTEM_SPEC.md`
14. `CONFIGURATION_AUTHORITY.md`
15. `DATA_MODEL.md`
16. `SOURCE_STRATEGY.md`
17. `RANKING_SCORING_SPEC.md`
18. `DAILY_CANDIDATE_SELECTION_EXAMPLE.md`
19. `EVIDENCE_THRESHOLDS.md`
20. `MEDIA_STRATEGY_OPTIONS.md`
21. `MEDIA_PIPELINE.md`
22. `MEDIA_USAGE_SCENARIOS.md`
23. `ISSUE_CONTENT_OPTIONS.md`
24. `TREND_ISSUE_PIPELINE.md`
25. `ISSUE_SOURCE_GRADING.md`
26. `ISSUE_PRODUCT_DECISION_TABLE.md`
27. `PRODUCT_MATCHING.md`
28. `CONTENT_STRATEGY.md`
29. `CONTENT_OUTPUT_SPEC.md`
30. `REVIEW_BINDING_SPEC.md`
31. `AFFILIATE_SPEC.md`
32. `DAILY_OPERATING_MODEL.md`
33. `PUBLISHING_SPEC.md`
34. `ANALYTICS_SPEC.md`
35. `SAFETY_COMPLIANCE.md`
36. `EDGE_CASES.md`
37. `END_TO_END_SCENARIOS.md`
38. `P0_P1_DECISION_TABLE.md`
39. `TRACEABILITY_MATRIX.md`
40. `TRACEABILITY_ADDENDUM.md`
41. `ACCEPTANCE_TESTS.md`
42. `ACCEPTANCE_TESTS_ADDENDUM.md`
43. `DESIGN_CONTRADICTION_REVIEW.md`
44. `DESIGN_REVIEW_ROUND2.md`
45. `DESIGN_FINALIZATION_PLAN.md`
46. `DESIGN_CI_SPEC.md`
47. `DESIGN_REVIEW_CHECKLIST.md`
48. `DESIGN_FREEZE.md`
49. `IMPLEMENTATION_GAP_ANALYSIS.md`

## Design domains covered

- product purpose, reader value, MVP boundaries, and configuration authority
- mobile-first screen hierarchy, four wireframes, and state-to-action behavior
- fixed six-agent orchestra, handoff validation, routing, and orchestration states
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
- end-to-end scenarios, contradiction review, finalization gates, traceability, and behavioral acceptance
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
