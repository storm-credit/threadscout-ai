// Constitutional invariants for the agent roster.
//
// CLAUDE.md section 7 and MASTER_SPEC "Design authority and change control" list
// things configuration alone may not weaken. These tests exist so that weakening one
// of them fails loudly rather than passing review as a refactor.

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  AGENT_IDS,
  AGENT_REGISTRY,
  DETERMINISTIC_SERVICES,
  FIXED_AGENT_COUNT,
  validateAgentRegistry
} from '../packages/orchestra/src/agent-registry.mjs';
import { AGENT_SYSTEM_PROMPTS, validatePromptSet } from '../packages/orchestra/src/prompts.mjs';
import { AGENT_OUTPUT_SCHEMAS } from '../packages/orchestra/src/schemas.mjs';
import { buildVersionManifest } from '../packages/orchestra/src/versioning.mjs';
import { ARTIFACT_OWNER, ARTIFACT_TYPES, RUN_STAGES, SLICE_REACHABLE_STAGES, canTransition } from '../packages/core/src/index.mjs';
import { createToolBroker } from '../packages/orchestra/src/tool-broker.mjs';

test('the orchestra is exactly six agents with one controller', () => {
  assert.equal(FIXED_AGENT_COUNT, 6);
  assert.equal(AGENT_REGISTRY.length, 6);
  assert.equal(validateAgentRegistry().ok, true);
  assert.equal(AGENT_REGISTRY.filter((agent) => agent.kind === 'controller').length, 1);
});

test('a seventh agent fails registry validation', () => {
  const withSeventh = [...AGENT_REGISTRY, { ...AGENT_REGISTRY[1], id: 'researcher' }];
  const result = validateAgentRegistry(withSeventh);
  assert.equal(result.ok, false);
  assert.match(result.errors.join(' '), /exactly 6 agents/);
});

test('there is no price agent, and the Verifier owns volatile commerce evidence', () => {
  assert.equal(AGENT_REGISTRY.some((agent) => /price/i.test(agent.id)), false);
  const verifier = AGENT_REGISTRY.find((agent) => agent.id === AGENT_IDS.VERIFIER);
  assert.ok(verifier.owns.includes('price_stock_seller_snapshot'));

  const renamed = AGENT_REGISTRY.map((agent) =>
    agent.id === AGENT_IDS.SCOUT ? { ...agent, id: 'price_agent' } : agent);
  assert.equal(validateAgentRegistry(renamed).ok, false);
});

test('only the Orchestrator delegates, and no agent may publish externally', () => {
  for (const agent of AGENT_REGISTRY) {
    if (agent.id === AGENT_IDS.ORCHESTRATOR) continue;
    assert.deepEqual(agent.handoffTo, [AGENT_IDS.ORCHESTRATOR],
      agent.id + ' must return control to the orchestrator');
  }
  for (const agent of AGENT_REGISTRY) {
    assert.equal(agent.allowedTools.some((tool) => /publish|purchase|payment/i.test(tool)), false);
    assert.ok(agent.forbiddenActions.includes('publish_external'));
  }
});

test('publishing, scheduling, metrics, and audit stay deterministic services', () => {
  const ids = DETERMINISTIC_SERVICES.map((service) => service.id);
  for (const required of ['scheduler', 'publisher_adapter', 'metrics_collector', 'audit_log']) {
    assert.ok(ids.includes(required), required + ' must remain a deterministic service');
  }
});

test('each artifact type has exactly one owning agent', () => {
  const owners = Object.values(ARTIFACT_OWNER);
  assert.equal(new Set(owners).size, owners.length, 'no two agents may own the same artifact');
  assert.equal(ARTIFACT_OWNER[ARTIFACT_TYPES.EVIDENCE_PACKET], AGENT_IDS.VERIFIER);
  assert.equal(ARTIFACT_OWNER[ARTIFACT_TYPES.REVIEW_REPORT], AGENT_IDS.GUARDIAN);
});

test('every agent has one prompt and one declared output schema', () => {
  assert.equal(validatePromptSet().ok, true);
  for (const agent of AGENT_REGISTRY) {
    assert.ok(AGENT_SYSTEM_PROMPTS[agent.id], agent.id + ' needs a prompt');
    assert.ok(AGENT_OUTPUT_SCHEMAS[agent.id], agent.id + ' needs an output schema');
  }
  const manifest = buildVersionManifest();
  assert.equal(Object.keys(manifest.promptHashes).length, 6);
  assert.equal(Object.keys(manifest.schemaHashes).length, 6);
});

test('the tool broker enforces each allowlist and blocks external actions', async () => {
  const broker = createToolBroker({ handlers: { public_search: async () => ({ ok: true }) } });

  await assert.rejects(
    () => broker.invoke({ agentId: AGENT_IDS.WRITER, toolName: 'public_search' }),
    /not allowed/,
    'the Writer has no research tool'
  );
  await assert.rejects(
    () => broker.invoke({ agentId: AGENT_IDS.ORCHESTRATOR, toolName: 'publish_external' }),
    /Forbidden external-action tool/,
    'no agent may publish'
  );
  await assert.rejects(
    () => broker.invoke({ agentId: AGENT_IDS.VERIFIER, toolName: 'purchase_item' }),
    /Forbidden external-action tool/
  );

  // The Scout is allowed this tool, so the allowlist is proven to admit as well as refuse.
  assert.deepEqual(await broker.invoke({ agentId: AGENT_IDS.SCOUT, toolName: 'public_search' }), { ok: true });
  assert.equal(broker.getReceipts().filter((item) => item.status === 'success').length, 1);
});

test('human approval sits between Guardian review and any scheduling', () => {
  assert.equal(canTransition(RUN_STAGES.GUARDIAN_REVIEW, RUN_STAGES.HUMAN_REVIEW), true);
  assert.equal(canTransition(RUN_STAGES.GUARDIAN_REVIEW, RUN_STAGES.SCHEDULED_LOCAL), false);
  assert.equal(canTransition(RUN_STAGES.DRAFTING, RUN_STAGES.HUMAN_REVIEW), false);
  assert.equal(canTransition(RUN_STAGES.HUMAN_REVIEW, RUN_STAGES.SCHEDULED_LOCAL), true);
});

test('scheduling stays out of reach in this slice', () => {
  assert.equal(SLICE_REACHABLE_STAGES.includes(RUN_STAGES.SCHEDULED_LOCAL), false,
    'a half-built path into scheduling would be worse than no path');
  assert.equal(SLICE_REACHABLE_STAGES.includes(RUN_STAGES.DISCOVERY), false,
    'Scout discovery is skipped in this slice, not partially wired');
});
