# ThreadScout AI — External Watch Source Register (`os-intake`)

> **Invariant (`os-intake`):** Files under `docs/watch/` are **non-canonical watch artifacts**. Intake never edits `docs/spec/`, `CLAUDE.md`, prompts, or runtime code directly (`declared, not enforced` process rule; promotion requires an explicit owner-approved task branch under `TRACEABILITY_MATRIX.md` change control).

## Companion Non-Canonical Synthesis Lab (NotebookLM)

- **Notebook Title:** `[ThreadScout 워치] 스레드 커머스·신박템 전환·API 정책·탈AI 문체 랩 (비정본, 2026-11-27)`
- **Notebook UUID:** `c1a08bb9-d265-4f8f-b896-03a583748cdb`
- **URL:** https://notebooklm.google.com/notebook/c1a08bb9-d265-4f8f-b896-03a583748cdb
- **Role:** Design-time and strategy-time cross-source synthesis only. Never called inside `packages/orchestra` runtime execution.

## Tracks

| Track ID | What counts as a finding | Promotion destination (owner-gated) | Candidate max TTL |
|---|---|---|---|
| `platform-api` | Versioned scope, endpoint, rate-limit, webhook, or DM/reply capability diffs on Meta Threads or NAVER API HUB | `docs/LIVE_SOURCE_REVIEW.md`, `packages/orchestra/src/live-source-registry.mjs`, `docs/spec/PUBLISHING_SPEC.md` | 90 days |
| `affiliate-policy` | Statutory disclosure rules (KFTC), Coupang Partners API/program gates, Naver Shopping Connect / Brand Connect terms | `docs/spec/AFFILIATE_SPEC.md`, `packages/core/src/guardian-checks.mjs` | 90 days |
| `external-agents` | Security, ToS-blocking, CUA/API boundary, or cost findings on external agent products/frameworks | `docs/DECISION_LOG.md`, `docs/BLIND_SPOTS.md` | 90 days |
| `korean-style` | Empirically measured Korean AI-slop / translationese markers and false-positive (`stays-quiet`) caveats | `docs/spec/CONTENT_OUTPUT_SPEC.md`, `packages/orchestra/src/prompts.mjs`, `packages/core/src/guardian-checks.mjs` | 90 days |

## Registered Sources & Reproducible Baselines

| Source ID | Class | Canonical URI | Track | Baseline fingerprint (`2026-11-27`, newly registered, not yet differenced) |
|---|---|---|---|---|
| `SRC-01` | Versioned docs | `https://developers.facebook.com/docs/threads/` (`https://developers.facebook.com/docs/threads/keyword-search/`, `/posts`, `/threads-media`, `/insights`) | `platform-api` | `fingerprint: meta-threads-graph-v1-2026-11-27` (`threads_basic`, `threads_content_publish`, `threads_manage_insights`, `threads_manage_replies`, `threads_keyword_search`; `0` DM endpoints) |
| `SRC-02` | Versioned docs | `https://api.ncloud-docs.com/docs/naver-api-hub-overview` (`/search-trend/v1/search`, `/shopping/v1/category/keyword/device`) | `platform-api` | `fingerprint: naver-apihub-v1-2026-11-27` (`naverapihub.apigw.ntruss.com`; relative trend ratios) |
| `SRC-03` | Versioned policy / docs | `https://www.ftc.go.kr` (추천·보증 등에 관한 표시·광고 심사지침), `https://partners.coupang.com`, `https://brandconnect.naver.com` | `affiliate-policy` | `fingerprint: kr-affiliate-kftc-2026-11-27` (entry-surface offset-`0` disclosure; Coupang API `>= ₩150,000` sales gate + `10/hr` search cap; Brand Connect `0` public Open APIs) |
| `SRC-04` | Practitioner / media corpus | `https://notebooklm.google.com/notebook/e11217e3-f43b-4e9e-b7b1-0125c2dd9441` (`source_count=38`, `modified_at=2026-11-26T15:14:13Z`) | `external-agents` | `fingerprint: nlm-e11217e3-38src-20261126T151413Z` (Meta Muse `Muse Spark 1.3`, Pickle CUA blocks, OpenClaw RCE advisories) |
| `SRC-05` | Empirical style corpus | `https://notebooklm.google.com/notebook/2e5c5c7a-5d89-417a-95ec-ad3a66c7a345` (`source_count=114`, `modified_at=2026-11-26T16:06:27Z`) | `korean-style` | `fingerprint: nlm-2e5c5c7a-114src-20261126T160627Z` (markers `C-8`, `C-11`, `D-8`, `A-8`, `D-12`, `A-15`, `A-19`, `A-21`, `D-4`, `D-10`, `E-2` + `stays-quiet` guards) |
| `SRC-06` | Empirical style corpus | `https://notebooklm.google.com/notebook/e9480cf6-da4d-40f2-96ba-c93f58cce027` (`source_count=11`, `modified_at=2026-11-26T14:11:30Z`) | `korean-style` | `fingerprint: nlm-e9480cf6-11src-20261126T141130Z` (2-stage anti-AI review: downward plain-verb simplification, post-hoc commentary deletion, physical grounding) |
