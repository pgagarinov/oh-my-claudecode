/**
 * Phase 3 glue — plugin verification + MCP install + teams config.
 *
 * Sequence (from plan "Phase 2 / 3 / 4 glue" section):
 *   1. Plugin verification: grep `<configDir>/settings.json` for the
 *      string `oh-my-claudecode`. Emit a status line either way.
 *   2. MCP install when `options.mcp.enabled`: delegate to
 *      `installMcpServers()` from `../mcp-install.js` (worker-2) with
 *      `--scope user` always, passing through servers, credentials,
 *      onMissingCredentials, and `options.interactive`.
 *   3. Teams config when `options.teams.enabled`:
 *        - Write `env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS = "1"` into
 *          `settings.json` via `config-writer.ts` (preserving existing
 *          `env` keys — the helper deep-merges `env`).
 *        - Write `teammateMode` into `settings.json` when `displayMode`
 *          is not the auto default.
 *        - Write `team.{maxAgents,defaultAgentType,monitorIntervalMs,
 *          shutdownTimeoutMs}` into `.omc-config.json` via
 *          `mergeOmcConfig`. Timing intervals are fixed defaults for now.
 *
 * Pure function: no module-level side effects. All stdout via injected
 * logger; errors propagate via throw.
 */
import { installMcpServers as realInstallMcpServers } from '../mcp-install.js';
import { mergeOmcConfig as realMergeOmcConfig, mergeSettingsJson as realMergeSettingsJson } from '../config-writer.js';
import type { SetupOptions } from '../options.js';
export type Logger = (line: string) => void;
/** Structured result surfaced to runSetup + phase4. */
export interface Phase3Result {
    pluginVerified: boolean;
    mcpInstalled: string[];
    mcpSkipped: string[];
    teamsConfigured: boolean;
}
export interface Phase3Deps {
    /** Test seam: replace the MCP installer. Matches `installMcpServers`. */
    installMcpServers?: typeof realInstallMcpServers;
    /** Test seam: replace the `.omc-config.json` writer. */
    mergeOmcConfig?: typeof realMergeOmcConfig;
    /** Test seam: replace the `settings.json` writer. */
    mergeSettingsJson?: typeof realMergeSettingsJson;
    /** Override the config directory (tmpdir isolation). */
    configDir?: string;
    /** Override cwd (plumbed through to `mergeOmcConfig`). */
    cwd?: string;
}
/**
 * Run Phase 3 — plugin verification + MCP + teams config.
 *
 * Returns a structured result so runSetup can aggregate for the welcome
 * message (phase 4) and any post-phase diagnostics.
 */
export declare function runPhase3(options: SetupOptions, logger: Logger, deps?: Phase3Deps): Promise<Phase3Result>;
//# sourceMappingURL=phase3-integrations.d.ts.map