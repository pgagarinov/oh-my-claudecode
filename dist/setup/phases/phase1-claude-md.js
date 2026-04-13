/**
 * Phase 1 glue — CLAUDE.md install / merge.
 *
 * Thin wrapper around `installClaudeMd()` from `../claude-md.js`. Derives
 * `mode` and `installStyle` from the resolved SetupOptions, calls the
 * ported installer, and returns the subset of its result that phase 4
 * needs for the welcome message display.
 *
 * Pure function: no module-level side effects. All stdout goes through
 * the injected logger; errors propagate via throw.
 *
 * Plan reference: "Phase 2 / 3 / 4 glue" in replicated-mixing-wren.md.
 */
import { installClaudeMd, } from '../claude-md.js';
/**
 * Run Phase 1 — install or merge CLAUDE.md.
 *
 * Throws on any install failure (invalid mode, corrupted source, symlink
 * target, etc.) — the caller (`runSetup`) is responsible for surfacing
 * the error and deciding whether to continue to Phase 2.
 */
export async function runPhase1(options, logger, deps = {}) {
    const installFn = deps.installClaudeMd ?? installClaudeMd;
    const result = await installFn({
        mode: options.target,
        installStyle: options.installStyle,
        logger,
        configDir: deps.configDir,
        cwd: deps.cwd,
        pluginRoot: deps.pluginRoot,
        fetchImpl: deps.fetchImpl,
    });
    return {
        mode: result.mode,
        installStyle: result.installStyle,
        targetPath: result.targetPath,
        backupPath: result.backupPath,
        oldVersion: result.oldVersion,
        newVersion: result.newVersion,
    };
}
//# sourceMappingURL=phase1-claude-md.js.map