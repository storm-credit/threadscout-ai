import { access } from 'node:fs/promises';

const requiredFiles = [
  'README.md',
  'CLAUDE.md',
  'docs/PROJECT_BRIEF.md',
  'docs/USER_INTERVIEW.md',
  'docs/SUCCESS_CRITERIA.md',
  'docs/DESIGN_OPTIONS.md',
  'docs/BLIND_SPOTS.md',
  'docs/PRE_IMPLEMENTATION_TRAPS.md',
  'docs/PRODUCT_SCOUT_SPEC.md',
  'docs/PROMPTING_PLAYBOOK.md',
  'docs/ARCHITECTURE.md',
  'docs/AGENT_ORCHESTRA.md',
  'docs/AGENT_RESEARCH.md',
  'docs/PHASE2_PLAN.md',
  'docs/PHASE2B_PLAN.md',
  'docs/PHASE2C_PLAN.md',
  'docs/PHASE2D_PLAN.md',
  'docs/PHASE2E_PLAN.md',
  'docs/PHASE2F_PLAN.md',
  'docs/SINBAK_ITEM_STRATEGY.md',
  'docs/RUNTIME_OPTIONS.md',
  'docs/STORAGE_OPTIONS.md',
  'docs/RESEARCH_OPTIONS.md',
  'docs/LIVE_SOURCE_OPTIONS.md',
  'docs/LIVE_SOURCE_REVIEW.md',
  'docs/REFERENCE_PROJECTS.md',
  'docs/DECISION_LOG.md',
  'docs/IMPLEMENTATION_STATUS.md'
];

const missing = [];
for (const file of requiredFiles) {
  try {
    await access(new URL(`../${file}`, import.meta.url));
  } catch {
    missing.push(file);
  }
}

if (missing.length > 0) {
  console.error(`Missing required project documents:\n- ${missing.join('\n- ')}`);
  process.exit(1);
}

console.log(`Verified ${requiredFiles.length} required project documents.`);
