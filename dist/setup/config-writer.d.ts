/**
 * Atomic JSON config writers — jq-equivalent merges to `settings.json` and
 * friends used by `omc setup`.
 *
 * Plan reference: /Users/peter/.claude-personal/plans/replicated-mixing-wren.md
 *   — "Config writer (`src/setup/config-writer.ts`)"
 *
 * Semantics match the bash port byte-for-byte:
 *   - `readJsonSafe` mirrors `jq . 2>/dev/null || echo null` (never throws on
 *     missing/corrupted files).
 *   - `mergeJsonShallow` mirrors `jq '. + {...}'` — preserves unknown user
 *     top-level keys; patch keys win on collision.
 *   - `setNestedJson` mirrors `jq '.env.VAR = "..."'` — creates intermediate
 *     objects, preserves sibling keys at every level.
 *
 * All writes go through an atomic tempfile+rename to avoid truncating the
 * user's config on ENOSPC, SIGINT, or power loss.
 */
/**
 * Reads and parses a JSON file. Returns `null` on any failure — missing file,
 * unreadable permissions, malformed JSON. The caller then decides whether to
 * start fresh with `{}` or surface an error.
 */
export declare function readJsonSafe<T = unknown>(path: string): T | null;
/**
 * Atomically writes `content` to `path`:
 *   1. Ensures parent directory exists.
 *   2. Writes to a temp file in the same directory.
 *   3. fsyncs the temp file.
 *   4. renames temp → target (atomic on POSIX same-filesystem).
 *
 * If any step before rename fails, the temp file is unlinked and the target
 * is left untouched. On rename failure (ENOENT, EACCES), the temp file is also
 * cleaned up and the error is rethrown.
 */
export declare function atomicWriteFile(path: string, content: string): void;
/**
 * Serialize + atomic write of a JSON object. Matches bash `jq ... > tmp && mv`.
 * Uses 2-space indent + trailing newline (matches `jq` default output).
 */
export declare function writeJsonAtomic(path: string, value: unknown): void;
/**
 * Shallow-merge `patch` onto the JSON at `path`. Preserves any top-level keys
 * the user has added that aren't in `patch` (matches `jq '. + {...}'`).
 *
 * If the file is missing or corrupted, starts fresh with `{}`.
 */
export declare function mergeJsonShallow(path: string, patch: Record<string, unknown>): void;
/**
 * Sets a deeply-nested key to `value`, creating intermediate objects as
 * needed. Preserves sibling keys at every level.
 *
 * Example: `setNestedJson('settings.json', ['env', 'OMC_MODE'], 'on')` matches
 * `jq '.env.OMC_MODE = "on"' settings.json`.
 *
 * If the file is missing or corrupted, starts fresh with `{}`.
 * Throws if `keyPath` is empty.
 */
export declare function setNestedJson(path: string, keyPath: string[], value: unknown): void;
export interface MergeOmcConfigOptions {
    /**
     * Override the config directory (e.g. `~/.claude`). Defaults to
     * `getClaudeConfigDir()`. Exposed so tests can point at a tmpdir.
     */
    configDir?: string;
    /**
     * Present for symmetry with the phase2 call site, which may want to scope
     * the merge to a per-project `.omc-config.json` in the future. Currently
     * unused — global config remains the single source of truth.
     */
    cwd?: string;
}
/**
 * Shallow-merge a patch into `[$CLAUDE_CONFIG_DIR|~/.claude]/.omc-config.json`.
 * Re-reads the file on every call — callers MUST NOT cache the previous
 * contents between phases, because `install()` may have written intermediate
 * changes (see phase2-configure.ts "install() + runSetup double-write" risk).
 */
export declare function mergeOmcConfig(patch: Record<string, unknown>, opts?: MergeOmcConfigOptions): void;
export interface MergeSettingsJsonOptions {
    /** Override the config directory. Defaults to `getClaudeConfigDir()`. */
    configDir?: string;
}
/**
 * Shallow-merge a patch into `[$CLAUDE_CONFIG_DIR|~/.claude]/settings.json`.
 * Re-reads on every call (same reasoning as `mergeOmcConfig`).
 *
 * This is the Claude Code settings file — it contains user-authored keys
 * that `omc setup` must preserve (themes, permissions, model overrides).
 * The shallow merge semantics match the bash shim's `jq '. + {...}'`.
 */
export declare function mergeSettingsJson(patch: Record<string, unknown>, opts?: MergeSettingsJsonOptions): void;
//# sourceMappingURL=config-writer.d.ts.map