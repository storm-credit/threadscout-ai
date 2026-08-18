// HTTP API.
//
// A pure request router so the whole surface can be tested without opening a
// socket. Responses carry owner-facing Korean messages and a stable machine code;
// they never carry a stack trace, a file path, or a configuration value (AT-20).

import { NotFoundError, PipelineError, ValidationError, VersionConflictError } from './service.mjs';

const JSON_HEADERS = Object.freeze({
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store'
});

function json(status, body) {
  return { status, headers: { ...JSON_HEADERS }, body: JSON.stringify(body) };
}

/**
 * Map a domain failure onto a response.
 *
 * Each code is something the UI acts on: 409 with `binding_stale` shows what moved
 * and asks for re-review; `guardian_not_passed` shows the blockers. An unmapped
 * error becomes a generic 500 so nothing internal escapes.
 */
export function toErrorResponse(error) {
  if (error instanceof ValidationError) {
    return json(400, { error: { code: error.code, message: error.message, details: error.details } });
  }
  if (error instanceof NotFoundError) {
    return json(404, { error: { code: error.code, message: error.message } });
  }
  if (error instanceof VersionConflictError) {
    return json(409, {
      error: {
        code: 'version_conflict',
        message: '다른 화면에서 이 후보가 변경되었습니다. 새로 고친 뒤 다시 확인해 주세요.',
        details: []
      }
    });
  }
  if (error instanceof PipelineError) {
    const status = ['binding_stale', 'binding_missing', 'guardian_not_passed', 'not_at_human_review'].includes(error.code)
      ? 409
      : 422;
    return json(status, {
      error: { code: error.code, message: error.message, gate: error.gate, details: error.details ?? [] }
    });
  }
  return json(500, { error: { code: 'internal_error', message: '요청을 처리하지 못했습니다.' } });
}

function commandOptions(body) {
  return {
    idempotencyKey: typeof body?.idempotencyKey === 'string' ? body.idempotencyKey.slice(0, 200) : null,
    expectedVersion: Number.isInteger(body?.expectedVersion) ? body.expectedVersion : null
  };
}

const CANDIDATE_ROUTE = /^\/api\/candidates\/([A-Za-z0-9_-]{1,64})(\/[a-z-]+)?$/;

export function createApiHandler(service) {
  /**
   * @param {{method: string, path: string, body: object|null}} request
   */
  return async function handle(request) {
    const { method, path, body } = request;

    try {
      if (method === 'GET' && path === '/api/capabilities') {
        return json(200, service.getCapabilities());
      }
      if (method === 'GET' && path === '/api/inbox') {
        return json(200, await service.getInbox());
      }
      if (method === 'POST' && path === '/api/candidates') {
        return json(201, await service.createCandidate(body, commandOptions(body)));
      }

      const match = CANDIDATE_ROUTE.exec(path);
      if (match) {
        const candidateId = match[1];
        const action = match[2] ?? '';
        const options = commandOptions(body);

        if (method === 'GET' && action === '') {
          return json(200, await service.getCandidateDetail(candidateId));
        }
        if (method === 'GET' && action === '/lineage') {
          return json(200, await service.getLineage(candidateId));
        }
        if (method === 'POST') {
          switch (action) {
            case '/evidence':
              return json(200, await service.updateEvidenceInput(candidateId, body, options));
            case '/verify':
              return json(200, await service.verifyCandidate(candidateId, options));
            case '/strategies':
              return json(200, await service.strategizeCandidate(candidateId, options));
            case '/drafts':
              return json(200, await service.draftCandidate(candidateId, options));
            case '/review':
              return json(200, await service.reviewCandidate(candidateId, options));
            case '/draft-edit':
              return json(200, await service.editDraftText(candidateId, body, options));
            case '/select-draft':
              return json(200, await service.selectDraftForApproval(candidateId, body, options));
            case '/decision':
              return json(200, await service.submitDecision(candidateId, body, options));
            default:
              break;
          }
        }
      }

      return json(404, { error: { code: 'not_found', message: '요청한 경로가 없습니다.' } });
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}
