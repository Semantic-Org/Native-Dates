# Roadmap

Confirmed features and workstreams planned for `native-dates`. Items land here once agreed on as part of the project. Open a [GitHub issue](https://github.com/Semantic-Org/Native-Dates/issues) to propose new features or discuss design before starting work, and move completed milestones to [`landed.md`](landed.md).

Larger features with open design details keep a spec in `scopes/<name>.md`.

| Feature | Status | Summary |
|---|---|---|
| Consumer agent skills | Ready to build | Publish downstream usage skills in `ai/skills/` with the npm package and serve them at `/skills/<name>.md` and `/llms.txt` on the docs site |
| Benchmark suite | Needs design | Automated browser benchmark suite in `bench/` measuring parsing, arithmetic, formatting, and range iteration across changes |
| Documentation translations | Ready to build | Translated and reviewed guides, API references, and examples across the 8 supported locales |

## Deferred

Confirmed direction, waiting on external platform support or demonstrated demand:

- **Retire `@native-dates/polyfill`:** Once baseline Safari ships native `Temporal`, sunset `@native-dates/polyfill` and drop polyfill-only shims in the docs playground and `Intl` formatting helpers.
- **Standalone MCP server and CDN bundle:** Optional distribution targets if downstream tooling or script-tag usage warrants them.
