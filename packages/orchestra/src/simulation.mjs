import { AGENT_IDS, AGENT_REGISTRY } from './agent-registry.mjs';
import { ARTIFACT_TYPES, validateAgentArtifact } from './contracts.mjs';
import { validateArtifactSchema } from './schemas.mjs';
import { scoreSinbakCandidate } from './niche-profile.mjs';
import {
  completeLocalQueue,
  createOrchestraPlan,
  createRunState,
  getCurrentStage,
  recordHumanDecision,
  submitAgentArtifact
} from './orchestrator.mjs';

const FIXED_TIME = '2026-08-08T09:00:00.000Z';
const DISCLOSURE = '이 포스팅은 쿠팡파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받을 수 있습니다.';

function envelope(type, runId, payload) {
  return { type, runId, createdAt: FIXED_TIME, ...payload };
}

function assertArtifact(agentId, artifact) {
  const contract = validateAgentArtifact(agentId, artifact);
  const schema = validateArtifactSchema(agentId, artifact);
  const errors = [...contract.errors, ...schema.errors];
  if (errors.length) throw new Error(`Invalid ${agentId} simulation artifact: ${errors.join(' | ')}`);
}

function buildCandidate() {
  const base = {
    id: 'fixture-foldable-sink-splash-guard',
    name: '접이식 싱크대 물튐 방지 가드',
    reason: '설치 전후의 물튐 차이와 접히는 구조를 짧은 시연으로 설명할 수 있다.',
    identityConfidence: 0.88,
    sourceRefs: ['fixture:thread-observation-001', 'fixture:listing-001'],
    signals: {
      problemClarity: 88,
      demoPotential: 91,
      practicalUtility: 82,
      novelty: 76,
      purchaseIntent: 74,
      audienceFit: 85
    },
    flags: {}
  };
  return { ...base, ...scoreSinbakCandidate(base), synthetic: true };
}

