/**
 * Phase 2 glue — infrastructure install + preference writes.
 *
 * Sequence (from plan "Phase 2 / 3 / 4 glue" section):
 *   1. Call `install()` from src/installer/index.ts with
 *      `options.installerOptions` pass-through.
 *   2. Write preferences to `<configDir>/.omc-config.json` via
 *      `config-writer.ts` (provided by worker-2):
 *        - `defaultExecutionMode` when `options.executionMode` is set
 *        - `taskTool` + `taskToolConfig` when `options.taskTool` is set
 *        - `configuredAt` ISO timestamp (always)
 *   3. Optionally `npm install -g oh-my-claude-sisyphus` when
 *      `options.installCli` is true. Failures are warnings, not fatal.
 *      Skipped entirely in plugin-dir mode.
 *
 * Non-regression (Risks table row "install() + runSetup double-write"):
 * after `install()` returns, phase2 MUST NOT cache the settings.json
 * contents. `mergeOmcConfig` re-reads the file fresh on each call, so
 * we rely on the helper's behavior and simply don't pass through stale
 * state. Documented here so future readers don't "optimize" it away.
 *
 * Pure function: no module-level side effects. All stdout goes through
 * the injected logger. Fatal errors (install() fails) throw.
 */
import { type InstallOptions, type InstallResult } from '../../installer/index.js';
import { mergeOmcConfig as realMergeOmcConfig } from '../config-writer.js';
import type { SetupOptions } from '../options.js';
export type Logger = (line: string) => void;
export type Phase2ExecFileFn = (file: string, args: readonly string[], options?: {
    stdio?: 'inherit' | 'pipe' | 'ignore';
}) => Buffer | string;
export interface Phase2Deps {
    /** Test seam: replace the installer invocation. */
    install?: (opts?: InstallOptions) => InstallResult;
    /** Test seam: replace the config-writer helper. */
    mergeOmcConfig?: typeof realMergeOmcConfig;
    /** Test seam: replace `execFileSync` (used for `npm install -g ...`). */
    execFileSync?: Phase2ExecFileFn;
    /** Test seam: clock override for deterministic `configuredAt`. */
    now?: () => Date;
    /** Forwarded to `mergeOmcConfig` (test-only config root override). */
    configDir?: string;
    /** Forwarded to `mergeOmcConfig` (test-only cwd override). */
    cwd?: string;
}
/**
 * Run Phase 2 — install infra + write preferences + optional CLI install.
 *
 * Throws if `install()` reports `success: false` — the caller decides
 * whether to halt or continue.
 */
export declare function runPhase2(options: SetupOptions, logger: Logger, deps?: Phase2Deps): Promise<void>;
//# sourceMappingURL=phase2-configure.d.ts.map