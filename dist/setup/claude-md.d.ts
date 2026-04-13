/**
 * CLAUDE.md installation / merge / preserve-mode orchestration.
 *
 * TypeScript port of scripts/setup-claude-md.sh (422 lines).
 *
 * The 22 numbered behaviors below map 1:1 to rows in the "Phase 1 port"
 * behavior table of the replicated-mixing-wren plan. Every behavior has
 * a corresponding unit test in __tests__/claude-md.test.ts.
 */
/**
 * Canonical GitHub fallback URL. Only used when neither the active plugin
 * root nor `CLAUDE_PLUGIN_ROOT` has `docs/CLAUDE.md` on disk.
 */
export declare const DOWNLOAD_URL = "https://raw.githubusercontent.com/Yeachan-Heo/oh-my-claudecode/main/docs/CLAUDE.md";
/**
 * Behavior #2 — `ensure_local_omc_git_exclude` (bash lines 95-125).
 *
 * Resolves `.git/info/exclude` via `git rev-parse --git-path info/exclude`
 * so it works inside worktrees. Idempotent: a second call is a no-op when
 * the marker block is already present.
 */
export declare function ensureLocalOmcGitExclude(opts?: {
    cwd?: string;
    logger?: (line: string) => void;
}): void;
/**
 * Behavior #4 — Target-path resolution (bash lines 127-140).
 */
export interface TargetPaths {
    targetPath: string;
    skillTargetPath: string;
    companionPath: string;
}
export declare function resolveTargetPaths(mode: 'local' | 'global', configDir: string, cwd?: string): TargetPaths;
/**
 * Behavior #6 — Old-version extraction (bash lines 178-184).
 *
 * 1. `OMC:VERSION:` marker in the existing file → use that
 * 2. File exists but no marker → fall back to the runtime package version
 *    (NOT `omc --version`; that would recurse into `omc setup`)
 * 3. File missing → `'none'` (signals "fresh install" to `reportVersionChange`)
 */
export declare function extractOldVersion(targetPath: string): string;
/**
 * Behavior #7 — Timestamped backup (bash lines 187-193).
 */
export interface BackupResult {
    backupDate: string;
    backupPath: string | null;
}
export declare function backupIfExists(targetPath: string, opts?: {
    logger?: (line: string) => void;
    now?: Date;
}): BackupResult;
/**
 * Behavior #8 — Canonical OMC content fallback chain (bash lines 249-258).
 *
 * 1. `<pluginRoot>/docs/CLAUDE.md` if present
 * 2. `$CLAUDE_PLUGIN_ROOT/docs/CLAUDE.md` if present
 * 3. GitHub fetch via Node 20+ global `fetch` (NOT external curl)
 */
export interface LoadCanonicalResult {
    content: string;
    sourceLabel: string;
}
export declare function loadCanonicalOmcContent(pluginRoot: string, opts?: {
    downloadUrl?: string;
    fetchImpl?: typeof fetch;
}): Promise<LoadCanonicalResult>;
/**
 * Behavior #9 — Canonical-source marker validation (bash lines 267-271).
 */
export declare function validateOmcMarkers(content: string, sourceLabel: string): void;
/**
 * Behavior #10 — Strip outer OMC markers for idempotency (bash lines 273-278).
 *
 * Returns the content strictly BETWEEN the first `OMC:START` and last
 * `OMC:END` lines (exclusive of both marker lines), matching the awk
 * program at bash line 276.
 */
export declare function stripOmcMarkers(content: string): string;
/**
 * Additional helper — `ensure_not_symlink_path` (bash lines 236-244).
 *
 * Exact error text: `Refusing to write <label> because the destination is
 * a symlink: <path>` — asserted by H7 and the parity test.
 */
export declare function ensureNotSymlinkPath(targetPath: string, label: string): void;
/**
 * Behavior #11 — `write_wrapped_omc_file` (bash lines 203-211).
 *
 * Produces: `START_MARKER\n<omcContent>\nEND_MARKER\n` — matches the bash
 * `echo … cat … echo` concatenation byte-for-byte (modulo any trailing
 * newline already present in `omcContent`).
 */
export declare function writeWrappedOmcFile(destination: string, omcContent: string): void;
/**
 * Additional helper — `ensure_managed_companion_import` (bash lines 213-234).
 *
 * Strips any existing `OMC:IMPORT` block, then appends a fresh block
 * pointing at `companionName`. Idempotent.
 */
export declare function ensureManagedCompanionImport(targetPath: string, companionName: string): void;
/**
 * Behavior #12 — Marker-aware merge with corrupted-marker recovery
 * (bash lines 286-320).
 *
 * This is the ported equivalent of the former `mergeClaudeMd()` in
 * `src/installer/index.ts:1091-1148`. The TS version keeps a divergence
 * from bash that the existing installer tests already pin: residual
 * unmatched markers are stripped from the recovered content (rather than
 * preserved verbatim) to prevent unbounded growth on repeated re-runs —
 * regression test lives in `src/installer/__tests__/claude-md-merge.test.ts`.
 */
