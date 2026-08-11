# Candidate Ranking & Scoring Specification v1

Status: DESIGN ONLY

## 1. Purpose

The ranking model helps the user decide what to inspect first. It must never act as a substitute for evidence verification, media rights, policy review, or human approval.

## 2. Four ranking options

| Option | Description | Strength | Weakness | Decision |
|---|---|---|---|---|
| A. One 100-point score | everything collapsed into one number | simple | hides blockers and uncertainty | reject |
| B. Opportunity score + readiness + risk | ranking score plus independent gates | explainable and safer | slightly more UI | **selected** |
| C. Rule tiers only | hot / review / hold / block | easy operations | weak ordering inside tier | supporting layer |
| D. Learned ranking model | model predicts future performance | adaptive | opaque and data-hungry | later experiment only |

## 3. User-facing ranking model

Every candidate has four separate outputs:

1. `opportunity_score` — 0–100, ranks potential value
2. `evidence_readiness` — ready / partial / weak / blocked
3. `risk_level` — low / review / high / blocked
4. `freshness_state` — fresh / aging / stale

A candidate may score 92 and still be blocked.

## 4. Opportunity score

Base score = 100 maximum.

### A. Problem / reader value — 20

- visible recurring problem: 0–10
- clear practical payoff: 0–10

### B. Demonstrability — 15

- understandable in 3–10 seconds: 0–8
- before/after, mechanism, comparison, or reveal quality: 0–7

### C. Purchase intent — 20

Signals include:

- where to buy
- exact product name
- price
- link
- option/size
- stock/delivery
- alternative comparison

Likes alone do not receive high purchase-intent credit.

### D. Attention acceleration — 15

Use relative change and recency rather than total popularity alone.

Possible signals:

- mention growth
- reply velocity
- cross-source emergence
- new issue/broadcast trigger

### E. Audience fit — 10

Fit to the account's defined lanes and expected reader problem.

### F. Novelty / surprise — 10

The mechanism or use case is interesting enough to stop scrolling without relying on exaggeration.

### G. Commercial practicality — 10

Considers whether the item is reasonably purchasable and can be mapped honestly to an affiliate destination. This is not “higher price = higher score.”

## 5. Opportunity score deductions

Deductions do not replace risk blockers.

- obvious over-saturation: -5 to -20
- weak utility / curiosity-only: -5 to -15
- highly unstable availability: -5 to -10
- repetitive recent account coverage: -5 to -20
- weak visual demonstration: -5 to -10
- commercial mismatch with audience: -5 to -15

Minimum score is 0.

## 6. Evidence readiness

### `ready`

- product identity sufficient for the proposed claim
- required source independence satisfied
- publication media state resolved for planned treatment
- mandatory claims supported
- affiliate mapping state known if affiliate CTA is proposed

### `partial`

Candidate can be discussed only with narrower wording or without exact-product/affiliate claim.

### `weak`

Useful as a discovery lead only. No strategy generation until evidence improves.

### `blocked`

Rights, identity, rumor/private-life, prohibited claim, or conflict makes progression unsafe.

## 7. Risk level

Risk is independently assigned.

### Low

Normal low-risk household product and claims.

### Review

Requires specific wording or source scrutiny, for example:

- public-figure association
- child-use context
- material safety statement
- performance comparison

### High

May proceed only with strong evidence and narrow wording.

### Blocked

Examples:

- rumor/private-life claim used as trigger
- unlicensed media required for the planned post
- product identity knowingly misrepresented
- medical/health guarantee
- fake endorsement implication

## 8. Freshness model

Freshness is per evidence class, not one universal timestamp.

Design categories:

- issue/public event freshness
- social attention freshness
- listing existence freshness
- price/stock freshness
- media-rights freshness
- evergreen product specification freshness

Exact TTL values remain configurable P1 decisions. A stale volatile field cannot be silently reused as current truth.

## 9. Ranking eligibility

Candidate appears in the primary top-five inbox when:

- opportunity score exceeds the configured review threshold
- it is not suppressed
- risk is not blocked
- at least one meaningful source observation exists
- a plain-language `why now` and `reader value` can be generated

Evidence may still be partial; the CTA then becomes `근거 확인`, not `전략 만들기`.

## 10. Issue-trigger adjustment

Public-figure/broadcast/event attention can raise `attention acceleration`, but it does not directly increase product identity confidence, endorsement confidence, or media rights.

Issue bonus must never compensate for:

- unresolved exact match
- blocked rumor/private-life source
- missing publication rights
- misleading endorsement language

## 11. Portfolio balancing

Top-five selection is not strictly the five highest numeric scores.

The Orchestrator may apply deterministic diversity constraints such as:

- avoid five near-identical kitchen items
- cap curiosity-only candidates
- avoid repeated brand concentration
- avoid excessive issue-triggered concentration
- preserve at least one non-affiliate/value-first candidate when available

The numeric score remains visible; portfolio diversification is logged separately.

## 12. Learning boundary

Analytics may propose bounded weight adjustments later, but:

- no automatic weight change without a recorded decision
- unsafe or misleading viral posts are excluded from learning
- low-sample conclusions are labeled weak
- revenue cannot zero out trust and safety objectives
