# Live Source Review

Reviewed: 2026-08-08

This document records official-source findings used to prepare disabled adapters. It does not authorize network execution.

## 1. Meta Threads Keyword Search

### Official references

- Meta Threads developer documentation: `https://developers.facebook.com/docs/threads/keyword-search/`
- Meta's official Threads Postman collection: `https://www.postman.com/meta/threads/request/34203612-b3b2c12a-7ce6-4d86-a3c6-6d31e3b66ea1`

### Observed contract

- Host: `https://graph.threads.net`
- Endpoint: `GET /keyword_search`
- Query: `q`
- Sort: `TOP` or `RECENT`
- Search mode: keyword or topic tag
- Scope shown by Meta's collection: `threads_keyword_search`, alongside basic Threads authorization
- Access token and Meta app setup are required

### Decision

Select as the primary future social-discovery source. Keep disabled because app setup, OAuth, permission availability/review, data-use fields, retention, rate limits, and privacy treatment require account-specific confirmation.

### Data minimization

The intended adapter will request only fields needed for product/topic evidence. Usernames, avatars, and unrelated profile data are excluded from the default source record.

## 2. NAVER API HUB Search Trend and Shopping Insight

### Official references

- Overview: `https://api.ncloud-docs.com/docs/naver-api-hub-overview`
- Search Trend: `https://api.ncloud-docs.com/docs/naver-api-hub-search-trend`
- Shopping keyword/device trend: `https://api.ncloud-docs.com/docs/naver-api-hub-shopping-insight-keyword-device`
- Migration notice: `https://developers.naver.com/notice/article/32530`

### Observed contract

- Base URL: `https://naverapihub.apigw.ntruss.com`
- Search Trend: `POST /search-trend/v1/search`
- Shopping Insight keyword/device: `POST /shopping/v1/category/keyword/device`
- Authentication headers: `X-NCP-APIGW-API-KEY-ID` and `X-NCP-APIGW-API-KEY`
- Search Trend returns relative ratios, not absolute search counts
- The legacy developer-center services are migrating to NAVER API HUB; new applications after the announced cutover use API HUB credentials

### Decision

Select as secondary trend corroboration for Korea. It cannot establish exact product identity, seller authenticity, or current stock by itself.

## 3. Google Trends API Alpha

### Official reference

- `https://developers.google.com/search/apis/trends`

### Observed status

The official API is an alpha accepting applications from a limited set of testers. It advertises a rolling five-year window, regular interval aggregation, regional/subregional data, and consistently scaled data for comparing requests.

### Decision

Defer. Do not make the project depend on alpha access that has not been granted.

## 4. Coupang Seller Open API

### Official references

- `https://developers.coupang.com/ko`
- `https://developers.coupang.com/ko/getting-started`

### Observed purpose

The documented Open API targets sellers and integration partners managing product listings, promotions, orders, logistics, returns, stock, and prices. Setup uses a Wing seller account, access/secret keys, IP allowlisting, and HMAC signing.

### Decision

Reject as a general affiliate-product discovery source. It may only be reconsidered for products controlled by an authorized seller account, which is outside the current project goal.

## 5. Manual user evidence

Manual product names and links remain the only enabled fallback. They are inputs, not proof. Evidence Verifier still confirms exact match, claims, media rights, seller/variant, and timestamped commerce state before Guardian review.
