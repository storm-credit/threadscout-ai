# Pre-Implementation Trap Check

No publishing integration should begin until every blocking item is resolved.

## Platform and API

- [ ] Confirm current Threads API capabilities from official documentation.
- [ ] Confirm required account type, app setup, permissions, and review process.
- [ ] Confirm text, image, video, carousel, reply, scheduling, search, and insight limitations.
- [ ] Confirm rate limits and error semantics.
- [ ] Define access-token encryption, rotation, refresh, and revocation.

## Publishing safety

- [ ] Define an explicit approval-state machine.
- [ ] Define idempotency keys for each publish attempt.
- [ ] Separate scheduled, publishing, published, failed, cancelled, and unknown states.
- [ ] Handle timeout-with-unknown-result without blind retry.
- [ ] Provide a global publishing kill switch.
- [ ] Define maximum retry count and backoff.

## Product identity and data quality

- [ ] Store canonical product name, brand, model/variant, seller/listing, and evidence.
- [ ] Distinguish exact match, likely match, substitute, and unresolved.
- [ ] Recheck availability and identity before publishing.
- [ ] Store when and how a product was personally used.
- [ ] Prevent first-hand language unless usage status is confirmed.

## Content integrity

- [ ] Classify each statement as verified fact, user experience, opinion, inference, or unknown.
- [ ] Add duplicate and near-duplicate detection.
- [ ] Add prohibited and high-risk claim checks.
- [ ] Add affiliate disclosure at a visible location.
- [ ] Record media source, license/permission, and transformation history.

## Security and privacy

- [ ] Keep secrets out of source control and client bundles.
- [ ] Apply least-privilege credentials.
- [ ] Define data retention and deletion.
- [ ] Log external actions without logging tokens or sensitive payloads.
- [ ] Protect approval actions against accidental or duplicated requests.

## User experience

- [ ] Confirm the first-screen information hierarchy on a narrow mobile viewport.
- [ ] Show why a product was recommended, not only a numeric score.
- [ ] Show uncertainty and blocking risks before the CTA.
- [ ] Ensure approve and reject actions cannot be confused.
- [ ] Provide undo or cancellation where technically possible.
