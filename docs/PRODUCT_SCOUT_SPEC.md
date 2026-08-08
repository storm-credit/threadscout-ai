# Product Scout Specification

## Objective

Recommend **실용 신박템** that combine visible problem solving, short demonstration value, genuine purchase intent, audience relevance, and acceptable evidence risk. Popularity and novelty alone are insufficient.

## Candidate lifecycle

`discovered → normalized → scored → evidence-requested → verified/blocked → drafted → guardian-reviewed → human-approved/rejected → queued → measured`

## Required candidate data

- candidate ID and normalized product name
- raw mention/source references
- identity confidence
- problem being solved
- demonstration description
- practical-use reason
- novelty reason
- purchase-intent observations
- audience fit
- saturation estimate
- creator media feasibility
- risk flags
- score breakdown, gates, and plain-language recommendation reason

Product Scout does not declare an exact product match and does not assert current price or stock. Those belong to Evidence Verifier.

## Purchase-intent examples

Higher-intent language includes questions about:

- where to buy
- exact product or option
- price
- link
- stock and delivery
- dimensions or quantity
- comparison with alternatives

Likes and generic reactions are weak signals.

## Practical novel-item score

- problem clarity: 20
- demonstration potential: 20
- practical utility: 20
- novelty: 15
- purchase intent: 15
- audience fit: 10

## Hard gates before `recommended`

- practical utility must be at least 60/100
- demonstration potential must be at least 55/100
- problem clarity must be at least 55/100
- normalized identity confidence must be at least 0.65
- at least two source references are required
- blocked categories and health-claim risk cannot pass

## Risk deductions

- gimmick-only product
- over-saturated visual or wording pattern
- weak source evidence
- uncertain product identity
- third-party-media dependency or rights risk
- health/skincare efficacy dependency

## Recommendation rule

A candidate can appear in the top five only when:

- the score and gates are visible
- uncertainty is not hidden by a numeric total
- the problem and demonstration are described plainly
- evidence and rights can realistically be verified
- the user can hold, reject, or suppress the product/category

## Draft angles

Each verified product may generate exactly four approaches:

1. problem → practical result
2. mechanism → short demonstration
3. comparison → buying checklist
4. honest limitation → best-fit audience

The four drafts must differ in argument and reader value, not only vocabulary.
