# Issue-to-Product Decision Table v1

Status: DESIGN ONLY.

## Purpose

Issue-triggered candidates must move through explicit decision states rather than riding on attention alone.

## Independent axes

1. `issue_source_grade` — G0 to G4
2. `product_relation_grade` — R0 to R5
3. `product_match_state` — exact / likely / substitute / unresolved
4. `publication_media_state`
5. `commercial_mapping_state`
6. `freshness_state`

No axis may substitute for another.

## Core matrix

| Issue / relation state | Product match | Allowed treatment | Commercial mapping |
|---|---|---|---|
| G0/G1 + R0 | exact | verified campaign relationship may be stated narrowly | exact mapping after fresh listing check |
| G0/G1 + R1 | exact | confirmed public use may be stated without adding unsupported sponsorship language | exact mapping allowed |
| G0–G2 + R2 | likely/unresolved | discovery-only wording; further verification required | no exact mapping |
| G0/G1 + R3 | likely/exact | attributed association only | exact only when match is independently exact |
| G0–G2 + R4 | substitute | clearly labeled alternative/similar product | alternative mapping only |
| any + R5 | any | block | none |
| G4 + any | any | block for issue-linked promotion | none |

## Decision outcomes

The Orchestrator may route the candidate to exactly one of:

- `verify_more`
- `information_only`
- `exact_product_content`
- `alternative_product_content`
- `hold`
- `block`

## Wording ceiling

Final copy may never state a stronger product relationship than the verified grade. `confirmed use` cannot silently become `official campaign`, and `alternative` cannot become `same product`.

## Media consequence

Media permission is evaluated independently. A source can be reliable for event evidence while the attached image/video remains unavailable for final use.

## Freshness consequence

If the source is corrected, disputed, removed, or stale, issue-linked drafting pauses and dependent artifacts become stale until re-evaluated.

## Guardian blockers

Guardian blocks when the relationship wording exceeds evidence, a substitute is presented as exact, final-use media state is unresolved for the chosen treatment, or source/relation state is blocked.
