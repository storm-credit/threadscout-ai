# Architecture

## Direction

Approval-first application using a fixed six-agent orchestra, provider-neutral runtime, deterministic state machine, and versioned evidence store.

```text
User objective
      ↓
Runtime executor
      ↓
Provider adapter + fixed prompt + output schema + budgets
      ↓
Orchestrator → Scout → Verifier → Strategist → Writer → Guardian
      ↓
Semantic + schema validation
      ↓
Version metadata + content-addressed persistence
      ↓
Guardian pass → Human approval
      ↓
Deterministic local scheduler
```

Only Orchestrator delegates. Specialists return artifacts to Orchestrator and cannot publish.

## Fixed layers

### Six-agent registry

Exactly six roles with missions, ownership, tool allowlists, forbidden actions, and stop conditions. Scheduler, publisher adapter, metrics collector, and audit log remain deterministic services.

### Prompt and schema layer

Each role has one system prompt and one output schema. Schema validation supplements semantic validation.

### Orchestration state machine

The state machine owns stage order, one optional Scout refinement, two Writer revisions, total invocation ceiling, Guardian gate, human gate, and local queue transition.

### Provider-neutral runtime

A provider receives agent ID, run ID, prompt, output schema, and structured input. It returns one artifact and one receipt. The current provider is deterministic replay. A provider cannot change the roster, gates, or publication policy.

### Tool broker

Every tool call is checked against the agent registry and a registered handler. Publication, purchase, payment, and equivalent external-action tools are denied.

## Phase 2D persistence

### Canonical hashing

Objects are serialized with recursively sorted object keys and hashed with SHA-256. This allows identical logical content to share one storage address.

### Version manifest

The runtime manifest contains:

- roster hash
- six prompt hashes
- six schema hashes
- manifest hash

### Artifact metadata

Persisted artifacts include:

- format version and agent ID
- manifest, prompt, and schema hashes
- parent artifact hashes
- current evidence hash
- artifact integrity hash

A changed prompt/schema/manifest or evidence hash can mark an artifact stale even when its text has not changed.

### Content-addressed objects

Sanitized sources and versioned artifacts are stored under paths derived from their content hashes. Stored objects are rehashed when read.

### Append-only run events

Each run has an isolated JSONL stream. Events include sequence, previous-event hash, payload hash, and event hash. Mutation or reordering is detectable.

### Concurrency boundary

Writes are serialized per run inside one process. This does not provide distributed or multi-process transaction guarantees. SQLite is the next local durability candidate before worker concurrency.

## Evidence boundary

Scout proposes candidates. Verifier confirms canonical product, exact product identity, claims, media rights, personal-use status, and timestamped commerce evidence. Fixture values remain synthetic.

## Next implementation order

1. Source and evidence-record schemas
2. Claim-to-source indexes and artifact invalidation graph
3. Read-only fixture research adapter
4. SQLite compatibility/migration interface
5. Live source policy, recency, rate-limit, and retention review
6. Live model provider review
7. Publishing only after separate explicit approval
