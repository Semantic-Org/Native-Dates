---
title: Reading CI Reports on a Pull Request
description: How to read Bundle Size and Bench pull request comments and separate real regressions from runner noise.
keywords: [ci reports, size, bundle, budget, bench, tachometer, pull request comment, regression, unsure, noise floor, confidence interval]
audience: contributing
workflow: read-ci-reports
type: workflow
---

# Reading CI Reports on a Pull Request

> **Workflow:** `read-ci-reports`
> **Load when:** reviewing or responding to a Bundle Size or Bench comment on a pull request

**Core rule: act on confident signal, ignore unresolved runner noise.**

- **Bundle Size:** Byte counts are deterministic (`esbuild` + Brotli-11). Staying under the 15,000 B ceiling does not make unexpected byte growth free.
- **Bench:** Real runtime changes appear in `Faster` and `Slower`. `🔍 Unsure` means the 95% confidence interval crossed the resolution floor before timeout, not a regression.

---

## Comment Summary

| Property | Bundle Size (`bundle-size.yml`) | Bench (`bench.yml`) |
|---|---|---|
| Heading | `Bundle Size — ...` | `... on Bench` |
| Metric | Brotli-11 bytes across `rowsFrom` in `tools/size.js` | Headless Chrome runtime via tachometer |
| Variance | None (deterministic build) | Statistical (95% confidence interval) |
| Actionable signal | Verdict heading, size tier, and `Changed` table | `Faster` and `Slower` tables |
| Fails CI | Yes, when over ceiling/tier limit or leaking dev prose | Never |
| Architecture doc | [`tools/ci/bundle/README.md`](../../../tools/ci/bundle/README.md) | [`tools/ci/bench/README.md`](../../../tools/ci/bench/README.md) |

---

## Interpreting the Bundle Size Comment

### Verdicts

| Verdict | Icon | Condition |
|---|:---:|---|
| `unchanged` | ⚪ | Minified and Brotli byte counts did not grow on `native-dates (full)` or plugins |
| `shrank` | 🟢 | `native-dates (full)` decreased in Brotli bytes |
| `<tier>` (`bug sized` .. `large feature sized`) | 🔵 / 🟡 | `native-dates (full)` grew within allowed bounds (`Bug:` PRs fail at `bug sized`) |
| `past ceiling` / `over limit` | 🔴 | Exceeded `ceiling` (`15,000 B`) or category delta limit in [`ai/contributing/budget.md`](../budget.md) (fails CI) |
| `development prose in production bundle` | 🔴 | Unallowlisted diagnostic string survived `NODE_ENV="production"` minification (fails CI) |

### Reading Bundle Rows

Each row in `tools/size.js` models a consumer import (`import { now }`, `native-dates (full)`, each `@native-dates/plugins/*` delta over core, and `core + all plugins`).

- **Unpriced growth:** Features default to ~0 expected bytes on `native-dates (full)` unless the PR body declares `Expected bytes: <N>`. Growth on `Docs:`, `Chore:`, or `Test:` PRs is always unintended and should be investigated.
- **Over budget (`🔴`):** Follow the remediation steps in [`ai/contributing/budget.md`](../budget.md): tighten the implementation, move optional behavior to `@native-dates/plugins/*`, or open an issue to agree on a byte budget before coding.
- **Development prose in production (`🔴`):** Check the `Bundle Size` job log for the leaked string and ensure the error helper in `src/helpers/errors.js` gates explanation prose behind `isDevelopment` ([`errors-and-logs.md`](../standards/legibility/errors-and-logs.md)).

---

## Interpreting the Bench Comment

### Verdicts

| Verdict | Icon | Condition |
|---|:---:|---|
| Improvement | ✅ | One or more ops in `Faster`, none in `Slower` |
| Regression | ❌ | One or more ops in `Slower`, none in `Faster` |
| Mixed | 🟡 | Ops in both `Faster` and `Slower` (inspect `Slower` first) |
| `No meaningful change` | ⚪ | Zero ops in `Faster` or `Slower` (expected for docs, build, and pure refactors) |

### `Faster`, `Slower`, `No change`, and `Unsure`

- **`Faster` / `Slower`:** An operation enters these tables only when its entire 95% confidence interval clears the resolution floor (`2%` by default). When an untouched operation appears in `Slower`, treat it as a real runtime effect rather than dismissing it as runner noise.
- **`⚪ No change` (collapsed):** Entire 95% interval lies inside `±floor`.
- **`🔍 Unsure` (collapsed):** Split into **Inconclusive** (variance more than 2x wider than duration predicts) and **Too Fast to Measure Precisely** (short operation limited by ~2 ms runner scheduling jitter).
- **Partial runs:** If a matrix cell fails or times out, the alert banner warns `⚠️ Partial benchmark run` and lists missing suites so an incomplete run never passes as a clean result.
- **Read beside Bundle Size:** `Perf:` optimizations default to `0 B` growth on `native-dates (full)` ([`budget.md`](../budget.md)); evaluate runtime wins alongside byte cost.
- **Across runs:** Never compare raw `ms` numbers across separate GitHub Actions runs (runner speed varies up to 2x). Tachometer interleaves `head` and `base` in one browser session so relative `%` intervals stay valid.

---

## Related Workflows

| Workflow | Load when |
|---|---|
| [`manage-benchmarks`](manage-benchmarks.md) | Profiling `Perf:` PRs, running `Semantic-Org/Date-Benchmark`, and publishing `bench.nativedates.dev` |
| [`extend-bench-suite`](extend-bench-suite.md) | Adding or lengthening operations in `bench/` |
| [`errors-and-logs`](../standards/legibility/errors-and-logs.md) | Fixing unstripped development prose in a production bundle |
| [`contribute`](contribute.md) | Preparing a pull request |
