export const FIXTURE_RESEARCH_POLICY = Object.freeze({
  policyVersion: 1,
  id: 'fixture-read-only-v1',
  networkAllowed: false,
  mutationAllowed: false,
  allowedSchemes: ['fixture:'],
  allowedSourceTypes: ['thread_observation', 'product_listing', 'creator_owned_media'],
  maxResultsPerQuery: 20,
  maxExcerptChars: 1_200,
  retentionClass: 'fixture_ephemeral',
  personalDataAllowed: false,
  termsReviewStatus: 'not_applicable_fixture',
  robotsStatus: 'not_applicable_fixture'
});

export function validateResearchPolicy(policy) {
  const errors = [];
  if (!policy || typeof policy !== 'object') return { ok: false, errors: ['Research policy must be an object.'] };
  if (policy.networkAllowed !== false) errors.push('Phase 2E fixture policy must keep network access disabled.');
  if (policy.mutationAllowed !== false) errors.push('Research adapter must be read-only.');
  if (!Array.isArray(policy.allowedSchemes) || policy.allowedSchemes.some((scheme) => scheme !== 'fixture:')) {
    errors.push('Only fixture: sources are allowed in Phase 2E.');
  }
  if (!Number.isInteger(policy.maxResultsPerQuery) || policy.maxResultsPerQuery < 1 || policy.maxResultsPerQuery > 100) {
    errors.push('maxResultsPerQuery must be between 1 and 100.');
  }
  if (!Number.isInteger(policy.maxExcerptChars) || policy.maxExcerptChars < 100) errors.push('maxExcerptChars is invalid.');
  if (policy.personalDataAllowed !== false) errors.push('Fixture research cannot allow personal data.');
  return { ok: errors.length === 0, errors };
}
