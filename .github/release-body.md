# oh-my-claudecode v4.11.3: Bug Fixes

## Release Notes

Release with **7 bug fixes** across **9 merged PRs**.

### Highlights

- **fix(node): prefer PATH node over unstable execPath** (#2400)
- **fix(hooks): prevent .js false positives in .json/.jsonl source extension check** (#2395)
- **fix(autoresearch): strip TMUX env for nested tmux compatibility** (#2385)

### Bug Fixes

- **fix(node): prefer PATH node over unstable execPath** (#2400)
- **fix(hooks): prevent .js false positives in .json/.jsonl source extension check** (#2395)
- **fix(autoresearch): strip TMUX env for nested tmux compatibility** (#2385)
- **fix: resolve asymmetric symlink path resolution** (#2372)
- **fix(installer): detect enabledPlugins (Claude Code 1.x) in hasEnabledOmcPlugin (#2252 follow-up)** (#2371)
- **fix: deactivate stale ralplan stop enforcement after consensus completion** (#2370)
- **fix(hud): fall back to path-based version when package.json is missing** (#2362)

### Documentation

- **docs: document --plugin-dir and add CONTRIBUTING.md for local development** (#2399)
- **docs(getting-started): document plugin + npm CLI as two coexisting surfaces** (#2367)

### Stats

- **9 PRs merged** | **0 new features** | **7 bug fixes** | **0 security/hardening improvements** | **0 other changes**

### Install / Update

```bash
npm install -g oh-my-claude-sisyphus@4.11.3
```

Or reinstall the plugin:
```bash
claude /install-plugin oh-my-claudecode
```

**Full Changelog**: https://github.com/Yeachan-Heo/oh-my-claudecode/compare/v4.11.2...v4.11.3

## Contributors

Thank you to all contributors who made this release possible!

@DdangJin @kushalsai-01 @nextor2k @pgagarinov @Yeachan-Heo
