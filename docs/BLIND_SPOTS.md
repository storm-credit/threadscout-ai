# Blind-Spot Sweep

## Product discovery

- High engagement does not necessarily indicate purchase intent.
- A viral post can signal that the product is already over-saturated.
- Product names extracted from informal posts may be incomplete or wrong.
- A similar-looking affiliate listing may not be the exact product shown.
- Low-cost products may generate attention but little commission.
- Stock, seller, price, and delivery conditions can change after a draft is approved.

## Content and trust

- Automated drafts can converge on the same artificial voice.
- Strong hooks can drift into exaggeration, fear, or misleading scarcity.
- “I used it” language may be generated even when the creator did not use it.
- Reusing popular phrasing too closely can create plagiarism or impersonation concerns.
- An account with too many affiliate posts can lose organic reach and reader trust.
- Drafts optimized only for views may attract the wrong audience and lower conversion.

## Media and rights

- Publicly viewable media is not automatically reusable.
- Product images may carry retailer, photographer, or brand restrictions.
- AI-generated product images can misrepresent the real item.
- Before/after images can imply effects that were not actually observed.

## Platform operations

- Access tokens expire.
- Search and publishing capabilities may require review or permissions.
- Rate limits and undocumented changes can interrupt automation.
- A publish request can time out even though the post was created.
- Retry logic can create duplicate posts without idempotency.
- Scheduling in the wrong timezone can publish at unintended times.

## Affiliate and compliance

- Disclosure hidden in a secondary reply may not be sufficiently visible.
- Linking an alternative product without saying so can mislead readers.
- Health, skincare, child, and supplement claims carry elevated risk.
- Revenue attribution can be incomplete or delayed.

## Business and behavior

- Constant trend monitoring can consume more time than it saves.
- Daily content volume may exceed the supply of truthful, high-quality material.
- Success metrics can incentivize spam unless guardrails are explicit.
- The project can become a complex SaaS before the personal workflow is proven.

## Six-agent orchestra

- More agents can create false confidence because several agents may repeat the same unsupported assumption.
- Role names do not guarantee independence if every agent receives the same contaminated context.
- A Guardian using the same prompt and evidence as the Writer may rubber-stamp the draft.
- Free-form agent conversations can hide which agent introduced a false fact.
- Circular Scout–Verifier or Writer–Guardian handoffs can consume cost without improving evidence.
- Fixed agents may be invoked unnecessarily unless the Orchestrator can skip stages safely.
- A fixed count can become dogma; role boundaries should be tuned while preserving the six-role contract.
- Shared memory can leak rejected claims into later stages unless artifacts are versioned.
- A price snapshot can become stale between verification, approval, and publication.
- A cheap product can dominate recommendations if commercial value is over-weighted.
- Parallel runs can overwrite shared state without run IDs and atomic updates.
- A specialist can exceed its role by browsing for new facts after evidence has been frozen.
- Agent agreement is not evidence; source references must remain attached to claims.
- Model-provider changes can alter output behavior even when prompts and code do not change.
- Costs can grow multiplicatively with four drafts, revisions, and repeated verification.
