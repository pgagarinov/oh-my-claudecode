/**
 * HUD element config writer — merges a partial HudElementConfig patch into
 * `<configDir>/.omc-config.json` under the `hud.elements` key.
 *
 * Preserves any existing top-level keys in `.omc-config.json` (e.g.
 * `setupVersion`, `setupCompleted`, `executionMode`) via `mergeJsonShallow`
 * — we only rewrite the single `hud` key, and within that key we shallow-
 * merge `elements` so unrelated HUD settings the user might have authored
 * are retained.
 *
 * Called from phase 4 when `options.hud?.elements` is present. Also usable
 * standalone for tests or external scripts.
 */
import type { HudElementConfig } from '../hud/types.js';
export interface WriteHudConfigOptions {
    /** Override the config directory. Defaults to `getClaudeConfigDir()`. */
    configDir?: string;
}
/**
 * Shallow-merge `elements` into `<configDir>/.omc-config.json`'s
 * `hud.elements` object. Creates the file if missing; preserves all other
 * top-level keys and unrelated `hud.*` sub-keys.
 *
 * Safe to call with an empty patch (no-op write that still normalizes the
 * file to its current on-disk form).
 */
export declare function writeHudConfig(elements: Partial<HudElementConfig>, opts?: WriteHudConfigOptions): void;
//# sourceMappingURL=hud-config-writer.d.ts.map