# Decision Log Addendum — 2026-08-14

## Mobile-first responsive web selected for v1

### Context

The design was already mobile-first, but the delivery-platform decision was not explicit enough: responsive web, PWA, cross-platform native, and separate native apps had not been compared as a product decision.

### Four options reviewed

1. desktop-first web
2. separate native iOS/Android
3. cross-platform native
4. mobile-first responsive web, PWA-ready

### Decision

Select option 4.

ThreadScout v1 is a mobile-first responsive web application, desktop-supported and PWA-ready. Native applications are outside MVP.

### Constraint added

Browser/PWA state cannot own scheduling, publication, approval truth, or background correctness. Durable state and future background work are server-authoritative.

### Revisit trigger

Native work requires measured evidence that responsive web/PWA causes persistent problems in capture/upload, notification reliability, approval latency, share/import flow, offline use, or attributable retention.

---

## Final Master Design blind-spot sweep completed

### Change

Added `docs/spec/FINAL_BLIND_SPOT_SWEEP.md` with severity-ranked cross-domain blind spots and expanded `docs/PRE_IMPLEMENTATION_TRAPS.md` with implementation-facing checks.

### Most important findings

- browser/PWA lifecycle cannot be an operational authority
- cross-device edits can invalidate an approval
- public media discovery is not publication permission
- public use is not endorsement
- multiple agents can repeat one contaminated assumption
- human approval can degrade into approval fatigue
- unknown remote publish state can create duplicates
- unsafe high-performing issue content can poison analytics learning
- public repository/diagnostics can amplify secret leakage
- the product can become over-engineered before its economics are proven

### Result

All current B0 findings are mapped in `docs/spec/B0_TRACEABILITY_MATRIX.md` to named design authority and behavioral acceptance. This closes B0 design traceability, not future implementation safety.

---

## P0 decisions resolved or explicitly deferred behind disabled capabilities

### Context

Several P0 items were live/account-specific and could not safely be guessed. Keeping them simply “unresolved” would prevent the design from ever reaching a stable baseline even though the architecture already defined fail-closed behavior.

### Decision

Treat design completeness and live activation as separate states.

- Threads discovery/insights/publishing adapters remain in design; actual target app/account scope and token are activation-time preflight.
- MVP exact-product verification may start from a user-supplied commercial destination plus versioned identity snapshot; automated product search is not required.
- Coupang Partners is the first commercial target; current account/program disclosure/link rules are activation-time checks before live posting.
- deployment is a managed server/runtime + PostgreSQL + permitted object storage architecture; exact vendor remains replaceable implementation configuration.
- credentials use server-side managed secret storage/encrypted injection only.
- unknown media rights are blocked; final use requires user-owned, licensed/permission-confirmed, or explicitly permitted native treatment.

### Impact

Master Design v1 may be complete while these live capabilities remain disabled.

---

## Reversible P1 defaults promoted automatically

### Basis

The owner instructed the design phase to continue automatically through completion. The direction and safe defaults had already been discussed repeatedly, so reversible configuration values are promoted rather than asking the same decisions again.

### Promoted defaults

- 0–3 posts/day, never a quota
- normally <= 1 affiliate-heavy post/day
- <= 5 first-screen recommendations
- 65/100 initial opportunity review heuristic only
- 4h price/stock freshness when explicitly claimed
- listing identity revalidation within 24h of scheduled publication plus dispatch preflight as applicable
- 12h fast issue-linked freshness
- 6h attention-ranking freshness
- suppression until explicit restore
- 30d source excerpt / 90d media metadata / 365d audit default retention ceilings
- blocker/material-change/approval/publish-incident notification priority

### Guardrail

These defaults may be calibrated later but cannot weaken fixed evidence, safety, rights, six-agent, or human-approval invariants.

---

## Current public source posture refreshed

### Threads

Meta-published Threads API material reviewed for the design baseline supports the architecture for OAuth authorization, keyword search, publishing, and insights. Actual account/app capability is still verified at activation time.

### NAVER

NAVER's 2026 migration notice moves Search API, Search Trend, and Shopping Insight toward NAVER API HUB. The old NAVER Developers Shopping Search API ended in 2026 and is not treated as an exact-product source. NAVER API HUB trend/shopping-insight data remains corroboration, not sales truth.

### Coupang

The design selects Coupang Partners as the first commercial program but does not assume a general affiliate product-search API or repurpose seller-management APIs. Current account/program rules are rechecked at activation.

---

## Master Design v1 promoted to approved baseline

### Completed gates

- core product/system domains have named design authority
- final platform direction selected
- fixed six-agent orchestra and handoff authority fixed
- final blind-spot sweep completed and B0 mapped
- P0 items resolved or explicitly deferred behind disabled capability gates
- P1 reversible defaults promoted
- acceptance tests consolidated through AT-44
- traceability consolidated into the canonical matrix
- final contradiction review passes
- design review checklist passes

### Decision

Promote `docs/spec/MASTER_SPEC.md` from reviewable design baseline to **DESIGN APPROVED**.

PR #8 may be marked Ready and merged as the documentation authority for future implementation.

### Meaning

Design approval does not mean implementation is complete. Existing runtime code remains a pre-baseline prototype and code stays frozen until a new implementation task explicitly selects a slice from the approved design.
