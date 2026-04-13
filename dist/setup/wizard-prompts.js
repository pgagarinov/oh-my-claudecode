/**
 * Pre-phase interactive wizard for bare `omc setup` on a TTY.
 *
 * Iterates through `QUESTION_METADATA` — the same 11 questions asked by the
 * `/oh-my-claudecode:omc-setup` skill via AskUserQuestion — and collects
 * answers through a `Prompter` (`createReadlinePrompter` in production).
 *
 * The resulting `AnswersFile` is ready for `buildPreset()` to convert into
 * a fully-resolved `SetupOptions`. Conditional questions (installStyle,
 * team display/count/type, per-server credentials) are gated inline so we
 * never prompt for fields that don't apply.
 *
 * This module is invoked BEFORE `runSetup` — it is a UI-only layer. No
 * filesystem writes, no phase execution. `runSetup` is called afterwards
 * with the merged SetupOptions.
 *
 * Plan reference: user request "bare omc setup on TTY = interactive wizard
 * like /omc-setup, non-TTY = safe-defaults, --non-interactive = explicit
 * safe-defaults, --interactive non-TTY = error".
 */
import { QUESTION_METADATA } from './options.js';
import { formatConfigBanner, resolveConfigContext, } from './config-context.js';
// ---------------------------------------------------------------------------
// Label → value mappings
// ---------------------------------------------------------------------------
// QUESTION_METADATA stores user-facing labels verbatim. We translate them
// back into the canonical values expected by `buildPreset()` / `AnswersFile`.
// When adding a new question spec, add the label mapping here too.
// ---------------------------------------------------------------------------
function mapTarget(label) {
    if (label.startsWith('Local'))
        return 'local';
    if (label.startsWith('Global'))
        return 'global';
    return 'local';
}
function mapInstallStyle(label) {
    if (label.startsWith('Overwrite'))
        return 'overwrite';
    if (label.startsWith('Keep'))
        return 'preserve';
    return 'overwrite';
}
function mapExecutionMode(label) {
    if (label.startsWith('ultrawork'))
        return 'ultrawork';
    // "No default" → undefined so buildPreset leaves executionMode unset
    return undefined;
}
function mapInstallCli(label) {
    return label.startsWith('Yes');
}
function mapTaskTool(label) {
    if (label.startsWith('Beads-Rust'))
        return 'br';
    if (label.startsWith('Beads'))
        return 'bd';
    return 'builtin';
}
function mapMcpEnabled(label) {
    return label.startsWith('Yes');
}
function mapTeamsEnabled(label) {
    return label.startsWith('Yes');
}
function mapTeamDisplay(label) {
    if (label.startsWith('Auto'))
        return 'auto';
    if (label.startsWith('In-process'))
        return 'in-process';
    if (label.startsWith('Split'))
        return 'tmux';
    return 'auto';
}
function mapTeamAgentCount(label) {
    if (label.startsWith('2'))
        return 2;
    if (label.startsWith('5'))
        return 5;
    return 3;
}
function mapTeamAgentType(label) {
    if (label.startsWith('debugger'))
        return 'debugger';
    if (label.startsWith('designer'))
        return 'designer';
    return 'executor';
}
function mapStarRepo(label) {
    return label.startsWith('Yes');
}
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/**
 * Look up the default label for a question spec. The spec's `default` is
 * stored in canonical form (e.g. 'local', true, 3); we need to find the
 * label that maps to that value so `askSelect` can render a `*` marker on
 * the right option and fall back to it on empty input.
 *
 * For boolean questions the "Yes" option is default when `true`, "No" when
 * `false`. For string/number questions we match by the first option whose
 * mapped value equals the canonical default.
 */
