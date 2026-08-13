# Run Budget Model v1

Status: DESIGN ONLY.

Each run has bounded allowances for source lookups, specialist invocations, Writer revisions, elapsed time, and model usage when measurable.

The default specialist-call ceiling remains twelve across the fixed six-agent roster. Scout may refine once. Writer may receive at most two Guardian-driven revision passes. A budget limit returns a partial/held result rather than increasing scope automatically.

Budgets are visible in run state and are configuration values, not prompt suggestions. A model cannot increase its own budget or create another role to continue work.
