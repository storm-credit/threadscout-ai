# Evidence and Event Storage — Four Options

| Option | Design | Benefit | Largest risk | Decision |
|---|---|---|---|---|
| A. In-memory only | Keep runs and evidence inside one process | minimal code | no restart recovery or audit trail | reject |
| B. Content-addressed objects + per-run JSONL event chain | Immutable objects by SHA-256 and append-only local events | dependency-free, inspectable, reproducible | multi-process locking is limited | **select for Phase 2D** |
| C. SQLite event/evidence store | Transactions, indexes, local durability | stronger concurrency and querying | migration and dependency work before live data exists | next migration candidate |
| D. Managed PostgreSQL/object storage | production durability and multi-user scale | strongest operational base | credentials, cost, privacy, and premature infrastructure | defer |

## Selected design

Phase 2D selects option B. Sources and versioned artifacts are stored by content hash. Every run has an append-only JSONL event stream whose events form a previous-hash chain.

This is not presented as a production database. It establishes the data contracts required before SQLite or a managed database can be selected.

## Object classes

- `sources`: sanitized source observations
- `artifacts`: versioned agent outputs
- future `receipts`: sanitized provider/tool receipts
- future `snapshots`: derived immutable run snapshots

## Version metadata

Every stored agent artifact includes:

- fixed format version
- agent ID
- roster/runtime manifest hash
- prompt hash
- output-schema hash
- parent artifact hashes
- evidence hash when evidence exists
- artifact integrity hash

## Event-chain fields

Every event includes:

- run ID and sequence
- event type and timestamp
- previous event hash
- payload hash
- event hash

A changed payload, reordered sequence, or broken previous hash causes chain validation to fail.

## Concurrency boundary

Phase 2D serializes writes per run inside one Node.js process. This prevents ordinary concurrent append collisions in tests and local execution. It does not claim safe coordination across several processes or machines. SQLite or another transactional store is required before multi-process workers.

## Migration rule

The content hashes, event fields, artifact metadata, and store interface must remain portable. A future backend may change storage technology without changing the six agents or weakening evidence invalidation and approval gates.
