// Deterministic Analytics, Net Contribution (ROI), and Guardrailed Weekly Learning Service
// (`ANALYTICS_SPEC.md` §§1–8, `DAILY_OPERATING_MODEL.md` §§6 & 10, `AT-12`, `BS-46`).
// Non-agent deterministic service: deduplicates multi-window (`24h`/`7d`/`manual`) snapshots per
// publication (`publicationKey`) so 1 post can never spoof 5 repeated samples or double-count ROI,
// and strictly quarantines trust/rights/identity/policy violations from pattern promotion.

import { randomUUID } from 'node:crypto';
import { estimateNetYieldKrw } from './affiliate-yield-service.mjs';
import {
  evaluateIssueProductDecision,
  resolveMediaPublicationFallback
} from './issue-media-governance.mjs';

export const ATTRIBUTION_TIERS = Object.freeze({
  UNKNOWN: 'unknown',
  OBSERVATION: 'observation',
  CORRELATION_HYPOTHESIS: 'correlation_hypothesis',
  SUFFICIENT_REPEATED_SIGNAL: 'sufficient_repeated_signal'
});

export const CONTENT_INTENTS = Object.freeze({
  VALUE_ONLY: 'value_only',
  PRODUCT_EDITORIAL: 'product_editorial',
  AFFILIATE_CANDIDATE: 'affiliate_candidate'
});

export const CANONICAL_ANGLE_IDS = Object.freeze([
  'problem-result',
  'mechanism-demo',
  'buying-checklist',
  'honest-fit'
]);

export const MINIMUM_SAMPLE_NOTE_KO =
  '최소 5건의 서로 다른 무위반 게시물(publicationKey 기준)이 누적되기 전까지 인과관계로 단정하거나 추천 패턴으로 승격하지 않습니다(ANALYTICS_SPEC.md §§4–6, AT-12).';

const WINDOW_PRIORITY = { '7d': 3, '24h': 2, manual: 1 };

function toNonNegativeInt(value, max = 100_000_000) {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.min(max, Math.floor(num));
}

function toBoundedRatio(value, fallback = 0) {
  const num = Number(value ?? fallback);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(0, Math.min(1, num));
}

export function classifyContentIntent(candidate = {}) {
  if (candidate?.affiliate === true) return CONTENT_INTENTS.AFFILIATE_CANDIDATE;
  if (candidate?.brand || candidate?.model || candidate?.sourceRef) return CONTENT_INTENTS.PRODUCT_EDITORIAL;
  return CONTENT_INTENTS.VALUE_ONLY;
}

export function attributionTierForCleanCount(cleanSampleCount = 0) {
  const n = Math.max(0, Math.floor(Number(cleanSampleCount) || 0));
  if (n === 0) return ATTRIBUTION_TIERS.UNKNOWN;
  if (n <= 2) return ATTRIBUTION_TIERS.OBSERVATION;
  if (n <= 4) return ATTRIBUTION_TIERS.CORRELATION_HYPOTHESIS;
  return ATTRIBUTION_TIERS.SUFFICIENT_REPEATED_SIGNAL;
}

export function publicationKeyFor(snapshot = {}) {
  if (snapshot?.scheduleId) return `sched:${snapshot.scheduleId}`;
  return `cand:${snapshot?.candidateId ?? 'unknown'}`;
}

/**
 * Evaluate `ANALYTICS_SPEC.md` §6 / `MASTER_SPEC.md` / `AT-12` / `BS-46` hard safety guardrails.
 * Checks both snapshot trust/safety flags AND candidate rights/identity/Guardian/suppression states.
 */
