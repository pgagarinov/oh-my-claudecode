/**
 * Setup options — typed SetupOptions, flag parser, env var reader,
 * preset loader, and resolveOptions(precedence: flags > env > preset > defaults).
 *
 * All pure functions except `loadPreset`, which reads a JSON file from disk.
 *
 * Plan reference: /Users/peter/.claude-personal/plans/replicated-mixing-wren.md
 *   — "Core types (src/setup/options.ts)"
 *   — "CLI: omc setup"
 *   — Illegal combinations X1–X12 in scenario matrix.
 */
import { z } from 'zod';
import type { InstallOptions } from '../installer/index.js';
import type { HudElementConfig } from '../hud/types.js';
export type SetupPhase = 'claude-md' | 'infra' | 'integrations' | 'welcome' | 'mcp-only' | 'state';
export interface McpCustomSpec {
    name: string;
    command?: string;
    args?: string[];
    url?: string;
    transport?: 'stdio' | 'http';
    env?: Record<string, string>;
    headers?: Record<string, string>;
}
export type McpServerEntry = 'context7' | 'exa' | 'filesystem' | 'github' | {
    name: string;
    spec: McpCustomSpec;
};
export type StateAction = {
    op: 'save';
    step: number;
    configType: string;
} | {
    op: 'clear';
} | {
    op: 'resume';
} | {
    op: 'complete';
    version: string;
};
export interface SetupOptions {
    phases: Set<SetupPhase>;
    interactive: boolean;
    force: boolean;
    quiet: boolean;
    presetFile?: string;
    target: 'local' | 'global';
    installStyle: 'overwrite' | 'preserve';
    installCli: boolean;
    executionMode?: 'ultrawork' | 'ralph' | 'autopilot';
    taskTool?: 'builtin' | 'bd' | 'br';
    skipHud: boolean;
    mcp: {
        enabled: boolean;
        servers: McpServerEntry[];
        credentials: {
            exa?: string;
            github?: string;
            filesystem?: string[];
        };
        /**
         * Policy when a credentialed MCP server (exa, github, custom with `-e`)
         * has no credentials available:
         *   - 'skip'                : leave the server out of config entirely.
         *   - 'error'               : throw McpCredentialMissingError.
         *   - 'install-without-auth': install the server WITHOUT the `-e` flag
         *       so it's visible-but-broken via `claude mcp list` and can be
         *       fixed later by adding credentials. Servers with no credentials
         *       required (context7, filesystem) behave identically to normal.
         */
        onMissingCredentials: 'skip' | 'error' | 'install-without-auth';
        scope: 'local' | 'user' | 'project';
    };
    teams: {
        enabled: boolean;
        displayMode: 'auto' | 'in-process' | 'tmux';
        agentCount: 2 | 3 | 5;
        agentType: 'executor' | 'debugger' | 'designer';
    };
    starRepo: boolean;
    /**
     * Optional HUD element config patch. When present, phase4 shallow-merges
     * `hud.elements` into `<configDir>/.omc-config.json` under the
     * `hud.elements` key. Only the keys supplied are written — unknown keys
     * in the file are preserved. Omit entirely to skip HUD configuration.
     */
    hud?: {
        elements: Partial<HudElementConfig>;
    };
    stateAction?: StateAction;
    checkState?: boolean;
    installerOptions: InstallOptions;
}
export declare class InvalidOptionsError extends Error {
    constructor(message: string);
}
/**
 * Built-in defaults (lowest precedence). Bare `omc setup` → phases={'infra'}
 * matches today's behavior byte-for-byte.
 */
