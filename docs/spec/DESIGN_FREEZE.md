# Design Freeze & Open Questions v1

## Current instruction

**Do not add or change runtime/product code while the master design is being completed and reviewed.** Documentation-only changes are allowed on the design branch.

Existing code remains a prototype/validation asset and is not automatically the product authority. The `docs/spec/` set is the design authority for future implementation.

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
- media discovery vs publication-right distinction
- exact/likely/substitute/unresolved product matching
- content strategy and four-angle rule
- affiliate exact/alternative mapping
- publishing state/reconciliation model
- analytics learning guardrails
- safety/privacy/public-figure rules
- traceability and behavioral acceptance criteria

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
3. Exact evidence TTL values for price, listing, issue freshness, and rights.
4. Exact issue-source allowlist and reliable-news criteria.
5. Exact affiliate conversion data availability and attribution window.
6. Exact suppression UX and restoration behavior.
7. Retention periods for source excerpts, media metadata, and audit events.

## P2 — can remain experiments after MVP

- automatic ranking-weight adaptation
- AI-generated publication media
- multi-account support
- advanced A/B testing
- commercial trend providers
- cross-platform publishing

## Implementation-resume gate

Implementation resumes only after:

- user approves Master Spec v1 direction
- all P0 questions are answered or explicitly deferred behind disabled features
- affected P1 defaults are documented
- traceability matrix remains complete
- architecture/code gap review is written before code changes

## Required next design artifact after user review

`IMPLEMENTATION_GAP_ANALYSIS.md` — compare existing prototype code to the approved master spec and classify every gap as keep / modify later / remove later / missing. This is analysis only; no code changes until a subsequent explicit implementation instruction.
