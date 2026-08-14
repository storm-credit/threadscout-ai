# Requirements Traceability Matrix v1

The goal is to prevent “implemented because it seemed useful” work. Every MVP capability maps to a design authority, owner, gate, and acceptance behavior.

| Requirement / capability | Design authority | Owner | Required artifact/gate | Acceptance |
|---|---|---|---|---|
| PR-01 Daily opportunity inbox | MASTER_SPEC, USER_FLOWS, UI_SCREEN_SPEC | UI + Orchestrator | candidate_set | AT-01 |
| PR-02 Multi-source discovery | SOURCE_STRATEGY | Scout | discovery_brief/candidate_set | AT-02 |
| PR-03 Issue/celebrity discovery | TREND_ISSUE_PIPELINE, ISSUE_SOURCE_GRADING | Scout + Verifier | IssueSignal/PublicFigureRelation | AT-03 |
| PR-04 Evidence verification | AGENT_CONTRACTS, PRODUCT_MATCHING | Verifier | evidence_packet | AT-04 |
| PR-05 Media/rights | MEDIA_PIPELINE, MEDIA_USAGE_SCENARIOS | Verifier + Guardian | MediaAsset rights state | AT-05 |
| PR-06 Four strategies | CONTENT_STRATEGY, CONTENT_OUTPUT_SPEC | Strategist | content_brief[4] | AT-06 |
| PR-07 Four drafts | AGENT_CONTRACTS, CONTENT_OUTPUT_SPEC | Writer | draft_bundle[4] | AT-07 |
| PR-08 Guardian | SAFETY_COMPLIANCE, AGENT_CONTRACTS | Guardian | review_report | AT-08 |
| PR-09 Human approval | MASTER_SPEC, USER_FLOWS, REVIEW_BINDING_SPEC | Orchestrator + owner | HumanApproval | AT-09, AT-38 |
| PR-10 Affiliate mapping | AFFILIATE_SPEC, PRODUCT_MATCHING | Verifier + deterministic mapper | AffiliateMapping | AT-10, AT-44 |
| PR-11 Schedule/publish | PUBLISHING_SPEC, BACKGROUND_JOB_SPEC | deterministic services | ScheduledPost | AT-11, AT-35, AT-43 |
| PR-12 Metrics/learning | ANALYTICS_SPEC, DAILY_OPERATING_MODEL | metrics/analytics service | learning_summary | AT-12 |
| PR-13 Auditability | DATA_MODEL, AGENT_HANDOFFS | Orchestrator/audit | lineage + hashes | AT-13, AT-18, AT-19 |
| PR-14 Suppression controls | USER_FLOWS, UI_SCREEN_SPEC, DAILY_OPERATING_MODEL | UI + state service | suppression record | AT-14 |
| PR-15 Candidate ranking | RANKING_SCORING_SPEC | Scout + Orchestrator | opportunity/readiness/risk/freshness | AT-25, AT-29 |
| PR-16 Media fallback behavior | MEDIA_STRATEGY_OPTIONS, MEDIA_USAGE_SCENARIOS | Verifier + Guardian + owner | publishable media treatment | AT-26, AT-31 |
| PR-17 Issue source grading | ISSUE_SOURCE_GRADING, ISSUE_PRODUCT_DECISION_TABLE | Scout + Verifier + Guardian | G0–G4 / R0–R5 grades | AT-27, AT-30 |
| PR-18 Daily operating rhythm | DAILY_OPERATING_MODEL | Orchestrator + UI | review windows / urgency class | AT-28 |
| PR-19 Mobile delivery platform | PLATFORM_OPTIONS, PLATFORM_DECISION | UI + application services | responsive web client | AT-34, AT-35 |
| PR-20 Cross-device review consistency | PLATFORM_DECISION, REVIEW_BINDING_SPEC | application state + UI | current artifact versions | AT-36, AT-38 |
| PR-21 Source independence | SOURCE_STRATEGY, EVIDENCE_THRESHOLDS | Verifier | source-origin dependency graph | AT-40 |
| PR-22 Factual-authority boundary | AGENT_CONTRACTS, AGENT_HANDOFFS, HANDOFF_VALIDATION_RULES | Verifier + Orchestrator | evidence packet authority | AT-41 |
| PR-23 Review-attention hierarchy | UI_STATE_ACTION_MATRIX, NOTIFICATION_SPEC | UI + Orchestrator | blocker/material-change priority | AT-42 |
| PR-24 Live activation gates | P0_P1_DECISION_TABLE, CONFIGURATION_AUTHORITY, DESIGN_FREEZE | platform/operator | capability state | AT-33, AT-43 |
| NFR-01 Mobile-first | PLATFORM_DECISION, USER_FLOWS, UI_SCREEN_SPEC | UI | responsive flow | AT-15, AT-32, AT-34 |
| NFR-02 Truth first | MASTER_SPEC, EVIDENCE_THRESHOLDS | all | evidence gate | AT-16, AT-41 |
| NFR-03 Fail closed | SAFETY_COMPLIANCE, DESIGN_FREEZE | Orchestrator/Guardian | blocker state | AT-17, AT-33 |
| NFR-04 Observability | DATA_MODEL | runtime/audit | receipts/events | AT-18 |
| NFR-05 Reproducibility | AGENT_HANDOFFS, REVIEW_BINDING_SPEC | runtime | immutable refs | AT-19, AT-38 |
| NFR-06 Security | SECURITY_ARCHITECTURE, CONFIGURATION_AUTHORITY | platform | secret boundary | AT-20, AT-43 |
| NFR-07 Cost controls | RUN_BUDGETS, AGENT_CONTRACTS, SOURCE_STRATEGY | Orchestrator | budgets | AT-21 |
| NFR-08 Accessibility | UI_SCREEN_SPEC, PLATFORM_DECISION | UI | visible text/status/touch | AT-22, AT-34 |
| NFR-09 Korean quality | CONTENT_STRATEGY, CONTENT_OUTPUT_SPEC | Writer/Guardian | language review | AT-23 |
| NFR-10 Data minimization | SAFETY_COMPLIANCE, SOURCE_STRATEGY, RETENTION_OPTIONS | source/store | retention/redaction | AT-24 |
| NFR-11 Blind-spot closure | FINAL_BLIND_SPOT_SWEEP, B0_TRACEABILITY_MATRIX | design authority | B0 mapping | AT-39 |
| NFR-12 Public-figure/media safety | ISSUE_SOURCE_GRADING, MEDIA_PIPELINE, SAFETY_COMPLIANCE | Verifier + Guardian | relation/media rights | AT-37 |

