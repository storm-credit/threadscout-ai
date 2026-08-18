import { randomUUID } from 'node:crypto';
import { mkdir, open, readFile, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { AtomicJsonApplicationStore, ApplicationCommandError } from './application-state.mjs';

const DEFAULT_LOCK_TIMEOUT_MS = 3000;
const DEFAULT_LOCK_STALE_MS = 30000;
const DEFAULT_LOCK_RETRY_MS = 20;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isMissing(error) {
  return error?.code === 'ENOENT';
}

function persistenceReadModel(today) {
  return {
    ...today,
    capability: {
      ...today.capability,
      persistence: 'server_atomic_json_local_interprocess_locked',
      persistenceScope: 'single_host_local_filesystem',
      crossProcessWriteSerialization: true
    }
  };
}

export class LockedAtomicJsonApplicationStore extends AtomicJsonApplicationStore {
  constructor({
    filePath,
    clock,
    lockPath = filePath ? `${filePath}.lock` : null,
    lockTimeoutMs = DEFAULT_LOCK_TIMEOUT_MS,
    lockStaleMs = DEFAULT_LOCK_STALE_MS,
    lockRetryMs = DEFAULT_LOCK_RETRY_MS,
    lockClock = () => Date.now()
  } = {}) {
    super({ filePath, clock });
    if (!lockPath) throw new Error('lockPath is required.');
    if (!Number.isFinite(lockTimeoutMs) || lockTimeoutMs < 0) throw new Error('lockTimeoutMs must be >= 0.');
    if (!Number.isFinite(lockStaleMs) || lockStaleMs <= 0) throw new Error('lockStaleMs must be > 0.');
    if (!Number.isFinite(lockRetryMs) || lockRetryMs <= 0) throw new Error('lockRetryMs must be > 0.');
    this.lockPath = lockPath;
    this.lockTimeoutMs = lockTimeoutMs;
    this.lockStaleMs = lockStaleMs;
    this.lockRetryMs = lockRetryMs;
    this.lockClock = lockClock;
  }

  async clearStaleLockIfNeeded() {
    let firstStat;
    let firstBody;
    try {
      firstStat = await stat(this.lockPath);
      if (this.lockClock() - firstStat.mtimeMs < this.lockStaleMs) return false;
      firstBody = await readFile(this.lockPath, 'utf8');
    } catch (error) {
      if (isMissing(error)) return false;
      throw error;
    }

    try {
      const secondStat = await stat(this.lockPath);
      if (this.lockClock() - secondStat.mtimeMs < this.lockStaleMs) return false;
      const secondBody = await readFile(this.lockPath, 'utf8');
      if (secondBody !== firstBody) return false;
      await rm(this.lockPath);
      return true;
    } catch (error) {
      if (isMissing(error)) return false;
      throw error;
    }
  }

  async acquireWriteLock() {
    const startedAt = this.lockClock();

    // The lock lives beside the state file, so its directory has to exist before the
    // first lock is ever taken. Without this, a clean checkout fails on the very
    // first request: `initialize()` acquires the lock before the atomic store gets a
    // chance to create the data directory.
    await mkdir(path.dirname(this.lockPath), { recursive: true });

    while (true) {
      const token = `${process.pid}:${randomUUID()}`;
      try {
        const handle = await open(this.lockPath, 'wx', 0o600);
        try {
          await handle.writeFile(`${JSON.stringify({ token, pid: process.pid, acquiredAt: new Date().toISOString() })}\n`, 'utf8');
          await handle.sync();
        } finally {
          await handle.close();
        }
        return token;
      } catch (error) {
        if (error?.code !== 'EEXIST') throw error;
        await this.clearStaleLockIfNeeded();
        if (this.lockClock() - startedAt >= this.lockTimeoutMs) {
          throw new ApplicationCommandError('Application state is busy; retry after the current writer finishes.', {
            code: 'storage_lock_timeout',
            statusCode: 503,
            details: {
              lockTimeoutMs: this.lockTimeoutMs,
              persistenceScope: 'single_host_local_filesystem'
            }
          });
        }
        await delay(this.lockRetryMs);
      }
    }
  }

  async releaseWriteLock(token) {
    try {
      const raw = await readFile(this.lockPath, 'utf8');
      let metadata;
      try {
        metadata = JSON.parse(raw);
      } catch {
        return false;
      }
      if (metadata?.token !== token) return false;
      await rm(this.lockPath);
      return true;
    } catch (error) {
      if (isMissing(error)) return false;
      throw error;
    }
  }

  async withWriteLock(operation) {
    const token = await this.acquireWriteLock();
    try {
      return await operation();
    } finally {
      await this.releaseWriteLock(token);
    }
  }

  async initialize() {
    return this.withWriteLock(() => super.initialize());
  }

  async readToday() {
    return persistenceReadModel(await super.readToday());
  }

  async execute(request) {
    return this.withWriteLock(async () => {
      const response = await super.execute(request);
      if (response?.today) response.today = persistenceReadModel(response.today);
      return response;
    });
  }
}
