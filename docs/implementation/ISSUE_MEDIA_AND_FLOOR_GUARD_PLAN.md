# Issue/Public-Figure Governance (`G0–G4` × `R0–R5`), Media Rights Fallback Funnel, and Executable Design/Floor-Guard CI Plan

## 1. Context & Baseline Authority

- **Baseline `main` SHA:** `c797e46134f48a2bf640a490d92346338e9501f1` (post-merge of PR #26 `19cb31a`, PR #27 `b44bcaa`, and PR #28 `c797e46`).
- **Design Authorities:**
  - `docs/spec/MASTER_SPEC.md`
  - `docs/spec/ISSUE_SOURCE_GRADING.md` §§1–8 (`G0–G4` source grades & `R0–R5` product relation grades as two independent axes)
  - `docs/spec/ISSUE_PRODUCT_DECISION_TABLE.md` (6-axis non-substitutable matrix -> `verify_more | information_only | exact_product_content | alternative_product_content | hold | block`)
  - `docs/spec/MEDIA_PIPELINE.md` §§1–10 (discovery/analysis media vs final-use publication rights; face-recognition prohibition; AI celebrity-likeness block)
  - `docs/spec/DESIGN_CI_SPEC.md` §§5, 6, 8 (canonical spec authority, zero-orphan `PR-*`/`NFR-*`/`BS-*`/`AT-*` traceability, six-agent & action-space consistency)
  - `CLAUDE.md` §§2, 9, 10, 11, 13, 21 (`<= 200` lines / `<= 25 KB` root payload cap, `76e1e6d8bbd45f97` boundary extract hash, diff-scoped `Floor Guard`)
- **Mapped Acceptance Criteria, Blind Spots & Fixtures:**
  - `AT-03`, `AT-27`, `AT-30`, `AT-37` (`BS-22`, `BS-26`, `BS-27`, `F06`, `F07`): Public broadcast/event (`G0/G1 + R2`) allows product hypothesis without endorsement claim; `G4` rumor/private-life or `R5` blocked relation halts progression regardless of opportunity score; `R1` confirmed public use forbids `R0` paid-campaign/sponsorship claims; `R4` requires explicit alternative labeling; AI-generated real-person likeness or image-only face identification blocks fail-closed.
  - `AT-05`, `AT-26`, `AT-31` (`BS-14`, `BS-21`, `F05`, `F24`): Viral/public discovery media (`viral_clip_unlicensed`, `analysis_only_public`) remains internal analysis evidence only and resolves deterministically through `user_owned > licensed_commercial > permitted_embed > text_only > hold` without re-uploading unpermitted third-party assets.
  - `AT-39` (`NFR-11`) & MAOS `0.2.1` `Floor Guard`: Executable traceability verifier + calibrated diff-scoped `Floor Guard` blocking net-new linter/type suppressions, `test.skip`, and committed secret patterns (`NOT_MEASURED` reported explicitly when external `gitleaks` binary is absent).

## 2. Live Capability Boundary (Unchanged)

All external live capabilities remain **disabled** (`externalPublishingEnabled: false`, `liveSourcesEnabled: false`, `ready: false`):
- Zero network calls to social/news platforms, image-generation APIs, or affiliate APIs.
- Zero automated comments, likes, follows, or `reply_to_id` continuation chains.

## 3. Four Architectural Options Compared (`CLAUDE.md` §4)

| Criterion | Option 1: Single Combined "Issue Confidence Score" (`0–100`) | Option 2: Two-Axis `G0–G4` × `R0–R5` Deterministic Matrix + Media Fallback Funnel + Calibrated Governance/Floor-Guard CLI (**Selected**) | Option 3: Seventh "Celebrity & Copyright Legal Agent" | Option 4: Prose-Only Checklist in `docs/` Without Runtime or CI Gates |
| :--- | :--- | :--- | :--- | :--- |
| **Spec & Constitutional Fit** | **Violates `ISSUE_SOURCE_GRADING.md` §2** (*"Never collapse these into one confidence number"*). | **100% compliant** (`ISSUE_PRODUCT_DECISION_TABLE.md`, `MEDIA_PIPELINE.md`, `CLAUDE.md` §§7, 9, 10, 13, 21; fixed 6 agents, `<= 5` tools). | **Violates `CLAUDE.md` §7** (forbids 7th agent; role is decidable matrix + Guardian rules). | Leaves `AT-03/05/26/27/30/31/37` and `DESIGN_CI_SPEC` `declared, not enforced`. |
| **Safety & Precision** | High `G0` news reliability masks weak `R2` product relation. | Preserves independent axes, enforces wording ceilings (`R1 != R0`), falls back viral media to `text_only`, and calibrates `Floor Guard` against known-bad diffs. | Model hallucination risk on decidable grade combinations. | Zero regression protection on future PRs. |
| **Decision** | Rejected | **Selected** | Rejected | Rejected |

## 4. Reference & Exemplar Review (`CLAUDE.md` §16)

1. **Korea Portrait Rights / Publicity Rights & KFTC Celebrity Endorsement Precedents (`SAFETY_COMPLIANCE.md`, `BS-22`, `BS-26`):**
   - *Adopted:* Strict distinction between `R0` (`공식 캠페인/모델`), `R1` (`방송·공개 장면 착용/사용 확인` — sponsorship/endorsement wording forbidden), `R3` (`언론 보도 언급`), and `R4` (`비슷한 대체 후보`), plus unconditional block on `G4`/`R5`, image-only face inference, and synthetic real-person imagery.
2. **Creative Commons / Platform Embed vs Re-Upload Copyright Boundaries (`MEDIA_PIPELINE.md` §§4, 8):**
   - *Adopted:* Separate `discoveryMediaState` (what Verifier analyzed) from `publicationMediaRights` (what may appear in the Threads post), resolving `platform_embed_only` to `permitted_embed` (`reuploadAllowed: false`, `imageUrl` stripped from root-post upload payload) and `analysis_only`/`link_only` to `text_only`.
3. **MAOS `0.2.1` `rules/verification-placement.md` & `DESIGN_CI_SPEC.md` §§5–8:**
   - *Adopted:* Executable Node CLI `scripts/check-governance-and-floor.mjs` checking `CLAUDE.md <= 200` lines / `<= 25 KB`, `sha256` prefix `76e1e6d8bbd45f97`, zero-orphan `PR-*`/`NFR-*`/`BS-*`/`AT-*` links, 6-agent `<= 5` tool bounds, and diff-scoped `Floor Guard` calibrated against known-bad inputs in unit tests before trusting green.

## 5. Module Classification & Normative Definitions (`CLAUDE.md` §20)

| File / Module | Classification | Responsibility |
| :--- | :--- | :--- |
| `packages/core/src/issue-media-governance.mjs` | **MISSING -> ADD** | Deterministic `evaluateIssueProductDecision` (`G0–G4` × `R0–R5`), wording-ceiling detectors (`detectOfficialCampaignClaim`, `detectUnattributedPublicFigureUse`), and `resolveMediaPublicationFallback` (`MEDIA_PIPELINE.md`). |
| `packages/core/src/guardian-checks.mjs` | **MODIFY** | Enforce `G4`/`R5`/`G3` issue blockers, `R1`/`R2`/`R3`/`R4` wording ceilings, `BS-22` synthetic celebrity media block, and `MEDIA_PIPELINE` re-upload restrictions in `runGuardianChecks`. |
| `packages/core/src/provenance-lineage.mjs` | **MODIFY (bugfix)** | Fix `solicitation.commercial` property name on `detectCommercialSolicitationSurface` return object (`offsetZeroDisclosureOk` & `buildApprovedExportBundle`). |
| `packages/core/src/threads-publisher-service.mjs` | **MODIFY** | Strip `imageUrl` re-upload unless `resolveMediaPublicationFallback` returns `reuploadAllowed: true`, and block `G4`/`R5` or `publishable === false` media at schedule admission & preflight. |
| `apps/web/application-state.mjs` | **MODIFY** | Persist & hash `issueSourceGrade`, `productRelationGrade`, `personIdentifiedFromImageOnly`, `discoveryMediaState`, and `aiGeneratedDepictsRealPerson`; wire into `verifyCandidate`, `createDrafts`, `runGuardian`, and `toCandidateReadModel`. |
| `apps/web/{index.html,app.js}` | **MODIFY** | Add compact collapsible `이슈·방송 출처 등급(G0~G4) 및 미디어 분리 설정` controls in Step 1, extend `#media-rights` options (`platform_embed_only`, `analysis_only`), and map Korean labels/errors. |
| `scripts/check-governance-and-floor.mjs` & `package.json` | **MISSING -> ADD / MODIFY** | Executable `DESIGN_CI_SPEC` traceability + root-cap + `Floor Guard` script (`npm run check:governance`, chained into `npm run verify`). |
| `tests/issue-media-and-floor-guard.test.mjs` | **MISSING -> ADD** | Calibrated positive + negative (`stays-quiet` & known-bad) tests for `AT-03`, `AT-05`, `AT-26`, `AT-27`, `AT-30`, `AT-31`, `AT-37`, `AT-39`, `F05..07`, `F24`, and `Floor Guard`. |

### Normative Definitions (Undefined-Term Prevention)

- **`issueLinked` & Invalid-Grade Fail-Closed:** Any non-empty `issueSourceGrade` outside `ISSUE_SOURCE_GRADES` (`none|G0..G4`) or `productRelationGrade` outside `PRODUCT_RELATION_GRADES` (`none|R0..R5`) evaluates to `issueLinked: true`, `routeOutcome: 'block'`. Otherwise `issueLinked` is `issueSourceGrade !== 'none' || productRelationGrade !== 'none'`. Every `/showcase` card enforces rolling TTL expiry regardless of `affiliateState`: `SHOWCASE_ISSUE_TTL_MS` (`12h`) when `issueLinked === true`, else `SHOWCASE_STANDARD_TTL_MS` (`7d`).
- **`reuploadAllowed` & Missing-Rights Default:** `Boolean(true)` solely when `publicationMediaRights` is in `Set(['owned', 'user_owned', 'licensed', 'explicitly_licensed'])`, `!Boolean(aiGeneratedDepictsRealPerson)`, `!Boolean(syntheticDeceptiveBeforeAfter)`, and any non-empty `publishableMediaUrl` parses as valid `https:`. Omitted `mediaRights` in Showcase/Provenance defaults fail-closed to `'unknown'` (`publishable: false`).
- **Published Draft Body & Wording Ceilings:** Reader-facing positive disclaimers (`detectAlternativeLabel`, `hasAttributedReportFraming`) are checked strictly on `String(draft.text ?? '')` (`rawDraftText`), excluding `draft.title`. Affirmative same-product claims are blocked whenever `!wordingRuleFor(matchState).sameProductClaimAllowed || ['alternative_only', 'discovery_hypothesis_only'].includes(allowedWordingCeiling) || affiliateMappingState === 'alternative'`. Endorsement detection strips only direct noun-phrase / coordinated-noun sponsorship negations (zero cross-clause wildcard gap) before matching named-person or role-noun recommendation/favorite patterns (`강추한`, `추천한`, `픽한`, `의 최애`). `R3` (`attributed_report_only`) requires `hasAttributedReportFraming(rawDraftText) && !detectConfirmedPublicUseWording(text)`.
- **Fail-Closed `Floor Guard` & Cryptographic Extract Verification:** `evaluateRootPayloadGovernance` computes UTF-8 `sha256` over the dedented `CLAUDE.md` §21 `agent-vs-skill.md` extract and requires prefix `76e1e6d8bbd45f97`. `evaluateSpecTraceability` enforces bidirectional set equality (`PR/NFR`, `B0`, `AT`) and `>= 1` resolved `Design authority` token per row. `evaluateFloorGuard` scans all changed files (zero whole-file exemptions; dynamic pattern construction prevents self-matching), fails closed (`ok: false`) unless `diffStatus` is `'MEASURED'` (base-to-HEAD diff via `origin/main`, `main`, or `HEAD~1`) or `'MEASURED_SHALLOW_HEAD'` (`fetch-depth: 1` full-tree fallback), and blocks net-new inline suppressions, `test/it/describe/t.skip` or `.todo`, net-new test-case/test-file deletions, forbidden tracked `.env`/DB files, and high-confidence secret literals.

## 6. Success, Rollback & Completion Proof Conditions (`CLAUDE.md` §§18, 20)

- **Success Criteria:**
  1. `npm run verify` (now including `npm run check:governance`) and `npm run orchestra:demo` exit `0` on both Node 24 and Node 20.
  2. Calibrated tests prove `check-governance-and-floor.mjs` fails closed (`ok: false`) on known-bad orphan requirements, `> 200`-line `CLAUDE.md`, net-new `eslint-disable`/`test.skip`, and synthetic secret tokens before trusting green.
  3. Real browser hit-testing at `1440x900` & `360x740` (`scrollWidth <= 360`) verifies Step 1 issue/media controls and blocked/fallback behaviour.
  4. Independent `maos-critic` review returns `0` blocking findings, and GitHub Actions passes `verify (20)` and `verify (24)`.
