/**
 * skill-omc-setup.e2e: single smoke test for the CLI chain the `omc-setup`
 * skill performs at runtime.
 *
 * We do NOT test the LLM's interpretation of the SKILL.md instructions —
 * that is not a reproducible target. What we DO test is that the deterministic
 * pipeline the skill delegates to actually works end-to-end:
 *
 *   1. `omc setup --check-state`          → emits a single JSON line on stdout.
 *   2. Skill writes an AnswersFile JSON.
 *   3. `omc setup --build-preset --answers <in> --out <out>`
 *                                         → writes a valid preset JSON on disk.
 *   4. `omc setup --preset <file>`        → exit 0 (dry run).
 *
 * Step 4 is invoked with `--quiet` and an isolated HOME/configDir so it does
 * not mutate the developer's real ~/.claude. We only assert that the CLI
 * returns exit 0 — the per-phase behavior is exhaustively covered by the
 * integration/parity tests. This test exists to catch wire-up regressions
 * where the three subcommands stop agreeing on their file contract.
 *
 * Skipped on Windows.
 */
export {};
//# sourceMappingURL=skill-omc-setup.e2e.test.d.ts.map