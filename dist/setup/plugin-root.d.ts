/**
 * Active plugin-root resolution.
 *
 * TypeScript port of `resolve_active_plugin_root()` from
 * scripts/setup-claude-md.sh:22-89. Handles a stale `CLAUDE_PLUGIN_ROOT`
 * that can occur when a session was started before a plugin update
 * (e.g. a 4.8.2 session invoking setup after upgrading to 4.9.0).
 */
export interface ResolveActivePluginRootOptions {
    /** Override `CLAUDE_CONFIG_DIR` (primarily for tests). */
    configDir?: string;
    /**
     * Override the last-resort plugin root. `dirname(scriptDir)` is also used as
     * the cache base for the stale-version check and the fallback sibling scan.
     */
    scriptDir?: string;
}
/**
 * Resolve the active OMC plugin root directory.
 *
 * 1. Read `<configDir>/plugins/installed_plugins.json`, find the
 *    `oh-my-claudecode*` entry, and read its `installPath`.
 * 2. If that install path is valid (exists and contains `docs/CLAUDE.md`):
 *    check `dirname(scriptDir)` for a newer valid semver cache entry and
 *    prefer it over the `installed_plugins.json` entry — the 4.8.2 → 4.9.0
 *    stale-cache upgrade guard.
 * 3. Otherwise scan sibling version directories of `scriptDir` and return
 *    the newest valid version.
 * 4. Last resort: return `scriptDir` itself.
 */
export declare function resolveActivePluginRoot(opts?: ResolveActivePluginRootOptions): string;
//# sourceMappingURL=plugin-root.d.ts.map