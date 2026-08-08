# Architecture

## Direction

Approval-first application using a fixed six-agent orchestra, provider-neutral runtime, versioned evidence store, and source-specific readiness gates.

```text
source registry + readiness gate
      ↓
read-only adapter (currently fixture only)
      ↓
validated source records + content hashes
      ↓
Product Scout candidate evidence
      ↓
Evidence Verifier exact-product package
      ↓
Strategist → Writer → Guardian
      ↓
explicit human approval → local-only scheduler
```

Only Orchestrator delegates. Specialists cannot publish.

## Source registry

Every future source records:

- use-case disposition
- agent ownership
- official references and review date
- host, endpoint, method, and data semantics
- required credential variable names and permissions
- readiness requirements
- human activation requirement
- enabled/network/mutation state

Credential values are never returned by readiness reports or committed to Git.

## Selected source stack

- Threads Keyword Search: primary social/product-discussion discovery
- NAVER API HUB trends: secondary Korean search/click signal
- manual user evidence: offline fallback
- Google Trends alpha: deferred
- Coupang Seller Open API: rejected for general affiliate discovery

## Disabled request builders

Request builders validate query modes and endpoints and replace every secret header with `<redacted>`. The execution function always throws in Phase 2F.

## Existing invariant layers

- exactly six fixed agents
- prompt and output-schema validation
- bounded orchestration loops
- Guardian and explicit human gates
- provider-neutral replay budgets and receipts
- strict tool allowlists
- canonical hashes and content-addressed objects
- per-run hash-chained events
- read-only fixture research and cross-source evidence

## Activation sequence

1. User selects one source to activate.
2. Account/application and permissions are completed outside Git.
3. Quota, cost, privacy, retention, fields, and error handling are confirmed.
4. Credentials are configured in a secret manager or local environment.
5. Source-specific contract tests run against an approved test account.
6. A pull request changes only that source's network flag and tool handler.
7. Guardian/human/publishing gates remain unchanged.
