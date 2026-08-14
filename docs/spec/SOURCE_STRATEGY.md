# Source Strategy v1

Status: **APPROVED DESIGN BASELINE**.

Last public-capability review: 2026-08-14.

## 1. Purpose

Define what each source can prove, what it cannot prove, which agent may use it, and what must be true before the source becomes live.

## 2. Source roles

### Discovery sources

Used by Scout to answer “what is becoming interesting?”

Examples:
- Threads keyword/topic search when the target app/account is authorized
- NAVER trend/shopping-insight signals through the current supported API channel
- public event/news signals
- user-supplied references

Discovery sources may trigger investigation but cannot alone establish exact product identity, endorsement, rights, or current commerce facts.

### Verification sources

Used by Verifier to answer “what exactly is this and what can we say?”

Examples:
- official brand/product material
- authorized retailer/listing evidence
- first-party public-figure/broadcast sources
- user-owned product/receipt/media evidence
- reliable reporting for public-event context
- a user-supplied commercial destination captured as a versioned identity snapshot

### Corroboration sources

Used to check whether attention or purchase intent exists outside one source. A trend/click index is a signal, not sales volume or proof of conversion.

## 3. Approved source posture

### Meta Threads

Design role: **primary platform-native discovery and publishing/analytics target**.

Current Meta-published Threads API material documents OAuth-based app authorization, keyword search with TOP/RECENT modes, publishing flows, and post/account insight endpoints. The design therefore keeps explicit adapters for discovery, insights, and publishing.

Activation rule: actual target app/account scopes, token, identity, current fields, rate limits, and behavior must be verified immediately before the corresponding adapter is enabled. Design support is not account authorization.

### NAVER API HUB

Design role: **Korean corroboration for search/shopping attention**, not exact sales or exact-product proof.

NAVER announced in June 2026 that Search API, Search Trend, and Shopping Insight are moving from NAVER Developers to NAVER API HUB. After 2026-07-31, new applications for the migrated APIs go through NAVER API HUB; legacy developer-center access has a transition period for eligible existing users. The old NAVER Developers Shopping Search API ended on 2026-07-31 and has no NAVER API HUB replacement, so it must not be treated as an exact-product listing source.

NAVER API HUB Shopping Insight can provide category/keyword click-trend data. This remains relative interest/click evidence rather than product sales truth.

Activation rule: use NAVER API HUB credentials for new integrations and verify current quota/pricing/account state at implementation time.

### Manual/user-supplied references

Design role: **always-supported MVP fallback and direct-entry path**.

A user may provide:
- a Threads/public source URL
- a product page
- a Coupang Partners destination
- owned photo/video
- receipt/order evidence
- a product name/model to investigate

Manual input does not bypass verification. It simply removes the need for automated discovery.

### Coupang / commercial destination

Design role: **first affiliate destination target**, not assumed to provide a general public product-discovery API.

For MVP, exact-product verification may begin from a user-supplied Coupang/affiliate destination plus a captured product/variant/seller snapshot. Automated product search is not required for the first implementation slice.

The design does not repurpose seller-management APIs or undocumented scraping as affiliate product discovery.

### Google Trends

Design role: optional corroboration only. It is not required for MVP and cannot become a single source of product truth.

## 4. Evidence tier policy

Tier 1 primary evidence can support a direct factual claim when current and unconflicted.
Tier 2 reliable secondary evidence can support public-event context and corroboration.
Tier 3 discovery-only sources can generate hypotheses only.

Two Tier 3 sources do not automatically become Tier 1 evidence.

## 5. Independence

The system must detect obvious dependency where possible:

- repost of same original post
- article quoting the same source
- mirrored retailer listing
- fan reposts of one image
- multiple search results whose factual claim traces to one seller/press release

Independent evidence means materially separate origin, not merely separate URLs.

## 6. Query budget

Each live adapter defines per-run limits for:

- search requests
- result pages
- media metadata fetches
- listing checks
- retries
- model/tool consumption where applicable

Scout stops when budget is exhausted and returns partial/blocked state rather than silently broadening scope.

## 7. Source activation gate

A live source requires:

- official/authorized access method documented
- allowed use reviewed
- required account/permission known
- rate limits/quota/cost known
- retention/privacy plan known
- failure, pagination, edit/delete, and stale-cache semantics known
- credential storage outside Git/client
- source independence behavior defined
- explicit capability activation in configuration
- implementation verification

Account-specific activation is not part of design approval and may remain disabled.

## 8. No fallback scraping by surprise

If an official/authorized API or user-supplied source is unavailable, the system does not silently switch to scraping. The source is marked unavailable and the Orchestrator chooses manual evidence, another approved source, or stop.

## 9. Public capability references reviewed for this baseline

- Meta Threads API developer documentation / Meta-published Threads API collection and changelog
- NAVER Developers notice on Search API, Search Trend, Shopping Insight migration to NAVER API HUB (2026-06-29)
- NAVER Developers notice ending Shopping/Book/Academic search APIs (2026-06-30; effective 2026-07-31)
- NAVER API HUB Shopping Insight documentation
- Coupang Partners official portal as the commercial-program authority to be rechecked at activation

These references establish adapter direction, not permanent guarantees. Current account-specific capability always wins at activation time.
