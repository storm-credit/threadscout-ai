# Configuration Authority v1

Status: DESIGN ONLY.

ThreadScout separates three configuration layers so a model cannot silently turn a temporary value into a product rule.

## Layer 1 — constitutional invariants

Require design change to modify:

- exactly six agents
- no price agent
- Guardian before human review
- product exact/substitute distinction
- evidence and media gates
- no fake first-hand wording
- no automatic engagement farming

## Layer 2 — product-owner defaults

Configurable without changing the six-agent architecture:

- content lane weights
- daily capacity
- commercial-content intensity
- candidate review threshold
- suppression defaults
- UI density
- tone profile
- provisional TTL/retention values

Changes are versioned and recorded so later analytics can be interpreted against the active configuration.

## Layer 3 — external capability facts

Must be verified from the actual environment rather than guessed:

- available platform permissions/capabilities
- commercial-program rules
- source availability/fields
- current media-use conditions
- available analytics fields

External facts cannot be converted into constitutional rules merely because they are true for one account or date.

## Precedence

Constitutional invariants override product-owner defaults. External capability facts can disable a feature but cannot weaken constitutional safeguards.
