# Issue / Public-Figure Source Grading v1

Status: DESIGN ONLY

## 1. Goal

Issue-triggered discovery may use public entertainment, broadcast, sports, event, or cultural moments to find product interest. The system must classify the reliability of the issue itself separately from the strength of the product relationship.

## 2. Two independent axes

Never collapse these into one confidence number:

- `issue_source_grade` — how reliable is the public event/statement?
- `product_relation_grade` — how strongly is the specific product connected to the public figure/event?

A reliable news article can still show only a weak product relation. A clear visual product clue can still originate from media that cannot be republished.

## 3. Issue source grades

### G0 — primary official

Examples by category:

- public figure's verified official account or agency statement
- broadcaster/program official page
- event organizer official page
- brand official campaign announcement
- league/team/organization official material

Use:

- may establish that a public event, statement, appearance, or official commercial relationship occurred
- does not automatically grant reuse rights for the media

### G1 — high-quality direct reporting

Characteristics:

- identifiable publisher
- byline or editorial responsibility
- clear publication time
- direct reporting or attributable quotation
- corrections policy or established editorial process

Use:

- corroborating issue existence
- locating primary sources
- reported product association when wording is appropriately attributed

### G2 — direct public post / traceable public record

Examples:

- public post from an identifiable brand, retailer, creator, event account, or venue
- public product tag or public caption with traceable origin

Use:

- discovery and corroboration
- relationship evidence when the account is directly relevant

Caution:

- public availability does not mean republishing permission
- account authenticity and context still matter

### G3 — secondary commentary / aggregation

Examples:

- repost account
- community summary
- compilation post
- unsourced entertainment summary

Use:

- discovery lead only
- must not independently support a publishable factual claim

### G4 — rumor / anonymous / private-life speculation

Examples:

- anonymous claim
- dating/private-life speculation
- appearance/body/health speculation
- malicious edit or contextless screenshot
- unverifiable “someone said” content

Use:

- blocked as content evidence
- must not become a product-discovery trigger when the product angle depends on the rumor

## 4. Product relation grades

### R0 — official endorsement / campaign

The brand/public figure relationship is explicitly stated by an official source.

Allowed language can describe the verified campaign relationship, subject to current advertising and disclosure rules.

### R1 — confirmed use or possession

Strong evidence identifies both:

- the public figure/event context
- the exact product or sufficiently unique variant

Must not imply paid endorsement unless separately verified.

### R2 — visible product, exact identity not yet verified

A product is visibly present, but the exact model/variant is unresolved.

Allowed system behavior:

- create a candidate hypothesis
- send to Evidence Verifier

Not allowed:

- same-product claim
- affiliate mapping presented as exact

### R3 — reported association

A G0/G1 source reports a product association but direct product evidence is limited.

Use narrowly attributed wording only after Verifier review.

### R4 — similar-looking / alternative only

The system finds a commercially useful similar product, but it is not the proven item from the issue.

Any affiliate presentation must say `비슷한 제품`, `대체 후보`, or equivalent unambiguous wording.

### R5 — blocked relation

The relation depends on:

- rumor/private-life inference
- invasive identification
- intentionally misleading visual comparison
- unsupported endorsement implication

No issue-linked post may proceed.

## 5. Minimum corroboration rules

For issue-triggered affiliate content:

- one G3 source alone is insufficient
- one visual clue alone is insufficient for exact-product status
- product identity requires independent product/listing evidence
- official endorsement requires explicit commercial relationship evidence
- media-rights decision is separate from source/relation grading

## 6. Candidate card labels

User-facing labels must avoid sensational wording.

Preferred:

- `방송 노출 계기`
- `공식 캠페인 연계`
- `공개 행사에서 관심 증가`
- `제품 추정 — 검증 필요`

Avoid:

- `OO가 강추한` unless directly verified
- `OO의 최애` without a direct attributable source
- private-life bait
- definitive same-product language before R0/R1 plus exact-match verification

## 7. Escalation

Guardian automatically blocks when:

- issue source is G4
- product relation is R5
- wording implies endorsement beyond the verified grade
- publication depends on unlicensed media
- a substitute is presented as the exact issue product

## 8. Allowlist design

The production issue-source allowlist is a P1 configuration artifact.

Every source entry must record:

- source name
- source class
- jurisdiction/language
- official URL/domain or account identifier
- allowed discovery actions
- allowed evidence role
- media action policy reference
- retention/redaction policy
- last policy review date

The design intentionally does not hard-code a permanent list of celebrity/news sources because publisher access, platform policy, and rights conditions change.
