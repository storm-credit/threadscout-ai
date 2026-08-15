# Manual Product C Vertical Slice — Reference-first Review

Status: implementation record for PR #12.

Baseline: `c444a3e29834cfdef42d17537c8400e9f6960086`.

## Why no external framework was adopted

The slice does not introduce a new protocol, database, model provider, or browser framework. The risky mechanisms are already defined by ThreadScout's approved architecture and implemented in the repository: server-authoritative commands, version conflicts, fixed-agent routing, evidence authority, review binding, and stale invalidation. Adding a framework merely to satisfy a reference checklist would expand dependency and migration risk without reducing the uncertainty this slice is meant to test.

## References inspected

| Reference | Adopt | Reject / boundary | Reason |
|---|---|---|---|
| `docs/spec/APPLICATION_INTERFACE_SPEC.md` | read-model + command split, request ID idempotency, expected-version conflicts, no client-manufactured verified/approved state | none | direct authority for application boundary |
| `docs/spec/SYSTEM_ARCHITECTURE.md` | UI → API → Orchestrator → specialist authority; deterministic durable state transitions | browser/localStorage authority | direct architecture authority |
| `docs/spec/REVIEW_BINDING_SPEC.md` | approval binds exact material revision; edits make review stale | silently preserving approval after edit | direct review authority |
| `docs/spec/UI_SCREEN_SPEC.md` + `UI_STATE_ACTION_MATRIX.md` | Opportunity Inbox, evidence/risk/score separation, one safe CTA, visible disabled/block reason | score-driven progression | direct UI authority |
| `packages/orchestra/src/master-harness.mjs` | fixed six-role invariant, Verifier factual authority, stale/CAS pattern | treating fixture output as live truth | existing executable contract evidence |
| existing `apps/web/` prototype at baseline | no-framework shell, escaping, simple mobile layout | localStorage as durable authority; one workspace mixing state mutation and approval authority | retain useful presentation pattern but retire incorrect state ownership |

## Four implementation shapes rechecked

1. Keep localStorage prototype and patch screens — rejected because it conflicts with server-authoritative state and cross-device stale rejection.
2. Keep the Node/no-framework shell and add a bounded server command/read API with atomic JSON state — **selected**.
3. Introduce SQLite/application framework immediately — deferred because multi-process/deployment durability is not the uncertainty of this slice.
4. Render Master Harness diagnostic reports as the product state/UI — rejected because harness evidence is not the application state authority.

Repository evidence did not invalidate Option 2.

## Implementation correction found during review

The first C-slice pass placed deterministic Verifier/Strategist/Writer/Guardian behavior behind server state but did not make the Orchestrator boundary explicit enough: application commands could call the specialist-shaped operation directly inside the state service.

That was corrected before merge by adding `apps/web/manual-orchestrator.mjs` and routing `POST /api/commands` through it. Specialist commands now have a fixed command→role mapping, validate the six-agent registry, validate allowed workflow state, return control to Orchestrator, and emit an orchestration receipt. The local specialist behavior remains a deterministic no-provider adapter; it must not be represented as a live model invocation.

A second edge case was found in stale recovery. Reverification after a prior approval correctly invalidated review state but could leave the operational workflow in `stale` after a new strategy was generated. The Orchestrator now owns the recovery transition: only current exact/ready evidence may dispatch Strategist from `stale`, and a successful new strategy moves the operational state to `strategy_ready` while the old review remains removed.

## License / source authority

No third-party code was copied and no new dependency was added. All implementation references above are project-owned source/design authority. External live-source terms and APIs remain outside this slice and disabled.

## Residual risks intentionally left for later slices

- atomic JSON is local, single-process persistence, not a multi-worker production store
- actual provider-backed agents must implement the same Orchestrator/receipt/authority guarantees later
- browser/device support matrix and real-device visual verification are separate from this slice's structural 360 px automated checks
- scheduling/publishing correctness is not implemented here
- owner-supplied evidence is not automatically transformed into current public truth; live-source verification remains a separate activation path
