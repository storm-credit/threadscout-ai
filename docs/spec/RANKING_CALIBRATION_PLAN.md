# Ranking Calibration Plan v1

Status: DESIGN ONLY.

The initial opportunity weights and review floor are starting hypotheses, not learned truth.

## Calibration phases

### Phase 1 — synthetic/fixture review

Use designed scenarios to confirm the score orders obvious cases sensibly while evidence/risk gates remain independent.

### Phase 2 — manual operating review

During early real operation, compare candidate score components against the product owner's actual selections, holds, and rejections. Do not change weights automatically.

### Phase 3 — outcome-informed review

Once enough real posts exist, compare opportunity components with attention, intent, commercial, and trust outcomes. Separate correlation from causal claims.

### Phase 4 — bounded weight update

Propose weight changes as a reviewed configuration decision. Safety, exact-product, media, suppression, and evidence gates are never learned away.

## Calibration outputs

- distribution of scores by lane
- selection rate by score band
- evidence-ready rate by score band
- rejection/Guardian rate by score band
- outcome summaries by component
- proposed weight change with expected effect

## Rule

A model may recommend a calibration change, but the active production weights change only through a recorded configuration decision.
