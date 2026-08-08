# Product Research Adapter — Four Options

| Option | Design | Benefit | Largest risk | Decision |
|---|---|---|---|---|
| A. Manual source entry only | User pastes every observation and listing | safest legal/technical boundary | too much daily work and inconsistent records | retain as fallback |
| B. Read-only adapter contract with deterministic fixture source | Prove policy, schemas, tools, normalization, and persistence without network | reproducible and safe | does not prove live-source availability | **select for Phase 2E** |
| C. Direct website/API integrations now | Connect search, Threads, retailers, and trends immediately | real candidates quickly | permissions, terms, robots, rate limits, privacy, and unstable data | block until reviewed |
| D. Commercial research-data provider | One normalized vendor feed | less scraping work | cost, vendor lock-in, opaque provenance, coverage gaps | defer |

## Selected design

Option B is selected. The adapter is read-only, has `networkAllowed=false`, accepts only `fixture:` URLs, stores no raw payload, permits no personal data, and emits validated source records.

## Why fixture-first

A research system can look correct while silently losing provenance, mixing products, retaining personal data, or letting a writing agent browse. Fixture-first implementation tests those boundaries before a live source creates policy or factual risk.

## Required live-source gate

A future live adapter requires a separate decision record for each source covering:

- official or authorized access method
- terms and robots handling
- authentication and minimum permissions
- request and result rate limits
- allowed fields and personal-data redaction
- source timestamps and recency
- retention/deletion rules
- media and excerpt rights
- failure, revocation, and stale-data behavior
- evidence citation and replay strategy

No live source is enabled by Phase 2E.
