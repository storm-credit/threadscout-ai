// AT-14 / PR-14 owner suppression.
//
// This is NOT candidate dedupe. `candidate-dedupe.mjs` decides whether two candidates are the
// same product; this file decides whether the owner has said they do not want to see a kind of
// candidate at all. `PRE_IMPLEMENTATION_TRAPS.md` requires the two to stay separable, so nothing
// here imports from the dedupe modules and the two states are reason-coded independently.
//
// Rule set semantics are deliberately **unordered and any-match-wins**: no rule depends on its
// position relative to another, and there is no precedence or exception-by-ordering. That is the
// AWS Security Group shape rather than the NACL shape, and the reasoning is recorded in
// `docs/implementation/USER_SUPPRESSION_REFERENCE_REVIEW.md` (R3). A later slice adding positive
// signals must make precedence an explicit reviewed decision rather than acquiring it here.

export const SUPPRESSION_AXES = Object.freeze(['product', 'brand', 'category', 'source']);

// Which candidate field each axis matches against.
//
// `category` maps to `lane`. The approved requirement PR-14 says "product/category/source", but the
// candidate model carries no `category` field — `lane` is the only category-shaped dimension it has,
// and it is already what portfolio balancing uses. Recorded as a deviation in
// `docs/implementation/USER_SUPPRESSION_ACCEPTANCE.md` rather than silently resolved.
const AXIS_FIELD = Object.freeze({
  product: 'name',
  brand: 'brand',
  category: 'lane',
  source: 'sourceOrigin'
});

export const SUPPRESSION_REASON_CODE = 'owner_suppressed';

export function normalizeSuppressionText(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function isSuppressionAxis(axis) {
  return SUPPRESSION_AXES.includes(axis);
}

export function candidateAxisValue(candidate, axis) {
  const field = AXIS_FIELD[axis];
  if (!field) return '';
  return normalizeSuppressionText(candidate?.[field]);
}

export function ruleIsExpired(rule, at) {
  if (!rule?.expiresAt) return false;
  const expiry = Date.parse(rule.expiresAt);
  if (Number.isNaN(expiry)) return false;
  const now = Date.parse(at ?? new Date().toISOString());
  if (Number.isNaN(now)) return false;
  return now >= expiry;
}

export function ruleMatchesCandidate(rule, candidate) {
  if (!rule || !isSuppressionAxis(rule.axis)) return false;
  const ruleValue = normalizeSuppressionText(rule.value);
  if (!ruleValue) return false;
  return candidateAxisValue(candidate, rule.axis) === ruleValue;
}

// Every active rule that matches. Order of the input array never changes the outcome: the caller
// gets the full set, and "suppressed" means the set is non-empty.
export function matchingRules(candidate, rules = [], { at = null } = {}) {
  return rules.filter((rule) => !ruleIsExpired(rule, at) && ruleMatchesCandidate(rule, candidate));
}

// A stable representative for display when several rules match. Chosen by (createdAt, id) so the
// same match set always renders the same way regardless of array order — position independence has
// to hold for the UI too, not just for the decision.
function representativeRule(rules) {
  return [...rules].sort((a, b) => {
    const byTime = String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? ''));
    return byTime !== 0 ? byTime : String(a.id ?? '').localeCompare(String(b.id ?? ''));
  })[0];
}

export function inactiveSuppression() {
  return {
    active: false,
    exempt: false,
    matchedRuleIds: [],
    axis: null,
    value: null,
    reason: null,
    suppressedAt: null,
    identityChanged: false,
    needsReDecision: false
  };
}

// Q3 (identity drift). If the Verifier later corrects a candidate's identity so the rule that
// suppressed it no longer matches, the candidate does NOT silently return to the inbox. It stays
// suppressed and is flagged for the owner to re-decide, mirroring how the dedupe slice binds a
// resolution to the identity signature it was made against.
export function assessSuppression(candidate, rules = [], { at = null } = {}) {
  const previous = candidate?.suppression ?? inactiveSuppression();

  if (previous.exempt) {
    return { ...inactiveSuppression(), exempt: true };
  }

  const matches = matchingRules(candidate, rules, { at });

  if (matches.length) {
    const rep = representativeRule(matches);
    return {
      active: true,
      exempt: false,
      matchedRuleIds: matches.map((rule) => rule.id),
      axis: rep.axis,
      value: rep.value,
      reason: rep.reason ?? null,
      suppressedAt: previous.active ? previous.suppressedAt ?? at : at,
      identityChanged: false,
      needsReDecision: false
    };
  }

  // Nothing matches any more. There are two different reasons for that and they must not be
  // collapsed into one, which is the bug the first run of `tests/at14-suppression.test.mjs` caught:
  //
  //   a) the rules that suppressed this candidate are still live, but the candidate no longer
  //      matches them — its identity changed underneath the rule. That is Q3: stay suppressed and
  //      ask the owner to re-decide, rather than letting an identity edit silently un-suppress.
  //   b) those rules were removed or have expired — the owner reversed the suppression, which is
  //      exactly what AT-14 says must release the candidate.
  //
  // Collapsing them makes every removal and every expiry look like drift, and the candidate can
  // never come back.
  const previousRuleIds = previous.matchedRuleIds ?? [];
  const rulesStillStanding = rules.some(
    (rule) => previousRuleIds.includes(rule.id) && !ruleIsExpired(rule, at)
  );

  if (previous.active && rulesStillStanding) {
    return {
      ...previous,
      matchedRuleIds: [],
      identityChanged: true,
      needsReDecision: true
    };
  }

  return inactiveSuppression();
}

export function isSuppressed(candidate) {
  return candidate?.suppression?.active === true;
}

export function suppressionBlocker(suppression) {
  const axisLabel = {
    product: '제품',
    brand: '브랜드',
    category: '카테고리',
    source: '출처'
  }[suppression?.axis] ?? '조건';
  const value = suppression?.value ? ` “${suppression.value}”` : '';
  const reason = suppression?.reason ? ` — ${suppression.reason}` : '';
  const drift = suppression?.needsReDecision ? ' (제품 정보가 바뀌어 재확인 필요)' : '';
  return `사용자가 억제한 ${axisLabel}${value}${reason}${drift}`;
}

export function createSuppressionRule({ id, axis, value, reason, createdAt, createdRev = null, expiresAt = null }) {
  return {
    id,
    axis,
    value: normalizeSuppressionText(value),
    displayValue: String(value ?? '').trim(),
    reason: reason ?? null,
    createdAt,
    createdRev,
    expiresAt
  };
}
