/**
 * Unit tests for runLeftoverCleanupFlow — the plugin-duplicate leftover
 * preview + prompt + execute helper in runSetupCommand.
 *
 * Tests the TTY / non-TTY branching, preview-then-execute ordering,
 * and the user-declined path. Uses real filesystem fixtures in tmpdirs.
 *
 * Module-const caveat: src/installer/index.ts reads CLAUDE_CONFIG_DIR at
 * load time into module-level constants (AGENTS_DIR, HOOKS_DIR, etc.).
 * Every test therefore calls vi.resetModules() and fresh-imports BEFORE
 * mutating CLAUDE_CONFIG_DIR — otherwise the stale module constant points
 * at the wrong directory.
 *
 * readline mock: askYesNo uses `await import('node:readline')` (ESM dynamic
 * import). vi.mock() at the top level is hoisted and intercepts the ESM
 * module registry, so it works; vi.spyOn(require(...)) does NOT work here.
 */
export {};
//# sourceMappingURL=leftover-cleanup-flow.test.d.ts.map