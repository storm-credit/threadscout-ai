# Pre-Implementation Trap Check

No live provider, research, affiliate, or publishing integration begins until its blocking items are resolved.

## Product identity and content

- [x] Distinguish exact, likely, substitute, and unresolved products.
- [x] Prevent first-hand language without usage confirmation.
- [x] Keep price/stock/seller/variant in one Verifier snapshot.
- [ ] Persist claim-level source IDs through every rewrite.
- [ ] Invalidate every downstream artifact and queue record when evidence changes.
- [ ] Recheck volatile commerce evidence immediately before a real post.
- [ ] Add duplicate and near-duplicate indexing across runs.

## Fixed orchestra

- [x] Fix six agents including Orchestrator.
- [x] Prohibit a dedicated price agent.
- [x] Require specialists to return to Orchestrator.
- [x] Require four angles and four drafts.
- [x] Require Guardian pass and human approval.
- [x] Bound Scout/Writer loops and total invocations.
- [x] Keep publishing outside every agent allowlist.

## Provider-neutral runtime and tools

- [x] Add deterministic replay provider.
- [x] Add six per-agent budget records and total run budgets.
- [x] Validate schemas and semantic contracts before progression.
- [x] Produce invocation receipts.
- [x] Reject non-allowlisted, publication, purchase, and payment tools.
- [ ] Add provider token/cost budgets and cancellation semantics.
- [ ] Redact sensitive provider errors before persistence.
- [ ] Add input/output schemas and mutability classes per tool.
- [ ] Review handler implementation, domains, endpoints, robots, terms, and rate limits.

## Phase 2D versioning and storage

- [x] Canonically hash roster, prompts, schemas, evidence, and artifacts.
- [x] Add artifact integrity metadata and dependency hashes.
- [x] Detect stale artifacts after evidence changes.
- [x] Store sources and artifacts by content hash.
- [x] Add per-run append-only hash-chained events.
- [x] Serialize concurrent writes per run inside one process.
- [x] Detect payload and event tampering.
- [ ] Recover or quarantine a partially written final JSONL line.
- [ ] Add retention, deletion, export, and content-addressed garbage collection.
- [ ] Add encryption/redaction classification for stored objects.
- [ ] Add claim-to-source and dependency indexes.
- [ ] Add cross-process transactional locking or migrate to SQLite.
- [ ] Version the canonicalization algorithm explicitly before format changes.
- [ ] Prevent stale approved/queued artifacts from publication.

## Publishing safety

- [ ] Verify official Threads permissions and current capabilities.
- [ ] Define idempotency and remote-state reconciliation.
- [ ] Separate scheduled, publishing, published, failed, cancelled, and unknown states.
- [ ] Add global kill switch.
- [ ] Never retry an unknown remote publish blindly.