export declare const DEFAULTS: SetupOptions;
export interface QuestionOption {
    label: string;
    description: string;
}
export interface QuestionSpec {
    question: string;
    options: QuestionOption[];
    default: unknown;
}
export declare const QUESTION_METADATA: Record<string, QuestionSpec>;
declare const presetSchema: z.ZodObject<{
    phases: z.ZodOptional<z.ZodArray<z.ZodEnum<["claude-md", "infra", "integrations", "welcome", "mcp-only", "state"]>, "many">>;
    force: z.ZodOptional<z.ZodBoolean>;
    quiet: z.ZodOptional<z.ZodBoolean>;
    target: z.ZodOptional<z.ZodEnum<["local", "global"]>>;
    installStyle: z.ZodOptional<z.ZodEnum<["overwrite", "preserve"]>>;
    installCli: z.ZodOptional<z.ZodBoolean>;
    executionMode: z.ZodOptional<z.ZodEnum<["ultrawork", "ralph", "autopilot"]>>;
    taskTool: z.ZodOptional<z.ZodEnum<["builtin", "bd", "br"]>>;
    skipHud: z.ZodOptional<z.ZodBoolean>;
    mcp: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        servers: z.ZodOptional<z.ZodArray<z.ZodType<McpServerEntry, z.ZodTypeDef, McpServerEntry>, "many">>;
        credentials: z.ZodOptional<z.ZodObject<{
            exa: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            filesystem: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            exa?: string | undefined;
            github?: string | undefined;
            filesystem?: string[] | undefined;
        }, {
            exa?: string | undefined;
            github?: string | undefined;
            filesystem?: string[] | undefined;
        }>>;
        onMissingCredentials: z.ZodOptional<z.ZodEnum<["skip", "error", "install-without-auth"]>>;
        scope: z.ZodOptional<z.ZodEnum<["local", "user", "project"]>>;
    }, "strip", z.ZodTypeAny, {
        enabled?: boolean | undefined;
        scope?: "user" | "project" | "local" | undefined;
        onMissingCredentials?: "error" | "skip" | "install-without-auth" | undefined;
        servers?: McpServerEntry[] | undefined;
        credentials?: {
            exa?: string | undefined;
            github?: string | undefined;
            filesystem?: string[] | undefined;
        } | undefined;
    }, {
        enabled?: boolean | undefined;
        scope?: "user" | "project" | "local" | undefined;
        onMissingCredentials?: "error" | "skip" | "install-without-auth" | undefined;
        servers?: McpServerEntry[] | undefined;
        credentials?: {
            exa?: string | undefined;
            github?: string | undefined;
            filesystem?: string[] | undefined;
        } | undefined;
    }>>;
    teams: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        displayMode: z.ZodOptional<z.ZodEnum<["auto", "in-process", "tmux"]>>;
        agentCount: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodLiteral<5>]>>;
        agentType: z.ZodOptional<z.ZodEnum<["executor", "debugger", "designer"]>>;
    }, "strip", z.ZodTypeAny, {
        enabled?: boolean | undefined;
        agentType?: "designer" | "executor" | "debugger" | undefined;
        displayMode?: "auto" | "tmux" | "in-process" | undefined;
        agentCount?: 2 | 3 | 5 | undefined;
    }, {
        enabled?: boolean | undefined;
        agentType?: "designer" | "executor" | "debugger" | undefined;
        displayMode?: "auto" | "tmux" | "in-process" | undefined;
        agentCount?: 2 | 3 | 5 | undefined;
    }>>;
    starRepo: z.ZodOptional<z.ZodBoolean>;
    hud: z.ZodOptional<z.ZodObject<{
        elements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        elements?: Record<string, unknown> | undefined;
    }, {
        elements?: Record<string, unknown> | undefined;
    }>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    phases: z.ZodOptional<z.ZodArray<z.ZodEnum<["claude-md", "infra", "integrations", "welcome", "mcp-only", "state"]>, "many">>;
    force: z.ZodOptional<z.ZodBoolean>;
    quiet: z.ZodOptional<z.ZodBoolean>;
    target: z.ZodOptional<z.ZodEnum<["local", "global"]>>;
    installStyle: z.ZodOptional<z.ZodEnum<["overwrite", "preserve"]>>;
    installCli: z.ZodOptional<z.ZodBoolean>;
    executionMode: z.ZodOptional<z.ZodEnum<["ultrawork", "ralph", "autopilot"]>>;
    taskTool: z.ZodOptional<z.ZodEnum<["builtin", "bd", "br"]>>;
    skipHud: z.ZodOptional<z.ZodBoolean>;
    mcp: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        servers: z.ZodOptional<z.ZodArray<z.ZodType<McpServerEntry, z.ZodTypeDef, McpServerEntry>, "many">>;
        credentials: z.ZodOptional<z.ZodObject<{
            exa: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            filesystem: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            exa?: string | undefined;
            github?: string | undefined;
            filesystem?: string[] | undefined;
        }, {
            exa?: string | undefined;
            github?: string | undefined;
            filesystem?: string[] | undefined;
        }>>;
        onMissingCredentials: z.ZodOptional<z.ZodEnum<["skip", "error", "install-without-auth"]>>;
        scope: z.ZodOptional<z.ZodEnum<["local", "user", "project"]>>;
    }, "strip", z.ZodTypeAny, {
        enabled?: boolean | undefined;
        scope?: "user" | "project" | "local" | undefined;
        onMissingCredentials?: "error" | "skip" | "install-without-auth" | undefined;
        servers?: McpServerEntry[] | undefined;
        credentials?: {
            exa?: string | undefined;
            github?: string | undefined;
            filesystem?: string[] | undefined;
        } | undefined;
    }, {
        enabled?: boolean | undefined;
        scope?: "user" | "project" | "local" | undefined;
        onMissingCredentials?: "error" | "skip" | "install-without-auth" | undefined;
        servers?: McpServerEntry[] | undefined;
        credentials?: {
            exa?: string | undefined;
            github?: string | undefined;
            filesystem?: string[] | undefined;
        } | undefined;
    }>>;
    teams: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        displayMode: z.ZodOptional<z.ZodEnum<["auto", "in-process", "tmux"]>>;
        agentCount: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodLiteral<5>]>>;
        agentType: z.ZodOptional<z.ZodEnum<["executor", "debugger", "designer"]>>;
    }, "strip", z.ZodTypeAny, {
        enabled?: boolean | undefined;
        agentType?: "designer" | "executor" | "debugger" | undefined;
        displayMode?: "auto" | "tmux" | "in-process" | undefined;
        agentCount?: 2 | 3 | 5 | undefined;
    }, {
        enabled?: boolean | undefined;
        agentType?: "designer" | "executor" | "debugger" | undefined;
        displayMode?: "auto" | "tmux" | "in-process" | undefined;
        agentCount?: 2 | 3 | 5 | undefined;
    }>>;
    starRepo: z.ZodOptional<z.ZodBoolean>;
    hud: z.ZodOptional<z.ZodObject<{
        elements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        elements?: Record<string, unknown> | undefined;
    }, {
        elements?: Record<string, unknown> | undefined;
    }>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    phases: z.ZodOptional<z.ZodArray<z.ZodEnum<["claude-md", "infra", "integrations", "welcome", "mcp-only", "state"]>, "many">>;
    force: z.ZodOptional<z.ZodBoolean>;
    quiet: z.ZodOptional<z.ZodBoolean>;
    target: z.ZodOptional<z.ZodEnum<["local", "global"]>>;
    installStyle: z.ZodOptional<z.ZodEnum<["overwrite", "preserve"]>>;
    installCli: z.ZodOptional<z.ZodBoolean>;
    executionMode: z.ZodOptional<z.ZodEnum<["ultrawork", "ralph", "autopilot"]>>;
    taskTool: z.ZodOptional<z.ZodEnum<["builtin", "bd", "br"]>>;
    skipHud: z.ZodOptional<z.ZodBoolean>;
    mcp: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        servers: z.ZodOptional<z.ZodArray<z.ZodType<McpServerEntry, z.ZodTypeDef, McpServerEntry>, "many">>;
        credentials: z.ZodOptional<z.ZodObject<{
            exa: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            filesystem: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            exa?: string | undefined;
            github?: string | undefined;
            filesystem?: string[] | undefined;
        }, {
            exa?: string | undefined;
            github?: string | undefined;
            filesystem?: string[] | undefined;
        }>>;
        onMissingCredentials: z.ZodOptional<z.ZodEnum<["skip", "error", "install-without-auth"]>>;
        scope: z.ZodOptional<z.ZodEnum<["local", "user", "project"]>>;
    }, "strip", z.ZodTypeAny, {
        enabled?: boolean | undefined;
        scope?: "user" | "project" | "local" | undefined;
        onMissingCredentials?: "error" | "skip" | "install-without-auth" | undefined;
        servers?: McpServerEntry[] | undefined;
        credentials?: {
            exa?: string | undefined;
            github?: string | undefined;
            filesystem?: string[] | undefined;
        } | undefined;
    }, {
        enabled?: boolean | undefined;
        scope?: "user" | "project" | "local" | undefined;
        onMissingCredentials?: "error" | "skip" | "install-without-auth" | undefined;
        servers?: McpServerEntry[] | undefined;
        credentials?: {
            exa?: string | undefined;
            github?: string | undefined;
            filesystem?: string[] | undefined;
        } | undefined;
    }>>;
    teams: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        displayMode: z.ZodOptional<z.ZodEnum<["auto", "in-process", "tmux"]>>;
        agentCount: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodLiteral<5>]>>;
        agentType: z.ZodOptional<z.ZodEnum<["executor", "debugger", "designer"]>>;
    }, "strip", z.ZodTypeAny, {
        enabled?: boolean | undefined;
        agentType?: "designer" | "executor" | "debugger" | undefined;
        displayMode?: "auto" | "tmux" | "in-process" | undefined;
        agentCount?: 2 | 3 | 5 | undefined;
    }, {
        enabled?: boolean | undefined;
        agentType?: "designer" | "executor" | "debugger" | undefined;
        displayMode?: "auto" | "tmux" | "in-process" | undefined;
        agentCount?: 2 | 3 | 5 | undefined;
    }>>;
    starRepo: z.ZodOptional<z.ZodBoolean>;
    hud: z.ZodOptional<z.ZodObject<{
        elements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        elements?: Record<string, unknown> | undefined;
    }, {
        elements?: Record<string, unknown> | undefined;
    }>>;
}, z.ZodTypeAny, "passthrough">>;
export type PresetFile = z.infer<typeof presetSchema>;
/**
 * Reads known env vars into a Partial<SetupOptions>.
 *
 * Supported env vars:
 *   EXA_API_KEY                       → mcp.credentials.exa
 *   GITHUB_TOKEN                      → mcp.credentials.github
 *   OMC_SETUP_EXECUTION_MODE          → executionMode
 *   OMC_SETUP_TASK_TOOL               → taskTool
 *   OMC_SETUP_INSTALL_CLI             → installCli (boolean-like)
 *   OMC_SETUP_MCP_ENABLED             → mcp.enabled
 *   OMC_SETUP_TEAMS_ENABLED           → teams.enabled
 *   OMC_SETUP_TEAMS_DISPLAY_MODE      → teams.displayMode
 *   OMC_SETUP_TEAMS_AGENT_COUNT       → teams.agentCount
 *   OMC_SETUP_TEAMS_AGENT_TYPE        → teams.agentType
 *   OMC_SETUP_TARGET                  → target
 *   OMC_SETUP_INSTALL_STYLE           → installStyle
 *   OMC_SETUP_STAR_REPO               → starRepo
 *   OMC_SETUP_MCP_ON_MISSING_CREDS    → mcp.onMissingCredentials
 *   OMC_SETUP_MCP_SCOPE               → mcp.scope
 */
