# Exact Product Matching Specification v1

## 1. Goal

Prevent the most damaging affiliate error: showing one product while linking or describing another as if it were exact.

## 2. Match states

### `exact`

Strong evidence identifies the same brand/product/model/variant or uniquely equivalent listing.

### `likely`

Most evidence aligns, but one or more identity dimensions remain unresolved.

### `substitute`

A different product solves a similar problem or looks similar.

### `unresolved`

Evidence is insufficient or conflicting.

## 3. Matching dimensions

Verifier evaluates:

- brand
- product family/name
- model/SKU
- size/dimensions
- color/pattern where identity-relevant
- package quantity
- distinctive mechanism or geometry
- included accessories
- visible markings
- listing photos/specifications
- seller/listing context
- source date

No single visual similarity score can override contradictory model/spec evidence.

## 4. Evidence rule

`exact` normally requires at least one strong primary identity source plus corroboration, or user-owned evidence that uniquely resolves the item.

A social photo + visually similar marketplace listing is not enough by itself.

## 5. Affiliate wording

- exact → “같은 제품/해당 제품” permitted if evidence current
- likely → no same-product claim; hold or use category-level content
- substitute → must say “비슷한 제품”, “대체 후보”, or equivalent
- unresolved → no product-specific affiliate mapping

## 6. Public-figure/broadcast product matching

The system keeps two questions separate:

1. Was this product visible/used in the public event?
2. Is this affiliate listing the exact same product/variant?

Both must be independently supported before copy can say “OO가 사용한 바로 그 제품” or equivalent. Mere visible resemblance is insufficient.

## 7. Commerce snapshot is not identity proof

Price, seller, availability, and listing URL describe a commerce state. They do not prove that the product is the item seen in media.

## 8. Confidence display

User UI should show the match state and the top 2–4 reasons, not only a percentage. Example:

`EXACT — model number matches official page; package color/size aligns; no conflicting evidence.`

## 9. Revalidation

A changed listing image, SKU, seller bundle, model, or variant can invalidate an exact mapping. Before publication, configured stale identity/listing evidence must be rechecked.
