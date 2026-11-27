// Deterministic Issue / Public-Figure Source & Relation Governance (`ISSUE_SOURCE_GRADING.md`,
// `ISSUE_PRODUCT_DECISION_TABLE.md`, `AT-03`, `AT-27`, `AT-30`, `AT-37`, `BS-22`, `BS-26`, `BS-27`)
// and Two-Stage Discovery-vs-Publication Media Rights Funnel (`MEDIA_PIPELINE.md`, `AT-05`, `AT-26`, `AT-31`).

export const ISSUE_SOURCE_GRADES = Object.freeze(['none', 'G0', 'G1', 'G2', 'G3', 'G4']);
export const PRODUCT_RELATION_GRADES = Object.freeze(['none', 'R0', 'R1', 'R2', 'R3', 'R4', 'R5']);

export const DISCOVERY_MEDIA_STATES = Object.freeze([
  'none',
  'analysis_only_public',
  'viral_clip_unlicensed',
  'official_still_unlicensed',
  'user_captured',
  'licensed_asset'
]);

export const PUBLICATION_MEDIA_RIGHTS = Object.freeze([
  'not_required',
  'owned',
  'user_owned',
  'licensed',
  'explicitly_licensed',
  'platform_embed_only',
  'link_only',
  'analysis_only',
  'unknown',
  'prohibited'
]);

const SPONSORSHIP_NOUN = '(?:유료\\s*)?(?:협찬|광고\\s*모델|공식\\s*캠페인|공식\\s*모델|앰버서더|추천)';
const NEGATED_ENDORSEMENT_DISCLAIMERS = [
  new RegExp(
    `${SPONSORSHIP_NOUN}(?:\\s*(?:이나|및|·|,|또는)\\s*${SPONSORSHIP_NOUN})*(?:\\s*(?:캠페인|제품|관계|계약|표현|함의|근거|사실))?(?:이|가|은|는|도)?\\s*(?:아니|없|쓰지\\s*않|제거)\\S*`,
    'g'
  )
];

const SPONSORSHIP_OR_ENDORSEMENT_PATTERNS = [
  /공식\s*(캠페인|모델|앰버서더|협찬)/,
  /(연예인|유명인|방송인|셀럽|배우|가수|아이돌).{0,18}(추천|강추|최애|픽|협찬)/,
  /(?<![가-힣])(?:강추한|추천한|픽한|강추하는)\s*[가-힣A-Za-z0-9]/,
  /[가-힣A-Za-z0-9]{1,14}(?:이|가|께서)\s*추천하(?:는|던)\s*[가-힣A-Za-z0-9]/,
  /[가-힣A-Za-z0-9]{1,14}의\s*최애\s*[가-힣A-Za-z0-9]/,
  /최애\s*(템|제품|아이템)/,
  /광고\s*모델/,
  /유료\s*협찬/,
  /협찬\s*(제품|받아|받은|템)/,
  /앰버서더/
];

const CONTRASTIVE_PUBLIC_USE_NEGATIONS = [
  /(?:방송|무대|경기|행사|영상|화면)[가-힣\s]{0,16}(?:착용한|사용한|썼던|들었던|마셨던)[가-힣\s]{0,12}(?:같은|동일)\s*제품이\s*아니\S*/g
];

const DIRECT_CONFIRMED_PUBLIC_USE_PATTERNS = [
  /(방송|무대|경기|행사|영상|화면)에서[^.?!\n]{0,24}(착용|사용|썼던|들었던|마셨던)/,
  /(실제로|직접)\s*(착용한|사용한|착용했던|사용했던)\s*[가-힣A-Za-z0-9]/
];

const ATTRIBUTED_REPORT_MARKERS = [
  /(보도|기사|공식\s*발표|전해졌|알려졌|언급된|소개된)/
];

export function stripNegatedEndorsementDisclaimers(text = '') {
  return NEGATED_ENDORSEMENT_DISCLAIMERS.reduce(
    (acc, pattern) => acc.replace(pattern, ' '),
    String(text ?? '')
  );
}

