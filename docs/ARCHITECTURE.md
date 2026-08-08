# Architecture

## Direction

Approval-first application using a fixed six-agent orchestra, provider-neutral model boundary, and deterministic state machine.

```text
User objective
      ↓
Runtime executor
      ↓
Provider adapter + fixed prompt + output schema + budgets
      ↓
Orchestrator → Scout → Verifier → Strategist → Writer → Guardian
      ↓
Semantic contract + schema validation
      ↓
Human approval
      ↓
Deterministic local scheduler
```

Only Orchestrator delegates. Specialists return artifacts to Orchestrator and cannot publish.

## Layers

### Fixed registry

Six roles, ownership, tool allowlists, forbidden actions, and stop conditions.

### Prompt and schema layer

Six system prompts and six machine-readable output schemas. Schema validation supplements semantic validation.

### State machine

Stage order, conditional Scout skip, one Scout refinement, two Writer revisions, invocation ceiling, Guardian gate, human gate, and local queue.

### Provider-neutral runtime

The runtime receives agent ID, run ID, prompt, output schema, and structured input. It returns one artifact and one receipt. It owns provider-specific timeout and output handling but cannot change role boundaries or workflow gates.

Current provider: `replay`.

### Budget layer

Each of the six agents has:

- timeout
- maximum attempts
- maximum input characters
- maximum output characters

Each run has:

- maximum invocations
- maximum elapsed time
- maximum total output characters

These runtime limits are additional to the orchestration loop limits.

### Tool broker

All tool requests pass through one broker. It checks the agent registry allowlist and registered deterministic handler. Tools containing publication, payment, or purchase behavior are rejected even if misconfigured elsewhere.

### Receipts and audit boundary

Every replay/model invocation records provider, agent, run, attempt, input/output size, status, timestamps, and failure reason. Receipts contain metadata rather than secret-bearing raw prompts.

## Evidence boundary

Scout proposes; Verifier confirms canonical product, exact match, claims, rights, personal-use status, and timestamped commerce snapshot. Fixture values remain synthetic.

## Deterministic services

Scheduler, publisher adapter, metrics collector, and audit log are not agents. Publisher remains disabled.

## Next implementation order

1. Prompt and artifact version hashes
2. Persistent evidence/event store
3. Artifact invalidation when evidence changes
4. Read-only research tool adapter with source recency and access controls
5. Replay fixtures from recorded sanitized runs
6. Live model adapter after provider review
7. Publishing only after a separate permission and safety gate
