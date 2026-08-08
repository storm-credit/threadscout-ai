# Architecture

## Direction

Approval-first personal application using a fixed six-agent orchestra supervised by a deterministic state machine.

```text
User objective
      ↓
Orchestrator run plan
      ↓
Product Scout candidate_set
      ↓
Evidence Verifier evidence_packet
      ↓
Content Strategist content_brief (4 angles)
      ↓
Threads Writer draft_bundle (4 drafts)
      ↓
Integrity Guardian review_report
      ↓
Human approval
      ↓
Deterministic local scheduler
```

Only the Orchestrator delegates. Specialists return structured artifacts to the Orchestrator and cannot publish.

## Phase 2B runtime layers

### 1. Immutable registry

`agent-registry.mjs` fixes the six roles, ownership boundaries, tool allowlists, forbidden actions, and stop conditions.

### 2. System prompts

`prompts.mjs` converts the registry, global integrity rules, the 실용 신박템 profile, and each output schema into six detailed system prompts. Prompts require one JSON object and forbid hidden specialist-to-specialist delegation.

### 3. Machine-readable schemas

`schemas.mjs` defines the required shape for run plans, candidate sets, evidence packets, content briefs, draft bundles, and review reports. Schema checks supplement—not replace—the semantic checks in `contracts.mjs`.

### 4. Niche scoring

`niche-profile.mjs` treats novelty as one signal rather than the objective. Problem clarity, demonstration, and practical utility account for 60% of the score. Hard gates and penalties prevent gimmick-only or high-risk products from passing.

### 5. Deterministic simulation

`simulation.mjs` runs one explicitly synthetic product through all six agents, Guardian pass, simulated human approval, and a local-only queue. It performs no network, model, affiliate, or publishing call.

## Evidence boundary

Product Scout proposes candidates and sources but cannot declare exact match or current commerce facts.

Evidence Verifier owns:

- canonical product, brand, model, and variant
- exact-match state
- claim evidence and source links
- personal-use state
- media rights
- time-stamped price status, amount/currency, stock, seller, and variant snapshot

Fixture commerce records must be marked synthetic and can never be displayed as current market truth.

## State models

Agent run:

`ready → running → revision_requested → running → needs_human_decision / blocked / approved_for_local_queue → completed_local_only`

Content:

`draft → needs_evidence → ready_for_review → guardian_passed → human_approved → scheduled → publishing → published`

No transition into schedule or publication is valid without Guardian pass, human actor, and timestamp.

## Deterministic services

The following are not agents:

- scheduler
- publisher adapter
- metrics collector
- audit log

They execute validated commands and do not invent content or evidence.

## Next implementation order

1. Provider-neutral model interface
2. Fixture/replay model adapter
3. Per-agent timeout and token/cost budgets
4. Tool broker with strict per-agent allowlists
5. Evidence-store persistence and source recency
6. Live research adapter only after policy and access checks
7. Official publishing adapter only after separate approval
