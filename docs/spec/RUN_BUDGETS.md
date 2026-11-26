# Run Budget Model v1

Status: DESIGN ONLY.

Each `(candidate_id, lifecycle_epoch)` candidate-lifecycle run has bounded cumulative allowances for source lookups, specialist invocations, Writer revisions, elapsed time, and model tokens/KRW-or-USD cost across all retries (`NFR-13`, `AT-48`). `lifecycle_epoch` increments exclusively on an explicit owner `reopen_rejected_candidate` command after an explicit owner `reject` decision or post-retention archival — never on `Guardian` `block`/`revise`, `Verifier` `hold`, or freshness TTL `stale`.

The default specialist-call ceiling remains twelve across the fixed six-agent roster. Scout may refine once. Writer may receive at most two Guardian-driven revision passes. Reaching any invocation, token, or currency ceiling halts progression with `budget_exhausted` and an audit receipt rather than increasing scope automatically.

Budgets are visible in run state and are configuration values, not prompt suggestions. A model cannot increase its own budget or create another role to continue work.
