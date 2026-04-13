/**
 * shim-matrix: black-box tests for the bash shims + resolve-omc-cli helper.
 *
 * The three shims are expected to:
 *   1. Resolve `omc` via PATH → `$CLAUDE_PLUGIN_ROOT/bridge/cli.cjs` →
 *      `<plugin_root>/bridge/cli.cjs` → `$CLAUDE_PLUGIN_ROOT/dist/cli/index.js` →
 *      `<plugin_root>/dist/cli/index.js` → error.
 *   2. Translate positional arguments into the correct `omc setup --...` flags.
 *   3. Passthrough exit codes and stderr from the CLI.
 *
 * These tests vendor a controlled copy of the shim + resolver into a tmpdir so
 * host state (a real `omc` on PATH, a real `bridge/cli.cjs`, etc.) cannot leak
 * into the scenario.  We stub the CLI with a tiny bash/node script that echoes
 * its arguments and exits with whatever code the test expects.
 *
 * Skipped on Windows (bash unavailable).
 */
export {};
//# sourceMappingURL=shim-matrix.test.d.ts.map