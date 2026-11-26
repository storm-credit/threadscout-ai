# Content Output Specification v1.2

Status: DESIGN BASELINE (Option B updated `2026-11-27`).

## 1. Four distinct reader angles

Every evidence-ready candidate produces four distinct reader-value angles (`Strategist` → `Writer` 1:1):
1. problem → practical result
2. mechanism / 3–10s visual demonstration
3. comparison / buying-decision criteria
4. concrete limitation / best-fit audience

Four paraphrases of one argument are invalid output.

## 2. Single-post structure & `#NNN` showcase CTA

Each `Writer` draft (`<= 500` Unicode code points) in `draft_bundle` carries: `angleId`, `disclosurePrefix` (required at code-point offset `0` iff **this draft** is a commercial solicitation surface per `AFFILIATE_SPEC.md` §5; `null` on pure non-commercial discussion drafts carrying zero commercial URLs and zero monetized `#NNN`/`/showcase` pointers), `hook`, `body`, `caution`, `cta`, `claimRefs`, and `proposedMediaTreatment`.

Per `CLAUDE.md` §5, output is a **single root Threads post** (no automated continuation self-replies). Optional local cross-channel export (markdown summary files/clipboard artifacts only, zero outbound publishing network calls per `MVP_SCOPE.md`) is produced strictly by the deterministic non-LLM `public_showcase_projector`, preserving `CLAUDE.md` §7 (six agents) and §11 (one prompt and one output schema per agent).

## 3. Truthfulness & Korean anti-AI-slop rules

- **Research vs personal use:** Research-based copy uses research framing (`확인해보니 / 찾아보니`); first-hand wording (`써봤다 / 재구매했다`) requires a verified `UsageRecord` (`AT-23`).
- **Deterministic `Guardian` style & spam checks (enforced in code when Slice 1 lands, paired with `stays-quiet` negative tests):**
  1. **Incentivized engagement-bait block:** Block any phrasing that conditions receiving a link, DM, product name, or coordinate (`링크`, `DM`, `디엠`, `좌표`, `정보`, `주소`) on commenting, replying with a keyword, liking, reposting, or following. Non-incentivized open reader-opinion questions (`어떻게 쓰시는지 궁금합니다` under `cta = non-commercial discussion`) are permitted (`stays-quiet`).
  2. **Pre-count disclaimer stripping & AI-slop stem thresholds (`decision: 'revise'`):** Before evaluating negation or antithesis rules on a draft (`<= 500` Unicode code points), strip all approved morphological variants of mandatory `AT-10` substitute disclaimers (`/같은\s*제품이\s*아니라\s*비슷한\s*(대체품|제품)/g`) and `AT-23` non-use disclaimers (`/직접\s*써본\s*기록이\s*없(어|다면|으므로|습니다)/g`). On the stripped copy, return `Guardian` `decision: 'revise'` across conjugated Korean verb/adjective stems (`해요체`/`하십시오체`/`해라체`) for:
     - double passives (`되어지-/보여지-/여겨지-` stem family),
     - connective-ending commas (`-고, / -며, / -지만, / -면서,` at `>= 3` occurrences),
     - cleft openers (`중요한 건|것은 / 필요한 건|것은 / 핵심은 ~이다|예요|입니다`),
     - standalone empty challenge headers (`그러나 한계도 분명하다|분명해요|분명합니다.` / `아쉬운 점도 있다|있어요|있습니다.`), and
     - serial negative antithesis (`A가/이 아니라 B` appearing `>= 2` times on the disclaimer-stripped draft).
- **Prompt-guided prose preferences (`declared, not enforced`):** Prefer concrete user-subject action verbs over inanimate abstract subjects (`이 제품은 편의성을 제공합니다` → `설거지할 때 옷이 덜 젖는다`) and avoid inverted closing clichés (`~하는 이유다`).
