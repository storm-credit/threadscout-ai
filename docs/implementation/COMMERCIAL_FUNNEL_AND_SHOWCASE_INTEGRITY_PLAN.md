# Slice G Plan — Commercial Funnel & Public `/showcase` Integrity

## 1. Context & Baseline Authority

- **Baseline `main` SHA:** `59012d5a4f3e2dbbbd6a74f75c044bcb4383312b` (post-merge of PR #30).
- **Design Authorities:**
  - `docs/spec/PLATFORM_DECISION.md` (monotonic `#NNN` reservation, `verifiedPros`/`verifiedLimitation` binding, `.dest-btn` `referrerpolicy="origin"` + `rel="noopener sponsored nofollow"`)
  - `docs/spec/AFFILIATE_SPEC.md` v1.3 (§2.4 raw-storefront URL block & `naver.me` generic-shortener warning, §5 commercial-only `#NNN` draft injection)
  - `docs/spec/MASTER_SPEC.md`, `docs/spec/RANKING_SCORING_SPEC.md`, `docs/spec/FINAL_BLIND_SPOT_SWEEP.md`
  - `CLAUDE.md` §§2, 4, 5, 6, 7, 8, 12, 16, 18, 20, 21
- **Mapped Requirements, Blind Spots & Acceptance Criteria:**
  - `PR-10`, `PR-20`, `PR-25`, `PR-26`, `NFR-01`, `NFR-03`, `NFR-05`, `NFR-10`
  - `BS-03` (commercial signals never affect ranking), `BS-37` (approval binds `verifiedPros`/`verifiedLimitation` in `materialRevision`), `BS-57` (advisory rolling commercial ratio, `0/0 -> NOT_MEASURED`, never a daily quota), `BS-60` (non-commercial drafts stay solicitation-free), `BS-61` (zero `whyNow`/`internalNotes` fallback onto `/showcase`)
  - `AT-10`, `AT-17`, `AT-34`, `AT-38`, `AT-45`, `AT-46`, `AT-47`, `F25`, `F26`, `F27`

## 2. Reference & Exemplar Review (`CLAUDE.md` §16)

1. **W3C Referrer Policy (`referrerpolicy="origin"` on Anchor Elements):**
   - *Adopted:* Keep document and subresource (`<link>`, `<img>`) `Referrer-Policy: no-referrer` on `/showcase` and `/showcase/:cardNumber`, and set `referrerpolicy="origin"` + `rel="noopener sponsored nofollow"` strictly on `.dest-btn` anchors when served from a non-loopback `https:` origin (`no-referrer` on `http:` / loopback).
2. **Korean Affiliate Program Link Rules (Coupang Partners & Naver Brand Connect / Shopping Connect, `WC-20261127-07`):**
   - *Adopted:* Reject known raw storefront product URLs (`www.coupang.com`, `m.coupang.com`, `coupang.com` without `lptag`, and `smartstore.naver.com`, `m.smartstore.naver.com`, `brand.naver.com`, `m.brand.naver.com`, `shopping.naver.com`, `mshopping.naver.com` without explicit tracking query params) with `raw_storefront_url_not_affiliate` (`Guardian` `block`) while surfacing a confirmation warning on generic `naver.me` shorteners without performing any HTTP redirect fetch (`CLAUDE.md` §12).

## 3. Module Classification (`CLAUDE.md` §20)

| File / Module | Classification | Responsibility |
| :--- | :--- | :--- |
| `packages/core/src/affiliate-yield-service.mjs` | **MODIFY** | Add `classifyAffiliateDestinationUrl` blocking raw storefront URLs and warning on generic `naver.me` shorteners without network calls. |
| `packages/core/src/public-showcase-projector.mjs` | **MODIFY** | Remove `candidate.whyNow` (`internalNotes`) fallback from `verifiedPros` projection (`BS-61`). |
| `apps/web/application-state.mjs` & `packages/database/src/sqlite-store.mjs` | **MODIFY** | Reserve monotonic non-recycled `cardNumber` at `evidence_ready` for non-synthetic `exact`/`substitute` items; inject `#NNN` into `createDrafts` strictly when `candidate.affiliate === true`; bind `verifiedPros` & `verifiedLimitation` into `materialRevision`, `evidencePacket`, and `fenceUntrustedPayload`; expose advisory `advisoryYield` & rolling `portfolioMix` (`0/0 -> NOT_MEASURED`) outside `selectFirstScreen`. |
| `apps/web/{index.html,app.js,styles.css,showcase.html,showcase.js}` | **MODIFY** | Move `verifiedPros` & `verifiedLimitation` outside `#affiliate-fields`; add advisory yield/ratio badges; replace `/showcase` `'마크다운 복사'` with `${origin}/showcase/001` card-link copy, exact/suffix hostname store CTA label, and HTTPS non-loopback anchor `referrerpolicy="origin"`. |
| `tests/commercial-funnel-and-showcase-integrity.test.mjs` | **MISSING -> ADD** | Calibrated unit & E2E (`sqlite` + `json`) tests for `#NNN` reservation, non-commercial solicitation-free drafts, raw-storefront `Guardian` block, `naver.me` warning, `verifiedPros` `materialRevision` staleness & zero-`whyNow` projection, and `/showcase` link/referrer rules. |

## 4. Success, Non-Goals & Stop Conditions

- **Non-Goals:** Live external API calls remain disabled (`externalPublishingEnabled: false`, `ready: false`); copy-engine rewrite and `reconfirm_showcase_snapshot` belong to `Slice H`.
- **Completion Proof:** `npm run verify && npm run orchestra:demo` exit `0`, `360x740` & `1440x900` real browser hit-testing passes with `0px` horizontal overflow, and PR #31 + `main` GitHub Actions pass.
