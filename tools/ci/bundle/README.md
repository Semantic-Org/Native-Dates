# Bundle Size Check

Every pull request that modifies library code, package manifests, or build configuration is measured in CI and reported in a sticky comment by **Semantic Bundle Bot**.

Each run performs three steps:

1. Bundles both the PR merge commit and its base commit with `esbuild`, using the same targets printed by `npm run size`.
2. Evaluates byte deltas, total size, and production string literals against the budget in [`ai/contributing/budget.md`](../../../ai/contributing/budget.md).
3. Posts or updates the PR comment, or records why no comment was needed on the workflow summary page.

[`tools/gates/budget.js`](../../gates/budget.js) uses the same evaluation logic as the comment renderer, so the **Measure Bundle Size** status check fails under the exact same conditions as the comment.

## What it measures

CI checks out the PR merge commit alongside its first parent on the base branch. Comparing against that parent isolates the PR's own changes even when the branch is behind `main`. Both checkouts install dependencies with `--ignore-scripts`, and PR code is bundled without being executed.

The workflow runs the measurement scripts and reads [`ai/contributing/budget.md`](../../../ai/contributing/budget.md) from the base checkout, falling back to the PR branch only if the base predates `tools/ci/bundle`. Thresholds and target definitions only change once merged to `main`, preventing a PR from raising its own budget.

Each target in [`tools/size.js`](../../size.js) is minified with `esbuild` in production mode and compressed at gzip level 9 and Brotli quality 11:

| Target | Bundle contents | Role in the report |
|---|---|---|
| `native-dates (full)` | Complete core package without plugins | Sets the headline verdict and checks the 15 kB ceiling |
| `import { now }` | Single factory import | Listed under **All bundles** to track tree-shaking |
| `plugins/<name>` | Core plus one plugin, minus core's own bytes | Listed under **Packages Changed** when its minified size changes |
| `core + all plugins` | Core plus every plugin in `packages/plugins/src` | Listed under **All bundles** for reference |
| `dev-mode overhead (development vs production)` | Development build of core minus the production build | Reported as the `Dev prose folded out` line under **All bundles** |

Consumers always import plugins alongside `native-dates`, so each plugin target bundles core together with that plugin and subtracts core's sizes across every column. Per-file attribution records the minified bytes that the plugin adds to the combined bundle.

Because Brotli compresses the combined output as one stream, changing core can shift a plugin's marginal Brotli count even when the plugin itself was untouched. A target counts as changed only when its **minified** byte count changes.

## Reading the comment

The comment opens with a headline verdict based on core's Brotli delta:

```markdown
## Bundle Size

### 🔵 Core Grew +14 Bytes Brotli (Bug Sized)

PRs between 0-50 bytes are typical for bug fixes.

### Packages Changed
```

### Size bands

Core's Brotli delta selects a size band from the thresholds in [`ai/contributing/budget.md`](../../../ai/contributing/budget.md):

| Band | Core Brotli delta | Icon |
|---|---:|:---:|
| Shrank | Below 0 B | 🟢 |
| Unchanged | 0 B | 🟢 |
| Bug sized | 1 to 50 B | 🔵 |
| Small feature sized | 51 to 100 B | 🟡 |
| Feature sized | 101 to 250 B | 🟠 |
| Large feature sized | 251 to 500 B | 🔴 |

Every `Δ brotli` cell in the tables uses these same byte thresholds for its badge icon. Plugins are not subject to core's per-PR ceiling, so large plugin additions cap at 🔴 rather than failing the check.

### Title prefixes and expected bytes

The bot reads the category prefix from the PR title when the workflow starts. Editing a PR title takes effect on the next push.

- **`Build:`, `Harness:`, `Docs:`, `Test:`, `Chore:`** are expected to leave core at 0 B.
- **`Bug:`, `Refactor:`, `Perf:`** are expected to stay within `bug sized` (up to 50 B).
- **`Feat:`** changes generally belong in plugins, where their size appears on the plugin row while core stays unchanged.

When a PR grows core past the band expected for its prefix, the subtitle notes that mismatch while keeping the measured band in the heading. A `Feat:` PR that adds more than 50 B to core displays a reminder that features are generally implemented as plugins.

If a PR intentionally adds bytes to core, include an `Expected bytes:` line in the PR description:

```text
Expected bytes: ~80 B for named format presets
```

The bot quotes that line verbatim beneath **Packages Changed**. Deltas are always evaluated against expected cost rather than remaining headroom under the 15 kB ceiling.

### Failing checks

When a build or budget rule fails, the status check exits non-zero and `⛔` replaces the band heading. Multiple failures are listed together beneath the primary heading:

| Failure | Trigger | Details in comment |
|---|---|---|
| `Did Not Build` | A target failed to bundle on the PR | File location and compiler error, reporting core alone when core broke dependent rows |
| `Base Did Not Build` | A target failed to bundle on the base commit | Target name and build error from the base branch |
| `Over the Ceiling` | Core exceeds `ceiling` in `budget.md` | Bytes over the limit, plus whether `main` already exceeded it |
| `Over the PR Limit` | Core grows past `large feature sized` (> 500 B) | Maximum single-PR growth allowed |
| `Over the Bug Fix Limit` | A `Bug:` PR grows core by 50 B Brotli or more | Bug-fix byte limit, with compound prefixes like `Feat/Bug:` exempt |
| `Core Ships Dev Messages` | Development diagnostics remain in the production bundle | Notes whether `main` also fails this check |
| `Strip Check Cannot Run` | Development build has no diagnostic strings to compare | Notes whether `main` also fails this check |
| `Prose Outside the Allowlist` | Unallowlisted English prose appears in core or a plugin | Quoted literals with links to their source lines |

