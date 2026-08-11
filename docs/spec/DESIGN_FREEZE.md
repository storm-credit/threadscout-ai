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
- media discovery vs publication-right distinction
- concrete media usage scenarios and fallback order
- exact/likely/substitute/unresolved product matching
- issue source grades G0–G4
- public-figure/product relation grades R0–R5
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

1. Which exact Threads account/app permissions are available for the owner's account at implementation time?
2. Which authorized product/listing source will provide exact current listing evidence for affiliate destinations?
3. What exact affiliate program/network will be used first and what disclosure/link rules apply at that time?
4. Where will credentials live in the actual deployment environment?
5. What deployment target will host the dashboard/worker/store?
6. What current platform/legal rules govern reuse/embed of each planned media source?

These require live/account-specific or current policy information, so design records the gate but does not guess.

## P1 — resolve before MVP implementation is considered feature-complete

1. Final daily publishing target and maximum affiliate-post ratio.
2. Final first-screen card density and mobile interaction pattern.
3. Exact production thresholds for `opportunity_score` review eligibility.
4. Exact evidence TTL values for price, listing, issue freshness, and rights.
5. Exact issue-source allowlist and reliable-news criteria.
6. Exact affiliate conversion data availability and attribution window.
7. Exact suppression UX and restoration behavior.
8. Retention periods for source excerpts, media metadata, and audit events.
9. Final user-visible wording for issue/public-figure relation grades.

## P2 — can remain experiments after MVP

- automatic ranking-weight adaptation
- AI-generated publication media
- multi-account support
- advanced A/B testing
- commercial trend providers
- cross-platform publishing
- learned ranking model replacing deterministic score weights

## Implementation-resume gate

Implementation resumes only after:

- user approves Master Spec v1 direction
- all P0 questions are answered or explicitly deferred behind disabled features
- affected P1 defaults are documented
- traceability matrix remains complete
- architecture/code gap review is current
- design baseline commit is named in the implementation plan

## Current design milestone

The design branch is now at **Master Design v1 — reviewable baseline**, not `DESIGN COMPLETE`.

The following detailed design artifacts have been added before code resumes:

- `UI_SCREEN_SPEC.md`
- `RANKING_SCORING_SPEC.md`
- `ISSUE_SOURCE_GRADING.md`
- `MEDIA_USAGE_SCENARIOS.md`
- `DAILY_OPERATING_MODEL.md`
- `END_TO_END_SCENARIOS.md`
- `DESIGN_CI_SPEC.md`

## Required next work

Continue documentation-only review until the user accepts the direction and P0/P1 decisions are either resolved or deliberately deferred.

Do not change `.github/workflows/ci.yml`, runtime code, provider adapters, or live-source flags during this design-only cycle.
