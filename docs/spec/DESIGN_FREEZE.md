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
- mobile-first responsive web v1 delivery platform
- desktop support and PWA-ready/non-authoritative boundary
- native-app evidence-based revisit gate
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
- final cross-domain blind-spot sweep
- B0 blind-spot traceability matrix
- expanded implementation trap checklist
- end-to-end design scenarios
- traceability and behavioral acceptance criteria through AT-44
- future design-focused GitHub Actions semantics

### Closed design-review gate

All B0 findings in the current Final Blind-Spot Sweep v1 are mapped to design authority and acceptance behavior in `B0_TRACEABILITY_MATRIX.md`.

This closes the current **B0 design traceability** gate only. It does not prove implementation or live-service safety.

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
2. first-screen density and final interaction styling
3. production opportunity-score threshold
4. evidence TTL values
5. issue-source allowlist and source-quality criteria
6. conversion-data availability and attribution behavior
7. suppression UX and restore behavior
8. retention periods
9. user-facing wording for source/relation grades
10. supported browser/device matrix and upload constraints

## P2 — later experiments

- automatic ranking-weight adaptation
- generated publication media
- multi-account support
- advanced A/B testing
- commercial trend providers
- cross-platform publishing
- native application shell if evidence-based revisit conditions are met
- learned ranking model

## Implementation-resume gate

Implementation resumes only after:

- user approves Master Spec v1 direction
- all P0 questions are answered or explicitly deferred behind disabled features
- P1 defaults required by the target implementation slice are documented and approved
- every applicable B0 item in `FINAL_BLIND_SPOT_SWEEP.md` maps to requirement/design/acceptance behavior
- traceability has no orphaned references
- architecture/code gap review is current
- design baseline commit is named in the implementation plan

The current B0 set satisfies its mapping condition. The remaining blockers are primarily Master Spec approval plus P0/P1 decisions required by the first implementation slice.

## Current milestone

The design branch is **Master Design v1 — detailed reviewable baseline**, not `DESIGN COMPLETE`.

The platform direction is resolved: mobile-first responsive web, desktop supported, PWA-ready, native app outside MVP. This does not lift the freeze because live P0 gates and first-slice P1 values remain open.

## Required next work

Continue documentation-only review until the direction is accepted. Remaining work should focus on P0/P1 promotion, final contradiction/edge-case re-review after the platform and blind-spot additions, and consolidation of duplicate/addendum documents—not runtime code.

Do not change `.github/workflows/ci.yml`, runtime code, provider adapters, or live-source flags during this design-only cycle.
