# Product Scout Specification

## Objective

Recommend products that combine rising attention, genuine purchase intent, strong visual/story potential, account relevance, and acceptable risk. Popularity alone is insufficient.

## Candidate lifecycle

`discovered → normalized → evidence-collected → scored → blocked/recommended → drafted → approved/rejected → published → measured`

## Required candidate data

- raw mention text and source reference
- normalized product name
- brand and model/variant when available
- exact-match confidence
- topic and audience fit
- engagement observations
- purchase-intent observations
- visual demonstration potential
- saturation estimate
- price/availability timestamp
- media-rights status
- personal-use status
- compliance risks

## Purchase-intent examples

Higher-intent language includes questions about:

- where to buy
- exact product name
- price
- link
- stock
- delivery
- comparison with alternatives

Likes alone are a weak purchase signal.

## Proposed score

The score is an explanation aid, not proof.

- attention acceleration: 20
- purchase intent: 25
- visual/content potential: 15
- account/audience fit: 15
- exact product availability: 10
- potential commercial value: 10
- creator evidence/readiness: 5

Risk deductions:

- over-saturation
- unresolved exact match
- unavailable or unstable listing
- unlicensed media dependency
- health/skincare/child claim exposure
- quality controversy or misleading substitution risk

## Recommendation rule

A candidate can appear in the top five only when:

- blocking identity and rights risks are visible
- recommendation reasons are shown in plain language
- uncertainty is not hidden by the score
- the user can block the product or category

## Draft angles

Each recommended product may generate four approaches:

1. problem → practical result
2. curiosity/demonstration
3. comparison/decision support
4. honest limitation and best-fit audience

The four drafts must differ in argument and reader value, not only vocabulary.
