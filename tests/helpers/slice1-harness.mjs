// Shared harness for the Slice 1 tests.
//
// Time and identity are injected so artifact hashes are reproducible and freshness
// assertions do not rot as real time moves past a hard-coded fixture date.

import { createFixedClock, createIdFactory } from '../../packages/core/src/index.mjs';
import { createMemoryStore } from '../../packages/database/src/memory-store.mjs';
import { createApiHandler } from '../../apps/web/src/api.mjs';
import { createService } from '../../apps/web/src/service.mjs';

export function createHarness({ seed = 't', startedAt = '2026-08-14T00:00:00.000Z' } = {}) {
  const clock = createFixedClock(startedAt, 1000);
  const nextId = createIdFactory(seed);
  const store = createMemoryStore({ clock });
  const service = createService({ store, clock, nextId, actor: 'owner' });
  const handler = createApiHandler(service);

  async function call(method, path, body = null) {
    const response = await handler({ method, path, body });
    return { status: response.status, body: JSON.parse(response.body) };
  }

  return { clock, nextId, store, service, call };
}

/** A complete, evidence-backed intake that reaches `exact` after the workbench step. */
export function intakeBody(overrides = {}) {
  return {
    name: '접이식 싱크대 물튐 가드 (가상 제품)',
    contentLane: 'practical_novel',
    whyNow: '접이식 구조라 설치 전후 차이를 짧게 보여줄 수 있다.',
    readerValue: '설거지할 때 상판과 옷이 젖는 문제를 줄이려는 가정',
    observation: '제조사 사양 페이지에 접어서 보관하는 구조로 표기되어 있다.',
    destinationUrl: 'https://example.invalid/fixture-listing/sg-01',
    mediaRightsState: 'owner_supplied',
    usageRecordConfirmed: false,
    ratings: { readerValue: 9, demonstrability: 9, purchaseIntent: 9, audienceFit: 9, novelty: 8 },
    ...overrides
  };
}

/** Identity evidence across two independent origins, which is what `exact` requires. */
export function exactIdentityEvidence(overrides = {}) {
  return {
    product: { brand: 'FixtureLab', model: 'SG-01', variant: '투명 45cm' },
    identityEvidence: [
      { dimension: 'brand', status: 'match', originId: 'origin_maker', note: '브랜드 확인' },
      { dimension: 'product_name', status: 'match', originId: 'origin_maker', note: '제품명 확인' },
      { dimension: 'model', status: 'match', originId: 'origin_market', note: '모델 확인' },
      { dimension: 'variant', status: 'match', originId: 'origin_market', note: '옵션 확인' }
    ],
    ...overrides
  };
}

/** Drive a candidate from intake to a Guardian verdict. */
export async function runToGuardian(harness, { intake = intakeBody(), evidence = exactIdentityEvidence() } = {}) {
  const created = await harness.call('POST', '/api/candidates', { ...intake, idempotencyKey: 'create' });
  const id = created.body.candidate.candidateId;

  await harness.call('POST', '/api/candidates/' + id + '/evidence', { ...evidence, idempotencyKey: 'ev' });
  await harness.call('POST', '/api/candidates/' + id + '/verify', { idempotencyKey: 'v' });
  await harness.call('POST', '/api/candidates/' + id + '/strategies', { idempotencyKey: 's' });
  await harness.call('POST', '/api/candidates/' + id + '/drafts', { idempotencyKey: 'd' });
  const reviewed = await harness.call('POST', '/api/candidates/' + id + '/review', { idempotencyKey: 'r' });

  return { id, reviewed };
}
