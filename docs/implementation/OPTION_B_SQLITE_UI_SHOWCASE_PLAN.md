# Option B Implementation Plan & Reference Review — SQLite WAL/FTS5, A+B Studio UI & Public `#NNN` Showcase

- **Starting baseline SHA:** `1c47055` (`feat/phase1-maos-0.2.1-option-b`, branched from `c857843` ahead of `main` `4ae6afb`)
- **Design authority:** `MASTER_SPEC.md` (v1.1 Option B), `PLATFORM_DECISION.md`, `AFFILIATE_SPEC.md` (v1.2), `CONTENT_OUTPUT_SPEC.md` (v1.2), `RUN_BUDGETS.md`, `HARNESS_BLUEPRINT.md`, `HARNESS_ACCEPTANCE_MATRIX.md`
- **Mapped requirements, B0s, ATs, and fixtures:** `PR-01`, `PR-10`, `PR-19`, `PR-25`, `PR-26`, `NFR-01`, `NFR-07`, `NFR-08`, `NFR-09`, `NFR-13`; `BS-60`, `BS-61`; `AT-01`, `AT-08`, `AT-10`, `AT-14`, `AT-15`, `AT-20`, `AT-21`, `AT-22`, `AT-32`, `AT-34`, `AT-45`, `AT-46`, `AT-47`, `AT-48`; `F25`, `F26`, `F27`, `F28`.
- **Live capabilities kept OFF (`ready: false`):** Meta Threads API network calls, NAVER API HUB calls, live Coupang Open API network calls, external automated publishing, and paid LLM network calls (`replay` / local deterministic adapters remain default).

## 1. Reference-First Review (`CLAUDE.md` §16)

1. **Node.js v24 Built-in `node:sqlite` (`DatabaseSync`) + SQLite `3.50.4` WAL & FTS5 Docs:**
   - *Adopted:* Zero-dependency `DatabaseSync`, `PRAGMA journal_mode = WAL`, `STRICT` tables, dedicated `readOnly: true` connection for `/api/showcase`, and Hangul NFD Jamo decomposition (`' ' + text.normalize('NFD') + ' '`) inside `FTS5(tokenize='trigram')` so 2-syllable Korean words (`물튐`, `방지`) and 2-char brands (`LG`, `3M`) match without native C++ extensions.
   - *Rejected:* Third-party `better-sqlite3` / ORM dependencies (unnecessary native build surface) and NFC-only trigram indexing (misses 2-syllable Korean queries).
2. **Anthropic Official `frontend-design` Skill (`claude-plugins-official`):**
   - *Adopted:* Eliminating generic AI-slop UI tells (`#f6f5f1` cream wash, ALL-CAPS English eyebrows, `10px` 7-badge clutter, `641px` top poster banner), applying intentional Korean typography (`Pretendard Variable`, `>=12px` floor, `15–16px` body, `keep-all`), active user-perspective Korean verbs, and responsive A+B docking (mobile Clean Desk + 3-step sheet; `>=1120px` desktop docked split studio).
   - *Rejected:* Unbounded motion effects or hiding required `AT-32` decision signals (`whyNow`, `readerValue`, `opportunityScore`, `evidenceReadiness`, `riskLevel`, `topBlocker`, primary CTA).
3. **29CM / Wirecutter Consumer Curation Cards:**
   - *Adopted:* Editorial `#NNN` showcase cards placing high-contrast (`>=4.5:1`, `>=13px`) verbatim statutory disclosure as the first visible DOM block (`AT-45`), followed by `#NNN` + `동일 모델 확인` / `검증 대체품` badge, synthesized pros, mandatory concrete limitation box, and instant `#번호` / Korean search.
   - *Rejected:* Exposing internal `lane`, `opportunityScore`, raw source excerpts, or `likely`/`unresolved` items (`AT-46`, `BS-61`).

## 2. Module Classification (`KEEP / MODIFY / RETIRE / NEW`)

- **KEEP:** `packages/core/src/{product-matching,candidate-ranking}.mjs`, `apps/web/{candidate-dedupe*,candidate-suppression}.mjs`, `packages/orchestra/src/{orchestrator,master-harness,live-source-registry}.mjs`.
- **MODIFY:**
  - `packages/core/src/guardian-checks.mjs` — add `AT-45` offset-`0` direct/indirect commercial disclosure block, incentivized engagement-bait block, `BS-60` lock check, and disclaimer-stripped Korean anti-AI-slop stem checks + `stays-quiet` exemptions.
  - `packages/orchestra/src/{agent-registry,model-runtime}.mjs` — register `affiliate_yield_service` & `public_showcase_projector` in `DETERMINISTIC_SERVICES` (6 agents unchanged); add `(candidate_id, lifecycle_epoch)` cumulative token/KRW ceiling (`AT-48`).
  - `apps/web/{application-state,manual-orchestrator,server,index.html,styles.css,app.js}` — support `affiliateNetwork`, `destinationUrl`, `postPublishedUndisclosed` (`BS-60` lock), `reopen_rejected_candidate`, offset-`0` draft generation, `/showcase` & `/api/showcase` read-only routes, external kill switch, SQLite default store with JSON fallback (`THREADSCOUT_STORAGE_MODE=json`), and A+B Studio + Editorial `/showcase` UI.
- **NEW:**
  - `packages/core/src/affiliate-yield-service.mjs` (`AT-47`)
  - `packages/core/src/public-showcase-projector.mjs` (`AT-46`, `BS-60`, `BS-61`)
  - `packages/orchestra/src/{passive-data-fencer,scrub-env}.mjs` (`AT-48`)
  - `packages/database/src/sqlite-store.mjs` (ACID SQLite WAL + NFD FTS5 store removing the 50-candidate truncation bug)
  - `apps/web/showcase.{html,js}` (Read-only consumer `/showcase` editorial magazine UI)
  - `tests/option-b-commercial.test.mjs` (`F25..F28` / `AT-45..48` + SQLite parity & search tests)
- **RETIRE (as production default, retained for regression tests):** `LockedAtomicJsonApplicationStore` remains selectable via `THREADSCOUT_STORAGE_MODE=json` for instant rollback and existing lock-contention unit tests.

## 3. Rollback & Stop Conditions

- Setting `THREADSCOUT_STORAGE_MODE=json` reverts server runtime immediately to the file-locked JSON store.
- Stop immediately if any existing test (`145+` suite) regresses, if `FIXED_AGENT_COUNT` diverges from `6`, or if any network capability activates.