export function detectSponsorshipOrEndorsementWording(text = '') {
  const cleaned = stripNegatedEndorsementDisclaimers(text);
  return SPONSORSHIP_OR_ENDORSEMENT_PATTERNS.some((p) => p.test(cleaned));
}

export function detectConfirmedPublicUseWording(text = '') {
  const cleaned = CONTRASTIVE_PUBLIC_USE_NEGATIONS.reduce(
    (acc, pattern) => acc.replace(pattern, ' '),
    String(text ?? '')
  );
  return DIRECT_CONFIRMED_PUBLIC_USE_PATTERNS.some((p) => p.test(cleaned));
}

export function hasAttributedReportFraming(text = '') {
  return ATTRIBUTED_REPORT_MARKERS.some((p) => p.test(String(text ?? '')));
}

/**
 * Evaluate the non-substitutable two-axis `G0–G4` × `R0–R5` × `matchState` decision matrix
 * (`ISSUE_PRODUCT_DECISION_TABLE.md`). Never collapses source reliability and product relation into one score.
 */
export function evaluateIssueProductDecision({
  issueSourceGrade = 'none',
  productRelationGrade = 'none',
  matchState = 'unresolved',
  personIdentifiedFromImageOnly = false
} = {}) {
  const rawSrc = issueSourceGrade === undefined || issueSourceGrade === null || String(issueSourceGrade).trim() === ''
    ? 'none'
    : String(issueSourceGrade).trim();
  const rawRel = productRelationGrade === undefined || productRelationGrade === null || String(productRelationGrade).trim() === ''
    ? 'none'
    : String(productRelationGrade).trim();

  if (!ISSUE_SOURCE_GRADES.includes(rawSrc) || !PRODUCT_RELATION_GRADES.includes(rawRel)) {
    return Object.freeze({
      issueLinked: true,
      issueSourceGrade: rawSrc,
      productRelationGrade: rawRel,
      routeOutcome: 'block',
      allowedWordingCeiling: 'blocked',
      exactAffiliateAllowed: false,
      alternativeAffiliateAllowed: false,
      publicFigureVerifiedEndorsement: false,
      candidateCardLabelKo: '미인식 등급 차단',
      blockers: Object.freeze([
        `인식할 수 없는 이슈 출처(${rawSrc}) 또는 제품 연관 등급(${rawRel})이므로 안전을 위해 진행을 차단합니다(AT-17).`
      ])
    });
  }

  const src = rawSrc;
  const rel = rawRel;

  if (Boolean(personIdentifiedFromImageOnly)) {
    return Object.freeze({
      issueLinked: true,
      issueSourceGrade: src,
      productRelationGrade: rel,
      routeOutcome: 'block',
      allowedWordingCeiling: 'blocked',
      exactAffiliateAllowed: false,
      alternativeAffiliateAllowed: false,
      publicFigureVerifiedEndorsement: false,
      candidateCardLabelKo: '인물 이미지 추론 차단',
      blockers: Object.freeze(['이미지·얼굴 추론만으로 실존 인물을 특정하거나 연결할 수 없습니다(MEDIA_PIPELINE.md §6, CLAUDE.md §9).'])
    });
  }

  if (src === 'none' && rel === 'none') {
    return Object.freeze({
      issueLinked: false,
      issueSourceGrade: 'none',
      productRelationGrade: 'none',
      routeOutcome: 'not_issue_linked',
      allowedWordingCeiling: 'none',
      exactAffiliateAllowed: matchState === 'exact',
      alternativeAffiliateAllowed: ['exact', 'substitute'].includes(matchState),
      publicFigureVerifiedEndorsement: false,
      candidateCardLabelKo: null,
      blockers: Object.freeze([])
    });
  }

  // Hard rumor / private-life / invasive relation blocks (`G4` or `R5`, `AT-03`, `AT-27`, `AT-30`, `BS-27`)
  if (src === 'G4' || rel === 'R5') {
    return Object.freeze({
      issueLinked: true,
      issueSourceGrade: src,
      productRelationGrade: rel,
      routeOutcome: 'block',
      allowedWordingCeiling: 'blocked',
      exactAffiliateAllowed: false,
      alternativeAffiliateAllowed: false,
      publicFigureVerifiedEndorsement: false,
      candidateCardLabelKo: '루머·사생활 차단',
      blockers: Object.freeze([
        src === 'G4'
          ? '루머·익명·사생활·외모/건강 추측 출처(G4)는 점수나 조회수와 무관하게 상업·콘텐츠 후보에서 차단됩니다(AT-03, BS-27).'
          : '사생활 추론·오인 유도·미검증 추천 함의 관계(R5)는 이슈 연계 진행이 차단됩니다(AT-27, AT-30).'
      ])
    });
  }

  // Both axes must be explicitly supplied when issue-linked (`ISSUE_SOURCE_GRADING.md` §2)
  if (src === 'none' || rel === 'none') {
    return Object.freeze({
      issueLinked: true,
      issueSourceGrade: src,
      productRelationGrade: rel,
      routeOutcome: 'verify_more',
      allowedWordingCeiling: 'discovery_hypothesis_only',
      exactAffiliateAllowed: false,
      alternativeAffiliateAllowed: false,
      publicFigureVerifiedEndorsement: false,
      candidateCardLabelKo: '제품 추정 — 검증 필요',
      blockers: Object.freeze(['이슈 연계 후보는 출처 신뢰 등급(G0~G4)과 제품 연관 등급(R0~R5) 두 축을 모두 독립 확인해야 합니다.'])
    });
  }

  // `G3` secondary aggregation is discovery lead ONLY (`ISSUE_SOURCE_GRADING.md` §§3, 5)
  if (src === 'G3') {
    return Object.freeze({
      issueLinked: true,
      issueSourceGrade: src,
      productRelationGrade: rel,
      routeOutcome: 'verify_more',
      allowedWordingCeiling: 'discovery_hypothesis_only',
      exactAffiliateAllowed: false,
      alternativeAffiliateAllowed: false,
      publicFigureVerifiedEndorsement: false,
      candidateCardLabelKo: '제품 추정 — 검증 필요',
      blockers: Object.freeze(['2차 요약·커뮤니티 재인용(G3) 단독 출처로는 게시 가능한 사실 주장이나 제휴 연결을 뒷받침할 수 없습니다. 1차 공식/보도 출처(G0~G2)를 먼저 확보하세요.'])
    });
  }

  // `R0` — Official endorsement / campaign (`G0/G1 + R0 + exact`)
  if (rel === 'R0') {
    if ((src === 'G0' || src === 'G1') && matchState === 'exact') {
      return Object.freeze({
        issueLinked: true,
        issueSourceGrade: src,
        productRelationGrade: rel,
        routeOutcome: 'exact_product_content',
        allowedWordingCeiling: 'official_campaign',
        exactAffiliateAllowed: true,
        alternativeAffiliateAllowed: true,
        publicFigureVerifiedEndorsement: true,
        candidateCardLabelKo: '공식 캠페인 연계',
        blockers: Object.freeze([])
      });
    }
    return Object.freeze({
      issueLinked: true,
      issueSourceGrade: src,
      productRelationGrade: rel,
      routeOutcome: 'verify_more',
      allowedWordingCeiling: 'discovery_hypothesis_only',
      exactAffiliateAllowed: false,
      alternativeAffiliateAllowed: false,
      publicFigureVerifiedEndorsement: false,
      candidateCardLabelKo: '공식 캠페인 확인 필요',
      blockers: Object.freeze(['공식 캠페인·협찬(R0) 표기는 공식/직접 보도 출처(G0·G1)와 동일 제품(exact) 교차 검증이 모두 필요합니다.'])
    });
  }

  // `R1` — Confirmed public use or possession (never implies paid sponsorship/endorsement! `BS-26`)
  if (rel === 'R1') {
    if ((src === 'G0' || src === 'G1') && matchState === 'exact') {
      return Object.freeze({
        issueLinked: true,
        issueSourceGrade: src,
        productRelationGrade: rel,
        routeOutcome: 'exact_product_content',
        allowedWordingCeiling: 'confirmed_public_use',
        exactAffiliateAllowed: true,
        alternativeAffiliateAllowed: true,
        publicFigureVerifiedEndorsement: false,
        candidateCardLabelKo: '방송 노출 계기',
        blockers: Object.freeze([])
      });
    }
    if (src === 'G2' && matchState === 'exact') {
      return Object.freeze({
        issueLinked: true,
        issueSourceGrade: src,
        productRelationGrade: rel,
        routeOutcome: 'information_only',
        allowedWordingCeiling: 'confirmed_public_use',
        exactAffiliateAllowed: false,
        alternativeAffiliateAllowed: false,
        publicFigureVerifiedEndorsement: false,
        candidateCardLabelKo: '공개 행사에서 관심 증가',
        blockers: Object.freeze([])
      });
    }
    return Object.freeze({
      issueLinked: true,
      issueSourceGrade: src,
      productRelationGrade: rel,
      routeOutcome: 'verify_more',
      allowedWordingCeiling: 'discovery_hypothesis_only',
      exactAffiliateAllowed: false,
      alternativeAffiliateAllowed: false,
      publicFigureVerifiedEndorsement: false,
      candidateCardLabelKo: '제품 추정 — 검증 필요',
      blockers: Object.freeze(['공개 착용·사용 확인(R1)은 동일 제품(exact) 식별 전까지 단정할 수 없습니다.'])
    });
  }

  // `R2` — Visible product clue, exact identity unresolved (`AT-27`)
  if (rel === 'R2') {
    return Object.freeze({
      issueLinked: true,
      issueSourceGrade: src,
      productRelationGrade: rel,
      routeOutcome: 'verify_more',
      allowedWordingCeiling: 'discovery_hypothesis_only',
      exactAffiliateAllowed: false,
      alternativeAffiliateAllowed: false,
      publicFigureVerifiedEndorsement: false,
      candidateCardLabelKo: '제품 추정 — 검증 필요',
      blockers: Object.freeze(['화면 노출 단서만 있는 단계(R2)는 후보 가설 생성만 허용되며 동일 제품 주장 및 정품 제휴 연결이 제한됩니다(AT-27).'])
    });
  }

  // `R3` — Reported association (`G0/G1 + R3`)
  if (rel === 'R3') {
    if (src === 'G0' || src === 'G1') {
      if (matchState === 'exact') {
        return Object.freeze({
          issueLinked: true,
          issueSourceGrade: src,
          productRelationGrade: rel,
          routeOutcome: 'exact_product_content',
          allowedWordingCeiling: 'attributed_report_only',
          exactAffiliateAllowed: true,
          alternativeAffiliateAllowed: true,
          publicFigureVerifiedEndorsement: false,
          candidateCardLabelKo: '공개 행사에서 관심 증가',
          blockers: Object.freeze([])
        });
      }
      if (matchState === 'likely') {
        return Object.freeze({
          issueLinked: true,
          issueSourceGrade: src,
          productRelationGrade: rel,
          routeOutcome: 'information_only',
          allowedWordingCeiling: 'attributed_report_only',
          exactAffiliateAllowed: false,
          alternativeAffiliateAllowed: false,
          publicFigureVerifiedEndorsement: false,
          candidateCardLabelKo: '공개 행사에서 관심 증가',
          blockers: Object.freeze([])
        });
      }
      if (matchState === 'substitute') {
        return Object.freeze({
          issueLinked: true,
          issueSourceGrade: src,
          productRelationGrade: rel,
          routeOutcome: 'alternative_product_content',
          allowedWordingCeiling: 'alternative_only',
          exactAffiliateAllowed: false,
          alternativeAffiliateAllowed: true,
          publicFigureVerifiedEndorsement: false,
          candidateCardLabelKo: '공개 행사 관심 — 대체 후보',
          blockers: Object.freeze([])
        });
      }
    }
    return Object.freeze({
      issueLinked: true,
      issueSourceGrade: src,
      productRelationGrade: rel,
      routeOutcome: 'verify_more',
      allowedWordingCeiling: 'discovery_hypothesis_only',
      exactAffiliateAllowed: false,
      alternativeAffiliateAllowed: false,
      publicFigureVerifiedEndorsement: false,
      candidateCardLabelKo: '제품 추정 — 검증 필요',
      blockers: Object.freeze(['언급 보도 연계(R3)는 G0·G1 출처 및 제품 일치 여부가 확인되어야 진행할 수 있습니다.'])
    });
  }

  // `R4` — Similar-looking / alternative only (`G0–G2 + R4`, `AT-30`)
  if (['exact', 'substitute'].includes(matchState)) {
    return Object.freeze({
      issueLinked: true,
      issueSourceGrade: src,
      productRelationGrade: rel,
      routeOutcome: 'alternative_product_content',
      allowedWordingCeiling: 'alternative_only',
      exactAffiliateAllowed: false,
      alternativeAffiliateAllowed: true,
      publicFigureVerifiedEndorsement: false,
      candidateCardLabelKo: '공개 행사 관심 — 대체 후보',
      blockers: Object.freeze([])
    });
  }

  return Object.freeze({
    issueLinked: true,
    issueSourceGrade: src,
    productRelationGrade: rel,
    routeOutcome: 'verify_more',
    allowedWordingCeiling: 'discovery_hypothesis_only',
    exactAffiliateAllowed: false,
    alternativeAffiliateAllowed: false,
    publicFigureVerifiedEndorsement: false,
    candidateCardLabelKo: '제품 추정 — 검증 필요',
    blockers: Object.freeze(['대체 후보 연계(R4)도 연결할 대체 상품의 모델·규격 근거가 먼저 확인되어야 합니다.'])
  });
}