export declare function readEnvPartial(env?: NodeJS.ProcessEnv): Partial<SetupOptions>;
/**
 * Loads and validates a JSON preset file.
 * Throws InvalidOptionsError on missing file (X8) or invalid JSON / schema (X9).
 * Unknown keys are preserved (passthrough).
 */
export declare function loadPreset(path: string): Partial<SetupOptions>;
/**
 * Parse CLI flags into a Partial<SetupOptions>. Does NOT apply defaults,
 * env vars, or preset merging — that's `resolveOptions`'s job.
 *
 * Uses `commander` in standalone (non-process-exiting) mode so it's safe
 * to call from test code and from subcommand dispatchers.
 */
export declare function parseFlagsToPartial(argv: string[]): Partial<SetupOptions>;
/**
 * Convert commander-parsed setup options into a Partial<SetupOptions>.
 *
 * Used by the CLI action handler (which has already let commander parse
 * the outer argv) to skip the double-parse that `parseFlagsToPartial()`
 * would otherwise do. Callers pass `cmd.opts()` directly. Commander
 * normalizes negated flags like `--no-plugin` into `{ plugin: false }`,
 * so the caller's opts object is morphologically identical to `RawFlags`
 * (with the extra `plugin`/`mcp`/`teams`/`installCli`/`starRepo` boolean
 * keys that commander synthesizes for the `--no-*` pairs).
 */
export declare function mapSetupCommanderOpts(opts: unknown): Partial<SetupOptions>;
export interface ResolveContext {
    env?: NodeJS.ProcessEnv;
    /** Whether stdin is a TTY. Defaults to `process.stdin.isTTY`. */
    isTTY?: boolean;
}
/**
 * Merges flags > env > preset > defaults, derives `phases`, and validates
 * X1–X12 illegal combinations.
 *
 * @param flags   parsed CLI flags (Partial<SetupOptions>) from parseFlagsToPartial
 * @param preset  optional Partial<SetupOptions> loaded from a preset file
 * @param ctx     env/tty overrides (for testing)
 */
export declare function resolveOptions(flags: Partial<SetupOptions>, preset?: Partial<SetupOptions>, ctx?: ResolveContext): SetupOptions;
export {};
//# sourceMappingURL=options.d.ts.map