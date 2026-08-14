# Background Job Specification v1

Status: DESIGN ONLY.

Background work is deterministic orchestration around the fixed agents; the browser is not responsible for keeping scheduled work alive.

## Job classes

- daily candidate refresh
- selected candidate verification refresh
- stale-evidence scan
- local schedule preflight
- result/metric refresh when an approved source is available
- retention cleanup

## Job record

Each job records job ID, job class, requested time, run/candidate references, attempt count, current state, last result, next eligible attempt, and related blocker refs.

## Concurrency rule

Only one active job of the same logical purpose may operate on the same candidate/schedule version at once. Newer artifact versions supersede older pending work.

## Failure rule

A failed background job changes state and records a reason; it does not silently mutate a candidate to success. Stale evidence remains stale until a valid refresh exists.

## Agent rule

A background job may ask Orchestrator to start a normal fixed-roster run. It does not instantiate specialist agents directly or create a separate scheduler agent.
