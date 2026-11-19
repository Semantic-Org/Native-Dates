# Bundle bot

Measures the bundles on every pull request and reports what the PR did to them as one comment by
**Semantic Bundle Bot**. It is the bot of the sync repo (`tools/ci/bundle` there), brought to this
library's rows. It does three things:

1. measure the PR's head and its base in one run, with `tools/gates/budget.js` over the rows of
   `tools/size.js`, what `npm run size` runs by hand
2. judge the delta by the rules in `ai/contributing/budget.md`: the expected cost is about 0
3. report it in a sticky comment, or say on the run's summary page why no comment posted

The check is red exactly when the comment is, since `budget.js` takes its verdict from the
reporter. Nothing else fails a pull request over size, and merging stays the merger's judgment.

## What it measures

Both sides are built in the run: the PR merged onto its base branch's tip, and that tip, so a PR
behind main reads its own bytes and never main's other merges. Each side is its own checkout with
its own install, and nothing of the PR's is executed: `esbuild` bundles it.

The tools are the base's copy (`tools/size.js`, `tools/gates/`, `tools/ci/bundle/` and
`ai/contributing/budget.md`), so the ceiling, the sizes and the rows move only on main and a PR
cannot reshape how its own bundles are weighed. `budget.js --json <dir>` writes what a run measured
for each side: every row in minified, gzip and brotli bytes (esbuild with `NODE_ENV` at
`production`, brotli quality 11, gzip level 9), the source files behind each built row with the
minified bytes each left in the output, the strip check, the prose check's survivors with their
source lines, and core's distance to the ceiling. A row that does not build is recorded with its
error and the others are still measured.

The rows are `rowsFrom` in `tools/size.js`, the ones `npm run size` prints, each carrying the part
it plays in the comment:

| row | what it is | part in the comment |
|---|---|---|
| `native-dates (full)` | all of `native-dates` without plugins, which the comment calls core | the title, the first changed package, the ceiling |
| `import { now }` | an app that imports one factory | a row of All bundles, never judged |
| `plugins/<name>` | what a plugin adds to an app that already has all of `native-dates`, one row per file in `packages/plugins/src` | a changed package when it moved, with its own icon |
| `core + all plugins` | all of `native-dates` with every plugin | a row of All bundles, never judged |
| `dev-mode overhead (development vs production)` | core built at `NODE_ENV` `development`, less core | the health line under All bundles, never a delta row |

A plugin is weighed beside core. The bundle holding core and the plugin is built, and core's own
sizes are taken off it in every column. Its source files are what each adds to that bundle, so a
file core holds counts for the bytes the plugin adds to it. What follows from a number being a
difference: a plugin's gzip and brotli are differences of two compressions, so they move when core
changes beside it. On a change that adds one getter to core, `plugins/zones` reads +36 B brotli on
minified bytes that did not move.

## The comment

A bundle counts as changed when its **minified** bytes moved. Brotli is reported beside and never
judged alone. The compressor re-tokenises the same code beside an unrelated change, so a line
that moved in brotli alone reads unchanged.

Core's brotli delta names the PR's size. Each size has a title and a line under it, the
maintainer's copy from the sync bot in `BANDS` in `reporter.js`, and its edge in `sizes` in
`ai/contributing/budget.md`, the one place for the numbers.

| size | delta | icon |
|---|---:|:---:|
| shrank | under 0 B | 🟢 |
| unchanged | 0 B | 🟢 |
| bug sized | 1 to 50 B | 🔵 |
| small feature sized | 51 to 100 B | 🟡 |
| feature sized | 101 to 250 B | 🟠 |
| large feature sized | 251 to 500 B | 🔴 |

A red takes the title and the line in a size's place, its mark ⛔. `REDS` in `reporter.js` holds
the title and line for each, in the order one takes the title when several hold, and each that
holds speaks under it. The numbers in the lines fill from the measurement, so they follow
`ai/contributing/budget.md`.

