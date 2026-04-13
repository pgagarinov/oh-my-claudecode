/**
 * Tests for src/setup/phases/phase2-configure.ts
 *
 * Phase 2 calls `install()` from the installer and writes preference
 * keys to `.omc-config.json`. Tests stub both via DI and assert:
 *   - install() is called exactly once with the pass-through options
 *   - throw on install() failure
 *   - preference keys are written conditionally on executionMode/taskTool
 *   - configuredAt is always written
 *   - CLI install is opt-in, skipped in plugin-dir mode, and never fatal
 */
import { describe, expect, it, vi } from 'vitest';
import { runPhase2 } from '../phases/phase2-configure.js';
import { makeOptions } from './test-helpers.js';
function successResult(message = 'install ok') {
    return {
        success: true,
        message,
        installedAgents: [],
        installedCommands: [],
        installedSkills: [],
        hooksConfigured: true,
        hookConflicts: [],
        errors: [],
    };
}
function failureResult(message = 'boom', errors = ['disk full']) {
    return {
        success: false,
        message,
        installedAgents: [],
        installedCommands: [],
        installedSkills: [],
        hooksConfigured: false,
        hookConflicts: [],
        errors,
    };
}
describe('runPhase2', () => {
    it('calls install() with installerOptions pass-through and writes configuredAt', async () => {
        const install = vi.fn(() => successResult());
        const merge = vi.fn();
        const exec = vi.fn();
        const fixedNow = new Date('2026-04-11T12:00:00.000Z');
        await runPhase2(makeOptions({
            installerOptions: { force: true, verbose: false, noPlugin: true },
        }), () => { }, { install, mergeOmcConfig: merge, execFileSync: exec, now: () => fixedNow });
        expect(install).toHaveBeenCalledOnce();
        expect(install).toHaveBeenCalledWith({ force: true, verbose: false, noPlugin: true });
        expect(merge).toHaveBeenCalledOnce();
        const [patch] = merge.mock.calls[0];
        expect(patch['configuredAt']).toBe('2026-04-11T12:00:00.000Z');
        // Neither executionMode nor taskTool set → those keys must be absent.
        expect(patch).not.toHaveProperty('defaultExecutionMode');
        expect(patch).not.toHaveProperty('taskTool');
        expect(patch).not.toHaveProperty('taskToolConfig');
        expect(exec).not.toHaveBeenCalled();
    });
    it('writes defaultExecutionMode when options.executionMode is set', async () => {
        const install = vi.fn(() => successResult());
        const merge = vi.fn();
        await runPhase2(makeOptions({ executionMode: 'ultrawork' }), () => { }, { install, mergeOmcConfig: merge, execFileSync: vi.fn() });
        const [patch] = merge.mock.calls[0];
        expect(patch['defaultExecutionMode']).toBe('ultrawork');
    });
    it('writes taskTool + taskToolConfig when options.taskTool is set', async () => {
        const install = vi.fn(() => successResult());
        const merge = vi.fn();
        await runPhase2(makeOptions({ taskTool: 'bd' }), () => { }, { install, mergeOmcConfig: merge, execFileSync: vi.fn() });
        const [patch] = merge.mock.calls[0];
        expect(patch['taskTool']).toBe('bd');
        expect(patch['taskToolConfig']).toEqual({ tool: 'bd' });
    });
    it('throws when install() returns success:false, including error details', async () => {
        const install = vi.fn(() => failureResult('Installation failed', ['Node version too old', 'disk full']));
        const merge = vi.fn();
        await expect(runPhase2(makeOptions(), () => { }, {
            install,
            mergeOmcConfig: merge,
            execFileSync: vi.fn(),
        })).rejects.toThrow(/Installation failed.*Node version too old.*disk full/);
        // Preferences are NOT written when install fails.
        expect(merge).not.toHaveBeenCalled();
    });
    it('runs npm install -g oh-my-claude-sisyphus when installCli=true and not plugin-dir mode', async () => {
        const install = vi.fn(() => successResult());
        const merge = vi.fn();
        const exec = vi.fn();
        const lines = [];
        await runPhase2(makeOptions({ installCli: true, installerOptions: {} }), (line) => lines.push(line), { install, mergeOmcConfig: merge, execFileSync: exec });
        expect(exec).toHaveBeenCalledOnce();
        expect(exec).toHaveBeenCalledWith('npm', ['install', '-g', 'oh-my-claude-sisyphus'], { stdio: 'inherit' });
        expect(lines).toContain('Installed oh-my-claude-sisyphus globally');
    });
    it('skips CLI install entirely in plugin-dir mode', async () => {
        const install = vi.fn(() => successResult());
        const exec = vi.fn();
        const lines = [];
        await runPhase2(makeOptions({
            installCli: true,
            installerOptions: { pluginDirMode: true },
        }), (line) => lines.push(line), { install, mergeOmcConfig: vi.fn(), execFileSync: exec });
        expect(exec).not.toHaveBeenCalled();
        expect(lines).toContain('Skipped CLI install in plugin-dir mode');
    });
    it('warns but does not throw when npm install fails', async () => {
        const install = vi.fn(() => successResult());
        const exec = vi.fn(() => {
            throw new Error('ENOENT: npm not found');
        });
        const lines = [];
        await expect(runPhase2(makeOptions({ installCli: true }), (line) => lines.push(line), {
            install,
            mergeOmcConfig: vi.fn(),
            execFileSync: exec,
        })).resolves.toBeUndefined();
        expect(lines.some((l) => l.includes('Warning: failed to install oh-my-claude-sisyphus'))).toBe(true);
        expect(lines.some((l) => l.includes('ENOENT: npm not found'))).toBe(true);
    });
    it('does not call npm when installCli=false (default)', async () => {
        const install = vi.fn(() => successResult());
        const exec = vi.fn();
        await runPhase2(makeOptions({ installCli: false }), () => { }, {
            install,
            mergeOmcConfig: vi.fn(),
            execFileSync: exec,
        });
        expect(exec).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=phase2-configure.test.js.map