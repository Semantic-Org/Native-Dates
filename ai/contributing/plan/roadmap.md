# Roadmap

> status: active (2026-11-20). Project roadmap for `native-dates`. Completed milestones live in [`landed.md`](landed.md).

One row per planned feature or workstream. Plans requiring a detailed spec keep a single file in `plan/scopes/<name>.md` covering the goal and approved design. When a row finishes, move it from this table to [`landed.md`](landed.md).

- **Autonomy:** `agent` (runs autonomously from a scoped brief), `pair` (maintainer + agent collaboration), or `user` (maintainer-authored).
- **Maturity:** `initial` (open design questions) or `scoped` (concrete implementation plan agreed).

| Row | Autonomy | Maturity | Scope |
|---|---|---|---|
| User skills | pair | scoped | Author and cold-evaluate downstream skills in `ai/skills/`, publish in `package.json` `"files"`, and expose via `/skills/<skill>.md` and `/llms.txt` (`ai/contributing/workflows/author-user-skill.md`) |
| Benchmark suite | pair | initial | Port tachometer `bench/` runner and add hot-path operations (`ai/contributing/workflows/extend-bench-suite.md`) |
| Localization | agent | scoped | Translate and review localized documentation across enabled locales (`ai/contributing/workflows/docs-i18n.md`) |

## Icebox

- **Standalone MCP and CDN (`tools/mcp`, `tools/cdn`):** Add under `tools/mcp/` or `tools/cdn/` when adoption or distribution calls for them.
- **Retire `@native-dates/polyfill`:** Once baseline Safari ships native `Temporal`, retire `packages/polyfill`, remove playground polyfill shims in `docs/`, and simplify `Intl` epoch stand-ins that exist only for polyfilled `Temporal` objects.
