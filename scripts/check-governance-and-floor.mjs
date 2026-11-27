// Executable Design Governance, Bidirectional Zero-Orphan Traceability (`DESIGN_CI_SPEC.md` §§5–8, `AT-39`),
// Root Payload Cap & Cryptographic `agent-vs-skill.md` Extract Hash (`CLAUDE.md` §21: `<= 200` lines & `<= 25 KB`, `76e1e6d8bbd45f97`),
// and Fail-Closed Calibrated Diff-Scoped MAOS `0.2.1` `Floor Guard` (`rules/verification-placement.md`).

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AGENT_REGISTRY, validateAgentRegistry } from '../packages/orchestra/src/agent-registry.mjs';

export const ROOT_MAX_LINES = 200;
export const ROOT_MAX_BYTES = 25 * 1024;
export const EXPECTED_BOUNDARY_SHA_PREFIX = '76e1e6d8bbd45f97';
export const MAX_LOCAL_ACTION_SPACE_TOOLS = 5;

// Built dynamically so this checker file itself contains zero literal suppression/skip tokens
const SUPPRESSION_PATTERNS = [
  new RegExp(`eslint-${'disable'}`),
  new RegExp(`@ts-${'ignore'}`),
  new RegExp(`@ts-${'expect-error'}`),
  new RegExp(`@ts-${'nocheck'}`),
  new RegExp(`biome-${'ignore'}`)
];

const TEST_SKIP_PATTERNS = [
  new RegExp(`\\b(?:test|it|describe|t)\\.${'skip'}\\s*\\(`),
  new RegExp(`\\b(?:test|it|describe)\\.${'todo'}\\s*\\(`),
  new RegExp(`\\{\\s*${'skip'}\\s*:\\s*true\\s*\\}`),
  new RegExp(`\\{\\s*${'todo'}\\s*:\\s*true\\s*\\}`)
];

