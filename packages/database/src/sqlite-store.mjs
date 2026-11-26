// Zero-dependency Node 24 `node:sqlite` ACID WAL + Hangul NFD Jamo FTS5 store (`packages/database`).
// Eliminates the flat-JSON 50-candidate truncation bug, fixes commandHistory fingerprint checks,
// enforces permanent `#NNN` card numbers, and serves `/api/showcase` via a dedicated readOnly handle.

let DatabaseSync = null;
try {
  ({ DatabaseSync } = await import('node:sqlite'));
} catch {
  DatabaseSync = null;
}

export function isNodeSqliteAvailable() {
  return typeof DatabaseSync === 'function';
}

import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  APPLICATION_STATE_VERSION,
  ApplicationCommandError,
  VersionConflictError,
  createInitialApplicationState,
  toTodayReadModel
} from '../../../apps/web/application-state.mjs';
import { applySuppressionToState } from '../../../apps/web/candidate-suppression-store.mjs';
import { CandidateDedupeApplicationStore } from '../../../apps/web/candidate-dedupe-store.mjs';
import { SuppressionApplicationStore } from '../../../apps/web/candidate-suppression-store.mjs';
import { projectPublicShowcaseCard, formatCardNumber } from '../../core/src/public-showcase-projector.mjs';
import { sha256 } from '../../orchestra/src/versioning.mjs';

/**
 * Decompose Hangul into NFD Jamo with leading/trailing spaces so SQLite's built-in `trigram`
 * tokenizer indexes 2-syllable Korean queries (`물튐`, `방지`) and 2-char brands (`LG`, `3M`)
 * with zero C++ extensions (`measured` on Node 24 / SQLite 3.50.4).
 */
export function toSearchableNfdTrigramText(text = '') {
  return ` ${String(text ?? '').toLowerCase().normalize('NFD').replace(/\s+/g, ' ').trim()} `;
}

