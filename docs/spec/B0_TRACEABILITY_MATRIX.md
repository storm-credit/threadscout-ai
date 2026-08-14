# B0 Blind-Spot Traceability Matrix v1

Status: DESIGN ONLY.

Purpose: close the highest-severity findings from `FINAL_BLIND_SPOT_SWEEP.md` by mapping each B0 item to a controlling design authority and behavioral acceptance criterion.

| B0 ID | Risk summary | Design authority | Acceptance coverage | Status |
|---|---|---|---|---|
| BS-01 | novelty can replace reader value as the goal | MASTER_SPEC, PRODUCT_REQUIREMENTS, RANKING_SCORING_SPEC, CONTENT_STRATEGY | AT-01, AT-25, AT-28, AT-29 | mapped |
| BS-06 | browser/PWA lifecycle could own scheduling | PLATFORM_DECISION, SYSTEM_ARCHITECTURE, BACKGROUND_JOB_SPEC, PUBLISHING_SPEC | AT-35 | mapped |
| BS-14 | public visibility mistaken for collection/reuse permission | SOURCE_STRATEGY, MEDIA_PIPELINE, SAFETY_COMPLIANCE | AT-05, AT-26, AT-31, AT-37 | mapped |
| BS-15 | multiple URLs may be one underlying source | SOURCE_STRATEGY, EVIDENCE_THRESHOLDS | AT-40 | mapped |
| BS-16 | seller URL can silently change the product | AFFILIATE_SPEC, PRODUCT_MATCHING, PUBLISHING_SPEC | AT-10, AT-17, AT-38, AT-44 | mapped |
| BS-21 | viral media discovery can lead to unauthorized reuse | MEDIA_PIPELINE, MEDIA_STRATEGY_OPTIONS, MEDIA_USAGE_SCENARIOS | AT-05, AT-26, AT-31, AT-37 | mapped |
| BS-22 | generated imagery can imply false public-figure endorsement | SAFETY_COMPLIANCE, MEDIA_PIPELINE, ISSUE_SOURCE_GRADING | AT-03, AT-27, AT-37 | mapped |
| BS-26 | public use can be rewritten as endorsement | ISSUE_SOURCE_GRADING, ISSUE_PRODUCT_DECISION_TABLE, CONTENT_STRATEGY, SAFETY_COMPLIANCE | AT-03, AT-27, AT-37 | mapped |
| BS-27 | rumor/private-life virality can become a commercial lane | MASTER_SPEC, PRODUCT_REQUIREMENTS, TREND_ISSUE_PIPELINE, SAFETY_COMPLIANCE | AT-03, AT-27, AT-28 | mapped |
| BS-31 | repeated agent agreement can create fake confidence | AGENT_CONTRACTS, AGENT_HANDOFFS, HANDOFF_VALIDATION_RULES, EVIDENCE_THRESHOLDS | AT-07, AT-13, AT-19, AT-41 | mapped |
| BS-32 | Guardian can become a rubber stamp | AGENT_CONTRACTS, AGENT_HANDOFFS, REVIEW_BINDING_SPEC | AT-08, AT-17 | mapped |
| BS-36 | human approval can degrade into approval fatigue | UI_SCREEN_SPEC, UI_STATE_ACTION_MATRIX, NOTIFICATION_SPEC, REVIEW_BINDING_SPEC | AT-32, AT-42 | mapped |
| BS-37 | approved version can differ from published version | REVIEW_BINDING_SPEC, PLATFORM_DECISION, PUBLISHING_SPEC | AT-09, AT-36, AT-38 | mapped |
| BS-40 | timeout can produce duplicate publication | PUBLISHING_SPEC | AT-11 | mapped |
| BS-41 | publishing authorization may expire before dispatch | PUBLISHING_SPEC, SECURITY_ARCHITECTURE, CONFIGURATION_AUTHORITY | AT-17, AT-43 | mapped |
| BS-46 | unsafe high-performing content can poison learning | ANALYTICS_SPEC, SAFETY_COMPLIANCE | AT-12 | mapped |
| BS-51 | secret leakage risk is high in a public repository | SECURITY_ARCHITECTURE, CONFIGURATION_AUTHORITY, CLAUDE.md | AT-20 | mapped |
| BS-52 | public-source excerpts may still contain personal data | PRODUCT_REQUIREMENTS, SOURCE_STRATEGY, SAFETY_COMPLIANCE, RETENTION_OPTIONS | AT-24 | mapped |

## Result

All B0 findings identified in Final Blind-Spot Sweep v1 have named design authority and behavioral acceptance coverage.

This closes the **design traceability** requirement for the current B0 set. It does not mean implementation is complete, tested against live services, or production-safe.

## Change rule

If `FINAL_BLIND_SPOT_SWEEP.md` adds or promotes a new B0 item, this matrix must be updated before the affected implementation slice may resume.

A B0 entry cannot be closed by lowering its severity merely to unblock implementation. Severity changes require a recorded rationale in the decision log.
