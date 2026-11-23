# Benchmark Suite Check

Every pull request that modifies `native-dates`, `@native-dates/core`, `@native-dates/plugins`, or package build manifests runs interleaved browser benchmarks in CI and posts a sticky comment via **Semantic Performance Bot**.

## How it works

1. **[`bench.yml`](../../../.github/workflows/bench.yml)** runs with `contents: read` permission only.
   - **Discover Benchmarks** checks out both the PR merge commit (`head`) and its first parent on the base branch (`base`), then runs [`discover.js`](discover.js) from `base` against `base/bench/*.js`.
   - Core or manifest changes select every `bench/<suite>.js` file. Plugin-only PRs (`packages/plugins/**`) inspect each suite's `esbuild` input graph and select only the suites that import the changed plugin.
   - **Bench (`<suite>`)** fans out one parallel GitHub Actions runner per selected `bench/<suite>.js` file. Both `this-change` (`head`) and `tip-of-tree` (`base`) bundle against `base/bench/<suite>.js` using [`tools/bench.js`](../../bench.js) from `base`, so a PR cannot alter its own benchmarks, discovery rules, or sampling thresholds.
2. **[`bench-report.yml`](../../../.github/workflows/bench-report.yml)** runs via `workflow_run` from `main` once `Bench` finishes.
   - Downloads all `bench-results-*` cell artifacts, reconstructs prior PR-branch runs with [`fetch-pr-history.js`](fetch-pr-history.js), and renders `comment.md`, `summary.md`, and `bench-report.json` via [`reporter.js`](reporter.js).
   - Both reporting scripts use only Node built-ins so no `npm install` runs in the privileged workflow.
   - Posts or updates the sticky PR comment (`<!-- bench-report -->`) under **Semantic Performance Bot**, falling back to `github-actions[bot]` when App secrets are unconfigured.

## Reading the comment

See [`read-ci-reports.md`](../../../ai/contributing/workflows/read-ci-reports.md) for interpreting verdicts:

- **Faster / Slower:** Operations whose entire 95% confidence interval cleared the `±2%` resolution floor.
- **New peaks / Regressions from peak:** Cross-iteration shifts across pushes on the same pull request, with candidate commits linked for bisection.
- **No change (collapsed):** Operations whose 95% confidence interval stayed inside `±2%`.
- **Unsure (collapsed):** Split into **Inconclusive** (wider variance than duration predicts) and **Too Fast to Measure Precisely** (duration-limited against runner jitter).
- **Bench glossary (collapsed):** Populated automatically from `// purpose: <description>` comments placed directly above exported benchmark functions in `bench/*.js`.

## Running locally

Requires Google Chrome or Chromium (`tools/bench.js` automatically installs a matching `chromedriver` major version on first run):

```sh
npm run bench                                              # measure all suites in bench/
node tools/bench.js --suite parse                          # measure a single suite
node tools/bench.js --head . --base ../main --json /tmp/b  # interleaved head-vs-base run
node tools/ci/bench/reporter.js --results /tmp/b --out /tmp/bench-report
```

Authoring guidelines and target duration bands (`20-100 ms` per operation) live in [`extend-bench-suite.md`](../../../ai/contributing/workflows/extend-bench-suite.md).

## GitHub App setup

To post comments as **Semantic Performance Bot** instead of `github-actions[bot]`:

1. Install the **Semantic Performance Bot** GitHub App on the repository with **Pull requests: Read & write** permission.
2. Add `SEMANTIC_PERF_BOT_CLIENT_ID` and `SEMANTIC_PERF_BOT_PRIVATE_KEY` to repository secrets.

## Files

| File | Purpose |
|---|---|
| [`tools/bench.js`](../../bench.js) | Bundles `bench/*.js` for `head` and `base` and runs headless Chrome via `tachometer` |
| [`discover.js`](discover.js) | Matches PR diffs against each suite's `esbuild` input graph to emit the CI matrix |
| [`fetch-pr-history.js`](fetch-pr-history.js) | Rebuilds per-push PR benchmark history from prior workflow artifacts |
| [`reporter.js`](reporter.js) | Zero-dependency renderer producing `comment.md`, `summary.md`, and `bench-report.json` |
| [`bench.test.js`](bench.test.js) | Verifies `bench/*.js` exports, checkout isolation, matrix discovery, and workflow path triggers |
| [`reporter.test.js`](reporter.test.js) | Unit tests for interval classification, PR peak attribution, glossary indexing, and escaping |
