# ThreadScout Design Authority

This directory is the canonical **Master Design v1** baseline for the next implementation cycle.

## Precedence

1. `MASTER_SPEC.md`
2. domain specs in this directory
3. `TRACEABILITY_MATRIX.md`, `B0_TRACEABILITY_MATRIX.md`, and `ACCEPTANCE_TESTS.md`
4. legacy/phase documents under `docs/`
5. prototype implementation

If the prototype conflicts with an approved spec, the prototype is out of date.

## Core reading order

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
39. `B0_TRACEABILITY_MATRIX.md`
40. `EDGE_CASES.md`
41. `END_TO_END_SCENARIOS.md`
42. `P0_P1_DECISION_TABLE.md`
43. `USER_DECISION_REGISTER.md`
44. `TRACEABILITY_MATRIX.md`
45. `ACCEPTANCE_TESTS.md`
46. `DESIGN_CONTRADICTION_REVIEW.md`
47. `DESIGN_REVIEW_ROUND2.md`
48. `DESIGN_FINALIZATION_PLAN.md`
49. `DESIGN_REVIEW_CHECKLIST.md`
50. `DESIGN_FREEZE.md`
51. `IMPLEMENTATION_GAP_ANALYSIS.md`

Supporting planning/reference documents such as `DESIGN_CI_SPEC.md`, `IMPLEMENTATION_TEST_STRATEGY.md`, `RUN_BUDGETS.md`, `RETENTION_OPTIONS.md`, `APPLICATION_INTERFACE_SPEC.md`, `BACKGROUND_JOB_SPEC.md`, and `NOTIFICATION_SPEC.md` remain part of the baseline but are not required in the first reading pass.

## Design domains covered

- product purpose, reader value, MVP boundaries, and configuration authority
- mobile-first responsive web delivery, desktop support, PWA boundary, and native-app revisit gate
- mobile-first screen hierarchy, four wireframes, and state-to-action behavior
- fixed six-agent orchestra, handoff validation, routing, and orchestration states
- canonical prompt lifecycle and prompt/schema version discipline
- conceptual data model and artifact lineage
- source hierarchy, source independence, and live-source gates
- opportunity ranking separated from evidence/risk/freshness
- worked 20→5 candidate selection with portfolio constraints
- evidence thresholds matched to claim strength
- photo/video research versus final-use strategy and fallback
- issue-trigger source grading, relationship grading, and action matrix
- exact vs likely vs substitute product mapping
- four-angle content strategy and draft output contract
- review decisions bound to exact artifact revisions and cross-device stale-state rejection
- Coupang Partners as first commercial target, with live operating rules rechecked at activation
- daily operating rhythm and suppression controls
- publishing states, preflight, authorization freshness, and unknown-remote reconciliation
- analytics learning boundaries
- safety/privacy/compliance, final blind-spot sweep, B0 traceability, and edge cases
- finalized P0 dispositions and promoted P1 defaults
- consolidated requirements traceability and behavioral acceptance through AT-44

## Design status terminology

- **design approved** — the product/system direction and reversible defaults are accepted; live facts may remain behind disabled activation gates
- **design complete for implementation slice** — that slice has requirements, authority, acceptance behavior, and no unresolved applicable blocker
- **configured** — deployment/account/provider values are supplied
- **enabled** — a live capability is explicitly turned on after preflight
- **implemented** — code exists and has passed implementation verification

These states are not interchangeable.

## Current baseline state

Master Design v1 is **approved as design authority**. The PR may be merged as a documentation baseline without claiming implementation.

Live Threads discovery/publishing/insights, Coupang affiliate posting, automated listing discovery, and third-party media republication remain fail-closed until their activation-time evidence is present.

## Current implementation mode

**Code remains frozen for this conversation.** The next code task must explicitly select an implementation slice from this approved baseline rather than continuing the old prototype by momentum.

The current GitHub Actions workflow remains a prototype-regression check; it is not proof that the Master Design is implemented.
