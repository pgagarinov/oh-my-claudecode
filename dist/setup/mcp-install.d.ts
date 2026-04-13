/**
 * MCP server installer — wraps `claude mcp add` for the setup flow.
 *
 * Plan reference: /Users/peter/.claude-personal/plans/replicated-mixing-wren.md
 *   — "MCP install port (`src/setup/mcp-install.ts`)"
 *   — "Pre-implementation blockers" (MCP empty-env and --scope findings)
 *
 * Critical invariants (verified by unit tests):
 *   1. **ALWAYS** pass `--scope <value>` (default `user`). Omitting it falls
 *      back to the `local` scope which is project-specific and mostly not
 *      what the user wants during an interactive setup.
 *   2. **NEVER** install with empty env values (`-e KEY=`). The Commander-based
 *      arg parser inside `claude mcp add` mis-identifies the empty value as
 *      the server name and rejects the call. Missing credentials must be
 *      skipped (default) or raised as `McpCredentialMissingError`.
 *   3. Credentials resolved interactively via `prompter.askSecret` — a blank
 *      response is equivalent to "skip this server".
 */
import type { SetupOptions } from './options.js';
import type { Prompter } from './prompts.js';
export interface McpInstallResult {
    installed: string[];
    skippedDueToMissingCreds: string[];
    /**
     * Servers installed WITHOUT credentials under `install-without-auth`
     * mode. They are visible in `claude mcp list` but will fail at runtime
     * until credentials are added. A subset of `installed`.
     */
    installedWithoutAuth: string[];
    failed: Array<{
        name: string;
        error: string;
    }>;
}
export type ExecFileFn = (file: string, args: readonly string[], options?: {
    stdio?: 'inherit' | 'pipe' | 'ignore';
    encoding?: 'utf-8';
}) => Buffer | string;
export interface McpInstallOptions {
    interactive: boolean;
    /**
     * Policy when a credentialed MCP server has no credential available:
     *   - 'skip'                : leave it out of config entirely.
     *   - 'error'               : throw McpCredentialMissingError.
     *   - 'install-without-auth': install the server WITHOUT the `-e` flag
     *       so it's visible-but-broken in `claude mcp list`. For servers that
     *       need no credentials (context7, filesystem), this is equivalent to
     *       normal install.
     */
    onMissingCredentials: 'skip' | 'error' | 'install-without-auth';
    scope: 'local' | 'user' | 'project';
    prompter?: Prompter;
    execFile?: ExecFileFn;
    logger?: (msg: string) => void;
    /** Passed when the caller wants to opt into GitHub HTTP transport fallback. */
    githubHttpTransport?: boolean;
}
export declare class McpCredentialMissingError extends Error {
    readonly server: string;
    readonly envVar: string;
    constructor(server: string, envVar: string);
}
export declare function installMcpServers(servers: SetupOptions['mcp']['servers'], creds: SetupOptions['mcp']['credentials'], opts: McpInstallOptions): Promise<McpInstallResult>;
//# sourceMappingURL=mcp-install.d.ts.map