const SCHEMA_SQL = `
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS store_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  ) STRICT;

  CREATE TABLE IF NOT EXISTS candidates (
    id TEXT PRIMARY KEY,
    card_number INTEGER UNIQUE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    revision INTEGER NOT NULL CHECK (revision >= 1),
    workflow_state TEXT NOT NULL,
    exact_match_status TEXT NOT NULL CHECK (exact_match_status IN ('exact', 'likely', 'substitute', 'unresolved')),
    locked_non_commercial INTEGER NOT NULL DEFAULT 0 CHECK (locked_non_commercial IN (0, 1)),
    lifecycle_epoch INTEGER NOT NULL DEFAULT 1 CHECK (lifecycle_epoch >= 1),
    record_json TEXT NOT NULL
  ) STRICT;

  CREATE INDEX IF NOT EXISTS idx_candidates_workflow_updated
    ON candidates(workflow_state, updated_at DESC);

  CREATE TABLE IF NOT EXISTS suppression_rules (
    id TEXT PRIMARY KEY,
    axis TEXT NOT NULL CHECK (axis IN ('product', 'brand', 'category', 'source')),
    normalized_value TEXT NOT NULL,
    display_value TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT,
    rule_json TEXT NOT NULL
  ) STRICT;

  CREATE TABLE IF NOT EXISTS command_history (
    request_id TEXT PRIMARY KEY,
    fingerprint TEXT NOT NULL,
    command TEXT NOT NULL,
    candidate_id TEXT,
    response_candidate_id TEXT,
    result TEXT NOT NULL,
    entry_json TEXT NOT NULL,
    recorded_at TEXT NOT NULL
  ) STRICT;

  CREATE TABLE IF NOT EXISTS audit_events (
    seq INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    candidate_id TEXT,
    at TEXT NOT NULL,
    prev_hash TEXT NOT NULL,
    event_hash TEXT NOT NULL,
    payload_json TEXT NOT NULL
  ) STRICT;

  CREATE TABLE IF NOT EXISTS lifecycle_budgets (
    candidate_id TEXT NOT NULL,
    lifecycle_epoch INTEGER NOT NULL CHECK (lifecycle_epoch >= 1),
    invocations INTEGER NOT NULL DEFAULT 0 CHECK (invocations >= 0),
    input_tokens INTEGER NOT NULL DEFAULT 0 CHECK (input_tokens >= 0),
    output_tokens INTEGER NOT NULL DEFAULT 0 CHECK (output_tokens >= 0),
    cost_krw REAL NOT NULL DEFAULT 0 CHECK (cost_krw >= 0),
    max_cost_krw REAL NOT NULL DEFAULT 150 CHECK (max_cost_krw > 0),
    updated_at TEXT NOT NULL,
    PRIMARY KEY (candidate_id, lifecycle_epoch)
  ) STRICT;

  CREATE TABLE IF NOT EXISTS public_showcase_cards (
    card_number INTEGER PRIMARY KEY CHECK (card_number >= 1),
    candidate_id TEXT NOT NULL UNIQUE REFERENCES candidates(id) ON DELETE CASCADE,
    card_code TEXT NOT NULL UNIQUE,
    canonical_product_name TEXT NOT NULL,
    match_badge TEXT NOT NULL CHECK (match_badge IN ('exact', 'alternative')),
    verified_pros_json TEXT NOT NULL,
    verified_limitation TEXT NOT NULL,
    disclosure_text TEXT,
    verified_destination_url TEXT,
    publishable_media_url TEXT,
    verified_at TEXT NOT NULL,
    expires_at TEXT,
    search_nfd TEXT NOT NULL,
    CHECK ((verified_destination_url IS NULL AND disclosure_text IS NULL) OR (verified_destination_url IS NOT NULL AND length(disclosure_text) > 0))
  ) STRICT;

  CREATE VIRTUAL TABLE IF NOT EXISTS public_showcase_cards_fts USING fts5(
    card_code,
    search_nfd,
    content='public_showcase_cards',
    content_rowid='card_number',
    tokenize='trigram'
  );

  CREATE TRIGGER IF NOT EXISTS trg_showcase_fts_ai AFTER INSERT ON public_showcase_cards BEGIN
    INSERT INTO public_showcase_cards_fts(rowid, card_code, search_nfd)
    VALUES (new.card_number, new.card_code, new.search_nfd);
  END;

  CREATE TRIGGER IF NOT EXISTS trg_showcase_fts_ad AFTER DELETE ON public_showcase_cards BEGIN
    INSERT INTO public_showcase_cards_fts(public_showcase_cards_fts, rowid, card_code, search_nfd)
    VALUES ('delete', old.card_number, old.card_code, old.search_nfd);
  END;

  CREATE TRIGGER IF NOT EXISTS trg_showcase_fts_au AFTER UPDATE ON public_showcase_cards BEGIN
    INSERT INTO public_showcase_cards_fts(public_showcase_cards_fts, rowid, card_code, search_nfd)
    VALUES ('delete', old.card_number, old.card_code, old.search_nfd);
    INSERT INTO public_showcase_cards_fts(rowid, card_code, search_nfd)
    VALUES (new.card_number, new.card_code, new.search_nfd);
  END;

  CREATE TRIGGER IF NOT EXISTS trg_lock_non_commercial_irreversible
  BEFORE UPDATE ON candidates
  WHEN old.locked_non_commercial = 1 AND new.locked_non_commercial = 0
  BEGIN
    SELECT RAISE(ABORT, 'BS-60 post-publish non-commercial lock is irreversible');
  END;
`;

function nowIso(clock) {
  return (clock?.() ?? new Date()).toISOString();
}

function requestFingerprint(request) {
  return sha256({
    command: request.command,
    candidateId: request.candidateId ?? null,
    expectedRevision: request.expectedRevision ?? null,
    payload: request.payload ?? {}
  });
}

/**
 * SQLite-backed store implementing the exact same store port as `SuppressionApplicationStore`,
 * while eliminating the 50-item candidate truncation cap, maintaining permanent `#NNN` card numbers,
 * and exposing fast read-only `/api/showcase` queries over FTS5.
 */
