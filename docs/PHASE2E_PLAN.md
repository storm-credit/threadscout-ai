# Phase 2E Plan — Read-Only Fixture Research and Source Evidence

## Goal

Define the source/evidence contract and prove that Product Scout and Evidence Verifier can use strictly authorized read-only research tools without connecting to a real network source.

## Success criteria

1. Research policy explicitly disables network and mutation.
2. Only `fixture:` URLs and approved fixture source types are accepted.
3. Source records contain version, source type, URL, title/excerpt, observed/retrieved time, policy, rights, retention, redaction, product mentions, purchase signals, and content hash.
4. Source tampering is detected.
5. Raw payload and personal-data storage are disabled.
6. Fixture adapter returns deterministic results and refuses writes.
7. Scout can call search/trend/normalization tools through the broker.
8. Verifier can call listing, cross-source, rights, and commerce-snapshot tools.
9. Writer cannot call public research tools.
10. Candidate evidence groups observation and listing records without declaring a match from one source.
11. Exact-match readiness requires brand, model, variant, a listing, and at least two source types.
12. Sources are persisted in the content-addressed store with valid event chains.
13. Dependency index can propagate invalidation from evidence-linked artifacts to children.
14. No live URL, API, model, affiliate action, or publication is introduced.

## Non-goals

- live Threads keyword search
- retailer or Coupang API integration
- Google Trends or third-party trend feeds
- website scraping
- personal-data collection
- copying full third-party posts or media
- external publishing

## Stop conditions

- a source requires bypassing terms, robots, authentication, or rate limits
- a useful field cannot be collected without personal data
- exact product identity would rely on one unverified source
- media reuse rights remain unclear
- a writing or strategy agent needs direct browsing
- live credentials or cost become necessary
- source records cannot preserve observed time and provenance

## Verification

```bash
npm run verify
npm run research:fixture
```