export declare function mergeClaudeMd(existingContent: string | null, omcContent: string, version?: string): string;
/** Behavior #12 (alias) — port of bash `mergeOmcBlock`. Delegates to `mergeClaudeMd`. */
export declare function mergeOmcBlock(existing: string, omcContent: string, version?: string): string;
/**
 * Behavior #13 — `--global --preserve` companion-mode install
 * (bash lines 321-332 + helpers at 203-234, 236-244).
 */
export interface PreserveModeArgs {
    targetPath: string;
    companionPath: string;
    omcContent: string;
    backupDate: string;
    logger?: (line: string) => void;
}
export declare function installPreserveMode(args: PreserveModeArgs): void;
/**
 * Behavior #14 — No-markers migration branch (bash lines 333-351).
 */
export declare function migrateNoMarkers(existingContent: string, omcContent: string): string;
/**
 * Behavior #15 — Orphaned companion cleanup after overwrite-mode install
 * (bash lines 354-367). Back up then remove `CLAUDE-omc.md` so a later
 * `omc launch` doesn't read stale companion content.
 */
export declare function cleanupOrphanedCompanion(configDir: string, backupDate: string, opts?: {
    logger?: (line: string) => void;
}): void;
/**
 * Behavior #16 — Post-write marker validation (bash lines 369-372).
 */
export declare function validatePostWrite(targetPath: string): void;
/**
 * Behavior #19 — Version-change stdout report (bash lines 380-394).
 * BYTE-IDENTICAL format strings — parity test enforces this.
 */
export declare function reportVersionChange(oldVersion: string, newVersion: string, opts?: {
    logger?: (line: string) => void;
}): void;
/**
 * Behavior #20 — Legacy hook file cleanup, global mode only
 * (bash lines 396-402).
 */
export declare function cleanupLegacyHooks(configDir: string, opts?: {
    logger?: (line: string) => void;
}): void;
/**
 * Behavior #21 — Warn if legacy hook entries persist in `settings.json`
 * (bash lines 404-413). Byte-identical warning text.
 */
export declare function warnLegacyHooksInSettings(settingsPath: string, opts?: {
    logger?: (line: string) => void;
}): void;
/**
 * Behavior #22 — Final plugin verification message (bash lines 417-421).
 */
export declare function reportPluginStatus(settingsPath: string, opts?: {
    logger?: (line: string) => void;
}): void;
export interface InstallClaudeMdOptions {
    mode: 'local' | 'global';
    installStyle?: 'overwrite' | 'preserve';
    configDir?: string;
    cwd?: string;
    pluginRoot?: string;
    skipOmcReferenceCopy?: boolean;
    skipGitExclude?: boolean;
    logger?: (line: string) => void;
    /** Override the GitHub fallback URL (test-only). */
    downloadUrl?: string;
    /** Override `fetch` for the GitHub fallback (test-only). */
    fetchImpl?: typeof fetch;
    /** Override `Date.now()` for deterministic backup timestamps (test-only). */
    now?: Date;
}
export interface InstallClaudeMdResult {
    mode: 'local' | 'global';
    installStyle: 'overwrite' | 'preserve';
    targetPath: string;
    skillTargetPath: string;
    companionPath: string;
    validationPath: string;
    oldVersion: string;
    newVersion: string;
    backupPath: string | null;
    backupDate: string;
    sourceLabel: string;
    pluginRoot: string;
}
/**
 * Top-level CLAUDE.md install/merge orchestrator.
 * Ports the entire control flow of `setup-claude-md.sh` (lines 127-421).
 *
 * Sequencing (matches the numbered behaviors 1–22):
 *   1 → resolveActivePluginRoot()
 *   4 → resolveTargetPaths()
 *   5 → type-level install-style validation
 *   6 → extractOldVersion()
 *   7 → backupIfExists()
 *   8 → loadCanonicalOmcContent()
 *   9 → validateOmcMarkers()
 *  10 → stripOmcMarkers()
 *  11 → writeWrappedOmcFile() on fresh install
 *  12 → mergeClaudeMd() on marker-present existing file
 *  13 → installPreserveMode() on global + preserve + no-markers base
 *  14 → migrateNoMarkers() on no-markers existing file
 *  15 → cleanupOrphanedCompanion() after overwrite-mode merge
 *  16 → validatePostWrite()
 *  17 → installOmcReferenceSkill()
 *  18 → ensureLocalOmcGitExclude() for local mode
 *  19 → reportVersionChange()
 *  20 → cleanupLegacyHooks() for global mode
 *  21 → warnLegacyHooksInSettings() for global mode
 *  22 → reportPluginStatus()
 */
export declare function installClaudeMd(opts: InstallClaudeMdOptions): Promise<InstallClaudeMdResult>;
//# sourceMappingURL=claude-md.d.ts.map