# Pre-Implementation Trap Check

No live provider, research, affiliate, or publishing integration begins until its blocking items are resolved.

## Product identity and content

- [x] Distinguish exact, likely, substitute, and unresolved products.
- [x] Prevent first-hand language without usage confirmation.
- [x] Require visible affiliate disclosure in fixture drafts.
- [x] Keep price/stock/seller/variant in one Verifier snapshot.
- [ ] Persist claim-level source IDs through every rewrite.
- [ ] Invalidate drafts when evidence changes.
- [ ] Recheck volatile commerce evidence immediately before a real post.
- [ ] Add duplicate and near-duplicate indexing across runs.

## Fixed orchestra

- [x] Fix six agents including Orchestrator.
- [x] Prohibit a dedicated price agent.
- [x] Require specialists to return to Orchestrator.
- [x] Require four angles and four drafts.
- [x] Require Guardian pass and human approval.
- [x] Add bounded Scout/Writer loops and invocation ceiling.
- [x] Keep publishing outside every agent allowlist.

## Provider-neutral runtime

- [x] Choose provider-neutral adapter over direct provider coupling.
- [x] Add deterministic replay provider.
- [x] Add six per-agent budget records.
- [x] Add timeout, attempts, input, and output limits.
- [x] Add total invocation, elapsed-time, and output limits.
- [x] Validate schema and semantic contract before state progression.
- [x] Produce invocation receipts.
- [x] Test malformed and oversized outputs.
- [ ] Add stable prompt, schema, and artifact version hashes.
- [ ] Define live-provider cancellation and unknown-result semantics.
- [ ] Map character budgets to provider token/cost budgets.
- [ ] Redact sensitive provider errors before persistence.
- [ ] Add provider-specific structured-output compatibility tests.
- [ ] Decide whether the project baseline moves from Node 20 to Node 22 before a live SDK.

## Tool broker

- [x] Enforce registry tool allowlists.
- [x] Reject publication, purchase, and payment tool names.
- [x] Require an explicitly registered handler.
- [ ] Review each handler implementation, not only its name.
- [ ] Add input/output schemas per tool.
- [ ] Add read-only versus mutating tool classes.
- [ ] Add domain and endpoint allowlists for future network tools.
- [ ] Add robots/terms/rate-limit checks for public research sources.

## Persistence and concurrency

- [ ] Add immutable event/evidence storage.
- [ ] Add atomic run-state updates and concurrent-run locking.
- [ ] Separate raw sources, sanitized evidence, prompts, artifacts, and receipts.
- [ ] Define retention and deletion.
- [ ] Prevent one run's artifacts from entering another run.

## Publishing safety

- [ ] Verify official Threads permissions and current capabilities.
- [ ] Define idempotency and reconciliation.
- [ ] Separate scheduled, publishing, published, failed, cancelled, and unknown states.
- [ ] Add global kill switch.
- [ ] Never retry an unknown remote publish blindly.
