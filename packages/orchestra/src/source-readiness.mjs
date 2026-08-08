import { LIVE_SOURCE_REGISTRY, getLiveSource, validateLiveSourceRegistry } from './live-source-registry.mjs';

function present(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function evaluateSourceReadiness(sourceId, {
  environment = {},
  completedRequirements = [],
  humanApprovedActivation = false
} = {}) {
  const source = getLiveSource(sourceId);
  if (!source) throw new Error(`Unknown live source: ${sourceId}`);

  const missingEnvironment = (source.requiredEnvironment ?? []).filter((name) => !present(environment[name]));
  const completed = new Set(completedRequirements);
  const missingRequirements = (source.readinessRequirements ?? []).filter((item) => !completed.has(item));
  const blockers = [];

  if (source.disposition.startsWith('rejected_')) blockers.push('Source is rejected for this project use case.');
  if (source.disposition.startsWith('deferred_')) blockers.push('Source is deferred and not generally available for this phase.');
  if (missingEnvironment.length) blockers.push(`Missing credential configuration: ${missingEnvironment.join(', ')}.`);
  if (missingRequirements.length) blockers.push(`Missing readiness requirements: ${missingRequirements.join(', ')}.`);
  if (source.activationRequiresHumanApproval && !humanApprovedActivation) blockers.push('Explicit human approval for source activation is missing.');
  if (source.networkEnabled !== true) blockers.push('Network execution is disabled in the source registry.');

  return {
    sourceId,
    disposition: source.disposition,
    readyForLiveExecution: blockers.length === 0,
    configuredEnvironmentNames: (source.requiredEnvironment ?? []).filter((name) => present(environment[name])),
    missingEnvironment,
    missingRequirements,
    blockers,
    secrets: undefined
  };
}

export function buildLiveSourceReadinessReport(optionsBySource = {}) {
  const registry = validateLiveSourceRegistry();
  if (!registry.ok) throw new Error(`Invalid live source registry: ${registry.errors.join(' | ')}`);
  return LIVE_SOURCE_REGISTRY.map((source) => evaluateSourceReadiness(source.id, optionsBySource[source.id] ?? {}));
}

export function redactEnvironment(environment = {}) {
  return Object.fromEntries(Object.keys(environment).sort().map((name) => [name, present(environment[name]) ? 'configured' : 'missing']));
}
