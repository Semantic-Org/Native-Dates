# Launch Roadmap

> status: active pre-1.0 (2026-11-20). Core nouns, plugins, test suite, documentation, bespoke homepage, size budget, and north star are in place (`landed.md`). Remaining 1.0 milestones follow below.

One row per pending milestone. Rows requiring a detailed spec keep a single file in `plan/scopes/<name>.md` covering the agenda and approved spec. When a row finishes, move it from this table to [`landed.md`](landed.md).

- **Autonomy:** `agent` (runs autonomously from a scoped brief), `pair` (maintainer + agent collaboration), or `user` (maintainer-authored).
- **Maturity:** `initial` (open design questions) or `scoped` (concrete implementation plan agreed).

| Row | Autonomy | Maturity | Scope |
|---|---|---|---|
| Benchmark suite | pair | initial | Port tachometer `bench/` runner and add hot-path operations (`ai/contributing/workflows/extend-bench-suite.md`) |
| User skills | pair | scoped | Author and cold-evaluate downstream skills in `ai/skills/`, then publish in `package.json` `"files"` and expose via `/skills/<skill>.md` and `/llms.txt` (`ai/contributing/workflows/author-user-skill.md`) |
| Type declarations | pair | scoped | Audit `.d.ts` doc comments and add `@see` links to `https://nativedates.dev` once docs anchors settle (`ai/contributing/standards/types.md`) |
| Localization review | agent | scoped | Verify and review localized documentation and homepage copy across enabled locales (`ai/contributing/workflows/docs-i18n.md`) |
| First release | user | initial | Align lockstep versions across workspace packages, tag `v1.0.0`, publish to npm, and deploy production docs |

## Optional Post-Launch Additions

- **Standalone MCP and CDN (`tools/mcp`, `tools/cdn`):** Omitted at initial launch. Add under `tools/mcp/` or `tools/cdn/` post-launch only when adoption or distribution calls for them.
- **Retire `@native-dates/polyfill`:** Once baseline Safari ships native `Temporal`, retire `packages/polyfill`, remove playground polyfill shims in `docs/`, and simplify `Intl` epoch stand-ins that exist only for polyfilled `Temporal` objects.
