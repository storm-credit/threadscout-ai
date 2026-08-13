# Daily Candidate Selection — Worked Example v1

Status: DESIGN ONLY. Every candidate and score below is synthetic.

## Purpose

Demonstrate how a pool of twenty raw candidates becomes a maximum of five recommendations and then zero to three approved posts without using one score as the only decision.

## Synthetic pool

| # | Candidate | Score | Evidence | Risk | Freshness | Route |
|---:|---|---:|---|---|---|---|
| 1 | foldable sink rack | 86 | ready | low | fresh | shortlist |
| 2 | magnetic cable holder | 78 | partial | low | fresh | verify |
| 3 | compression travel pouch | 82 | ready | low | fresh | shortlist |
| 4 | rotating outlet adapter | 74 | partial | review | fresh | verify |
| 5 | shoe wash bag | 71 | ready | low | fresh | reserve |
| 6 | pencil grip | 68 | partial | review | fresh | verify |
| 7 | high-claim product | 72 | weak | high | fresh | hold |
| 8 | gap-cleaning brush | 84 | ready | low | aging | shortlist |
| 9 | novelty peeling tool | 67 | partial | low | fresh | reserve |
| 10 | mini vacuum sealer | 88 | partial | low | fresh | verify |
| 11 | issue-linked bottle hypothesis | 92 | weak | review | fresh | verify |
| 12 | blocked issue-linked product | 95 | blocked | blocked | fresh | block |
| 13 | verified campaign bag | 83 | ready | review | fresh | shortlist |
| 14 | similar alternative bag | 80 | partial | review | fresh | alternative |
| 15 | sliding refrigerator tray | 79 | ready | low | fresh | shortlist |
| 16 | old-signal cleaning tool | 73 | ready | low | stale | hold |
| 17 | travel neck pillow | 76 | partial | low | fresh | verify |
| 18 | power-strip organizer | 70 | ready | low | fresh | reserve |
| 19 | silicone splatter guard | 81 | ready | low | fresh | shortlist |
| 20 | viral-video tool hypothesis | 90 | weak | review | fresh | verify |

## Hard gates

Before top-five selection, remove or hold candidates with blocked evidence, stale critical signals, unresolved high-risk claims, or active suppression. High opportunity score does not override these gates.

## Portfolio rules

1. cap issue-triggered candidates at two of five by default
2. cap curiosity-only candidates at one of five
3. avoid near-duplicates solving the same problem
4. prefer at least three candidates that do not depend on unresolved third-party final-use media
5. bound the amount of verification work shown in the primary inbox
6. never lower the quality floor just to fill five positions

## Example final five

1. mini vacuum sealer — 88 / partial / `verify evidence`
2. foldable sink rack — 86 / ready / `create four strategies`
3. verified campaign bag — 83 / ready-review / `create four strategies`
4. compression travel pouch — 82 / ready / `create four strategies`
5. sliding refrigerator tray — 79 / ready / `create four strategies`

A hypothetical 92-point issue-linked candidate and 90-point viral-video candidate remain in verification despite higher scores because identity or media evidence is unresolved.

## Evening outcome

A valid day may finish with two approved posts and no third post. The system optimizes for quality and evidence, not quota completion.

## Audit

For every inclusion/exclusion store score components, evidence/risk/freshness, portfolio rule, suppression state, reason code, timestamp, and source/artifact references.
