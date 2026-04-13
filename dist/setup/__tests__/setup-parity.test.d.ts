/**
 * Parity test: pinned legacy bash vs new TypeScript CLAUDE.md installer.
 *
 * Runs `tests/fixtures/legacy/setup-claude-md.sh.pre-refactor` and the new
 * `installClaudeMd()` against identical pre-state fixtures in paired tmpdirs,
 * then byte-compares the resulting CLAUDE.md content and filesystem side effects.
 *
 * Stdout byte-comparison is intentionally skipped: the TS implementation emits
 * extra lines (`reportPluginStatus`, `warnLegacyHooksInSettings`) not present in
 * the bash script.  What matters for parity is the on-disk result, not log lines.
 *
 * Skipped on Windows (bash unavailable).
 */
export {};
//# sourceMappingURL=setup-parity.test.d.ts.map