# Existing Prototype vs Master Spec — Gap Analysis v2

This is design analysis only. It does not authorize code changes.

## Keep conceptually

Preserve these existing concepts unless a later approved design changes them:

- exactly six fixed agents
- Orchestrator-only delegation
- Product Scout discovers; Verifier owns factual conclusions
- no separate price agent
- four strategy angles and four Writer drafts
- Guardian before human review
- explicit user review before external publication
- deterministic scheduler/publisher/metrics/audit responsibilities
- bounded retries and budgets
- provider-neutral runtime concept
- artifact/schema validation
- versioned evidence and run events
- fail-closed source readiness
- fixture/replay scenarios

## Modify later after design approval

### Orchestration

Align existing runtime states with `ORCHESTRATOR_STATE_MACHINE.md`, `ROUTING_RULES.md`, and `HANDOFF_VALIDATION_RULES.md`. Add explicit stale routing and role-authority checks at every handoff.

### Prompts

Align all six agent prompts with `PROMPT_SYSTEM_SPEC.md`, including context requirements, stop conditions, output schema, role authority, prompt version, and result review.

### Candidate/discovery

Add content lane, issue context, media refs, multiple product hypotheses, purchase-intent evidence, freshness, and portfolio-selection reason codes.

### Evidence

Add explicit ProductMatch, relationship state, media final-use state, claim evidence class, evidence thresholds, freshness/TTL state, prohibited implications, and exact-versus-alternative commercial eligibility.

### UI

Replace prototype-first candidate presentation with the selected Opportunity Inbox hierarchy and `UI_STATE_ACTION_MATRIX.md` behavior. Known blockers must affect the visible CTA before the user opens a detail page.

### Content/review

Use the canonical four-angle output contract and bind the human review decision to exact draft/evidence/media/destination revisions as defined by `CONTENT_OUTPUT_SPEC.md` and `REVIEW_BINDING_SPEC.md`.

### Scheduling/analytics

Later align schedule preflight, stale review behavior, result reconciliation, metric separation, and bounded learning with their domain specs.

## Avoid later

Do not preserve behavior that:

- treats fixture values as live truth
- lets one numeric score hide evidence or risk state
- treats a research media reference as automatically usable in final content
- treats a similar listing as exact identity
- lets a specialist silently exceed its role authority
- uses high-performing unsafe patterns as a learning target
- lowers quality gates to fill a daily quota

## Still missing from implementation, but already designed

- worked 20→5 non-numeric portfolio selection
- issue-to-product routing
- source/relation/product/media independence
- claim/evidence thresholds
- mobile state-to-action matrix
- prompt lifecycle/version discipline
- review binding and stale propagation
- MVP scope boundary
- configuration authority layers
- cross-spec edge-case behavior

## Still open in design

- final visual styling/interactions
- production score calibration
- live source allowlist and actual account capabilities
- exact listing/commercial source
- current commercial/disclosure rules
- deployment and credential-storage choices
- source-specific final-use media rules
- actual metric availability
- promotion of provisional TTL/retention defaults

## Implementation-resume rule

After Master Design v1 is approved, create implementation slices/issues from the approved baseline. Each implementation unit references the relevant requirement and acceptance IDs. Do not resume ad-hoc coding from this gap list alone.
