import { AGENT_IDS } from './agent-registry.mjs';

const string = (extra = {}) => ({ type: 'string', minLength: 1, ...extra });
const array = (items, extra = {}) => ({ type: 'array', items, ...extra });
const object = (properties, required = Object.keys(properties)) => ({ type: 'object', properties, required });

export const AGENT_OUTPUT_SCHEMAS = Object.freeze({
  [AGENT_IDS.ORCHESTRATOR]: object({
    type: string({ enum: ['run_plan'] }),
    runId: string(),
    createdAt: string(),
    objective: string(),
    nicheId: string({ enum: ['sinbak-items'] }),
    constraints: array(string(), { minItems: 1 }),
    successCriteria: array(string(), { minItems: 1 }),
    stopConditions: array(string(), { minItems: 1 })
  }),
  [AGENT_IDS.SCOUT]: object({
    type: string({ enum: ['candidate_set'] }),
    runId: string(),
    createdAt: string(),
    nicheId: string({ enum: ['sinbak-items'] }),
    candidates: array(object({
      id: string(),
      name: string(),
      reason: string(),
      score: { type: 'number', minimum: 0, maximum: 100 },
      status: string({ enum: ['recommended', 'review', 'reject'] }),
      sourceRefs: array(string(), { minItems: 2 })
    }), { minItems: 1 })
  }),
  [AGENT_IDS.VERIFIER]: object({
    type: string({ enum: ['evidence_packet'] }),
    runId: string(),
    createdAt: string(),
    canonicalProduct: object({ name: string(), brand: string(), model: string(), variant: string() }),
    exactMatchStatus: string({ enum: ['exact', 'likely', 'substitute', 'unresolved'] }),
    sources: array(object({ id: string(), type: string(), observedAt: string() }), { minItems: 1 }),
    mediaRights: string(),
    personalUse: string({ enum: ['confirmed', 'not_confirmed'] }),
    claimEvidence: array(object({ claimId: string(), text: string(), status: string(), sourceIds: array(string(), { minItems: 1 }) })),
    commerceSnapshot: object({
      observedAt: string(),
      priceStatus: string({ enum: ['observed', 'unavailable', 'not_applicable'] }),
      stockStatus: string({ enum: ['in_stock', 'out_of_stock', 'unknown', 'not_applicable'] }),
      sellerStatus: string({ enum: ['verified', 'unverified', 'unavailable', 'not_applicable'] }),
      variantStatus: string({ enum: ['verified', 'unresolved', 'not_applicable'] })
    }),
    blockers: array(string())
  }),
  [AGENT_IDS.STRATEGIST]: object({
    type: string({ enum: ['content_brief'] }),
    runId: string(),
    createdAt: string(),
    audience: string(),
    coreValue: string(),
    cta: string(),
    angles: array(object({ id: string(), goal: string(), hook: string(), proof: string(), limitation: string() }), { minItems: 4, maxItems: 4 })
  }),
  [AGENT_IDS.WRITER]: object({
    type: string({ enum: ['draft_bundle'] }),
    runId: string(),
    createdAt: string(),
    drafts: array(object({
      angleId: string(),
      text: string(),
      claimIds: array(string()),
      disclosure: string()
    }), { minItems: 4, maxItems: 4 })
  }),
  [AGENT_IDS.GUARDIAN]: object({
    type: string({ enum: ['review_report'] }),
    runId: string(),
    createdAt: string(),
    decision: string({ enum: ['pass', 'revise', 'block'] }),
    blockers: array(string()),
    warnings: array(string()),
    checks: array(object({ id: string(), status: string({ enum: ['pass', 'warn', 'block'] }), detail: string() }), { minItems: 1 })
  })
});

function validateNode(schema, value, path, errors) {
  if (schema.type === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      errors.push(`${path} must be an object.`);
      return;
    }
    for (const key of schema.required ?? []) {
      if (!(key in value)) errors.push(`${path}.${key} is required.`);
    }
    for (const [key, child] of Object.entries(schema.properties ?? {})) {
      if (key in value) validateNode(child, value[key], `${path}.${key}`, errors);
    }
    return;
  }

  if (schema.type === 'array') {
    if (!Array.isArray(value)) {
      errors.push(`${path} must be an array.`);
      return;
    }
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push(`${path} has too few items.`);
    if (schema.maxItems !== undefined && value.length > schema.maxItems) errors.push(`${path} has too many items.`);
    value.forEach((item, index) => validateNode(schema.items, item, `${path}[${index}]`, errors));
    return;
  }

  if (schema.type === 'string') {
    if (typeof value !== 'string') errors.push(`${path} must be a string.`);
    else {
      if (schema.minLength && value.length < schema.minLength) errors.push(`${path} must not be empty.`);
      if (schema.enum && !schema.enum.includes(value)) errors.push(`${path} must be one of ${schema.enum.join(', ')}.`);
    }
    return;
  }

  if (schema.type === 'number') {
    if (typeof value !== 'number' || !Number.isFinite(value)) errors.push(`${path} must be a finite number.`);
    else {
      if (schema.minimum !== undefined && value < schema.minimum) errors.push(`${path} is below minimum.`);
      if (schema.maximum !== undefined && value > schema.maximum) errors.push(`${path} exceeds maximum.`);
    }
  }
}

export function getAgentOutputSchema(agentId) {
  return AGENT_OUTPUT_SCHEMAS[agentId] ?? null;
}

export function validateArtifactSchema(agentId, artifact) {
  const schema = getAgentOutputSchema(agentId);
  if (!schema) return { ok: false, errors: [`Unknown agent schema: ${agentId}`] };
  const errors = [];
  validateNode(schema, artifact, '$', errors);

  if (agentId === AGENT_IDS.STRATEGIST && Array.isArray(artifact?.angles)) {
    if (new Set(artifact.angles.map((angle) => angle.id)).size !== artifact.angles.length) errors.push('$.angles ids must be unique.');
  }
  if (agentId === AGENT_IDS.WRITER && Array.isArray(artifact?.drafts)) {
    if (new Set(artifact.drafts.map((draft) => draft.angleId)).size !== artifact.drafts.length) errors.push('$.drafts angleIds must be unique.');
  }

  return { ok: errors.length === 0, errors };
}
