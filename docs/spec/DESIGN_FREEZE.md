# Design Freeze & Open Questions v1

## Current instruction

**Do not add or change runtime/product code while the master design is being completed and reviewed.** Documentation-only changes are allowed on the design branch.

Existing code remains a prototype/validation asset and is not automatically the product authority. The `docs/spec/` set is the design authority for future implementation.

The existing GitHub Actions green check means the prototype regression suite still passes; it does not mean the master design has been implemented or approved.

## Design status

### Defined

- product purpose and non-goals
- practical novel-item focus
- issue/public-figure content boundary
- fixed six-agent roster
- deterministic services
- canonical end-to-end flow
- agent inputs/outputs/tool boundaries
- explicit handoff protocol
- conceptual data model
- source evidence hierarchy
- opportunity ranking separated from evidence readiness/risk/freshness
- detailed mobile screens and CTAs
- media discovery vs final-use distinction
- exact/likely/substitute/unresolved product matching
- issue source and product-relation grading
- content strategy and four-angle rule
- affiliate exact/alternative mapping
- daily operating rhythm and suppression model
- publishing state/reconciliation model
- analytics learning guardrails
- safety/privacy/public-figure rules
- end-to-end design scenarios
- traceability and behavioral acceptance criteria
- future design-focused GitHub Actions semantics

## P0 — must resolve before any live implementation

1. exact Threads account/app permissions available at implementation time
2. authorized product/listing evidence source for commercial destinations
3. first affiliate program and current disclosure/link rules
4. credential storage location in the deployment environment
5. deployment target for dashboard/worker/store
6. current media-source action rules for analyze/embed/download/transform/republish

These require live/account-specific or current-policy evidence, so design records the gate instead of guessing.

## P1 — resolve before MVP is feature-complete

1. daily publishing target and maximum commercial-post ratio
2. first-screen density and interaction pattern
3. production opportunity-score threshold
4. evidence TTL values
5. issue-source allowlist and source-quality criteria
6. conversion-data availability and attribution behavior
7. suppression UX and restore behavior
8. retention periods
9. user-facing wording for source/relation grades

## P2 — later experiments

- automatic ranking-weight adaptation
- generated publication media
- multi-account support
- advanced A/B testing
- commercial trend providers
- cross-platform publishing
- learned ranking model

## Implementation-resume gate

Implementation resumes only after:

- user approves Master Spec v1 direction
- all P0 questions are answered or explicitly deferred behind disabled features
- P1 defaults required by the target implementation slice are documented and approved
- traceability has no orphaned references
- architecture/code gap review is current
- design baseline commit is named in the implementation plan

## Current milestone

The design branch is **Master Design v1 — detailed reviewable baseline**, not `DESIGN COMPLETE`.

## Required next work

Continue documentation-only review until the direction is accepted. Remaining work should focus on contradiction review, edge cases, and P0/P1 promotion—not runtime code.

Do not change `.github/workflows/ci.yml`, runtime code, provider adapters, or live-source flags during this design-only cycle.
