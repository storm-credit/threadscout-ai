# Content Output Specification v1.3

Status: DESIGN BASELINE (Option B updated `2026-11-27`).

## 1. Four distinct reader angles & Korean tone control

Every evidence-ready candidate produces four distinct reader-value angles (`Strategist` → `Writer` 1:1):
1. problem / compatibility disqualification hook → practical result
2. mechanism / spec-to-tradeoff contrast (medium observation + crisp verdict rhythm)
3. comparison / pre-purchase identity & option check criteria
4. concrete limitation / non-buyer & best-fit boundary

Four paraphrases of one argument are invalid output (enforced deterministically via pairwise normalized character-bigram Dice similarity `< 0.82` across distinct 1:1 `angleId` mappings). Draft generation supports an owner-selectable Korean tone register (`polite` `존댓말 해요/합쇼체` default vs `plain` `매거진 평서체 ~다` toggle where every non-statutory-disclosure declarative sentence — including normalized `verifiedLimitation` and `AT-10`/`AT-23`/report/caveat notices — ends in `해라체`), using a closed phonetic josa table (bracket/quote unwrapping, Hangul `jong === 0` vowel / `jong === 8` `ㄹ` / other batchim, Sino-Korean ASCII digits `0..9`, closed SI/commerce units `mm/cm/km/ml/kw/hz/gb/mb/tb/in/%/w/v/l/m` vowel vs `kg/mg/g` `ㅁ` batchim, and Korean letter names `L,R` `ㄹ`, `M,N` batchim, else vowel) and injecting `#NNN` / `/showcase` pointers **strictly when `candidate.affiliate === true`** so non-commercial (`affiliate === false`) reach drafts remain 100% solicitation-free (`AFFILIATE_SPEC.md` §5, `BS-60`).

## 2. Single-post structure & `#NNN` showcase CTA

Each `Writer` draft (`<= 500` Unicode code points) in `draft_bundle` carries: `angleId`, `disclosurePrefix` (required at code-point offset `0` iff **this draft** is a commercial solicitation surface per `AFFILIATE_SPEC.md` §5; `null` on pure non-commercial discussion drafts carrying zero commercial URLs and zero monetized `#NNN`/`/showcase` pointers), `hook`, `body`, `caution`, `cta`, `claimRefs`, and `proposedMediaTreatment`.

Per `CLAUDE.md` §5, output is a **single root Threads post** (no automated continuation self-replies). Optional local cross-channel export (markdown summary files/clipboard artifacts only, zero outbound publishing network calls per `MVP_SCOPE.md`) is produced strictly by the deterministic non-LLM `public_showcase_projector`, preserving `CLAUDE.md` §7 (six agents) and §11 (one prompt and one output schema per agent).

## 3. Truthfulness & Korean anti-AI-slop rules

- **Research vs personal use:** Research-based copy uses research framing (`확인해보니 / 찾아보니`); first-hand wording (`써봤다 / 재구매했다`) requires a verified `UsageRecord` (`AT-23`).
- **Deterministic `Guardian` style & spam checks (paired with `stays-quiet` negative tests):**
  1. **Incentivized engagement-bait block:** Block any phrasing that conditions receiving a link, DM, product name, or coordinate (`링크`, `DM`, `디엠`, `좌표`, `정보`, `주소`) on commenting, replying with a keyword, liking, reposting, or following. Non-incentivized usage-context questions (`어떻게 쓰시는지 궁금합니다`, `어떤 환경에서 쓰시나요?`) carrying zero link/DM/reward conditioning are permitted within the `<= 500` code-point cap (`stays-quiet`).
  2. **Pre-count disclaimer stripping & AI-slop stem thresholds (`decision: 'revise'`):** Before evaluating style rules on a draft (`<= 500` Unicode code points), strip only the exact bound statutory `[광고]/[협찬]/[유료광고]` disclosure sentence at offset `0` (bounded up to `[.?!\n]` / `<= 140` chars, never wiping trailing copy on single-line posts) and clause-bounded `AT-10` substitute disclaimers (`같은 제품이 아니라 비슷한 대체품/제품(입니다|이다)`) and `AT-23` non-use disclaimers (stopping before `,` or connective clauses). On the stripped copy, return `Guardian` `decision: 'revise'` across conjugated Korean verb/adjective inflections (`해요체`/`하십시오체`/`해라체`) for:
     - double passives (`(?:되어|보여|여겨|쓰여|만들어|읽혀)(?:지|진|질|집|져|졌)` syllable family),
     - connective-ending commas (`-고, / -며, / -지만, / -면서, / -아서, / -어서, / -해서, / -워서, / -봐서, / -써서, / -돼서, / -이어서,` at `>= 3` occurrences),
     - clause-initial cleft openers (`중요한 건|것은 / 필요한 건|것은 / 핵심은 / 문제는 / 관건은 ~이다|예요|이에요|입니다|점이다|점입니다|점이에요|데 있다|것이다`),
     - standalone empty challenge headers (`그러나 한계도 분명하다|분명해요|분명합니다.` / `아쉬운 점도 있다|있어요|있습니다.`),
     - serial negative antithesis (`A가/이 아니라 B` appearing `>= 2` times on the disclaimer-stripped draft),
     - scope-escalation cliché (`단순한 X를 넘어 Y`, `A-21`, `stays-quiet` on literal physical height/boundary `높이를 넘어`),
     - stacked translationese particles (`-에서의 / -에로의 / -으로의 / -에의 / -으로부터의 / -로부터의 / -에 있어서`, `A-19`, `>= 2` occurrences or `-에 있어서/-으로의/-에로의`; plain `~의`, `~에 대해`, and capability hedging `~할 수 있다` explicitly preserved `stays-quiet`),
     - closed 6-noun abstract-buzzword `제공-|선사-` translationese (`(편의성|효율성|사용자 경험|만족감|솔루션|라이프스타일)을/를 (제공|선사)(하|한|할|합|해|했)`, `A-15`; `stays-quiet` on statutory `"수수료를 제공받습니다"` and concrete warranties/items `"보증을 제공합니다"`, `"파우치를 제공합니다"`), and
     - hype buzzwords & post-hoc closing clichés (`혁신적인 / 획기적인 / 전례 없는 / 삶의 질 수직`, sentence-final adnominal `[가-힣](는|은|ㄴ|던|할|을|인) 이유(다|입니다|예요)` excluding demonstratives/`~라는 이유로`, and `~한 셈(이다|입니다|이에요)`, `D-4`/`D-10`).
- **Prompt-guided prose preferences (`declared, not enforced`):** Prefer middle-sentence cadence variation (`E-2`: avoid `>= 4` identical consecutive sentence endings) and downward plain-verb physical grounding over abstract nouns.
