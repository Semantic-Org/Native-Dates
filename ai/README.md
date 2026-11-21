# Agent Context

`ai/` separates the skills published with `native-dates` from the internal records used to develop this repository.

| Path | Audience | In npm package |
|---|---|---|
| [`skills/`](skills/) | Agents building an app with `native-dates` | Yes |
| [`contributing/`](contributing/README.md) | Contributors working on `native-dates` | No |
| `workspace/` | Local scratch files, ignored by git | No |

## Skills

Files in [skills](skills/) ([`native-dates.md`](skills/native-dates.md) and [`native-dates-plugins.md`](skills/native-dates-plugins.md)) are included in the npm package for coding agents reading from installed dependencies, served by the docs site at `/skills/<skill>.md`, and listed in `/llms.txt` and `/llms-full.txt`.

Agents receive a skill on its own without the rest of this repository. Read the [authoring standard](contributing/standards/ai-author-context.md) and the [skill workflow](contributing/workflows/author-skill.md) before writing or editing one.

## Contributor Records

Design decisions, bundle budgets, coding standards, and workflows are kept in [contributing](contributing/README.md). None of them are published to npm or listed in `/llms.txt`.

Start with the [contributing guide](../CONTRIBUTING.md), then use the task table in [contributing](contributing/README.md).
