---
title: Extending the Bench Suite
description: What an op in bench/ is, the rules that make a faster result mean users are better off, and how the suite runs in CI.
keywords: [tachometer, benchmark, bench, op, performance, check, cold start, noise floor, sampleSize, autoSampleConditions]
audience: contributing
workflow: extend-bench-suite
type: workflow
---

# Extending the Bench Suite

> **Workflow:** `extend-bench-suite`
> **Load when:** adding or changing an op in `bench/`, or changing `tools/bench.js` or `tools/ci/bench/`

> status: describes the suite as built on 2026-11-23. Written tersely by the agent that built it and due a revoicing. Sizes are from one CI run of an earlier suite and loose Node timings.

**Core rule: an op is something a person or a server does with dates, written in the sentence the docs teach, at a size a real app holds. It should not be able to get faster unless they are better off.**

Bench runs come from CI. Do not run tachometer on a local machine. `npm run bench` with no flag launches it.

---

## The Suite

One back-office product. Each file is a screen, each op is one act on it, and each op runs once per page load in the order a session runs them.

| File | Who is on the other end | Zone and locale |
|---|---|---|
| `bench/records.js` | A person at a table of orders and a dashboard | The browser's own (nothing configured) |
| `bench/calendar.js` | A person at a date picker, a booking page and a meeting planner | `configure()` |
| `bench/tracking.js` | A person at a support queue and a timesheet | `configure()` |
| `bench/import.js` | A person importing a sheet of typed dates (`@native-dates/plugins/loose`) | Passed per call |
| `bench/server.js` | An operator paying for CPU on a multi-user server | Passed per call |
| `bench/startup.js` | Every reader of a page that shows a date, once per load | The browser's own |

`tools/bench.js` starts Node and Chrome in `Europe/Berlin` reading `en-US`, since a runner's own zone is UTC.

---

## Rules for an Op

| Rule | What it closes |
|---|---|
| The documented sentence, shortest spelling, nothing hoisted, option bags inline | A careful spelling nobody writes |
| One pass over distinct data. Reach the timing band with more rows, months or users, never by repeating a pass | Remembering answers by input, and wins that exist only in a hot loop |
| Module scope holds wire data only (strings, numbers, `Date`). Ops build every library value, and later ops use what earlier ops built | Warming code and `Intl` caches before the first mark |
| Each op returns what the screen or wire shows, and its check compares that with the same task in plain `Temporal` and `Intl` | Faster and wrong |
| Expected answers are built when a check runs, never at module scope | Platform work before an op |
| Zone and locale are set the way that op's user sets them | Fast paths for UTC and the runner's defaults |
| A `// purpose:` line above each export says who does what, at what size | A percent with no person behind it |
| Sizes, fixtures and op order are fixed once landed. New ops are appended, and a changed op gets a new name | A number that means something else next year |

Two facts to hold when reading or adding ops:

- **The first op in a file carries that page's cold start.** Tachometer loads a fresh page per sample, so first-use cost (cold code, the first formatters) lands on whichever op a file declares first. Its purpose line says so.
- **Keep one slow string out of an op of fast ones.** A 46 µs phrase beside a 1 µs format hides the format.

---

## Anatomy of a Bench File

```js
import { datetime } from 'native-dates';

import { checkAnswer } from './helpers/checks.js';

// wire data only
const rows = [{ id: 1, at: '2026-03-07T14:00:12.345Z' }];

// purpose: opens a page of 1,000 rows from JSON and shows when each was placed
export function openTable1k() {
  return rows.map((row) => datetime(row.at).format('medium'));
}

// the same task in plain Temporal and Intl, built when the check runs
const expected = {
  openTable1k() {
    const medium = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    return rows.map((row) => medium.format(Date.parse(row.at)));
  },
};

export const checks = {
  openTable1k: (cells) => checkAnswer('records openTable1k', cells, expected.openTable1k()),
};
```

`tools/bench.js` measures each exported function in file order, collects garbage before each, and refuses a file with an op that has no entry in `checks`. Shared fixture and check helpers live in `bench/helpers/`.

---

## Sizing

| Mean op duration on CI | Relative noise | Zero-delta verdict |
|---|---|---|
| `< 5 ms` | ±30% or wider | Too fast to measure |
| `5–20 ms` | ±5% to ±15% | Usually unsure |
| `20–100 ms` | ±1% to ±5% | Resolves against the 2% floor |
| `> 100 ms` | under ±1% | Resolves, and costs CI minutes |

Put the size in the op name (`openTable1k`, `monthGrid12`). If a fix later drops an op under the band, leave its size alone: at that point nobody can feel it.

Keep `bench/tachometer.json` (`sampleSize: 50`, `autoSampleConditions: ["2%"]`, `timeout: 3`) unless runner data says otherwise.

---

## Running It

| Where | What runs |
|---|---|
| `node tools/bench.js --check` | Every op once in Node with its check, no browser. `npm test` runs this through `tools/bench.test.js` |
| `node tools/bench.js --check --head <dir> --base <dir>` | The same on two checkouts, with the bytes each ships |
| Bench workflow on a pull request | Head against base in headless Chrome, with `bench/` and `tools/` taken from the base branch so a pull request cannot edit the bench that measures it |
| Bench workflow run by hand | The chosen branch against itself, with its own `bench/` and `tools/`. Use it to size a new op before it lands |

Land a new op on `main` before the `Perf:` pull request it is meant to measure.

### When an Answer Changes on Purpose

Update the op's expected answer in the same pull request, so `npm test` passes. CI still measures with the base's bench, so that op is reported under `Answer changed` and left untimed, and a reviewer rules on whether the change was meant.

---

## What the Suite Cannot See

Memory held by caches and revived values, engines other than Chrome's (Safari runs the polyfill until it ships `Temporal`), Node's own ICU build, and what an eager `text` buys in a console (D3). Bytes are measured by the Bundle Size check, and the Bench comment repeats the `native-dates (full)` delta so the two are read together.

---

## Related Workflows

| Workflow | Load when |
|---|---|
| [`read-ci-reports`](read-ci-reports.md) | Interpreting a Bench comment |
| [`contribute`](contribute.md) | Preparing a `Perf:` pull request |
