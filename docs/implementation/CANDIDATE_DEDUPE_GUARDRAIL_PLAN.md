# Candidate Dedupe Guardrail — Implementation Plan

Status: implementation slice authorized by owner continuation on 2026-08-16.

Baseline: `97fc8c7b340728dcc13756366f86fba3a4b099ce`.

## Intent / primary user / JTBD

- User intent: continue ThreadScout implementation without enabling live sources or publishing.
- Primary user: the single ThreadScout owner reviewing a maximum-five Opportunity Inbox.
- Job to be done: prevent the same product from being repeatedly re-added and make likely duplicate candidates explicitly reviewable before they consume content-generation effort.

This slice addresses the product-quality blind spot in `BS-58` and the existing unchecked trap `Add duplicate and near-duplicate indexes across runs`.

## Four implementation shapes

| Option | Shape | Decision | Reason |
|---|---|---|---|
| A | deterministic normalized identity key + conservative token/name similarity + explicit human resolution for possible duplicates | **SELECTED** | dependency-free, explainable, reversible, safe for current <=50 candidate local state, and does not let fuzzy text silently manufacture exact-product identity |
| B | character trigram similarity for every candidate | defer | useful for typo/sub-string matching, but threshold tuning can over-collapse distinct variants and is unnecessary at current scale |
| C | embedding/LLM semantic dedupe | reject for this slice | adds provider cost/non-determinism and can incorrectly merge semantically related but commercially different products |
| D | PostgreSQL `pg_trgm`/database fuzzy index | defer | appropriate when the production transactional store exists and candidate volume/query needs justify indexed similarity, but too wide for the current no-live local slice |

## Selected behavior

### Exact duplicate

A newly submitted manual candidate is automatically suppressed only when an existing non-synthetic active candidate has the same normalized **brand + model + variant**, with all three dimensions present.

- same source URL alone is never enough
- same display name alone is never enough
- different known brand/model/variant values are treated as contradictions, not duplicates
- rejected or already-suppressed duplicate records are not canonical duplicate targets

The server does not create a second candidate. It returns `candidate_duplicate_suppressed`, points to the existing candidate, records an application audit event, and keeps request-id idempotency.

### Possible duplicate

A candidate may be marked `possible_duplicate` only when:

- there is no explicit brand/model/variant contradiction, and
- normalized product names are equal after punctuation/spacing normalization, or token overlap is conservatively high.

Possible duplicates are **not silently merged or treated as exact**. The candidate is created in `duplicate_review`, shows the matched candidate and reasons, and content progression is blocked until the owner resolves it.

The owner can resolve:

- `distinct`: keep the candidate and continue to normal verification
- `duplicate`: mark it `suppressed_duplicate`; it remains auditable server state but is excluded from the primary Opportunity Inbox

## In scope

- deterministic Unicode-aware normalization and token similarity module
- exact duplicate suppression at manual-candidate ingestion
- possible-duplicate assessment against persisted non-synthetic candidate history
- explicit `resolve_duplicate` server command with expected-revision CAS
- read-model duplicate metadata and counters
- mobile workspace review controls for possible duplicates
- automatic exclusion of confirmed duplicate records from the top-five primary inbox
- tests for exact suppression, punctuation/spacing normalization, variant/model conflicts, possible duplicate resolution, persistence/reload, idempotency, stale CAS, and no live-capability widening
- status/trap/acceptance documentation

## Out of scope

- no live Scout discovery dedupe yet
- no cross-account/global product graph
- no embeddings/model-provider calls
- no PostgreSQL/SQLite migration
- no source URL canonicalization/network redirects
- no product UPC/EAN/GTIN catalog matching
- no user category suppression implementation (AT-14 remains separate)
- no Threads/NAVER/Coupang activation, publishing, scheduling, media reuse, or analytics learning

## Success conditions

1. Same normalized brand+model+variant submitted twice creates one candidate only and returns an explainable suppressed-duplicate result.
2. Duplicate suppression does not rely on seller/source URL because a URL can mutate to another product.
3. Same/similar name with missing identity becomes `possible_duplicate`, not `exact` or auto-suppressed.
4. Known different model or variant is not auto-flagged as the same product merely because the display name is similar.
5. Possible duplicate cannot generate strategy/drafts until owner resolves it.
6. `distinct` returns the candidate to its normal verification state; `duplicate` removes it from the top-five inbox while preserving audit/state.
7. `resolve_duplicate` requires current candidate revision and stale decisions fail with existing HTTP 409 CAS behavior.
8. Duplicate behavior survives server reload because it is encoded in server-owned candidate state/history.
9. Existing six-agent, Guardian, human approval, persistence-lock, Spike 0 and C-slice regressions remain green.
10. All live capabilities remain disabled; no credentials/dependencies/workflow changes are introduced.

## Stop / rollback conditions

Stop and redesign rather than tuning fuzzy thresholds if:

- a known different model/variant is auto-suppressed
- a possible duplicate can bypass the review gate into strategy generation
- exact-product truth begins depending on fuzzy similarity
- candidate volume makes O(n) local comparison materially slow
- production candidate history exceeds the bounded local-state model

Rollback is local: remove the dedupe module/metadata and command path. Existing product/evidence/draft schemas remain otherwise unchanged.

## Acceptance / blind-spot mapping

- `BS-58`: repetitive content/product candidates are guarded before content generation.
- `AT-28`: repetitive candidates may reduce useful recommendations rather than fill slots.
- `AT-29`: portfolio/inclusion reasoning can expose duplicate suppression/review as a reason; opportunity score alone cannot override it.
- `BS-16`: same seller URL is explicitly not an exact-duplicate key.
- `AT-25`: a high score cannot bypass the duplicate-review/evidence gate.
- `AT-36` / `AT-38`: duplicate-resolution commands use the existing expected-revision CAS and do not weaken downstream approval binding.

## Allowed change surface

Preferred files:

- `apps/web/candidate-dedupe.mjs` (new)
- `apps/web/application-state.mjs`
- `apps/web/app.js`
- `apps/web/index.html`
- `apps/web/styles.css` only if required for the compact review control
- `tests/candidate-dedupe.test.mjs` (new)
- existing smoke tests only where UI contract changes require it
- implementation/status/trap documentation

Do not change workflow files, dependencies, credentials, live-source registry, fixed six-agent roster, provider configuration, publication adapters, or scheduling behavior.
