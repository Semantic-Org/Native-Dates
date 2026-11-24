---
title: Managing Benchmarks and Performance Work
description: End-to-end workflow for profiling Perf PRs, running adversarial parity reviews, recording cross-library runs in date-benchmark, deploying bench.nativedates.dev, and syncing the homepage table.
keywords: [benchmark, perf, performance, date-benchmark, krausest, tachometer, bench.nativedates.dev, homepage, adversarial review, brotli]
audience: contributing
workflow: manage-benchmarks
type: workflow
---

# Managing Benchmarks and Performance Work

> **Workflow:** `manage-benchmarks`
> **Load when:** optimizing `native-dates` runtime (`Perf:` PRs), running or updating the cross-library benchmark (`Semantic-Org/Date-Benchmark`), deploying `bench.nativedates.dev`, or refreshing `docs/src/data/bench.json`

> status: active (2026-11-23). In-repo runner lives in [`tools/bench.js`](../../../tools/bench.js) and [`tools/ci/bench/`](../../../tools/ci/bench/README.md); cross-library suite lives in [`Semantic-Org/Date-Benchmark`](https://github.com/Semantic-Org/Date-Benchmark).

---

## Three Benchmark Surfaces

| Surface | Location | Runner & Metric | Purpose |
|---|---|---|---|
| **In-repo regression suite** | [`bench/`](../../../bench/) (`npm run bench`, `.github/workflows/bench.yml`) | `tachometer` interleaved A/B in Headless Chrome (95% CI vs `main`) | Guards `native-dates` hot paths against PR regressions |
| **Cross-library Krausest suite** | [`Semantic-Org/Date-Benchmark`](https://github.com/Semantic-Org/Date-Benchmark) (`../date-benchmark`, live at [`bench.nativedates.dev`](https://bench.nativedates.dev)) | 15-round interleaved Playwright Chrome medians + `esbuild` Brotli-11 sizes + DST/bounds audit | Compares `native-dates` against the `Temporal + Intl` floor and 5 peer libraries across 12 workloads |
| **Homepage benchmark table** | [`docs/src/data/bench.json`](../../../docs/src/data/bench.json) via [`docs/src/lib/bench.js`](../../../docs/src/lib/bench.js) | Static Astro build reading a copied `runs/<sha>.json` snapshot | Renders measured peer times, audit sublabels, and overall lead on `nativedates.dev` (fails build if `LEAD <= 1`) |

---

## 1. Shipping `Perf:` Optimizations in `native-dates`

### Profile Phases Before Editing Code

Break any slow benchmark or workload into timed phases in Node (`parse`, `anchor`, `split`, `compare`, `format`) before touching `src/`. Optimizing a 6% phase wastes Brotli budget; target the 50–80% phase first.

### Isolate Worktrees and Stack Disjoint PRs

Branch each `Perf:` PR in its own git worktree off `origin/main` (for example `.claude/worktrees/perf-<topic>`) touching disjoint methods so PRs merge cleanly without conflicts and never disturb concurrent work in the main checkout.

### Run an Independent Adversarial Differential Review

Before opening a `Perf:` PR, run a separate review pass that imports both unmodified `origin/main` and the candidate worktree in Node and diffs outputs, types, frozen state, locale/zone preservation, and `error.code` values across edge inputs:

- **`BigInt` to `Number` precision:** Never compute `Number(b.epochNanoseconds - a.epochNanoseconds) / scale` across arbitrary spans, which loses sub-millisecond integer exactness beyond ~104 days (`2^53` ns). Divide in `BigInt` first: `Number(diff / scale) + Number(diff % scale) / Number(scale)`.
- **32-bit integer fast-paths:** Bitwise integer checks like `(amount | 0) === amount` cover `[-2147483648, 2147483647]`. Always verify clean fallback to `Temporal.Duration` at `2147483648`, `-2147483649`, `Number.MAX_SAFE_INTEGER`, `-0`, fractional inputs (`0.5`, `1.5`), and multi-field bags.
- **Cache retention and eviction:** Keep object keys (inline locale arrays like `['en-US', 'de']`, `Intl.Locale` instances) in a `WeakSet` rather than a bounded `Map` so per-call array literals neither stay pinned in memory nor evict cached string locales.
- **Brand fast-paths without raw-input regressions:** Use symbol brands (`value?.[IS_DATE_TIME]`) or `value?.constructor === this.start.constructor` to bypass `instanceof` (`Symbol.hasInstance`) and re-parsing on library instances, while ensuring raw string or `Date` inputs are still parsed once rather than twice.
- **ES `#private` methods on fast-constructed instances:** Never bypass a class constructor with `Object.create(Kind.prototype)` when the class declares private methods (`#holds`, `#wraps`, `#make`), since V8 only installs private methods during `new` / `super()`. Pass a module-private `const raw = {}` sentinel to the constructor instead, preserving own-property order and `Object.freeze(this)`.
- **Temporal and zone extremes:** Probe `±270,000`-year limits (`+275760-09-13`, `-271821-04-20`), spring-forward gaps, fall-back folds, 30-minute transitions (`Australia/Lord_Howe`), skipped midnights (`America/Havana`), and 24-hour dateline skips (`Pacific/Apia` 2011-12-30, `Pacific/Kiritimati` 1994-12-31).
- **Brotli-11 budget (`npm run size`):** `Perf:` PRs default to `0 B` expected growth ([`ai/contributing/budget.md`](../budget.md)). Hoist constant lookup tables to module scope and share helpers across classes. If a `+2 B` minified edit moves Brotli by ~80–100 B on a single bundle, check whether the file crossed a Brotli-11 `BrotliSplitBlock` boundary (~61 kB minified) rather than assuming code bloat.

### Gate and Merge Sequence

1. Run `npm run format && npm run check && npm run types && npm run errors && npm run comments` inside the worktree.
2. Push the branch and open the PR with `--body ""` ([`author-pull-requests.md`](../standards/author-pull-requests.md)).
3. Wait for all 12 CI checks **and** both PR comments (`Bundle Size` and `Bench Report`) to post ([`read-ci-reports.md`](read-ci-reports.md)). Confirm `0` operations in `Slower` before squash-merging and removing the worktree.

---

## 2. Managing `Semantic-Org/Date-Benchmark`

Keep a sibling checkout at `../date-benchmark` (`git clone git@github.com:Semantic-Org/Date-Benchmark.git ../date-benchmark`).

### Contestant Layout

Every contestant is a self-contained npm workspace under `contestants/<id>/`, auto-discovered by `src/discover.js` without editing central harness files:

- **`contestants/<id>/package.json`:** Declares runtime dependencies plus `"dateBenchmark": { "label", "package", "url" }` (`"isFloor": true` on `vanilla-temporal`).
- **`contestants/<id>/minimal.js`:** Default export parsing `'2026-03-07'`, adding `2` days, and formatting `'2026-03-09'` (used for the Minimal Brotli column and verified by `npm test`).
- **`contestants/<id>/index.js`:** Exports `auditChecks()`, `firstPaint(fx)`, and `createContestant(fx)` implementing `01_parse_iso` through `11_app_booking_slots` (`12_app_cold_startup` runs `firstPaint` in a fresh browser context).

### Fair-Play Abstraction Rules (`npm test`)

`scripts/verify.js` enforces equal work, checksums, fixture immutability, and library abstraction boundaries in Headless Chrome (`TZ=Europe/Berlin`, `locale=en-US`):

1. **No raw platform escape hatches in timed code:** Contestants may not unwrap `.valueOf()`, `.getTime()`, `.toMillis()`, `.epochMilliseconds`, `.toDate()`, `.toJSDate()`, or `.toTemporal()` for comparisons or math, and may not construct `new Intl.DateTimeFormat` or `new Intl.RelativeTimeFormat` caches in userland. `vanilla-temporal` must likewise use `Temporal.ZonedDateTime.compare` rather than raw `.epochMilliseconds` in `11_app_booking_slots`.
2. **Documented exceptions:**
   - `.sort((a, b) => a.valueOf() - b.valueOf())` is permitted inside `.sort(...)` only for libraries that ship no comparator helper.
   - `.toDate().toLocaleString(locale, options)` (without custom `Map` caching) is permitted in `03_format_intl_warm` and `04_format_intl_cold` for libraries without an `Intl` preset wrapper (`dayjs`, `moment`).
3. **Neutral appendix footnotes:** Behavioral caveats caught by `src/audit.js` (`"2026-02-31"` rollover, cross-zone spring-forward DST shifts, leap-year clamping) and Fair-Play exceptions render as numbered `[1]`–`[4]` footnote links in `src/render-html.js` pointing to the `Implementation Notes` appendix rather than marketing badges.

### Benchmarking Unreleased `native-dates` Changes

Use `--override native-dates=<dir>` to bundle a local `native-dates` checkout or worktree without publishing to npm:

```sh
cd ../date-benchmark
npm test -- --override native-dates=/path/to/native-dates
npm run bench:quick -- --contestants vanilla-temporal,native-dates --override native-dates=/path/to/native-dates
```

When a new `native-dates` release is published to npm, update `contestants/native-dates/package.json` from `"file:../../../native-dates"` (or the prior version) to the published semver range and simplify `.github/workflows/verify.yml` if a sibling checkout is no longer needed.

---

## 3. Recording Official Runs and Publishing

### 1. Record a 15-Round Run

After `Perf:` changes merge to `native-dates` `main`, record a full 15-round interleaved Chrome run from `../date-benchmark`:

```sh
cd ../date-benchmark
node scripts/run.js --record --rounds 15 --override native-dates=/path/to/native-dates-main
npm run report -- diff <prev-sha> <new-sha>
```

`--record` writes three artifacts:

- **`runs/<sha>.json`:** Full 15-round medians, 95% intervals, minimal/full Brotli-11 sizes, audit results, and geometric-mean scores (`weighted_krausest`, `weighted_vs_fastest`, `weighted_vs_floor`).
- **`history.json`:** Compact longitudinal summary entry for `npm run report -- diff`.
- **`results/index.html`:** Self-contained static HTML report with Stefan Krause's 3-stop RGB heatmap (`#63bf7c` -> `#ffeb84` -> `#f8696b`), baseline switcher (`Row Fastest (Krausest)`, `Temporal + Intl Floor`, `Fastest Library`), library toggles, and dynamic `[1]`–`[4]` implementation footnotes (`npm run report -- html <sha>` re-renders from any saved run without re-running Chrome).

### 2. Deploy `bench.nativedates.dev`

Commit `runs/<sha>.json`, `history.json`, and `results/index.html` to `Semantic-Org/Date-Benchmark` `main` and push. `.github/workflows/pages.yml` (`actions/upload-pages-artifact@v4` + `actions/deploy-pages@v4`) automatically deploys `results/index.html` and `results/CNAME` to `https://bench.nativedates.dev/`.

- **DNS & TLS note:** Cloudflare `CNAME` `bench` -> `semantic-org.github.io` stays unproxied (**DNS only**) so GitHub Pages manages Let's Encrypt renewals directly. If custom-domain TLS provisioning ever stalls on GitHub Pages, detach the domain with JSON `null` (`gh api -X PUT repos/Semantic-Org/Date-Benchmark/pages -f build_type=workflow -F cname=null`, since empty string `-f cname=""` is ignored by the API), then re-attach `-f cname=bench.nativedates.dev` and enable `-F https_enforced=true`.

### 3. Sync the `nativedates.dev` Homepage Table

Copy the recorded `runs/<sha>.json` file verbatim into [`docs/src/data/bench.json`](../../../docs/src/data/bench.json) in a `native-dates` branch and verify the docs build:

```sh
cp ../date-benchmark/runs/<sha>.json docs/src/data/bench.json
npx --workspace docs astro sync --force && npm -w docs run build
```

[`docs/src/lib/bench.js`](../../../docs/src/lib/bench.js) computes every cell time, audit note, and overall speedup ratio directly from `docs/src/data/bench.json` and fails the build if `native-dates` is no longer fastest overall (`LEAD <= 1`).

---

## Related Workflows

| Workflow | Load when |
|---|---|
| [`extend-bench-suite`](extend-bench-suite.md) | Adding or sizing individual `tachometer` operations in `bench/` |
| [`read-ci-reports`](read-ci-reports.md) | Interpreting `Bundle Size` and `Bench` comments on pull requests |
| [`docs-authoring`](docs-authoring.md) | Modifying the homepage benchmark component (`docs/src/components/home/Bench.astro`) |
| [`contribute`](contribute.md) | Preparing commits and pull requests |
