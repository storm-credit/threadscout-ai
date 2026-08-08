import { FIXTURE_RESEARCH_POLICY, validateResearchPolicy } from './research-policy.mjs';
import { createSourceRecord, purchaseIntentScore, validateSourceRecord } from './source-records.mjs';

const FIXED_TIME = '2026-08-08T10:00:00.000Z';

const RAW_FIXTURES = Object.freeze([
  {
    id: 'fixture-thread-sink-001', sourceType: 'thread_observation', url: 'fixture://threads/sink-001',
    title: '싱크대 물튐 방지 가드 반응', excerpt: '접으면 공간을 비울 수 있는 싱크대 물튐 가드. 크기와 구매처 질문이 반복됨.',
    observedAt: FIXED_TIME, retrievedAt: FIXED_TIME, rightsStatus: 'observation_only',
    productMentions: [{ name: '접이식 싱크대 물튐 방지 가드', brand: 'FixtureLab', model: 'SG-01', variant: '투명 45cm' }],
    purchaseSignals: { whereToBuy: 2, priceQuestion: 1, linkRequest: 2, stockQuestion: 0, variantQuestion: 2 }
  },
  {
    id: 'fixture-listing-sink-001', sourceType: 'product_listing', url: 'fixture://listing/sink-001',
    title: 'FixtureLab SG-01 투명 45cm', excerpt: '접이식 구조의 싱크대 물튐 방지 가드 제품 목록.',
    observedAt: FIXED_TIME, retrievedAt: FIXED_TIME, rightsStatus: 'metadata_only',
    productMentions: [{ name: '접이식 싱크대 물튐 방지 가드', brand: 'FixtureLab', model: 'SG-01', variant: '투명 45cm' }],
    purchaseSignals: {}, commerce: { priceStatus: 'observed', amount: 12900, currency: 'KRW', stockStatus: 'in_stock', sellerName: 'Fixture Seller', variantName: '투명 45cm' }
  },
  {
    id: 'fixture-thread-cable-001', sourceType: 'thread_observation', url: 'fixture://threads/cable-001',
    title: '책상 케이블 자석 홀더 반응', excerpt: '충전선이 바닥으로 떨어지는 문제를 자석 홀더로 해결. 링크와 부착력 질문이 있음.',
    observedAt: FIXED_TIME, retrievedAt: FIXED_TIME, rightsStatus: 'observation_only',
    productMentions: [{ name: '자석 케이블 정리 홀더', brand: 'FixtureDesk', model: 'MC-02', variant: '3구 블랙' }],
    purchaseSignals: { whereToBuy: 1, priceQuestion: 1, linkRequest: 2, stockQuestion: 0, variantQuestion: 1 }
  },
  {
    id: 'fixture-listing-cable-001', sourceType: 'product_listing', url: 'fixture://listing/cable-001',
    title: 'FixtureDesk MC-02 3구 블랙', excerpt: '자석식 케이블 정리 홀더의 합성 제품 목록.',
    observedAt: FIXED_TIME, retrievedAt: FIXED_TIME, rightsStatus: 'metadata_only',
    productMentions: [{ name: '자석 케이블 정리 홀더', brand: 'FixtureDesk', model: 'MC-02', variant: '3구 블랙' }],
    purchaseSignals: {}, commerce: { priceStatus: 'observed', amount: 7900, currency: 'KRW', stockStatus: 'in_stock', sellerName: 'Fixture Seller', variantName: '3구 블랙' }
  },
  {
    id: 'fixture-thread-gimmick-001', sourceType: 'thread_observation', url: 'fixture://threads/gimmick-001',
    title: '소리 나는 바나나 케이스', excerpt: '누르면 소리가 나는 바나나 모양 케이스. 재미 반응은 많지만 구매 질문은 거의 없음.',
    observedAt: FIXED_TIME, retrievedAt: FIXED_TIME, rightsStatus: 'observation_only',
    productMentions: [{ name: '소리 나는 바나나 케이스', brand: 'FixtureFun', model: 'BN-00', variant: '옐로' }],
    purchaseSignals: { whereToBuy: 0, priceQuestion: 0, linkRequest: 0, stockQuestion: 0, variantQuestion: 0 }
  }
]);

function searchable(record) {
  return `${record.title} ${record.excerpt} ${record.productMentions.map((item) => `${item.name} ${item.brand} ${item.model} ${item.variant}`).join(' ')}`.toLowerCase();
}

export function createFixtureResearchAdapter({ policy = FIXTURE_RESEARCH_POLICY, fixtures = RAW_FIXTURES } = {}) {
  const policyValidation = validateResearchPolicy(policy);
  if (!policyValidation.ok) throw new Error(`Invalid fixture policy: ${policyValidation.errors.join(' | ')}`);
  const records = fixtures.map((fixture) => createSourceRecord(fixture, policy));

  return Object.freeze({
    id: 'fixture-research-adapter-v1',
    policy,
    networkAllowed: false,
    mutationAllowed: false,
    async search(query, { limit = policy.maxResultsPerQuery, sourceTypes = policy.allowedSourceTypes } = {}) {
      const terms = String(query ?? '').toLowerCase().split(/\s+/).filter(Boolean);
      const safeLimit = Math.min(policy.maxResultsPerQuery, Math.max(1, Number(limit) || 1));
      return records
        .filter((record) => sourceTypes.includes(record.sourceType))
        .filter((record) => terms.length === 0 || terms.some((term) => searchable(record).includes(term)))
        .sort((a, b) => purchaseIntentScore(b) - purchaseIntentScore(a))
        .slice(0, safeLimit)
        .map((record) => structuredClone(record));
    },
    async getById(sourceId) {
      const record = records.find((item) => item.id === sourceId);
      return record ? structuredClone(record) : null;
    },
    async list() {
      return records.map((record) => structuredClone(record));
    },
    async write() {
      throw new Error('Fixture research adapter is read-only.');
    },
    validate(record) {
      return validateSourceRecord(record, policy);
    }
  });
}
