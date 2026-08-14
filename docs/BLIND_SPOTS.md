# Blind-Spot Sweep

This legacy project-level checklist is retained for continuity. The current canonical full sweep is `docs/spec/FINAL_BLIND_SPOT_SWEEP.md`.

## Product and content

- High engagement may not indicate purchase intent.
- Viral content may already be saturated.
- Informal names and visually similar listings can merge different products.
- Novelty can hide low repeat-use value.
- Hooks can become exaggeration, scarcity, or copied phrasing.
- First-hand language may appear without actual use.
- Affiliate value can distort product usefulness if commercial signals become sovereign.

## Mobile-first web

- Browser/PWA lifecycle cannot own scheduling or publication correctness.
- Mobile tabs can suspend, reload, or lose local state during review/upload.
- Cross-device review can become stale after desktop/mobile edits.
- PWA install and push behavior differ across operating systems and browsers.
- Camera/file upload friction may eventually justify a native shell, but this must be demonstrated by usage evidence.
- No critical action can depend on hover.

## Research sources

- A public page may prohibit automated collection even when it is visible.
- An official API may not expose the same fields as the public UI.
- Search results may be personalized, regional, delayed, or incomplete.
- Deleted or edited posts can invalidate evidence after drafting.
- One repost can appear as several independent sources.
- Purchase-intent phrases can be sarcasm, spam, or coordinated promotion.
- Product listing titles can contain keyword stuffing or mismatched variants.
- Seller-controlled listings are not independent proof of performance claims.
- Excerpts can still contain personal data after simple text cleanup.
- Media rights differ from permission to store metadata or quote short text.
- Synthetic fixtures can hide real-world encoding, pagination, auth, and rate-limit failures.
- Source timestamps can reflect retrieval rather than original publication.
- Terms and robots can change after an adapter is approved.
- Affiliate availability may differ by account, region, or login state.

## Media and public figures

- Public visibility is not publication permission.
- AI-generated or transformed media can imply endorsement that never happened.
- Public use/appearance is not recommendation, sponsorship, or endorsement.
- Old celebrity/broadcast material can resurface and appear current.
- Fandom activity can mimic purchase intent.

## Agent and runtime

- Several agents can repeat one contaminated assumption.
- Guardian can rubber-stamp Writer if contexts are not independent.
- A schema-valid output can still be factually wrong.
- Provider behavior can change without code changes.
- Timeout and retry behavior can create duplicate cost.
- Safe tool names can hide unsafe handlers.
- Human approval can degrade into approval fatigue rather than real review.

## Versioning and persistence

- Hashes prove consistency, not truth.
- Hash chains detect mutation but not deletion of an entire run directory.
- JSONL is not transactional across processes.
- Partial final lines require recovery.
- Retention and garbage collection are not yet implemented.
- Prompt or evidence changes can invalidate many downstream artifacts.
- Source and artifact hashes can reveal repeated use across runs.
- Approval must bind exact artifact revisions or cross-device edits can publish a different version.

## Business and platform

- Daily volume can exceed truthful material supply.
- View optimization can reduce trust and conversion.
- Live publishing timeouts can create unknown remote state.
- Unsafe high-performing celebrity/issue content can poison analytics learning unless explicitly excluded.
- The system can become a complex SaaS before the personal workflow is proven.
- Operational cost can exceed affiliate value even when engagement rises.
