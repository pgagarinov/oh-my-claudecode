/**
 * End-to-end round-trip tests for the OMC uninstaller.
 *
 * Tests the full lifecycle: setup → idempotent-setup → uninstall →
 * idempotent-uninstall → re-install, all inside a throwaway tmpdir.
 *
 * Uses a real `install()` invocation (not mocked) against a custom
 * CLAUDE_CONFIG_DIR so the real user's ~/.claude is never touched.
 *
 * No HTTP calls: the installer reads CLAUDE.md from the local package's
 * docs/ directory (resolveActivePluginRoot falls back to the repo root).
 *
 * Skipped on Windows (rmSync recursion quirks with locked files in CI).
 */
export {};
//# sourceMappingURL=uninstall-roundtrip.e2e.test.d.ts.map