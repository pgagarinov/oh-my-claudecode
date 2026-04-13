/**
 * Tests for the plugin-presence check that gates the bare `omc setup`
 * safe-defaults path and the explicit `--wizard` path.
 *
 * The check fails with a clear error when neither CLAUDE_PLUGIN_ROOT nor
 * an installed OMC plugin root nor `--no-plugin` nor `--infra-only` is
 * present. It must NEVER fire for `--infra-only`, `--state-*`,
 * `--check-state`, `--claude-md-only`, or `--no-plugin`.
 */
export {};
//# sourceMappingURL=plugin-check.test.d.ts.map