function defaultLabelFor(questionKey) {
    const spec = QUESTION_METADATA[questionKey];
    if (!spec)
        throw new Error(`unknown question key: ${String(questionKey)}`);
    const rawDefault = spec.default;
    // Boolean questions (installCli, mcpEnabled, teamsEnabled, starRepo)
    if (typeof rawDefault === 'boolean') {
        const match = spec.options.find((o) => rawDefault ? o.label.startsWith('Yes') : o.label.startsWith('No'));
        return match?.label ?? spec.options[0].label;
    }
    // Numeric questions (teamsAgentCount)
    if (typeof rawDefault === 'number') {
        const match = spec.options.find((o) => o.label.startsWith(String(rawDefault)));
        return match?.label ?? spec.options[0].label;
    }
    // String questions — match by prefix against known canonical values.
    // Works for target ('local' → "Local (...)"), executionMode ('ultrawork'),
    // taskTool ('builtin' → "Built-in"), teamsDisplayMode ('auto' → "Auto"),
    // teamsAgentType ('executor' → "executor"), installStyle ('overwrite').
    if (typeof rawDefault === 'string') {
        // Case-insensitive prefix match on the canonical value
        const lc = rawDefault.toLowerCase();
        const match = spec.options.find((o) => {
            const label = o.label.toLowerCase();
            return (label.startsWith(lc)
                || label.startsWith(`${lc} `)
                || (lc === 'overwrite' && label.startsWith('overwrite'))
                || (lc === 'builtin' && label.startsWith('built-in'))
                || (lc === 'ultrawork' && label.startsWith('ultrawork')));
        });
        return match?.label ?? spec.options[0].label;
    }
    return spec.options[0].label;
}
/**
 * Convert a QuestionSpec's options into the `PrompterSelectOption<string>[]`
 * shape `askSelect` expects (labels as the generic parameter, descriptions
 * forwarded verbatim).
 *
 * When `descriptionOverrides` is supplied, each entry replaces the static
 * description for the matching option label. This is how we inject
 * CLAUDE_CONFIG_DIR-aware paths into the `target` question at runtime
 * without having to store per-profile strings in QUESTION_METADATA.
 */
function specOptions(spec, descriptionOverrides = {}) {
    return spec.options.map((o) => ({
        label: o.label,
        description: descriptionOverrides[o.label] ?? o.description,
    }));
}
async function askQuestion(prompter, key, descriptionOverrides) {
    const spec = QUESTION_METADATA[key];
    const defaultLabel = defaultLabelFor(key);
    return prompter.askSelect(spec.question, specOptions(spec, descriptionOverrides), defaultLabel);
}
// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------
/**
 * Run the 11-question interactive wizard and return an `AnswersFile` ready
 * for `buildPreset()`. Conditional questions are gated inline.
 *
 * Prompter lifecycle is the caller's responsibility — this function never
 * constructs or closes a prompter itself.
 */