const TEST_DEFINITION_PATTERN = /^\s*(?:test|it)\s*\(/;

const HIGH_CONFIDENCE_SECRET_PATTERNS = [
  /AIzaSy[0-9A-Za-z_-]{33}/,
  /sk-(?:proj|live)-[0-9A-Za-z_-]{24,}/,
  /sk-ant-api03-[0-9A-Za-z_-]{24,}/,
  /gh[pousr]_[0-9A-Za-z]{30,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/
];

const FORBIDDEN_TRACKED_PATH_PATTERNS = [
  /(?:^|\/)\.env(?:\..+)?$/i,
  /(?:^|\/)\.threadscout-data(?:\/|$)/i
];

const ALLOWED_ENV_EXAMPLES = new Set(['.env.example', '.env.sample', '.env.template']);

const VALID_MEASURED_DIFF_STATUSES = new Set(['MEASURED', 'MEASURED_SHALLOW_HEAD']);

/**
 * Pure diff-scoped `Floor Guard` evaluator (fail-closed unless `diffStatus` is in `VALID_MEASURED_DIFF_STATUSES`).
 */
export function evaluateFloorGuard({
  diffStatus = 'MEASURED',
  addedLinesByFile = {},
  removedLinesByFile = {},
  deletedPaths = [],
  trackedPaths = [],
  gitleaksResult = { status: 'NOT_MEASURED', detail: 'gitleaks binary not installed locally' }
} = {}) {
  const errors = [];

  if (!VALID_MEASURED_DIFF_STATUSES.has(diffStatus)) {
    errors.push(`Floor Guard git diff status is ${diffStatus}; degraded or unmeasured diff fails closed (CLAUDE.md §21).`);
  }

  for (const relPath of trackedPaths) {
    const normalized = String(relPath).replaceAll('\\', '/');
    const base = path.posix.basename(normalized);
    if (ALLOWED_ENV_EXAMPLES.has(base)) continue;
    if (FORBIDDEN_TRACKED_PATH_PATTERNS.some((rx) => rx.test(normalized))) {
      errors.push(`Forbidden secret or runtime store file tracked in Git: ${normalized}`);
    }
  }

  const deletedTestFiles = (deletedPaths ?? [])
    .map((p) => String(p).replaceAll('\\', '/'))
    .filter((p) => /(?:^|\/)tests\/.+\.test\.(?:m?js|cjs|ts)$/.test(p));
  if (deletedTestFiles.length > 0) {
    errors.push(`Test file deletion blocked by Floor Guard: ${deletedTestFiles.join(', ')}`);
  }

  let addedSuppressions = 0;
  let removedSuppressions = 0;
  let addedTestSkips = 0;
  let removedTestSkips = 0;
  let addedTestCases = 0;
  let removedTestCases = 0;

  for (const [file, lines] of Object.entries(addedLinesByFile)) {
    const normFile = String(file).replaceAll('\\', '/');
    const isCodeOrTest = /\.(?:m?js|cjs|ts|tsx)$/.test(normFile);
    const isTestFile = /(?:^|\/)tests\/.+\.test\.(?:m?js|cjs|ts)$/.test(normFile);
    for (const line of lines ?? []) {
      if (HIGH_CONFIDENCE_SECRET_PATTERNS.some((rx) => rx.test(line))) {
        errors.push(`High-confidence secret literal detected in diff (${normFile}).`);
      }
      if (!isCodeOrTest) continue;
      if (SUPPRESSION_PATTERNS.some((rx) => rx.test(line))) addedSuppressions += 1;
      if (TEST_SKIP_PATTERNS.some((rx) => rx.test(line))) addedTestSkips += 1;
      if (isTestFile && TEST_DEFINITION_PATTERN.test(line)) addedTestCases += 1;
    }
  }

  for (const [file, lines] of Object.entries(removedLinesByFile)) {
    const normFile = String(file).replaceAll('\\', '/');
    const isCodeOrTest = /\.(?:m?js|cjs|ts|tsx)$/.test(normFile);
    const isTestFile = /(?:^|\/)tests\/.+\.test\.(?:m?js|cjs|ts)$/.test(normFile);
    if (!isCodeOrTest) continue;
    for (const line of lines ?? []) {
      if (SUPPRESSION_PATTERNS.some((rx) => rx.test(line))) removedSuppressions += 1;
      if (TEST_SKIP_PATTERNS.some((rx) => rx.test(line))) removedTestSkips += 1;
      if (isTestFile && TEST_DEFINITION_PATTERN.test(line)) removedTestCases += 1;
    }
  }

  if (addedSuppressions > removedSuppressions) {
    errors.push(`Net-new inline linter/type suppressions blocked by Floor Guard (+${addedSuppressions} vs -${removedSuppressions}).`);
  }
  if (addedTestSkips > removedTestSkips) {
    errors.push(`Net-new skipped/todo tests blocked by Floor Guard (+${addedTestSkips} vs -${removedTestSkips}).`);
  }
  if (removedTestCases > addedTestCases) {
    errors.push(`Net test-case deletion blocked by Floor Guard (+${addedTestCases} vs -${removedTestCases}).`);
  }
  if (gitleaksResult?.status === 'FAIL') {
    errors.push(`gitleaks --redact reported secret findings: ${gitleaksResult.detail || 'redacted'}`);
  }

  return Object.freeze({
    ok: errors.length === 0,
    diffStatus,
    gitleaksStatus: gitleaksResult?.status ?? 'NOT_MEASURED',
    counts: Object.freeze({
      addedSuppressions,
      removedSuppressions,
      addedTestSkips,
      removedTestSkips,
      addedTestCases,
      removedTestCases
    }),
    errors: Object.freeze(errors)
  });
}

function extractAgentVsSkillBlockShaPrefix(claudeLfText = '') {
  const marker = `(first 16 hex chars of sha256: \`${EXPECTED_BOUNDARY_SHA_PREFIX}\`):`;
  const idx = claudeLfText.indexOf(marker);
  if (idx < 0) return { found: false, actualPrefix: null };

  const afterLines = claudeLfText.slice(idx + marker.length).split('\n');
  // Drop leading empty line(s) right after the colon
  let start = 0;
  while (start < afterLines.length && afterLines[start].trim() === '') start += 1;

  const blockLines = [];
  for (let i = start; i < afterLines.length; i += 1) {
    const line = afterLines[i];
    if (line.startsWith('- ') || line.startsWith('## ') || line.startsWith('**')) break;
    blockLines.push(line.replace(/^  /, ''));
  }
  while (blockLines.length > 0 && blockLines[blockLines.length - 1].trim() === '') {
    blockLines.pop();
  }
  if (blockLines.length === 0) return { found: false, actualPrefix: null };

  const normalizedExtract = blockLines.join('\n');
  const actualPrefix = createHash('sha256').update(normalizedExtract, 'utf8').digest('hex').slice(0, 16);
  return { found: true, actualPrefix };
}

/**
 * Pure root instruction payload & cryptographic `agent-vs-skill.md` extract evaluator (`CLAUDE.md` §21).
 */
export function evaluateRootPayloadGovernance({ rootFiles = [] } = {}) {
  const errors = [];
  let totalLines = 0;
  let totalBytes = 0;
  let claudeContent = null;
  let extractShaPrefix = null;

  for (const file of rootFiles) {
    const text = String(file.content ?? '');
    const normalizedLf = text.replace(/\r\n/g, '\n');
    const lineCount = normalizedLf.endsWith('\n')
      ? normalizedLf.slice(0, -1).split('\n').length
      : normalizedLf.split('\n').length;
    totalLines += lineCount;
    totalBytes += Buffer.byteLength(normalizedLf, 'utf8');
    if (file.name === 'CLAUDE.md') claudeContent = normalizedLf;
  }

  if (totalLines > ROOT_MAX_LINES) {
    errors.push(`Always-on root instruction payload exceeds ${ROOT_MAX_LINES} lines (${totalLines} lines).`);
  }
  if (totalBytes > ROOT_MAX_BYTES) {
    errors.push(`Always-on root instruction payload exceeds ${ROOT_MAX_BYTES} bytes (${totalBytes} bytes).`);
  }
  if (!claudeContent) {
    errors.push('CLAUDE.md is missing from root payload evaluation.');
  } else {
    const hashCheck = extractAgentVsSkillBlockShaPrefix(claudeContent);
    extractShaPrefix = hashCheck.actualPrefix;
    if (!hashCheck.found) {
      errors.push(`CLAUDE.md §21 is missing canonical agent-vs-skill extract block (${EXPECTED_BOUNDARY_SHA_PREFIX}).`);
    } else if (hashCheck.actualPrefix !== EXPECTED_BOUNDARY_SHA_PREFIX) {
      errors.push(
        `CLAUDE.md §21 agent-vs-skill extract sha256 mismatch: expected ${EXPECTED_BOUNDARY_SHA_PREFIX}, got ${hashCheck.actualPrefix}.`
      );
    }
  }

  return Object.freeze({
    ok: errors.length === 0,
    totalLines,
    totalBytes,
    extractShaPrefix,
    errors: Object.freeze(errors)
  });
}

/**
 * Pure 6-agent roster & `<= 5` local action-space evaluator (`DESIGN_CI_SPEC.md` §8 & `CLAUDE.md` §§7, 21).
 */
export function evaluateAgentActionSpace({
  registry = AGENT_REGISTRY,
  validation = validateAgentRegistry()
} = {}) {
  const errors = [];
  if (!validation?.ok) {
    errors.push(...(validation?.errors ?? ['Agent registry validation failed.']));
  }
  if (!Array.isArray(registry) || registry.length !== 6) {
    errors.push(`Expected exactly 6 agents, got ${Array.isArray(registry) ? registry.length : 0}.`);
  }
  for (const agent of registry ?? []) {
    if (String(agent?.id ?? '').toLowerCase().includes('price')) {
      errors.push(`Forbidden dedicated price agent detected: ${agent.id}.`);
    }
    const toolCount = agent?.allowedTools?.length ?? 0;
    if (toolCount > MAX_LOCAL_ACTION_SPACE_TOOLS) {
      errors.push(`Agent '${agent.id}' exceeds <= ${MAX_LOCAL_ACTION_SPACE_TOOLS} local action-space tool bound (${toolCount}).`);
    }
  }
  return Object.freeze({
    ok: errors.length === 0,
    agentCount: Array.isArray(registry) ? registry.length : 0,
    errors: Object.freeze(errors)
  });
}

/**
 * Pure bidirectional zero-orphan traceability evaluator (`DESIGN_CI_SPEC.md` §§5–6, `AT-39`).
 */
export function evaluateSpecTraceability({
  productRequirementsMd = '',
  traceabilityMatrixMd = '',
  b0MatrixMd = '',
  blindSpotSweepMd = '',
  acceptanceTestsMd = '',
  existingSpecNames = new Set()
} = {}) {
  const errors = [];

  const definedPrNfr = new Set([...productRequirementsMd.matchAll(/^###\s+((?:PR|NFR)-\d{2})\b/gm)].map((m) => m[1]));
  const mappedPrNfr = new Set([...traceabilityMatrixMd.matchAll(/^\|\s*((?:PR|NFR)-\d{2})\b/gm)].map((m) => m[1]));
  for (const reqId of definedPrNfr) {
    if (!mappedPrNfr.has(reqId)) {
      errors.push(`Requirement ${reqId} in PRODUCT_REQUIREMENTS.md is missing from TRACEABILITY_MATRIX.md.`);
    }
  }
  for (const reqId of mappedPrNfr) {
    if (!definedPrNfr.has(reqId)) {
      errors.push(`Dangling requirement ${reqId} in TRACEABILITY_MATRIX.md is missing from PRODUCT_REQUIREMENTS.md.`);
    }
  }

  const definedB0 = new Set([...blindSpotSweepMd.matchAll(/^\|\s*(BS-\d{2})\s*\|\s*B0\s*\|/gm)].map((m) => m[1]));
  const mappedB0 = new Set([...b0MatrixMd.matchAll(/^\|\s*(BS-\d{2})\s*\|/gm)].map((m) => m[1]));
  for (const bsId of definedB0) {
    if (!mappedB0.has(bsId)) {
      errors.push(`B0 blind spot ${bsId} in FINAL_BLIND_SPOT_SWEEP.md is unmapped in B0_TRACEABILITY_MATRIX.md (AT-39).`);
    }
  }
  for (const bsId of mappedB0) {
    if (!definedB0.has(bsId)) {
      errors.push(`Row ${bsId} in B0_TRACEABILITY_MATRIX.md is not marked B0 in FINAL_BLIND_SPOT_SWEEP.md (AT-39).`);
    }
  }

  const definedAts = new Set([...acceptanceTestsMd.matchAll(/^##\s+(AT-\d{2})\b/gm)].map((m) => m[1]));
  const referencedAts = new Set([
    ...[...traceabilityMatrixMd.matchAll(/\b(AT-\d{2})\b/g)].map((m) => m[1]),
    ...[...b0MatrixMd.matchAll(/\b(AT-\d{2})\b/g)].map((m) => m[1])
  ]);

  for (const refAt of referencedAts) {
    if (!definedAts.has(refAt)) {
      errors.push(`Referenced acceptance test ${refAt} does not exist in ACCEPTANCE_TESTS.md.`);
    }
  }
  for (const defAt of definedAts) {
    if (!referencedAts.has(defAt)) {
      errors.push(`Orphaned acceptance test ${defAt} in ACCEPTANCE_TESTS.md is not referenced by TRACEABILITY_MATRIX.md or B0_TRACEABILITY_MATRIX.md.`);
    }
  }

  const specTokenPattern = /\b([A-Z][A-Z0-9_]{3,}|CLAUDE\.md|README)\b/g;
  const rows = [
    ...traceabilityMatrixMd.split('\n').filter((l) => /^\|\s*(?:PR|NFR)-\d{2}\b/.test(l)),
    ...b0MatrixMd.split('\n').filter((l) => /^\|\s*BS-\d{2}\b/.test(l))
  ];
  for (const row of rows) {
    const cells = row.split('|').map((c) => c.trim());
    const rowId = cells[1] || 'unknown-row';
    const isBsRow = /^\|\s*BS-\d{2}\b/.test(row);
    const authorityCell = isBsRow ? cells[3] : cells[2];
    const authorityMatches = [...String(authorityCell ?? '').matchAll(specTokenPattern)];
    if (authorityMatches.length === 0) {
      errors.push(`Traceability row '${rowId}' has an empty or unresolved Design authority cell.`);
    }
    for (const m of authorityMatches) {
      const token = m[1];
      if (!existingSpecNames.has(token)) {
        errors.push(`Referenced design authority '${token}' does not resolve to an existing spec/root document.`);
      }
    }
  }

  return Object.freeze({
    ok: errors.length === 0,
    counts: Object.freeze({
      definedPrNfr: definedPrNfr.size,
      mappedPrNfr: mappedPrNfr.size,
      definedB0: definedB0.size,
      definedAts: definedAts.size
    }),
    errors: Object.freeze(errors)
  });
}

export function parseGitUnifiedDiff(diffText = '') {
  const addedLinesByFile = {};
  const removedLinesByFile = {};
  const deletedPaths = [];
  let currentFile = null;
  let pendingOldFile = null;

  for (const rawLine of String(diffText).split('\n')) {
    const line = rawLine.replace(/\r$/, '');
    if (line.startsWith('--- a/')) {
      pendingOldFile = line.slice(6).trim();
      continue;
    }
    if (line.startsWith('+++ ')) {
      const target = line.slice(4).trim();
      if (target === '/dev/null') {
        if (pendingOldFile) deletedPaths.push(pendingOldFile);
        currentFile = pendingOldFile;
      } else if (target.startsWith('b/')) {
        currentFile = target.slice(2).trim();
      } else {
        currentFile = null;
      }
      continue;
    }
    if (!currentFile) continue;
    if (line.startsWith('+') && !line.startsWith('+++')) {
      (addedLinesByFile[currentFile] ??= []).push(line.slice(1));
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      (removedLinesByFile[currentFile] ??= []).push(line.slice(1));
    }
  }

  return { addedLinesByFile, removedLinesByFile, deletedPaths };
}

function tryRevParse(repoRoot, rev) {
  try {
    return execFileSync('git', ['rev-parse', '--verify', rev], { cwd: repoRoot, encoding: 'utf8', stdio: 'pipe' }).trim();
  } catch {
    return null;
  }
}

function collectMeasuredGitDiff(repoRoot) {
  try {
    const trackedPaths = execFileSync('git', ['ls-files'], { cwd: repoRoot, encoding: 'utf8', stdio: 'pipe' })
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const headSha = tryRevParse(repoRoot, 'HEAD');
    if (!headSha) {
      return { diffStatus: 'NOT_MEASURED', trackedPaths, diffText: '' };
    }

    let baseDiff = null;
    let diffStatus = 'MEASURED';
    const originMainSha = tryRevParse(repoRoot, 'origin/main');
    const localMainSha = tryRevParse(repoRoot, 'main');
    const parentSha = tryRevParse(repoRoot, 'HEAD~1');

    if (originMainSha && originMainSha !== headSha) {
      try {
        baseDiff = execFileSync('git', ['diff', '--no-renames', 'origin/main...HEAD'], {
          cwd: repoRoot,
          encoding: 'utf8',
          stdio: 'pipe'
        });
      } catch {
        baseDiff = null;
      }
    }
    if (baseDiff === null && localMainSha && localMainSha !== headSha) {
      try {
        baseDiff = execFileSync('git', ['diff', '--no-renames', 'main...HEAD'], {
          cwd: repoRoot,
          encoding: 'utf8',
          stdio: 'pipe'
        });
      } catch {
        baseDiff = null;
      }
    }
    if (baseDiff === null && parentSha) {
      try {
        baseDiff = execFileSync('git', ['diff', '--no-renames', 'HEAD~1..HEAD'], {
          cwd: repoRoot,
          encoding: 'utf8',
          stdio: 'pipe'
        });
      } catch {
        baseDiff = null;
      }
    }
    if (baseDiff === null) {
      // Shallow clone (`actions/checkout@v4` `fetch-depth: 1`) where parent commit is grafted:
      // `--root` inspects `HEAD` in full for suppressions, skips/todos, and secrets; deletion diffing requires >=2 commits.
      diffStatus = 'MEASURED_SHALLOW_HEAD';
      baseDiff = execFileSync('git', ['show', '--root', '--first-parent', '--no-renames', '--format=', 'HEAD'], {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: 'pipe',
        maxBuffer: 32 * 1024 * 1024
      });
    }

    const workingDiff = execFileSync('git', ['diff', '--no-renames', 'HEAD'], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: 'pipe',
      maxBuffer: 16 * 1024 * 1024
    });
    return {
      diffStatus,
      trackedPaths,
      diffText: `${baseDiff}\n${workingDiff}`
    };
  } catch {
    return { diffStatus: 'NOT_MEASURED', trackedPaths: [], diffText: '' };
  }
}

function runGitleaksIfInstalled(repoRoot) {
  try {
    execFileSync('gitleaks', ['version'], { cwd: repoRoot, stdio: 'pipe' });
  } catch {
    return { status: 'NOT_MEASURED', detail: 'gitleaks binary not installed in current environment' };
  }
  try {
    execFileSync('gitleaks', ['detect', '--source', repoRoot, '--no-banner', '--redact'], {
      cwd: repoRoot,
      stdio: 'pipe'
    });
    return { status: 'PASS', detail: '0 leaks detected' };
  } catch (error) {
    return { status: 'FAIL', detail: String(error.stderr || error.message || 'secret detected').slice(0, 240) };
  }
}

export async function runRepositoryGovernanceCheck(repoRoot) {
  const rootCandidates = ['CLAUDE.md', 'AGENTS.md', 'MEMORY.md'];
  const rootFiles = [];
  for (const name of rootCandidates) {
    try {
      const content = await readFile(path.join(repoRoot, name), 'utf8');
      rootFiles.push({ name, content });
    } catch {
      /* optional unless CLAUDE.md */
    }
  }
  const rootCheck = evaluateRootPayloadGovernance({ rootFiles });

  const [productRequirementsMd, traceabilityMatrixMd, b0MatrixMd, blindSpotSweepMd, acceptanceTestsMd] = await Promise.all([
    readFile(path.join(repoRoot, 'docs/spec/PRODUCT_REQUIREMENTS.md'), 'utf8'),
    readFile(path.join(repoRoot, 'docs/spec/TRACEABILITY_MATRIX.md'), 'utf8'),
    readFile(path.join(repoRoot, 'docs/spec/B0_TRACEABILITY_MATRIX.md'), 'utf8'),
    readFile(path.join(repoRoot, 'docs/spec/FINAL_BLIND_SPOT_SWEEP.md'), 'utf8'),
    readFile(path.join(repoRoot, 'docs/spec/ACCEPTANCE_TESTS.md'), 'utf8')
  ]);

  const existingSpecNames = new Set(['CLAUDE.md', 'README']);
  const candidateSpecTokens = new Set([
    ...[...traceabilityMatrixMd.matchAll(/\b([A-Z][A-Z0-9_]{3,})\b/g)].map((m) => m[1]),
    ...[...b0MatrixMd.matchAll(/\b([A-Z][A-Z0-9_]{3,})\b/g)].map((m) => m[1])
  ]);
  for (const token of candidateSpecTokens) {
    for (const rel of [`docs/spec/${token}.md`, `docs/${token}.md`, `${token}.md`]) {
      try {
        await access(path.join(repoRoot, rel));
        existingSpecNames.add(token);
        break;
      } catch {
        /* try next */
      }
    }
  }

  const traceCheck = evaluateSpecTraceability({
    productRequirementsMd,
    traceabilityMatrixMd,
    b0MatrixMd,
    blindSpotSweepMd,
    acceptanceTestsMd,
    existingSpecNames
  });

  const agentCheck = evaluateAgentActionSpace();

  const { diffStatus, trackedPaths, diffText } = collectMeasuredGitDiff(repoRoot);
  const { addedLinesByFile, removedLinesByFile, deletedPaths } = parseGitUnifiedDiff(diffText);
  const gitleaksResult = runGitleaksIfInstalled(repoRoot);
  const floorCheck = evaluateFloorGuard({
    diffStatus,
    addedLinesByFile,
    removedLinesByFile,
    deletedPaths,
    trackedPaths,
    gitleaksResult
  });

  const allErrors = [
    ...rootCheck.errors,
    ...traceCheck.errors,
    ...agentCheck.errors,
    ...floorCheck.errors
  ];

  return Object.freeze({
    ok: allErrors.length === 0,
    rootCheck,
    traceCheck,
    agentCount: agentCheck.agentCount,
    agentCheck,
    floorCheck,
    errors: Object.freeze(allErrors)
  });
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const report = await runRepositoryGovernanceCheck(repoRoot);
  if (!report.ok) {
    console.error('Governance & Floor Guard FAILED:');
    for (const err of report.errors) console.error(`- ${err}`);
    process.exit(1);
  }
  console.log(
    `Governance & Floor Guard PASS: root=${report.rootCheck.totalLines}L/${report.rootCheck.totalBytes}B (sha256:${report.rootCheck.extractShaPrefix}), `
    + `PR/NFR=${report.traceCheck.counts.mappedPrNfr}, B0=${report.traceCheck.counts.definedB0}, `
    + `AT=${report.traceCheck.counts.definedAts}, agents=${report.agentCount} (<=5 tools), `
    + `diff=${report.floorCheck.diffStatus}, gitleaks=${report.floorCheck.gitleaksStatus}.`
  );
}
