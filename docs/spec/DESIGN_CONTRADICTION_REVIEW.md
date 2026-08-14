# Design Contradiction Review v1

Status: DESIGN ONLY.

## Review scope

Cross-check the Master Spec, platform decision, agent contracts, ranking, evidence, media, issue, matching, content, review binding, scheduling, analytics, blind-spot sweep, and review-gate documents for incompatible rules.

## Results

### Delivery platform versus system authority

Consistent: mobile-first responsive web is the primary product surface, but browser/PWA state does not own durable approval, scheduling, freshness, or publishing correctness. Desktop and mobile share one server-authoritative state model.

### Platform versus background work

Consistent: PWA installability, service workers, and push notifications are enhancements. Background scheduling and publication belong to server/background services and continue to follow the same approval/preflight rules.

### Agent roster

Consistent: exactly six agents. Price remains Verifier evidence. Operational services remain deterministic.

### Ranking versus safety

Consistent: opportunity score ranks attention/value but never overrides evidence readiness, risk, freshness, suppression, media state, or blocked state.

### Media

Consistent: research references and final-use state are separate. Public visibility is not treated as automatic final-use permission. Generated/transformed media cannot create an unsupported real-person endorsement implication.

### Issue-trigger content

Consistent: public event context may create a product hypothesis; relationship grade, exact identity, media state, commercial mapping, and freshness are separate. Rumor/private-life content remains blocked.

### Product matching

Consistent: exact, likely, substitute, and unresolved are distinct. Only exact may be presented as the same item. A commercial URL changing product/variant invalidates the prior mapping.

### Source independence

Consistent: evidence confidence depends on source origin/independence rather than URL count. Reposts/mirrors do not become independent corroboration simply by appearing at multiple URLs.

### Writing

Consistent: Writer uses verified artifacts and does not independently add facts. First-hand wording requires a usage record. Public use cannot be promoted into endorsement wording without the corresponding relation evidence.

### Guardian and human review

Consistent: Guardian precedes the human review decision. Material upstream changes invalidate downstream review state. Human approval binds exact artifact revisions and cross-device stale decisions are rejected.

### Human-in-the-loop versus approval fatigue

Consistent: the design requires human approval but also defines notification severity and blocker-first presentation. Human involvement is not satisfied by an undifferentiated warning pile or a stale one-click approval.

### Publishing

Consistent: unknown remote state requires reconciliation before retry. Expired/revoked authorization stops dispatch. Browser/PWA lifecycle cannot be used as a fallback publication mechanism.

### Analytics

Consistent: performance learning cannot promote patterns whose success depends on rumor, misleading identity, hidden disclosure, or other blocked behavior. High engagement is not a safety override.

### Daily volume

Consistent: daily capacity is not a posting quota. Fewer recommendations or no recommended item is a valid result.

### Blind-spot traceability

Consistent: all B0 items in Final Blind-Spot Sweep v1 have named design authority and behavioral acceptance coverage in `B0_TRACEABILITY_MATRIX.md`. This is design coverage, not proof of live implementation.

## Open design tensions, not contradictions

- exact production score threshold remains provisional
- evidence TTL values remain provisional
- deployment and credential-storage choices are open
- live source capabilities and commercial program rules require current/account-specific evidence
- source-specific media action rules remain P0
- supported browser/device matrix and upload constraints remain P1
- final visual styling remains unapproved

## Conclusion

No structural contradiction was found that requires changing:

- the fixed six-agent architecture
- the Opportunity Inbox decision surface
- the mobile-first responsive web platform direction
- the server-authoritative operational model

Remaining gaps are primarily live-environment P0 decisions, first-slice P1 defaults, final visual/interaction approval, and document consolidation rather than missing core architecture.
