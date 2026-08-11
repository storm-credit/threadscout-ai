# Requirements Traceability Matrix v1

The goal is to prevent “implemented because it seemed useful” work. Every MVP capability maps to a design authority, owner, gate, and acceptance test.

| Requirement | Design authority | Owner | Required artifact/gate | Acceptance test |
|---|---|---|---|---|
| PR-01 Daily opportunity inbox | MASTER_SPEC, USER_FLOWS, UI_SCREEN_SPEC | UI + Orchestrator | candidate_set | AT-01 |
| PR-02 Multi-source discovery | SOURCE_STRATEGY | Scout | discovery_brief/candidate_set | AT-02 |
| PR-03 Issue/celebrity discovery | TREND_ISSUE_PIPELINE, ISSUE_SOURCE_GRADING | Scout + Verifier | IssueSignal/PublicFigureRelation | AT-03 |
| PR-04 Evidence verification | AGENT_CONTRACTS, PRODUCT_MATCHING | Verifier | evidence_packet | AT-04 |
| PR-05 Media/rights | MEDIA_PIPELINE, MEDIA_USAGE_SCENARIOS | Verifier + Guardian | MediaAsset rights state | AT-05 |
| PR-06 Four strategies | CONTENT_STRATEGY | Strategist | content_brief[4] | AT-06 |
| PR-07 Four drafts | AGENT_CONTRACTS | Writer | draft_bundle[4] | AT-07 |
| PR-08 Guardian | SAFETY_COMPLIANCE | Guardian | review_report | AT-08 |
| PR-09 Human approval | MASTER_SPEC, USER_FLOWS, UI_SCREEN_SPEC | Orchestrator + user | HumanApproval | AT-09 |
| PR-10 Affiliate mapping | AFFILIATE_SPEC | Verifier + deterministic mapper | AffiliateMapping | AT-10 |
| PR-11 Schedule/publish | PUBLISHING_SPEC | deterministic services | ScheduledPost | AT-11 |
| PR-12 Metrics/learning | ANALYTICS_SPEC, DAILY_OPERATING_MODEL | metrics/analytics service | learning_summary | AT-12 |
| PR-13 Auditability | DATA_MODEL, AGENT_HANDOFFS | Orchestrator/audit | lineage + hashes | AT-13 |
| PR-14 Suppression controls | USER_FLOWS, UI_SCREEN_SPEC, DAILY_OPERATING_MODEL | UI + state service | suppression record | AT-14 |
| PR-15 Candidate ranking | RANKING_SCORING_SPEC | Scout + Orchestrator | opportunity/readiness/risk/freshness | AT-25 |
| PR-16 Media fallback behavior | MEDIA_USAGE_SCENARIOS | Verifier + Guardian + user | publishable media treatment | AT-26 |
| PR-17 Issue source grading | ISSUE_SOURCE_GRADING | Scout + Verifier + Guardian | G0–G4 / R0–R5 grades | AT-27 |
| PR-18 Daily operating rhythm | DAILY_OPERATING_MODEL | Orchestrator + UI | review windows / urgency class | AT-28 |
| NFR-01 Mobile-first | USER_FLOWS, UI_SCREEN_SPEC | UI | responsive flow | AT-15 |
| NFR-02 Truth first | MASTER_SPEC | all | evidence gate | AT-16 |
| NFR-03 Fail closed | SAFETY_COMPLIANCE | Orchestrator/Guardian | blocker state | AT-17 |
| NFR-04 Observability | DATA_MODEL | runtime/audit | receipts/events | AT-18 |
| NFR-05 Reproducibility | AGENT_HANDOFFS | runtime | immutable refs | AT-19 |
| NFR-06 Security | SAFETY_COMPLIANCE | platform | secret boundary | AT-20 |
| NFR-07 Cost controls | AGENT_CONTRACTS/SOURCE_STRATEGY | Orchestrator | budgets | AT-21 |
| NFR-08 Accessibility | UI_SCREEN_SPEC | UI | visible text/status | AT-22 |
| NFR-09 Korean quality | CONTENT_STRATEGY | Writer/Guardian | language review | AT-23 |
| NFR-10 Data minimization | SAFETY_COMPLIANCE, MEDIA_USAGE_SCENARIOS | source/store | retention/redaction | AT-24 |

## Design governance traceability

| Governance requirement | Authority | Current state |
|---|---|---|
| exactly six agents | MASTER_SPEC, AGENT_CONTRACTS | fixed |
| no price agent | MASTER_SPEC, AGENT_CONTRACTS | fixed |
| code freeze during design | CLAUDE.md, DESIGN_FREEZE | active |
| docs/spec is authority | README, DESIGN_FREEZE | active |
| current CI is prototype regression | DESIGN_CI_SPEC, IMPLEMENTATION_STATUS | documented |
| implementation resumes from approved design commit | DESIGN_FREEZE | required |

## Change control

When a requirement changes:

1. update requirement
2. update impacted design spec(s)
3. update this matrix
4. update/add acceptance test ID
5. record the decision
6. only then change implementation/tests after the freeze is lifted

No code-only change may silently redefine a requirement.
