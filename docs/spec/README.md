# ThreadScout Design Authority

This directory is the canonical **Master Design v1 + Harness Design v1** baseline for the next implementation cycle.

## Precedence

1. `MASTER_SPEC.md`
2. domain specs in this directory
3. `TRACEABILITY_MATRIX.md`, `B0_TRACEABILITY_MATRIX.md`, and `ACCEPTANCE_TESTS.md`
4. `DESIGN_BASELINE_MANIFEST.md` as the implementation handoff summary
5. `HARNESS_BLUEPRINT.md`, `HARNESS_ACCEPTANCE_MATRIX.md`, and `CODING_SPIKE_ENTRY.md` as the executable-design handoff
6. legacy/phase documents under `docs/`
7. prototype implementation

If the prototype conflicts with an approved spec, the prototype is out of date.

## Fast handoff reading

For a new implementation task, read in this order first:

1. `MASTER_SPEC.md`
2. `DESIGN_BASELINE_MANIFEST.md`
3. `HARNESS_BLUEPRINT.md`
4. `HARNESS_ACCEPTANCE_MATRIX.md`
5. `CODING_SPIKE_ENTRY.md`
6. `P0_P1_DECISION_TABLE.md`
7. `TRACEABILITY_MATRIX.md`
8. `ACCEPTANCE_TESTS.md`
9. `IMPLEMENTATION_GAP_ANALYSIS.md`
10. `FINAL_BLIND_SPOT_SWEEP.md`
11. `B0_TRACEABILITY_MATRIX.md`
12. `../PRE_IMPLEMENTATION_TRAPS.md`
13. the domain specs for the chosen implementation slice

## Full core reading order

1. `MASTER_SPEC.md`
2. `DESIGN_BASELINE_MANIFEST.md`
3. `PRODUCT_REQUIREMENTS.md`
4. `MVP_SCOPE.md`
5. `PLATFORM_OPTIONS.md`
6. `PLATFORM_DECISION.md`
7. `USER_FLOWS.md`
8. `UI_SCREEN_SPEC.md`
9. `MOBILE_WIREFRAMES.md`
10. `UI_STATE_ACTION_MATRIX.md`
11. `AGENT_CONTRACTS.md`
12. `AGENT_HANDOFFS.md`
13. `HANDOFF_VALIDATION_RULES.md`
14. `ORCHESTRATOR_STATE_MACHINE.md`
15. `ROUTING_RULES.md`
16. `PROMPT_SYSTEM_SPEC.md`
17. `CONFIGURATION_AUTHORITY.md`
18. `DATA_MODEL.md`
19. `SOURCE_STRATEGY.md`
20. `RANKING_SCORING_SPEC.md`
21. `DAILY_CANDIDATE_SELECTION_EXAMPLE.md`
22. `EVIDENCE_THRESHOLDS.md`
23. `MEDIA_STRATEGY_OPTIONS.md`
24. `MEDIA_PIPELINE.md`
25. `MEDIA_USAGE_SCENARIOS.md`
26. `ISSUE_CONTENT_OPTIONS.md`
27. `TREND_ISSUE_PIPELINE.md`
28. `ISSUE_SOURCE_GRADING.md`
29. `ISSUE_PRODUCT_DECISION_TABLE.md`
30. `PRODUCT_MATCHING.md`
31. `CONTENT_STRATEGY.md`
32. `CONTENT_OUTPUT_SPEC.md`
33. `REVIEW_BINDING_SPEC.md`
34. `AFFILIATE_SPEC.md`
35. `DAILY_OPERATING_MODEL.md`
36. `PUBLISHING_SPEC.md`
37. `ANALYTICS_SPEC.md`
38. `SAFETY_COMPLIANCE.md`
39. `FINAL_BLIND_SPOT_SWEEP.md`
40. `B0_TRACEABILITY_MATRIX.md`
41. `EDGE_CASES.md`
42. `END_TO_END_SCENARIOS.md`
43. `P0_P1_DECISION_TABLE.md`
44. `USER_DECISION_REGISTER.md`
45. `TRACEABILITY_MATRIX.md`
46. `ACCEPTANCE_TESTS.md`
47. `HARNESS_BLUEPRINT.md`
48. `HARNESS_ACCEPTANCE_MATRIX.md`
49. `IMPLEMENTATION_GAP_ANALYSIS.md`
50. `CODING_SPIKE_ENTRY.md`
51. `DESIGN_CONTRADICTION_REVIEW.md`
52. `DESIGN_REVIEW_ROUND2.md`
53. `DESIGN_FINALIZATION_PLAN.md`
54. `DESIGN_REVIEW_CHECKLIST.md`
55. `DESIGN_FREEZE.md`

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
- contract-first Harness Design, canonical fixture families, AT ownership, completion proof, and first Coding Spike entry contract

## Design status terminology

- **design approved** — product/system direction and reversible defaults are accepted; live facts may remain behind disabled activation gates
- **harness design complete** — execution contract, fixtures, AT ownership, stop conditions, and first spike scope are specified; it does not mean the harness code is implemented
- **coding spike ready** — a bounded implementation experiment has explicit scope/success/failure criteria and may start only after the owner explicitly resumes coding
- **design complete for implementation slice** — that slice has requirements, authority, acceptance behavior, and no unresolved applicable blocker
- **configured** — deployment/account/provider values are supplied
- **enabled** — a live capability is explicitly turned on after preflight
- **implemented** — code exists and has passed implementation verification

These states are not interchangeable.

## Current baseline state

Master Design v1 is **approved as design authority**.

Harness Design v1 is **specified for finalization** around the existing prototype runtime. Its selected approach is a contract-first harness that adapts the existing replay/store/broker/orchestra assets rather than rewriting from scratch or jumping to live providers.

Live Threads discovery/publishing/insights, Coupang affiliate posting, automated listing discovery, and third-party media republication remain fail-closed until their activation-time evidence is present.

## Current implementation mode

**No new runtime/product code is changed by the harness-finalization documentation pass.** The next code task must explicitly reference the merged harness baseline and the bounded `CODING_SPIKE_ENTRY.md` contract.

The current GitHub Actions workflow remains a prototype-regression check; it is not proof that Master Design or Harness Design has been implemented.