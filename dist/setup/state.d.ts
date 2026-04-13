/**
 * Setup State Machine
 *
 * Port of scripts/setup-progress.sh to TypeScript.
 * Provides save/clear/resume/complete operations for setup wizard progress.
 */
export type ResumeResult = {
    status: 'fresh';
} | {
    status: 'resume';
    lastStep: number;
    timestamp: string;
    configType: string;
};
/**
 * Optional human-readable side-band logger. Defaults to silent so
 * machine-parseable callers (`--check-state`, `--state-resume`, …) can
 * emit only the JSON payload they produce. Callers that want progress
 * lines (e.g. the interactive wizard between phases) pass a quiet-aware
 * logger (`log.info`) from `runSetup`.
 */
type StateLogger = (msg: string) => void;
/**
 * Save setup progress to .omc/state/setup-state.json.
 * Creates the directory recursively if missing.
 */
export declare function saveState(step: number, configType: string, opts?: {
    cwd?: string;
    logger?: StateLogger;
}): void;
/**
 * Remove .omc/state/setup-state.json if it exists. Silent no-op if missing.
 */
export declare function clearState(opts?: {
    cwd?: string;
    logger?: StateLogger;
}): void;
/**
 * Check for existing setup progress.
 * Returns fresh if missing, corrupted, stale (>24h), or missing timestamp.
 * Returns resume data if valid and within TTL.
 */
export declare function resumeState(opts?: {
    cwd?: string;
    logger?: StateLogger;
}): ResumeResult;
/**
 * Mark setup as complete:
 * - Deletes the in-progress state file
 * - Cleans up skill-active-state for the current session (or stale fallback)
 * - Shallow-merges setupCompleted + setupVersion into .omc-config.json
 */
export declare function completeSetup(version: string, opts?: {
    cwd?: string;
    configDir?: string;
    logger?: StateLogger;
}): void;
export {};
//# sourceMappingURL=state.d.ts.map