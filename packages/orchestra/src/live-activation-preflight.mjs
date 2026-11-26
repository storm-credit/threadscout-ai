// Unified Live-Activation Preflight & Redacted Provider Readiness Evaluator
// (`CLAUDE.md` §§3, 5, 11, 12, `PUBLISHING_SPEC.md` §10).
// Evaluates Meta Threads Publishing, Threads Discovery, Dual Affiliate (Naver + Coupang),
// and Tiered Live LLM Runtime readiness while keeping live network execution OFF by default
// and never exposing secret values.

import { LIVE_SOURCE_IDS, validateLiveSourceRegistry } from './live-source-registry.mjs';
import { evaluateSourceReadiness, redactEnvironment } from './source-readiness.mjs';
import { COUPANG_HOURLY_LIMITS } from '../../core/src/affiliate-yield-service.mjs';

function present(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export const SUPPORTED_LLM_PROVIDERS = Object.freeze([
  Object.freeze({
    id: 'gemini',
    name: 'Google Gemini (Tiered Flash / Pro)',
    envKey: 'GEMINI_API_KEY',
    endpointPreview: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    redactedHeaders: Object.freeze({ 'x-goog-api-key': '<redacted>', 'Content-Type': 'application/json' })
  }),
  Object.freeze({
    id: 'openai',
    name: 'OpenAI Responses API',
    envKey: 'OPENAI_API_KEY',
    endpointPreview: 'https://api.openai.com/v1/responses',
    redactedHeaders: Object.freeze({ Authorization: 'Bearer <redacted>', 'Content-Type': 'application/json' })
  }),
  Object.freeze({
    id: 'anthropic',
    name: 'Anthropic Messages API',
    envKey: 'ANTHROPIC_API_KEY',
    endpointPreview: 'https://api.anthropic.com/v1/messages',
    redactedHeaders: Object.freeze({ 'x-api-key': '<redacted>', 'Content-Type': 'application/json' })
  })
]);

export function buildRedactedLlmProviderPreview(providerId = 'gemini') {
  const provider = SUPPORTED_LLM_PROVIDERS.find((p) => p.id === providerId);
  if (!provider) throw new Error(`Unsupported LLM provider: ${providerId}`);
  return Object.freeze({
    providerId: provider.id,
    name: provider.name,
    enabled: false,
    url: provider.endpointPreview,
    headers: provider.redactedHeaders,
    passiveDataFenceRequired: true,
    lifecycleBudgetMaxCostKrw: 150
  });
}

export function buildLiveActivationPreflightReport({
  environment = process.env,
  completedChecklist = {},
  clock = () => new Date()
} = {}) {
  const sourceRegistryCheck = validateLiveSourceRegistry();
  if (!sourceRegistryCheck.ok) {
    throw new Error(`Invalid live source registry: ${sourceRegistryCheck.errors.join(' | ')}`);
  }

  const killSwitchRaw = String(environment?.THREADSCOUT_GLOBAL_KILL_SWITCH ?? '').trim().toLowerCase();
  const killSwitchActive = killSwitchRaw === '1' || killSwitchRaw === 'true' || killSwitchRaw === 'on';

  // 1. Meta Threads Single-Root-Post Publishing (`CLAUDE.md` §5, `PUBLISHING_SPEC.md` §10)
  const publishEnvKeys = ['THREADS_APP_ID', 'THREADS_USER_ID', 'THREADS_ACCESS_TOKEN'];
  const publishMissingEnv = publishEnvKeys.filter((k) => !present(environment?.[k]));
  const publishChecklistReq = ['meta_app_review_threads_content_publish', 'token_refresh_vault_configured', 'single_post_reconciliation_verified'];
  const publishDone = new Set(completedChecklist.threads_publishing ?? []);
  const publishMissingReq = publishChecklistReq.filter((r) => !publishDone.has(r));
  const publishBlockers = [];
  if (killSwitchActive) publishBlockers.push('긴급 중단 스위치(Kill Switch)가 활성화되어 외부 게시가 정지되었습니다.');
  if (publishMissingEnv.length) publishBlockers.push(`미설정 환경변수: ${publishMissingEnv.join(', ')}`);
  if (publishMissingReq.length) publishBlockers.push(`미완료 사전 점검: ${publishMissingReq.join(', ')}`);
  publishBlockers.push('헌법(CLAUDE.md §2/§12)에 따라 실계정 외부 자동 게시는 기본 비활성화(externalPublishingEnabled: false) 상태입니다.');

  // 2. Meta Threads Keyword Discovery (`threads_keyword_search`)
  const discoveryEval = evaluateSourceReadiness(LIVE_SOURCE_IDS.THREADS_KEYWORD_SEARCH, {
    environment,
    completedRequirements: completedChecklist.threads_discovery ?? [],
    humanApprovedActivation: false
  });

  // 3. Dual Affiliate (Naver Shopping Connect manual mode + Coupang Partners Open API)
  const coupangEnvKeys = ['COUPANG_PARTNERS_ACCESS_KEY', 'COUPANG_PARTNERS_SECRET_KEY'];
  const coupangMissingEnv = coupangEnvKeys.filter((k) => !present(environment?.[k]));
  const coupangReq = ['coupang_sales_150k_krw_approved', 'hmac_rate_limit_10_per_hour_verified'];
  const coupangDone = new Set(completedChecklist.coupang_partners_api ?? []);
  const coupangMissingReq = coupangReq.filter((r) => !coupangDone.has(r));
  const coupangBlockers = [];
  if (coupangMissingEnv.length) coupangBlockers.push(`미설정 환경변수: ${coupangMissingEnv.join(', ')}`);
  if (coupangMissingReq.length) coupangBlockers.push(`미완료 사전 점검: ${coupangMissingReq.join(', ')}`);
  coupangBlockers.push('쿠팡 파트너스 실시간 API 네트워크 호출은 명시적 승인 전까지 비활성화되어 있습니다(수동 발급 링크는 즉시 사용 가능).');

  // 4. Tiered Live LLM Provider Runtime
  const configuredLlmProviders = SUPPORTED_LLM_PROVIDERS
    .filter((p) => present(environment?.[p.envKey]))
    .map((p) => p.id);
  const llmBlockers = [];
  if (configuredLlmProviders.length === 0) {
    llmBlockers.push(`미설정 환경변수: ${SUPPORTED_LLM_PROVIDERS.map((p) => p.envKey).join(' / ')} 중 최소 1개 필요`);
  }
  llmBlockers.push('실시간 유료 LLM 호출은 명시적 활성화 전까지 리플레이/결정적 로컬 모드로 격리됩니다(주기당 ₩150 상한 및 CSPRNG 펜스 활성).');

  const relevantEnvKeys = [
    ...publishEnvKeys,
    'NAVER_API_HUB_CLIENT_ID',
    'NAVER_API_HUB_CLIENT_SECRET',
    ...coupangEnvKeys,
    ...SUPPORTED_LLM_PROVIDERS.map((p) => p.envKey)
  ];
  const envSubset = Object.fromEntries(relevantEnvKeys.map((k) => [k, environment?.[k] ?? '']));

  return Object.freeze({
    evaluatedAt: clock().toISOString(),
    killSwitchActive,
    externalPublishingEnabled: false,
    anyLiveNetworkEnabled: false,
    enforcedCodeGuards: Object.freeze({
      singleRootPostNoReplyToId: true,
      singleUseApprovalHashBound: true,
      unknownTimeoutRequiresReconciliation: true,
      offsetZeroStatutoryDisclosure: true,
      passiveDataCsprngFence: true,
      lifecycleEpochBudgetCapKrw: 150,
      coupangSearchCapPerHour: COUPANG_HOURLY_LIMITS.search,
      closed9FieldShowcaseAllowlist: true
    }),
    localReadyNow: Object.freeze([
      Object.freeze({
        id: 'naver_shopping_connect_manual',
        nameKo: '네이버 쇼핑커넥트 (수동 발급 링크 + 정식 스냅샷)',
        readyLocally: true,
        summaryKo: '별도 외부 API 키 없이 스마트스토어/브랜드커넥트 수동 링크 + 2출처 교차 검증 + 오프셋 0 고지로 즉시 쇼케이스(#번호) 운영 가능'
      }),
      Object.freeze({
        id: 'coupang_partners_manual',
        nameKo: '쿠팡 파트너스 (수동 단축/정식 링크 + 정식 스냅샷)',
        readyLocally: true,
        summaryKo: '₩15만 매출 API 승인 전에도 수동 발급 링크 + 오프셋 0 고지 검증으로 즉시 쇼케이스(#번호) 및 단일 본문 복사 운영 가능'
      }),
      Object.freeze({
        id: 'public_verified_showcase',
        nameKo: '공개 검증 쇼케이스 (/showcase · SQLite WAL + 한글 FTS5)',
        readyLocally: true,
        summaryKo: '닫힌 9필드 화이트리스트 투영, 7일/12시간 만료 자동 철회, 마크다운 내보내기 로컬 검증 완료'
      })
    ]),
    liveApiGates: Object.freeze([
      Object.freeze({
        id: 'threads_single_post_publishing',
        nameKo: 'Meta Threads 단일 포스트 자동 게시 (publisher_adapter)',
        readyForLiveExecution: false,
        requiredEnv: Object.freeze(publishEnvKeys),
        missingEnv: Object.freeze(publishMissingEnv),
        missingChecklist: Object.freeze(publishMissingReq),
        blockers: Object.freeze(publishBlockers)
      }),
      Object.freeze({
        id: 'threads_keyword_discovery',
        nameKo: 'Meta Threads 키워드 탐색 API (Scout)',
        readyForLiveExecution: discoveryEval.readyForLiveExecution,
        requiredEnv: Object.freeze(['THREADS_APP_ID', 'THREADS_ACCESS_TOKEN']),
        missingEnv: Object.freeze(discoveryEval.missingEnvironment),
        missingChecklist: Object.freeze(discoveryEval.missingRequirements),
        blockers: Object.freeze(discoveryEval.blockers)
      }),
      Object.freeze({
        id: 'coupang_partners_open_api',
        nameKo: '쿠팡 파트너스 Open API 자동 조회 (시간당 <= 10회)',
        readyForLiveExecution: false,
        requiredEnv: Object.freeze(coupangEnvKeys),
        missingEnv: Object.freeze(coupangMissingEnv),
        missingChecklist: Object.freeze(coupangMissingReq),
        blockers: Object.freeze(coupangBlockers)
      }),
      Object.freeze({
        id: 'tiered_live_llm_runtime',
        nameKo: '실시간 LLM 추론 런타임 (Gemini / OpenAI / Anthropic)',
        readyForLiveExecution: false,
        configuredProviders: Object.freeze(configuredLlmProviders),
        requiredEnv: Object.freeze(SUPPORTED_LLM_PROVIDERS.map((p) => p.envKey)),
        blockers: Object.freeze(llmBlockers)
      })
    ]),
    redactedEnvironmentStatus: Object.freeze(redactEnvironment(envSubset))
  });
}

/**
 * Redacted browser-safe summary for `GET /api/preflight`: omits both secret values AND
 * raw credential env-var identifiers (`THREADS_ACCESS_TOKEN`, etc.) so `assertPublicReadModelSafe` passes.
 */
export function toPublicWebPreflightSummary(report) {
  const ENV_NAME_LABELS_KO = [
    ['THREADS_ACCESS_TOKEN', 'Threads 액세스 토큰'],
    ['THREADS_APP_ID', 'Threads 앱 ID'],
    ['THREADS_USER_ID', 'Threads 계정 ID'],
    ['NAVER_API_HUB_CLIENT_SECRET', 'NAVER API 시크릿'],
    ['NAVER_API_HUB_CLIENT_ID', 'NAVER API 클라이언트 ID'],
    ['COUPANG_WING_SECRET_KEY', '쿠팡 윙 시크릿'],
    ['COUPANG_WING_ACCESS_KEY', '쿠팡 윙 액세스 키'],
    ['COUPANG_PARTNERS_ACCESS_KEY', '쿠팡 파트너스 액세스 키'],
    ['COUPANG_PARTNERS_SECRET_KEY', '쿠팡 파트너스 시크릿 키'],
    ['GEMINI_API_KEY', 'Gemini API 키'],
    ['OPENAI_API_KEY', 'OpenAI API 키'],
    ['ANTHROPIC_API_KEY', 'Anthropic API 키'],
    ['AI_API_KEY', 'AI API 키'],
    ['THREADSCOUT_GLOBAL_KILL_SWITCH', '글로벌 킬스위치']
  ];

  const sanitizeText = (text) => {
    let out = String(text ?? '')
      .replace('Missing credential configuration:', '미설정 자격 증명:')
      .replace('Missing readiness requirements:', '미완료 준비 항목:')
      .replace('Explicit human approval for source activation is missing.', '소스 활성화에 대한 사람 최종 승인이 아직 없습니다.')
      .replace('Network execution is disabled in the source registry.', '소스 레지스트리에서 네트워크 실행이 꺼져 있습니다.');
    for (const [envVar, labelKo] of ENV_NAME_LABELS_KO) {
      out = out.replaceAll(envVar, labelKo);
    }
    // Catch-all safety strip for any uppercase *_KEY / *_SECRET / *_TOKEN identifier
    out = out.replace(/\b[A-Z][A-Z0-9_]*(?:KEY|SECRET|TOKEN|APP_ID|USER_ID|CLIENT_ID)\b/g, '외부 인증 키');
    return out;
  };

  return Object.freeze({
    evaluatedAt: report.evaluatedAt,
    killSwitchActive: report.killSwitchActive,
    externalPublishingEnabled: report.externalPublishingEnabled,
    anyLiveNetworkEnabled: report.anyLiveNetworkEnabled,
    enforcedCodeGuards: report.enforcedCodeGuards,
    localReadyNow: report.localReadyNow,
    liveApiGates: Object.freeze(
      report.liveApiGates.map((gate) =>
        Object.freeze({
          id: gate.id,
          nameKo: gate.nameKo,
          readyForLiveExecution: gate.readyForLiveExecution,
          blockers: Object.freeze((gate.blockers ?? []).map(sanitizeText))
        })
      )
    )
  });
}
