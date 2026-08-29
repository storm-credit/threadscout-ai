# AT-14 User Suppression — Reference Review (`CLAUDE.md` §16)

Status: **COMPLETE.** This discharges the §16 gate recorded as blocking in `USER_SUPPRESSION_PLAN.md` §12.

Scope: the open decision in `USER_SUPPRESSION_PLAN.md` §6 — how a user suppression rule matches future
candidates — plus the restore semantics question (Q2).

No code, filter list, or content is copied from any reference. Patterns only, per §16.

---

## R1 — Sieve, the email filtering language (RFC 5228, IETF Standards Track)

<https://www.rfc-editor.org/rfc/rfc5228.html>

**Pattern worth adopting.** Sieve is deliberately **not** Turing-complete: no loops, no variables, no ability
to shell out. The stated reason is that it must be safe to run on a server on behalf of a user who cannot be
trusted with arbitrary programs, and that the restriction "facilitat[es] the use of graphical user interfaces
(GUIs) for filter creation and manipulation."

**What not to adopt.** Sieve's `require` extension mechanism and its script-file model. ThreadScout has one
owner and a handful of rules; a script language and an extension registry would be pure overhead.

**Fit.** Directly supports **Option B over Option C**. The reason Sieve gives for staying declarative — that
a restricted rule form is what makes a GUI over it tractable — is the same reason ThreadScout needs it: the
suppression rule must be explainable in one line on a mobile card, and `복원` must act on something the owner
can point at. A predicate engine with precedence is the thing Sieve deliberately refused to become.

**Licence / reuse.** Nothing reused. IETF RFC text, referenced for its design rationale only.

**Changes the plan?** No — it corroborates the §6 recommendation and strengthens the stated reason for
rejecting C.

---

## R2 — uBlock Origin static filter syntax

<https://github.com/gorhill/uBlock/wiki/Static-filter-syntax>

**Patterns worth adopting.** Two:

1. **Options name an axis explicitly.** A filter carries `domain=`/`from=`, `script`, `third-party` and so
   on — the rule states *which dimension it matches on* rather than pattern-matching an undifferentiated
   blob. This is exactly Option B's `{ axis, value }` shape.
2. **Exception rules rather than rule deletion.** `@@` marks an exception that spares a specific target while
   the blocking rule stays in force for everything else.

**What not to adopt.** The `$important` override, which exists to defeat exception filters. Precedence
escalation of that kind is what makes an ordered rule set hard to reason about, and ThreadScout has no
adversarial filter-list authorship to defend against.

Also notable as a *deliberate refusal*: uBO does not support the `document` exception for whole-page
allowlisting, so that a rule cannot quietly switch the system off — the user must disable it explicitly.
That maps onto `DAILY_OPERATING_MODEL.md:154`, "deterministic preference/suppression records, **not hidden
autonomous profile changes**."

**Fit.** Confirms Option B's axis-tagged record shape, and independently supports the reversible default
chosen for **Q2**: `복원` on one candidate should behave like an exception (spare this candidate, keep the
rule) rather than deleting the rule for everything it matched.

**Licence / reuse.** GPLv3 project. **No code, no filter syntax, and no filter list is copied**; only the
shape of the idea is referenced, which carries no licence obligation.

**Changes the plan?** No, but it upgrades Q2's default from "defensible guess" to "corroborated by a widely
deployed system", and it is now recorded as the reason rather than left as a coin-flip.

---

## R3 — AWS Security Groups vs Network ACLs

<https://docs.aws.amazon.com/network-firewall/latest/developerguide/suricata-rule-evaluation-order.html>,
<https://repost.aws/questions/QUlF4BFqvVRRuxiLmgUw44Eg/does-aws-security-group-rule-order-matter>

**Pattern worth adopting.** The contrast between the two is the cleanest available evidence for the B-vs-C
choice, because AWS ships both models side by side:

- **Security Groups** — a flat, unordered set. Every rule is evaluated; a match on any one admits the
  traffic. Rule order does not matter.
- **NACLs** — numbered rules evaluated lowest-first, first match wins, evaluation stops. Documented
  consequence: *"rule ordering matters enormously"*, and stateless evaluation makes configuration "more
  complex".

**What not to adopt.** NACL-style numbered precedence — which is Option C's model.

**Fit.** AWS keeps the ordered model only where a stateless packet filter genuinely needs deny rules.
ThreadScout's suppression is a pure deny-set with no adversary and no packets: the Security Group shape (flat,
unordered, any-match-wins) is sufficient and is what Option B is. Adopting NACL semantics would import the
documented complexity cost to buy an expressiveness the slice lists as a non-goal.

**Licence / reuse.** Documentation referenced only. Nothing reused.

**Changes the plan?** No. It converts the §6 argument against C from an assertion into a comparison with a
documented cost.

---

## R4 — Explicit negative feedback in recommender systems

<https://arxiv.org/html/2502.09869v1> (user study on how people use "Not interested" controls),
<https://pmc.ncbi.nlm.nih.gov/articles/PMC9038518/> (theoretical framework for negative preferences)

**Pattern worth adopting.** The user-study finding that "Not interested" is valued precisely because it is
*direct* — a proactive intervention in the algorithm with one extra step — rather than an inferred signal.
That is the same expectation AT-14 encodes with "honor the suppression **until the user reverses it**".

**What not to adopt — and this is the load-bearing finding.** The score-penalty implementation, in which the
negative signal is subtracted from an adjusted score, so that "the negative feedback reasons may outweigh the
reasons for recommending an item, **and vice versa**."

That "vice versa" is the defect. A penalty is a weight that a sufficiently high opportunity score can
overcome. **This is Option D**, and the reference states its failure mode in the reference's own terms.

**Fit.** Confirms that Option D must be rejected, and on the stronger of two grounds: not merely that AT-14's
wording says "honor until reversed", but that the approach is documented as *outweighable by design*.

**Licence / reuse.** Academic literature, referenced for findings. Nothing reused.

**Changes the plan?** No. It moves D from "fails the acceptance test as written" to "fails the acceptance
test, and the literature describes exactly how it fails".

---

## Net effect on the implementation plan

**No option changes.** Option B remains the recommendation, now with three independent corroborations
(R1 for the declarative form, R2 for the axis-tagged record, R3 for the flat unordered set) and one for the
rejection of D (R4).

Two things did change:

1. **Q2's reversible default is now evidence-backed** rather than a defensible guess — `복원` spares the
   candidate and leaves the rule standing, matching R2's exception model. It is still reversible and still
   the owner's to overrule.
2. **A design constraint is added and carried into implementation:** the suppression rule set stays
   **unordered and any-match-wins**. No rule may depend on its position relative to another. This is
   recorded here so a later slice adding positive signals (`이런 제품 더 찾기`) has to make precedence an
   explicit, reviewed decision rather than acquiring it by accident.

## What this review does not cover

It does not evaluate category-vocabulary design (Q4) against any reference; the free-text-normalized default
stands on the requirement text alone. If Q4 is later answered "controlled list", that choice warrants its own
reference pass.
