# ThreadScout AI

Approval-first product discovery and content operations for Threads.

## Direction

The primary niche is **실용 신박템**: products with an unexpected mechanism that solve a visible everyday problem and can be demonstrated quickly. Novelty alone is not enough.

## Current phase

Phase 2F prepares official live-source contracts without enabling them.

The repository now contains:

- fixed six-agent orchestra
- six prompts and output schemas
- provider-neutral replay runtime and strict tool broker
- practical-novelty scoring
- versioned content-addressed evidence/artifact store
- hash-chained run events and stale-artifact detection
- deterministic fixture research
- live-source registry and redacted readiness reports
- disabled Threads and NAVER request builders

No live model, social/product/trend API, affiliate integration, or publication is enabled.

## Source readiness decision

- Primary future discovery: Meta Threads Keyword Search
- Secondary Korean trend corroboration: NAVER API HUB Search Trend and Shopping Insight
- Deferred: Google Trends API alpha
- Rejected for general affiliate discovery: Coupang Seller Open API
- Enabled fallback: manually supplied product/source references, with no network action

Every network source remains disabled and requires credentials outside Git, completed source-specific checks, explicit human activation approval, and a separate code change.

## Fixed agents

1. Orchestrator
2. Product Scout
3. Evidence Verifier
4. Content Strategist
5. Threads Writer
6. Integrity Guardian

There is no price agent. Commerce facts belong to Evidence Verifier.

## Commands

```bash
npm run verify
npm run research:fixture
npm run research:readiness
npm run orchestra:simulate
npm run orchestra:replay
npm run orchestra:store
npm start
```

## Key Phase 2F files

- `live-source-registry.mjs` — source purpose, status, credentials, permissions, references, and activation gates
- `source-readiness.mjs` — secret-safe preflight reporting
- `disabled-live-adapters.mjs` — redacted request builders that cannot execute
- `docs/LIVE_SOURCE_REVIEW.md` — official source findings
- `docs/LIVE_SOURCE_OPTIONS.md` — four source-stack options and selection

## Next gate

The codebase has reached the credential/live-data boundary. Enabling Meta Threads or NAVER API HUB requires account-specific credentials, permission/quota confirmation, explicit activation approval, and a new pull request. External publishing remains a separate later gate.
