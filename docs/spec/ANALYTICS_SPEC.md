# Analytics & Learning Specification v1

## 1. Purpose

Turn outcomes into bounded learning signals while preventing a feedback loop that rewards spam, outrage, or misleading celebrity hooks.

## 2. Metric classes

### Attention

- views/impressions
- profile visits when available
- likes
- replies
- reposts/quotes

### Intent

- saves/bookmarks when available
- “where to buy / link / price / exact item” replies
- outbound link clicks

### Commercial

- affiliate conversions
- revenue/commission when legitimately available

### Trust/quality

- negative feedback
- post corrections/deletions
- Guardian revision frequency
- user rejection rate
- product mismatch incidents

## 3. Dimensions

Analyze by:

- content lane
- product category
- strategy angle
- issue-triggered vs evergreen
- public-figure relationship class
- exact vs alternative mapping
- media type
- posting time/day
- direct-use vs research-based
- disclosure/affiliate vs non-affiliate

## 4. Attribution caution

The system must not claim causality from small samples. Reports distinguish:

- observation
- correlation hypothesis
- sufficient repeated signal
- unknown

## 5. Learning output

The analytics service produces `learning_summary` with:

- strong repeated patterns
- weak hypotheses
- failed patterns
- recommended experiments
- confidence
- minimum sample note

Scout receives compact approved features, not raw user comments or instructions to imitate a specific creator.

## 6. Guardrails

A format is not promoted if its performance depends on:

- misleading product identity
- unsupported celebrity endorsement implication
- rumor/private-life hooks
- excessive affiliate frequency
- policy violations
- hidden disclosure

## 7. Experiment design

Prefer one-variable experiments where possible:

- same category, different angle
- same angle, different media type
- same content class, different posting window

Do not run deceptive engagement experiments.

## 8. Review cadence

- 24h initial post snapshot
- 7d stabilized post snapshot where useful
- weekly summary
- monthly lane-weight review

Exact cadence remains configurable based on source capability.
