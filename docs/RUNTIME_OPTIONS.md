# Model Runtime Options — Four Designs

| Option | Design | Benefit | Largest risk | Decision |
|---|---|---|---|---|
| A. Direct provider calls | Each agent calls one vendor SDK directly | Fast initial wiring | provider lock-in, duplicated retries, weak audit | reject |
| B. Provider-neutral adapter | One runtime interface wraps prompts, schemas, budgets, receipts, and provider adapters | testable and replaceable | custom boundary must stay small | **select** |
| C. Full agent framework now | Adopt a framework for handoffs, tools, tracing, and state | many features included | dependency/runtime mismatch and hidden behavior | defer |
| D. Durable workflow queue now | Each stage is a persisted job with workers | strongest crash recovery | infrastructure too early | defer until live operations |

## Selected design

Option B is selected. The six roles and state machine remain framework-neutral. A runtime receives agent ID, system prompt, output schema, and structured input; it returns one validated artifact and an invocation receipt.

The first provider is `replay`, not a live model. It proves the boundary, budgets, schema enforcement, and end-to-end execution without credentials or cost.

## Required runtime behavior

- exactly six agent budgets
- per-agent timeout, attempt, input, and output limits
- total invocation, elapsed-time, and output limits
- one prompt and one output schema per agent
- semantic and schema validation before state progression
- provider/agent/run/attempt usage receipts
- no hidden agent-to-agent calls
- no publication tool
- deterministic replay support for tests and incident reproduction

## Migration rule

A future live provider adapter may be added behind the same interface. It may not alter the roster, bypass Guardian/human gates, weaken schema checks, or receive an external publishing tool.
