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
import { execFileSync as realExecFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { completeSetup as realCompleteSetup } from '../state.js';
import { VERSION } from '../../installer/index.js';
import { getClaudeConfigDir } from '../../utils/config-dir.js';
import { writeHudConfig as realWriteHudConfig } from '../hud-config-writer.js';
/**
 * Read `.omc-config.json` and return whether this looks like an upgrade
 * from a 2.x install. Exported so runSetup can compute `isUpgrade` before
 * Phase 1 writes fresh version markers, then pass it through to Phase 4.
 *
 * Any read/parse error → treated as "not an upgrade" (safer default:
 * show the new-user welcome rather than implying stale 2.x state).
 */
export function detectIsUpgrade(configDir) {
    const configPath = join(configDir, '.omc-config.json');
    if (!existsSync(configPath))
        return false;
    try {
        const parsed = JSON.parse(readFileSync(configPath, 'utf8'));
        return typeof parsed.setupVersion === 'string' && parsed.setupVersion.startsWith('2.');
    }
    catch {
        return false;
    }
}
/** Emit a multi-line message through the injected logger, one line at a time. */
function logMultiline(logger, message) {
    // Preserve the exact shape of the ported template — including the
    // leading/trailing blank lines that bash `cat <<EOF` would emit.
    const lines = message.split('\n');
    // If the template ends with a trailing newline, split produces an
    // empty string as the last element — drop it so we don't log a
    // spurious blank line at the bottom.
    if (lines.length > 0 && lines[lines.length - 1] === '') {
        lines.pop();
    }
    for (const line of lines) {
        logger(line);
    }
}
/**
 * Run Phase 4 — welcome message, optional gh star, completion marker.
 */
export async function runPhase4(options, logger, context = {}, deps = {}) {
    const complete = deps.completeSetup ?? realCompleteSetup;
    const execFn = deps.execFileSync ?? realExecFileSync;
    const hudWriter = deps.writeHudConfig ?? realWriteHudConfig;
    const configDir = deps.configDir ?? getClaudeConfigDir();
    const cwd = deps.cwd ?? process.cwd();
    const version = deps.version ?? VERSION ?? 'unknown';
    const isUpgrade = context.isUpgrade !== undefined ? context.isUpgrade : detectIsUpgrade(configDir);
    // Optional HUD element config — only runs when the caller supplied
    // `options.hud.elements` (SAFE_DEFAULTS does, bare DEFAULTS does not).
    if (options.hud?.elements) {
        try {
            hudWriter(options.hud.elements, { configDir });
        }
        catch (err) {
            // Non-fatal: HUD config is cosmetic, never block setup completion.
            const msg = err instanceof Error ? err.message : String(err);
            logger(`[phase4] warning: failed to write HUD config: ${msg}`);
        }
    }
    logMultiline(logger, isUpgrade ? UPGRADE_WELCOME_MESSAGE : NEW_WELCOME_MESSAGE);
    if (options.starRepo) {
        try {
            execFn('gh', ['repo', 'star', 'Yeachan-Heo/oh-my-claudecode'], { stdio: 'pipe' });
            logger('Starred Yeachan-Heo/oh-my-claudecode — thanks!');
        }
        catch {
            // Silent fallback: gh missing, not authenticated, network off, etc.
            // Never block setup completion on a star attempt.
        }
    }
    complete(version, { cwd, configDir, logger });
}
// ─────────────────────── welcome message templates ──────────────────────
// Ported verbatim from skills/omc-setup/phases/04-welcome.md. Keep in
// sync with that file (or delete that file once the skill is rewritten,
// per the PR4 work in the parent plan).
const NEW_WELCOME_MESSAGE = `
OMC Setup Complete!

You don't need to learn any commands. I now have intelligent behaviors that activate automatically.

WHAT HAPPENS AUTOMATICALLY:
- Complex tasks -> I parallelize and delegate to specialists
- "plan this" -> I start a planning interview
- "don't stop until done" -> I persist until verified complete
- "stop" or "cancel" -> I intelligently stop current operation

MAGIC KEYWORDS (optional power-user shortcuts):
Just include these words naturally in your request:

| Keyword | Effect            | Example                          |
|---------|-------------------|----------------------------------|
| ralph   | Persistence mode  | "ralph: fix the auth bug"        |
| ralplan | Iterative planning| "ralplan this feature"           |
| ulw     | Max parallelism   | "ulw refactor the API"           |
| plan    | Planning interview| "plan the new endpoints"         |
| team    | Coordinated agents| "/team 3:executor fix errors"    |

ralph includes ultrawork: When you activate ralph mode, it automatically
includes ultrawork's parallel execution. No need to combine keywords.

TEAMS:
Spawn coordinated agents with shared task lists and real-time messaging:
- /oh-my-claudecode:team 3:executor "fix all TypeScript errors"
- /oh-my-claudecode:team 5:debugger "fix build errors in src/"

MCP SERVERS:
Run /oh-my-claudecode:mcp-setup to add tools like web search, GitHub, etc.

HUD STATUSLINE:
The status bar now shows OMC state. Restart Claude Code to see it.

OMC CLI HELPERS (if installed):
- omc hud         - Render the current HUD statusline
- omc teleport    - Create an isolated git worktree
- omc team status - Inspect a running team job

That's it! Just use Claude Code normally.
`;
const UPGRADE_WELCOME_MESSAGE = `
OMC Setup Complete! (Upgraded from 2.x)

GOOD NEWS: Your existing commands still work!
- /ralph, /ultrawork, /omc-plan, etc. all still function

WHAT'S NEW in 3.0:
You no longer NEED those commands. Everything is automatic now:
- Just say "don't stop until done" instead of /ralph
- Just say "fast" or "parallel" instead of /ultrawork
- Just say "plan this" instead of /omc-plan
- Just say "stop" instead of /cancel

MAGIC KEYWORDS (power-user shortcuts):
| Keyword | Same as old... | Example                       |
|---------|----------------|-------------------------------|
| ralph   | /ralph         | "ralph: fix the bug"          |
| ralplan | /ralplan       | "ralplan this feature"        |
| ulw     | /ultrawork     | "ulw refactor API"            |
| omc-plan| /omc-plan      | "plan the endpoints"          |
| team    | (new!)         | "/team 3:executor fix errors" |

TEAMS (NEW!):
Spawn coordinated agents with shared task lists and real-time messaging:
- /oh-my-claudecode:team 3:executor "fix all TypeScript errors"

HUD STATUSLINE:
The status bar now shows OMC state. Restart Claude Code to see it.

OMC CLI HELPERS (if installed):
- omc hud         - Render the current HUD statusline
- omc teleport    - Create an isolated git worktree
- omc team status - Inspect a running team job

Your workflow won't break - it just got easier!
`;
//# sourceMappingURL=phase4-welcome.js.map