# Candidate Dedupe Guardrail — Reference-first Review

Status: implementation record for the candidate dedupe slice.

Baseline: `97fc8c7b340728dcc13756366f86fba3a4b099ce`.

## References reviewed

| Reference | Adopt | Do not adopt / boundary | Impact |
|---|---|---|---|
| ECMAScript `String.prototype.normalize` | use Unicode NFKC normalization before deterministic comparison | normalization is not product identity by itself | punctuation/width/case variations can be compared consistently without inventing semantic equivalence |
| PostgreSQL `pg_trgm` documentation | use as future production reference for explainable character-trigram similarity/indexing | no database/extension introduced in this bounded slice; no fuzzy score may manufacture exact identity | keep DB trigram search as escalation path when the production store exists |
| SQLite FTS5 trigram tokenizer documentation | use as comparison for substring-oriented trigram matching | do not add SQLite/FTS just for <=50 local candidates | confirms trigram is useful later but wider than current need |
| ThreadScout `DATA_MODEL.md` | preserve separate Candidate vs CanonicalProduct/ProductMatch truth boundaries | do not convert name similarity into `exact` ProductMatch | dedupe remains a portfolio/workflow guardrail, not Verifier authority |
| ThreadScout `FINAL_BLIND_SPOT_SWEEP.md` / AT-28 / AT-29 | repetitive candidates should not force slots; portfolio selection must expose suppression reasons | do not hide fuzzy decisions without user-visible rationale | possible duplicates require explicit review and exact duplicates require deterministic explainable keys |

Primary references reviewed:

- https://tc39.es/ecma262/multipage/text-processing.html#sec-string.prototype.normalize
- https://www.postgresql.org/docs/current/pgtrgm.html
- https://www.sqlite.org/fts5.html#the_trigram_tokenizer

## Key conclusions

1. Unicode normalization is appropriate preprocessing, but product identity still requires domain dimensions.
2. Exact auto-suppression must require stable product dimensions already supplied by the owner: brand + model + variant. A seller/source URL is deliberately excluded because the same URL may later resolve to a different product.
3. Fuzzy or token similarity is only a **possible duplicate** signal. It cannot set `exactMatchStatus=exact`, cannot merge evidence, and cannot replace Verifier.
4. Known conflicting brand/model/variant values short-circuit fuzzy duplicate classification.
5. Possible duplicate state needs an explicit owner decision because false-positive suppression can hide a commercially distinct option/variant.
6. At the current bounded local scale, an O(n) deterministic comparison over candidate history is simpler and more testable than adding an index dependency or database extension. A database-level fuzzy index becomes appropriate after the approved production transactional-store migration.

## License / reuse

No external code is copied. Standards/database documentation is used only to inform behavior. Implementation uses project-owned code and JavaScript standard-library behavior.

## Decision

Proceed with Option A from the implementation plan: deterministic exact identity suppression plus conservative possible-duplicate review, with explicit human resolution and no live/provider/database expansion.
