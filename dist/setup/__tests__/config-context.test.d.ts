/**
 * Tests for `config-context.ts` — CLAUDE_CONFIG_DIR awareness for the
 * interactive setup wizard.
 *
 * Contract under test:
 *   - resolveConfigContext() honours CLAUDE_CONFIG_DIR when set, falls
 *     back to ~/.claude otherwise, and flags `envVarSet` accordingly.
 *   - resolveConfigContext() computes the concrete file lists that each
 *     target choice would touch.
 *   - formatConfigBanner() emits a banner containing the configDir, the
 *     env var status, and the per-target file lists.
 *   - describeTargetOption() emits the right per-target description with
 *     the resolved absolute path and (for global + env var set) the
 *     CLAUDE_CONFIG_DIR profile hint.
 *
 * Strategy: call the pure helpers directly with injected overrides so we
 * never mutate process.env. Each test is hermetic.
 */
export {};
//# sourceMappingURL=config-context.test.d.ts.map