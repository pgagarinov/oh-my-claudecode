/**
 * `runSetup()` — main entry point for `omc setup` and the setup skill.
 *
 * Owns:
 *   - Lockfile acquisition + signal-driven cleanup (plan: "Concurrent
 *     invocation is guarded by a hostname+PID lockfile").
 *   - Already-configured / resume pre-flight.
 *   - Phase dispatch (phase1 CLAUDE.md, phase2 infra, phase3 integrations,
 *     phase4 welcome) sequenced by `options.phases`.
 *   - State-machine sub-phase (`--state-*` flags) with JSON output on stdout.
 *   - MCP-only sub-phase (`--mcp-only`) for the `mcp-setup` skill wrapper.
 *   - Interactive prompter creation (readline on TTY, null sentinel otherwise).
 *   - Logger injection (console by default, suppressed under `--quiet`).
 *
 * Non-regression: when called with `phases={'infra'}` and no new flags, the
 * behavior is byte-identical to today's `install()` call — no CLAUDE.md
 * touch, no preference writes, no prompts. Pinned by
 * `src/installer/__tests__/cli-setup-backward-compat.test.ts`.
 */
import { install, type InstallOptions, type InstallResult, type StandaloneDuplicatesPreview } from '../installer/index.js';
import { type Invoker } from './lockfile.js';
import type { SetupOptions, SetupPhase } from './options.js';
import { type Prompter } from './prompts.js';
import { runPhase1, type Phase1Result } from './phases/phase1-claude-md.js';
import { runPhase2 } from './phases/phase2-configure.js';
import { runPhase3, type Phase3Result } from './phases/phase3-integrations.js';
import { runPhase4 } from './phases/phase4-welcome.js';
import { installMcpServers, type McpInstallResult } from './mcp-install.js';
export interface RunSetupResult {
    success: boolean;
    phasesRun: SetupPhase[];
    phaseResults: {
        phase1?: Phase1Result;
        phase3?: Phase3Result;
        mcpOnly?: McpInstallResult;
        state?: StateJsonOutput;
    };
    warnings: string[];
    errors: string[];
    /** Process exit code the CLI should surface. 0 on success, non-zero on error. */
    exitCode: number;
    /** True when phase 0b short-circuited because setup was already configured. */
    alreadyConfigured?: boolean;
    /**
     * Raw install() result surfaced for the bare-infra path so the CLI can
     * print today's summary (agent/command/skill counts, hook conflicts).
     * Only populated when the phases={'infra'} backward-compat branch runs.
     */
    installResult?: InstallResult;
    /**
     * Populated when `pluginLeftoverBehavior: 'ask'` is used and leftovers
     * were detected. The caller should render a preview, prompt, then call
     * `pruneStandaloneDuplicatesForPluginMode` if the user confirms.
     * Undefined when no leftovers exist or behavior is not 'ask'.
     */
    pluginLeftoverPreview?: StandaloneDuplicatesPreview;
}
export type StateJsonOutput = {
    ok: true;
} | {
    status: 'fresh';
} | {
    status: 'resume';
    lastStep: number;
    timestamp: string;
    configType: string;
} | {
    alreadyConfigured: boolean;
    setupVersion?: string;
    resumeStep?: number;
};
export interface RunSetupDeps {
    /** Override the `.omc/state/setup.lock` location. */
    lockPath?: string;
    /** Override the config dir (for phase 4 upgrade detection + completion). */
    configDir?: string;
    /** Override cwd (plumbed to state.ts for the state file). */
    cwd?: string;
    /** Override the invoker stamped into the lockfile. Defaults to `'cli'`. */
    invoker?: Invoker;
    /** Test seam: supply a prompter directly instead of creating one. */
    prompter?: Prompter;
    /** Test seam: replace phase functions individually. */
    phase1?: typeof runPhase1;
    phase2?: typeof runPhase2;
    phase3?: typeof runPhase3;
    phase4?: typeof runPhase4;
    /** Test seam: replace bare-`infra` install() to skip signal handlers. */
    install?: (opts?: InstallOptions) => ReturnType<typeof install>;
    /** Test seam: replace mcp-only installer. */
    installMcpServers?: typeof installMcpServers;
    /** Test seam: replace stdout/stderr sinks (used for state JSON output). */
    stdout?: (line: string) => void;
    /** Test seam: skip signal handler registration (prevents test pollution). */
    skipSignalHandlers?: boolean;
    /**
     * Controls how plugin-duplicate leftovers are handled when `alreadyConfigured`
     * is detected in phase 0b (wizard runs only):
     *   - 'auto' (default) — silently prune + log summary. Safe for non-TTY
     *     and library consumers.
     *   - 'ask' — run preview only; return `pluginLeftoverPreview` in the result
     *     so the caller can render a diff + prompt. No filesystem mutations.
     *   - 'skip' — do nothing with leftovers, just exit with alreadyConfigured.
     */
    pluginLeftoverBehavior?: 'auto' | 'ask' | 'skip';
}
export declare class AlreadyRunningError extends Error {
    constructor(message: string);
}
/**
 * Read `setupCompleted` / `setupVersion` from `.omc-config.json`.
 * Used by the phase 0b already-configured check.
 */
export declare function readAlreadyConfigured(configDir: string): {
    alreadyConfigured: boolean;
    setupVersion?: string;
};
/**
 * Run the full setup flow for the resolved `SetupOptions`.
 *
 * Top-level try/finally guarantees lockfile release even on error. Never
 * throws — wraps every error into `{ success: false, errors: [...] }` with
 * a non-zero `exitCode` so the CLI/skill can surface it uniformly.
 */
export declare function runSetup(options: SetupOptions, deps?: RunSetupDeps): Promise<RunSetupResult>;
//# sourceMappingURL=index.d.ts.map