// Synthetic scenarios for the manual candidate approval slice.
//
// Every product, brand, seller, price, and source here is invented. CLAUDE.md
// section 6 forbids inventing a *real* product, price, or seller, and forbids
// surfacing fixture values as current market truth — so these are openly fictional
// and every record carries `synthetic: true`.
//
// The families follow IMPLEMENTATION_TEST_STRATEGY.md: a normal exact product, a
// high-score unresolved candidate, a substitute, unresolved media rights, and a
// blocked rumour trigger.

const OBSERVED_AT = '2026-08-14T00:00:00.000Z';

function source(id, originId, label, type = 'owner_supplied') {
  return { id, originId, type, label, observedAt: OBSERVED_AT, synthetic: true };
}

/** Family 1 — owner supplied a concrete product with enough evidence for `exact`. */
export const EXACT_PRODUCT_SCENARIO = Object.freeze({
  key: 'exact_product',
  candidate: {
    name: '접이식 싱크대 물튐 가드 (가상 제품)',
    contentLane: 'practical_novel',
    whyNow: '설거지 물튐을 줄이는 접이식 구조를 짧게 보여 줄 수 있다.',
    readerValue: '설거지할 때 상판과 옷이 젖는 문제를 줄이려는 가정',
    opportunityScore: 82,
    scoreBreakdown: {
      readerValue: 18,
      demonstrability: 14,
      purchaseIntent: 15,
      attentionAcceleration: 10,
      audienceFit: 9,
      novelty: 8,
      commercialPracticality: 8
    }
  },
  evidence: {
    product: {
      productName: '접이식 싱크대 물튐 가드 (가상 제품)',
      brand: 'FixtureLab',
      model: 'SG-01',
      variant: '투명 45cm',
      packageQuantity: 1,
      stableIdentifiers: ['fixture-sku-SG-01-45']
    },
    destinationUrl: 'https://example.invalid/fixture-listing/sg-01',
    ownerDeclaredSubstitute: false,
    usageRecordConfirmed: false,
    sources: [
      source('src_official', 'origin_manufacturer', '제조사 사양 페이지 (합성)', 'official_page'),
      source('src_listing', 'origin_marketplace', '판매 페이지 스냅샷 (합성)', 'listing'),
      source('src_owner_photo', 'origin_owner', '소유자 촬영 메모 (합성)', 'owner_note')
    ],
    identityEvidence: [
      { dimension: 'brand', status: 'match', sourceIds: ['src_official'], originId: 'origin_manufacturer', note: '브랜드 표기가 일치한다.' },
      { dimension: 'product_name', status: 'match', sourceIds: ['src_official'], originId: 'origin_manufacturer', note: '제품명이 일치한다.' },
      { dimension: 'model', status: 'match', sourceIds: ['src_listing'], originId: 'origin_marketplace', note: '모델 번호 SG-01이 동일하다.' },
      { dimension: 'variant', status: 'match', sourceIds: ['src_listing'], originId: 'origin_marketplace', note: '투명 45cm 옵션이 동일하다.' }
    ],
    claims: [
      {
        claimId: 'claim_fold',
        text: '사용하지 않을 때 접어서 보관하는 구조다.',
        evidenceClass: 'primary_source',
        sourceIds: ['src_official']
      },
      {
        claimId: 'claim_width',
        text: '설치 가능 폭은 45cm 기준으로 표기되어 있다.',
        evidenceClass: 'primary_source',
        sourceIds: ['src_official']
      },
      {
        claimId: 'claim_install',
        text: '수전 위치에 따라 설치 가능 여부가 달라진다고 안내되어 있다.',
        evidenceClass: 'corroborated',
        sourceIds: ['src_listing', 'src_official']
      }
    ],
    mediaRefs: [
      { mediaId: 'media_owner_1', publishRightsState: 'owner_supplied', allowedActions: ['analyze', 'publish'] }
    ],
    publicFigureRelation: null,
    commerce: {
      observedAt: OBSERVED_AT,
      priceStatus: 'unavailable',
      stockStatus: 'unknown',
      sellerStatus: 'unverified',
      variantStatus: 'verified',
      variantName: '투명 45cm'
    }
  }
});

