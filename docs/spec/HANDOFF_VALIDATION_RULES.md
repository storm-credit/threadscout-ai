# Handoff Validation Rules v1

Status: DESIGN ONLY.

Every specialist-to-Orchestrator handoff passes two gates before the next stage.

## Schema gate

Validate schema version, run/handoff/artifact IDs, sender/receiver, artifact type, created time, evidence refs, status, warnings, blockers, and requested next action.

Unknown required fields, missing required fields, or incompatible schema versions stop progression.

## Semantic gate

The Orchestrator checks role authority:

- Scout cannot promote exact identity or final-use media state
- Verifier cannot author final copy
- Strategist cannot add unsupported facts
- Writer cannot add research evidence
- Guardian cannot silently replace the Writer output

## Evidence gate

Artifact evidence references must exist and be valid for the current run. A stale or invalid evidence reference prevents downstream progression.

## Next-action gate

The requested next action must be allowed from the current Orchestrator state and by the fixed routing rules.

## Failure response

Invalid handoffs return a structured contract error to the originating stage or stop the run. The Orchestrator never repairs an invalid artifact by inventing missing factual data.
