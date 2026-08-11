# Requirements Traceability Matrix v1

The goal is to prevent “implemented because it seemed useful” work. Every MVP capability maps to a design authority, owner, gate, and acceptance test.

| Requirement | Design authority | Owner | Required artifact/gate | Acceptance test |
|---|---|---|---|---|
| PR-01 Daily opportunity inbox | MASTER_SPEC, USER_FLOWS | UI + Orchestrator | candidate_set | AT-01 |
| PR-02 Multi-source discovery | SOURCE_STRATEGY | Scout | discovery_brief/candidate_set | AT-02 |
| PR-03 Issue/celebrity discovery | TREND_ISSUE_PIPELINE | Scout + Verifier | IssueSignal/PublicFigureRelation | AT-03 |
| PR-04 Evidence verification | AGENT_CONTRACTS, PRODUCT_MATCHING | Verifier | evidence_packet | AT-04 |
| PR-05 Media/rights | MEDIA_PIPELINE | Verifier + Guardian | MediaAsset rights state | AT-05 |
| PR-06 Four strategies | CONTENT_STRATEGY | Strategist | content_brief[4] | AT-06 |
| PR-07 Four drafts | AGENT_CONTRACTS | Writer | draft_bundle[4] | AT-07 |
| PR-08 Guardian | SAFETY_COMPLIANCE | Guardian | review_report | AT-08 |
| PR-09 Human approval | MASTER_SPEC, USER_FLOWS | Orchestrator + user | HumanApproval | AT-09 |
| PR-10 Affiliate mapping | AFFILIATE_SPEC | Verifier + deterministic mapper | AffiliateMapping | AT-10 |
| PR-11 Schedule/publish | PUBLISHING_SPEC | deterministic services | ScheduledPost | AT-11 |
| PR-12 Metrics/learning | ANALYTICS_SPEC | metrics/analytics service | learning_summary | AT-12 |
| PR-13 Auditability | DATA_MODEL, AGENT_HANDOFFS | Orchestrator/audit | lineage + hashes | AT-13 |
| PR-14 Suppression controls | USER_FLOWS | UI + state service | suppression record | AT-14 |
| NFR-01 Mobile-first | USER_FLOWS | UI | responsive flow | AT-15 |
| NFR-02 Truth first | MASTER_SPEC | all | evidence gate | AT-16 |
| NFR-03 Fail closed | SAFETY_COMPLIANCE | Orchestrator/Guardian | blocker state | AT-17 |
| NFR-04 Observability | DATA_MODEL | runtime/audit | receipts/events | AT-18 |
| NFR-05 Reproducibility | AGENT_HANDOFFS | runtime | immutable refs | AT-19 |
| NFR-06 Security | SAFETY_COMPLIANCE | platform | secret boundary | AT-20 |
| NFR-07 Cost controls | AGENT_CONTRACTS/SOURCE_STRATEGY | Orchestrator | budgets | AT-21 |
| NFR-08 Accessibility | USER_FLOWS | UI | visible text/status | AT-22 |
| NFR-09 Korean quality | CONTENT_STRATEGY | Writer/Guardian | language review | AT-23 |
| NFR-10 Data minimization | SAFETY_COMPLIANCE | source/store | retention/redaction | AT-24 |

## Change control

When a requirement changes:

1. update requirement
2. update impacted design spec(s)
3. update this matrix
4. record the decision
5. only then change implementation/tests

No code-only change may silently redefine a requirement.
