# Pre-Implementation Trap Check

No live provider, research, affiliate, or publishing integration begins until its blocking items are resolved.

## Product and agent controls

- [x] Fix six agents and prohibit a price agent.
- [x] Require four strategy angles and four drafts.
- [x] Require Guardian pass and explicit human approval.
- [x] Prevent first-hand language without a usage record.
- [x] Keep publishing outside agent allowlists.
- [ ] Add duplicate and near-duplicate indexes across runs.
- [ ] Recheck volatile commerce evidence immediately before a real post.

## Runtime, tools, and persistence

- [x] Add replay provider, budgets, receipts, and schema validation.
- [x] Enforce tool allowlists and block external actions.
- [x] Add version hashes, content-addressed objects, stale detection, and event chains.
- [ ] Add provider token/cost and cancellation semantics.
- [ ] Add handler input/output schemas and mutability classes.
- [ ] Add partial-line recovery, retention, redaction classes, export, deletion, and garbage collection.
- [ ] Add SQLite or transactional locking before multi-process workers.
- [ ] Prevent stale approved/queued artifacts from any future publishing command.

## Phase 2E research boundary

- [x] Disable network and mutation for fixture research.
- [x] Restrict source scheme and type.
- [x] Sanitize excerpts and prohibit raw payload/personal-data storage.
- [x] Require observed/retrieved timestamps, policy, rights, retention, and hashes.
- [x] Use broker allowlists so only Scout/Verifier research.
- [x] Require cross-source candidate evidence.
- [x] Persist sources and index evidence dependencies.
- [ ] Review official access method for each live source.
- [ ] Record source-specific terms, robots, rate limits, auth scope, and revocation.
- [ ] Define robust personal-data detection and redaction tests.
- [ ] Define quote/excerpt and media-rights limits per source.
- [ ] Detect reposts and source dependence before counting independent evidence.
- [ ] Add pagination, transient error, stale cache, and deleted-source behavior.
- [ ] Add source-specific recency thresholds.
- [ ] Add a human-readable citation view from claim to source.

## Publishing safety

- [ ] Verify current official Threads publishing permissions and capabilities.
- [ ] Define idempotency and remote reconciliation.
- [ ] Add global kill switch.
- [ ] Never retry unknown remote publish state blindly.
