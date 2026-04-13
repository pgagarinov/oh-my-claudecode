/**
 * Tests for src/setup/config-writer.ts — atomic JSON writers.
 *
 * Covers the three invariants that the bash → TS port depends on:
 *   1. Shallow merges preserve unknown top-level keys (user customizations).
 *   2. Nested sets create intermediates and preserve siblings at every level.
 *   3. Atomic writes are interrupt-safe — if the temp file is created but the
 *      rename fails, the original target file must be unchanged.
 *
 * All file IO happens under `mkdtempSync(os.tmpdir())` so the tests are
 * hermetic and safe to run in parallel.
 */
export {};
//# sourceMappingURL=config-writer.test.d.ts.map