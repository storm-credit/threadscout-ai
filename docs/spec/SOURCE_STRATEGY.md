# Source Strategy v1

## 1. Purpose

Define what each source can prove, what it cannot prove, and which agent may use it.

## 2. Source roles

### Discovery sources

Used by Scout to answer “what is becoming interesting?”

Examples:
- Threads keyword/topic search when authorized
- public search/trend data
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
- reliable reporting for public event context

### Corroboration sources

Used to check whether attention or purchase intent exists outside one source. A trend index is a signal, not sales data.

## 3. Planned source stack

- Meta Threads Keyword Search: primary future platform-native discovery
- NAVER API HUB Search Trend / Shopping Insight: Korean corroboration
- manual user references: always-supported offline fallback
- official brand/retailer/public-figure/broadcast pages: verification where available
- Google Trends API alpha: optional/deferred
- Coupang Seller Open API: not a general affiliate discovery source

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

Independent evidence means materially separate origin, not merely separate URLs.

## 6. Query budget

Live design must define per-run limits for:

- search requests
- result pages
- media metadata fetches
- listing checks
- retries

Scout must stop when budget is exhausted and return partial evidence rather than silently broadening scope.

## 7. Source activation gate

A live source requires:

- official access method documented
- allowed use reviewed
- required account/permission known
- rate limits/quota/cost known
- retention/privacy plan known
- failure and pagination semantics known
- credential storage outside Git
- explicit human activation approval
- reviewed implementation PR

## 8. No fallback scraping by surprise

If an official API is unavailable, the system does not silently switch to scraping. The source is marked unavailable and the Orchestrator chooses manual evidence, another approved source, or stop.
