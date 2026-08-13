# Data Retention — Four Options v1

Status: DESIGN ONLY.

| Option | Shape | Benefit | Main weakness | Decision |
|---|---|---|---|---|
| A | very short retention for most evidence | smallest storage/privacy footprint | weaker audit and learning history | not selected as default |
| B | tiered retention by data class | balances audit, privacy, and operations | requires lifecycle rules | **provisional selection** |
| C | long archive of nearly all research material | easiest historical replay | unnecessary retention and rights/privacy burden | rejected for MVP |
| D | external archival system plus short operational store | strong enterprise separation | operational complexity | later option |

## Provisional tiered model

- short-lived source excerpts
- medium-lived media metadata without unnecessary media bytes
- longer-lived audit/decision records
- user suppression/settings retained while active
- approved content/publication records retained according to operational need

Exact time periods remain provisional in `P0_P1_DECISION_TABLE.md` and must be reviewed against the selected deployment and source rules before production use.

## Deletion versus audit

Removing expired source content does not require deleting the minimal fact that an earlier artifact existed and was referenced, when retaining that minimal audit metadata is permitted and necessary.