/** Family 2 — attention is high but identity is not resolved. Score must not unlock strategy. */
export const HIGH_SCORE_UNRESOLVED_SCENARIO = Object.freeze({
  key: 'high_score_unresolved',
  candidate: {
    name: '이름 미상 접이식 정리 도구 (가상 제품)',
    contentLane: 'practical_novel',
    whyNow: '짧은 영상에서 반복적으로 보이지만 제품명이 확인되지 않는다.',
    readerValue: '좁은 주방에서 도구를 정리하려는 사람',
    opportunityScore: 94,
    scoreBreakdown: {
      readerValue: 18,
      demonstrability: 15,
      purchaseIntent: 19,
      attentionAcceleration: 15,
      audienceFit: 10,
      novelty: 10,
      commercialPracticality: 7
    }
  },
  evidence: {
    product: { productName: '이름 미상 접이식 정리 도구 (가상 제품)', brand: null, model: null, variant: null },
    destinationUrl: null,
    ownerDeclaredSubstitute: false,
    usageRecordConfirmed: false,
    sources: [source('src_observation', 'origin_social', '소셜 관찰 메모 (합성)', 'observation')],
    identityEvidence: [
      { dimension: 'product_name', status: 'unknown', sourceIds: ['src_observation'], originId: 'origin_social', note: '제품명을 확인할 수 없다.' }
    ],
    claims: [
      {
        claimId: 'claim_visible',
        text: '접히는 형태의 정리 도구가 반복적으로 보인다.',
        evidenceClass: 'observation',
        sourceIds: ['src_observation']
      }
    ],
    mediaRefs: [],
    publicFigureRelation: null,
    commerce: { observedAt: OBSERVED_AT, priceStatus: 'unavailable', stockStatus: 'unknown', sellerStatus: 'unavailable', variantStatus: 'unresolved' }
  }
});

/** Family 3 — a similar product, which may never be described as the same item. */
export const SUBSTITUTE_SCENARIO = Object.freeze({
  key: 'substitute_product',
  candidate: {
    name: '유사 구조 물튐 가드 (가상 대체품)',
    contentLane: 'family_household',
    whyNow: '원래 찾던 제품은 판매가 끝났고 구조가 비슷한 제품만 남아 있다.',
    readerValue: '같은 문제를 해결할 대안을 찾는 가정',
    opportunityScore: 71,
    scoreBreakdown: {
      readerValue: 16,
      demonstrability: 12,
      purchaseIntent: 13,
      attentionAcceleration: 8,
      audienceFit: 9,
      novelty: 6,
      commercialPracticality: 7
    }
  },
  evidence: {
    product: { productName: '유사 구조 물튐 가드 (가상 대체품)', brand: 'OtherFixture', model: 'OG-9', variant: '반투명 40cm' },
    destinationUrl: 'https://example.invalid/fixture-listing/og-9',
    ownerDeclaredSubstitute: true,
    usageRecordConfirmed: false,
    sources: [
      source('src_alt_listing', 'origin_marketplace_b', '대체품 판매 페이지 (합성)', 'listing'),
      source('src_alt_spec', 'origin_manufacturer_b', '대체품 사양 (합성)', 'official_page')
    ],
    identityEvidence: [
      { dimension: 'brand', status: 'match', sourceIds: ['src_alt_spec'], originId: 'origin_manufacturer_b', note: '대체품 브랜드가 확인된다.' },
      { dimension: 'model', status: 'match', sourceIds: ['src_alt_listing'], originId: 'origin_marketplace_b', note: '대체품 모델이 확인된다.' }
    ],
    claims: [
      {
        claimId: 'claim_alt_fold',
        text: '접이식 구조라는 점은 동일하게 표기되어 있다.',
        evidenceClass: 'primary_source',
        sourceIds: ['src_alt_spec']
      },
      {
        claimId: 'claim_alt_width',
        text: '설치 폭이 40cm로 원래 찾던 제품과 다르다.',
        evidenceClass: 'primary_source',
        sourceIds: ['src_alt_spec']
      }
    ],
    mediaRefs: [],
    publicFigureRelation: null,
    commerce: { observedAt: OBSERVED_AT, priceStatus: 'unavailable', stockStatus: 'unknown', sellerStatus: 'unverified', variantStatus: 'verified', variantName: '반투명 40cm' }
  }
});

