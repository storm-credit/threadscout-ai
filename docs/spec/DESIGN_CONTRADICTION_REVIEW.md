# Design Contradiction Review v1

Status: **FINAL PASS FOR MASTER DESIGN v1**.

## Review scope

Cross-check the Master Spec, platform decision, agent contracts, ranking, evidence, media, issue, matching, content, review binding, scheduling, analytics, final blind-spot sweep, P0/P1 decisions, and design-governance documents for incompatible rules.

## Results

### Delivery platform versus system authority

Consistent: mobile-first responsive web is the primary product surface, but browser/PWA state does not own durable approval, scheduling, freshness, or publishing correctness. Desktop and mobile share one server-authoritative state model.

### Platform versus background work

Consistent: PWA installability, service workers, and push notifications are enhancements. Background scheduling and publication belong to server/background services and continue to follow the same approval/preflight rules.

### Agent roster

Consistent: exactly six agents. Price remains Verifier/commerce evidence. Operational services remain deterministic.

### Ranking versus safety

Consistent: opportunity score ranks attention/value but never overrides evidence readiness, risk, freshness, suppression, media state, or blocked state. The promoted 65/100 floor is an initial review heuristic only.

### Media

Consistent: research references and final-use state are separate. Public visibility is not automatic final-use permission. Generated/transformed media cannot create unsupported real-person use/endorsement implications.

### Issue-trigger content

Consistent: public-event context may create a product hypothesis; relationship grade, exact identity, media state, commercial mapping, and freshness are separate. Rumor/private-life content remains blocked.

### Product matching and affiliate destination

Consistent: exact, likely, substitute, and unresolved are distinct. Only exact may be presented as the same item. A commercial URL changing product/variant invalidates the prior mapping. Coupang Partners being the first target does not weaken identity or disclosure gates.

### MVP listing source versus automation

Consistent: a user-supplied commercial destination plus a versioned identity snapshot is sufficient to begin MVP verification. Automated listing discovery is optional later work and remains disabled unless an authorized source exists.

### Source independence

Consistent: evidence confidence depends on source origin/independence rather than URL count. Reposts/mirrors do not become independent corroboration simply by appearing at multiple URLs.

### Writing

Consistent: Writer uses verified artifacts and does not independently add facts. First-hand wording requires a usage record. Public use cannot be promoted into endorsement wording without corresponding relation evidence.

### Guardian and human review

Consistent: Guardian precedes human review. Material upstream changes invalidate downstream review state. Human approval binds exact artifact revisions and cross-device stale decisions are rejected.

### Human-in-the-loop versus approval fatigue

Consistent: the design requires human approval while also defining notification severity, blocker-first presentation, and suppression of low-value noise. Human involvement is not satisfied by a stale or undifferentiated one-click approval.

### Publishing

Consistent: unknown remote state requires reconciliation before retry. Expired/revoked authorization stops dispatch. Browser/PWA lifecycle cannot be used as a fallback publication mechanism. Live publishing remains disabled until target account/app activation checks pass.

### Analytics

Consistent: performance learning cannot promote patterns whose success depends on rumor, misleading identity, hidden disclosure, rights violations, or other blocked behavior. High engagement is not a safety override.

### Daily volume and commercial intensity

Consistent: 0–3 is capacity, not quota. Normally no more than one affiliate-heavy post per day. Fewer recommendations or no recommended item is a valid result.

### Retention and security

Consistent: promoted retention windows are default ceilings, subject to stricter source/privacy rules. Production secrets remain server-side and are never stored as design/runtime artifacts.

### Blind-spot traceability

Consistent: all current B0 items in Final Blind-Spot Sweep v1 have named design authority and behavioral acceptance coverage in `B0_TRACEABILITY_MATRIX.md`. This is design coverage, not proof of live implementation.

### P0/P1 completion model

Consistent: Master Design v1 may be complete while account-specific live capabilities remain disabled. `designed`, `configured`, `enabled`, `verified`, and `implemented` are separate states. Unknown live facts fail closed rather than blocking the existence of an approved design baseline.

## Remaining implementation-time variables — not design contradictions

The following are intentionally runtime/configuration facts rather than open architecture questions:

- exact Meta app/account scopes and tokens
- current Coupang Partners account/program disclosure/link rules
- exact managed deployment vendor/region
- exact secret backend product
- source-specific media action permission at the asset/action level
- current platform metrics exposed to the configured account
- exact upload byte/format limits after storage/network constraints are known
- calibrated ranking threshold and TTL tuning after measured use
- final visual styling tokens

They may be configured or calibrated without changing the Master Design's authority boundaries.

## Conclusion

**No unresolved structural contradiction remains in Master Design v1.**

The final design is internally consistent around:

- exactly six agents and no price agent
- Opportunity Inbox decision surface
- mobile-first responsive web
- server-authoritative operations
- Verifier factual authority
- research/final-use media separation
- exact/alternative product semantics
- Guardian + exact-revision human approval
- fail-closed live activation and publishing
- analytics that cannot learn away safety/trust gates

Any future change that weakens one of these invariants must reopen design review before implementation.
