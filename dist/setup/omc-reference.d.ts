/**
 * `omc-reference` skill installer.
 *
 * TypeScript port of `install_omc_reference_skill()` from
 * scripts/setup-claude-md.sh:148-175.
 */
export interface InstallOmcReferenceResult {
    installed: boolean;
    sourceLabel: string | null;
    reason?: string;
}
/**
 * Install the `omc-reference` skill's `SKILL.md` to `skillTargetPath`.
 *
 * Tries `${canonicalPluginRoot}/skills/omc-reference/SKILL.md` first, then
 * falls back to `${CLAUDE_PLUGIN_ROOT}/skills/omc-reference/SKILL.md`. Returns
 * a skip result (no throw) when no source is available or the source is empty.
 * The target's parent directory is created if missing.
 */
export declare function installOmcReferenceSkill(skillTargetPath: string, canonicalPluginRoot?: string): InstallOmcReferenceResult;
//# sourceMappingURL=omc-reference.d.ts.map