| red | what happened | under its line |
|---|---|---|
| did not build | a bundle failed to build on the head | the error's place ends the line and its text is alone in a fenced block. The title names the bundle, and core alone when it failed, since the rows weighed against it fail with it |
| base did not build | a bundle failed to build on the base | the row's name, "stopped at:" and the error in a fenced block |
| over the ceiling | core is past `ceiling` | when main is over it too, how far and what this PR adds or removes |
| over the PR limit | core's delta is past the last size's edge, the most a PR may add | |
| over the bug fix limit | a `Bug:` PR adds as much as the bug size's edge or more to core | |
| dev messages ship | no development message is gone from the production build | "Main does not remove them either." when main fails the check too |
| strip check cannot run | the development build holds no development message to look for | |
| prose outside the allowlist | a developer-facing sentence survives in core or a plugin outside `prose` in `ai/contributing/budget.md` | a bullet per sentence, in quotes, and its place as a link to that line at the head commit, with "(on main too)" after one main has as well |

The PR's kind is its title's house prefix. A `Feat:`, `Bug:`, `Refactor:` or `Perf:` PR is
expected at bug size or under, and a `Build:`, `Harness:`, `Docs:`, `Test:` or `Chore:` PR to leave
core unchanged. Above the size its prefix expects, the line gives way to the kind's ("This PR is
above the size expected for a refactor (0-50 bytes)."). The title keeps the size. The expected
cost is about 0 unless the PR body has one line beginning `Expected bytes:`, which the comment
quotes verbatim under the table. A compound prefix such as `Feat/Bug:` is a kind of its own,
expected anywhere and never held to the bug fix limit. The title is read when the run starts, so
an edited title is read on the next push.

A feature belongs in a plugin, so a `Feat:` PR is read the way the sync bot reads a plane: its
bytes show in the plugin's row under Packages Changed, a new plugin as `plugins/<name>, added`,
while the title says what it did to core. A `Feat:` PR that grows core past bug size has the
maintainer's sentence under its title in place of the size's line, "Features are generally
implemented as plugins." One that means to add to core prices it with its `Expected bytes:` line,
which is quoted and changes nothing else.

The comment opens with its heading, the title and the line:

```markdown
## Bundle Size

### 🔵 Core Grew +14 Bytes Brotli (Bug Sized)

PRs between 0-50 bytes are typical for bug fixes.

### Packages Changed
```

**Packages Changed** lists core and the plugins that changed, core first, in brotli, Δ minified
and Δ brotli, or reads "No bundle changed size. 🎉". Every Δ brotli cell carries the icon of its
own delta on the same edges, in absolute bytes. The title judges core alone. Past the most a PR
may add, core's delta carries ⛔ as its title does, and a plugin's keeps the last size's icon,
since the line is core's. Collapsed under the table:

- **Where the bytes went**: minified bytes per source file, a column for core and for each plugin
  that moved
- **All bundles**: every row whether or not it changed, in every column, with the icon on each
  Δ brotli cell and the health line "Dev prose folded out"

The footer is two links, the base commit and `size-report.json` on the page of the run that holds
it.

