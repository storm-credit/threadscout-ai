# Phase 2C Plan — Provider-Neutral Runtime and Tool Boundary

## Goal

Execute the fixed six-agent orchestra through a provider-neutral runtime with replay fixtures, per-agent budgets, invocation receipts, and strict tool allowlists before connecting a live model or research source.

## Success criteria

1. Runtime configuration covers exactly six agents.
2. Each agent has timeout, attempt, input-character, and output-character budgets.
3. A total run budget limits invocation count, elapsed time, and output size.
4. Replay runtime uses the same prompts and schemas intended for a future live provider.
5. Every output passes semantic and schema validation before state changes.
6. Every model invocation produces an auditable receipt.
7. Tool broker rejects non-allowlisted tools.
8. Tool broker blocks publication, purchase, payment, and similar external actions.
9. The replay executor completes all six agents, Guardian pass, human approval, and local-only queue.
10. Oversized or malformed replay output fails safely.
11. User rejection produces no queue record.

## Non-goals

- live LLM calls
- API keys
- live search or scraping
- real product or affiliate data
- persistent job queue
- external publishing

## Stop conditions

- a provider requires weakening the output schema
- runtime needs a seventh agent
- a tool cannot be isolated to an existing agent allowlist
- retries would exceed the existing orchestration limits
- fixture data would be confused with current market evidence
- external credentials or irreversible actions become necessary

## Verification

```bash
npm run verify
npm run orchestra:replay
```
