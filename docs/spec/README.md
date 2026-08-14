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
4. `PLATFORM_OPTIONS.md`
5. `PLATFORM_DECISION.md`
6. `USER_FLOWS.md`
7. `UI_SCREEN_SPEC.md`
8. `MOBILE_WIREFRAMES.md`
9. `UI_STATE_ACTION_MATRIX.md`
10. `AGENT_CONTRACTS.md`
11. `AGENT_HANDOFFS.md`
12. `HANDOFF_VALIDATION_RULES.md`
13. `ORCHESTRATOR_STATE_MACHINE.md`
14. `ROUTING_RULES.md`
15. `PROMPT_SYSTEM_SPEC.md`
16. `CONFIGURATION_AUTHORITY.md`
17. `DATA_MODEL.md`
18. `SOURCE_STRATEGY.md`
19. `RANKING_SCORING_SPEC.md`
20. `DAILY_CANDIDATE_SELECTION_EXAMPLE.md`
21. `EVIDENCE_THRESHOLDS.md`
22. `MEDIA_STRATEGY_OPTIONS.md`
23. `MEDIA_PIPELINE.md`
24. `MEDIA_USAGE_SCENARIOS.md`
25. `ISSUE_CONTENT_OPTIONS.md`
26. `TREND_ISSUE_PIPELINE.md`
27. `ISSUE_SOURCE_GRADING.md`
28. `ISSUE_PRODUCT_DECISION_TABLE.md`
29. `PRODUCT_MATCHING.md`
30. `CONTENT_STRATEGY.md`
31. `CONTENT_OUTPUT_SPEC.md`
32. `REVIEW_BINDING_SPEC.md`
33. `AFFILIATE_SPEC.md`
34. `DAILY_OPERATING_MODEL.md`
35. `PUBLISHING_SPEC.md`
36. `ANALYTICS_SPEC.md`
37. `SAFETY_COMPLIANCE.md`
38. `FINAL_BLIND_SPOT_SWEEP.md`
39. `EDGE_CASES.md`
40. `END_TO_END_SCENARIOS.md`
41. `P0_P1_DECISION_TABLE.md`
42. `TRACEABILITY_MATRIX.md`
43. `TRACEABILITY_ADDENDUM.md`
44. `ACCEPTANCE_TESTS.md`
45. `ACCEPTANCE_TESTS_ADDENDUM.md`
46. `DESIGN_CONTRADICTION_REVIEW.md`
47. `DESIGN_REVIEW_ROUND2.md`
48. `DESIGN_FINALIZATION_PLAN.md`
49. `DESIGN_CI_SPEC.md`
50. `DESIGN_REVIEW_CHECKLIST.md`
51. `DESIGN_FREEZE.md`
52. `IMPLEMENTATION_GAP_ANALYSIS.md`

## Design domains covered

- product purpose, reader value, MVP boundaries, and configuration authority
- mobile-first responsive web delivery, desktop support, PWA boundary, and native-app revisit gate
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
- review decisions bound to exact artifact revisions and cross-device stale-state rejection
- affiliate mapping and disclosure
- daily operating rhythm and suppression controls
- publishing states and stale-evidence preflight
- analytics learning boundaries
- safety/privacy/compliance, final blind-spot sweep, and edge cases
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
