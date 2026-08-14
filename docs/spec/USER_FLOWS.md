# User Flows v1

## Flow A — daily review

1. User opens ThreadScout.
2. First screen shows five opportunity cards.
3. User sees why-now, value, evidence status, media state, and risk without opening details.
4. User taps a candidate.
5. Detail page shows source timeline, product-match state, media rights, public-figure relationship if any, and commerce snapshot.
6. User chooses `Create strategies` only when evidence is sufficient.
7. Four strategies appear side-by-side or swipeable.
8. User opens one or all four drafts.
9. Guardian status and exact blockers appear above approval CTA.
10. User edits/selects a draft.
11. User explicitly approves or holds/rejects.
12. Approved content moves to schedule screen; no silent posting occurs.

## Flow B — user already knows the product

1. User enters product name/link/photo/reference.
2. Orchestrator skips open-ended Scout discovery.
3. Verifier still validates exact identity, rights, claims, and commerce snapshot.
4. Strategist → Writer → Guardian continues normally.
5. Human approval remains mandatory.

## Flow C — issue/celebrity/broadcast trigger

1. Scout detects an unusual increase in product-related discussion around a public event or public figure.
2. Candidate card is labeled `issue-triggered`, not “celebrity recommendation.”
3. Evidence screen shows the public event source separately from the product identity evidence.
4. Verifier assigns relationship level: official endorsement / confirmed use / visible-unconfirmed / reported association / similar-only / blocked rumor-private.
5. If identity is unresolved, content may remain trend/discovery commentary without an exact affiliate link, or be held.
6. If exact product is verified, Strategist may create an issue-linked angle while avoiding endorsement implication.
7. Guardian checks defamation, privacy, endorsement implication, media rights, and exact-product language.
8. Human approves or rejects.

## Flow D — photo/video reference

1. User or Scout adds a media reference.
2. Media record is created as `analysis_only` until rights review.
3. Verifier extracts only observable product clues; it does not identify a person from an image.
4. Product hypotheses are compared against independent product evidence.
5. Rights state determines whether original media can be used, linked/embedded, or must be replaced.
6. If publishable media is unavailable, user can attach owned media or generate a non-deceptive illustrative asset later under a separate media policy.

## Flow E — exact vs alternative product

1. Verifier finds a listing.
2. Matching engine evaluates brand, model, variant, geometry/visual clues, package, seller/listing, and conflicting evidence.
3. `exact`: may state same product.
4. `substitute`: must say alternative/similar product.
5. `likely` or `unresolved`: no same-product claim and no disguised affiliate substitution.

## Flow F — stale evidence before scheduled publish

1. Scheduled post reaches preflight window.
2. System checks price/stock/listing, rights, and issue recency according to TTL.
3. If only non-essential price changed, update/remove price claim and request approval if materially different.
4. If product identity/listing or rights changed, invalidate draft and stop schedule.
5. User receives a clear next action.

## Flow G — post performance review

1. Metrics collector receives permitted post metrics.
2. Analytics groups outcomes by product lane, angle, time, content type, and evidence class.
3. System distinguishes attention from purchase-intent outcomes.
4. Weekly summary proposes bounded changes, e.g. “demonstration angles outperform curiosity-only angles.”
5. Scout receives only approved learning features, not raw instructions to imitate viral posts.
