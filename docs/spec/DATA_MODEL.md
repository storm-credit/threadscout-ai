# Canonical Data Model v1

This is a conceptual data model. It defines entities and invariants, not a database implementation.

## 1. `AccountProfile`

- account_id
- language
- audience_definition
- content_lane_weights
- blocked_categories[]
- tone_profile
- affiliate_policy_ref
- publishing_policy_ref
- privacy_policy_ref

## 2. `Run`

- run_id
- objective
- created_at
- state
- current_stage
- budgets
- source_window
- agent_invocations[]
- human_decisions[]
- final_status

## 3. `SourceRecord`

- source_id
- source_type
- source_tier
- canonical_url_or_reference
- publisher/origin
- observed_at
- retrieved_at
- excerpt/structured facts
- rights_metadata
- privacy/redaction state
- content_hash
- retention_until

## 4. `IssueSignal`

- issue_id
- type: public_figure / broadcast / cultural / event / seasonal
- public_context
- source_refs[]
- started_at
- peak_window
- product_terms[]
- purchase_intent_terms[]
- sensitivity_level
- rumor_private_flag

## 5. `MediaAsset`

- media_id
- source_ref
- type: image / video / frame / user_owned
- creator_owner
- observed_at
- analysis_allowed
- publish_rights_state
- allowed_actions[]: link / embed / quote / download / transform / publish
- depicted_product_clues[]
- public_figure_context_ref or null
- transform_history[]
- hash

No identity-from-image field exists.

## 6. `ProductHypothesis`

- hypothesis_id
- candidate_id
- proposed_brand
- proposed_product
- model
- variant
- evidence_refs[]
- confidence
- status

## 7. `Candidate`

- candidate_id
- normalized_name
- content_lane
- discovery_reason
- source_refs[]
- media_refs[]
- issue_id or null
- hypotheses[]
- attention_signals[]
- purchase_intent_signals[]
- utility_score
- demonstration_score
- novelty_score
- saturation
- audience_fit
- scout_decision

## 8. `CanonicalProduct`

- product_id
- brand
- product_name
- model
- variant
- package_quantity
- stable_identifiers[]
- canonical_evidence_refs[]

## 9. `ProductMatch`

- match_id
- candidate_id
- product_id
- state: exact / likely / substitute / unresolved
- dimensions[]
- conflicts[]
- confidence
- verified_at

## 10. `CommerceSnapshot`

- snapshot_id
- product_id
- listing_ref
- seller
- model_variant
- package_quantity
- price
- currency
- availability
- stock_state
- observed_at
- expires_at

Price is nullable; timestamp is not.

## 11. `PublicFigureRelation`

- relation_id
- issue_id
- person_or_program_text_ref
- classification
- evidence_refs[]
- allowed_wording
- prohibited_implications[]

The system does not infer a person's identity from an image.

## 12. `UsageRecord`

- usage_id
- product_id
- owner: user
- state: confirmed / not_confirmed
- evidence_refs[]
- recorded_at

## 13. `EvidencePacket`

- evidence_packet_id
- candidate_id
- canonical_product_ref
- match_ref
- verified_claims[]
- prohibited_claims[]
- media_rights_refs[]
- public_figure_relation_ref
- usage_record_ref
- commerce_snapshot_ref
- freshness
- conflicts[]
- verifier_decision
- hash

## 14. `ContentBrief`

- brief_id
- evidence_packet_hash
- audience
- content_goal
- angles[4]
- disclosure_requirement
- media_plan
- prohibited_implications[]

## 15. `Draft`

- draft_id
- brief_id
- angle_id
- text sections
- claim_refs[]
- disclosure
- media_ref
- hash

## 16. `ReviewReport`

- review_id
- draft_bundle_hash
- evidence_packet_hash
- decision
- findings[]
- revision_requests[]
- blockers[]

## 17. `HumanApproval`

- approval_id
- actor
- approved_at
- draft_hash
- media_hash
- evidence_packet_hash
- affiliate_mapping_hash
- decision

## 18. `AffiliateMapping`

- mapping_id
- destination_product_id
- relationship: exact / alternative
- affiliate_network
- destination_ref
- disclosure_text
- verified_at

## 19. `ScheduledPost`

- schedule_id
- approval_id
- scheduled_for
- timezone
- preflight_state
- idempotency_key
- status

## 20. `PublishedPost`

- publication_id
- schedule_id
- remote_post_id
- published_at
- content_hash
- final_media_refs[]
- final_affiliate_mapping_ref

## 21. `MetricSnapshot`

- metric_id
- publication_id
- observed_at
- views/impressions when available
- replies
- likes
- reposts/quotes when available
- link_clicks when available
- affiliate conversions/revenue when legitimately available

## 22. Invariants

- every factual draft claim maps to verified evidence
- every external post maps to one human approval
- every approval binds exact evidence/draft/media/affiliate versions
- an evidence change can invalidate downstream artifacts
- similar product mapping can never be serialized as exact
- analysis permission never implies publication rights
