# Photo & Video Discovery / Rights Pipeline v1

## 1. Core principle

`Found online` and `publishable by us` are different states.

## 2. Media purposes

A media reference can serve one of four purposes:

1. discovery — notice a product or issue
2. product matching — extract observable product clues
3. internal evidence — support verification/audit
4. publication asset — appear in the user's Threads post

A single asset may be allowed for 1–3 but not 4.

## 3. Media lifecycle

```text
reference discovered
→ metadata captured
→ origin/creator identified where possible
→ analysis permission state
→ product clues extracted
→ rights review
→ publication decision
   ├─ publish original/owned
   ├─ permitted embed/link
   ├─ replace with user-owned media
   ├─ create clearly non-deceptive illustrative media
   └─ no media
```

## 4. Media rights states

- `user_owned`
- `explicitly_licensed`
- `platform_embed_only`
- `link_only`
- `analysis_only`
- `unknown`
- `prohibited`

Only `user_owned` and `explicitly_licensed` are automatically eligible for re-upload/publication. Other states depend on the exact platform use mechanism and policy.

## 5. What Scout may collect

- source URL/reference
- title/caption excerpt where allowed
- media type
- timestamp
- product terms visible in text/metadata
- public event context
- engagement/purchase questions when permitted

Scout does not download and republish media merely because it is public.

## 6. What Verifier may infer from media

Verifier may record observable product clues such as:

- logo/brand text if legible
- shape
- color
- pattern
- model markings
- package format
- distinctive mechanism

It must not identify a real person from an image. Public-figure context must come from textual/source metadata or an independently known public source, not face recognition.

## 7. Frames and clips

Video frame extraction for internal product matching must preserve:

- source reference
- frame timestamp
- transformation record
- analysis-only status unless rights permit publication

Short clip availability does not imply legal permission to repost.

## 8. User-owned media preference

When a product is selected for affiliate content, preferred publication assets are:

1. user's own photo/video of exact product
2. explicitly licensed asset
3. permitted platform-native embed/link where appropriate
4. no media

The system should not pressure the user to use questionable third-party media to improve engagement.

## 9. AI-generated media

If later enabled, generated media must not falsely depict a real celebrity using or endorsing a product, must not misrepresent product attributes, and must be labeled/configured according to platform and policy requirements. Product-specific generation should use verified product references and a separate approval step.

## 10. Guardian checks

Guardian blocks when:

- rights state is unknown for a planned re-upload
- media shows one product while affiliate link points to another without clear alternative labeling
- edit/crop changes the meaning of the evidence
- celebrity/public-figure media implies endorsement beyond evidence
- before/after imagery implies unsupported effect
