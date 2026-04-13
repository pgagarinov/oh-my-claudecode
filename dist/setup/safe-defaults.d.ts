/**
 * SAFE_DEFAULTS — opinionated out-of-the-box preset used by bare `omc setup`.
 *
 * Separate from DEFAULTS (in ./options.ts) on purpose:
 *   - DEFAULTS is the *minimal-fields fallback* used by programmatic callers
 *     that explicitly want "infra-only, no surprises". It pins the legacy
 *     pre-safe-defaults contract so automation that drives the setup API
 *     directly never regresses.
 *   - SAFE_DEFAULTS is the *user-friendly out-of-box experience* the CLI
 *     wires in when the user types `omc setup` with no opt-in phase flags.
 *     It enables CLAUDE.md, infra, integrations, welcome, a curated MCP
 *     server list with install-without-auth fallback, sane team defaults,
 *     repo star prompt, and a HUD element config that turns on cwd, git
 *     branch, git status, and session health while disabling progress bars.
 *
 * The CLI may also expose SAFE_DEFAULTS via `omc setup --dump-safe-defaults`
 * so users can copy-and-tweak the JSON into a custom preset file.
 */
import type { SetupOptions } from './options.js';
/**
 * Canonical safe-defaults preset. Frozen at the top level (nested `Set` and
 * object fields are cloned by callers that need to mutate — see tests).
 */
export declare const SAFE_DEFAULTS: SetupOptions;
/**
 * Serialize SAFE_DEFAULTS to a JSON string suitable for `omc setup
 * --dump-safe-defaults > my-preset.json`. Phases are emitted as an array
 * (not a Set) so the output round-trips through `loadPreset()`.
 */
export declare function dumpSafeDefaultsAsJson(): string;
//# sourceMappingURL=safe-defaults.d.ts.map