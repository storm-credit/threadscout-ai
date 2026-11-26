# ThreadScout AI — Watch Candidate Ledger (`os-intake`)

> **Rule:** One entry per finding. Evidence classes follow `os-intake` §3 (`measured` / `reported` / `demonstrated` / `claimed`). Every candidate carries an explicit expiry (`<= 90` days from `Date seen`). Promoting a candidate requires an owner-approved change in its target authority, citing the primary evidence rather than this ledger.

---

### `WC-20261127-01` — Meta Threads API has no Direct Message (DM) endpoint
- **Source:** Meta Threads Developer Docs & partner platform documentation (CreatorFlow, SocialBiz/Cresclab, Social-API; cross-checked `2026-11-27` against NotebookLM `e11217e3-f43b-4e9e-b7b1-0125c2dd9441` source `2a1d9423`).
- **Date seen:** `2026-11-27`
- **Track:** `platform-api`
- **Claim:** Official Meta Threads Graph API supports post publishing, public reply management, keyword/tag search, and insights, but exposes no Direct Message (DM) read/send endpoint; ManyChat and SocialBiz cannot send automated Threads DMs.
- **Evidence class:** `reported`
- **What it touches:** `docs/spec/MASTER_SPEC.md`, `docs/spec/PLATFORM_DECISION.md`, `docs/spec/PUBLISHING_SPEC.md`
- **Why it might matter:** Prevents designing a broken "comment keyword for Threads DM link" commercial funnel and motivates the Option B Public Verified Showcase (`#NNN`) surface.
- **Status:** `accepted` (promoted into `MASTER_SPEC.md`, `PLATFORM_DECISION.md`, and `PUBLISHING_SPEC.md` `2026-11-27`)
- **Expires:** `2027-02-25`

---

### `WC-20261127-02` — Coupang Partners Open API requires ₩150,000 sales approval and caps Search API at 10 req/hr
- **Source:** Coupang Partners developer/guide documentation reports (`2025–2026` web verification, `2026-11-27`).
- **Date seen:** `2026-11-27`
- **Track:** `affiliate-policy`
- **Claim:** Coupang Partners API key issuance requires cumulative sales `>= ₩150,000` followed by channel review approval, and the Product Search API enforces a ceiling of `10` requests per hour (`50`/hr on Report API).
- **Evidence class:** `reported`
- **What it touches:** `docs/spec/AFFILIATE_SPEC.md`, `docs/spec/MASTER_SPEC.md`
- **Why it might matter:** A launch architecture assuming Day-1 automated Coupang product search will fail closed until `₩150,000` sales are cleared and must support manual short-URL + snapshot entry plus a `<= 10/hr` rate limiter.
- **Status:** `accepted` (promoted into `AFFILIATE_SPEC.md` v1.2 `2026-11-27`)
- **Expires:** `2027-02-25`

---

### `WC-20261127-03` — Naver Shopping Connect / Brand Connect offers 5–20%+ commission with no public Open API
- **Source:** Naver Shopping Connect / Brand Connect market & developer reports (`2025–2026` web verification, `2026-11-27`).
- **Date seen:** `2026-11-27`
- **Track:** `affiliate-policy`
- **Claim:** Seller-configured commissions in Naver Shopping Connect / Brand Connect typically span `5–20%+` (vs `1–3%` on Coupang Partners), but Naver provides no official external Open API for affiliate link generation; unofficial Playwright/HTML scrapers break on session/CAPTCHA gates and risk account penalties.
- **Evidence class:** `reported`
- **What it touches:** `docs/spec/AFFILIATE_SPEC.md`, `CLAUDE.md` §12, `docs/spec/ACCEPTANCE_TESTS.md` (`AT-47`)
- **Why it might matter:** Materially improves per-conversion unit economics while requiring strict human link-issuance + `Verifier` snapshot verification without scraping.
- **Status:** `accepted` (promoted into `AFFILIATE_SPEC.md` v1.2 `2026-11-27`)
- **Expires:** `2027-02-25`

---

