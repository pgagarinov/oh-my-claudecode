/**
 * Tests for plugin-detection hook skip + duplicate-cleanup behavior.
 *
 * Behavior under test (tasks 1-6):
 *   1. When `--plugin-dir-mode` is set AND the plugin root has hooks/hooks.json,
 *      install() must NOT copy hook scripts to $CONFIG_DIR/hooks/.
 *   2. In the same case, install() must NOT write OMC hook entries to settings.json.
 *   3. When an installed_plugins.json marketplace manifest lists a plugin that
 *      ships hooks/hooks.json, the same skip applies.
 *   4. When plugin is active and leftover standalone hooks exist, they are pruned.
 *   5. When plugin is active and settings.json has OMC hook entries, they are stripped
 *      while preserving user-authored hooks.
 *
 * Tests run install() against throwaway tmpdirs. Module imports are reset between
 * tests so each call picks up the isolated CLAUDE_CONFIG_DIR.
 */
export {};
//# sourceMappingURL=plugin-hooks-skip.test.d.ts.map