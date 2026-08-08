# Decision Log

## 2026-08-08 — Repository working name

Use `threadscout-ai` and `ThreadScout AI`.

---

## 2026-08-08 — Approval-first B+C hybrid

Use a personal approval dashboard first, then discovery and learning. Truth, exact identity, rights, Guardian review, and human approval precede automation.

---

## 2026-08-08 — Fixed six-agent orchestra

Use Orchestrator, Product Scout, Evidence Verifier, Content Strategist, Threads Writer, and Integrity Guardian. Price is Verifier evidence, not an agent.

---

## 2026-08-08 — Practical demonstrable novel items

Select 실용 시연형 신박템 after comparing four niche options. Problem clarity, demonstration, and utility receive 60% of the score.

---

## 2026-08-08 — Provider-neutral replay runtime

Select a provider-neutral interface and deterministic replay after four runtime options. Add budgets, receipts, schema checks, and strict tool brokerage before live models.

---

## 2026-08-08 — Content-addressed JSONL evidence store

Select local content-addressed objects and per-run hash-chained JSONL after comparing in-memory, JSONL, SQLite, and managed database options.

---

## 2026-08-08 — Read-only fixture research before live sources

Select a fixture-first read-only adapter contract after four options. Prove source policy, privacy, provenance, rights, timestamps, role boundaries, normalization, persistence, and invalidation before live data.

---

## 2026-08-08 — Prepare Threads + NAVER source stack without activation

### Four options

1. Threads official API only
2. Threads official API plus NAVER API HUB trends and manual fallback
3. Google Trends-led research
4. scraping/commercial aggregator

### Decision

Select option 2 as the future source stack, but keep every network source disabled.

### Source dispositions

- Meta Threads Keyword Search: selected primary discovery
- NAVER API HUB Search Trend/Shopping Insight: selected secondary trend signal
- Google Trends API alpha: deferred limited access
- Coupang Seller Open API: rejected for general affiliate discovery
- manual user evidence: enabled offline fallback

### Reason

Threads is closest to the target content platform, while NAVER provides a separate Korean search/click trend signal. Neither source alone proves exact product identity. Google access is not generally available, and Coupang's documented seller API does not match arbitrary affiliate-product discovery.

### Impact

- source registry stores endpoint, credential-name, permission, purpose, owner, official-reference, and readiness metadata
- credentials alone cannot activate a source
- explicit human activation approval and a code change are required
- request builders are redacted and execution-disabled
- no live source, model, affiliate, or publishing call is made

### Remaining risks

- Meta permission availability/review and rate limits require account-specific confirmation
- NAVER credentials, quotas, cost, and category mapping require NCP setup
- live-source privacy and retention need production-grade redaction
- exact product and commerce verification still needs an authorized listing source or manual evidence
