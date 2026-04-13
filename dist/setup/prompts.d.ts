/**
 * Interactive prompter — ReadlinePrompter and NullPrompter for `omc setup`.
 *
 * Plan reference: /Users/peter/.claude-personal/plans/replicated-mixing-wren.md
 *   — "Interactive prompter (`src/setup/prompts.ts`)"
 *
 * Design:
 *   - `createReadlinePrompter()` returns a Prompter backed by `readline/promises`.
 *     Throws `InteractiveRequiredError` immediately if the environment is
 *     non-interactive (no TTY, CI flag, etc.) — matches bash shim behavior of
 *     refusing to prompt in hooks or pipelines.
 *   - `createNullPrompter()` returns a Prompter whose methods always throw
 *     `NullPrompterError`. Used by `runSetup` in non-interactive mode as a
 *     sentinel so that any attempt to resolve an unset field loudly fails
 *     instead of silently hanging on a closed stdin.
 *   - `askSecret` suppresses echo by overriding the readline output writer
 *     (the only portable approach that works without going raw-mode on stdin,
 *     which would break SIGINT/Ctrl-C handling for the surrounding runSetup).
 */
export interface PrompterSelectOption<T extends string> {
    label: T;
    description: string;
}
export interface Prompter {
    askSelect<T extends string>(question: string, options: PrompterSelectOption<T>[], defaultValue: T): Promise<T>;
    askConfirm(question: string, defaultValue: boolean): Promise<boolean>;
    askText(question: string, defaultValue?: string): Promise<string>;
    askSecret(question: string): Promise<string>;
    /**
     * Emit a non-prompt message to the prompter's output sink (e.g. a
     * pre-wizard banner showing the active config profile). Implementations
     * must be synchronous and side-effect only: no newline injection, no
     * transformation of the payload. Callers own the newline convention.
     */
    write(message: string): void;
    close(): void;
}
export declare class InteractiveRequiredError extends Error {
    constructor(message?: string);
}
export declare class NullPrompterError extends Error {
    constructor(field: string);
}
export interface ReadlinePrompterOptions {
    input?: NodeJS.ReadableStream;
    output?: NodeJS.WritableStream;
    /** Skip the TTY check — used by unit tests that feed mocked streams. */
    forceInteractive?: boolean;
}
export declare function createReadlinePrompter(opts?: ReadlinePrompterOptions): Prompter;
export declare function createNullPrompter(): Prompter;
//# sourceMappingURL=prompts.d.ts.map