export function isSafetyQuarantined(snapshot = {}, candidate = null) {
  const ts = snapshot?.trustSafety ?? {};
  const reasons = [];

  if (ts.rumorHook === true) reasons.push('rumor_or_private_life_hook');
  if (ts.endorsementImplication === true) reasons.push('unsupported_celebrity_endorsement');
  if (ts.hiddenDisclosure === true) reasons.push('hidden_or_missing_disclosure');
  if (ts.productMismatch === true) reasons.push('misleading_product_identity');
  if (ts.policyViolation === true) reasons.push('policy_or_trust_violation');
  if (toNonNegativeInt(ts.postCorrections) > 0) reasons.push('post_publication_factual_correction');

  if (candidate) {
    if (candidate.guardian?.decision === 'block' || candidate.workflowState === 'blocked') {
      reasons.push('guardian_or_workflow_blocked');
    }
    if (['likely', 'unresolved'].includes(candidate.exactMatchStatus)) {
      reasons.push('unresolved_or_unconfirmed_product_identity');
    }
    if (candidate.suppression?.active === true) {
      reasons.push('owner_suppressed_candidate');
    }
    const issueDecision = evaluateIssueProductDecision({
      issueSourceGrade: candidate.issueSourceGrade ?? 'none',
      productRelationGrade: candidate.productRelationGrade ?? 'none',
      matchState: candidate.exactMatchStatus ?? 'unresolved',
      personIdentifiedFromImageOnly: Boolean(candidate.personIdentifiedFromImageOnly)
    });
    if (issueDecision.issueLinked && ['block', 'verify_more'].includes(issueDecision.routeOutcome)) {
      reasons.push(
        issueDecision.routeOutcome === 'block'
          ? 'rumor_or_blocked_public_figure_relation'
          : 'unverified_issue_or_relation_grade'
      );
    }
    const mediaResolution = resolveMediaPublicationFallback({
      discoveryMediaState: candidate.discoveryMediaState ?? 'none',
      publicationMediaRights: candidate.mediaRights ?? 'unknown',
      publishableMediaUrl: candidate.publishableMediaUrl ?? '',
      aiGeneratedDepictsRealPerson: Boolean(candidate.aiGeneratedDepictsRealPerson),
      syntheticDeceptiveBeforeAfter: Boolean(candidate.syntheticDeceptiveBeforeAfter)
    });
    if (mediaResolution.selectedTreatment === 'blocked') {
      reasons.push('synthetic_celebrity_or_deceptive_media');
    } else if (!mediaResolution.publishable) {
      reasons.push('unverified_media_rights');
    } else if (String(candidate.publishableMediaUrl ?? '').trim() && !mediaResolution.reuploadAllowed) {
      reasons.push('unpermitted_media_reupload');
    }
  }

  return Object.freeze({
    quarantined: reasons.length > 0,
    reasons: Object.freeze([...new Set(reasons)])
  });
}

/**
 * Create a validated, immutable `OutcomeSnapshot` bound to a candidate's deterministic ROI calculation.
 */
