# Slice I Plan — Dynamic Showcase Open Graph Preview & `1080×1350` Slide-2 Spec Card PNG Exporter

## 1. Context & Baseline Authority

- **Baseline `main` SHA:** `fb6dfdd` (post-merge of PR #32).
- **Design Authorities:**
  - `docs/spec/PLATFORM_DECISION.md` (closed 9-field `PublicShowcaseCard`, dynamic `/showcase/:cardNumber` Open Graph preview rules, withdrawn-card zero-leak `noindex` rule, and Slide-2 `1080×1350` inspection card PNG rules)
  - `docs/spec/AFFILIATE_SPEC.md` v1.3 (§5 offset-`0` verbatim statutory disclosure across text and visual solicitation surfaces; `BS-60` non-commercial solicitation-free rule)
  - `docs/spec/MEDIA_USAGE_SCENARIOS.md` & `docs/spec/MEDIA_STRATEGY_OPTIONS.md` (`user_owned` / `licensed_commercial` Slide-1 media paired with deterministic Slide-2 spec/limitation card; zero third-party review-photo or viral-clip scraping)
  - `CLAUDE.md` §§2, 5, 7, 8, 12, 14, 16, 18, 20, 21
- **Mapped Requirements, Harness Features, Blind Spots & Acceptance Criteria:**
  - `PR-05`, `PR-16`, `PR-19`, `PR-25`, `PR-26`, `NFR-01`, `NFR-03`, `NFR-08`, `NFR-10`
  - `F25`, `F26`, `F27`
  - `BS-22`, `BS-37`, `BS-60`, `BS-61`
  - `AT-05`, `AT-15`, `AT-17`, `AT-26`, `AT-31`, `AT-34`, `AT-45`, `AT-46`

## 2. Primary Specifications, Rejected Alternatives & Visual Design System (`CLAUDE.md` §16)

1. **Primary Technical References & License Constraints:**
   - *Open Graph Protocol (`ogp.me`) & Meta Sharing Debugger specification:* Social link crawlers require raster `og:image` (`image/png` / `image/jpeg` / `image/webp`) and ignore `image/svg+xml`.
   - *W3C PNG / RFC 2083 (`IHDR`, `PLTE`, `IDAT`, `IEND`, CRC-32 + `zlib` DEFLATE):* Implemented directly via Node built-in `node:zlib` (`deflateSync`, MIT/Node core, zero external npm packages).
   - *W3C Fetch Metadata Request Headers (`Sec-Fetch-Site`, `Sec-Fetch-Mode`, `Sec-Fetch-Dest`):* Cross-site `image` and top-level `navigate`/`document` loads are permitted strictly on stateless `/api/showcase-og.png` and `/api/showcase/:cardNumber/(og.png|card.svg)` while keeping cross-site `fetch('/api/showcase')` JSON blocked (`403`).
   - *Rejected Alternatives:* (a) `satori` / `@resvg/resvg-js` / `sharp` / `canvas` npm packages — rejected to preserve the zero-npm-dependency supply-chain posture (`SECURITY_ARCHITECTURE.md`); (b) SVG-only `og:image` — rejected because Meta/Kakao/Slack crawlers drop SVG link previews; (c) Scraping third-party customer review photos or viral Reels — rejected per `CLAUDE.md` §§2, 8 and `AT-05`/`AT-26`.
2. **Korean Consumer Inspection Tag Visual System (`1080×1350` `4:5` Portrait Slide-2 PNG):**
   - *Palette:* Mineral Paper `#F7F8F6`, Carbon Ink `#141816` (`16.8:1`), Pine Spec `#184E3B` on `#EDF4F0` (`9.4:1`), Crimson Stop `#7A1F16` on `#FCEEEB` (`9.8:1`), Statutory Amber `#3B2600` on `#FFF3D1` (`12.96:1`).
   - *Hierarchy:* Adaptive top-pinned verbatim statutory disclosure banner (`allowEllipsis: false`, monetized cards only, `AT-45`) -> stamp + match badge + canonical product title -> Crimson `✕ 이 조건이면 사지 마세요 · 사기 전 한계` stop box -> Pine `✔ 교차 확인된 핵심 강점` list -> 3-column pre-purchase check strip -> provenance footer (omitting `#NNN` and `/showcase` pointers on non-commercial cards per `BS-60`).

## 3. Module Classification (`CLAUDE.md` §20)

| File / Module | Classification | Responsibility |
| :--- | :--- | :--- |
| `packages/core/src/showcase-og-renderer.mjs` | **MISSING -> ADD** | Fail-closed `PublicShowcaseCard` validator, replacer-callback Open Graph HTML meta injector, raster-only `publishableMediaUrl` check, `1200×630` `node:zlib` `image/png` generator, and `1080×1350` `image/svg+xml` card builder. |
| `apps/web/card-visuals.js` | **MISSING -> ADD** | Shared browser ES module rendering `1080×1350` (`4:5`) Slide-2 inspection PNG via `<canvas>` with fail-closed 9-field validation, non-overlapping adaptive `1..500`-char `AT-45` disclosure banner, `BS-60` non-commercial isolation, and 1-click `.png` download. |
| `apps/web/server.mjs` | **MODIFY** | Inject dynamic Open Graph meta tags on `GET|HEAD /showcase` and `/showcase/:cardNumber` (with trailing-slash normalization and `Vary: Host`); serve `GET|HEAD /api/showcase-og.png`, `/api/showcase/:cardNumber/og.png`, and `/api/showcase/:cardNumber/card.svg`; allowlist `/apps/web/card-visuals.js`. |
| `apps/web/operator-auth.mjs` | **MODIFY** | Exempt stateless `GET|HEAD` cross-site `Sec-Fetch-Dest: image` and `navigate`/`document` loads on exact `/api/showcase-og.png` and `/api/showcase/:cardNumber/(og.png|card.svg)` while keeping `/api/showcase` JSON blocked (`403`). |
| `apps/web/application-state.mjs` | **MODIFY** | Expose projected closed 9-field `showcaseCard` alongside `showcaseProjected` in `toCandidateReadModel` so Studio PNG export consumes the exact public projection. |
| `apps/web/{index.html,app.js,showcase.html,showcase.js}` | **MODIFY** | Add `#download-slide-png` in Operator Studio Step 3, responsive `.cta-row` + `[data-download-png]` and safe `decodeURIComponent`/trailing-slash routing on `/showcase`, and 2-slide media workflow guidance in Step 1. |
| `packages/core/src/public-showcase-projector.mjs` & `packages/database/src/sqlite-store.mjs` | **MODIFY** | Align exact `remainingMs <= 0` (`nowMs - verifiedMs >= ttlMs` / `expires_at > ?`) showcase TTL withdrawal boundary across projector, SQLite, and Studio expiry helper. |
| `tests/visual-og-and-slide-card-export.test.mjs` | **MISSING -> ADD** | Calibrated unit & E2E (`sqlite` + `json` + `public_showcase`) tests for PNG binary `IHDR` `1200×630`, `$&`/`` $` ``/`$$` replacement safety, cross-site `Sec-Fetch-Site` image vs JSON `stays-quiet`, non-BMP `wrapSvgLines`, 500-char non-overlap, raster media check, `HEAD` parity, and `stale`/TTL/kill-switch withdrawal. |

## 4. Success, Non-Goals & Stop Conditions

- **Non-Goals:** External live APIs, CUA/scraping, third-party npm packages, and automated publishing remain disabled (`externalPublishingEnabled: false`, `ready: false`).
- **Completion Proof:** `npm run verify && npm run orchestra:demo` exit `0`, real browser `360x740` & `1440x900` verification of `1080×1350` PNG generation + `/showcase/001` OG tags passes, independent `maos-critic` reaches `0` blockers, and PR #33 + `main` GitHub Actions pass.
