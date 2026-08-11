# Fixed Six-Agent Contracts v1

All agents are stateless from the perspective of authority: they receive explicit artifacts and return explicit artifacts. The Orchestrator owns run state.

## Shared contract rules

Every artifact carries:

- `schema_version`
- `run_id`
- `artifact_id`
- `agent_id`
- `created_at`
- `input_artifact_refs[]`
- `evidence_refs[]`
- `warnings[]`
- `blockers[]`
- `confidence` where applicable
- prompt/schema/manifest version references

No agent may add a factual field that was not present in an allowed source or upstream artifact.

## 1. Orchestrator

### Input

`run_request`

Required:
- objective
- account profile
- allowed content lanes
- blocked categories
- user-supplied references
- publication intent: draft-only / schedule-intent

### Output

`run_plan` then final `run_report`

`run_plan` includes:
- stages[]
- agents_to_call[]
- required evidence classes
- budgets
- stop conditions
- human decisions required

### Tools

State, artifact registry, budget counter, deterministic services. No open web research tool.

### Hard stops

Contract failure, budget exhaustion, unresolved P0 blocker, human approval required, external action beyond configured authorization.

## 2. Product Scout

### Input

`discovery_brief`

Includes audience, niche, time window, excluded topics, source budget, learning summary.

### Output

`candidate_set`

Each candidate:
- candidate_id
- normalized_name
- content_lane
- discovery_reason
- issue_context or null
- source_refs[]
- media_refs[]
- product_hypotheses[]
- attention_signals[]
- purchase_intent_signals[]
- demonstration_score
- utility_score
- novelty_score
- saturation_signal
- audience_fit
- uncertainty
- scout_recommendation

### Tools

Approved read-only discovery/trend/media-metadata tools only.

### Cannot conclude

Exact product identity, endorsement, rights, personal use, final price/stock, publishability.

## 3. Evidence Verifier

### Input

`verification_request`

Includes candidate, product hypotheses, source refs, media refs, user-owned evidence.

### Output

`evidence_packet`

Required:
- canonical_product
- match_state
- match_evidence[]
- conflicts[]
- verified_claims[]
- prohibited_claims[]
- public_figure_relation
- media_rights[]
- personal_use_state
- commerce_snapshot
- freshness
- unresolved_questions[]
- verifier_decision: verified / limited / hold / reject

`commerce_snapshot` is one timestamped object containing seller, listing, model/variant, package/quantity, price when available, currency, stock/availability, observed_at, and source.

### Tools

Approved listing, cross-source, rights, and commerce tools. Read-only.

### Hard stops

Conflicting primary evidence, unresolved identity required for exact claim, rights unresolved for proposed media, unsupported sensitive claim.

## 4. Content Strategist

### Input

`evidence_packet` + account/content policy.

### Output

`content_brief`

Exactly four `angle` objects. Each contains:
- angle_id
- reader_job
- core_value
- hook_logic
- allowed_claims[]
- prohibited_implications[]
- media_plan
- CTA
- disclosure_requirement
- issue_reference_rule when relevant
- differentiation_reason

### Tools

No new research. May use deterministic duplicate/history lookup.

### Hard stops

Insufficient reader value, four angles not meaningfully distinct, required claim not supported.

## 5. Threads Writer

### Input

`content_brief` + `evidence_packet`.

### Output

`draft_bundle`

Exactly four drafts mapped to four angle IDs. Each contains:
- draft_id
- angle_id
- hook
- body
- CTA
- disclosure
- claim_refs[]
- media_ref or null
- first_hand_language_used boolean
- issue_wording_class or null

### Tools

No web/search/listing tools. May use deterministic style guide and duplicate checker.

### Hard stops

Missing disclosure instruction, evidence conflict, unsupported factual wording, inability to preserve angle distinction.

## 6. Integrity Guardian

### Input

Evidence packet, content brief, draft bundle, media plan, affiliate mapping, relevant policy configuration.

### Output

`review_report`

Includes:
- decision: pass / revise / block
- per_draft_findings[]
- product_match_check
- public_figure_claim_check
- rights_check
- first_hand_check
- affiliate_disclosure_check
- duplication_check
- exaggeration_check
- sensitive_claim_check
- revision_requests[]
- non_overridable_blockers[]

### Tools

Deterministic rule checks and permitted policy reference lookup. No content publication.

### Rule

Guardian cannot silently rewrite content and no human approval can override a `block` without new evidence or a documented policy/design change.

## Retry budgets

- Scout: one refinement pass
- Verifier: one evidence re-evaluation after new evidence
- Writer: up to two revisions requested by Guardian
- Guardian: re-runs only after changed draft/evidence
- total specialist calls: default max 12 per run

Exceeded budgets cause escalation, not a seventh agent.
