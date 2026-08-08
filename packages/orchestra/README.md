# packages/orchestra

Framework-neutral contracts for ThreadScout AI's fixed six-agent orchestra.

## Fixed roster

1. `orchestrator` — routes work, owns state and stopping conditions
2. `scout` — discovers product candidates and demand signals
3. `verifier` — verifies product identity, evidence, rights, and timestamped price/stock/seller snapshots
4. `strategist` — designs audience fit and four distinct content angles
5. `writer` — writes four Korean Threads drafts from verified evidence only
6. `guardian` — performs final integrity, policy, disclosure, rights, and duplication review

There is no dedicated price agent. Price is one evidence field owned by `verifier`.

Scheduling, publishing, metric collection, and audit logging are deterministic services, not agents.

## Modules

- `src/agent-registry.mjs` — immutable roster, responsibilities, tools, prohibitions, and stop conditions
- `src/contracts.mjs` — structured artifact contracts for each handoff
- `src/orchestrator.mjs` — deterministic run plan, stage routing, loop limits, human approval, and local queue gate

## Demo

```bash
npm run orchestra:demo
```

The demo produces a plan only. It does not call an LLM or external API and cannot publish.
