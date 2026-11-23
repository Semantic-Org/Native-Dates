---
title: Extending the Bench Suite
description: When and how to add benchmark operations in bench/ so tachometer produces low-noise confidence intervals in CI.
keywords: [tachometer, benchmark, bench, op, performance, noise floor, sampleSize, autoSampleConditions, duration]
audience: contributing
workflow: extend-bench-suite
type: workflow
---

# Extending the Bench Suite

> **Workflow:** `extend-bench-suite`
> **Load when:** porting or extending benchmark operations in `bench/` or adjusting `bench/tachometer.json`

> status: active (2026-11-23). Runner and parallel CI reporting live in [`tools/bench.js`](../../../tools/bench.js) and [`tools/ci/bench/`](../../../tools/ci/bench/README.md).

**Core rule: size each benchmark operation to 20-100 ms on CI runners.** Shared GitHub Actions runners add ~2 ms of fixed scheduling jitter per sample regardless of workload duration. A 2 ms operation experiences ±30% relative noise (`Unsure` on every PR), whereas a 50 ms operation keeps relative noise near ±1%.

Condensed from Semantic UI Next (`next:ai/skills/contributing/extend-bench-suite.md`), calibrated on the same runners.

---

## When to Add an Operation

Add a benchmark only when:

- **Verifying a `Perf:` optimization** and guarding against future regressions on that path, or
- **Covering an unmeasured hot path** that applications execute frequently (parsing ISO strings, calendar/zoned arithmetic, `range.every()`, `compare()` sorting, preset and token formatting).

Avoid speculative microbenchmarks that increase CI runtime without guarding a real hot path.

**Land new benchmarks on `main` before the `Perf:` PR they measure.** The CI Bench workflow always runs `bench/` from the base branch so a PR cannot alter its own benchmark harness.

---

## Benchmark File Structure

Each file `bench/<name>.js` compiles to an isolated benchmark page, and each exported function becomes one named tachometer measurement:

```js
import { date } from 'native-dates';

// build fixtures at module scope outside the timed export
const inputs = Array.from({ length: 15_000 }, (_, i) => `2026-01-${String((i % 28) + 1).padStart(2, '0')}`);
export let sink = null;

// purpose: parses 15,000 varied ISO calendar date strings into frozen CalendarDate instances
export function parseIsoDate15k() {
  for (const input of inputs) { sink = date(input); }
}
```

`tools/bench.js` inspects exported functions via `esbuild` and generates the HTML runner and tachometer config automatically, while `tools/ci/bench/reporter.js` indexes optional `// purpose:` comments into the collapsible PR glossary. Before each exported function runs, the runner invokes `globalThis.gc` for a synchronous major garbage collection.

---

## Authoring Guidelines

- **Keep fixture setup outside exported functions** so tachometer measures only the target operation.
- **`async` exports are supported** and timed until the returned promise resolves.
- **Never await `requestAnimationFrame` inside a loop**, which quantizes each iteration to the 16.66 ms display clock and masks real CPU changes.
- **Warm steady-state paths symmetrically at module scope.** Run a short (`128-512` iteration) module-level warmup on steady-state operations so lazy-vs-eager fixture constructor changes do not shift V8 inline-cache tiering into the timed loop on one side only.
- **Avoid cross-op state pollution.** Exported functions in the same file run sequentially in source declaration order on a fresh page per sample. Place cold-cache operations first using disjoint locales/zones untouched by module warmup, or isolate configuration-mutating operations in their own `bench/<name>.js` file.
- **Use realistic input shapes** rather than identical repeated strings that hit a single cache slot unrealistically (unless specifically benchmarking cached formatting).

---

## Target Duration Bands

| Mean op duration | Typical CI relative noise | Expected zero-delta verdict |
|---|---|---|
| `< 5 ms` | ±30% or wider | Always `Unsure` |
| `5–20 ms` | ±5% to ±15% | Usually `Unsure` (detects >10% shifts) |
| `20–100 ms` | ±1% to ±5% | Resolves cleanly against a 2% floor |
| `> 100 ms` | `< ±1%` | High precision, catches ~2% regressions |

**Loop fast operations** until total duration falls in the `20-100 ms` window, and include the iteration count in the export name (`parseDate10k`, `formatToken5k`).

---

## Naming Conventions

| Rule | Example |
|---|---|
| CamelCase exported function name | `parseDate10k`, `rangePoints5k` |
| Suffix iteration count when looped | `parseDate10k`, `compareDates2k` |
| Name the workload, not internal implementation | `parseDate10k` (not `regexMatchLoop`) |

PR comments display operations as `` `<file> · <op>` ``, so distinct files can share operation names.

---

## Sampling Settings (`bench/tachometer.json`)

Keep default sampling parameters unless empirical runner data justifies changing them:

| Key | Default | Purpose |
|---|---|---|
| `sampleSize` | `50` | Minimum interleaved samples per side before auto-sampling stops (values below 30 produce unreliable intervals) |
| `autoSampleConditions` | `["2%"]` | Resolution floor matching GitHub runner noise (`0%` never converges on unchanged ops and burns the full timeout) |
| `timeout` | `3` | Maximum minutes spent auto-sampling per benchmark file after the initial 50 samples |

---

## Local Verification Before Pushing

```sh
npm run bench                             # single-tree run across all bench/*.js files
node tools/bench.js --suite parse         # single-suite run: verify each op takes 20-100 ms
node tools/bench.js --head . --base .     # A/A zero-change run: check baseline interval width
```

Requires Chrome (`tools/bench.js` automatically installs the matching major version of `chromedriver` on first run).

---

## Related Workflows

| Workflow | Load when |
|---|---|
| [`read-ci-reports`](read-ci-reports.md) | Interpreting Bench PR comments |
| [`contribute`](contribute.md) | Preparing a `Perf:` pull request |
