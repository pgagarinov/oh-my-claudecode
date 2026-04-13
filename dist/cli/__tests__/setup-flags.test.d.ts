/**
 * Per-flag unit tests for `omc setup` (PR3 CLI wire-up).
 *
 * Complements:
 *   - `cli-setup-backward-compat.test.ts` (pins bare-infra non-regression #1
 *     at the `runSetup()` level)
 *   - `setup-command-precedence.test.ts` (plugin-dir-mode / env precedence)
 *
 * Coverage here:
 *   1. Per-flag pass-through — each new flag on `omc setup` lands on the
 *      correct `SetupOptions` field when driven through the real commander
 *      pipeline (buildProgram → parseAsync).
 *   2. `--help` sanity — every new flag long-name is registered on the
 *      setup command, and `--build-preset` is marked as internal.
 *   3. Illegal combinations X1–X12 — each surfaces as exit code 2 with the
 *      plan-specified error message.
 *   4. `--skip-hooks` deprecation advisory is emitted to stderr.
 *   5. `--build-preset` round-trips a valid answers file into a preset JSON.
 *   6. `--check-state` forwards through to runSetup.
 *
 * Testing strategy: runSetup is mocked at the module level via `vi.hoisted`
 * + `vi.mock`, so the CLI action can resolve without touching the real
 * filesystem or acquiring the setup lockfile. Tests assert on the exact
 * SetupOptions passed to the runSetup spy.
 */
export {};
//# sourceMappingURL=setup-flags.test.d.ts.map