export class SqliteApplicationStore extends SuppressionApplicationStore {
  constructor({
    dbPath,
    legacyJsonPath = null,
    clock
  } = {}) {
    if (!dbPath) throw new Error('dbPath is required for SqliteApplicationStore.');
    // Pass a virtual path to super; persistence methods are overridden onto SQLite ACID transactions.
    super({ filePath: legacyJsonPath || `${dbPath}.shadow.json`, clock });
    this.dbPath = dbPath;
    this.legacyJsonPath = legacyJsonPath;
    this.clock = clock;
    this.db = null;
    this.readOnlyShowcaseDb = null;
  }

  async withWriteLock(operation) {
    // SQLite WAL + IMMEDIATE transactions serialize writes safely without spin-lock files.
    return operation();
  }

  async initialize() {
    if (!isNodeSqliteAvailable()) {
      throw new Error('Built-in node:sqlite is unavailable on this Node runtime; use storageMode="json".');
    }
    if (this.db) return this.readState();
    if (this.dbPath !== ':memory:') {
      await mkdir(path.dirname(this.dbPath), { recursive: true });
    }
    this.db = new DatabaseSync(this.dbPath);
    this.db.exec(SCHEMA_SQL);

    const metaRow = this.db.prepare(`SELECT value FROM store_meta WHERE key = 'initialized'`).get();
    if (!metaRow) {
      let seedState = null;
      if (this.legacyJsonPath) {
        try {
          const raw = await readFile(this.legacyJsonPath, 'utf8');
          const parsed = JSON.parse(raw);
          if (parsed?.version === APPLICATION_STATE_VERSION) seedState = parsed;
        } catch {
          seedState = null;
        }
      }
      seedState ??= createInitialApplicationState({ clock: this.clock });
      await this.persist(seedState);
      this.db.prepare(`INSERT OR REPLACE INTO store_meta(key, value) VALUES ('initialized', '1')`).run();
    }

    if (this.dbPath !== ':memory:') {
      this.readOnlyShowcaseDb = new DatabaseSync(this.dbPath, { readOnly: true });
      this.readOnlyShowcaseDb.exec('PRAGMA query_only = ON;');
    }
    return this.readState();
  }

