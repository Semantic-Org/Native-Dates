# Pull Request Checks

One automated check runs on pull requests and updates a sticky PR comment on each push.

| Check | Question answered | Script | Blocks merge |
|---|---|---|---|
| **Size** | How many Brotli bytes does this change add to app bundles? | `tools/gates/budget.js` against `ai/contributing/budget.md` | Yes, when over budget or leaking dev prose |

Bundle sizes are deterministic and fail the check when they cross a budget limit.

## Per-Package Configuration

The workflows and scripts are shared across standalone packages, while the targets and thresholds belong to each repo:

| Setting | Location | Configured per package |
|---|---|---|
| Entry bundles | `bundles` in `ai/contributing/budget.md` | Realistic import patterns and Brotli ceilings |
| Delta limits | `change` and `bug` in `ai/contributing/budget.md` | Maximum per-PR growth and bug-fix byte limit |

## How Pull Requests Are Measured

1. Both `head/` (the PR) and `base/` (the target branch) are checked out and installed with `--ignore-scripts`.
2. Measurement scripts and `ai/contributing/budget.md` are read from `base/` so a PR cannot alter the budget that evaluates it. Add budget changes to `main` first.
3. **Size** bundles each side with `esbuild` without executing PR code.
4. Numeric outputs are uploaded as workflow artifacts and rendered to the GitHub Actions job summary.

## Comment Posting (`report.yml`)

Because `pull_request` jobs from forks run with read-only tokens, `.github/workflows/report.yml` runs on `workflow_run` from `main` after `Size` completes. It never executes PR code. Instead it downloads the numeric artifact and reads the PR metadata via `gh`, then renders the sticky comment with `tools/ci/size-comment.js`.

Comments post as `github-actions` by default, or as Semantic Bundle Bot when the app credentials in [`ai/contributing/reference/setup.md`](../../ai/contributing/reference/setup.md) are configured.

## Guides

- [`ai/contributing/workflows/read-ci-reports.md`](../../ai/contributing/workflows/read-ci-reports.md): interpreting Size PR comments
