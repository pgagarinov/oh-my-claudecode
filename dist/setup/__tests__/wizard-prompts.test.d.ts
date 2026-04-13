/**
 * Tests for `runInteractiveWizard()` — the pre-phase readline wizard used
 * by bare `omc setup` on a TTY.
 *
 * Strategy: drive the wizard with a scripted fake Prompter whose
 * `askSelect/askConfirm/askText/askSecret` methods return pre-programmed
 * answers. Assert on the returned `AnswersFile` shape and on which
 * questions were actually asked (to verify conditional gating).
 */
export {};
//# sourceMappingURL=wizard-prompts.test.d.ts.map