# packages/core

The ThreadScout domain core: pure logic with no filesystem, network, or ambient time.

- `src/run-states.mjs` — run stages and statuses, including `stale`
- `src/artifacts.mjs` — artifact contracts and the single validator for them
- `src/handoff.mjs` — the handoff envelope and its schema, semantic, evidence, and next-action gates
- `src/policy-rules.mjs` — canonical detectors for prohibited wording, and the similarity check that catches paraphrased angles
- `src/ranking.mjs` — opportunity score with independent readiness, risk, and freshness
- `src/approval.mjs` — approval binding and the current / approved / stale evaluation
- `src/review-state.mjs` — the read model and CTA the UI renders
- `src/hash.mjs`, `src/clock.mjs` — artifact identity, and injected time and ids

Time and identity are injected so artifact hashes are reproducible and freshness gates stay testable.