  #nextCardNumber() {
    const row = this.db.prepare('SELECT COALESCE(MAX(card_number), 0) AS maxNum FROM candidates').get();
    return Number(row?.maxNum ?? 0) + 1;
  }

  async readState() {
    if (!this.db) await this.initialize();
    const metaRows = this.db.prepare('SELECT key, value FROM store_meta').all();
    const meta = Object.fromEntries(metaRows.map((r) => [r.key, r.value]));

    const candidateRows = this.db.prepare('SELECT card_number, locked_non_commercial, lifecycle_epoch, record_json FROM candidates ORDER BY rowid ASC').all();
    const budgetRows = this.db.prepare('SELECT candidate_id, lifecycle_epoch, invocations, input_tokens, output_tokens, cost_krw, max_cost_krw FROM lifecycle_budgets').all();
    const budgetByKey = new Map(budgetRows.map((b) => [`${b.candidate_id}::${b.lifecycle_epoch}`, b]));

    const candidates = candidateRows.map((row) => {
      const parsed = JSON.parse(row.record_json);
      if (row.card_number != null) parsed.cardNumber = row.card_number;
      parsed.lockedNonCommercialAfterPublish = row.locked_non_commercial === 1 || parsed.lockedNonCommercialAfterPublish === true;
      parsed.lifecycleEpoch = row.lifecycle_epoch ?? parsed.lifecycleEpoch ?? 1;
      const bRow = budgetByKey.get(`${parsed.id}::${parsed.lifecycleEpoch}`);
      if (bRow) {
        parsed.epochBudget = {
          ...(parsed.epochBudget ?? {}),
          lifecycleEpoch: parsed.lifecycleEpoch,
          invocations: bRow.invocations,
          totalChars: bRow.input_tokens + bRow.output_tokens,
          costKrw: bRow.cost_krw,
          maxCostKrw: bRow.max_cost_krw,
          maxInvocations: parsed.epochBudget?.maxInvocations ?? 16
        };
      }
      return parsed;
    });

    const ruleRows = this.db.prepare('SELECT rule_json FROM suppression_rules ORDER BY created_at ASC').all();
    const suppressionRules = ruleRows.map((row) => JSON.parse(row.rule_json));

    const cmdRows = this.db.prepare('SELECT request_id, fingerprint, command, candidate_id, response_candidate_id, result, entry_json, recorded_at FROM command_history ORDER BY rowid ASC').all();
    const commandHistory = {};
    const commandOrder = [];
    for (const row of cmdRows) {
      let parsedEntry = {};
      try { parsedEntry = JSON.parse(row.entry_json); } catch { parsedEntry = {}; }
      commandHistory[row.request_id] = {
        ...parsedEntry,
        fingerprint: row.fingerprint,
        command: row.command,
        candidateId: row.candidate_id,
        responseCandidateId: row.response_candidate_id ?? parsedEntry.responseCandidateId ?? row.candidate_id ?? null,
        result: row.result,
        recordedAt: row.recorded_at
      };
      commandOrder.push(row.request_id);
    }

    const auditRows = this.db.prepare('SELECT seq, payload_json FROM audit_events ORDER BY seq DESC LIMIT 200').all().reverse();
    const audit = auditRows.map((row) => {
      const ev = JSON.parse(row.payload_json);
      Object.defineProperty(ev, '_persistedSeq', { value: row.seq, enumerable: false, configurable: true });
      return ev;
    });

    const state = {
      version: APPLICATION_STATE_VERSION,
      updatedAt: meta.updatedAt || nowIso(this.clock),
      fixedAgentCount: 6,
      externalPublishingEnabled: false,
      candidates,
      suppressionRules,
      commandHistory,
      commandOrder,
      audit
    };

    return applySuppressionToState(state, { at: nowIso(this.clock) });
  }

  async persist(state) {
    if (!this.db) await this.initialize();
    const now = nowIso(this.clock);
    const existingRows = this.db.prepare('SELECT id, card_number, locked_non_commercial, lifecycle_epoch FROM candidates').all();
    const existingById = new Map(existingRows.map((r) => [r.id, r]));

    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db.prepare(`INSERT OR REPLACE INTO store_meta(key, value) VALUES ('updatedAt', ?)`).run(state.updatedAt || now);

      // Preserve every historical candidate beyond any in-memory 50-item slice so `#NNN` showcase URLs
      // and BS-60 locks are never truncated away!
      const incomingIds = new Set(state.candidates.map((c) => c.id));
      const upsertCandidate = this.db.prepare(`
        INSERT INTO candidates(id, card_number, created_at, updated_at, revision, workflow_state, exact_match_status, locked_non_commercial, lifecycle_epoch, record_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          card_number = COALESCE(candidates.card_number, excluded.card_number),
          updated_at = excluded.updated_at,
          revision = excluded.revision,
          workflow_state = excluded.workflow_state,
          exact_match_status = excluded.exact_match_status,
          locked_non_commercial = MAX(candidates.locked_non_commercial, excluded.locked_non_commercial),
          lifecycle_epoch = excluded.lifecycle_epoch,
          record_json = excluded.record_json
      `);

      const upsertBudget = this.db.prepare(`
        INSERT INTO lifecycle_budgets(candidate_id, lifecycle_epoch, invocations, input_tokens, output_tokens, cost_krw, max_cost_krw, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(candidate_id, lifecycle_epoch) DO UPDATE SET
          invocations = excluded.invocations,
          input_tokens = excluded.input_tokens,
          output_tokens = excluded.output_tokens,
          cost_krw = excluded.cost_krw,
          max_cost_krw = excluded.max_cost_krw,
          updated_at = excluded.updated_at
      `);

      for (const candidate of state.candidates) {
        const prior = existingById.get(candidate.id);
        let cardNumber = prior?.card_number ?? candidate.cardNumber ?? null;
        if (cardNumber == null && candidate.workflowState === 'approved' && ['exact', 'substitute'].includes(candidate.exactMatchStatus)) {
          cardNumber = this.#nextCardNumber();
        }
        if (cardNumber != null) candidate.cardNumber = cardNumber;
        const lockedInt = (prior?.locked_non_commercial === 1 || candidate.lockedNonCommercialAfterPublish === true) ? 1 : 0;
        candidate.lockedNonCommercialAfterPublish = lockedInt === 1;
        const epoch = candidate.lifecycleEpoch ?? prior?.lifecycle_epoch ?? 1;
        candidate.lifecycleEpoch = epoch;

        upsertCandidate.run(
          candidate.id,
          cardNumber,
          candidate.createdAt || now,
          candidate.updatedAt || now,
          candidate.revision ?? 1,
          candidate.workflowState || 'verification_needed',
          candidate.exactMatchStatus || 'unresolved',
          lockedInt,
          epoch,
          JSON.stringify(candidate)
        );

        const eb = candidate.epochBudget ?? {};
        upsertBudget.run(
          candidate.id,
          epoch,
          Math.max(0, Number(eb.invocations ?? 0)),
          Math.max(0, Math.round(Number(eb.totalChars ?? 0))),
          0,
          Math.max(0, Number(eb.costKrw ?? 0)),
          Math.max(1, Number(eb.maxCostKrw ?? 150)),
          candidate.updatedAt || now
        );
      }

      for (const old of existingRows) {
        if (!incomingIds.has(old.id) && old.locked_non_commercial !== 1) {
          this.db.prepare('DELETE FROM public_showcase_cards WHERE candidate_id = ?').run(old.id);
          this.db.prepare('DELETE FROM candidates WHERE id = ?').run(old.id);
        }
      }

      // Sync suppression rules
      this.db.exec('DELETE FROM suppression_rules');
      const insertRule = this.db.prepare(`
        INSERT INTO suppression_rules(id, axis, normalized_value, display_value, reason, created_at, expires_at, rule_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const rule of state.suppressionRules ?? []) {
        insertRule.run(
          rule.id,
          rule.axis,
          rule.value,
          rule.displayValue || rule.value,
          rule.reason,
          rule.createdAt || now,
          rule.expiresAt ?? null,
          JSON.stringify(rule)
        );
      }

      // Sync command history (preserving non-null fingerprints, responseCandidateId, and duplicateAssessment)
      const upsertCmd = this.db.prepare(`
        INSERT OR REPLACE INTO command_history(request_id, fingerprint, command, candidate_id, response_candidate_id, result, entry_json, recorded_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const [reqId, entry] of Object.entries(state.commandHistory ?? {})) {
        upsertCmd.run(
          reqId,
          entry.fingerprint || sha256({ requestId: reqId, command: entry.command, candidateId: entry.candidateId }),
          entry.command,
          entry.candidateId ?? null,
          entry.responseCandidateId ?? entry.candidateId ?? null,
          entry.result ?? 'ok',
          JSON.stringify(entry),
          entry.recordedAt || now
        );
      }

      // Append every unpersisted audit event onto the monotonic hash-chained ledger (never freezes at 200)
      const unpersistedAudit = (state.audit ?? []).filter((ev) => !Number.isInteger(ev?._persistedSeq));
      if (unpersistedAudit.length > 0) {
        const lastRow = this.db.prepare('SELECT event_hash FROM audit_events ORDER BY seq DESC LIMIT 1').get();
        let prevHash = lastRow?.event_hash ?? 'GENESIS';
        const insertAudit = this.db.prepare(`
          INSERT INTO audit_events(event_type, candidate_id, at, prev_hash, event_hash, payload_json)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        for (const ev of unpersistedAudit) {
          const payloadJson = JSON.stringify(ev);
          const eventHash = sha256({ prevHash, payloadJson });
          const info = insertAudit.run(ev.event || 'event', ev.candidateId ?? null, ev.at || now, prevHash, eventHash, payloadJson);
          Object.defineProperty(ev, '_persistedSeq', { value: Number(info.lastInsertRowid), enumerable: false, configurable: true });
          prevHash = eventHash;
        }
      }

      // Refresh materialized `public_showcase_cards` + NFD Hangul FTS5 index
      const allCandidateRows = this.db.prepare('SELECT id, card_number, locked_non_commercial, record_json FROM candidates').all();
      const upsertShowcase = this.db.prepare(`
        INSERT INTO public_showcase_cards(
          card_number, candidate_id, card_code, canonical_product_name, match_badge,
          verified_pros_json, verified_limitation, disclosure_text, verified_destination_url,
          publishable_media_url, verified_at, expires_at, search_nfd
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(card_number) DO UPDATE SET
          candidate_id = excluded.candidate_id,
          card_code = excluded.card_code,
          canonical_product_name = excluded.canonical_product_name,
          match_badge = excluded.match_badge,
          verified_pros_json = excluded.verified_pros_json,
          verified_limitation = excluded.verified_limitation,
          disclosure_text = excluded.disclosure_text,
          verified_destination_url = excluded.verified_destination_url,
          publishable_media_url = excluded.publishable_media_url,
          verified_at = excluded.verified_at,
          expires_at = excluded.expires_at,
          search_nfd = excluded.search_nfd
      `);

      const rules = state.suppressionRules ?? [];
      const stamped = { candidates: allCandidateRows.map((r) => JSON.parse(r.record_json)), suppressionRules: rules };
      applySuppressionToState(stamped, { at: now });

      for (const candidate of stamped.candidates) {
        if (candidate.cardNumber == null) continue;
        const projected = projectPublicShowcaseCard(candidate, { now });
        if (!projected.projected) {
          this.db.prepare('DELETE FROM public_showcase_cards WHERE card_number = ?').run(candidate.cardNumber);
          continue;
        }
        const c = projected.card;
        const ttlMs = candidate.issueLinked ? 12 * 3600 * 1000 : 7 * 24 * 3600 * 1000;
        const expiresAt = c.verifiedDestinationUrl
          ? new Date(Date.parse(c.verifiedAt) + ttlMs).toISOString()
          : null;
        const searchBlob = toSearchableNfdTrigramText([
          c.cardNumber,
          String(candidate.cardNumber),
          c.canonicalProductName,
          ...c.verifiedPros,
          c.verifiedLimitation
        ].join(' '));

        upsertShowcase.run(
          candidate.cardNumber,
          candidate.id,
          c.cardNumber,
          c.canonicalProductName,
          c.matchBadge,
          JSON.stringify(c.verifiedPros),
          c.verifiedLimitation,
          c.disclosureText,
          c.verifiedDestinationUrl,
          c.publishableMediaUrl,
          c.verifiedAt,
          expiresAt,
          searchBlob
        );
      }

      this.db.exec('COMMIT');
    } catch (error) {
      try { this.db.exec('ROLLBACK'); } catch { /* ignore */ }
      throw error;
    }

    // Write post-commit JSON audit/rollback mirror (without 50-item truncation) when a file path is configured.
    if (this.legacyJsonPath && this.dbPath !== ':memory:') {
      await this.#writeJsonMirror();
    }
  }

  async #writeJsonMirror() {
    const candidateRows = this.db.prepare('SELECT card_number, locked_non_commercial, lifecycle_epoch, record_json FROM candidates ORDER BY rowid ASC').all();
    const budgetRows = this.db.prepare('SELECT candidate_id, lifecycle_epoch, invocations, input_tokens, output_tokens, cost_krw, max_cost_krw FROM lifecycle_budgets').all();
    const budgetByKey = new Map(budgetRows.map((b) => [`${b.candidate_id}::${b.lifecycle_epoch}`, b]));

    const candidates = candidateRows.map((row) => {
      const parsed = JSON.parse(row.record_json);
      if (row.card_number != null) parsed.cardNumber = row.card_number;
      parsed.lockedNonCommercialAfterPublish = row.locked_non_commercial === 1 || parsed.lockedNonCommercialAfterPublish === true;
      parsed.lifecycleEpoch = row.lifecycle_epoch ?? parsed.lifecycleEpoch ?? 1;
      const bRow = budgetByKey.get(`${parsed.id}::${parsed.lifecycleEpoch}`);
      if (bRow) {
        parsed.epochBudget = {
          ...(parsed.epochBudget ?? {}),
          lifecycleEpoch: parsed.lifecycleEpoch,
          invocations: bRow.invocations,
          totalChars: bRow.input_tokens + bRow.output_tokens,
          costKrw: bRow.cost_krw,
          maxCostKrw: bRow.max_cost_krw,
          maxInvocations: parsed.epochBudget?.maxInvocations ?? 16
        };
      }
      return parsed;
    });
    const suppressionRules = this.db.prepare('SELECT rule_json FROM suppression_rules ORDER BY created_at ASC').all().map((r) => JSON.parse(r.rule_json));
    const cmdRows = this.db.prepare('SELECT request_id, fingerprint, command, candidate_id, response_candidate_id, result, entry_json, recorded_at FROM command_history ORDER BY rowid ASC').all();
    const commandHistory = {};
    const commandOrder = [];
    for (const row of cmdRows) {
      let parsedEntry = {};
      try { parsedEntry = JSON.parse(row.entry_json); } catch { parsedEntry = {}; }
      commandHistory[row.request_id] = {
        ...parsedEntry,
        fingerprint: row.fingerprint,
        command: row.command,
        candidateId: row.candidate_id,
        responseCandidateId: row.response_candidate_id ?? parsedEntry.responseCandidateId ?? row.candidate_id ?? null,
        result: row.result,
        recordedAt: row.recorded_at
      };
      commandOrder.push(row.request_id);
    }
    const audit = this.db.prepare('SELECT payload_json FROM audit_events ORDER BY seq DESC LIMIT 200').all().reverse().map((r) => JSON.parse(r.payload_json));
    const updatedRow = this.db.prepare(`SELECT value FROM store_meta WHERE key = 'updatedAt'`).get();
    const mirror = {
      version: APPLICATION_STATE_VERSION,
      externalPublishingEnabled: false,
      fixedAgentCount: 6,
      candidates,
      suppressionRules,
      commandHistory,
      commandOrder,
      audit,
      updatedAt: updatedRow?.value ?? nowIso(this.clock)
    };
    await mkdir(path.dirname(this.legacyJsonPath), { recursive: true });
    const tempPath = `${this.legacyJsonPath}.${process.pid}.${randomUUID()}.tmp`;
    await writeFile(tempPath, `${JSON.stringify(mirror, null, 2)}\n`, 'utf8');
    await rename(tempPath, this.legacyJsonPath);
  }

  async readToday() {
    const today = await super.readToday();
    const showcase = await this.readShowcase();
    return {
      ...today,
      showcaseCount: showcase.cards.length,
      capability: {
        ...today.capability,
        persistence: 'server_sqlite_wal_acid_fts5',
        persistenceScope: 'single_host_sqlite_wal',
        publicShowcase: 'closed_9_field_default_deny_projection'
      }
    };
  }

  async execute(rawRequest) {
    if (!this.db) await this.initialize();
    const reqId = String(rawRequest?.requestId ?? '').trim();
    if (reqId) {
      const prior = this.db.prepare('SELECT fingerprint, result, candidate_id, response_candidate_id, entry_json FROM command_history WHERE request_id = ?').get(reqId);
      if (prior) {
        const currentFp = requestFingerprint({
          command: String(rawRequest?.command ?? '').trim(),
          candidateId: rawRequest?.candidateId ?? null,
          expectedRevision: rawRequest?.expectedRevision ?? null,
          payload: rawRequest?.payload && typeof rawRequest.payload === 'object' ? rawRequest.payload : {}
        });
        if (prior.fingerprint !== currentFp) {
          throw new ApplicationCommandError('requestId was already used for a different command.', {
            code: 'idempotency_key_reused',
            statusCode: 409
          });
        }
        let parsedEntry = {};
        try { parsedEntry = JSON.parse(prior.entry_json); } catch { parsedEntry = {}; }
        return {
          result: prior.result,
          candidateId: prior.response_candidate_id ?? prior.candidate_id ?? null,
          ...(parsedEntry.duplicateAssessment ? { duplicateAssessment: parsedEntry.duplicateAssessment } : {}),
          idempotentReplay: true,
          today: await this.readToday()
        };
      }
    }

    const response = await super.execute(rawRequest);
    if (reqId) {
      const fixedFp = requestFingerprint({
        command: String(rawRequest?.command ?? '').trim(),
        candidateId: rawRequest?.candidateId ?? null,
        expectedRevision: rawRequest?.expectedRevision ?? null,
        payload: rawRequest?.payload && typeof rawRequest.payload === 'object' ? rawRequest.payload : {}
      });
      this.db.prepare('UPDATE command_history SET fingerprint = ? WHERE request_id = ?').run(fixedFp, reqId);
    }
    return { ...response, today: await this.readToday() };
  }

  /**
   * Read-only consumer `/api/showcase` query using `readOnlyShowcaseDb` WAL handle,
   * inline TTL expiry check (`expires_at IS NULL OR expires_at >= :now`), and NFD Hangul FTS5 search.
   */
  async readShowcase({ query = '', cardNumber = null } = {}) {
    if (!this.db) await this.initialize();
    const reader = this.readOnlyShowcaseDb ?? this.db;
    const now = nowIso(this.clock);

    const toClosedCard = (row) => Object.freeze({
      cardNumber: row.card_code,
      canonicalProductName: row.canonical_product_name,
      matchBadge: row.match_badge,
      verifiedPros: Object.freeze(JSON.parse(row.verified_pros_json)),
      verifiedLimitation: row.verified_limitation,
      disclosureText: row.disclosure_text,
      verifiedDestinationUrl: row.verified_destination_url,
      publishableMediaUrl: row.publishable_media_url,
      verifiedAt: row.verified_at
    });

    if (cardNumber != null) {
      const numeric = Number(String(cardNumber).replace(/^#/, ''));
      if (!Number.isInteger(numeric) || numeric <= 0) return { card: null, status: 'invalid_card_number' };
      const row = reader.prepare(`
        SELECT card_code, canonical_product_name, match_badge, verified_pros_json, verified_limitation,
               disclosure_text, verified_destination_url, publishable_media_url, verified_at, expires_at
        FROM public_showcase_cards
        WHERE card_number = ? AND (expires_at IS NULL OR expires_at >= ?)
      `).get(numeric, now);
      return row ? { card: toClosedCard(row), status: 'ok' } : { card: null, status: 'withdrawn_or_not_found' };
    }

    const trimmed = String(query ?? '').trim();
    if (!trimmed) {
      const rows = reader.prepare(`
        SELECT card_code, canonical_product_name, match_badge, verified_pros_json, verified_limitation,
               disclosure_text, verified_destination_url, publishable_media_url, verified_at
        FROM public_showcase_cards
        WHERE expires_at IS NULL OR expires_at >= ?
        ORDER BY card_number DESC
        LIMIT 50
      `).all(now);
      return { cards: rows.map(toClosedCard), query: '' };
    }

    // Exact `#NNN` or digits-only shortcut
    const numMatch = trimmed.match(/^#?0*(\d{1,5})$/);
    if (numMatch) {
      const numeric = Number(numMatch[1]);
      const row = reader.prepare(`
        SELECT card_code, canonical_product_name, match_badge, verified_pros_json, verified_limitation,
               disclosure_text, verified_destination_url, publishable_media_url, verified_at
        FROM public_showcase_cards
        WHERE card_number = ? AND (expires_at IS NULL OR expires_at >= ?)
      `).get(numeric, now);
      return { cards: row ? [toClosedCard(row)] : [], query: trimmed };
    }

    // Hangul NFD Jamo + Space-Prefix FTS5 trigram search (`CROSS JOIN` planner lock -> 0 full scans)
    const nfdNeedle = toSearchableNfdTrigramText(trimmed).trim();
    const escapedFts = `"${nfdNeedle.replaceAll('"', '""')}"`;
    const rows = reader.prepare(`
      SELECT p.card_code, p.canonical_product_name, p.match_badge, p.verified_pros_json, p.verified_limitation,
             p.disclosure_text, p.verified_destination_url, p.publishable_media_url, p.verified_at
      FROM public_showcase_cards_fts AS f
      CROSS JOIN public_showcase_cards AS p ON p.card_number = f.rowid
      WHERE public_showcase_cards_fts MATCH ?
        AND (p.expires_at IS NULL OR p.expires_at >= ?)
      ORDER BY f.rank ASC
      LIMIT 30
    `).all(escapedFts, now);

    return { cards: rows.map(toClosedCard), query: trimmed };
  }

  close() {
    try { this.readOnlyShowcaseDb?.close(); } catch { /* ignore */ }
    try { this.db?.close(); } catch { /* ignore */ }
    this.readOnlyShowcaseDb = null;
    this.db = null;
  }
}
