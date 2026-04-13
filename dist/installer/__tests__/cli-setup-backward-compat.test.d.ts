/**
 * Backward-compat / safe-defaults flip for the setup-unification PR6:
 *
 * Originally (PR1-PR5) bare `omc setup --force` routed phases={'infra'} only
 * and pinned the exact install() call shape — the "infra-only non-regression
 * #1" contract. In PR6 we INTENTIONALLY flip the bare path to run the
 * SAFE_DEFAULTS preset (claude-md + infra + integrations + welcome), and
 * move the old contract behind the explicit `--infra-only` escape flag.
 *
 * This test file now pins BOTH contracts:
 *   - `--infra-only` path: phases={'infra'}, install() called with today's
 *     six-key shape, NO phase2/3/4 helpers invoked, NO CLAUDE.md touched.
 *     This keeps the pre-safe-defaults behavior available for CI /
 *     provisioning / automation that historically relied on bare-is-minimal.
 *   - Safe-defaults path: phases matches SAFE_DEFAULTS (claude-md, infra,
 *     integrations, welcome), runSetup is called with a fully-resolved
 *     SetupOptions whose nested fields match the SAFE_DEFAULTS constant.
 *
 * Plan ref: user request "make bare omc setup run the best result out of
 * the box, keep --infra-only as escape hatch".
 */
export {};
//# sourceMappingURL=cli-setup-backward-compat.test.d.ts.map