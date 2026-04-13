/**
 * Tests for src/setup/prompts.ts — ReadlinePrompter & NullPrompter.
 *
 * Approach: feed a scripted stdin stream into `createReadlinePrompter` with
 * `forceInteractive: true` so the TTY guard doesn't reject the test env, then
 * assert on the captured output and resolved values. We never touch real
 * process.stdin so these tests are safe for CI.
 */
export {};
//# sourceMappingURL=prompts.test.d.ts.map