export function createOutcomeSnapshot({
  candidate,
  scheduleId = null,
  window = 'manual',
  payload = {},
  recordedAt = new Date().toISOString()
} = {}) {
  if (!candidate || !candidate.id) {
    return { ok: false, code: 'CANDIDATE_REQUIRED', message: 'Outcome snapshot requires a target candidate.' };
  }
  const normalizedWindow = ['24h', '7d', 'manual'].includes(window) ? window : 'manual';
  const approvedOrSelectedId = candidate.review?.approvedDraftId || candidate.selectedDraftId;
  const selectedDraft = (candidate.drafts ?? []).find((d) => d.id === approvedOrSelectedId) ?? candidate.drafts?.[0] ?? null;
  const angleId = String(payload.angleId || selectedDraft?.angleId || 'problem-result').trim();
  const contentIntent = classifyContentIntent(candidate);
  const isAffiliate = contentIntent === CONTENT_INTENTS.AFFILIATE_CANDIDATE;

  const attention = Object.freeze({
    views: toNonNegativeInt(payload.views),
    profileVisits: toNonNegativeInt(payload.profileVisits),
    likes: toNonNegativeInt(payload.likes),
    replies: toNonNegativeInt(payload.replies),
    reposts: toNonNegativeInt(payload.reposts)
  });

  const intent = Object.freeze({
    saves: toNonNegativeInt(payload.saves),
    purchaseQuestionReplies: toNonNegativeInt(payload.purchaseQuestionReplies),
    outboundClicks: toNonNegativeInt(payload.outboundClicks)
  });

  const defaultCommission = candidate.affiliateNetwork === 'naver_shopping_connect' ? 0.08 : 0.03;
  const conversions = isAffiliate ? toNonNegativeInt(payload.conversions, 1_000_000) : 0;
  const unitPriceKrw = isAffiliate ? toNonNegativeInt(payload.unitPriceKrw, 50_000_000) : 0;
  const commissionRate = isAffiliate ? toBoundedRatio(payload.commissionRate, defaultCommission) : 0;
  const returnRate = isAffiliate ? toBoundedRatio(payload.returnRate, 0.08) : 0;
  const runTokenCostKrw = Math.max(0, Number(candidate.epochBudget?.costKrw ?? 0));

  const commerce = Object.freeze({
    conversions,
    unitPriceKrw,
    commissionRate,
    returnRate
  });

  const netYield = estimateNetYieldKrw({
    priceKrw: unitPriceKrw,
    commissionRate,
    expectedConversions: conversions,
    returnRate,
    runTokenCostKrw
  });

  const trustSafety = Object.freeze({
    negativeFeedback: toNonNegativeInt(payload.negativeFeedback, 1_000_000),
    postCorrections: toNonNegativeInt(payload.postCorrections, 10_000),
    productMismatch: Boolean(payload.productMismatch),
    policyViolation: Boolean(payload.policyViolation),
    rumorHook: Boolean(payload.rumorHook),
    endorsementImplication: Boolean(payload.endorsementImplication),
    hiddenDisclosure: Boolean(payload.hiddenDisclosure)
  });

  const issueDecision = evaluateIssueProductDecision({
    issueSourceGrade: candidate.issueSourceGrade ?? 'none',
    productRelationGrade: candidate.productRelationGrade ?? 'none',
    matchState: candidate.exactMatchStatus ?? 'unresolved',
    personIdentifiedFromImageOnly: Boolean(candidate.personIdentifiedFromImageOnly)
  });
  const effectiveAffiliateState =
    candidate.affiliateMapping?.state
    || candidate.affiliateMappingState
    || ((candidate.exactMatchStatus === 'substitute' || issueDecision.allowedWordingCeiling === 'alternative_only')
      ? 'alternative'
      : 'exact');

  const matchBadge = !isAffiliate
    ? 'none'
    : effectiveAffiliateState === 'alternative'
      ? 'alternative'
      : 'exact';

  const mediaType = ['owned', 'user_owned', 'licensed', 'explicitly_licensed'].includes(candidate.mediaRights)
    && candidate.publishableMediaUrl
    ? 'image'
    : 'text_only';

  const snapshot = {
    snapshotId: `snap-${randomUUID()}`,
    candidateId: candidate.id,
    lifecycleEpoch: candidate.lifecycleEpoch ?? 1,
    candidateName: candidate.name,
    cardCode: candidate.cardCode ?? null,
    scheduleId: scheduleId ? String(scheduleId) : null,
    window: normalizedWindow,
    recordedAt,
    lane: candidate.lane || 'practical-novel',
    angleId,
    contentIntent,
    matchBadge,
    mediaType,
    directUse: candidate.personalUse === 'confirmed',
    attention,
    intent,
    commerce,
    netYield,
    trustSafety
  };

  const quarantine = isSafetyQuarantined(snapshot, candidate);
  return {
    ok: true,
    snapshot: Object.freeze({
      ...snapshot,
      publicationKey: publicationKeyFor(snapshot),
      quarantined: quarantine.quarantined,
      quarantineReasons: quarantine.reasons
    })
  };
}

function compareSnapshotRecency(a, b) {
  const timeDiff = (Date.parse(b?.recordedAt ?? '') || 0) - (Date.parse(a?.recordedAt ?? '') || 0);
  if (timeDiff !== 0) return timeDiff;
  return (WINDOW_PRIORITY[b?.window] ?? 0) - (WINDOW_PRIORITY[a?.window] ?? 0);
}

/**
 * Produce `ANALYTICS_SPEC.md` §5 `learning_summary` + portfolio/ROI breakdown.
 * Deduplicates multi-window snapshots per `publicationKey` (`sched:<id>` or `cand:<id>`) and unions
 * quarantine flags across all windows so 1 post never inflates `cleanSampleCount` or double-counts ROI.
 */
