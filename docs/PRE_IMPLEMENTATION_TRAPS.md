# Pre-Implementation Trap Check

No live provider, research, affiliate, or publishing integration begins until its blocking items are resolved.

This checklist is implementation-facing. Broader product assumptions are reviewed separately in `docs/spec/FINAL_BLIND_SPOT_SWEEP.md`.

## Harness entry gate

- [x] Master Design v1 is approved and canonical.
- [x] Harness Design v1 defines one contract-first execution model.
- [x] Existing prototype assets are classified `KEEP / MODIFY / RETIRE / MISSING`.
- [x] Canonical fixture families and AT ownership are documented.
- [x] First Coding Spike has explicit in-scope/out-of-scope behavior, success conditions, stop conditions, and preferred change surface.
- [x] Spike 0 recorded the exact starting main SHA, fixture IDs, and AT IDs.
- [x] Re-read affected prototype modules before editing; do not trust the gap table as a substitute for code inspection.
- [x] Perform the Reference-first Gate for unresolved technical mechanisms — Spike 0, C-slice, persistence-hardening, and candidate-dedupe records exist under `docs/implementation/`.
- [x] Recheck four materially different implementation shapes before a major implementation choice.
- [x] Keep live Threads/Coupang/media/publication capabilities disabled during pre-live slices.
- [x] Do not widen a bounded slice merely because adjacent prototype code exists.
- [x] Completion proof includes blocked/stale/bypass scenarios, full verify, diff/scope review, B0/trap review, PR merge, and post-merge main CI before a slice is reported complete.

## Product and agent controls

- [x] Fix six agents and prohibit a price agent.
- [x] Require four strategy angles and four drafts.
- [x] Require Guardian pass and explicit human approval.
- [x] Prevent first-hand language without a usage record.
- [x] Keep publishing outside agent allowlists.
- [x] C slice routes specialist commands through an explicit Orchestrator service; local deterministic specialist adapters return control to Orchestrator and do not pretend to be live model calls.
- [x] Add duplicate and near-duplicate guardrails across persisted **manual-candidate local history**: exact normalized brand+model+variant suppression, conservative possible-duplicate review, identity-change reassessment, CAS-bound human resolution, portfolio priority visibility, and auditable suppression.
- [ ] Extend dedupe to live Scout/global discovery only when live source execution is designed and activated; current manual-history guardrail must not be misreported as global dedupe.
- [ ] Recheck volatile commerce evidence immediately before a real post.

Duplicate guardrail truth boundary: fuzzy/name similarity is only a portfolio/workflow signal. It never manufactures Verifier `exact` authority. Same source/seller URL is not an exact-product key because a destination can mutate behind the same URL.

## Mobile-first web / cross-device

- [x] Select mobile-first responsive web as v1 platform; desktop remains supported and PWA is optional.
- [x] Require server-authoritative state rather than browser/local-only authority.
- [x] Add automated 360 px structural rules: stacked card actions, 48px bottom-nav touch targets, first-card decision fields visible by markup/read-model tests.
- [x] Confirm implemented critical actions and blocker/evidence state do not depend on hover.
- [x] Verify browser/server reload does not lose server-accepted C-slice state when the same data directory is used.
- [x] Reject stale approval when another client submits an old candidate revision; HTTP 409 returns the current read model.
- [x] Define C-slice optimistic/version conflict behavior with `expectedRevision` compare-and-set semantics.
- [x] Surface possible-duplicate review explicitly in the mobile workspace; disable evidence/content/ordinary human-decision controls until owner resolves it.
- [x] Priority-include pending duplicate reviews in the bounded five-card portfolio so a low opportunity score cannot make a correctness task unreachable.
- [ ] Perform real-device/browser visual and touch acceptance across the supported-device matrix; automated structural checks are not a substitute.
- [ ] Validate mobile camera/file upload behavior on supported browsers.
- [ ] Define maximum upload size, resumability, compression, failure recovery, and unsupported-format handling.
- [x] Keep background scheduling/publication outside the browser; the C slice leaves those capabilities unimplemented/off rather than service-worker-owned.
- [ ] Verify future PWA installation/deactivation cannot change correctness once PWA behavior exists.
- [ ] Define deep-link/session-expiry recovery back to the same run/review state when authentication/session work exists.

## Runtime, tools, and persistence

- [x] Add replay provider, budgets, receipts, and schema validation.
- [x] Enforce tool allowlists and block external actions.
- [x] Add version hashes, content-addressed objects, stale detection, and event chains.
- [x] Prove domain-level material revision binding and stale compare-and-set rejection in Spike 0 fixtures F11/F21.
- [x] Implement local/server application compare-and-set checks for C-slice user decisions and state-changing commands.
- [x] Persist C-slice state atomically in server-owned JSON; the initial implementation used in-process serialization only.
- [x] Harden local same-host persistence with a bounded ownership-aware interprocess lock around the entire read → idempotency/CAS → mutate → atomic persist critical section. Cross-instance lost-update, duplicate-request, timeout, stale-lock recovery, successor-lock ownership, and HTTP fail-closed behavior are automated-tested.
- [x] Keep duplicate assessment/resolution inside the same server-owned mutation/locking boundary so concurrent candidate writes cannot bypass persisted-history checks locally.
- [ ] Migrate to database-backed transactional persistence before multi-host/production background workers, network-filesystem deployment, production retention/query requirements, or any design that would place long-running provider/network work inside the current short-lived file-lock critical section.
- [ ] Add provider token/cost and cancellation semantics before provider-backed execution.
- [ ] Add handler input/output schemas and mutability classes for later live/background adapters.
- [ ] Add partial-line/recovery, retention, redaction classes, export, deletion, and garbage collection for production storage.
- [ ] Prevent stale approved/queued artifacts from any future publishing command; there is no publishing command in the C slice.
- [ ] Verify audit storage remains complete when a future worker crashes between external action and event persistence.

