# Decision Log Addendum — 2026-08-13

## Continue design-only work

Runtime/product code remains frozen. The design branch was extended rather than moving into implementation.

## Candidate portfolio selection

The daily selection model is explicitly non-numeric. Opportunity score is advisory; evidence readiness, risk, freshness, suppression, duplication, issue concentration, and verification workload can change the final five.

## Media strategy

The selected design is a dual funnel: research references and final-use material are separate. Research usefulness never grants final-use status.

## Issue-to-product routing

Issue-triggered candidates now have an explicit decision table. Source reliability, relationship grade, exact-product state, final-use media state, commercial mapping, and freshness remain independent.

## Mobile first screen

Opportunity Inbox remains the selected mobile structure after comparing feed, scoreboard, kanban, and opportunity-card wireframes.

## P0/P1 model

Live/account-specific unknowns remain P0 blockers. Reversible design values may be recorded as provisional P1 defaults for simulation, but they are not production-approved until explicitly promoted.

## Traceability

`TRACEABILITY_ADDENDUM.md` and `ACCEPTANCE_TESTS_ADDENDUM.md` map the newly detailed design artifacts to AT-29 through AT-33.
