import { CANDIDATE_STATES, DEFAULT_DISCLOSURE, scoreCandidate } from './index.mjs';

const rawCandidates = [
  {
    id: 'terrys-orange-chocolate',
    name: '테리스 초콜릿 오렌지',
    category: '간식·여행 구매품',
    sourceLabel: '코스트코·해외 간식 관심 예시',
    exactMatchStatus: 'exact',
    mediaRights: 'not_required',
    personalUse: 'not_confirmed',
    affiliate: true,
    disclosure: DEFAULT_DISCLOSURE,
    riskLevel: 'review',
    reasons: ['오렌지처럼 쪼개지는 시연 장면과 구매처 질문이 함께 발생하기 쉬움'],
    risks: ['판매처별 구성과 가격 차이가 큼'],
    signals: { attention: 18, purchaseIntent: 21, visualPotential: 15, audienceFit: 12, availability: 8, commercialValue: 7, creatorReadiness: 4, riskPenalty: 4 }
  },
  {
    id: 'bathroom-gap-brush',
    name: '욕실 틈새 청소 브러시',
    category: '가성비 생활용품',
    sourceLabel: '생활 불편 해결형 예시',
    exactMatchStatus: 'exact',
    mediaRights: 'owned',
    personalUse: 'confirmed',
    affiliate: true,
    disclosure: DEFAULT_DISCLOSURE,
    riskLevel: 'low',
    reasons: ['사용 전후와 좁은 틈 시연이 쉽고 문제 해결 가치가 명확함'],
    risks: ['오래 굳은 오염은 한 번에 제거되지 않을 수 있음'],
    signals: { attention: 14, purchaseIntent: 22, visualPotential: 14, audienceFit: 15, availability: 10, commercialValue: 8, creatorReadiness: 5, riskPenalty: 1 }
  },
  {
    id: 'pencil-grip',
    name: '초등 연필 교정 그립',
    category: '초등 생활·학습',
    sourceLabel: '학부모 질문형 예시',
    exactMatchStatus: 'likely',
    mediaRights: 'owned',
    personalUse: 'not_confirmed',
    affiliate: true,
    disclosure: DEFAULT_DISCLOSURE,
    riskLevel: 'review',
    reasons: ['학부모의 구체적인 사용 연령과 제품 비교 질문이 발생하기 쉬움'],
    risks: ['교정 효과를 단정하면 안 되고 정확한 모델 확인이 필요함'],
    signals: { attention: 12, purchaseIntent: 20, visualPotential: 11, audienceFit: 15, availability: 8, commercialValue: 6, creatorReadiness: 3, riskPenalty: 8 }
  },
  {
    id: 'compression-pouch',
    name: '여행용 압축 파우치',
    category: '여행·수납',
    sourceLabel: '짐 부피 비교형 예시',
    exactMatchStatus: 'exact',
    mediaRights: 'licensed',
    personalUse: 'not_confirmed',
    affiliate: true,
    disclosure: DEFAULT_DISCLOSURE,
    riskLevel: 'low',
    reasons: ['압축 전후 차이를 짧은 영상이나 사진으로 이해시키기 쉬움'],
    risks: ['지퍼 내구성과 실제 수납량은 제품마다 다름'],
    signals: { attention: 15, purchaseIntent: 19, visualPotential: 15, audienceFit: 13, availability: 9, commercialValue: 8, creatorReadiness: 4, riskPenalty: 2 }
  },
  {
    id: 'cable-clips',
    name: '멀티 충전 케이블 정리 클립',
    category: '직장인 책상용품',
    sourceLabel: '책상 정리 예시',
    exactMatchStatus: 'substitute',
    mediaRights: 'unknown',
    personalUse: 'not_confirmed',
    affiliate: true,
    disclosure: DEFAULT_DISCLOSURE,
    riskLevel: 'blocked',
    reasons: ['전후 비교가 쉽고 저가 소모품이라 구매 장벽이 낮음'],
    risks: ['사진 속 제품과 링크 제품이 다른 대체품일 가능성이 있음'],
    signals: { attention: 13, purchaseIntent: 16, visualPotential: 12, audienceFit: 12, availability: 7, commercialValue: 5, creatorReadiness: 1, riskPenalty: 20 }
  }
];

export const fixtureCandidates = rawCandidates.map((candidate) => ({
  ...candidate,
  score: scoreCandidate(candidate.signals),
  state: CANDIDATE_STATES.DISCOVERED,
  drafts: [],
  selectedDraftId: null,
  updatedAt: new Date(0).toISOString()
}));
