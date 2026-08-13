# Photo / Video Strategy — Four Options v1

Status: DESIGN ONLY.

## Decision question

How should ThreadScout find useful photo/video references while keeping product accuracy and final-use permission separate?

| Option | Description | Benefit | Main weakness | Decision |
|---|---|---|---|---|
| A. User-owned only | Use only material created by the user | simplest final-use path | weak discovery and matching | not selected as the only path |
| B. Final-use-ready sources only | Search only material already suitable for final use | simpler publishing | misses useful research references | not selected |
| C. Dual funnel | Research references and final-use material are selected independently | best balance of discovery and governance | more metadata/state | **selected** |
| D. Paid provider | Use a commercial provider for normalized reference discovery | enterprise convenience | cost and provider dependence | later experiment |

## Selected Option C — dual funnel

### Research funnel

Approved source references may be used to understand:

- product mechanism
- visible product clues
- why people are interested
- what information users are asking for

The research record stores only the minimum reference metadata needed for evidence.

### Final-use funnel

Preferred order:

1. user-created exact-product material
2. permission-confirmed material
3. permitted native link/embed treatment
4. newly created user-owned demonstration
5. text-only content
6. hold the candidate

## Core rule

A useful research reference never becomes final-use material automatically. `research_media_state` and `publication_media_state` are independent.

## Product identity rule

A visual clue can create a product hypothesis, but exact identity still requires independent verification. A visually similar item cannot be treated as exact merely because the image looks convincing.

## Failure behavior

If no suitable final-use media is available, the system may continue as text-only when reader value remains, ask for user-owned material, or hold. It never weakens the final-use gate to preserve posting volume.

## Later generated-media option

Generated illustrative media is a later experiment and must not misrepresent a real product, event, or endorsement relationship.
