# packages/database

Storage ports and adapters.

- `src/ports.mjs` — the required interface and the version-conflict error
- `src/memory-store.mjs` — in-memory adapter, the default for tests and a single local session
- `src/jsonl-store.mjs` — durable adapter: append-only operational snapshots, content-addressed artifacts, hash-chained run events, and recovery from a torn final line

Both adapters enforce compare-and-set on the record version and the same chain semantics, so behaviour proven against one is not silently different on the other.

Durable data lives under `.threadscout-data/`, outside Git. Replacing the JSONL adapter with the managed PostgreSQL of P0-04 is a change to one adapter, not to the orchestrator.
