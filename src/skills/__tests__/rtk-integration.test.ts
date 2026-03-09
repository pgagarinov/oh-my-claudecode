import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const REPO_ROOT = join(__dirname, '..', '..', '..');

function readProjectFile(...segments: string[]): string {
  return readFileSync(join(REPO_ROOT, ...segments), 'utf-8');
}

describe('rtk integration guidance', () => {
  it('documents optional rtk setup flow in omc-setup phase 3', () => {
    const content = readProjectFile('skills', 'omc-setup', 'phases', '03-integrations.md');

    expect(content).toContain('Configure rtk Token Optimization');
    expect(content).toContain('.omcSetup.rtk // true');
    expect(content).toContain('rtk init --show');
    expect(content).toContain('rtk init -g --auto-patch');
    expect(content).toContain('brew install rtk');
    expect(content).toContain('install.sh | sh');
    expect(content).toContain('https://github.com/rtk-ai/rtk/releases');
    expect(content).toContain('Never fail setup just because `rtk` is missing');
    expect(content).toContain('rtk init -g --no-patch');
  });

  it('documents rtk recommendation in omc-doctor output', () => {
    const content = readProjectFile('skills', 'omc-doctor', 'SKILL.md');

    expect(content).toContain('✅ rtk installed');
    expect(content).toContain('rtk init --show');
    expect(content).toContain('⚠️ rtk not installed (recommended for token savings)');
    expect(content).toContain('| rtk | OK/WARN |');
  });

  it('mentions rtk in generated CLAUDE.md and repository README', () => {
    const claudeMd = readProjectFile('docs', 'CLAUDE.md');
    const readme = readProjectFile('README.md');

    expect(claudeMd).toContain('https://github.com/rtk-ai/rtk');
    expect(claudeMd).toContain('token-optimization');
    expect(readme).toContain('Optional: rtk for lower token usage');
    expect(readme).toContain('[rtk](https://github.com/rtk-ai/rtk)');
  });
});
