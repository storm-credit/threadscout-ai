# End-to-End Design Scenarios v1

Status: DESIGN ONLY

These scenarios test whether the design is understandable before implementation.

## Scenario 1 — evergreen practical novel item

### Trigger

Several sources show rising interest in a compact household product with a visually clear mechanism.

### Scout

Returns candidate with:

- practical problem
- attention acceleration
- purchase-intent questions
- demonstration potential
- saturation estimate

### Verifier

Confirms:

- exact brand/model/variant
- current listing evidence
- commerce snapshot
- safe factual claims
- available publication media state

### Strategist

Produces four angles:

1. problem/result
2. mechanism reveal
3. alternative comparison
4. limitation/best-fit

### Writer

Creates four Korean drafts from the evidence packet only.

### Guardian

Checks first-hand wording, claims, disclosure, media rights, product/link match, exaggeration.

### User

Selects one draft, approves, schedules.

## Scenario 2 — celebrity/broadcast product interest

### Trigger

A public broadcast or official public appearance causes people to ask what a visible product is.

### Required separation

The system creates separate artifacts for:

- issue/event evidence
- public-figure relation
- media reference
- product hypothesis
- exact-product evidence
- publication media rights

### Acceptable path

1. source grade G0/G1/G2 supports the public event
2. product relation is R0/R1 or R2 pending verification
3. independent product evidence establishes exact product
4. media publication rights are separately resolved
5. issue-linked strategy avoids implying endorsement unless verified
6. Guardian passes
7. user approves

### Rejected path

- rumor/private-life post creates the trend
- product is only “looks similar”
- copied TV/viral clip is required for the post
- copy says the celebrity recommends it without evidence

Result: block or reframe as a non-celebrity evergreen product candidate.

## Scenario 3 — viral video with no reuse rights

### Trigger

A public short-form video makes a tool look interesting.

### Correct behavior

- Scout can register the video URL as a discovery reference
- original media remains `analysis_only`
- Verifier extracts visible product clues
- exact product is verified independently
- final Threads post uses owned/licensed media or text-only content

The viral video's popularity can affect attention score but not publication permission.

## Scenario 4 — similar substitute has a better affiliate listing

### Situation

Exact issue product is known, but the affiliate network only has a similar product.

### Correct behavior

AffiliateMapping state = `alternative`.

Copy must clearly separate:

- `이슈/사진 속 제품`
- `구매 가능한 비슷한 대체 제품`

The system must not use the exact-product photo while linking a substitute in a way that implies identity.

## Scenario 5 — user supplies a product and own photo

### Trigger

User enters product name/link and attaches own media.

### Routing

- Orchestrator skips open discovery
- Verifier still confirms exact product/listing/claims
- owned media removes one rights bottleneck
- personal-use status remains separate and must be confirmed
- Strategist/Writer/Guardian/human approval remain unchanged

## Scenario 6 — high score, blocked evidence

### Situation

A candidate has opportunity score 94 due to rapid interest and strong purchase questions, but exact identity is unresolved.

### UI

Card shows:

- 94 opportunity
- evidence readiness: weak/partial
- CTA: `근거 확인`
- no `전략 4개 만들기`

This proves ranking cannot bypass evidence gates.

## Scenario 7 — stale price before publishing

### Situation

Draft mentions a current price, but price evidence expires before the scheduled slot.

### Preflight

- mark price evidence stale
- refresh only through an approved source when available
- if material claim changes, invalidate approval
- request re-approval or remove price claim

Never publish a stale volatile fact as current.

## Scenario 8 — no good candidate today

### Situation

Sources are noisy, repetitive, rumor-heavy, or lack verifiable product evidence.

### Correct output

`오늘 추천할 만한 후보가 충분하지 않습니다.`

The system does not lower standards or invent three posts to satisfy a quota.

## Scenario 9 — issue loses relevance

### Situation

An event-linked candidate was strong in the morning, but the issue is outdated or disputed by evening.

### Correct behavior

- issue freshness becomes stale or conflict state
- issue-linked draft becomes stale
- candidate may be reframed as evergreen only if product reader value still stands independently
- otherwise hold/reject

## Scenario 10 — analytics recommends an unsafe pattern

### Situation

Issue-triggered provocative posts get more views than useful product posts.

### Correct behavior

Analytics records attention performance but does not recommend rumor, privacy invasion, deceptive endorsement, or unsafe media reuse.

Learning can recommend safe structural traits such as concise demonstration, not the unsafe subject matter.

## Scenario acceptance

The design is considered coherent only if every scenario can be explained using existing states, artifacts, owners, and gates without inventing a seventh agent or an undocumented bypass.