export function buildLearningSummary(snapshots = [], candidates = []) {
  const candidateById = new Map((candidates ?? []).map((c) => [c.id, c]));

  const evaluatedRaw = (snapshots ?? []).map((snap) => {
    const candidate = candidateById.get(snap.candidateId) ?? null;
    const check = isSafetyQuarantined(snap, candidate);
    return {
      ...snap,
      publicationKey: publicationKeyFor(snap),
      quarantined: check.quarantined,
      quarantineReasons: check.reasons
    };
  });

  // Group by distinct publication (`publicationKey`)
  const byPublication = new Map();
  for (const snap of evaluatedRaw) {
    if (!byPublication.has(snap.publicationKey)) {
      byPublication.set(snap.publicationKey, []);
    }
    byPublication.get(snap.publicationKey).push(snap);
  }

  const publications = [];
  for (const [pubKey, list] of byPublication.entries()) {
    const sorted = [...list].sort(compareSnapshotRecency);
    const latest = sorted[0];
    const unionReasons = [...new Set(sorted.flatMap((s) => s.quarantineReasons ?? []))];
    publications.push({
      ...latest,
      publicationKey: pubKey,
      windowCount: sorted.length,
      quarantined: unionReasons.length > 0,
      quarantineReasons: Object.freeze(unionReasons)
    });
  }

  const cleanPublications = publications.filter((p) => !p.quarantined);
  const quarantinedPublications = publications.filter((p) => p.quarantined);

  // Deduplicate one-time candidate epoch LLM cost across publications sharing `(candidateId, lifecycleEpoch)`
  const epochCostByKey = new Map();
  for (const pub of publications) {
    const epKey = `${pub.candidateId}::${pub.lifecycleEpoch ?? 1}`;
    const cost = Math.round(Number(pub.netYield?.runTokenCostKrw ?? 0));
    epochCostByKey.set(epKey, Math.max(epochCostByKey.get(epKey) ?? 0, cost));
  }
  const uniqueRunTokenCostKrw = [...epochCostByKey.values()].reduce((a, b) => a + b, 0);
  const totalGrossCommissionKrw = publications.reduce((acc, s) => acc + Math.round(Number(s.netYield?.grossCommissionKrw ?? 0)), 0);
  const totalNetSettledCommissionKrw = publications.reduce((acc, s) => acc + Math.round(Number(s.netYield?.netSettledCommissionKrw ?? 0)), 0);

  const totals = {
    rawSnapshotCount: evaluatedRaw.length,
    snapshotCount: publications.length,
    cleanSnapshotCount: cleanPublications.length,
    quarantinedSnapshotCount: quarantinedPublications.length,
    views: publications.reduce((acc, s) => acc + toNonNegativeInt(s.attention?.views), 0),
    likes: publications.reduce((acc, s) => acc + toNonNegativeInt(s.attention?.likes), 0),
    replies: publications.reduce((acc, s) => acc + toNonNegativeInt(s.attention?.replies), 0),
    saves: publications.reduce((acc, s) => acc + toNonNegativeInt(s.intent?.saves), 0),
    purchaseQuestionReplies: publications.reduce((acc, s) => acc + toNonNegativeInt(s.intent?.purchaseQuestionReplies), 0),
    outboundClicks: publications.reduce((acc, s) => acc + toNonNegativeInt(s.intent?.outboundClicks), 0),
    conversions: publications.reduce((acc, s) => acc + toNonNegativeInt(s.commerce?.conversions), 0),
    grossCommissionKrw: totalGrossCommissionKrw,
    netSettledCommissionKrw: totalNetSettledCommissionKrw,
    runTokenCostKrw: uniqueRunTokenCostKrw,
    netContributionKrw: totalNetSettledCommissionKrw - uniqueRunTokenCostKrw
  };

  const monetizedCount = publications.filter((s) => s.contentIntent === CONTENT_INTENTS.AFFILIATE_CANDIDATE).length;
  const affiliateShare = publications.length > 0 ? Number((monetizedCount / publications.length).toFixed(4)) : 0;
  const excessiveAffiliateFrequency = publications.length >= 4 && affiliateShare > 0.7;

  const groups = new Map();
  for (const pub of cleanPublications) {
    const key = `${pub.lane}::${pub.angleId}`;
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        lane: pub.lane,
        angleId: pub.angleId,
        samples: []
      });
    }
    groups.get(key).samples.push(pub);
  }

  const strongRepeatedPatterns = [];
  const weakHypotheses = [];
  const failedPatterns = [];

  for (const pub of quarantinedPublications) {
    failedPatterns.push(Object.freeze({
      patternKey: `quarantined:${pub.publicationKey}`,
      candidateId: pub.candidateId,
      candidateName: pub.candidateName ?? pub.candidateId,
      lane: pub.lane,
      angleId: pub.angleId,
      sampleCount: 1,
      views: toNonNegativeInt(pub.attention?.views),
      promotionBlocked: true,
      reasons: pub.quarantineReasons,
      summaryKo: `조회수(${toNonNegativeInt(pub.attention?.views).toLocaleString('ko-KR')})와 무관하게 신뢰·권리·정책 위반(${pub.quarantineReasons.join(', ')})으로 패턴 승격이 영구 차단됨(AT-12).`
    }));
  }

  for (const group of groups.values()) {
    const cleanSampleCount = group.samples.length;
    const confidence = attributionTierForCleanCount(cleanSampleCount);
    const intentSignals = group.samples.reduce(
      (sum, s) => sum + toNonNegativeInt(s.intent?.saves) + toNonNegativeInt(s.intent?.purchaseQuestionReplies) + toNonNegativeInt(s.intent?.outboundClicks),
      0
    );
    const totalViews = group.samples.reduce((sum, s) => sum + toNonNegativeInt(s.attention?.views), 0);

    const groupEpochCosts = new Map();
    for (const s of group.samples) {
      const epKey = `${s.candidateId}::${s.lifecycleEpoch ?? 1}`;
      groupEpochCosts.set(epKey, Math.max(groupEpochCosts.get(epKey) ?? 0, Math.round(Number(s.netYield?.runTokenCostKrw ?? 0))));
    }
    const groupSettled = group.samples.reduce((sum, s) => sum + Math.round(Number(s.netYield?.netSettledCommissionKrw ?? 0)), 0);
    const groupTokenCost = [...groupEpochCosts.values()].reduce((a, b) => a + b, 0);
    const netContributionKrw = groupSettled - groupTokenCost;

    const groupAffiliateCount = group.samples.filter((s) => s.contentIntent === CONTENT_INTENTS.AFFILIATE_CANDIDATE).length;
    const groupAffiliateShare = cleanSampleCount > 0 ? groupAffiliateCount / cleanSampleCount : 0;

    if (cleanSampleCount >= 3 && intentSignals === 0) {
      failedPatterns.push(Object.freeze({
        patternKey: group.key,
        lane: group.lane,
        angleId: group.angleId,
        sampleCount: cleanSampleCount,
        views: totalViews,
        promotionBlocked: true,
        reasons: Object.freeze(['zero_purchase_intent_repeated']),
        summaryKo: `${group.lane} · ${group.angleId} 조합은 ${cleanSampleCount}건 게시 동안 저장·질문·클릭 의도 신호가 0건이어서 비효율 패턴으로 분류됨.`
      }));
      continue;
    }

    const heldByAffiliateCap = (cleanSampleCount >= 4 && groupAffiliateShare > 0.7)
      || (excessiveAffiliateFrequency && groupAffiliateCount > 0);

    if (cleanSampleCount >= 5 && intentSignals > 0 && !heldByAffiliateCap) {
      strongRepeatedPatterns.push(Object.freeze({
        patternKey: group.key,
        lane: group.lane,
        angleId: group.angleId,
        cleanSampleCount,
        confidence,
        intentSignals,
        totalViews,
        netContributionKrw,
        summaryKo: `${group.lane} · ${group.angleId}: 서로 다른 무위반 게시물 ${cleanSampleCount}건 반복 검증됨 (구매의도 신호 ${intentSignals}건, 순기여 ₩${netContributionKrw.toLocaleString('ko-KR')}).`
      }));
    } else {
      weakHypotheses.push(Object.freeze({
        patternKey: group.key,
        lane: group.lane,
        angleId: group.angleId,
        cleanSampleCount,
        confidence,
        intentSignals,
        totalViews,
        netContributionKrw,
        heldByAffiliateCap,
        summaryKo: heldByAffiliateCap
          ? `${group.lane} · ${group.angleId}: 제휴 게시 비중(포트폴리오 ${Math.round(affiliateShare * 100)}% / 패턴 내 ${Math.round(groupAffiliateShare * 100)}%)이 상한(70%)을 초과해 정보성 포스트 보강 전까지 승격 보류됨.`
          : `${group.lane} · ${group.angleId}: 현재 서로 다른 무위반 게시물 ${cleanSampleCount}건(${confidence}) — 최소 5건 도달 전까지 가설로만 유지.`
      }));
    }
  }

  const recommendedExperiments = [];
  if (excessiveAffiliateFrequency) {
    recommendedExperiments.push(Object.freeze({
      experimentId: 'exp-rebalance-editorial-ratio',
      variableChanged: 'content_intent',
      controlVariable: 'practical-novel lane',
      hypothesisKo: `최근 독립 게시물 기준 제휴 포스트 비중이 ${Math.round(affiliateShare * 100)}%(>70%)입니다. 동일 카테고리에서 무제휴 정보성(product_editorial) 비교 글을 배치해 계정 신뢰도와 저장률을 비교하세요.`
    }));
  }

  const usedAngles = new Set(cleanPublications.map((s) => s.angleId));
  const untestedAngle = CANONICAL_ANGLE_IDS.find((angle) => !usedAngles.has(angle));
  if (untestedAngle) {
    recommendedExperiments.push(Object.freeze({
      experimentId: `exp-single-var-angle-${untestedAngle}`,
      variableChanged: 'strategy_angle',
      controlVariable: 'same_product_lane',
      hypothesisKo: `단일 변수 실험: 동일 카테고리에서 아직 무위반 게시 표본이 없는 '${untestedAngle}' 관점 초안을 선택해 저장·구매 질문 반응을 비교하세요.`
    }));
  }

  const hasImageSample = cleanPublications.some((s) => s.mediaType === 'image');
  if (cleanPublications.length > 0 && !hasImageSample) {
    recommendedExperiments.push(Object.freeze({
      experimentId: 'exp-single-var-owned-media',
      variableChanged: 'media_type',
      controlVariable: 'same_strategy_angle',
      hypothesisKo: '단일 변수 실험: 동일 전략 관점에서 직접 촬영(owned) 또는 상업 라이선스 이미지를 1장 첨부해 텍스트 단독 게시물과 프로필 쇼케이스 유입률을 비교하세요.'
    }));
  }

  const guardianBlockedCandidates = (candidates ?? []).filter((c) => c.guardian?.decision === 'block').length;
  const ownerRejectedCandidates = (candidates ?? []).filter((c) => c.workflowState === 'rejected').length;

  return Object.freeze({
    confidence: attributionTierForCleanCount(cleanPublications.length),
    minimumSampleNote: MINIMUM_SAMPLE_NOTE_KO,
    portfolio: Object.freeze({
      totalSnapshots: publications.length,
      rawSnapshotRecords: evaluatedRaw.length,
      monetizedSnapshots: monetizedCount,
      affiliateShare,
      excessiveAffiliateFrequency,
      guardianBlockedCandidates,
      ownerRejectedCandidates
    }),
    totals: Object.freeze(totals),
    strongRepeatedPatterns: Object.freeze(strongRepeatedPatterns),
    weakHypotheses: Object.freeze(weakHypotheses),
    failedPatterns: Object.freeze(failedPatterns),
    recommendedExperiments: Object.freeze(recommendedExperiments),
    recentSnapshots: Object.freeze(publications.slice(0, 25))
  });
}
