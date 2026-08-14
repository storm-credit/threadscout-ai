# Media Usage Scenarios v1

Status: DESIGN ONLY

## 1. Principle

`발견 가능`, `분석 가능`, `저장 가능`, `게시 가능` are four different questions.

A media reference may help identify a product while remaining completely unusable in the final post.

## 2. Media action states

Every media asset/reference stores permissions independently for:

- `analyze`
- `store_metadata`
- `store_copy`
- `link`
- `embed`
- `crop_or_transform`
- `republish`
- `commercial_use`

Unknown is not treated as allowed.

## 3. Scenario matrix

| Scenario | Internal analysis | Store copy | Publish original media | Preferred treatment |
|---|---|---|---|---|
| user-owned photo/video | yes | yes | yes, subject to user confirmation | strongest option |
| media created specifically for the project | yes | yes | yes | preferred |
| brand-provided press/product asset with commercial permission | yes | per license | per license | record license/source |
| retailer/product-page image | may be referenced for matching | only if permitted | not assumed | use as evidence, replace for post unless rights confirmed |
| public social post from another creator | discovery/reference only | not assumed | not assumed | link/embed only when platform/source terms allow |
| official celebrity/brand/public-figure social post | discovery/reference | not assumed | not assumed | source evidence; do not equate public with reusable |
| news article photo/screenshot | evidence/reference | not assumed | generally not assumed | cite/link source; obtain separate publishable media |
| TV/streaming broadcast clip | evidence/reference | not assumed | not assumed | do not re-upload without rights |
| community repost/meme | weak discovery lead | no by default | no by default | locate original source first |
| AI-generated illustrative media | yes | yes | potentially | must not falsely depict a real use/event/product detail |
| manufacturer diagram/manual excerpt | analysis possible | license-dependent | license-dependent | use factual insights, not automatic image reuse |

## 4. Scenario A — user directly owns and photographs the product

### Evidence value

Strong for:

- personal-use status
- physical appearance
- actual use demonstration
- limitations experienced by the user

### Requirements

- user confirms ownership/permission to use media
- EXIF/location-sensitive data is stripped or minimized before publication when unnecessary
- other people in the image are handled according to privacy/consent rules

### Content allowance

First-hand wording is allowed only after personal-use record is confirmed.

## 5. Scenario B — viral public video reveals a possible product

Workflow:

1. store URL/metadata as discovery reference
2. mark original video `analysis_only` unless rights say otherwise
3. extract observable product clues
4. independently locate product evidence
5. Verifier decides exact/likely/substitute/unresolved
6. create or obtain publishable media separately

The system must never download and repost the viral clip merely because it produced the candidate.

## 6. Scenario C — celebrity/broadcast scene

Separate records:

- IssueSignal / public event
- MediaReference / scene source
- PublicFigureRelation
- ProductHypothesis
- ProductMatch
- MediaRights

A scene can prove an appearance or visible object but still fail product identity or publication-right checks.

If the final post uses no original scene media, issue-linked copy may still be possible when the factual relationship is sufficiently verified.

## 7. Scenario D — retailer product image is the clearest exact-product evidence

The image may help Verifier compare:

- packaging
- variant
- geometry
- label/model text

But final publication must use:

- user-owned media
- licensed commercial asset
- permitted embed/link treatment
- or text-only content

unless retailer terms explicitly allow the planned reuse.

## 8. Scenario E — no publishable media exists

The candidate does not automatically die.

Permitted fallback order:

1. ask user to attach owned media
2. use text-only Threads post
3. use a separately licensed neutral product asset
4. create clearly illustrative, non-deceptive original media when appropriate
5. hold candidate if visual proof is essential to the claim

## 9. Scenario F — AI-generated product image

Allowed only when it does not misrepresent the real product or event.

Blocked examples:

- placing a real celebrity into a fabricated product-use scene
- fabricating a broadcast screenshot
- showing a feature the product does not have
- fake before/after effect
- fake packaging or exact model representation presented as documentary evidence

Safer uses:

- generic explanatory diagram
- non-documentary concept illustration
- layout asset that does not claim a real event occurred

## 10. Media-rights confidence

Use explicit states:

- `owned`
- `licensed_commercial`
- `platform_embed_allowed`
- `link_only`
- `analysis_only`
- `unknown`
- `blocked`

Do not use a numeric confidence to override a missing permission.

## 11. Guardian checks

Before human approval Guardian verifies:

- every attached media asset has a publishable state
- publication action matches the permission state
- source attribution requirements are satisfied
- media does not imply a stronger public-figure/product relation than evidence supports
- media is not a substitute presented as exact
- AI-generated media is not deceptive documentary evidence

## 12. Design default

For MVP, the safest publication priority is:

`user-owned/original media > explicitly licensed asset > permitted embed/link > text-only > hold`

Third-party download-and-reupload is not an MVP path.
