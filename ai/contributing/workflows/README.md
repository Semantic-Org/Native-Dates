# Contributor Workflows

Step-by-step guides for working in `native-dates`. Load only the workflow for your current task.

Skills published with the package belong in [skills](../../skills/). Design rulings are in [decisions](../decisions.md) and shared standards are in [standards](../standards/README.md).

| Workflow | Load when |
|---|---|
| [`contribute.md`](contribute.md) | Fixing or reporting a bug, or adding a feature on behalf of a human contributor |
| [`author-skill.md`](author-skill.md) | Authoring, rewriting, or evaluating skills in `ai/skills/` |
| [`clean-room-dx-review.md`](clean-room-dx-review.md) | Commissioning a quarantined fresh-reader DX review over candidate public API surface |
| [`read-ci-reports.md`](read-ci-reports.md) | Reviewing or acting on Bundle Size and Bench pull request comments |
| [`extend-bench-suite.md`](extend-bench-suite.md) | Adding or modifying benchmark operations in `bench/` or tuning `bench/tachometer.json` |
| [`docs-writing.md`](docs-writing.md) | Authoring or editing guides, API pages, or plugin pages under `docs/src/content/` |
| [`docs-authoring.md`](docs-authoring.md) | Modifying the Astro documentation site, required UI features, or design conventions |
| [`docs-i18n.md`](docs-i18n.md) | Translating finalized documentation before a release or changing locale routing |

For error messages, warnings, and log lines, follow the [errors and logs guide](../standards/legibility/errors-and-logs.md) and run `npm run errors` and `npm run check`.
