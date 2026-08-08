# Phase 2F Plan — Live Source Readiness Without Live Execution

## Goal

Convert the official-source review into a validated source registry, redacted preflight report, and disabled request builders while keeping all external network execution off.

## Success criteria

1. Source registry records purpose, disposition, ownership, official references, endpoint metadata, credentials, permissions, readiness requirements, and activation approval.
2. Meta Threads keyword search is selected as primary future discovery.
3. NAVER API HUB trends are selected as secondary Korean trend evidence.
4. Google Trends API alpha remains deferred until access exists.
5. Coupang Seller Open API is rejected for general affiliate discovery.
6. Manual user evidence remains the only enabled fallback and performs no network call.
7. Every network source remains `enabled=false` and `networkEnabled=false`.
8. All sources remain read-only.
9. Readiness reports expose missing environment names and requirements without exposing credential values.
10. Credentials alone cannot activate a source without explicit human approval and a registry change.
11. Disabled Threads and NAVER request builders use redacted headers and refuse execution.
12. Tests verify role ownership, source disposition, secret redaction, disabled network state, and request constraints.

## Non-goals

- creating Meta, NCP, Google, or Coupang accounts
- requesting app review or alpha access
- storing credentials
- making a live HTTP request
- scraping public pages
- live product discovery
- affiliate link generation
- external publishing

## Stop conditions

- a source requires bypassing official access, terms, permissions, or rate limits
- credentials or paid usage are required
- source activation would expose personal data beyond the approved record
- a source's purpose does not match the project use case
- activation would weaken Verifier, Guardian, or human approval gates

## Verification

```bash
npm run verify
npm run research:readiness
```
