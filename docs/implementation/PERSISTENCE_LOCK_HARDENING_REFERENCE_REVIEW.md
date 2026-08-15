# Persistence Lock Hardening — Reference-first Review

Status: implementation record for the local persistence hardening slice.

Baseline: `644d3d202f35b4f50d4ac0654d12918231e182ae`.

## References reviewed

| Reference | Adopt | Do not adopt / boundary | Impact on plan |
|---|---|---|---|
| Node.js v20 `fs` documentation | exclusive-create semantics (`open(..., 'wx')`), file-handle sync/close, atomic replacement pattern remains file-local | do not claim `O_EXCL` is a distributed/network-filesystem lock | confirms local-host lock-file option A |
| SQLite transaction documentation | use as comparison baseline: multiple readers, one writer, explicit transaction/rollback semantics | do not add SQLite merely to imitate transactions in a bounded local slice | keeps SQLite as next escalation when persistence/query/migration needs grow |
| SQLite WAL documentation | use its concurrency and same-host caveats to define future SQLite decision criteria | do not choose WAL without version/runtime review; WAL is not a multi-host solution | reinforces explicit same-host boundary |
| PostgreSQL concurrency/locking documentation | use as production-direction reference for real transactional/multi-session state | do not introduce managed DB/credentials/pooling in this no-live slice | PostgreSQL remains production-class migration, not this slice |
| ThreadScout C-slice `AtomicJsonApplicationStore` | preserve temp-write + rename, current state schema, command idempotency and candidate CAS | do not preserve the in-process `writeChain` as the only concurrency guard | add an outer cross-process critical section without rewriting domain behavior |

Primary source URLs reviewed:

- https://nodejs.org/docs/latest-v20.x/api/fs.html
- https://www.sqlite.org/lang_transaction.html
- https://sqlite.org/wal.html
- https://www.postgresql.org/docs/current/mvcc.html

## Key technical conclusions

1. Node's exclusive `x` open flag is suitable for creating a lock file only when it does not already exist on a local filesystem. Node explicitly warns that exclusive behavior may not work reliably on network filesystems, so this slice must not claim network/multi-host safety.
2. The lock must protect the entire read → expected-revision/idempotency check → mutation → atomic persist section. Locking only the final rename would still allow two writers to derive changes from the same old snapshot.
3. Release must be ownership-aware. A process that outlives a stale-lock cleanup must not later unlink a newer writer's lock.
4. Lock waiting must be bounded and fail closed. A blocked writer should return a storage error rather than bypass synchronization.
5. Stale-lock cleanup is acceptable only with a conservative age threshold because current application commands are short and contain no provider/network calls. If long-running work enters the critical section, this design must be retired.
6. SQLite/PostgreSQL provide stronger transaction semantics and are the correct escalation when this state becomes production, query-heavy, migration-heavy, multi-host, or background-worker-owned.

## License / reuse

No third-party code is copied. The implementation uses Node standard-library APIs and project-owned code. External documentation is used only for behavior/reference decisions.

## Decision

Proceed with Option A: a dependency-free local interprocess lock wrapper around the existing atomic JSON application store, with explicit same-host/local-filesystem scope, timeout, conservative stale recovery, ownership token and concurrency tests.