/** Family 4 — a useful reference whose publication rights are unknown. Must fail closed. */
export const UNKNOWN_MEDIA_RIGHTS_SCENARIO = Object.freeze({
  key: 'unknown_media_rights',
  candidate: {
    name: '영상 출처 불명 주방 도구 (가상 제품)',
    contentLane: 'practical_novel',
    whyNow: '확산 중인 영상이 있지만 재사용 권리를 확인할 수 없다.',
    readerValue: '같은 도구를 찾고 있는 사람',
    opportunityScore: 88,
    scoreBreakdown: {
      readerValue: 17,
      demonstrability: 15,
      purchaseIntent: 16,
      attentionAcceleration: 14,
      audienceFit: 9,
      novelty: 9,
      commercialPracticality: 8
    }
  },
  evidence: {
    product: { productName: '영상 출처 불명 주방 도구 (가상 제품)', brand: 'FixtureLab', model: 'KT-3', variant: '기본' },
    destinationUrl: null,
    ownerDeclaredSubstitute: false,
    usageRecordConfirmed: false,
    sources: [
      source('src_video', 'origin_video_platform', '공개 영상 참조 (합성)', 'observation'),
      source('src_spec2', 'origin_manufacturer', '사양 페이지 (합성)', 'official_page')
    ],
    identityEvidence: [
      { dimension: 'brand', status: 'match', sourceIds: ['src_spec2'], originId: 'origin_manufacturer', note: '브랜드 확인' },
      { dimension: 'product_name', status: 'match', sourceIds: ['src_spec2'], originId: 'origin_manufacturer', note: '제품명 확인' },
      { dimension: 'model', status: 'match', sourceIds: ['src_video'], originId: 'origin_video_platform', note: '모델 표기 확인' },
      { dimension: 'variant', status: 'match', sourceIds: ['src_spec2'], originId: 'origin_manufacturer', note: '옵션 확인' }
    ],
    claims: [
      { claimId: 'claim_kt3', text: '한 손으로 여닫는 구조로 표기되어 있다.', evidenceClass: 'primary_source', sourceIds: ['src_spec2'] }
    ],
    // Discovery-usable, publication-blocked. Public visibility is not permission.
    mediaRefs: [
      { mediaId: 'media_thirdparty_video', publishRightsState: 'unknown', allowedActions: ['analyze'] }
    ],
    publicFigureRelation: null,
    commerce: { observedAt: OBSERVED_AT, priceStatus: 'unavailable', stockStatus: 'unknown', sellerStatus: 'unverified', variantStatus: 'verified', variantName: '기본' }
  }
});

/** Family 5 — a rumour/private-life trigger, which is not a lane at any score. */
export const BLOCKED_RUMOUR_SCENARIO = Object.freeze({
  key: 'blocked_rumour',
  candidate: {
    name: '사생활 루머 연계 제품 (가상 사례)',
    contentLane: 'issue_triggered',
    whyNow: '사생활 관련 추측이 퍼지면서 특정 물건이 함께 언급된다.',
    readerValue: '없음 — 제품 자체의 독립적인 가치가 확인되지 않는다.',
    opportunityScore: 96,
    scoreBreakdown: {
      readerValue: 4,
      demonstrability: 5,
      purchaseIntent: 18,
      attentionAcceleration: 15,
      audienceFit: 3,
      novelty: 4,
      commercialPracticality: 5
    }
  },
  evidence: {
    product: { productName: '사생활 루머 연계 제품 (가상 사례)', brand: null, model: null, variant: null },
    destinationUrl: null,
    ownerDeclaredSubstitute: false,
    usageRecordConfirmed: false,
    sources: [source('src_rumour', 'origin_rumour', '추측성 게시물 (합성)', 'observation')],
    identityEvidence: [
      { dimension: 'product_name', status: 'unknown', sourceIds: ['src_rumour'], originId: 'origin_rumour', note: '제품을 특정할 수 없다.' }
    ],
    claims: [],
    mediaRefs: [],
    publicFigureRelation: {
      classification: 'blocked_rumor_private',
      allowedWording: '없음',
      evidenceRefs: ['src_rumour']
    },
    commerce: { observedAt: OBSERVED_AT, priceStatus: 'not_applicable', stockStatus: 'not_applicable', sellerStatus: 'not_applicable', variantStatus: 'not_applicable' }
  }
});

export const SLICE1_SCENARIOS = Object.freeze([
  EXACT_PRODUCT_SCENARIO,
  HIGH_SCORE_UNRESOLVED_SCENARIO,
  SUBSTITUTE_SCENARIO,
  UNKNOWN_MEDIA_RIGHTS_SCENARIO,
  BLOCKED_RUMOUR_SCENARIO
]);

export function scenarioByKey(key) {
  return SLICE1_SCENARIOS.find((scenario) => scenario.key === key) ?? null;
}
