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
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { getClaudeConfigDir } from '../utils/config-dir.js';
import { install, pruneStandaloneDuplicatesForPluginMode, previewStandaloneDuplicatesForPluginMode, VERSION } from '../installer/index.js';
import { acquireLock, LockHeldError, registerLockCleanup, } from './lockfile.js';
import { clearState, completeSetup, resumeState, saveState, } from './state.js';
import { createNullPrompter, createReadlinePrompter, } from './prompts.js';
import { runPhase1 } from './phases/phase1-claude-md.js';
import { runPhase2 } from './phases/phase2-configure.js';
import { runPhase3 } from './phases/phase3-integrations.js';
import { detectIsUpgrade, runPhase4 } from './phases/phase4-welcome.js';
import { installMcpServers } from './mcp-install.js';
// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------
export class AlreadyRunningError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AlreadyRunningError';
    }
}
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/**
 * Resolve the canonical lockfile path: `$HOME/.omc/state/setup.lock`.
 *
 * Uses `$HOME` (not `configDir`) so concurrent setups across different
 * `CLAUDE_CONFIG_DIR` values still collide — otherwise a user with two
 * config dirs could run two setups in parallel, which is exactly what we
 * want to prevent (state file races, HUD races).
 */
function defaultLockPath() {
    return join(homedir(), '.omc', 'state', 'setup.lock');
}
function makeLoggers(quiet) {
    return {
        info: quiet
            ? () => { }
            : (line) => { process.stdout.write(`${line}\n`); },
        error: (line) => { process.stderr.write(`${line}\n`); },
    };
}
/**
 * Read `setupCompleted` / `setupVersion` from `.omc-config.json`.
 * Used by the phase 0b already-configured check.
 */
export function readAlreadyConfigured(configDir) {
    const path = join(configDir, '.omc-config.json');
    if (!existsSync(path))
        return { alreadyConfigured: false };
    try {
        const parsed = JSON.parse(readFileSync(path, 'utf8'));
        if (typeof parsed.setupCompleted === 'string' && parsed.setupCompleted.length > 0) {
            return {
                alreadyConfigured: true,
                setupVersion: parsed.setupVersion,
            };
        }
        return { alreadyConfigured: false, setupVersion: parsed.setupVersion };
    }
    catch {
        return { alreadyConfigured: false };
    }
}
/**
 * Decide whether the requested `phases` set indicates a full wizard run
 * (as opposed to a scoped sub-phase like `claude-md-only` or `state`).
 *
 * A "full wizard" is any run that touches `welcome` OR any run that touches
 * both `claude-md` AND `infra`. The state-machine and mcp-only phases are
 * explicitly excluded.
 */
function isWizardRun(phases) {
    if (phases.has('state') || phases.has('mcp-only'))
        return false;
    if (phases.has('welcome'))
        return true;
    if (phases.has('claude-md') && phases.has('infra'))
        return true;
    return false;
}
function isPureInfraRun(phases) {
    return phases.size === 1 && phases.has('infra');
}
/**
 * Dispatch a `stateAction` to state.ts and return the JSON payload.
 */
function runStatePhase(action, cwd, configDir) {
    switch (action.op) {
        case 'save':
            saveState(action.step, action.configType, { cwd });
            return { ok: true };
        case 'clear':
            clearState({ cwd });
            return { ok: true };
        case 'resume': {
            const r = resumeState({ cwd });
            if (r.status === 'fresh')
                return { status: 'fresh' };
            return {
                status: 'resume',
                lastStep: r.lastStep,
                timestamp: r.timestamp,
                configType: r.configType,
            };
        }
        case 'complete':
            completeSetup(action.version, { cwd, configDir });
            return { ok: true };
    }
}
// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------
/**
 * Run the full setup flow for the resolved `SetupOptions`.
 *
 * Top-level try/finally guarantees lockfile release even on error. Never
 * throws — wraps every error into `{ success: false, errors: [...] }` with
 * a non-zero `exitCode` so the CLI/skill can surface it uniformly.
 */
