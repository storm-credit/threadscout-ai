# System Architecture v1

Status: DESIGN ONLY. No technology/vendor choice is implied unless named in another approved spec.

## Logical components

```text
Mobile Web UI
    ↓
Application API
    ↓
Orchestrator Service ─────────────── Audit / Run State
    │
    ├─ Agent Runtime (fixed six roles)
    │
    ├─ Evidence & Artifact Store
    │
    ├─ Candidate / Product / Review Store
    │
    └─ Deterministic Services
         ├─ source adapters
         ├─ duplicate checks
         ├─ media registry
         ├─ commercial mapping
         ├─ scheduler
         └─ metrics collector
```

## UI boundary

The UI renders system state and sends explicit user decisions. It does not contain agent authority, evidence classification logic, or hidden publish decisions.

## Application API boundary

The API validates user actions, exposes read models, and forwards state-changing requests to deterministic application services. It never allows the client to manufacture a verified/approved state directly.

## Orchestrator boundary

Orchestrator owns run state, stage transitions, budgets, artifact routing, stale propagation, and human-review gates. Specialist agents are stateless authority workers receiving immutable input refs.

## Persistence boundary

Durable state separates:

- mutable operational records: account settings, candidate state, suppression, schedules
- immutable/versioned records: source/evidence snapshots, agent artifacts, review bindings, audit events

## External-source boundary

Every external source is behind a source-specific adapter and capability/configuration gate. Source data is normalized into internal records before an agent consumes it.

## Scheduling boundary

Scheduled work is performed by a background worker/service, not by a browser session. Preflight re-validates volatile evidence and review bindings before a future external action is eligible.

## Design rule

AI components recommend, classify, verify, strategize, write, and review within their contracts. Durable state transitions, version checks, scheduling, idempotency, and audit are deterministic application responsibilities.
