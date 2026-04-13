/**
 * OMC Uninstaller
 *
 * Reverses what `install()` does: removes agents, skills, hooks, HUD, state
 * files, and cleans up CLAUDE.md and settings.json hook entries.
 *
 * Design constraints:
 *   - Never removes entire directories blindly; checks for OMC ownership first.
 *   - Idempotent: second call on a clean directory returns removed:[], no errors.
 *   - Does NOT read module-level CLAUDE_CONFIG_DIR const; always uses the
 *     explicit `configDir` argument so tests can pass a tmpdir.
 */
export interface UninstallOptions {
    /** Defaults to getClaudeConfigDir(). */
    configDir?: string;
    /** List what would be removed without actually removing anything. */
    dryRun?: boolean;
    /**
     * Preserve user content outside OMC markers in CLAUDE.md.
     * Default: true.
     */
    preserveUserContent?: boolean;
    logger?: (msg: string) => void;
}
export interface UninstallResult {
    /** Absolute paths of files/dirs actually removed (or would be, in dryRun). */
    removed: string[];
    /** Absolute paths of files preserved (e.g. CLAUDE.md with user content). */
    preserved: string[];
    /** Absolute paths that didn't exist — idempotent no-ops. */
    skipped: string[];
    warnings: string[];
}
export declare function uninstall(opts?: UninstallOptions): UninstallResult;
//# sourceMappingURL=uninstall.d.ts.map