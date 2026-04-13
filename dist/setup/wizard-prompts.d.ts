/**
 * Pre-phase interactive wizard for bare `omc setup` on a TTY.
 *
 * Iterates through `QUESTION_METADATA` — the same 11 questions asked by the
 * `/oh-my-claudecode:omc-setup` skill via AskUserQuestion — and collects
 * answers through a `Prompter` (`createReadlinePrompter` in production).
 *
 * The resulting `AnswersFile` is ready for `buildPreset()` to convert into
 * a fully-resolved `SetupOptions`. Conditional questions (installStyle,
 * team display/count/type, per-server credentials) are gated inline so we
 * never prompt for fields that don't apply.
 *
 * This module is invoked BEFORE `runSetup` — it is a UI-only layer. No
 * filesystem writes, no phase execution. `runSetup` is called afterwards
 * with the merged SetupOptions.
 *
 * Plan reference: user request "bare omc setup on TTY = interactive wizard
 * like /omc-setup, non-TTY = safe-defaults, --non-interactive = explicit
 * safe-defaults, --interactive non-TTY = error".
 */
import type { AnswersFile } from './preset-builder.js';
import type { Prompter } from './prompts.js';
import { type ConfigContext } from './config-context.js';
export interface WizardOptions {
    /**
     * Caller-supplied check: does the current install target have a base
     * CLAUDE.md without OMC markers? When `true`, the wizard asks the
     * `installStyle` question; when `false`, it defaults to 'overwrite' and
     * skips the prompt entirely.
     */
    detectInstallStyleNeeded?: () => boolean;
    /**
     * Pre-resolved config context (default: `resolveConfigContext()`). Tests
     * pass a fixture context so they can assert on exact paths and banner
     * content without mutating `process.env` or `process.cwd`.
     */
    configContext?: ConfigContext;
    /**
     * Override ANSI color emission for the banner (default: auto-detect
     * via `isColorEnabled()`). Tests pass `false` so fixture strings stay
     * free of escape sequences.
     */
    colorEnabled?: boolean;
    /**
     * Skip the `installCli` question entirely and resolve it as `false`
     * (i.e. do not install the CLI). Wire this to `true` when the wizard
     * is being launched FROM the `omc` CLI itself — the user clearly
     * already has the CLI on PATH, so asking whether to install it is a
     * non-sequitur. The `/oh-my-claudecode:omc-setup` skill path runs
     * inside a Claude Code session where the standalone CLI may or may
     * not be installed, so the skill leaves this flag at its default
     * (`false`) and still shows the question.
     */
    skipInstallCliQuestion?: boolean;
}
/**
 * Run the 11-question interactive wizard and return an `AnswersFile` ready
 * for `buildPreset()`. Conditional questions are gated inline.
 *
 * Prompter lifecycle is the caller's responsibility — this function never
 * constructs or closes a prompter itself.
 */
export declare function runInteractiveWizard(prompter: Prompter, opts?: WizardOptions): Promise<AnswersFile>;
//# sourceMappingURL=wizard-prompts.d.ts.map