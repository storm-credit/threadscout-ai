# Daily Operating Model v1

Status: DESIGN ONLY

## 1. Objective

ThreadScout should reduce daily decision fatigue. The user should not need to monitor trends continuously or inspect every candidate.

The system designs for a compact daily review cycle with optional deeper investigation when a candidate is promising.

## 2. Daily pipeline

```text
source observations
      ↓
raw candidates (target up to 20)
      ↓
normalization / deduplication / suppression
      ↓
opportunity ranking + portfolio balancing
      ↓
primary inbox (target 5)
      ↓
evidence verification
      ↓
strategy 4
      ↓
draft 4
      ↓
Guardian
      ↓
human approval
      ↓
schedule / hold / reject
```

Candidate counts are planning targets, not quotas. The system may return fewer than five when evidence quality is poor.

## 3. Suggested operating windows

The design supports three content-planning slots per day, but this is not a commitment to publish three affiliate posts.

### Morning review

Purpose:

- inspect overnight/emerging candidates
- handle event or broadcast-triggered opportunities that may decay quickly
- choose candidates that need evidence work

### Midday review

Purpose:

- review evidence packets
- compare strategy/draft options
- approve evergreen practical content if ready

### Evening review

Purpose:

- review scheduled content and preflight state
- inspect same-day performance signals without overreacting
- suppress low-quality/repetitive candidate patterns

Exact publication times remain a configurable P1 decision.

## 4. User time budget design

Target routine when data is healthy:

- first inbox scan: 1–3 minutes
- evidence/draft review for one candidate: 2–5 minutes
- approval/scheduling: under 1 minute

The system must not manufacture candidates merely to fill a quota.

## 5. Candidate portfolio target

The inbox may contain a mixture of:

- practical novel item
- family/elementary household item
- travel/desk/storage item
- issue-triggered product candidate
- value-first non-affiliate topic

Hard rule: issue-triggered candidates do not automatically displace stronger evergreen candidates.

## 6. Publication portfolio design

Publication volume and affiliate ratio remain P1 settings. Until confirmed, the system distinguishes three content intents:

### `value_only`

No affiliate link is needed. Purpose is usefulness, trust, question answering, or account identity.

### `product_editorial`

A product is discussed, but the primary value is explanation/comparison. Affiliate mapping may be absent.

### `affiliate_candidate`

Exact or clearly labeled alternative product mapping exists and disclosure is required.

The dashboard must show these intents before approval so the user can avoid an ad-heavy account unintentionally.

## 7. Urgency classes

### U0 — evergreen

Useful for days/weeks. No pressure to post today.

### U1 — timely

Interest is rising; review within the day.

### U2 — fast-decay issue

Broadcast/event/current public moment. Review quickly but do not lower evidence standards.

### U3 — expired/stale

The why-now angle is no longer valid. Candidate can still be reframed as evergreen if useful.

Urgency changes review order, not truth standards.

## 8. Daily stop conditions

The daily pipeline stops or returns fewer recommendations when:

- source freshness is inadequate
- evidence quality is weak
- too many candidates depend on unlicensed media
- issue sources are rumor-heavy
- the available products are repetitive
- all candidates are suppressed/high risk

`오늘은 추천 없음` is a valid output.

## 9. Daily user controls

From the first screen the user can:

- open candidate
- hold until tomorrow
- mute topic for a period
- suppress product/brand/category/source
- mark `관심 없음`
- mark `이런 제품 더 찾기`
- attach own product/photo/reference

These controls feed deterministic preference/suppression records, not hidden autonomous profile changes.

## 10. Weekly review

Weekly review is more important for changing strategy than same-day vanity metrics.

Review dimensions:

- lane performance
- angle performance
- purchase-intent quality
- affiliate conversion where available
- evidence failure rate
- Guardian revision/block rate
- media-rights bottlenecks
- issue-triggered vs evergreen quality
- user review time

The weekly report may recommend a change, but changes to ranking weights, affiliate ratio, or source policy require explicit recorded acceptance.

## 11. Failure-day behavior

Examples:

### Source outage

Use cached metadata only where its freshness class remains valid; otherwise show reduced recommendations.

### No exact product match

Keep as discovery/editorial candidate or hold. Do not attach a deceptive affiliate link.

### No publishable media

Use owned/licensed/text-only fallback or hold.

### Issue becomes disputed

Invalidate issue-linked strategy/drafts and require review.

### Product sells out

Remove or reframe commerce CTA; alternatives must be explicitly labeled.

## 12. Daily success measure

The operating system succeeds when the user makes a high-confidence posting decision faster, with fewer factual/media/affiliate mistakes. A day with one strong post can be better than a day with three weak posts.
