/**
 * End-to-end tests for `runSetup()` (src/setup/index.ts).
 *
 * Covers scenarios from plan "replicated-mixing-wren.md":
 *   - A4/A5/A6: wizard TTY/non-TTY/preset
 *   - A21/A22: already-configured + --force bypass
 *   - A23/A24: resume prompt + skip completed phases
 *   - I6: concurrent lockfile blocks second invocation
 *   - I7: partial failure mid-phase preserves state
 *   - J1/J2/J3/J4: interactive/non-interactive edge cases
 *   - SIGINT during run releases lockfile
 *
 * All phases are mocked via `deps` injection — real phase modules are
 * NOT exercised here (they have their own unit tests). The goal is to
 * pin the dispatch/lock/state semantics of `runSetup` itself.
 */
export {};
//# sourceMappingURL=run-setup.e2e.test.d.ts.map