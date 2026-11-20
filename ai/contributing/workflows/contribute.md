---
title: "Contribute: Bug Fixes, Features, and Bug Reports"
description: Workflow for agents assisting a human contributor on bug fixes, features, or issue reports, including reading order, verification gates, and human-authorship requirements.
keywords: [contribute, contributing, bug fix, feature, pull request, bug report, curriculum, size budget, agent]
audience: contributing
workflow: contribute
type: workflow
---

# Contribute: Bug Fixes, Features, and Bug Reports

> **Workflow:** `contribute`
> **Load when:** assisting a human contributor to fix a bug, implement a feature, or file a bug report

---

## Human Ownership Requirements

Every issue and pull request has a human author accountable for the submission ([`CONTRIBUTING.md`](../../../CONTRIBUTING.md)):

- **Never file unattended submissions.** Issues and PRs containing only agent-generated prose or agent footers are rejected. Ask the contributor to write their own top-level summary first, and place any agent notes underneath under a separate heading.
- **Ensure the contributor understands the change before coding.** Once your session ends, the contributor answers review questions and maintains the code themselves. Share your diagnosis clearly and resolve open questions before writing implementation code.
- **Explain non-obvious decisions in your handoff** so the contributor can defend every line of the diff.
- **Provide facts for the PR description** (user-visible change, risk rating, and Brotli byte delta) while leaving the prose summary for the contributor to write. You may draft the `Category: Description` title.
- **Never post comments, issues, or PRs from their account** without explicit approval of that exact message.

## Required Reading Order

Read these documents before editing code:

1. [`ai/contributing/north-star.md`](../north-star.md): hand-authored by the maintainer on project goals, the Golden Rule, call-site SNR, lowercase-"c" correctness, conciseness, and Bayesian rulings.
2. [`ai/contributing/standards/lessons/naming-lessons.md`](../standards/lessons/naming-lessons.md): maintainer-authored lessons on callsite signatures, industry terms over metaphors, and naming.
3. [`ai/contributing/standards/lessons/simplicity-lessons.md`](../standards/lessons/simplicity-lessons.md): class boundaries and simple data flow over synthetic adapters or monkey-patching.
4. [`ai/contributing/standards/coding-standards.md`](../standards/coding-standards.md) and [`ai/contributing/standards/code-comments.md`](../standards/code-comments.md): class anatomy, `Symbol.for` branding, folder homogeneity, and comment style.
5. [`ai/contributing/reference/architecture.md`](../reference/architecture.md): workspace package responsibilities, zero-dependency rules, and invariants.
6. [`ai/contributing/budget.md`](../budget.md): bundle ceilings and per-PR byte limits.
7. [`ai/contributing/standards/legibility/errors-and-logs.md`](../standards/legibility/errors-and-logs.md): required whenever adding or editing error explanations (`npm run errors`).
8. [`ai/contributing/decisions.md`](../decisions.md): grep the relevant noun and read the latest dated decision. Decisions scored 90+ require new empirical evidence to reopen, whereas decisions whose `reopen:` condition is met should be surfaced.

Next, read the target source files and tests directly on `HEAD` rather than relying on prior assumptions.

## Fixing a Bug

1. **Write a failing test first** in `test/` or `packages/*/test/` and confirm it fails via `npm test`. If you cannot reproduce the bug in a test, report that and stop.
2. **Fix the root cause inside the package** rather than working around the defect at a callsite.
3. **Keep the diff minimal.** Avoid bundling unrelated renames or refactors into a bug-fix PR.
4. **Check bundle impact** with `npm run size`. Bug fixes aim for 0 added bytes and fail at the `bug sized` threshold in [`ai/contributing/budget.md`](../budget.md). Larger fixes require a severe bug and maintainer approval first.
5. **Verify all gates and formatting:** `npm run check`, `npm run types`, `npm run errors`, `npm run comments`, and `npm run format`.
6. **Hand off:** one-sentence root cause, the reproduction test case, and the Brotli byte delta (`Bug: <Description>`).

## Adding a Feature

1. **Confirm prior issue approval.** New features or public exports require an agreed GitHub issue before implementation.
2. **Default to a plugin (`@native-dates/plugins/*`)** unless nearly every consumer needs the capability in core (`native-dates`).
3. **Estimate byte cost up front.** Include `Expected bytes: <N>` in the PR description when adding bytes to core, and check plugin deltas in `npm run size`.
4. **Design the callsite first.** Write sample consumer code, verify it reads naturally aloud, and run new public identifiers through [`ai/contributing/standards/name-public-api.md`](../standards/name-public-api.md).
5. **Follow existing codebase patterns** without speculative options, external runtime dependencies, or single-caller abstractions. When a utility from `@semantic-ui/utils` fits, check [`utility-functions.md`](../standards/utility-functions.md) and copy only the minimal needed implementation into `src/helpers/`.
6. **Update documentation and downstream skills** following [`docs-writing.md`](docs-writing.md) and [`author-user-skill.md`](author-user-skill.md), then verify with `npx --workspace docs astro sync --force && npm -w docs run build`.
7. **Update the declarations in `types/`** (and `packages/plugins/types/` when touching plugins) for every public signature added or changed, following [`types.md`](../standards/types.md).
8. **Run checks:** `npm run check`, `npm run types`, `npm run errors`, `npm run comments`, and `npm run format` (`Feat: <Description>`).

## Filing a Bug Report

Verify the reproduction by running it locally before the contributor files the issue. Provide minimal runnable reproduction code, expected vs. actual output, and exact package and runtime versions (or state on line 1 if identified purely by reading source).

## Pull Request Checklist

- **One logical change per PR** (separate fixes from refactors).
- **Title format** per [`ai/contributing/standards/author-pull-requests.md`](../standards/author-pull-requests.md): `Category: Concise Factual Summary`.
- **Inspect CI Bundle Size and Bench comments** using [`read-ci-reports.md`](read-ci-reports.md).
- **Attach measurements to claims:** failing test before/after for fixes, `npm run size` output for byte changes, and benchmark timings for `Perf:` changes. Explicitly note any check you could not run locally.
