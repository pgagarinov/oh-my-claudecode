/**
 * Tests for src/setup/hud-config-writer.ts
 *
 * Verifies `writeHudConfig`:
 *   - Creates .omc-config.json when missing.
 *   - Preserves unknown top-level keys (setupVersion, etc.) via shallow merge.
 *   - Preserves unrelated `hud.*` sub-keys when patching only `hud.elements`.
 *   - Merges `hud.elements` shallowly (existing keys survive unless overridden).
 *   - No-op for empty patch.
 */
export {};
//# sourceMappingURL=hud-config-writer.test.d.ts.map