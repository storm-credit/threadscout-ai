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
- **Status:** `accepted` (promoted into `CONTENT_OUTPUT_SPEC.md` & `guardian-checks.mjs` `2026-11-27`)
- **Expires:** `2027-02-25`

---

### `WC-20261127-07` — Raw storefront URL 0-KRW commission leak, `naver.me` generic shortener caveat, and outbound affiliate `rel` / `Referer` rules
- **Source:** NotebookLM `e11217e3-f43b-4e9e-b7b1-0125c2dd9441` (`8f324164`, `b275860a`) cross-checked against `AFFILIATE_SPEC.md` (`2026-11-27`).
- **Date seen:** `2026-11-27`
- **Track:** `affiliate-policy`
- **Claim:** Pasting raw storefront product URLs (`www.coupang.com/vp/...`, `smartstore.naver.com/...`) instead of partner-issued tracking links yields `0 KRW` settled commission, `naver.me` is a generic shortener (not proof of Brand Connect issuance), and outbound affiliate anchors use `rel="noopener sponsored nofollow"` from registered channels.
- **Evidence class:** `reported`
- **What it touches:** `docs/spec/AFFILIATE_SPEC.md`, `docs/spec/PLATFORM_DECISION.md`, `packages/core/src/affiliate-yield-service.mjs`, `apps/web/showcase.js`
- **Why it might matter:** Prevents silent `0 KRW` commission leakage while keeping `CLAUDE.md` §12 zero-redirect-fetching intact.
- **Status:** `accepted` (promoted into `AFFILIATE_SPEC.md` v1.3 & `PLATFORM_DECISION.md` `2026-11-27`)
- **Expires:** `2027-02-25`

---

### `WC-20261127-08` — Novelist / `im-not-ai` / 2-stage anti-AI Korean prose extensions (`A-15`, `A-19`, `A-21`, `D-4`, `D-10`, `E-2`) & `stays-quiet` protections
- **Source:** NotebookLM `2e5c5c7a-5d89-417a-95ec-ad3a66c7a345` (`db4f0e40`, `54a877a4`, `7220b613`, `ea4d11ac`, `af810c12`) and `e9480cf6-da4d-40f2-96ba-c93f58cce027` (`97d809ab`, `6996c6a6`, `2026-11-27`).
- **Date seen:** `2026-11-27`
- **Track:** `korean-style`
- **Claim:** Corpus measurements report `0` human occurrences out of `60` docs on `단순한 X를 넘어 Y` (`A-21`) and `~로 이어진다 / ~에 직결된다` (`D-9`), elevated LLM density on sentence-final inverted `~이유다` (`D-10`), stacked particles `-에서의/-에로의/-으로의/-에의/-으로부터의/-로부터의/-에 있어서` (`A-19`), abstract-buzzword `제공하-` (`A-15`), and hype adjectives (`혁신적인/획기적인/전례 없는`, `D-4`); conversely, humans use `~에 대해` `3x` more than AI (`4.39` vs `1.46` per 1k eojeol), plain `~의` is native Korean, and capability hedging `~할 수 있다` preserves factual spec bounds.
- **Evidence class:** `reported`
- **What it touches:** `docs/spec/CONTENT_OUTPUT_SPEC.md` v1.3, `packages/core/src/guardian-checks.mjs`, `apps/web/application-state.mjs`
- **Why it might matter:** Upgrades both deterministic `Writer` templates (disqualification hook + middle-sentence cadence `E-2` + plain-verb physical grounding) and `Guardian` `KOREAN_AI_SLOP` checks without false positives on statutory disclosures (`수수료를 제공받습니다`), warranties (`보증을 제공합니다`), or technical specs.
- **Status:** `accepted` (promoted into `CONTENT_OUTPUT_SPEC.md` v1.3 `2026-11-27`)
- **Expires:** `2027-02-25`

---

### `WC-20261127-09` — Threads reply-view share (~50%) & 70–80% non-commercial portfolio mix guideline
- **Source:** NotebookLM `e11217e3-f43b-4e9e-b7b1-0125c2dd9441` (`109b2d09`, `31176057`, `7a4d712e`, `2026-11-27`).
- **Date seen:** `2026-11-27`
- **Track:** `platform-api`
- **Claim:** Meta creator analysis reports nearly half of Threads views come from replies/conversations, and Korean channel health reports recommend `70–80%` informational vs `20–30%` commercial post ratios (`1:3~1:5`).
- **Evidence class:** `reported`
- **What it touches:** `docs/spec/CONTENT_OUTPUT_SPEC.md` v1.3, `apps/web/application-state.mjs`
- **Why it might matter:** Supports non-incentivized usage-context closing questions within `<= 500` chars and an advisory rolling commercial-post ratio indicator (`0/0 -> NOT_MEASURED`, never a daily quota per `BS-57`).
- **Status:** `accepted` (promoted into `CONTENT_OUTPUT_SPEC.md` v1.3 `2026-11-27`)
- **Expires:** `2027-02-25`
