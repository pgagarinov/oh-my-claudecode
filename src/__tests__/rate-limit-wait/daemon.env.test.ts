/**
 * Tests for daemon.ts CLAUDE_CONFIG_DIR env propagation at spawn site.
 *
 * Verifies PR-1 of the multi-profile rate-limit-wait plan:
 *   - cfg.claudeConfigDir override wins over parent process env
 *   - process.env.CLAUDE_CONFIG_DIR is forwarded when cfg override is absent
 *   - When neither is set, CLAUDE_CONFIG_DIR is NOT present in child env
 *   - DAEMON_ENV_ALLOWLIST allowlist invariant: no sensitive vars leak
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Capture spawn calls so we can inspect the env argument
interface SpawnCall {
  command: string;
  args: readonly string[];
  options: { env?: NodeJS.ProcessEnv } & Record<string, unknown>;
}
const spawnCalls: SpawnCall[] = [];

vi.mock('child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('child_process')>();
  return {
    ...actual,
    spawn: vi.fn((command: string, args: readonly string[], options: SpawnCall['options']) => {
      spawnCalls.push({ command, args, options });
      // Return a minimal ChildProcess-compatible stub (only pid + unref are read by startDaemon)
      return {
        pid: 99999,
        unref: vi.fn(),
      } as unknown as ReturnType<typeof actual.spawn>;
    }),
  };
});

import { startDaemon } from '../../features/rate-limit-wait/daemon.js';
import type { DaemonConfig } from '../../features/rate-limit-wait/types.js';

describe('daemon CLAUDE_CONFIG_DIR env propagation (PR-1)', () => {
  const testDir = join(tmpdir(), 'omc-daemon-env-test-' + Date.now());
  const baseConfig: DaemonConfig = {
    stateFilePath: join(testDir, 'state.json'),
    pidFilePath: join(testDir, 'daemon.pid'),
    logFilePath: join(testDir, 'daemon.log'),
    pollIntervalMs: 1000,
  };

  const ENV_KEYS = ['CLAUDE_CONFIG_DIR', 'ANTHROPIC_API_KEY', 'GITHUB_TOKEN', 'AWS_ACCESS_KEY_ID'] as const;
  const savedEnv = new Map<(typeof ENV_KEYS)[number], string | undefined>();

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
    spawnCalls.length = 0;
    for (const k of ENV_KEYS) {
      savedEnv.set(k, process.env[k]);
      delete process.env[k];
    }
  });

  afterEach(() => {
    // Best-effort teardown: state files from prior tests would otherwise make
    // isDaemonRunning report our fake PID 99999 as alive, blocking later starts.
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
    for (const k of ENV_KEYS) {
      const v = savedEnv.get(k);
      if (v !== undefined) process.env[k] = v;
      else delete process.env[k];
    }
  });

  function getSpawnedEnv(): NodeJS.ProcessEnv {
    expect(spawnCalls.length).toBeGreaterThan(0);
    const call = spawnCalls[spawnCalls.length - 1];
    expect(call.options.env).toBeDefined();
    return call.options.env!;
  }

  it('forwards parent process.env.CLAUDE_CONFIG_DIR into child env', () => {
    process.env.CLAUDE_CONFIG_DIR = '/tmp/ccd-parent';
    startDaemon(baseConfig);
    const env = getSpawnedEnv();
    expect(env.CLAUDE_CONFIG_DIR).toBe('/tmp/ccd-parent');
  });

  it('cfg.claudeConfigDir override wins over parent process env', () => {
    process.env.CLAUDE_CONFIG_DIR = '/tmp/ccd-parent';
    startDaemon({ ...baseConfig, claudeConfigDir: '/tmp/ccd-explicit' });
    const env = getSpawnedEnv();
    expect(env.CLAUDE_CONFIG_DIR).toBe('/tmp/ccd-explicit');
  });

  it('omits CLAUDE_CONFIG_DIR when neither cfg override nor parent env is set', () => {
    startDaemon(baseConfig);
    const env = getSpawnedEnv();
    expect('CLAUDE_CONFIG_DIR' in env).toBe(false);
  });

  it('never leaks sensitive credentials via env allowlist (regression guard)', () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test-should-not-leak';
    process.env.GITHUB_TOKEN = 'ghp-test-should-not-leak';
    process.env.AWS_ACCESS_KEY_ID = 'AKIA-test-should-not-leak';
    startDaemon(baseConfig);
    const env = getSpawnedEnv();
    expect(env.ANTHROPIC_API_KEY).toBeUndefined();
    expect(env.GITHUB_TOKEN).toBeUndefined();
    expect(env.AWS_ACCESS_KEY_ID).toBeUndefined();
  });
});
