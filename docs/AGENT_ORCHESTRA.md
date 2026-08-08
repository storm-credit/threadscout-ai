# Fixed Six-Agent Orchestra

## Constitution

ThreadScout AI uses exactly **six agents in total, including the orchestrator**. The roster is fixed:

1. Orchestrator
2. Product Scout
3. Evidence Verifier
4. Content Strategist
5. Threads Writer
6. Integrity Guardian

A seventh agent, dynamically generated agent, or separate price agent may not be introduced without explicit user approval, a four-option architecture review, a decision-log entry, and updated contract tests.

The roster is fixed, but every agent does not have to run on every request. The orchestrator may skip an unnecessary stage—for example, Product Scout when the user supplies an exact product—but it cannot invent a new specialist.

## Why six

The responsibilities separate the six failure domains that matter most:

- coordination failure
- bad candidate selection
- wrong product or unsupported evidence
- weak content positioning
- poor writing
- integrity or policy failure

Fewer roles would combine conflicting responsibilities. More roles would increase cost, handoff noise, false consensus, and debugging complexity before the workflow is validated.

## Agent 1 — Orchestrator / Conductor

### Mission

Translate user intent into a verifiable run plan, route work to the fixed specialists, preserve shared state, enforce loop and budget limits, and stop for human decisions.

### Inputs

- user objective
- account profile and content boundaries
- previous artifacts
- specialist results
- human decisions

### Outputs

- run plan
- route decisions
- blocker and escalation report
- completion report

### Owns

- stage order
- shared run state
- invocation and revision limits
- success and stop conditions
- human approval gate

### Must not

- discover products itself
- verify evidence itself
- write publishable copy
- weaken Guardian blockers
- publish externally

### Stops when

- required context is missing
- an artifact contract fails
- loop or invocation budget is exhausted
- specialists return unresolved blockers
- a human decision is required

## Agent 2 — Product Scout

### Mission

Discover candidate products using rising attention, purchase-intent language, visual demonstration potential, account fit, and saturation—not popularity alone.

### Inputs

- discovery brief
- audience and niche
- blocked categories
- recent performance summary

### Output: `candidate_set`

Each candidate must include:

- normalized candidate name
- source observations
- attention signal
- purchase-intent signal
- visual-content potential
- saturation signal
- account-fit rationale
- uncertainty

### Must not

- claim that a listing is the exact product
- invent price, stock, seller, or product specifications
- write final post copy
- approve or publish

### Stops when

- no source evidence exists
- the category is blocked
- product identity is too ambiguous to send for verification

## Agent 3 — Evidence Verifier

### Mission

Resolve the canonical product identity and verify claims, listings, seller, stock, price snapshot, media rights, and first-hand-use evidence.

### Important correction

There is **no price agent**. Price is not a standalone intelligence role. It is a volatile evidence field checked by the Verifier together with seller, stock, model, quantity, and observation time.

### Input

- candidate set or exact user-supplied product
- user photos and usage record
- listing and media references

### Output: `evidence_packet`

Required fields include:

- canonical brand/product/model/variant
- exact match: exact / likely / substitute / unresolved
- source list
- verified and prohibited claims
- media-rights state
- personal-use state
- timestamped price/stock/seller snapshot status
- unresolved conflicts and blockers

A missing price does not block every post. It must be recorded as unavailable or not checked, and the Writer may not invent or imply a price.

### Must not

- recommend a product because it is cheap
- treat a similar product as exact
- turn a current price into a permanent fact
- write final copy
- approve or publish

### Stops when

- exact product identity is unresolved
- rights are unresolved
- primary sources conflict
- a high-risk claim lacks evidence

## Agent 4 — Content Strategist

### Mission

Design reader value before writing. It selects the audience, content goal, hook logic, CTA, and four genuinely different angles using verified evidence only.

### Output: `content_brief`

Exactly four angles:

1. problem → practical result
2. curiosity → demonstration
3. comparison → purchase decision
4. honest limitation → best-fit audience

The four angles may be changed for a specific product, but they must differ in argument and reader value, not only wording.

### Must not

- introduce unverified facts
- imitate a competitor's sentence structure too closely
- write final copy
- approve or publish

### Stops when

- the verified product has no meaningful reader value
- all four angles collapse into the same idea
- the product does not fit the account audience

## Agent 5 — Threads Writer

### Mission

Write four Korean Threads drafts from the content brief and evidence packet.

### Output: `draft_bundle`

Each draft must include:

- angle ID
- hook
- body
- limitation or caution where needed
- CTA
- affiliate disclosure when required
- claims used and evidence references

### Must not

- browse for new facts
- claim personal use without a confirmed record
- hide disclosure in an inaccessible location
- add fake scarcity, fake reviews, or medical effects
- approve or publish its own draft

### Stops when

- the brief conflicts with evidence
- disclosure requirements are missing
- four distinct drafts cannot be produced honestly

## Agent 6 — Integrity Guardian

### Mission

Perform the independent final review. The Guardian checks the selected product, linked product, claims, personal-use wording, rights, disclosure, duplication, tone, exaggeration, and platform-policy risk.

### Output: `review_report`

Decision:

- `pass` — no blocker; human review may begin
- `revise` — Writer receives specific bounded revision requests
- `block` — the candidate cannot proceed until evidence or rights change

### Must not

- silently rewrite the draft
- downgrade a blocker to improve throughput
- approve external publication
- publish

### Stops when

- product/link mismatch exists
- rights violation exists
- mandatory disclosure is missing
- a high-risk unsupported claim exists

## Central routing and handoff protocol

Only the Orchestrator delegates. Specialists return structured artifacts to the Orchestrator rather than calling one another directly.

```text
User
  ↓
Orchestrator
  ├─ Product Scout ──────────┐
  ├─ Evidence Verifier ──────┤
  ├─ Content Strategist ─────┤
  ├─ Threads Writer ─────────┤
  └─ Integrity Guardian ─────┘
             ↓
       Human approval
             ↓
 Deterministic local scheduler
```

This star topology prevents hidden side conversations, preserves a single audit trail, and makes the exact source of a failure visible.

## Standard run

1. Orchestrator records objective, constraints, success criteria, and stop conditions.
2. Scout returns candidates unless an exact candidate was supplied.
3. Verifier resolves exact identity and evidence.
4. Strategist creates four distinct content angles.
5. Writer creates four drafts.
6. Guardian returns pass, revise, or block.
7. User makes the final approval decision.
8. Deterministic scheduler writes a local queue record.
9. A future publisher adapter may execute only after official API and permission checks.

## Bounded loops

- Scout refinement: maximum 1 additional pass
- Writer revision after Guardian: maximum 2 passes
- Total specialist invocations: default maximum 12
- After a limit is reached: stop for human decision; never create another agent

## Shared state

Every run records:

- immutable run ID
- objective and constraints
- current stage
- invoked agent and count
- artifact type and timestamp
- evidence references
- blockers and warnings
- revision count
- human decision and actor
- queue or publish state

## Non-agent services

These remain deterministic code:

- scheduler
- publisher adapter
- metrics collector
- audit log

They must not be promoted to agents merely to make the system look more agentic. Deterministic work should remain deterministic.
