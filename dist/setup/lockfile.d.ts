/**
 * Setup lockfile — prevents concurrent `runSetup()` invocations.
 *
 * Plan reference: /Users/peter/.claude-personal/plans/replicated-mixing-wren.md
 *   — "Concurrent invocation is guarded by a hostname+PID lockfile at `.omc/state/setup.lock`"
 *   — Risks table: NFS concern (foreign hostname) + stale lockfile handling
 *
 * Invariants:
 *   1. Acquisition is atomic via `fs.writeFileSync(path, content, { flag: 'wx' })`.
 *   2. Lockfile is released automatically on `process.exit`, SIGINT, SIGTERM.
 *   3. Foreign hostname (NFS-shared `$HOME`) is **never** auto-released — the
 *      lock is rejected with a clear message. User must delete it by hand.
 *   4. Stale detection (same host): if the recorded PID is not alive AND the
 *      lock is older than `STALE_LOCK_MS` (1 hour), the lock is auto-released
 *      and re-acquired. The age threshold prevents races where a long-running
 *      setup briefly loses its PID entry under heavy load.
 *   5. Hostname + PID alive → reject (collision with an active setup).
 */
/** Lockfile age above which a lock whose owner PID is dead is treated as stale. */
export declare const STALE_LOCK_MS: number;
export type Invoker = 'cli' | 'skill';
export interface LockContent {
    pid: number;
    hostname: string;
    startedAt: string;
    invoker: Invoker;
}
export interface LockHandle {
    readonly path: string;
    readonly content: LockContent;
    /** Release the lock (idempotent). */
    release(): void;
}
export declare class LockHeldError extends Error {
    readonly existing: LockContent;
    readonly lockPath: string;
    constructor(message: string, existing: LockContent, lockPath: string);
}
export interface AcquireLockOptions {
    /** Override `os.hostname()` — test-only. */
    hostname?: string;
    /** Override `process.pid` — test-only. */
    pid?: number;
    /** Override `Date.now()` — test-only (used for `startedAt`). */
    now?: () => number;
    /** Override the liveness check — test-only. */
    isPidAlive?: (pid: number) => boolean;
}
/**
 * Check whether a PID is currently alive.
 *
 * `process.kill(pid, 0)` throws when the process doesn't exist, or when we
 * lack permission to signal it. In the "EPERM" case the process DOES exist
 * but is owned by a different user — we treat that as alive (conservative).
 */
export declare function isPidAlive(pid: number): boolean;
/**
 * Acquire the setup lockfile. Throws `LockHeldError` if another setup is
 * already running on the same host, or if the lockfile was written on a
 * different host (foreign hostname — NFS concern, never auto-released).
 *
 * On successful acquisition, returns a `LockHandle` with a `release()`
 * method. Callers SHOULD also register cleanup on process signals — see
 * `registerLockCleanup()` below.
 */
export declare function acquireLock(lockPath: string, invoker: Invoker, opts?: AcquireLockOptions): LockHandle;
/**
 * Register signal handlers that release the lock on unclean termination.
 *
 * Handlers installed:
 *   - `exit`        → sync release (no async work allowed)
 *   - `SIGINT`      → release, then re-raise (default) to exit 130
 *   - `SIGTERM`     → release, then re-raise to exit 143
 *   - `uncaughtException` → release, then re-throw so node's default handler runs
 *
 * Returns a deregister function the caller should invoke on normal exit so
 * the handlers don't accumulate across test runs.
 */
export declare function registerLockCleanup(handle: LockHandle): () => void;
//# sourceMappingURL=lockfile.d.ts.map