export async function runInteractiveWizard(prompter, opts = {}) {
    // Pre-Q1: print the CLAUDE_CONFIG_DIR-aware banner so the user can see
    // which profile the wizard is targeting BEFORE committing to an answer.
    // Critical for users with multiple profiles (e.g. `~/.claude` vs
    // `~/.claude-personal`) — prevents silently overwriting the wrong file.
    const configContext = opts.configContext ?? resolveConfigContext();
    prompter.write(formatConfigBanner(configContext, { colorEnabled: opts.colorEnabled }));
    // Q1: target (local | global). Build fully-custom option labels that
    // embed the resolved absolute path in the LABEL (not just the
    // description) so the user sees exactly which file would be touched
    // as the most prominent piece of text on each line. The decoder still
    // uses `startsWith('Local')` / `startsWith('Global')` so the mapping
    // helper doesn't need to know about the runtime label format.
    const localPath = configContext.localFiles[0];
    const globalPath = configContext.globalFiles[0];
    const targetOptions = [
        {
            label: `Local → ${localPath}`,
            description: 'project-scoped; only affects this working directory.',
        },
        {
            label: `Global → ${globalPath}`,
            description: configContext.envVarSet
                ? `CLAUDE_CONFIG_DIR profile (${configContext.configDir}); affects all Claude Code sessions on this profile.`
                : 'default profile; affects all Claude Code sessions.',
        },
    ];
    // Default derived from QUESTION_METADATA.target.default (the wizard's
    // single source of truth for per-question defaults). Labels are
    // rewritten at runtime with resolved paths, so match by first word
    // against the canonical default string ('local' / 'global').
    const targetDefaultCanon = String(QUESTION_METADATA.target.default).toLowerCase();
    const targetDefaultLabel = targetOptions.find((o) => o.label.toLowerCase().startsWith(targetDefaultCanon))
        ?.label ?? targetOptions[0].label;
    const targetLabel = await prompter.askSelect(QUESTION_METADATA.target.question, targetOptions, targetDefaultLabel);
    const target = mapTarget(targetLabel);
    // Q2: installStyle — only when target=global AND a non-OMC base CLAUDE.md
    // already exists (caller decides via detectInstallStyleNeeded).
    // Same treatment as Q1: build fully-custom labels with the resolved
    // paths baked in so the user sees exactly which base/companion files
    // each choice will modify, and inject the resolved base path into the
    // question text itself for a third independent visibility point.
    let installStyle = 'overwrite';
    const needInstallStyle = target === 'global' && (opts.detectInstallStyleNeeded?.() ?? false);
    if (needInstallStyle) {
        const basePath = configContext.globalFiles[0];
        const companionPath = configContext.globalFilesPreserve.find((f) => !configContext.globalFiles.includes(f)) ?? `${configContext.configDir}/CLAUDE-omc.md`;
        const installStyleQuestion = `Global setup will modify ${basePath}. Which behavior do you want?`;
        const installStyleOptions = [
            {
                label: `Overwrite ${basePath} (Recommended)`,
                description: 'plain `claude` and `omc` both load OMC globally from the base file.',
            },
            {
                label: `Keep base ${basePath}; install companion ${companionPath}`,
                description: "preserves user's base file; `omc` launcher force-loads the companion at launch.",
            },
        ];
        const installStyleDefaultLabel = installStyleOptions[0].label; // Overwrite
        const installStyleLabel = await prompter.askSelect(installStyleQuestion, installStyleOptions, installStyleDefaultLabel);
        installStyle = mapInstallStyle(installStyleLabel);
    }
    // Q3: executionMode
    const executionModeLabel = await askQuestion(prompter, 'executionMode');
    const executionMode = mapExecutionMode(executionModeLabel);
    // Q4: installCli — skipped when launched from the `omc` CLI itself,
    // because the user obviously already has the CLI installed and asking
    // them to re-install it via `npm i -g` is noise. The default value
    // when skipped is `false` (don't install; we're already installed).
    let installCli = false;
    if (!opts.skipInstallCliQuestion) {
        const installCliLabel = await askQuestion(prompter, 'installCli');
        installCli = mapInstallCli(installCliLabel);
    }
    // Q5: taskTool
    const taskToolLabel = await askQuestion(prompter, 'taskTool');
    const taskTool = mapTaskTool(taskToolLabel);
    // Q6: mcpEnabled
    const mcpEnabledLabel = await askQuestion(prompter, 'mcpEnabled');
    const mcpEnabled = mapMcpEnabled(mcpEnabledLabel);
    // Q6b: MCP credentials (only when mcpEnabled). Blank input → skip that
    // credential; the server is still installed via the same
    // install-without-auth policy as SAFE_DEFAULTS so the user can add the
    // key later without re-running setup.
    const credentials = {};
    const mcpServers = [];
    if (mcpEnabled) {
        mcpServers.push('context7', 'exa', 'filesystem', 'github');
        const exaKey = (await prompter.askSecret('Exa API key (blank to skip; server stays visible-but-broken):')).trim();
        if (exaKey.length > 0)
            credentials.exa = exaKey;
        const githubToken = (await prompter.askSecret('GitHub token (blank to skip; server stays visible-but-broken):')).trim();
        if (githubToken.length > 0)
            credentials.github = githubToken;
    }
    // Q7: teamsEnabled
    const teamsEnabledLabel = await askQuestion(prompter, 'teamsEnabled');
    const teamsEnabled = mapTeamsEnabled(teamsEnabledLabel);
    // Q7b-d: team display / count / type — only when teamsEnabled
    let teamsDisplayMode = 'auto';
    let teamsAgentCount = 3;
    let teamsAgentType = 'executor';
    if (teamsEnabled) {
        const displayLabel = await askQuestion(prompter, 'teamsDisplayMode');
        teamsDisplayMode = mapTeamDisplay(displayLabel);
        const countLabel = await askQuestion(prompter, 'teamsAgentCount');
        teamsAgentCount = mapTeamAgentCount(countLabel);
        const typeLabel = await askQuestion(prompter, 'teamsAgentType');
        teamsAgentType = mapTeamAgentType(typeLabel);
    }
    // Q8: starRepo
    const starRepoLabel = await askQuestion(prompter, 'starRepo');
    const starRepo = mapStarRepo(starRepoLabel);
    return {
        target,
        installStyle,
        executionMode,
        installCli,
        taskTool,
        mcp: {
            enabled: mcpEnabled,
            servers: mcpServers,
            credentials,
            // Match SAFE_DEFAULTS — a blank-credential server should still be
            // installed so the user can fix it later with `claude mcp ...`.
            onMissingCredentials: 'install-without-auth',
        },
        teams: {
            enabled: teamsEnabled,
            displayMode: teamsDisplayMode,
            agentCount: teamsAgentCount,
            agentType: teamsAgentType,
        },
        starRepo,
    };
}
//# sourceMappingURL=wizard-prompts.js.map