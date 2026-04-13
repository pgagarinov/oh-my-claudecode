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
import { DEFAULTS, InvalidOptionsError, } from './options.js';
const VALID_TARGETS = new Set(['local', 'global']);
const VALID_INSTALL_STYLES = new Set(['overwrite', 'preserve']);
const VALID_EXEC_MODES = new Set([
    'ultrawork',
    'ralph',
    'autopilot',
]);
const VALID_TASK_TOOLS = new Set(['builtin', 'bd', 'br']);
const VALID_NAMED_MCP = new Set([
    'context7',
    'exa',
    'filesystem',
    'github',
]);
const VALID_TEAM_DISPLAY = new Set([
    'auto',
    'in-process',
    'tmux',
]);
const VALID_AGENT_TYPES = new Set([
    'executor',
    'debugger',
    'designer',
]);
const VALID_AGENT_COUNTS = new Set([2, 3, 5]);
function validateMcpServer(entry) {
    if (typeof entry === 'string') {
        if (!VALID_NAMED_MCP.has(entry)) {
            throw new InvalidOptionsError(`invalid MCP server name: ${entry}`);
        }
        return entry;
    }
    if (typeof entry === 'object' && entry !== null) {
        const obj = entry;
        if (typeof obj.name !== 'string' || typeof obj.spec !== 'object' || obj.spec === null) {
            throw new InvalidOptionsError(`invalid custom MCP server spec: expected { name: string, spec: McpCustomSpec }`);
        }
        const spec = obj.spec;
        if (typeof spec.name !== 'string') {
            throw new InvalidOptionsError(`invalid custom MCP server spec: spec.name must be a string`);
        }
        return { name: obj.name, spec: spec };
    }
    throw new InvalidOptionsError(`invalid MCP server entry: ${JSON.stringify(entry)}`);
}
/**
 * Converts raw skill answers into a fully-resolved SetupOptions. Applies
 * defaults for missing fields. Throws InvalidOptionsError on invalid values
 * (e.g. `teams.agentCount: 4` — not in {2, 3, 5}).
 */
export function buildPreset(answers) {
    // Phase 1: target / installStyle
    const target = answers.target ?? DEFAULTS.target;
    if (!VALID_TARGETS.has(target)) {
        throw new InvalidOptionsError(`invalid target: ${String(target)} (expected local|global)`);
    }
    const installStyle = answers.installStyle ?? DEFAULTS.installStyle;
    if (!VALID_INSTALL_STYLES.has(installStyle)) {
        throw new InvalidOptionsError(`invalid installStyle: ${String(installStyle)} (expected overwrite|preserve)`);
    }
    if (installStyle === 'preserve' && target !== 'global') {
        throw new InvalidOptionsError('installStyle=preserve only valid with target=global');
    }
    // Phase 2: executionMode / taskTool / installCli
    let executionMode;
    if (answers.executionMode !== undefined) {
        if (!VALID_EXEC_MODES.has(answers.executionMode)) {
            throw new InvalidOptionsError(`invalid executionMode: ${String(answers.executionMode)} (expected ultrawork|ralph|autopilot)`);
        }
        executionMode = answers.executionMode;
    }
    let taskTool;
    if (answers.taskTool !== undefined) {
        if (!VALID_TASK_TOOLS.has(answers.taskTool)) {
            throw new InvalidOptionsError(`invalid taskTool: ${String(answers.taskTool)} (expected builtin|bd|br)`);
        }
        taskTool = answers.taskTool;
    }
    const installCli = answers.installCli ?? DEFAULTS.installCli;
    if (typeof installCli !== 'boolean') {
        throw new InvalidOptionsError(`invalid installCli: expected boolean`);
    }
    // Phase 3: MCP
    const mcpEnabled = answers.mcp?.enabled ?? DEFAULTS.mcp.enabled;
    if (typeof mcpEnabled !== 'boolean') {
        throw new InvalidOptionsError('invalid mcp.enabled: expected boolean');
    }
    const mcpServers = (answers.mcp?.servers ?? []).map(validateMcpServer);
    const mcpCredentials = { ...(answers.mcp?.credentials ?? {}) };
    const mcpOnMissing = answers.mcp?.onMissingCredentials ?? DEFAULTS.mcp.onMissingCredentials;
    if (mcpOnMissing !== 'skip'
        && mcpOnMissing !== 'error'
        && mcpOnMissing !== 'install-without-auth') {
        throw new InvalidOptionsError(`invalid mcp.onMissingCredentials: ${String(mcpOnMissing)} (expected skip|error|install-without-auth)`);
    }
    // Phase 3: Teams
    const teamsEnabled = answers.teams?.enabled ?? DEFAULTS.teams.enabled;
    if (typeof teamsEnabled !== 'boolean') {
        throw new InvalidOptionsError('invalid teams.enabled: expected boolean');
    }
    const teamsDisplay = answers.teams?.displayMode ?? DEFAULTS.teams.displayMode;
    if (!VALID_TEAM_DISPLAY.has(teamsDisplay)) {
        throw new InvalidOptionsError(`invalid teams.displayMode: ${String(teamsDisplay)} (expected auto|in-process|tmux)`);
    }
    const teamsAgentCount = (answers.teams?.agentCount ?? DEFAULTS.teams.agentCount);
    if (!VALID_AGENT_COUNTS.has(teamsAgentCount)) {
        throw new InvalidOptionsError(`invalid teams.agentCount: ${String(answers.teams?.agentCount)} (expected 2|3|5)`);
    }
    const teamsAgentType = answers.teams?.agentType ?? DEFAULTS.teams.agentType;
    if (!VALID_AGENT_TYPES.has(teamsAgentType)) {
        throw new InvalidOptionsError(`invalid teams.agentType: ${String(teamsAgentType)} (expected executor|debugger|designer)`);
    }
    // Phase 4
    const starRepo = answers.starRepo ?? DEFAULTS.starRepo;
    if (typeof starRepo !== 'boolean') {
        throw new InvalidOptionsError('invalid starRepo: expected boolean');
    }
    // Phases derivation: building a preset from skill answers always implies
    // the full wizard flow, so phases = {claude-md, infra, integrations, welcome}.
    const phases = new Set(['claude-md', 'infra', 'integrations', 'welcome']);
    return {
        phases,
        interactive: false,
        force: false,
        quiet: false,
        target,
        installStyle,
        installCli,
        executionMode,
        taskTool,
        skipHud: DEFAULTS.skipHud,
        mcp: {
            enabled: mcpEnabled,
            servers: mcpServers,
            credentials: mcpCredentials,
            onMissingCredentials: mcpOnMissing,
            scope: DEFAULTS.mcp.scope,
        },
        teams: {
            enabled: teamsEnabled,
            displayMode: teamsDisplay,
            agentCount: teamsAgentCount,
            agentType: teamsAgentType,
        },
        starRepo,
        installerOptions: {},
    };
}
//# sourceMappingURL=preset-builder.js.map