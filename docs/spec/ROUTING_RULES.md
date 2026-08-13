# Orchestrator Routing Rules v1

Status: DESIGN ONLY.

## Route A — open discovery

Use Scout when the user asks `무엇을 올릴까?`, when a daily opportunity run starts, or when new product opportunities are needed.

`Orchestrator → Scout → Verifier → Strategist → Writer → Guardian → human review`

## Route B — user supplies an exact product/link

Skip open discovery. Do not skip verification.

`Orchestrator → Verifier → Strategist → Writer → Guardian → human review`

## Route C — user supplies photo/video reference

Treat the media as a reference, not proof of exact identity or final-use permission.

`Orchestrator → Verifier` may request additional source evidence before strategy.

## Route D — issue-trigger candidate

Scout may detect or receive public-event context, but Verifier separately resolves source grade, relation grade, exact product, freshness, and media state before strategy.

## Route E — evidence not sufficient

Return `needs_evidence` or `held`. Do not call Strategist merely to keep the pipeline moving.

## Route F — Guardian revise

Return a bounded, structured revision request to Writer. Maximum two Writer revision passes. A factual/evidence problem routes back to Verifier rather than asking Writer to rewrite around it.

## Route G — material evidence change

Invalidate dependent strategy/draft/review artifacts and return to the earliest affected stage.

## Route H — user rejects/suppresses

Stop the current candidate. Suppression updates future discovery state and overrides ranking until restored.

## Routing invariant

Skipping an unnecessary agent is allowed. Inventing a seventh agent or allowing specialists to delegate directly is not.
