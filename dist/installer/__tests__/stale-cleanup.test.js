/**
 * Stale OMC Agent/Skill Cleanup Tests
 *
 * Verifies that the installer removes stale OMC-created files from the config
 * directory while preserving user-created files.
 *
 * Contract: setup must clean up ~/.claude/agents and ~/.claude/skills that were
 * created by OMC in previous versions but are no longer shipped.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, writeFileSync, rmSync, symlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
// We test the exported cleanup functions directly
import { cleanupStaleAgents, cleanupStaleSkills, prunePluginDuplicateSkills, prunePluginDuplicateAgents } from '../index.js';
// ── Test helpers ─────────────────────────────────────────────────────────────
function createAgentFile(dir, filename, name) {
    writeFileSync(join(dir, filename), `---\nname: ${name}\ndescription: Test agent\nmodel: claude-sonnet-4-6\n---\n\n# ${name}\nTest content.\n`);
}
function createSkillDir(dir, skillName, name) {
    const skillDir = join(dir, skillName);
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(join(skillDir, 'SKILL.md'), `---\nname: ${name}\ndescription: Test skill\n---\n\n# ${name}\nTest content.\n`);
}
function createUserFile(dir, filename) {
    // User-created file without OMC frontmatter
    writeFileSync(join(dir, filename), `# My Custom Agent\n\nThis is a user-created agent definition.\n`);
}
function createUserSkillDir(dir, skillName) {
    const skillDir = join(dir, skillName);
    mkdirSync(skillDir, { recursive: true });
    // No frontmatter — just user prose
    writeFileSync(join(skillDir, 'SKILL.md'), `# My Custom Skill\n\nThis is a user-created skill.\n`);
}
function createManagedSkillMarker(dir, skillName) {
    writeFileSync(join(dir, skillName, '.omc-managed'), 'omc-managed\n');
}
// ── Stale Agent Cleanup ──────────────────────────────────────────────────────
describe('cleanupStaleAgents', () => {
    let tempDir;
    let originalConfigDir;
    const log = vi.fn();
    beforeEach(() => {
        tempDir = mkdtempSync(join(tmpdir(), 'omc-stale-agents-'));
        originalConfigDir = process.env.CLAUDE_CONFIG_DIR;
        process.env.CLAUDE_CONFIG_DIR = tempDir;
        log.mockClear();
    });
    afterEach(() => {
        if (originalConfigDir === undefined) {
            delete process.env.CLAUDE_CONFIG_DIR;
        }
        else {
            process.env.CLAUDE_CONFIG_DIR = originalConfigDir;
        }
        rmSync(tempDir, { recursive: true, force: true });
    });
    it('removes agent files that have OMC frontmatter but are no longer in the package', async () => {
        // Re-import with fresh CLAUDE_CONFIG_DIR
        vi.resetModules();
        const { cleanupStaleAgents: cleanup, AGENTS_DIR: agentsDir } = await import('../index.js');
        mkdirSync(agentsDir, { recursive: true });
        // Create a fake "stale" agent that looks like OMC-created but isn't in current package
        createAgentFile(agentsDir, 'removed-agent.md', 'removed-agent');
        const removed = cleanup(log);
        expect(removed).toContain('removed-agent.md');
        expect(existsSync(join(agentsDir, 'removed-agent.md'))).toBe(false);
    });
    it('preserves agent files that are in the current package', async () => {
        vi.resetModules();
        const { cleanupStaleAgents: cleanup, AGENTS_DIR: agentsDir } = await import('../index.js');
        mkdirSync(agentsDir, { recursive: true });
        // Create an agent that matches a real current agent name (architect)
        createAgentFile(agentsDir, 'architect.md', 'architect');
        const removed = cleanup(log);
        expect(removed).not.toContain('architect.md');
        expect(existsSync(join(agentsDir, 'architect.md'))).toBe(true);
    });
    it('preserves user-created files without OMC frontmatter', async () => {
        vi.resetModules();
        const { cleanupStaleAgents: cleanup, AGENTS_DIR: agentsDir } = await import('../index.js');
        mkdirSync(agentsDir, { recursive: true });
        // User-created file with no frontmatter
        createUserFile(agentsDir, 'my-custom-agent.md');
        const removed = cleanup(log);
        expect(removed).not.toContain('my-custom-agent.md');
        expect(existsSync(join(agentsDir, 'my-custom-agent.md'))).toBe(true);
    });
    it('preserves AGENTS.md even though it is not a current agent definition', async () => {
        vi.resetModules();
        const { cleanupStaleAgents: cleanup, AGENTS_DIR: agentsDir } = await import('../index.js');
        mkdirSync(agentsDir, { recursive: true });
        writeFileSync(join(agentsDir, 'AGENTS.md'), '# Agent Catalog\nDocumentation file.\n');
        const removed = cleanup(log);
        expect(removed).not.toContain('AGENTS.md');
        expect(existsSync(join(agentsDir, 'AGENTS.md'))).toBe(true);
    });
    it('returns empty array when agents directory does not exist', () => {
        const removed = cleanupStaleAgents(log);
        // No agents dir at the temp path — should not error
        expect(removed).toEqual([]);
    });
});
// ── Stale Skill Cleanup ──────────────────────────────────────────────────────
describe('cleanupStaleSkills', () => {
    let tempDir;
    let originalConfigDir;
    const log = vi.fn();
    beforeEach(() => {
        tempDir = mkdtempSync(join(tmpdir(), 'omc-stale-skills-'));
        originalConfigDir = process.env.CLAUDE_CONFIG_DIR;
        process.env.CLAUDE_CONFIG_DIR = tempDir;
        log.mockClear();
    });
    afterEach(() => {
        if (originalConfigDir === undefined) {
            delete process.env.CLAUDE_CONFIG_DIR;
        }
        else {
            process.env.CLAUDE_CONFIG_DIR = originalConfigDir;
        }
        rmSync(tempDir, { recursive: true, force: true });
    });
    it('removes stale skills only when OMC ownership is explicitly marked', async () => {
        vi.resetModules();
        const { cleanupStaleSkills: cleanup, SKILLS_DIR: skillsDir } = await import('../index.js');
        mkdirSync(skillsDir, { recursive: true });
        createSkillDir(skillsDir, 'removed-skill', 'removed-skill');
        createManagedSkillMarker(skillsDir, 'removed-skill');
        const removed = cleanup(log);
        expect(removed).toContain('removed-skill');
        expect(existsSync(join(skillsDir, 'removed-skill'))).toBe(false);
    });
    it('preserves skill directories that are in the current package', async () => {
        vi.resetModules();
        const { cleanupStaleSkills: cleanup, SKILLS_DIR: skillsDir } = await import('../index.js');
        mkdirSync(skillsDir, { recursive: true });
        // Create a skill that matches a real current skill name (ralph)
        createSkillDir(skillsDir, 'ralph', 'ralph');
        const removed = cleanup(log);
        expect(removed).not.toContain('ralph');
        expect(existsSync(join(skillsDir, 'ralph'))).toBe(true);
    });
    it('preserves user-created skill directories without OMC frontmatter', async () => {
        vi.resetModules();
        const { cleanupStaleSkills: cleanup, SKILLS_DIR: skillsDir } = await import('../index.js');
        mkdirSync(skillsDir, { recursive: true });
        createUserSkillDir(skillsDir, 'my-custom-skill');
        const removed = cleanup(log);
        expect(removed).not.toContain('my-custom-skill');
        expect(existsSync(join(skillsDir, 'my-custom-skill'))).toBe(true);
    });
    it('preserves third-party skills with standard frontmatter when no OMC marker is present', async () => {
        vi.resetModules();
        const { cleanupStaleSkills: cleanup, SKILLS_DIR: skillsDir } = await import('../index.js');
        mkdirSync(skillsDir, { recursive: true });
        createSkillDir(skillsDir, 'gstack', 'gstack');
        const removed = cleanup(log);
        expect(removed).not.toContain('gstack');
        expect(existsSync(join(skillsDir, 'gstack'))).toBe(true);
    });
    it('preserves symlinked skill directories without an OMC marker', async () => {
        vi.resetModules();
        const { cleanupStaleSkills: cleanup, SKILLS_DIR: skillsDir } = await import('../index.js');
        mkdirSync(skillsDir, { recursive: true });
        const externalRoot = mkdtempSync(join(tmpdir(), 'omc-third-party-skill-'));
        const externalSkillDir = join(externalRoot, 'linked-skill');
        mkdirSync(externalSkillDir, { recursive: true });
        writeFileSync(join(externalSkillDir, 'SKILL.md'), '---\nname: linked-skill\ndescription: external\n---\n\n# linked-skill\n');
        symlinkSync(externalSkillDir, join(skillsDir, 'linked-skill'), 'dir');
        try {
            const removed = cleanup(log);
            expect(removed).not.toContain('linked-skill');
            expect(existsSync(join(skillsDir, 'linked-skill'))).toBe(true);
        }
        finally {
            rmSync(externalRoot, { recursive: true, force: true });
        }
    });
    it('preserves omc-learned directory (user-created skills)', async () => {
        vi.resetModules();
        const { cleanupStaleSkills: cleanup, SKILLS_DIR: skillsDir } = await import('../index.js');
        mkdirSync(skillsDir, { recursive: true });
        // omc-learned is the user skills directory — must never be removed
        createSkillDir(skillsDir, 'omc-learned', 'omc-learned');
        const removed = cleanup(log);
        expect(removed).not.toContain('omc-learned');
        expect(existsSync(join(skillsDir, 'omc-learned'))).toBe(true);
    });
    it('returns empty array when skills directory does not exist', () => {
        const removed = cleanupStaleSkills(log);
        expect(removed).toEqual([]);
    });
    it('does not remove directories without SKILL.md', async () => {
        vi.resetModules();
        const { cleanupStaleSkills: cleanup, SKILLS_DIR: skillsDir } = await import('../index.js');
        mkdirSync(skillsDir, { recursive: true });
        // Directory with no SKILL.md — not a skill, should be left alone
        const randomDir = join(skillsDir, 'random-directory');
        mkdirSync(randomDir, { recursive: true });
        writeFileSync(join(randomDir, 'notes.txt'), 'some notes');
        const removed = cleanup(log);
        expect(removed).not.toContain('random-directory');
        expect(existsSync(randomDir)).toBe(true);
    });
});
// ── Plugin Duplicate Skill Pruning (#2252) ──────────────────────────────────
describe('prunePluginDuplicateSkills', () => {
    let tempDir;
    let originalConfigDir;
    const log = vi.fn();
    beforeEach(() => {
        tempDir = mkdtempSync(join(tmpdir(), 'omc-prune-dupes-'));
        originalConfigDir = process.env.CLAUDE_CONFIG_DIR;
        process.env.CLAUDE_CONFIG_DIR = tempDir;
        log.mockClear();
    });
    afterEach(() => {
        if (originalConfigDir === undefined) {
            delete process.env.CLAUDE_CONFIG_DIR;
        }
        else {
            process.env.CLAUDE_CONFIG_DIR = originalConfigDir;
        }
        rmSync(tempDir, { recursive: true, force: true });
    });
    it('removes standalone skills that match plugin-provided skills', async () => {
        vi.resetModules();
        const { prunePluginDuplicateSkills: prune, SKILLS_DIR: skillsDir } = await import('../index.js');
        mkdirSync(skillsDir, { recursive: true });
        // Create a standalone copy of 'ralph' (which the plugin also provides)
        createSkillDir(skillsDir, 'ralph', 'ralph');
        const removed = prune(log);
        expect(removed).toContain('ralph');
        expect(existsSync(join(skillsDir, 'ralph'))).toBe(false);
    });
    it('preserves user-authored skills without OMC frontmatter even if name matches', async () => {
        vi.resetModules();
        const { prunePluginDuplicateSkills: prune, SKILLS_DIR: skillsDir } = await import('../index.js');
        mkdirSync(skillsDir, { recursive: true });
        // User-created skill with a name that collides with plugin skill but no OMC frontmatter
        createUserSkillDir(skillsDir, 'ralph');
        const removed = prune(log);
        expect(removed).not.toContain('ralph');
        expect(existsSync(join(skillsDir, 'ralph'))).toBe(true);
    });
    it('preserves omc-learned directory', async () => {
        vi.resetModules();
        const { prunePluginDuplicateSkills: prune, SKILLS_DIR: skillsDir } = await import('../index.js');
        mkdirSync(skillsDir, { recursive: true });
        createSkillDir(skillsDir, 'omc-learned', 'omc-learned');
        const removed = prune(log);
        expect(removed).not.toContain('omc-learned');
        expect(existsSync(join(skillsDir, 'omc-learned'))).toBe(true);
    });
    it('does not remove skills whose name does not match any plugin skill', async () => {
        vi.resetModules();
        const { prunePluginDuplicateSkills: prune, SKILLS_DIR: skillsDir } = await import('../index.js');
        mkdirSync(skillsDir, { recursive: true });
        createSkillDir(skillsDir, 'my-private-skill', 'my-private-skill');
        const removed = prune(log);
        expect(removed).not.toContain('my-private-skill');
        expect(existsSync(join(skillsDir, 'my-private-skill'))).toBe(true);
    });
    it('returns empty when skills directory does not exist', () => {
        const removed = prunePluginDuplicateSkills(log);
        expect(removed).toEqual([]);
    });
    it('is idempotent — second run is a no-op', async () => {
        vi.resetModules();
        const { prunePluginDuplicateSkills: prune, SKILLS_DIR: skillsDir } = await import('../index.js');
        mkdirSync(skillsDir, { recursive: true });
        createSkillDir(skillsDir, 'ralph', 'ralph');
        const first = prune(log);
        expect(first).toContain('ralph');
        const second = prune(log);
        expect(second).toEqual([]);
    });
});
// ── Plugin Duplicate Agent Pruning (#2252) ──────────────────────────────────
describe('prunePluginDuplicateAgents', () => {
    let tempDir;
    let originalConfigDir;
    const log = vi.fn();
    beforeEach(() => {
        tempDir = mkdtempSync(join(tmpdir(), 'omc-prune-agent-dupes-'));
        originalConfigDir = process.env.CLAUDE_CONFIG_DIR;
        process.env.CLAUDE_CONFIG_DIR = tempDir;
        log.mockClear();
    });
    afterEach(() => {
        if (originalConfigDir === undefined) {
            delete process.env.CLAUDE_CONFIG_DIR;
        }
        else {
            process.env.CLAUDE_CONFIG_DIR = originalConfigDir;
        }
        rmSync(tempDir, { recursive: true, force: true });
    });
    it('removes standalone agents that match plugin-provided agents', async () => {
        vi.resetModules();
        const { prunePluginDuplicateAgents: prune, AGENTS_DIR: agentsDir } = await import('../index.js');
        mkdirSync(agentsDir, { recursive: true });
        createAgentFile(agentsDir, 'architect.md', 'architect');
        const removed = prune(log);
        expect(removed).toContain('architect.md');
        expect(existsSync(join(agentsDir, 'architect.md'))).toBe(false);
    });
    it('preserves user-created agents without OMC frontmatter', async () => {
        vi.resetModules();
        const { prunePluginDuplicateAgents: prune, AGENTS_DIR: agentsDir } = await import('../index.js');
        mkdirSync(agentsDir, { recursive: true });
        createUserFile(agentsDir, 'architect.md');
        const removed = prune(log);
        expect(removed).not.toContain('architect.md');
        expect(existsSync(join(agentsDir, 'architect.md'))).toBe(true);
    });
    it('does not remove agents not in the current package', async () => {
        vi.resetModules();
        const { prunePluginDuplicateAgents: prune, AGENTS_DIR: agentsDir } = await import('../index.js');
        mkdirSync(agentsDir, { recursive: true });
        createAgentFile(agentsDir, 'my-custom-agent.md', 'my-custom-agent');
        const removed = prune(log);
        expect(removed).not.toContain('my-custom-agent.md');
        expect(existsSync(join(agentsDir, 'my-custom-agent.md'))).toBe(true);
    });
    it('preserves AGENTS.md documentation file', async () => {
        vi.resetModules();
        const { prunePluginDuplicateAgents: prune, AGENTS_DIR: agentsDir } = await import('../index.js');
        mkdirSync(agentsDir, { recursive: true });
        writeFileSync(join(agentsDir, 'AGENTS.md'), '# Agent Catalog\nDocumentation.\n');
        const removed = prune(log);
        expect(removed).not.toContain('AGENTS.md');
        expect(existsSync(join(agentsDir, 'AGENTS.md'))).toBe(true);
    });
    it('returns empty when agents directory does not exist', () => {
        const removed = prunePluginDuplicateAgents(log);
        expect(removed).toEqual([]);
    });
});
// ── P2 regression (Codex, PR #2529 commit 2398ea66) ─────────────────────────
// `pruneStandaloneDuplicatesForPluginMode` accepts `opts.configDir`, but the
// three prune executors (`prunePluginDuplicateAgents`,
// `prunePluginDuplicateSkills`, `prunePluginDuplicateHooks`) ignored it and
// operated on module-level `AGENTS_DIR`/`SKILLS_DIR`/`HOOKS_DIR`. Preview
// (which DOES honor the override) and execute could target different
// profiles — leaving the requested profile uncleaned and potentially
// deleting files in the wrong one. The fix threads `opts.configDir`
// through each prune helper.
describe('prunePluginDuplicate* configDir override (Codex P2)', () => {
    let envDir;
    let overrideDir;
    let originalConfigDir;
    const log = vi.fn();
    beforeEach(() => {
        envDir = mkdtempSync(join(tmpdir(), 'omc-prune-env-'));
        overrideDir = mkdtempSync(join(tmpdir(), 'omc-prune-override-'));
        originalConfigDir = process.env.CLAUDE_CONFIG_DIR;
        process.env.CLAUDE_CONFIG_DIR = envDir;
        log.mockClear();
    });
    afterEach(() => {
        if (originalConfigDir === undefined) {
            delete process.env.CLAUDE_CONFIG_DIR;
        }
        else {
            process.env.CLAUDE_CONFIG_DIR = originalConfigDir;
        }
        rmSync(envDir, { recursive: true, force: true });
        rmSync(overrideDir, { recursive: true, force: true });
    });
    it('prunePluginDuplicateAgents honors opts.configDir and leaves the module-level dir untouched', async () => {
        vi.resetModules();
        const { prunePluginDuplicateAgents: prune, AGENTS_DIR: moduleAgentsDir } = await import('../index.js');
        // Seed BOTH dirs with an OMC-frontmatter agent that matches a package agent.
        mkdirSync(moduleAgentsDir, { recursive: true });
        mkdirSync(join(overrideDir, 'agents'), { recursive: true });
        createAgentFile(moduleAgentsDir, 'architect.md', 'architect');
        createAgentFile(join(overrideDir, 'agents'), 'architect.md', 'architect');
        const removed = prune(log, { configDir: overrideDir });
        // Override dir was pruned, env/module dir was NOT touched.
        expect(removed).toContain('architect.md');
        expect(existsSync(join(overrideDir, 'agents', 'architect.md'))).toBe(false);
        expect(existsSync(join(moduleAgentsDir, 'architect.md'))).toBe(true);
    });
    it('prunePluginDuplicateSkills honors opts.configDir and leaves the module-level dir untouched', async () => {
        vi.resetModules();
        const { prunePluginDuplicateSkills: prune, SKILLS_DIR: moduleSkillsDir } = await import('../index.js');
        // The prune-skills logic only removes skills whose name matches a
        // plugin-provided skill. Use 'omc-reference' which ships in the package.
        mkdirSync(moduleSkillsDir, { recursive: true });
        mkdirSync(join(overrideDir, 'skills'), { recursive: true });
        createSkillDir(moduleSkillsDir, 'omc-reference', 'omc-reference');
        createSkillDir(join(overrideDir, 'skills'), 'omc-reference', 'omc-reference');
        prune(log, { configDir: overrideDir });
        expect(existsSync(join(overrideDir, 'skills', 'omc-reference'))).toBe(false);
        expect(existsSync(join(moduleSkillsDir, 'omc-reference'))).toBe(true);
    });
    it('prunePluginDuplicateHooks honors opts.configDir and leaves the module-level dir untouched', async () => {
        vi.resetModules();
        const { prunePluginDuplicateHooks: prune, HOOKS_DIR: moduleHooksDir } = await import('../index.js');
        // Use a known OMC hook filename (from the internal OMC_HOOK_FILENAMES
        // allowlist at src/installer/index.ts:269). This is one of the scripts
        // the installer writes during hook setup.
        const omcHookName = 'keyword-detector.mjs';
        mkdirSync(moduleHooksDir, { recursive: true });
        mkdirSync(join(overrideDir, 'hooks'), { recursive: true });
        writeFileSync(join(moduleHooksDir, omcHookName), '#!/usr/bin/env node\n// env', 'utf-8');
        writeFileSync(join(overrideDir, 'hooks', omcHookName), '#!/usr/bin/env node\n// override', 'utf-8');
        const removed = prune(log, { configDir: overrideDir });
        expect(removed).toContain(join(overrideDir, 'hooks', omcHookName));
        expect(existsSync(join(overrideDir, 'hooks', omcHookName))).toBe(false);
        expect(existsSync(join(moduleHooksDir, omcHookName))).toBe(true);
    });
});
//# sourceMappingURL=stale-cleanup.test.js.map