Of the runs that start, the comment posts when a changed file is in a bundle (the union of every
built row's sources, on either side), when any cell of any row differs between the two sides, or
when a check is red. Otherwise no comment posts and the run's summary page shows the same opening
and then "**No comment posted.**" with the reason, so a missing comment and a failed post never
look alike. A PR that changes how bundles are measured (the workflow, the node version, the
lockfile, the tools or the budget) is told to read its numbers against the run after it merges.

`size-report.json` is the adjunct: `state` (the size's name, or `red` with its `reason`, the first
red's name), `band` and the `bands` with their edges, `kind`, the `title` and the `body` under it
as the comment shows them, `post`, `head` and `base`, `expected`, `rows[]` with both sides' sizes,
deltas and status, `attribution` per bundle, `changedFiles`, `measurementChanged` and `reach`,
`checks` for both sides with the ceiling's distance and the two limits, the `summary` cells and
the `sentence`.

## Reading it

- **The title is the verdict.** Core's brotli delta and its size, or the red. Under it is what
  the PR did, and for a red what to read, such as the error or the sentences with their file and
  line.
- **A plugin's Δ brotli is a difference of two compressions.** On a PR that changed core and left
  a plugin's minified bytes alone, the plugin's brotli still moves and the row reads unchanged.
- **Where the Bytes Went is minified and exact, since brotli does not add per file.**
- **The ceiling is a distance, not room.** Deltas justify against the expected cost, never
  against headroom.

## How it runs

- **`bundle-size.yml`** runs on a push to a PR, when the change touches a path in its `paths` list
  and on no other. It builds PR code, so it holds `contents: read` and no token that can post.
  Runs group by branch, and a newer push cancels the older run. One job, **Measure Bundle Size**:
  it checks out the head and the base, installs both with no scripts, lists the changed files into
  `changed.json`, runs the base's `budget.js` over both, renders the report to its summary page,
  and uploads `head.json`, `base.json` and `changed.json` as `size-results` and the report as
  `size-report`, whatever the check concluded.
- **`bundle-size-report.yml`** runs on `workflow_run` when Bundle Size completes, whatever its
  conclusion, from main's copy of this folder, so a PR never authors the tool that judges it. The
  reporter imports nothing, so the job that holds the bot's token installs nothing. It renders the
  comment, uploads `size-report.json` as `size-report`, and posts under the bot, editing its prior
  comment in place. A run on a commit the PR has moved past leaves the comment alone. When the app
  cannot be reached the comment posts as `github-actions[bot]`, and the `sticky-bot-comment`
  marker keeps it apart from any other comment under that login.

On the PR that first adds a tool, main does not have it yet, so that PR's own copy measures it.
The artifact a run uploads is a PR's own, so every string the reporter takes from it is escaped as
literal text, and a source link is built only for a path inside the repository.

### What starts a run

| path | why it starts a run |
|---|---|
| `src/**`, `packages/plugins/src/**` | the sources the bundles are built from |
| `package.json`, `packages/plugins/package.json` | `exports` and `sideEffects` decide what a bundle holds |
| `tools/size.js`, `tools/gates/budget.js`, `tools/gates/prose.js`, `ai/contributing/budget.md` | the rows, the check, the prose reader and the budget they are held to |
| `tools/ci/bundle/**` | the reporter and this page |
| `.github/workflows/bundle-size.yml` | the workflow, which a PR runs from its own copy |
| `package-lock.json`, `.node-version` | the bundler's version, and the node whose zlib compresses |

`tools/ci/bundle/budget.test.js` holds the list to the measurement, so a file that enters a bundle from a
folder the list leaves out reddens the suite. With no run there is no summary page and no Bundle
Size check on the PR, which is how a change the measurement does not read looks.

## Setup (one time)

1. A GitHub App named **Semantic Bundle Bot**, installed on the repository, with
   **Pull requests: Read & write**.
2. The repository secrets `SEMANTIC_BUNDLE_BOT_CLIENT_ID` and `SEMANTIC_BUNDLE_BOT_PRIVATE_KEY`.

## Running locally

```sh
# the rows and the check, as CI's Test workflow runs them
npm run size

# this tree against another checkout with its own npm install, such as one of main
node tools/gates/budget.js --base ../main --title "<the PR title>" --json /tmp/size
node tools/ci/bundle/reporter.js --results /tmp/size --msg "<the PR title>" --out /tmp/report
cat /tmp/report/summary.md

# a run's artifact into the comment
gh run download <run> -n size-results -D /tmp/size
node tools/ci/bundle/reporter.js --results /tmp/size --msg "<the PR title>" --pr <number> --out /tmp/report
```

`reporter.js --results <dir>` reads `head.json`, `base.json` and, when it is there, `changed.json`;
`--sha`, `--ref`, `--msg`, `--pr`, `--body <file>`, `--repo`, `--run-url`, `--run-id` and
`--report-url` fill the links. Without `changed.json` the reporter knows no changed file, so it
writes `comment.md` only when a cell differs or a check is red.

## Files

| file | role |
|---|---|
| `reporter.js` | two `budget.js` measurements into `comment.md`, `summary.md` and `size-report.json` |
| `reporter.test.js` | the decisions above, and a real comment rendered byte for byte from `fixtures/core-grew/` |
| `budget.test.js` | the row list as data, the measurement's shape, and the paths that start the workflow |
| `fixtures/core-grew/` | `budget.js --json` output for main at `c9bccab` and the same tree with one getter added to `CalendarDate`, with its `changed.json` and the comment it renders |