function artifactsFor(runId) {
  const candidate = buildCandidate();
  return {
    [AGENT_IDS.ORCHESTRATOR]: envelope(ARTIFACT_TYPES.RUN_PLAN, runId, {
      objective: '실용 신박템 한 개를 발굴해 검증된 Threads 초안 네 개와 로컬 승인 대기열 기록을 만든다.',
      nicheId: 'sinbak-items',
      constraints: ['고정 여섯 에이전트', '검증되지 않은 체험 표현 금지', '외부 게시 금지'],
      successCriteria: ['후보 점수 70점 이상', '초안 네 개', 'Guardian pass', '사람 승인 후 로컬 큐'],
      stopConditions: ['제품 불일치', '미디어 권리 미확인', 'Guardian block', '호출 한도 도달']
    }),
    [AGENT_IDS.SCOUT]: envelope(ARTIFACT_TYPES.CANDIDATE_SET, runId, {
      nicheId: 'sinbak-items',
      candidates: [{
        id: candidate.id,
        name: candidate.name,
        reason: candidate.reason,
        score: candidate.score,
        status: candidate.status,
        sourceRefs: candidate.sourceRefs,
        signals: candidate.signals,
        gates: candidate.gates,
        synthetic: true
      }]
    }),
    [AGENT_IDS.VERIFIER]: envelope(ARTIFACT_TYPES.EVIDENCE_PACKET, runId, {
      canonicalProduct: {
        name: '접이식 싱크대 물튐 방지 가드',
        brand: 'FixtureLab',
        model: 'SG-01',
        variant: '투명 45cm',
        synthetic: true
      },
      exactMatchStatus: 'exact',
      sources: [
        { id: 'fixture:listing-001', type: 'fixture_listing', observedAt: FIXED_TIME },
        { id: 'fixture:creator-media-001', type: 'owned_fixture_media', observedAt: FIXED_TIME }
      ],
      mediaRights: 'owned',
      personalUse: 'not_confirmed',
      claimEvidence: [
        { claimId: 'claim-foldable', text: '사용하지 않을 때 접을 수 있는 구조다.', status: 'verified_fixture', sourceIds: ['fixture:listing-001'] },
        { claimId: 'claim-demo', text: '설치 전후 물튐 비교 장면을 촬영할 수 있다.', status: 'verified_fixture', sourceIds: ['fixture:creator-media-001'] }
      ],
      commerceSnapshot: {
        observedAt: FIXED_TIME,
        priceStatus: 'observed',
        amount: 12900,
        currency: 'KRW',
        stockStatus: 'in_stock',
        sellerStatus: 'verified',
        sellerName: 'Fixture Seller',
        variantStatus: 'verified',
        variantName: '투명 45cm',
        synthetic: true
      },
      blockers: []
    }),
    [AGENT_IDS.STRATEGIST]: envelope(ARTIFACT_TYPES.CONTENT_BRIEF, runId, {
      audience: '설거지할 때 상판과 옷으로 튀는 물이 불편한 가정',
      coreValue: '접이식 구조와 물튐 전후 차이를 짧게 보여 주는 실용 신박템',
      cta: '정확한 크기와 설치 가능한 싱크대 구조를 확인하게 한다.',
      angles: [
        { id: 'problem-result', goal: '불편 해결', hook: '설거지할 때마다 옷이 젖는다면', proof: 'claim-demo', limitation: '싱크대 구조별 설치 가능 여부 확인' },
        { id: 'mechanism-demo', goal: '구조 시연', hook: '펼치면 막고 접으면 사라짐', proof: 'claim-foldable', limitation: '실제 크기 확인' },
        { id: 'buying-checklist', goal: '구매 판단', hook: '비슷해 보여도 확인할 게 세 가지', proof: 'claim-foldable', limitation: '모델·옵션·판매자 일치 확인' },
        { id: 'honest-fit', goal: '적합 대상', hook: '모든 싱크대에 필요한 건 아님', proof: 'claim-demo', limitation: '벽 높이와 수전 위치에 따라 효용 차이' }
      ]
    }),
    [AGENT_IDS.WRITER]: envelope(ARTIFACT_TYPES.DRAFT_BUNDLE, runId, {
      drafts: [
        {
          angleId: 'problem-result',
          text: '설거지할 때마다 상판이랑 옷에 물 튀는 집이면 이 구조는 한 번 볼 만함. 싱크대 앞에 펼쳐 두고, 안 쓸 때는 접는 방식이라 전후 장면이 확실함. 다만 싱크대 높이와 설치 폭은 먼저 확인해야 함.',
          claimIds: ['claim-demo', 'claim-foldable'],
          disclosure: DISCLOSURE
        },
        {
          angleId: 'mechanism-demo',
          text: '펼치면 물튐을 막는 가드, 사용 후에는 접어서 공간을 비움. 말로 설명하는 것보다 5초 시연이 훨씬 빠른 신박템임. 사진 속 옵션과 링크 제품의 크기가 같은지는 꼭 다시 확인할 예정.',
          claimIds: ['claim-foldable'],
          disclosure: DISCLOSURE
        },
        {
          angleId: 'buying-checklist',
          text: '싱크대 물막이 가드는 비슷해 보여도 세 가지를 봐야 함. ① 전체 길이 ② 접히는 방향 ③ 수전과 간섭 여부. 제품명만 같다고 같은 옵션은 아니니 모델과 판매자까지 맞아야 링크를 붙일 수 있음.',
          claimIds: ['claim-foldable'],
          disclosure: DISCLOSURE
        },
        {
          angleId: 'honest-fit',
          text: '이건 모든 집 필수템은 아님. 싱크대가 넓고 물이 거의 안 튀면 자리만 차지할 수 있음. 반대로 설거지할 때 상판 청소를 반복하는 집이라면 설치 전후를 비교해 볼 가치가 있는 후보.',
          claimIds: ['claim-demo'],
          disclosure: DISCLOSURE
        }
      ]
    }),
    [AGENT_IDS.GUARDIAN]: envelope(ARTIFACT_TYPES.REVIEW_REPORT, runId, {
      decision: 'pass',
      blockers: [],
      warnings: ['실제 게시 전 실판매 링크와 45cm 옵션을 다시 확인해야 한다.'],
      checks: [
        { id: 'exact-product', status: 'pass', detail: 'Fixture evidence packet에서 모델과 옵션이 일치한다.' },
        { id: 'personal-use', status: 'pass', detail: '직접 사용을 주장하는 표현이 없다.' },
        { id: 'media-rights', status: 'pass', detail: '시뮬레이션 미디어 권리는 owned로 기록됐다.' },
        { id: 'affiliate-disclosure', status: 'pass', detail: '모든 초안에 제휴 고지가 포함됐다.' },
        { id: 'external-action', status: 'pass', detail: '외부 게시 기능이 비활성화되어 있다.' }
      ]
    })
  };
}

export function runSinbakFixtureSimulation({ humanDecision = 'approved', actor = 'fixture-user' } = {}) {
  const plan = createOrchestraPlan({ objective: '실용 신박템 한 개를 끝까지 처리하는 고정 여섯 에이전트 시뮬레이션' });
  let run = createRunState(plan, 'run-sinbak-fixture-001');
  const artifacts = artifactsFor(run.runId);

  for (const agent of AGENT_REGISTRY) {
    const current = getCurrentStage(run);
    if (current?.assignedTo !== agent.id) throw new Error(`Expected ${agent.id}, received ${current?.assignedTo ?? 'none'}.`);
    const artifact = artifacts[agent.id];
    assertArtifact(agent.id, artifact);
    run = submitAgentArtifact(run, agent.id, artifact);
  }

  run = recordHumanDecision(run, humanDecision, actor);
  if (humanDecision === 'approved') {
    run = completeLocalQueue(run, {
      id: 'queue-sinbak-fixture-001',
      candidateId: 'fixture-foldable-sink-splash-guard',
      scheduledFor: '2026-08-09T08:10:00+09:00',
      publishingEnabled: false,
      synthetic: true
    });
  }

  return run;
}
