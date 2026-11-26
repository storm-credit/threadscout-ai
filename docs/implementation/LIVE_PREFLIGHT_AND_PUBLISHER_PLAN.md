# Live-Activation Preflight & Single-Root-Post Publisher Readiness Plan (`PUBLISHING_SPEC.md` §§1–10)

## 1. Scope & Constitutional Boundary
- **Baseline:** `feat/option-b-sqlite-ui-showcase` (`1156cc1`, PR #26 green on Node 20 & Node 24).
- **Goal:** Implement the deterministic `publisher_adapter` preflight, single-root-post `reply_to_id` blocker, `unknown != failed` timeout reconciliation state machine, and unified Live Credentials / Tiered LLM / Dual-Affiliate Readiness Preflight (`GET /api/preflight` + `npm run preflight:live` + Studio `예약` tab checklist) **without** enabling live network calls (`externalPublishingEnabled: false`, `ready: false`).

## 2. Four Options Compared (`CLAUDE.md` §4)
1. **Option 1 — Immediate live API wiring with `.env` auto-enable:** Rejected (`CLAUDE.md` §§3, 12 forbid credentials alone from activating live calls without readiness checks and explicit human activation approval).
2. **Option 2 — Prose-only checklist document without executable preflight/reconciliation code:** Rejected (`CLAUDE.md` §21 requires decidable boundary checks — `no reply_to_id`, single-use hash-bound approvals, post-approval showcase monetization drift, and `unknown != failed` timeout locks — in default-deny code).
3. **Option 3 — Deterministic Single-Root-Post Publisher State Machine + Redacted Live-Activation Preflight API/UI (`SELECTED`):** Enforces every `PUBLISHING_SPEC.md` §§1–9 invariant in pure, testable code while keeping external network execution off (`ready: false`) until the owner supplies real credentials and explicit human activation flags.
4. **Option 4 — External third-party SaaS scheduler (Buffer/Hootsuite/SocialBiz):** Rejected (adds monthly SaaS burn, external token custody, and cannot re-verify ThreadScout's live `/showcase` monetization state or offset-`0` Korean statutory disclosure at dispatch time).

## 3. Primary API Reference Review (`CLAUDE.md` §16)
- **Meta Threads Graph API Publishing (`https://developers.facebook.com/docs/threads/posts`):** Uses a two-step container flow (`POST /v1.0/{threads-user-id}/threads` returning `id` / `creation_id`, followed by `POST /v1.0/{threads-user-id}/threads_publish` with `creation_id`) and container status inspection (`GET /v1.0/{creation_id}?fields=id,status,error_message`). Adopted: `remoteContainerId` + `remotePostId` two-field tracking and `statusReconcileEndpoint` preview; Rejected: `reply_to_id` continuation chains (`CLAUDE.md` §5 ban + non-atomic failure risk).
- **Meta Threads Keyword Search (`https://developers.facebook.com/docs/threads/keyword-search`):** Requires `threads_basic` + `threads_keyword_search` App Review. Kept read-only and disabled (`ready: false`) in `live-source-registry.mjs`.
- **Coupang Partners Open API & Naver Shopping Connect:** Adopted manual owner link + 6-field `canonicalListingSnapshot` for immediate local operation without API keys, while gating Coupang Open API behind `<= 10/hr` fail-closed rate limiting.

## 4. Acceptance & Safety Invariants
- `AUTOMATED_REPLY_FORBIDDEN`: Rejects `reply_to_id`, `replyToId`, `in_reply_to`, `parentPostId`, `autoComment`, and multi-post continuation arrays in default-deny code (`CLAUDE.md` §5).
- `SINGLE_USE_APPROVAL_BOUND`: Consumed `(candidateId, boundMaterialRevision, draftId)` approval hashes cannot be re-scheduled or re-dispatched.
- `DISPATCH_TIME_SOLICITATION_RECHECK`: Re-runs `runGuardianChecks` against current `activeMonetizedShowcaseCount` and `monetizedCardNumbers`; if `/showcase` gained a monetized card after an undisclosed post was approved, preflight transitions the schedule to `'invalidated'`.
- `UNKNOWN_NOT_FAILED`: Submission timeouts enter `'unknown_remote_state'` and block retry dispatch until `reconcileUnknownRemoteState` resolves whether the post exists remotely.
- `ZERO_SECRET_LEAK`: CLI `npm run preflight:live` reports missing/configured variable names while never serializing secret values, and browser-facing `GET /api/preflight` (`toPublicWebPreflightSummary` + `assertPublicReadModelSafe`) strips both secret values and raw credential env-var identifiers into Korean labels.