## Design-governance traceability

| Governance requirement | Authority | Baseline state |
|---|---|---|
| exactly six agents | MASTER_SPEC, AGENT_CONTRACTS | approved/fixed |
| no price agent | MASTER_SPEC, AGENT_CONTRACTS | approved/fixed |
| mobile-first responsive web | PLATFORM_DECISION | approved/fixed for v1 |
| browser/PWA non-authority | PLATFORM_DECISION, BACKGROUND_JOB_SPEC | approved/fixed |
| docs/spec is authority | README, MASTER_SPEC | approved |
| final blind-spot B0 mapping | FINAL_BLIND_SPOT_SWEEP, B0_TRACEABILITY_MATRIX | complete for current B0 set |
| P0 live facts fail closed | P0_P1_DECISION_TABLE, DESIGN_FREEZE | approved |
| reversible P1 defaults | P0_P1_DECISION_TABLE, USER_DECISION_REGISTER | promoted |
| current CI is prototype regression | DESIGN_CI_SPEC, IMPLEMENTATION_STATUS | documented |
| implementation starts from approved design | MASTER_SPEC, DESIGN_FREEZE | required |

## Change control

When a requirement changes:

1. update the requirement
2. update impacted design spec(s)
3. update this matrix
4. update/add acceptance behavior
5. perform blind-spot impact review
6. record the decision
7. only then change implementation/tests in a separately authorized implementation task

No code-only change may silently redefine a requirement or weaken a fixed gate.
