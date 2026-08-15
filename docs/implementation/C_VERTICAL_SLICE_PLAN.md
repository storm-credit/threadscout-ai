# Manual Product C Vertical Slice — Implementation Plan

Status: **IMPLEMENTATION ENTRY — bounded local/manual slice; live capabilities remain off.**

Baseline: `c444a3e29834cfdef42d17537c8400e9f6960086`

## Context / intent

ThreadScout already has an approved Master Design, Harness Design, and a verified no-network Master Harness Contract Spine. The next product slice is the first real application boundary for the single owner: enter a product manually, see it in a mobile Opportunity Inbox, move it through evidence → four strategies → four drafts → Guardian → human approve/hold/reject, and preserve decisions on the server rather than in browser local storage.

Primary user: the single ThreadScout owner operating mostly from a mobile browser, with desktop used for evidence-heavy review.

Job to be done: make one product decision end to end without hidden automation or live provider dependencies.

## Success conditions

- first screen is the Opportunity Inbox and works at the 360 px structural breakpoint
- candidate card shows name, why-now, opportunity score, evidence readiness, risk, exact-match state, top blocker, and one safe primary CTA
- high score never unlocks a blocked action
- client sends commands/intents; it cannot directly set verified/approved state
- state and decisions are server-authoritative and survive browser reload
- commands carry request IDs for idempotency and expected revisions for compare-and-set conflict rejection
- manual product path keeps the fixed six-agent authority model: owner input skips Scout only by the approved exception; Verifier/Strategist/Writer/Guardian authority remains explicit
- strategy stage produces exactly four angles and Writer produces exactly four mapped drafts
- Guardian pass is required before human approval
- approval binds the exact material revision and becomes stale after a material evidence/draft change
- stale mobile/desktop decisions are rejected with refresh guidance
- hold and reject work without publishing
- external Threads/Coupang/media publication remains disabled
- full existing `npm run verify` remains green and the slice adds application/API tests

## Non-goals

No live Threads discovery/insights/publishing, live Coupang Partners action, automatic product search, third-party media download/transform/republish, scheduling network action, analytics learning, multi-user/auth, PWA/service worker, new agent, framework migration, or dependency addition.

## Stop conditions

Stop rather than widen scope if the slice requires a seventh agent, live credentials/network truth, a database/framework migration, public publication, or changes to approved Master Design invariants.

## Four implementation-shape options

| Option | Shape | Strength | Risk | Decision |
|---|---|---|---|---|
| A | keep current localStorage prototype and add more screens | smallest diff | browser remains authoritative; fails AT-35/36/38 | reject |
| B | keep the no-framework mobile web, add a small server command/read API and atomic JSON state under `.threadscout-data/` | minimal dependencies; server authority; reload/cross-client CAS can be proven | single-process local durability only | **select** |
| C | introduce SQLite + application framework now | stronger transaction model | widens slice, dependencies, migration, more code than needed | defer until multi-process/deployment slice |
| D | render Master Harness reports directly as the product UI | reuses harness | diagnostic truth source becomes UX/state authority; poor command model | reject |

Selected Option B deliberately proves the application contract with the current Node-only stack. Atomic JSON is a bounded local/single-process implementation, not the production multi-worker persistence decision.

## KEEP / MODIFY / RETIRE / MISSING refresh

| Area | Disposition | Slice treatment |
|---|---|---|
| fixed six-agent roster and Master Harness invariants | KEEP | no roster/authority change |
| existing no-framework web shell | MODIFY | Opportunity Inbox + staged workspace + mobile bottom nav |
| current localStorage state | RETIRE as authority | browser keeps only ephemeral UI state/request IDs; server owns durable candidate/review state |
| static-only `server.mjs` | MODIFY | add bounded JSON API + atomic local state persistence while retaining safe static-path handling |
| `packages/orchestra` contract/version primitives | KEEP + reuse | use agent IDs/version hashing/authority conventions; do not create a parallel factual authority |
| manual-product application state/service | MISSING | implement server-side candidate revisions, stage commands, Guardian/human binding, idempotency, CAS |
| UI/API acceptance tests | MISSING | add HTTP flow, stale conflict, reload persistence, CTA/read-model, structural 360px tests |
| live source/publisher packages | KEEP DISABLED | untouched |

## Acceptance / B0 focus

Primary acceptance: `AT-01, AT-09, AT-15, AT-22, AT-25, AT-32, AT-34, AT-35, AT-36, AT-38, AT-42` plus regression reuse of Spike 0 `AT-04, AT-06, AT-07, AT-08, AT-17, AT-20`.

Highest-severity blind spots directly in scope:

- `BS-01` reader value cannot be replaced by novelty/score
- `BS-06` browser/PWA cannot own durable/background correctness
- `BS-31` repeated agent agreement cannot manufacture fact
- `BS-32` Guardian cannot become rubber stamp
- `BS-36` approval UI must prioritize blockers/material changes over noise
- `BS-37` approval must bind the exact revision and stale decisions must fail
- `BS-51` no secret values in client/server state or logs

## Command model

Read: `GET /api/today`.

Write: `POST /api/commands` with `{ requestId, command, candidateId?, expectedRevision?, payload? }`.

Initial commands:

- `reset_demo`
- `add_manual_candidate`
- `request_verification`
- `request_strategies`
- `request_drafts`
- `run_guardian`
- `edit_draft`
- `review_decision`

Duplicate `requestId` returns the prior logical result. Existing-candidate mutations require `expectedRevision`; mismatch returns HTTP 409 with the current read model.

## Completion proof

Before merge: API flow tests must exercise normal, blocked, stale/CAS, duplicate-request, and reload/persistence paths; UI static/semantic tests must verify the first-screen required fields/actions and 360px/touch rules; full regression suite and GitHub Actions must pass; diff must show no live activation/dependency/agent drift; any mismatch must be recorded in the decision/status docs.