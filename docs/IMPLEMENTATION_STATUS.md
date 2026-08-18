# Implementation Status

## Current mode

**Slice 1 implemented. Live capabilities remain disabled.**

The design-only freeze ended through the gate in `docs/spec/DESIGN_FREEZE.md`. The owner selected one bounded slice, `S1 — Manual Candidate Approval Pipeline`, whose entry contract is `docs/SLICE1_PLAN.md`.

Everything outside that slice is still unimplemented, and nothing here claims production or live readiness.

## What Slice 1 implements

Owner enters a product directly → Evidence Verifier → Opportunity Inbox → Content Strategist four angles → Threads Writer four drafts → Integrity Guardian → human approve / hold / reject.

- `packages/core` — domain core: run stages and statuses, artifact contracts, the handoff envelope and its four gates, policy detectors, ranking with independent readiness/risk/freshness, approval binding with a visible stale state, and CTA derivation. No I/O, injected clock and ids.
- `packages/orchestra` — the six agents, the orchestrator pipeline, the budgeted agent runtime that emits a receipt per invocation, and the synthetic scenario families.
- `packages/database` — storage ports with an in-memory adapter and a JSONL adapter, both enforcing compare-and-set and the same hash chain.
- `apps/web` — the application API and the mobile-first Opportunity Inbox.

## What the prototype became

| Prototype asset | Disposition |
|---|---|
| `orchestrator.mjs`, `simulation.mjs`, `executor.mjs`, `replay-fixtures.mjs`, `contracts.mjs`, `model-runtime.mjs` | **removed** — superseded by `pipeline.mjs`, `agent-runtime.mjs`, and `packages/core`. Keeping them would have left two orchestrators with two different artifact contracts. |
| `packages/core` localStorage demo, `apps/web` landing page | **removed** — browser-owned state contradicts D-02 and AT-35 |
| `agent-registry.mjs`, `versioning.mjs`, `evidence-store.mjs`, `prompts.mjs`, `niche-profile.mjs` | **kept**, with hashing moved into the domain core so there is one definition of artifact identity |
| `schemas.mjs` | **modified** — now declares the approved output contracts; validation lives once, in `packages/core/src/artifacts.mjs` |
| research, source-readiness, tool-broker, disabled-adapter modules | **kept unchanged** — they are the live-source boundary and are still correct |

## Verification

`npm run verify` runs the design-document check, the full test suite, the deterministic slice pipeline, the offline fixture research, and the live-source readiness report.

Acceptance IDs covered by implementation tests: AT-01, AT-03, AT-04, AT-06, AT-07, AT-08, AT-09, AT-10, AT-13, AT-16, AT-17, AT-18, AT-19, AT-20, AT-21, AT-22, AT-23, AT-25, AT-28, AT-29, AT-33, AT-34, AT-35, AT-36, AT-38, AT-40, AT-41.

Where a gate exists, a test proves it refuses, not only that the happy path passes.

Manual verification performed in a real browser at 360×760: the full owner flow runs; every button, form, and CTA works; `localStorage` and `sessionStorage` stay empty; state survives a reload and a process restart.

## Live capability state

Designed and intentionally disabled until activation preflight:

- Threads keyword discovery, insights, and publishing
- live Coupang Partners commercial posting
- automated listing discovery beyond owner-supplied destinations
- third-party media download / transform / republish

A destination URL supplied by the owner is stored as string evidence and is never fetched.

## Not implemented

Scout discovery, media upload and pipeline, affiliate mapping, scheduling, preflight, publishing, reconciliation, analytics, learning, and suppression controls.

`scheduled_local` exists in the state machine and is deliberately unreachable: a half-built path into scheduling would be worse than none.

## GitHub Actions interpretation

A green check now means the design-authority documents are present, the acceptance-mapped tests pass, the deterministic pipeline reaches the designed decision for every fixture family, and no live source was activated.

It does not prove live readiness, and it cannot: the activation gates are runtime facts, not test facts.

## Next implementation entry

The next slice must repeat the entry contract in `docs/spec/DESIGN_BASELINE_MANIFEST.md`, refresh the prototype gap classification, and check `docs/PRE_IMPLEMENTATION_TRAPS.md` before coding.
