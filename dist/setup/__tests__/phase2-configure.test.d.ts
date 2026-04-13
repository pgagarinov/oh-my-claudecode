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
export {};
//# sourceMappingURL=phase2-configure.test.d.ts.map