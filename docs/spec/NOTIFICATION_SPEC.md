# Notification Specification v1

Status: DESIGN ONLY.

ThreadScout should notify the user only when the user can take a useful action or when a time-sensitive state materially changed.

## Priority classes

- P1 blocking: selected candidate lost evidence, final-use media state, or review validity
- P2 action needed: candidate needs owned evidence, review decision, or schedule correction
- P3 opportunity: newly verified high-value candidate or short freshness window
- P4 summary: daily/weekly operating and learning summary

## Anti-noise rules

- batch repeated source failures into one status
- do not notify for every agent transition
- do not send repeated alerts for the same unresolved blocker unless its state changes
- no-successful-candidate days may appear in the normal daily summary rather than as an alarm

## User controls

The product owner can configure which priority classes create an external notification later. In-app state remains the authority even if an external notification is missed.