function isValidHttpsUrl(rawUrl = '') {
  try {
    const parsed = new URL(String(rawUrl ?? '').trim());
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Separate `discoveryMediaState` (internal research/clue extraction) from final-use `publicationMediaRights`
 * (`MEDIA_PIPELINE.md` §§1–10, `CLAUDE.md` §10: `user_owned > licensed_commercial > permitted_embed > text_only > hold`).
 */
export function resolveMediaPublicationFallback({
  discoveryMediaState = 'none',
  publicationMediaRights = 'not_required',
  publishableMediaUrl = '',
  aiGeneratedDepictsRealPerson = false,
  syntheticDeceptiveBeforeAfter = false
} = {}) {
  const discovery = DISCOVERY_MEDIA_STATES.includes(discoveryMediaState) ? discoveryMediaState : 'none';
  const rights = PUBLICATION_MEDIA_RIGHTS.includes(publicationMediaRights) ? publicationMediaRights : 'unknown';
  const trimmedUploadUrl = String(publishableMediaUrl ?? '').trim();
  const hasHttpsUploadUrl = isValidHttpsUrl(trimmedUploadUrl);
  const aiRealPerson = Boolean(aiGeneratedDepictsRealPerson);
  const deceptiveBeforeAfter = Boolean(syntheticDeceptiveBeforeAfter);

  if (aiRealPerson || deceptiveBeforeAfter || rights === 'prohibited') {
    return Object.freeze({
      discoveryMediaState: discovery,
      publicationMediaRights: rights,
      analysisAllowed: rights !== 'prohibited',
      publishable: false,
      reuploadAllowed: false,
      selectedTreatment: 'blocked',
      reasonCode: aiRealPerson
        ? 'AI_PUBLIC_FIGURE_LIKENESS_FORBIDDEN'
        : deceptiveBeforeAfter
          ? 'DECEPTIVE_BEFORE_AFTER_MEDIA_FORBIDDEN'
          : 'PROHIBITED_MEDIA_RIGHTS',
      blockerKo: aiRealPerson
        ? '실존 공인·인물이 제품을 사용·추천하는 것처럼 합성·생성한 이미지는 게시가 영구 금지됩니다(AT-37, BS-22).'
        : deceptiveBeforeAfter
          ? '근거 없는 효과를 암시하는 조작·합성 전후 비교 이미지는 게시할 수 없습니다(MEDIA_PIPELINE.md §10).'
          : '재게시 금지(prohibited) 미디어 상태입니다.'
    });
  }

  if (rights === 'unknown') {
    return Object.freeze({
      discoveryMediaState: discovery,
      publicationMediaRights: rights,
      analysisAllowed: discovery !== 'none',
      publishable: false,
      reuploadAllowed: false,
      selectedTreatment: 'hold',
      reasonCode: 'MEDIA_RIGHTS_UNKNOWN_HOLD',
      blockerKo: '외부 공개 사진·영상의 열람 가능성은 재업로드 권리를 의미하지 않습니다. 본인 촬영·라이선스 자산으로 교체하거나 텍스트 단독(미디어 없음) 폴백을 선택하세요(AT-05, AT-26).'
    });
  }

  if (rights === 'owned' || rights === 'user_owned' || rights === 'licensed' || rights === 'explicitly_licensed') {
    if (trimmedUploadUrl && !hasHttpsUploadUrl) {
      return Object.freeze({
        discoveryMediaState: discovery,
        publicationMediaRights: rights,
        analysisAllowed: true,
        publishable: false,
        reuploadAllowed: false,
        effectiveUploadUrl: null,
        selectedTreatment: 'hold',
        reasonCode: 'INVALID_PUBLISHABLE_MEDIA_URL',
        blockerKo: '게시 허용 이미지 URL은 올바른 https:// 주소여야 합니다.'
      });
    }
  }

  if (rights === 'owned' || rights === 'user_owned') {
    return Object.freeze({
      discoveryMediaState: discovery,
      publicationMediaRights: rights,
      analysisAllowed: true,
      publishable: true,
      reuploadAllowed: true,
      effectiveUploadUrl: hasHttpsUploadUrl ? trimmedUploadUrl : null,
      selectedTreatment: 'user_owned',
      reasonCode: null,
      blockerKo: null
    });
  }

  if (rights === 'licensed' || rights === 'explicitly_licensed') {
    return Object.freeze({
      discoveryMediaState: discovery,
      publicationMediaRights: rights,
      analysisAllowed: true,
      publishable: true,
      reuploadAllowed: true,
      effectiveUploadUrl: hasHttpsUploadUrl ? trimmedUploadUrl : null,
      selectedTreatment: 'licensed_commercial',
      reasonCode: null,
      blockerKo: null
    });
  }

  if (rights === 'platform_embed_only') {
    return Object.freeze({
      discoveryMediaState: discovery,
      publicationMediaRights: rights,
      analysisAllowed: true,
      publishable: true,
      reuploadAllowed: false,
      effectiveUploadUrl: null,
      selectedTreatment: 'permitted_embed',
      reasonCode: null,
      blockerKo: null
    });
  }

  // `not_required`, `analysis_only`, `link_only` -> safe `text_only` publication fallback (viral source media stays internal analysis evidence ONLY, `AT-26`, `AT-31`, `F24`)
  return Object.freeze({
    discoveryMediaState: discovery,
    publicationMediaRights: rights,
    analysisAllowed: true,
    publishable: true,
    reuploadAllowed: false,
    effectiveUploadUrl: null,
    selectedTreatment: 'text_only',
    reasonCode: null,
    blockerKo: null
  });
}
