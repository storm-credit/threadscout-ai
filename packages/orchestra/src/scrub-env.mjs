// Child-subprocess environment scrubber (`SCRUB_ENV` — CLAUDE.md §11/§21, NFR-13, AT-48).

const SAFE_ENV_ALLOWLIST = new Set([
  'PATH',
  'Path',
  'PATHEXT',
  'SYSTEMROOT',
  'SystemRoot',
  'COMSPEC',
  'ComSpec',
  'TEMP',
  'TMP',
  'HOME',
  'USERPROFILE',
  'LANG',
  'LC_ALL',
  'TZ',
  'NODE_ENV'
]);

const FORBIDDEN_SECRET_PATTERNS = [
  /^THREADS_/i,
  /^COUPANG_/i,
  /^NAVER_/i,
  /^GOOGLE_/i,
  /^AI_API_KEY$/i,
  /^ANTHROPIC_/i,
  /^OPENAI_/i,
  /^GEMINI_/i,
  /^DATABASE_URL$/i,
  /^NODE_OPTIONS$/i,
  /TOKEN|SECRET|PASSWORD|PRIVATE_KEY|CREDENTIAL/i
];

export function scrubSubprocessEnv(sourceEnv = process.env, explicitAllow = []) {
  const extra = new Set(explicitAllow);
  const scrubbed = {};

  for (const [key, value] of Object.entries(sourceEnv ?? {})) {
    if (value === undefined) continue;
    if (FORBIDDEN_SECRET_PATTERNS.some((pattern) => pattern.test(key))) continue;
    if (SAFE_ENV_ALLOWLIST.has(key) || extra.has(key)) {
      scrubbed[key] = String(value);
    }
  }

  return Object.freeze(scrubbed);
}
