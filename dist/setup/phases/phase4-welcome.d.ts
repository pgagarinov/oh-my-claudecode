/**
 * Phase 4 glue — welcome message + optional gh star + completion marker.
 *
 * Sequence (from plan "Phase 2 / 3 / 4 glue" section):
 *   1. Detect whether this is a new install or a 2.x upgrade by reading
 *      `<configDir>/.omc-config.json` and checking whether `setupVersion`
 *      starts with `"2."`. The caller may also pass a pre-computed value
 *      via `context.isUpgrade` to bypass detection (runSetup does this to
 *      keep phase ordering explicit).
 *   2. Log one of two welcome templates (new-user vs upgrade-from-2.x).
 *      Templates are ported byte-compatible from
 *      `skills/omc-setup/phases/04-welcome.md`.
 *   3. If `options.starRepo: true`, try `gh repo star
 *      Yeachan-Heo/oh-my-claudecode` via `execFileSync`. Silent fallback
 *      when `gh` is missing or the user isn't authenticated — never block
 *      setup completion on a star attempt (matches the bash skill).
 *   4. Call `completeSetup(version)` from `../state.js` to mark completion
 *      in `.omc-config.json` and clean up session state files.
 *
 * Pure function: no module-level side effects. All stdout via the
 * injected logger.
 */
import type { HudElementConfig } from '../../hud/types.js';
import type { SetupOptions } from '../options.js';
import type { Phase1Result } from './phase1-claude-md.js';
export type Logger = (line: string) => void;
export interface Phase4Context {
    /** Pre-computed upgrade flag. If undefined, phase4 auto-detects. */
    isUpgrade?: boolean;
    /** Optional Phase 1 result (unused today, reserved for future). */
    phase1Result?: Phase1Result;
}
export interface Phase4Deps {
    /** Test seam: replace the completeSetup state helper. */
    completeSetup?: (version: string, opts?: {
        cwd?: string;
        configDir?: string;
        logger?: (msg: string) => void;
    }) => void;
    /** Test seam: replace `execFileSync` (used for `gh repo star ...`). */
    execFileSync?: (file: string, args: readonly string[], options?: {
        stdio?: 'inherit' | 'pipe' | 'ignore';
    }) => Buffer | string;
    /** Test seam: replace the HUD element config writer. */
    writeHudConfig?: (elements: Partial<HudElementConfig>, opts?: {
        configDir?: string;
    }) => void;
    /** Override the config directory. */
    configDir?: string;
    /** Override cwd. */
    cwd?: string;
    /** Override the version string written into `.omc-config.json`. */
    version?: string;
}
/**
 * Read `.omc-config.json` and return whether this looks like an upgrade
 * from a 2.x install. Exported so runSetup can compute `isUpgrade` before
 * Phase 1 writes fresh version markers, then pass it through to Phase 4.
 *
 * Any read/parse error → treated as "not an upgrade" (safer default:
 * show the new-user welcome rather than implying stale 2.x state).
 */
export declare function detectIsUpgrade(configDir: string): boolean;
/**
 * Run Phase 4 — welcome message, optional gh star, completion marker.
 */
export declare function runPhase4(options: SetupOptions, logger: Logger, context?: Phase4Context, deps?: Phase4Deps): Promise<void>;
//# sourceMappingURL=phase4-welcome.d.ts.map