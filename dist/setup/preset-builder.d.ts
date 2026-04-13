/**
 * Pure `buildPreset(answers)` — converts raw AskUserQuestion answers
 * from the `omc-setup` skill into a fully-validated `SetupOptions` that
 * can be written as a JSON preset file.
 *
 * No filesystem I/O. Exhaustively unit-tested via the Group D scenarios.
 *
 * Plan reference: /Users/peter/.claude-personal/plans/replicated-mixing-wren.md
 *   — "Skill: `/oh-my-claudecode:omc-setup`" section (AnswersFile shape)
 *   — `src/setup/preset-builder.ts` rationale
 */
import { type McpCustomSpec, type SetupOptions } from './options.js';
export interface AnswersFile {
    target?: 'local' | 'global';
    installStyle?: 'overwrite' | 'preserve';
    executionMode?: 'ultrawork' | 'ralph' | 'autopilot';
    installCli?: boolean;
    taskTool?: 'builtin' | 'bd' | 'br';
    mcp?: {
        enabled: boolean;
        servers?: Array<string | {
            name: string;
            spec: McpCustomSpec;
        }>;
        credentials?: {
            exa?: string;
            github?: string;
            filesystem?: string[];
        };
        onMissingCredentials?: 'skip' | 'error' | 'install-without-auth';
    };
    teams?: {
        enabled: boolean;
        displayMode?: 'auto' | 'in-process' | 'tmux';
        agentCount?: number;
        agentType?: 'executor' | 'debugger' | 'designer';
    };
    starRepo?: boolean;
}
/**
 * Converts raw skill answers into a fully-resolved SetupOptions. Applies
 * defaults for missing fields. Throws InvalidOptionsError on invalid values
 * (e.g. `teams.agentCount: 4` — not in {2, 3, 5}).
 */
export declare function buildPreset(answers: AnswersFile): SetupOptions;
//# sourceMappingURL=preset-builder.d.ts.map