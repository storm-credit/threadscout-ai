# Phase 2D Plan — Versioned Evidence and Append-Only Run Store

## Goal

Persist synthetic/local execution evidence, agent artifacts, and run decisions in a reproducible format before any live research or model provider is connected.

## Success criteria

1. Canonical serialization gives the same hash regardless of object key order.
2. A runtime manifest hashes the fixed roster, six prompts, and six schemas.
3. Every stored artifact records agent, prompt, schema, manifest, parent, and evidence hashes.
4. Tampering with artifact content is detected.
5. A changed evidence hash marks downstream artifacts stale.
6. Objects are stored by SHA-256 content address.
7. Each run has an append-only, hash-chained event stream.
8. Concurrent appends within one process remain sequential.
9. Payload or event tampering breaks validation.
10. Runtime execution stores six versioned artifacts, invocation metadata, human decision, and local queue event.
11. Runs remain isolated by run ID.
12. No raw credential, live product claim, or external publication is introduced.

## Non-goals

- multi-process or distributed locking
- database migrations
- live web or commerce data
- live model calls
- storing unredacted provider prompts/errors
- external publishing

## Stop conditions

- safe persistence would require credentials or infrastructure spending
- a backend change would weaken immutable object or event-chain semantics
- fixture values could be mistaken for current market evidence
- a seventh agent or bypass of Guardian/human gates appears necessary
- tests require accepting corrupted or stale artifacts

## Verification

```bash
npm run verify
npm run orchestra:store
```