The local lock is explicitly **single-host/local-filesystem only**. It is not a network-filesystem or distributed lock, and it is not a substitute for the approved production transactional store. Current dedupe is O(n) over bounded local history; production/global scale requires a separate indexed-store decision.

## Research boundary

- [x] Disable network and mutation for fixture research.
- [x] Restrict source scheme and type.
- [x] Sanitize fixture excerpts and prohibit raw payload/personal-data storage in the existing research harness.
- [x] Require observed/retrieved timestamps, policy, rights, retention, and hashes in research records.
- [x] Use broker allowlists so only Scout/Verifier research.
- [x] Require cross-source candidate evidence in the fixture research path.
- [x] Persist sources and index evidence dependencies in the harness.
- [x] C slice labels owner-supplied references as `owner_supplied_evidence_no_network`; it does not upgrade them to independently verified live truth.
- [ ] Review official access method for each live source at activation time.
- [ ] Record source-specific terms, robots, rate limits, auth scope, and revocation.
- [ ] Define robust personal-data detection and redaction tests for live sources.
- [ ] Define quote/excerpt and media-rights limits per live source.
- [ ] Detect reposts and source dependence before counting independent live evidence.
- [ ] Add pagination, transient error, stale cache, and deleted-source behavior.
- [ ] Add source-specific recency thresholds.
- [ ] Add a human-readable citation view from claim to source for production evidence review.
- [ ] Preserve original publication/event time separately from retrieval time where available.

## Media

- [x] Separate discovery/analysis media from final-use publication rights in design.
- [x] C slice requires owned/licensed/no-media state for local evidence readiness and treats unknown rights as a blocker; it does not download or republish media.
- [ ] Define action-specific rights for view/link/embed/download/transform/publish per live source class.
- [ ] Verify media depicts the same variant represented by copy and affiliate mapping.
- [ ] Prevent transformed media from inheriting rights automatically from the source asset.
- [ ] Provide user-owned/licensed/text-only fallback before lowering rights standards in a publication slice.
- [ ] Prevent any generated image from implying a real public figure used or endorsed a product.

## Public-figure / issue content

- [x] Block rumor/private-life lane in design.
- [x] Separate public use/appearance from endorsement/sponsorship claims.
- [x] Guardian local C-slice checks reject unsupported celebrity recommendation/use wording; full issue grading remains a later slice.
- [ ] Verify source time to prevent old public-figure content from being presented as current.
- [ ] Propagate full relation grade and prohibited implications into live Writer/Guardian inputs.
- [ ] Add a stop rule when product value depends only on fame and no independent reader value remains.

## Human approval

- [x] Bind approval conceptually to draft/evidence/media/affiliate revisions.
- [x] Prove exact domain-revision binding and stale rejection in the deterministic Spike 0 harness.
- [x] Implement C-slice server material-revision binding; editing/reverification invalidates prior approval and stale client revisions are rejected.
- [x] Surface the top blocker/material stale reason before approval and disable approval unless current Guardian pass matches the current material revision.
- [x] Use request-ID idempotency so repeated browser submission does not apply the same logical command twice.
- [x] Preserve request-ID idempotency and candidate CAS across independent local store/server instances by serializing the full state mutation critical section.
- [x] Require expected-revision CAS for `resolve_duplicate`; stale duplicate decisions fail rather than silently changing the newer candidate state.
- [x] Prevent pending duplicate review from being bypassed by hold/reject/approval; only explicit `distinct|duplicate` resolution can leave that gate.
- [ ] Add stronger accidental-double-tap/confirmation UX if later high-impact external actions are introduced.

## Suppression semantics

- [x] Candidate duplicate suppression is explicit, auditable and reversible only through future intentional product behavior; suppressed duplicate records are not shown in the primary five-card inbox but remain server-owned history.
- [ ] Implement AT-14 user/category/content suppression separately. Candidate dedupe must not be presented as user preference/category suppression.
- [ ] Define restore semantics and UI for AT-14 when that slice begins.

## Publishing safety

- [ ] Verify current official Threads publishing permissions and capabilities.
- [ ] Define publication idempotency and remote reconciliation.
- [ ] Add global kill switch reachable independently of AI runtime.
- [ ] Never retry unknown remote publish state blindly.
- [ ] Preflight authorization/token state immediately before dispatch.
- [ ] Preflight issue freshness, exact-product mapping, destination integrity, media rights, disclosure, and volatile commerce facts.
- [ ] Store explicit timezone and server-normalized schedule time.

The C slice, persistence-hardening slice, and candidate-dedupe slice deliberately have **no publication command**. Therefore these unchecked publishing items do not block the local application path, but they block any future live publishing activation.

## Analytics / learning

- [x] Separate attention, intent, commercial, and trust metric classes in design.
- [x] C-slice Performance screen explicitly reports that no learning occurs before publishable/attributable data exists.
- [ ] Mark unavailable/partial attribution explicitly when production metrics are connected.
- [ ] Enforce minimum sample/confidence before ranking-weight changes.
- [ ] Exclude misleading, blocked, rumor-based, hidden-disclosure, or policy-violating high-performance patterns from learning.
- [ ] Preserve rejection reason codes instead of treating every user rejection as a negative product signal.

## Scope / economics

- [x] Keep MVP one-owner/one-account and exclude multi-tenant SaaS/billing.
- [x] Treat zero posts as a valid day.
- [x] Keep the C slice, local persistence hardening, and manual candidate dedupe dependency-free rather than introducing a framework/database/model provider before its need is demonstrated.
- [ ] Measure manual review time, model/source cost, and attributable commercial value before increasing automation or agent budgets.
