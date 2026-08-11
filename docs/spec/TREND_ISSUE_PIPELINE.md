# Trend, Celebrity, Broadcast & Issue Pipeline v1

## 1. Purpose

Use public issues as product-discovery triggers without becoming a rumor/gossip engine.

## 2. Eligible issue classes

- public appearance or event
- broadcast/variety/drama segment
- official collaboration or advertising campaign
- public sports/cultural event
- widely reported product-related moment
- seasonal or cultural event with product demand

## 3. Blocked issue classes

- unverified dating/relationship rumors
- private-life speculation
- medical/health speculation about a person
- appearance/surgery speculation
- leaked/private media
- allegations that require adjudicating guilt
- content whose commercial value depends on humiliating or attacking a person

## 4. Detection logic

Scout looks for the intersection of:

- event/figure term rising
- product/object term co-occurrence
- “what is it / where to buy / link / price / brand” purchase-intent language
- repeated but independent references
- a visual or practical product story

A celebrity name alone is not a candidate.

## 5. Issue score

Suggested conceptual dimensions:

- public-event certainty: 0–20
- product linkage clarity: 0–25
- purchase intent: 0–20
- timing/recency: 0–15
- account fit: 0–10
- safe media/evidence readiness: 0–10

Automatic reject penalties:

- private/rumor basis
- defamatory framing
- exact product impossible to verify but copy requires certainty
- rights-dependent content with no safe media path

## 6. Relationship classification

Verifier must assign exactly one:

- `official_endorsement`
- `confirmed_use`
- `visible_unconfirmed_identity`
- `reported_association`
- `similar_only`
- `rumor_or_private`

### Copy implications

`official_endorsement`: may describe official collaboration only with first-party/strong evidence.

`confirmed_use`: may state that the item was publicly used/worn/held, but must not imply recommendation or payment.

`visible_unconfirmed_identity`: may discuss the visible style/category; no exact-product claim.

`reported_association`: wording must attribute the association to the reliable source/context.

`similar_only`: may present “비슷한 제품/대체 후보” only.

`rumor_or_private`: blocked from content generation.

## 7. Product relevance gate

Before Strategist runs, Orchestrator asks:

- Is there a useful product story independent of the person's fame?
- Would the post still help the reader if the celebrity name were removed?
- Is the product identity/evidence strong enough for the intended wording?

If not, reject or convert to non-product editorial content outside the affiliate MVP.

## 8. Timing

Issue-linked content has a shorter freshness window than evergreen products. The evidence packet must store issue start/peak/expiry estimates. Scheduled content past expiry requires re-review.

## 9. Examples of safe framing patterns

- “방송에서 보인 이 구조가 왜 화제인지 찾아봄” only when source confirms the public context.
- “사진 속 제품과 동일 제품은 확인되지 않아 비슷한 구조의 대체 후보만 정리” when exact match is unresolved.
- “공식 협업 제품” only when official partnership evidence exists.

## 10. Guardian blocks

- endorsement implied from mere use
- exact identity asserted from visual resemblance alone
- rumor/private issue used as a hook
- manipulated media or misleading crop
- source attribution removed where attribution is necessary
