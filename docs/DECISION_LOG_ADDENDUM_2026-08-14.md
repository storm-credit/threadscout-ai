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

### Reason

The core workflow is short, frequent decision work that should be possible from a phone while preserving a larger desktop evidence/research surface. A shared responsive web product validates the workflow before app-store/native release complexity is justified.

### Constraint added

Browser/PWA state cannot own scheduling, publication, approval truth, or background correctness. Durable state and future background work are server-authoritative.

### Revisit trigger

Native work requires measured evidence that responsive web/PWA causes persistent problems in capture/upload, notification reliability, approval latency, share/import flow, or offline use.

---

## Final Master Design blind-spot sweep completed

### Context

The initial `docs/BLIND_SPOTS.md` was useful but predates the expanded Master Design domains: mobile web/PWA, public-figure issue discovery, media rights, cross-device approval, analytics learning, and full publishing reconciliation.

### Change

Added `docs/spec/FINAL_BLIND_SPOT_SWEEP.md` with severity-ranked cross-domain blind spots and updated `docs/PRE_IMPLEMENTATION_TRAPS.md` with implementation-facing checks.

### Most important findings

- browser/PWA lifecycle cannot be an operational authority
- cross-device edits can invalidate an approval
- public media discovery is not publication permission
- public use is not endorsement
- multiple agents can repeat one contaminated assumption
- human approval can degrade into approval fatigue
- unknown remote publish state can create duplicates
- unsafe high-performing issue content can poison analytics learning
- the product can become over-engineered before its economics are proven

### Architecture impact

No finding requires changing the fixed six-agent orchestra or mobile-first web platform direction.

### Governance impact

Applicable B0 blind spots must be mapped to requirements/design/acceptance behavior before an implementation slice begins. Acceptance coverage now extends through AT-39.

### Remaining risk

Live/account-specific P0 items and first-slice P1 defaults are still unresolved. The design remains frozen and PR #8 remains a draft review baseline.