### `WC-20261127-04` — KFTC & affiliate program rules require top-of-post (offset-`0`) verbatim disclosure
- **Source:** NotebookLM `e11217e3-f43b-4e9e-b7b1-0125c2dd9441` (`8f324164`, `b275860a`) and KFTC endorsement disclosure guidelines (`2026-11-27`).
- **Date seen:** `2026-11-27`
- **Track:** `affiliate-policy`
- **Claim:** Affiliate economic-interest disclosures placed at the bottom of a post or omitted on indirect solicitation posts violate KFTC visibility standards and Coupang Partners terms; statutory wording must appear at the entry point of each commercial surface.
- **Evidence class:** `reported`
- **What it touches:** `docs/spec/AFFILIATE_SPEC.md`, `docs/spec/FINAL_BLIND_SPOT_SWEEP.md` (`BS-60`), `docs/spec/ACCEPTANCE_TESTS.md` (`AT-45`)
- **Why it might matter:** Requires `Guardian` deterministic code to block any direct-link or `#NNN` showcase-soliciting draft lacking verbatim disclosure at code-point offset `0`.
- **Status:** `accepted` (promoted into `AFFILIATE_SPEC.md` v1.1 & `AT-45` `2026-11-27`)
- **Expires:** `2027-02-25`

---

### `WC-20261127-05` — Meta Muse, Pickle AI (`pickle.com`), and OpenClaw operational/ToS/security limits
- **Source:** NotebookLM `e11217e3-f43b-4e9e-b7b1-0125c2dd9441` (`7aeb0731`, `15c8c363`, `96fd0d5c`, `348c32b9`) cross-checked via web search (`2026-11-27`).
- **Date seen:** `2026-11-27`
- **Track:** `external-agents`
- **Claim:** Meta Muse (`Muse Spark 1.3`) is geo-restricted outside US/CA/AU/SG, lacks Korean commerce connectors, and is blocked by Amazon; Pickle AI (`pickle.com`) uses non-API headless browser CUA blocked by Naver, Kakao, Korean telcos, and Korail; OpenClaw carries RCE/indirect-prompt-injection exposure and corporate network bans at Naver, Kakao, and Karrot.
- **Evidence class:** `reported`
- **What it touches:** `docs/DECISION_LOG.md` (`2026-11-27` tool-rejection decision)
- **Why it might matter:** Prevents adopting external CUA/VM runtimes that violate `CLAUDE.md` §12 or endanger real-name Korean platform accounts.
- **Status:** `accepted` (recorded as rejected alternatives in `DECISION_LOG.md` `2026-11-27`)
- **Expires:** `2027-02-25`

---

### `WC-20261127-06` — Korean prose anti-AI-slop empirical markers (`C-8`, `C-11`, `D-8`, `A-8`, `D-12`)
- **Source:** NotebookLM `2e5c5c7a-5d89-417a-95ec-ad3a66c7a345` (`[공용 스킬 감사] 윤문체·번역체·AI문체·설명충 수집·교차검증실`, sources `db4f0e40`, `0f4d885b`, `54a877a4`, `2026-11-27`).
- **Date seen:** `2026-11-27`
- **Track:** `korean-style`
- **Claim:** Corpus comparisons report strong AI over-representation on (1) serial negative antithesis `단순히 A가 아니라 B다` (`9.2–18x`, though single isolated human occurrences exist at `1.7%` of docs — ban serial `2+` per short post rather than zero-tolerance on single literal contrast), (2) comma immediately after Korean connective endings `-고,/-며,/-지만,/-면서,` (`4.84x`), (3) cleft openers `중요한/필요한/핵심은 ~이다` (`~10x`), (4) double passives `~되어지다/~보여지다`, and (5) empty challenge headers `그러나 한계도 분명하다.` as standalone sentences.
- **Evidence class:** `reported`
- **What it touches:** `docs/spec/CONTENT_OUTPUT_SPEC.md`, future Slice 1 code in `packages/core/src/guardian-checks.mjs` and `packages/orchestra/src/prompts.mjs`
- **Why it might matter:** Supplies falsifiable deterministic detectors (with `stays-quiet` thresholds preventing false positives on legitimate negations like `같은 제품이 아니라 대체품입니다`) for Korean Threads drafts without adding a 7th style agent.
- **Status:** `briefed` (design boundary added to `CONTENT_OUTPUT_SPEC.md`; runtime detector implementation pending Slice 1 code approval)
- **Expires:** `2027-02-25`
