# Local Persistence Lock Hardening — Implementation Plan

Status: implementation slice authorized by owner continuation on 2026-08-15.

Baseline: `644d3d202f35b4f50d4ac0654d12918231e182ae` (merged Manual-product C vertical slice).

## User intent / primary user / JTBD

- User intent: continue ThreadScout implementation automatically without jumping to live posting.
- Primary user: the single ThreadScout owner reviewing manual-product candidates on mobile/desktop.
- Job to be done: preserve server-authoritative C-slice decisions when more than one local server/process can submit commands against the same state file, without adding live integrations or a production database prematurely.

## Why this slice is next

The C slice intentionally uses atomic JSON plus an in-process promise chain. That prevents concurrent writes inside one server instance, but two Node processes can still read the same old snapshot and overwrite each other. `docs/PRE_IMPLEMENTATION_TRAPS.md` explicitly requires SQLite or another transactional/locking strategy before multi-process/background work.

## Four implementation shapes

| Option | Shape | Decision | Reason |
|---|---|---|---|
| A | keep atomic JSON, add exclusive cross-process write lock + bounded stale-lock recovery | **SELECTED** | smallest reversible change; no dependency; directly closes local lost-update risk while preserving current C-slice model |
| B | migrate application state to SQLite transactions | defer | stronger database semantics, but Node 20 has no stable built-in SQLite API in this project baseline and a new native/runtime dependency would widen this slice |
| C | move now to managed PostgreSQL | defer | matches later production architecture class but introduces deployment, credentials, migrations, pooling and operational surface before background/live work exists |
| D | create a dedicated single-writer state daemon and IPC queue | reject for now | serializes writes but adds a new service/protocol and failure mode while retaining file-state limitations |

## In scope

- exclusive local-filesystem write lock around the full read → validate/CAS → apply → persist command critical section
- bounded retry and fail-closed lock timeout
- stale abandoned-lock recovery with conservative age threshold
- owner-token check so an old holder cannot delete a successor lock during release
- keep atomic temp-write + rename persistence under the lock
- surface the hardened local persistence capability in server read/command responses
- tests using independent store instances against one state path
- regression proof that the existing manual-product flow and live-disabled boundaries remain unchanged

## Out of scope

- no live Threads/NAVER/Coupang network execution
- no public posting, scheduling, reconciliation, kill switch or analytics learning
- no SQLite/PostgreSQL migration
- no network filesystem or multi-host guarantee
- no auth/multi-user work
- no media upload/republish work
- no new agent/provider/framework

## Success conditions

1. Two independent application-store instances concurrently adding different candidates preserve both updates.
2. Two independent store instances concurrently using the same request ID apply the logical command once and replay idempotently.
3. A fresh lock held by another writer causes a bounded `storage_lock_timeout` failure; the state file remains valid and unchanged by the failed command.
4. An abandoned lock older than the configured stale threshold can be recovered and the command succeeds.
5. Existing candidate revision/CAS behavior, stale approval behavior, Orchestrator receipts and 4-strategy/4-draft/Guardian flow remain green.
6. All live capabilities remain disabled and no credential/dependency/workflow change is introduced.
7. Full `npm run verify`, PR CI and post-merge main CI pass before completion is claimed.

## Stop / rollback conditions

Stop this approach and escalate to SQLite/PostgreSQL instead of adding lock complexity if any of these become true:

- state must be shared across hosts or a network filesystem
- command critical sections become long-running/background-provider work
- recovery requires deleting a lock whose ownership/age cannot be established conservatively
- tests expose an unclosed lost-update or lock-release race
- production durability, queryability, migrations or audit retention become part of the same slice

Rollback is file-local: restore the server to `AtomicJsonApplicationStore`; the JSON state schema is unchanged by this slice.

## Applicable traps / blind spots

- Runtime/persistence: harden atomic JSON before multi-process workers.
- Human approval: preserve server CAS and exact material-revision binding.
- BS-37 / cross-device approval: no last-write-wins behavior.
- BS-51 / secrets: storage diagnostics contain no credentials.
- Browser/PWA: browser remains a renderer/command client and never owns durable state.

## Allowed change surface

Preferred files:

- `apps/web/locked-application-store.mjs` (new)
- `apps/web/server.mjs`
- persistence/C-slice tests under `tests/`
- `docs/IMPLEMENTATION_STATUS.md`
- `docs/PRE_IMPLEMENTATION_TRAPS.md`
- `docs/implementation/*` records for this slice

Do not change live-source registries, workflow files, agent count, prompts, provider configuration, affiliate/publication adapters or credentials.