### Tables and skipped comments

**Packages Changed** lists core first, followed by any plugins whose minified size changed, or prints `No bundle changed size. 🎉`. Two collapsible sections follow:

- **Where the bytes went (minified):** Exact minified byte delta per source file for core and each changed plugin.
- **All bundles:** Full minified, gzip, Brotli, and Δ Brotli figures for every target, plus the `Dev prose folded out` line and links to the base commit and `size-report.json`.

A PR comment is posted whenever a modified file is part of a bundle or any byte count or check result changes. Runs that only touch unbundled files with zero byte differences skip the PR comment and print `No comment posted.` on the workflow summary page.

When a PR edits measurement files like the workflow, lockfile, Node version, or budget config, the report notes that final numbers apply after merging.

## How CI runs

The check splits across two workflows so untrusted PR code never runs with write access or bot credentials:

- **[`bundle-size.yml`](../../../.github/workflows/bundle-size.yml)** runs on `pull_request` when matching paths change, using `contents: read` permission only. Newer pushes on the same branch cancel older runs. Its **Measure Bundle Size** job builds `head` and `base`, writes the job summary, and uploads `size-results` and `size-report` artifacts.
- **[`bundle-size-report.yml`](../../../.github/workflows/bundle-size-report.yml)** runs via `workflow_run` after `Bundle Size` finishes, whether the check passed or failed. It checks out `main` and runs `reporter.js`, which uses only Node built-ins so no packages are installed in the privileged job. It updates the sticky comment as **Semantic Bundle Bot**, or falls back to `github-actions[bot]` when App secrets are absent. Stale runs for superseded commits exit without editing the comment.

Because artifact data comes from the PR run, `reporter.js` escapes untrusted strings as literal Markdown and only links source paths inside the repository.

### Path triggers

`bundle-size.yml` runs only when a PR touches files that can affect bundle output or how it is measured:

| Path | Reason |
|---|---|
| `src/**`, `packages/plugins/src/**` | Library and plugin source modules |
| `package.json`, `packages/plugins/package.json` | Package `exports` and `sideEffects` fields |
| `tools/size.js`, `tools/gates/budget.js`, `tools/gates/prose.js`, `ai/contributing/budget.md` | Target definitions, prose scanner, and budget thresholds |
| `tools/ci/bundle/**`, `.github/workflows/bundle-size.yml` | Reporter implementation and workflow definition |
| `package-lock.json`, `.node-version` | `esbuild` and Node `zlib` versions |

[`budget.test.js`](budget.test.js) verifies that every source file included in any built bundle matches this path list. Pull requests that only edit docs or tests skip the workflow altogether.

## Running locally

Check the current working tree against the budget:

```sh
npm run size
```

Compare your working tree against a separate checkout of `main` after running `npm install` in both directories:

```sh
node tools/gates/budget.js --base ../main --title "Feat: Example change" --json /tmp/size
node tools/ci/bundle/reporter.js --results /tmp/size --msg "Feat: Example change" --out /tmp/report
cat /tmp/report/summary.md
```

Download a CI run's `size-results` artifact to inspect or re-render its comment locally:

```sh
gh run download <run-id> -n size-results -D /tmp/size
node tools/ci/bundle/reporter.js --results /tmp/size --msg "Feat: Example change" --pr 42 --out /tmp/report
```

The `--results` directory contains the head and base JSON files from `budget.js`, along with an optional `changed.json` diff list.

In local runs without `changed.json`, the reporter writes `comment.md` only when a byte count differs or a check fails.

Optional CLI flags populate commit links, PR metadata, and workflow URLs in `size-report.json`:

```sh
node tools/ci/bundle/reporter.js --results <dir> \
  [--sha <sha>] [--ref <branch>] [--msg <title>] [--pr <number>] \
  [--body <file>] [--repo <owner/name>] [--run-url <url>] [--run-id <id>] \
  [--report-url <url>] [--out <dir>]
```

## GitHub App setup

To post comments as **Semantic Bundle Bot** instead of `github-actions[bot]`:

1. Install the **Semantic Bundle Bot** GitHub App on the repository with **Pull requests: Read & write** permission.
2. Add `SEMANTIC_BUNDLE_BOT_CLIENT_ID` and `SEMANTIC_BUNDLE_BOT_PRIVATE_KEY` to repository secrets.

## Files

| File | Purpose |
|---|---|
| [`reporter.js`](reporter.js) | Compares `head.json` and `base.json` to produce `comment.md`, `summary.md`, and `size-report.json` |
| [`reporter.test.js`](reporter.test.js) | Unit tests for size bands, failure states, Markdown escaping, and comment rendering |
| [`budget.test.js`](budget.test.js) | Verifies target definitions, `checkTree()` output shape, and workflow path coverage |
| [`fixtures/core-grew/`](fixtures/core-grew/) | Recorded `head.json`, `base.json`, `changed.json`, and rendered `comment.md` fixture |
