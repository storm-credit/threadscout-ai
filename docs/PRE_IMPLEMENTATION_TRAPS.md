# Pre-Implementation Trap Check

No live provider, research, affiliate, or publishing integration begins until its blocking items are resolved.

This checklist is implementation-facing. Broader product assumptions are reviewed separately in `docs/spec/FINAL_BLIND_SPOT_SWEEP.md`.

## Harness entry gate

- [x] Master Design v1 is approved and canonical.
- [x] Harness Design v1 defines one contract-first execution model.
- [x] Existing prototype assets are classified `KEEP / MODIFY / RETIRE / MISSING`.
- [x] Canonical fixture families and AT ownership are documented.
- [x] First Coding Spike has explicit in-scope/out-of-scope behavior, success conditions, stop conditions, and preferred change surface.
- [x] At actual coding start, record the exact current `main` SHA as the baseline — `691aad24cd307c7094ed1531f06e5b1d2976b088`.
- [x] At actual coding start, select the exact fixture IDs and AT IDs in the implementation PR/plan — F01/F02/F04/F11/F12/F13/F15/F20/F21 and the Spike 0 AT set.
- [x] Re-read affected prototype modules before editing; do not trust the gap table as a substitute for code inspection.
- [x] Perform the Reference-first Gate for unresolved technical mechanisms — recorded in `docs/implementation/SPIKE0_REFERENCE_REVIEW.md`.
- [x] Recheck the four implementation-shape options — repository evidence confirmed the selected contract-first adapter approach.
- [x] Keep live Threads/Coupang/media/publication capabilities disabled during Spike 0.
- [x] Do not widen Spike 0 into UI/live/provider/analytics work merely because adjacent prototype code exists.
- [ ] Completion requires final-head scenario reports, blocked/stale proof, full verify, diff review, traps/B0 review, Actions, merge, and post-merge `main` verification—not unit-test green alone.

## Product and agent controls

- [x] Fix six agents and prohibit a price agent.
- [x] Require four strategy angles and four drafts.
- [x] Require Guardian pass and explicit human approval.
- [x] Prevent first-hand language without a usage record.
- [x] Keep publishing outside agent allowlists.
- [ ] Add duplicate and near-duplicate indexes across runs.
- [ ] Recheck volatile commerce evidence immediately before a real post.

## Mobile-first web / cross-device

- [x] Select mobile-first responsive web as v1 platform; desktop remains supported and PWA is optional.
- [x] Require server-authoritative state rather than browser/local-only authority.
- [ ] Test 360 px narrow width with touch-only navigation.
- [ ] Confirm no blocker, evidence state, or primary action depends on hover.
- [ ] Verify browser reload/tab suspension does not lose a server-accepted decision.
- [ ] Reject stale approval when another device has changed draft/evidence/media/affiliate mapping.
- [ ] Define optimistic/version conflict behavior for simultaneous mobile/desktop edits.
- [ ] Validate mobile camera/file upload behavior on supported browsers.
- [ ] Define maximum upload size, resumability, compression, failure recovery, and unsupported-format handling.
- [ ] Ensure background scheduling/publication never depends on an open tab, service worker, or PWA lifecycle.
- [ ] Verify PWA absence/deactivation does not change correctness.
- [ ] Define deep-link/session-expiry recovery back to the same run/review state.

## Runtime, tools, and persistence

- [x] Add replay provider, budgets, receipts, and schema validation.
- [x] Enforce tool allowlists and block external actions.
- [x] Add version hashes, content-addressed objects, stale detection, and event chains.
- [x] Prove domain-level material revision binding and stale compare-and-set rejection in Spike 0 fixtures F11/F21; persistent application/server binding remains a later slice.
- [ ] Add provider token/cost and cancellation semantics.
- [ ] Add handler input/output schemas and mutability classes.
- [ ] Add partial-line recovery, retention, redaction classes, export, deletion, and garbage collection.
- [ ] Add SQLite or transactional locking before multi-process workers.
- [ ] Prevent stale approved/queued artifacts from any future publishing command.
- [ ] Add persistent compare-and-set/version checks around application user decisions and state transitions.
- [ ] Verify audit storage remains complete when a worker crashes between external action and event persistence.

## Research boundary

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
- [ ] Preserve original publication/event time separately from retrieval time where available.

## Media

- [x] Separate discovery/analysis media from final-use publication rights in design.
- [ ] Define action-specific rights for view/link/embed/download/transform/publish per source class.
- [ ] Verify media depicts the same variant represented by copy and affiliate mapping.
- [ ] Prevent transformed media from inheriting rights automatically from the source asset.
- [ ] Provide user-owned/licensed/text-only fallback before lowering rights standards.
- [ ] Prevent any generated image from implying a real public figure used or endorsed a product.

## Public-figure / issue content

- [x] Block rumor/private-life lane in design.
- [x] Separate public use/appearance from endorsement/sponsorship claims.
- [ ] Verify source time to prevent old public-figure content from being presented as current.
- [ ] Propagate relation grade and prohibited implications into Writer and Guardian inputs.
- [ ] Add a stop rule when product value depends only on fame and no independent reader value remains.

## Human approval

- [x] Bind approval conceptually to draft/evidence/media/affiliate revisions.
- [x] Prove exact domain-revision binding and stale rejection in the deterministic Spike 0 harness.
- [ ] Implement durable application/server hash-version binding before any live scheduling.
- [ ] Surface material changes since last review before asking for reapproval.
- [ ] Prevent warning overload by distinguishing blocker, required action, warning, and informational state.
- [ ] Ensure approval cannot be triggered by accidental double tap or repeated browser submission.

## Publishing safety

- [ ] Verify current official Threads publishing permissions and capabilities.
- [ ] Define idempotency and remote reconciliation.
- [ ] Add global kill switch reachable independently of AI runtime.
- [ ] Never retry unknown remote publish state blindly.
- [ ] Preflight authorization/token state immediately before dispatch.
- [ ] Preflight issue freshness, exact-product mapping, destination integrity, media rights, disclosure, and volatile commerce facts.
- [ ] Store explicit timezone and server-normalized schedule time.

## Analytics / learning

- [x] Separate attention, intent, commercial, and trust metric classes in design.
- [ ] Mark unavailable/partial attribution explicitly rather than inferring causality.
- [ ] Enforce minimum sample/confidence before ranking-weight changes.
- [ ] Exclude misleading, blocked, rumor-based, hidden-disclosure, or policy-violating high-performance patterns from learning.
- [ ] Preserve rejection reason codes instead of treating every user rejection as a negative product signal.

## Scope / economics

- [x] Keep MVP one-owner/one-account and exclude multi-tenant SaaS/billing.
- [x] Treat zero posts as a valid day.
- [ ] Measure manual review time, model/source cost, and attributable commercial value before increasing automation or agent budgets.
