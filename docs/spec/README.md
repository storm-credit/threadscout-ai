# ThreadScout Design Authority

This directory is the canonical design baseline for the next implementation cycle.

## Precedence

1. `MASTER_SPEC.md`
2. domain specs in this directory
3. `TRACEABILITY_MATRIX.md` and `ACCEPTANCE_TESTS.md`
4. existing legacy/phase documents under `docs/`
5. current prototype implementation

If the prototype conflicts with an approved spec, the prototype is considered out of date; do not rewrite the spec merely to match existing code.

## Required reading order

1. MASTER_SPEC
2. PRODUCT_REQUIREMENTS
3. USER_FLOWS
4. AGENT_CONTRACTS
5. AGENT_HANDOFFS
6. DATA_MODEL
7. SOURCE_STRATEGY
8. MEDIA_STRATEGY_OPTIONS
9. MEDIA_PIPELINE
10. ISSUE_CONTENT_OPTIONS
11. TREND_ISSUE_PIPELINE
12. PRODUCT_MATCHING
13. CONTENT_STRATEGY
14. AFFILIATE_SPEC
15. PUBLISHING_SPEC
16. ANALYTICS_SPEC
17. SAFETY_COMPLIANCE
18. TRACEABILITY_MATRIX
19. ACCEPTANCE_TESTS
20. DESIGN_REVIEW_CHECKLIST
21. DESIGN_FREEZE
22. IMPLEMENTATION_GAP_ANALYSIS

## Current mode

Design-only. No runtime/product code changes until the implementation-resume gate in `DESIGN_FREEZE.md` is satisfied.
