# Blind-Spot Sweep

## Product and content

- High engagement may not indicate purchase intent.
- Viral content may already be saturated.
- Informal product names may be incomplete or wrong.
- Similar-looking listings may not be the exact item.
- Novelty can hide low repeat-use value.
- Hooks can drift into exaggeration, false scarcity, or copied phrasing.
- First-hand language may appear without actual use.

## Media, claims, and commerce

- Publicly visible media is not automatically reusable.
- Generated or before/after media can imply unobserved effects.
- Health, skincare, child, and supplement claims carry elevated risk.
- Price, seller, stock, variant, and delivery can change after approval.

## Six-agent orchestra

- Several agents can repeat one contaminated assumption.
- Guardian can rubber-stamp Writer if context is not independent.
- Agent agreement is not source evidence.
- Revision loops can consume cost without improving facts.
- Rejected claims can leak through shared context.

## Provider runtime

- Provider behavior can change without code changes.
- Character budgets only approximate token and financial cost.
- A timeout may not cancel remote billing or completion.
- Replay fixtures can overfit one happy path.
- A schema-valid output can still be factually wrong.
- Safe tool names can hide unsafe handler implementations.

## Versioning and persistence

- SHA-256 proves content consistency, not truth.
- Hash chains detect mutation but do not prevent authorized deletion of an entire run directory.
- Canonicalization bugs can change hashes across versions.
- Storing full artifacts can preserve sensitive or copyrighted content longer than intended.
- Provider errors or source payloads may contain secrets or personal data if not redacted.
- JSONL append is not a transaction across processes or machines.
- A process crash during append can leave a partial final line.
- Content-addressed objects need garbage-collection and retention rules.
- Prompt/schema changes can mark many artifacts stale at once.
- Evidence invalidation must propagate to strategy, drafts, Guardian report, and queue records.
- Identical content hashes can reveal that two runs used the same source or artifact.
- Event timestamps depend on system clock correctness.
- Hash metadata can create false confidence if source provenance is weak.

## Platform and business

- Publish timeout can create unknown remote state and duplicates.
- Timezone errors can publish at unintended times.
- Daily volume can exceed truthful material supply.
- View optimization can reduce trust and conversion.
- The system can become a complex SaaS before the personal workflow is proven.
