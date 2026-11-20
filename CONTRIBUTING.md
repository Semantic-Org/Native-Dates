# Contributing

Short guide for contributors and coding agents working on their behalf.

## 1. Common Tasks

| Goal | Starting point |
|---|---|
| Report a bug | Follow [Bug Reports](#4-bug-reports) |
| Fix a bug | Complete [Required Reading](#2-required-reading), then open a pull request |
| Add a feature or change public exports | Open an issue first to agree on scope and API before writing code |
| Fix a typo or broken link | Open a pull request directly |

## 2. Required Reading

Read these files in order so new code matches existing conventions:

1. [`ai/contributing/north-star.md`](ai/contributing/north-star.md): hand-authored by the maintainer on project goals, the Golden Rule, call-site SNR, lowercase-"c" correctness, conciseness, and Bayesian rulings
2. [`ai/contributing/standards/lessons/naming-lessons.md`](ai/contributing/standards/lessons/naming-lessons.md) and [`ai/contributing/standards/lessons/simplicity-lessons.md`](ai/contributing/standards/lessons/simplicity-lessons.md): callsite design, naming, and mental-model simplicity across Semantic packages
3. [`ai/contributing/standards/coding-standards.md`](ai/contributing/standards/coding-standards.md) and [`ai/contributing/standards/code-comments.md`](ai/contributing/standards/code-comments.md)
4. [`ai/contributing/budget.md`](ai/contributing/budget.md): bundle size ceilings and per-PR limits
5. [`ai/contributing/decisions.md`](ai/contributing/decisions.md): prior design decisions and reopen conditions

**Using a coding agent?** Point it at [`ai/contributing/workflows/contribute.md`](ai/contributing/workflows/contribute.md) for the workflow and handoff checklist.

## 3. Pull Requests

- **Title:** `Category: Description` (both capitalized, without a trailing period). Categories: `Bug`, `Feat`, `Docs`, `Refactor`, `Perf`, `Test`, `Build`, `Chore`, `Harness`, `Bench`, `BREAKING`. Example: `Bug: Fix DST Offset Across Spring Forward`.
- **Description:** Fill out the [PR template](.github/pull_request_template.md) in your own words. One sentence of context and a few bullets is usually enough.
- **Single scope:** Separate bug fixes and refactors into independent pull requests.
- **Regression test:** Include a test that failed before the fix. Back up any size or performance claim with measurements.
- **Size budget:** The Bundle Size check compares production Brotli sizes against [`ai/contributing/budget.md`](ai/contributing/budget.md). Bug fixes aim for 0 added bytes. If a change exceeds the budget, follow the options in `ai/contributing/budget.md` (see [`ai/contributing/workflows/read-ci-reports.md`](ai/contributing/workflows/read-ci-reports.md)).
- **Checks and formatting:** Run `npm run check`, `npm run types`, `npm run errors`, `npm run comments`, and `npm run format`, or run `npm run setup` once to install git hooks.

## 4. Bug Reports

Include:

- Minimal runnable code that reproduces the issue
- Expected behavior vs. actual behavior
- Package version and browser or runtime version

Reports without reproduction code wait until one is provided. If you spotted the issue by reading source code without executing it, state that on the first line. Security reports follow the same requirements, including section 5.

## 5. Working With Coding Agents

Agent-assisted contributions are welcome when a human contributor understands the root cause and fix, and remains accountable after merge.

**Issues and pull requests containing only agent-generated text will be closed without review.** Include your own summary at the top. Any agent write-up can follow underneath under its own heading.

Because an agent's session context disappears once closed, we rely on the human author to understand and maintain the change:

- **Understand the problem before coding.** Be ready to explain what is broken or needed without delegating to an agent.
- **Read every line of the diff** and know why each change is necessary.
- **Write the PR or issue summary yourself.** Summarizing in your own words demonstrates understanding.
- **Respond to code review directly.** Pull requests where the author cannot explain the implementation are closed.
- **Take responsibility for regressions** if the change causes issues after merge.

Every pull request in this repository is reviewed and merged by a human maintainer.

## Local Setup

```sh
npm install       # install all workspaces
npm run setup     # install git hooks once
npm run docs      # start docs dev server
npm run check     # run tests, ai markdown checks, and bundle size budget
npm run types     # type-check .d.ts declarations
npm run errors    # check error prose register
npm run comments  # check comment density and voice
npm run format    # format with dprint
```
