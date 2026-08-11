# Agent Handoffs & Artifact Protocol v1

## 1. Topology

ThreadScout uses a star topology. Specialists never call one another directly.

```text
Scout ───────┐
Verifier ────┤
Strategist ──┤→ Orchestrator → next allowed stage
Writer ──────┤
Guardian ────┘
```

This preserves a single decision trail and prevents hidden assumptions.

## 2. Handoff envelope

Every handoff uses an envelope:

```json
{
  "schema_version": "1.0",
  "run_id": "run_*",
  "handoff_id": "handoff_*",
  "from": "scout",
  "to": "orchestrator",
  "artifact_type": "candidate_set",
  "artifact_ref": "artifact_*",
  "created_at": "RFC3339",
  "evidence_refs": [],
  "status": "complete",
  "warnings": [],
  "blockers": [],
  "requested_next_action": "verify"
}
```

The receiver does not trust free text outside the artifact schema.

## 3. Canonical handoffs

### H1 Orchestrator → Scout

Artifact: `discovery_brief`

Contains audience, lane mix, time window, excluded topics, query budget, prior learning summary, and whether issue/media discovery is allowed.

### H2 Scout → Orchestrator

Artifact: `candidate_set`

Important: product hypotheses are hypotheses only. Public-figure relation and exact identity remain unverified.

### H3 Orchestrator → Verifier

Artifact: `verification_request`

Contains only selected candidate(s), source/media references, product hypotheses, and user-owned evidence. Orchestrator must not upgrade evidence classes.

### H4 Verifier → Orchestrator

Artifact: `evidence_packet`

This becomes the sole factual authority for downstream writing. If `verifier_decision=hold/reject`, Strategist is not called for product promotional content.

### H5 Orchestrator → Strategist

Artifacts: `evidence_packet` + account policy + history summary.

The Strategist sees verified claims and explicit prohibited implications.

### H6 Strategist → Orchestrator

Artifact: `content_brief`

Exactly four angles, each with allowed claims and differentiation reason.

### H7 Orchestrator → Writer

Artifacts: `content_brief` + exact evidence packet snapshot.

Writer may not receive newer unverified source text separately.

### H8 Writer → Orchestrator

Artifact: `draft_bundle`

Exactly four drafts and explicit claim references.

### H9 Orchestrator → Guardian

Artifacts:
- evidence packet
- content brief
- draft bundle
- media plan
- affiliate mapping
- policy versions

### H10 Guardian → Orchestrator

Artifact: `review_report`

- pass → human review
- revise → bounded Writer retry with revision request only
- block → stop until evidence/policy changes

### H11 Orchestrator → Human

Artifact: `approval_packet`

Shows selected draft, alternatives, Guardian report, exact/substitute state, media rights, disclosure, volatile facts, and scheduled-time preflight warning.

### H12 Human → Orchestrator

Artifact: `human_decision`

Values:
- approve
- edit_and_approve
- hold
- reject
- suppress_product
- suppress_category

Approval records actor, time, approved draft hash, media hash, affiliate destination hash, and evidence version.

## 4. Revision handoff

Guardian revisions must be machine-readable:

```json
{
  "draft_id": "draft_123",
  "severity": "blocker",
  "rule_id": "PUBLIC_FIGURE_ENDORSEMENT_IMPLICATION",
  "problem": "Draft implies endorsement but evidence only proves public use.",
  "required_change": "Describe confirmed public use without endorsement language.",
  "evidence_refs": ["src_1"]
}
```

Writer receives revision requests, not Guardian-authored replacement copy.

## 5. Evidence immutability

Downstream artifacts bind to an `evidence_packet` hash. If evidence changes, Strategist/Writer/Guardian artifacts become stale and must be regenerated or explicitly revalidated.

## 6. Failure handoff

Any agent can return `status=blocked` with:

- blocker code
- what is missing
- whether one retry is allowed
- whether user evidence can resolve it
- safe next action

Orchestrator must not convert a blocked artifact into success.

## 7. Human-visible provenance

The approval screen must render a simplified lineage:

`Discovery → Verification → Strategy → Draft → Guardian → You`

Each stage is expandable to show source/evidence and timestamps without exposing secrets or internal prompt content.
