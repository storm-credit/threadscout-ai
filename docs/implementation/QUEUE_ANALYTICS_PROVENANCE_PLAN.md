# Local Schedule Queue (`S07`), Guardrailed Analytics & ROI Learning (`S08`), and Provenance Lineage (`AT-13`) Plan

## 1. Context & Baseline Authority

- **Baseline `main` SHA:** `b44bcaae7587aadb729fc87422d776322806f267` (post-merge of PR #26 `19cb31a` and PR #27 `b44bcaa`).
- **Design Authorities:**
  - `docs/spec/MASTER_SPEC.md`
  - `docs/spec/PUBLISHING_SPEC.md` §§1–10 (single-root-post schedule lifecycle, preflight, cancellation, `unknown != failed` reconciliation)
  - `docs/spec/ANALYTICS_SPEC.md` §§1–8 (metric classes, attribution caution tiers, `learning_summary`, safety guardrails, 1-variable experiments)
  - `docs/spec/UI_SCREEN_SPEC.md` §§9–11 (`S06` Human Approval, `S07` Schedule Queue, `S08` Performance / Weekly Learning)
  - `docs/spec/DAILY_OPERATING_MODEL.md` §§3, 6, 10 (`value_only`, `product_editorial`, `affiliate_candidate` portfolio balance)
  - `docs/spec/AFFILIATE_SPEC.md` v1.2 & `docs/spec/SAFETY_COMPLIANCE.md` (`BS-60` post-publication non-commercial lock)
  - `docs/spec/HARNESS_BLUEPRINT.md` & `docs/spec/HARNESS_ACCEPTANCE_MATRIX.md`
- **Mapped Acceptance Criteria, Blind Spots & Fixtures:**
  - `AT-09`, `AT-38` (`BS-37`, `F01`, `F11`, `F21`): Schedule admission requires human approval bound to immutable `materialRevision`, `draftId`, and `draftText` (`approvalHash`); upstream material mutations invalidate both approval and active pre-dispatch schedules.
  - `AT-11` (`BS-40`, `F16`): Durable persistence of schedule states including `unknown_remote_state` reconciliation semantics.
  - `AT-12` (`BS-46`): Guardrailed analytics & weekly learning — posts with rumor hooks, unsupported public-figure endorsement implications, hidden disclosures, product mismatches, policy violations, post-publication factual corrections, or Guardian blocks are quarantined into `failedPatterns` and never promoted regardless of views, clicks, or conversions.
  - `AT-13`, `AT-19` (`BS-31`, `F01`): Simplified provenance lineage from intake/discovery through `verifier`, `strategist`, `writer`, `guardian`, and `human_approval`, referencing immutable artifact/evidence hashes and versions.
  - `AT-35` (`BS-06`): Server-authoritative durability of schedules and outcome snapshots across browser close/reload in both Node 24 `node:sqlite` WAL (`SqliteApplicationStore`) and Node 20 JSON parity (`AtomicJsonApplicationStore`).
  - `AT-44` (`BS-16`, `F10`) & `AT-45` (`BS-60`, `F25`): Dispatch preflight rechecks destination snapshot drift and indirect `/showcase` monetization disclosure; manual publication confirmation of a non-commercial post irreversibly sets `lockedNonCommercialAfterPublish = true` (`BS-60`).

## 2. Live Capability Boundary (Unchanged)

All external live capabilities remain **disabled** (`externalPublishingEnabled: false`, `liveSourcesEnabled: false`, `ready: false` in `live-source-registry.mjs` and `live-activation-preflight.mjs`):
- No network calls to Meta Threads Graph API, Coupang Partners Open API, Naver endpoints, or paid LLM APIs.
- No automated comments, likes, follows, DMs, or continuation self-replies (`reply_to_id`).
- Local scheduling (`schedule_approved_post`, `run_schedule_preflight`, `cancel_schedule`) and owner-confirmed manual publication (`record_manual_publication`) operate strictly as local operator workflow + single-post copy/Markdown export tools until a future credentialed live-activation slice is explicitly approved by the owner (`CLAUDE.md` §§2, 3, 12).

## 3. Four Architectural Options Compared (`CLAUDE.md` §4)

| Criterion | Option 1: Client-Only Clipboard & LocalStorage Analytics | Option 2: Deterministic Server-Authoritative Local Queue + Guardrailed SQLite WAL Outcome/ROI Ledger (**Selected**) | Option 3: Seventh "Scheduler & Growth Analyst" LLM Agent | Option 4: Autonomous Background Cron Dispatcher |
| :--- | :--- | :--- | :--- | :--- |
| **Mechanism** | Browser-only copy buttons and `localStorage` chart state; no server persistence. | Wires `threads-publisher-service.mjs` + new deterministic `analytics-learning-service.mjs` + `buildCandidateProvenance` into server state & SQLite WAL (`schedules`, `outcome_snapshots`) behind Orchestrator commands. | Adds a 7th LLM agent reading metrics and rewriting prompts/schedules autonomously. | Starts an in-process timer auto-dispatching queued posts at `desiredLocalDatetime`. |
| **Spec & Constitutional Fit** | **Fails `AT-35` / `BS-06`** (browser storage cannot own queue or durable state). | **100% compliant** (`CLAUDE.md` §7 deterministic non-agent services; fixed 6-agent roster; `<= 5` local action bound untouched). | **Violates `CLAUDE.md` §7** (forbids 7th agent) and risks Goodhart feedback loops (`BS-46`). | **Violates `CLAUDE.md` §§2, 12** (`externalPublishingEnabled: false` until live preflight approval). |
| **Commercial Operator Value** | Loses queue & ROI history across mobile/desktop devices. | Full daily loop: 1-click single-post copy & `/showcase` Markdown export, `◷ 예약` preflight/manual-publish `BS-60` lock, and `↗ 성과` net KRW ROI + `AT-12` learning summary. | Unpredictable token spend per check and opaque recommendations. | Premature before Meta App Review credentials exist. |
| **Decision** | Rejected | **Selected** | Rejected | Rejected |

## 4. Reference & Exemplar Review (`CLAUDE.md` §16)

1. **SQLite WAL Transactional Outbox / Queue State Machines (SQLite 3.50 Official WAL & `STRICT` Docs):**
   - *Adopted:* Dedicated `schedules` and `outcome_snapshots` `STRICT` tables updated inside the existing `BEGIN IMMEDIATE ... COMMIT` transaction alongside `candidates`, `command_history`, and hash-chained `audit_events`, plus full JSON mirror parity for Node 20 CI.
   - *Rejected:* Separate uncoordinated queue files that could drift from `candidate.materialRevision` on crash.
2. **Korea FTC (공정거래위원회) Endorsement Guidelines (`2024.12` / `2026` Enforcement) — Post-Publication Immutability (`BS-60`):**
   - *Adopted:* When the operator records manual publication (`record_manual_publication`) on an approved candidate with `affiliate === false`, the server atomically sets `lockedNonCommercialAfterPublish = true` (enforced both in `application-state.mjs` and by `trg_lock_non_commercial_irreversible` in SQLite), preventing retroactive affiliate insertion onto an undisclosed root post.
3. **Small-Sample Attribution & Goodhart Quarantine in Recommender Systems (`ANALYTICS_SPEC.md` §§4–7, `BS-46`):**
   - *Adopted:* Deterministic sample-size tiering over clean records (`0 -> unknown`, `1..2 -> observation`, `3..4 -> correlation_hypothesis`, `>= 5 -> sufficient_repeated_signal`) and a hard pre-aggregation safety quarantine (`rumorHook`, `endorsementImplication`, `hiddenDisclosure`, `productMismatch`, `policyViolation`, `postCorrections > 0`, Guardian `block`) that routes unsafe high-view posts exclusively to `failedPatterns` with `promotionBlocked: true`.
   - *Rejected:* Naive view-weighted top-K sorting or autonomous prompt self-modification.
4. **W3C PROV-DM Simplified Artifact Lineage (`AT-13`, `AT-19`):**
   - *Adopted:* Server-computed `provenance` read-model array binding immutable SHA-256 digests and version/timestamp metadata across `intake_discovery -> verifier -> strategist -> writer -> guardian -> human_approval`.

## 5. Module Classification & Normative Definitions (`CLAUDE.md` §20)

| File / Module | Classification | Responsibility |
| :--- | :--- | :--- |
| `packages/core/src/analytics-learning-service.mjs` | **MISSING -> ADD** | Deterministic `OutcomeSnapshot` validation, `estimateNetYieldKrw` net contribution binding, `isSafetyQuarantined` (`AT-12`), affiliate saturation guardrail (`> 70%` over `>= 4` posts), and `buildLearningSummary` (`ANALYTICS_SPEC.md` §§4–7). |
| `packages/core/src/provenance-lineage.mjs` | **MISSING -> ADD** | Deterministic `buildCandidateProvenance(candidate)` (`AT-13`, `AT-19`) + verified single-root-post copy text & Markdown card export assembly. |
| `packages/core/src/threads-publisher-service.mjs` | **MODIFY (minor)** | Support hydrating/exporting durable schedule records (`schedules` + `consumedApprovalHashes`) and reading `candidate.affiliateMapping?.canonicalListingSnapshot?.seller` without fabricating seller strings. |
| `apps/web/manual-orchestrator.mjs` | **MODIFY** | Register `schedule_approved_post`, `cancel_schedule`, `record_manual_publication` (`HUMAN_COMMANDS`) and `run_schedule_preflight`, `record_outcome_snapshot` (`DETERMINISTIC_COMMANDS`); keep all 6 agent action spaces unchanged (`<= 5`). |
| `apps/web/application-state.mjs` | **MODIFY** | Persist `schedules`, `consumedApprovalHashes`, and `outcomeSnapshots`; auto-invalidate active pre-dispatch schedules on upstream candidate mutation; expose `queue`, `analytics`, `provenance`, `singleRootPostCopyText`, and `showcaseMarkdown` in `toTodayReadModel`; add `seller` field support. |
| `apps/web/candidate-dedupe-store.mjs` & `apps/web/candidate-suppression-store.mjs` | **MODIFY (minor)** | Trigger active-schedule invalidation when owner suppression or post-verification duplicate suppression mutates an approved candidate. |
| `packages/database/src/sqlite-store.mjs` | **MODIFY** | Add `schedules`, `consumed_approval_hashes`, and `outcome_snapshots` `STRICT` tables in `SCHEMA_SQL` with full read/write/JSON-mirror parity. |
| `apps/web/{index.html,styles.css,app.js}` | **MODIFY** | Add optional `seller` field in Step 1; add 1-click single-post copy, `/showcase` Markdown copy, schedule form, manual-publish button, and collapsible `AT-13` Provenance Lineage in Step 3; render live `S07` Schedule Queue on `◷ 예약` above preflight; render `S08` Performance / Net ROI / `AT-12` Learning Summary + outcome entry form on `↗ 성과`. |
| `tests/queue-analytics-provenance.test.mjs` | **MISSING -> ADD** | End-to-end & unit verification for `AT-09`, `AT-11`, `AT-12`, `AT-13`, `AT-19`, `AT-35`, `AT-36`, `AT-38`, `AT-44`, `BS-46`, and `BS-60` across SQLite WAL and JSON fallback modes. |

### Normative Definitions (Undefined-Term Prevention)

- **`publicationKey`:** Canonical identity of one distinct publication: `'sched:' + snapshot.scheduleId` when `scheduleId` is present, else `'cand:' + snapshot.candidateId`. Multi-window (`24h`, `7d`, `manual`) snapshots recorded for the same `publicationKey` collapse to the latest snapshot for cumulative metrics while taking the union of all `quarantineReasons` across every snapshot on that `publicationKey` plus current candidate state (`guardian.decision === 'block'`, `workflowState === 'blocked'`, `mediaRights === 'unknown'`, `['likely','unresolved'].includes(exactMatchStatus)`, `suppression.active === true`), deducting `(candidateId, lifecycleEpoch)` `runTokenCostKrw` at most once.
- **`cleanSampleCount`:** Number of distinct deduplicated `publicationKey` records in a `(lane, angleId)` bucket with `quarantined === false`.
- **`affiliateShare` & `heldByAffiliateCap`:** `affiliateShare = monetizedPublicationCount / totalPublicationCount` over deduplicated publications (`0` when `totalPublicationCount === 0`), with `excessiveAffiliateFrequency = totalPublicationCount >= 4 && affiliateShare > 0.70`. A `(lane, angleId)` bucket is held from `strongRepeatedPatterns` (`heldByAffiliateCap === true`) whenever `(cleanSampleCount >= 4 && groupAffiliateShare > 0.70)` OR `(excessiveAffiliateFrequency && groupAffiliateCount > 0)`.
- **Single-Draft Approval Binding & Unwedging:** `review_decision('approved')` binds one `approvedDraftId` and one `approvalHash` (incorporating `boundCandidateRevision`) on `candidate.review`, rejecting `candidate.suppression?.active === true` and rejecting any schedule/manual-publication attempt on another `draftId`. Any preflight invalidation/expiry or owner suppression transitions an approved candidate to `workflowState = 'stale'` (`review.stale = true`) so re-Guardian + a fresh human approval is always reachable without deadlocking.
- **Non-Commercial Post (`BS-60`):** Any post manually published while `candidate.affiliate === false` (covering both `value_only` and unmonetized `product_editorial`), irreversibly setting `lockedNonCommercialAfterPublish = true`.
- **Active Pre-Dispatch Schedule:** A schedule record whose `status` is in `Set(['scheduled', 'held', 'ready'])`. Terminal states (`'published'`, `'cancelled'`, `'failed'`, `'invalidated'`, `'expired'`) and `'unknown_remote_state'` are non-active.

## 6. Success, Rollback & Completion Proof Conditions (`CLAUDE.md` §§18, 20)

- **Success Criteria:**
  1. `npm run verify` (`check:docs`, all `tests/*.test.mjs`, Spike 0, replay/store/research, `preflight:live`) and `npm run orchestra:demo` exit `0` on both Node 24 (`sqlite`) and Node 20 (`json` fallback).
  2. Real browser verification (`fe7d8d37`) at `1440x900` desktop and `360x740` mobile (`scrollWidth <= 360`) proves Step 3 Provenance + Copy/Schedule controls, `◷ 예약` (`S07`) queue + preflight, and `↗ 성과` (`S08`) outcome entry + Net ROI + `AT-12` guardrail rendering with zero secret or raw env-var-name leaks.
  3. Zero-rationale `maos-critic` review returns `0` blocking findings.
  4. PR opened against `main` (`b44bcaae7587aadb729fc87422d776322806f267`) passes GitHub Actions `verify (20)` and `verify (24)`.
- **Stop & Rollback Conditions:** Stop immediately if any change would enable external network calls, widen any agent's tool count past `5`, or alter the fixed 6-agent roster; revert branch `feat/queue-analytics-provenance` cleanly to `main` on irreconcilable contract regression.
