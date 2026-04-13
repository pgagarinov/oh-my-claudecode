/**
 * Tests for src/setup/mcp-install.ts — claude mcp add wrapper.
 *
 * Strategy: we inject a fake `execFile` into `installMcpServers` so no real
 * `claude` process is spawned. All assertions are made against the captured
 * argv arrays. The invariants under test:
 *
 *   1. `--scope <value>` is ALWAYS present (default `user`).
 *   2. `-e KEY=` (empty env value) is NEVER passed — enforced for custom
 *      McpCustomSpec entries and implied by the skip-with-warning policy for
 *      context7/exa/github when credentials are missing.
 *   3. Missing credentials default to skip; `onMissingCredentials: 'error'`
 *      raises `McpCredentialMissingError`.
 *   4. Interactive blank response is treated as skip.
 *   5. Idempotence: the same server name listed twice only runs once.
 *   6. Custom McpCustomSpec entries produce the expected stdio/http args.
 */
export {};
//# sourceMappingURL=mcp-install.test.d.ts.map