export async function runSetup(options, deps = {}) {
    const configDir = deps.configDir ?? getClaudeConfigDir();
    const cwd = deps.cwd ?? process.cwd();
    const invoker = deps.invoker ?? 'cli';
    const lockPath = deps.lockPath ?? defaultLockPath();
    const stdout = deps.stdout ?? ((line) => { process.stdout.write(`${line}\n`); });
    const log = makeLoggers(options.quiet);
    const phaseResults = {};
    const phasesRun = [];
    const warnings = [];
    const errors = [];
    // -------------------------------------------------------------------------
    // Phase 0: --check-state short-circuit (read-only, no lock).
    // -------------------------------------------------------------------------
    if (options.checkState) {
        const ac = readAlreadyConfigured(configDir);
        const r = resumeState({ cwd });
        const output = {
            alreadyConfigured: ac.alreadyConfigured,
            ...(ac.setupVersion ? { setupVersion: ac.setupVersion } : {}),
            ...(r.status === 'resume' ? { resumeStep: r.lastStep } : {}),
        };
        stdout(JSON.stringify(output));
        return {
            success: true,
            phasesRun: [],
            phaseResults: { state: output },
            warnings,
            errors,
            exitCode: 0,
        };
    }
    // -------------------------------------------------------------------------
    // Phase 0: state-machine short-circuit (no lock — state ops are atomic
    // on their own and the bash shim legacy paths never held a lock).
    // -------------------------------------------------------------------------
    if (options.phases.has('state') && options.stateAction) {
        try {
            const output = runStatePhase(options.stateAction, cwd, configDir);
            stdout(JSON.stringify(output));
            phasesRun.push('state');
            phaseResults.state = output;
            return { success: true, phasesRun, phaseResults, warnings, errors, exitCode: 0 };
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            errors.push(msg);
            stdout(JSON.stringify({ ok: false, error: msg }));
            return { success: false, phasesRun, phaseResults, warnings, errors, exitCode: 1 };
        }
    }
    // -------------------------------------------------------------------------
    // Phase 0: acquire lockfile (all remaining paths require it).
    // -------------------------------------------------------------------------
    let lock;
    try {
        lock = acquireLock(lockPath, invoker);
    }
    catch (err) {
        if (err instanceof LockHeldError) {
            log.error(err.message);
            errors.push(err.message);
            return { success: false, phasesRun, phaseResults, warnings, errors, exitCode: 75 };
        }
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`lockfile acquisition failed: ${msg}`);
        log.error(errors[errors.length - 1]);
        return { success: false, phasesRun, phaseResults, warnings, errors, exitCode: 1 };
    }
    const deregister = deps.skipSignalHandlers ? null : registerLockCleanup(lock);
    try {
        // -------------------------------------------------------------------
        // Phase 0b: already-configured check (wizard runs only).
        // -------------------------------------------------------------------
        const wizardRun = isWizardRun(options.phases);
        if (wizardRun && !options.force) {
            const ac = readAlreadyConfigured(configDir);
            if (ac.alreadyConfigured) {
                const behavior = deps.pluginLeftoverBehavior ?? 'auto';
                if (behavior === 'ask') {
                    // Preview only — caller handles prompting + optional execute.
                    const preview = previewStandaloneDuplicatesForPluginMode({ configDir });
                    log.info(`OMC is already configured (version ${ac.setupVersion ?? 'unknown'}). `
                        + 'Re-run with --force to bypass this check, or use --claude-md-only '
                        + 'for a quick CLAUDE.md refresh.');
                    return {
                        success: true,
                        phasesRun,
                        phaseResults,
                        warnings,
                        errors,
                        exitCode: 0,
                        alreadyConfigured: true,
                        pluginLeftoverPreview: preview.hasWork ? preview : undefined,
                    };
                }
                if (behavior === 'auto') {
                    // Plugin-mode leftover cleanup runs even when setup would otherwise
                    // short-circuit. A user who installed OMC standalone pre-plugin and
                    // then switched to plugin delivery still has stale $CONFIG_DIR/hooks
                    // etc — this prune is fast, idempotent, and ownership-gated.
                    const pruneResult = pruneStandaloneDuplicatesForPluginMode((msg) => log.info(msg), { configDir });
                    if (pruneResult.totalPruneCount > 0 || pruneResult.settingsStripped) {
                        log.info(`Cleaned up plugin-duplicate leftovers: `
                            + `${pruneResult.prunedAgents.length} agent(s), `
                            + `${pruneResult.prunedSkills.length} skill(s), `
                            + `${pruneResult.prunedHooks.length} hook(s)`
                            + (pruneResult.settingsStripped ? ', settings.json stripped' : ''));
                    }
                }
                // behavior === 'skip' — do nothing with leftovers
                log.info(`OMC is already configured (version ${ac.setupVersion ?? 'unknown'}). `
                    + 'Re-run with --force to bypass this check, or use --claude-md-only '
                    + 'for a quick CLAUDE.md refresh.');
                return {
                    success: true,
                    phasesRun,
                    phaseResults,
                    warnings,
                    errors,
                    exitCode: 0,
                    alreadyConfigured: true,
                };
            }
        }
        // -------------------------------------------------------------------
        // Phase 0c: resume detection (wizard runs only).
        // -------------------------------------------------------------------
        let resumeFromStep = 0;
        if (wizardRun && !options.force) {
            const r = resumeState({ cwd });
            if (r.status === 'resume') {
                resumeFromStep = r.lastStep;
                log.info(`Resuming from step ${r.lastStep} (${r.configType}).`);
            }
        }
        else if (wizardRun && options.force) {
            // --force clears any stale state to guarantee a from-scratch run.
            clearState({ cwd });
        }
        // -------------------------------------------------------------------
        // Prompter: build once and reuse across phases that need it.
        // -------------------------------------------------------------------
        const prompter = deps.prompter ?? (options.interactive ? createReadlinePrompter() : createNullPrompter());
        // -------------------------------------------------------------------
        // MCP-only sub-phase (skill's `/oh-my-claudecode:mcp-setup` wrapper).
        // -------------------------------------------------------------------
        if (options.phases.has('mcp-only')) {
            const installFn = deps.installMcpServers ?? installMcpServers;
            try {
                const result = await installFn(options.mcp.servers, options.mcp.credentials, {
                    interactive: options.interactive,
                    onMissingCredentials: options.mcp.onMissingCredentials,
                    // Honor --mcp-scope (default 'user' is set at the options layer).
                    scope: options.mcp.scope,
                    prompter,
                    logger: log.info,
                });
                phasesRun.push('mcp-only');
                phaseResults.mcpOnly = result;
                if (result.skippedDueToMissingCreds.length > 0) {
                    warnings.push(`skipped MCP servers due to missing credentials: ${result.skippedDueToMissingCreds.join(', ')}`);
                }
                return { success: true, phasesRun, phaseResults, warnings, errors, exitCode: 0 };
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                errors.push(msg);
                log.error(msg);
                return { success: false, phasesRun, phaseResults, warnings, errors, exitCode: 1 };
            }
            finally {
                prompter.close();
            }
        }
        // -------------------------------------------------------------------
        // Bare `omc setup` backward-compat path — phases={'infra'} only.
        //
        // This path MUST remain byte-identical to today's `install()` call
        // (see `cli-setup-backward-compat.test.ts`). It does not touch
        // CLAUDE.md, does not write preferences to `.omc-config.json`, does
        // not run any prompter. It calls `install()` directly and returns.
        //
        // NOTE: we intentionally call `install()` here rather than routing
        // through `runPhase2`, because phase2 adds preference writes +
        // optional CLI install — both disallowed in the infra-only contract.
        // -------------------------------------------------------------------
        if (isPureInfraRun(options.phases)) {
            const installFn = deps.install ?? install;
            try {
                const result = installFn(options.installerOptions);
                if (result.message && !options.quiet) {
                    log.info(result.message);
                }
                phasesRun.push('infra');
                if (!result.success) {
                    errors.push(...result.errors);
                    return {
                        success: false,
                        phasesRun,
                        phaseResults,
                        warnings,
                        errors,
                        exitCode: 1,
                        installResult: result,
                    };
                }
                return {
                    success: true,
                    phasesRun,
                    phaseResults,
                    warnings,
                    errors,
                    exitCode: 0,
                    installResult: result,
                };
            }
            finally {
                prompter.close();
            }
        }
        // -------------------------------------------------------------------
        // Full wizard / scoped sub-phase dispatch.
        // -------------------------------------------------------------------
        // Pre-compute `isUpgrade` BEFORE phase1 writes new version markers so
        // phase4 can emit the right welcome template.
        const isUpgrade = detectIsUpgrade(configDir);
        const phase1Fn = deps.phase1 ?? runPhase1;
        const phase2Fn = deps.phase2 ?? runPhase2;
        const phase3Fn = deps.phase3 ?? runPhase3;
        const phase4Fn = deps.phase4 ?? runPhase4;
        try {
            // Phase 1 — CLAUDE.md.
            if (options.phases.has('claude-md') && resumeFromStep < 1) {
                const result = await phase1Fn(options, log.info, { configDir, cwd });
                phaseResults.phase1 = result;
                phasesRun.push('claude-md');
                saveState(1, options.target, { cwd, logger: log.info });
            }
            // Phase 2 — infra + preference writes.
            if (options.phases.has('infra') && resumeFromStep < 2) {
                await phase2Fn(options, log.info, { configDir, cwd });
                phasesRun.push('infra');
                saveState(2, options.target, { cwd, logger: log.info });
            }
            // Phase 3 — integrations (MCP + teams).
            if (options.phases.has('integrations') && resumeFromStep < 3) {
                const result = await phase3Fn(options, log.info, { configDir, cwd });
                phaseResults.phase3 = result;
                phasesRun.push('integrations');
                saveState(3, options.target, { cwd, logger: log.info });
            }
            // Phase 4 — welcome + gh star + completion marker.
            if (options.phases.has('welcome') && resumeFromStep < 4) {
                await phase4Fn(options, log.info, { isUpgrade, phase1Result: phaseResults.phase1 }, { configDir, cwd, version: VERSION ?? 'unknown' });
                phasesRun.push('welcome');
                saveState(4, options.target, { cwd, logger: log.info });
            }
            return { success: true, phasesRun, phaseResults, warnings, errors, exitCode: 0 };
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            errors.push(msg);
            log.error(`setup failed: ${msg}`);
            return { success: false, phasesRun, phaseResults, warnings, errors, exitCode: 1 };
        }
        finally {
            prompter.close();
        }
    }
    finally {
        if (deregister)
            deregister();
        lock.release();
    }
}
//# sourceMappingURL=index.js.map