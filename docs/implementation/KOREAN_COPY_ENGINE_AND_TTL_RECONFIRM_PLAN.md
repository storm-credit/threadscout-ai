# Slice H Plan — Korean Anti-AI Copy Engine & Showcase Snapshot Re-Confirmation

## 1. Context & Baseline Authority

- **Baseline `main` SHA:** `4148604` (post-merge of PR #31).
- **Design Authorities:**
  - `docs/spec/CONTENT_OUTPUT_SPEC.md` v1.3 (§1 4 distinct reader angles + `polite`/`plain` tone register + phonetic josa binding + commercial-only `#NNN` pointer; §3 Novelist/`im-not-ai` conjugated anti-AI-slop stems + statutory `[광고]` pre-stripping + `stays-quiet` guarantees)
  - `docs/spec/PLATFORM_DECISION.md` (proportional expiring-soon alert `0 < remainingMs <= min(24h, ttlMs * 0.25)` and bounded `reconfirm_showcase_snapshot` preserving `strategies`/`drafts`, re-running deterministic `Guardian`, and re-binding `approvalHash` with `0` specialist model budget invocations)
  - `docs/spec/AFFILIATE_SPEC.md` v1.3, `docs/spec/MASTER_SPEC.md`
  - `CLAUDE.md` §§2, 4, 5, 7, 8, 12, 16, 18, 20, 21
- **Mapped Requirements, Blind Spots & Acceptance Criteria:**
  - `PR-06`, `PR-07`, `PR-08`, `PR-20`, `PR-25`, `PR-26`, `NFR-01`, `NFR-03`, `NFR-07`, `NFR-09`
  - `BS-37`, `BS-52`, `BS-60`, `BS-61`
  - `AT-06`, `AT-07`, `AT-08`, `AT-10`, `AT-23`, `AT-44`, `AT-45`, `AT-46`, `AT-48`

## 2. Reference & Exemplar Review (`CLAUDE.md` §16)

1. **Novelist / `im-not-ai` Korean Corpus & 2-Stage Anti-AI Pipeline (`WC-20261127-08`, `SRC-05`, `SRC-06`):**
   - *Adopted:* Pre-strip statutory `[광고]/[협찬]/[유료광고]` disclosure lines in `stripMandatoryDisclaimers` so `"수수료를 제공받습니다"` never collides with abstract-buzzword `제공하-` (`A-15`); flag conjugated double passives (`쓰여지-/만들어지-/읽혀지-`), `-아서,/-어서,` mechanical commas (`>= 3`), cleft openers (`문제는/관건은`), `단순한 X를 넘어 Y` (`A-21`), stacked translationese particles (`A-19`), abstract-buzzword `제공하-|선사하-` (`A-15`), hype buzzwords (`D-4`), and post-hoc `~이유다/셈이다` (`D-10`); and preserve `~에 대해`, plain `~의`, `~할 수 있다`, literal `높이를 넘어`, and concrete `"보증을 제공합니다"` (`stays-quiet`).
2. **Phonetic Korean Josa Binding (`korean-copy-engine.mjs`):**
   - *Adopted:* Unwrap trailing brackets/quotes and evaluate final sound across Hangul batchim (including `ㄹ` `jong === 8` exception for `으로/로`), Sino-Korean ASCII digits (`0,3,6` non-`ㄹ` batchim; `1,7,8` `ㄹ` batchim; `2,4,5,9` vowel), and common Latin measurement/model suffixes (`cm/mm/W/V/L` vowel vs `g/kg` `ㅁ` batchim).

## 3. Module Classification (`CLAUDE.md` §20)

| File / Module | Classification | Responsibility |
| :--- | :--- | :--- |
| `packages/core/src/korean-copy-engine.mjs` | **MISSING -> ADD** | Phonetic `attachJosa`/`withJosa`, Novelist-grounded 4-angle `buildKoreanStrategies` & `buildKoreanDrafts` (`polite` default / `plain` toggle, varied middle cadence, non-incentivized closing question), and stateless `parseStructuredIdentitySnippet` (`brand`/`model`/`variant`/`seller` only). |
| `packages/core/src/guardian-checks.mjs` | **MODIFY** | Strip statutory `[광고]/[협찬]/[유료광고]` disclosures in `stripMandatoryDisclaimers` and expand `detectKoreanAiSlop` with calibrated `A-8`, `A-15`, `A-19`, `A-21`, `C-11`, `D-4`, `D-8`, `D-10` checks + `stays-quiet` behavior. |
| `packages/core/src/public-showcase-projector.mjs` | **MODIFY** | Add `evaluateShowcaseCardExpiry` implementing proportional `0 < remainingMs <= min(24h, ttlMs * 0.25)` expiring-soon calculation (`<= 24h` on `7d` cards, `<= 3h` on `12h` issue cards). |
| `apps/web/manual-orchestrator.mjs` & `apps/web/application-state.mjs` | **MODIFY** | Register human-routed `reconfirm_showcase_snapshot` (`0` specialist budget charge), enforce byte-equality on `{ brand, model, variant, seller, destinationUrl }` (marking `stale` on drift), preserve `strategies`/`drafts`, re-run deterministic `Guardian`, re-bind `approvalHash` (keeping published post hashes consumed), and wire `draftTone` (`polite` / `plain`). |
| `apps/web/{index.html,app.js,styles.css}` | **MODIFY** | Add Step 1 structured spec-paste identity filler, Step 2 `초안 어조` (`존댓말 기본` / `평서체 ~다`) selector, and Step 3 expiring-soon banner + 1-click snapshot re-confirmation UI. |
| `tests/korean-copy-engine-and-ttl-reconfirm.test.mjs` | **MISSING -> ADD** | Calibrated positive/negative (`stays-quiet`) unit & E2E (`sqlite` + `json`) tests for phonetic josa, `polite`/`plain` 4-angle copy, Novelist `Guardian` rules, proportional `7d`/`12h` expiry alerts, and `reconfirm_showcase_snapshot` (`0` budget charge, `approvalHash` rebinding, drift -> `stale`). |

## 4. Success, Non-Goals & Stop Conditions

- **Non-Goals:** External live APIs and automated publishing remain disabled (`externalPublishingEnabled: false`, `ready: false`); fixed 6-agent roster (`<= 5` tools each) unchanged.
- **Completion Proof:** `npm run verify && npm run orchestra:demo` exit `0`, `360x740` & `1440x900` real browser hit-testing passes, independent `maos-critic` review reaches `0` blockers, and PR #32 + `main` GitHub Actions pass.
