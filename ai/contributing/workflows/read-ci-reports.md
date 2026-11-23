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
- **Bench:** Real runtime changes appear in `Faster` and `Slower`. `🔍 Unsure` means the 95% confidence interval crossed the resolution floor before timeout, not a regression. The verdict is about time. Read it beside the bytes line and the Bundle Size comment.

---

## Comment Summary

| Property | Bundle Size (`bundle-size.yml`) | Bench (`bench.yml`) |
|---|---|---|
| Heading | `Bundle Size — ...` | `... on Bench` |
| Metric | Brotli-11 bytes across `rowsFrom` in `tools/size.js` | Headless Chrome runtime via tachometer |
| Variance | None (deterministic build) | Statistical (95% confidence interval) |
| Actionable signal | Verdict heading, size tier, and `Changed` table | `Faster` and `Slower` tables |
| Fails CI | Yes, when over ceiling/tier limit or leaking dev prose | Only when the run breaks: an op's answer differs from the bench's on the base, or a file fails in the browser. Never for a slower op |
| Architecture doc | [`tools/ci/bundle/README.md`](../../../tools/ci/bundle/README.md) | [`extend-bench-suite.md`](extend-bench-suite.md) |

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
| Incomplete run | ⚠️ | An op the run planned has no result, as when a file fails part-way. Outranks every verdict below |
| Answer changed | ✏️ | An op answers differently on the change than on the base, or fails to run there, so it was not timed. A reviewer rules on whether the change was meant |
| Improvement | ✅ | One or more ops in `Faster`, none in `Slower`, and `native-dates (full)` ships no more bytes |
| Faster for more bytes | 🟡 | As Improvement, with `native-dates (full)` larger than the base. A trade, since most pages show too few dates to feel the time |
| Regression | ❌ | One or more ops in `Slower`, none in `Faster` |
| Mixed | 🟡 | Ops in both `Faster` and `Slower` (inspect `Slower` first) |
| `No meaningful change` | ⚪ | Zero ops in `Faster` or `Slower` (expected for docs, build, and pure refactors) |

### `Faster`, `Slower`, `No change`, and `Unsure`

- **`Faster` / `Slower`:** An operation enters these tables only when its entire 95% confidence interval clears the resolution floor (`2%` by default). When an untouched operation appears in `Slower`, treat it as a real runtime effect rather than dismissing it as runner noise.
- **`⚪ No change` (collapsed):** Entire 95% interval lies inside `±floor`.
- **`🔍 Unsure` (collapsed):** Confidence interval straddles the resolution floor. `Too fast to measure precisely` means runner jitter alone is as wide as the floor on an op that short. `Inconclusive` means the op is long enough to measure, so the change sits near the floor or the run was noisy.
- **Time:** Every table gives milliseconds on the runner at the size in the op's name. Read a percent as that many milliseconds at the size a person has.
- **The first op of a file** also carries its page's cold start (cold code and the first formatters), and says so in its purpose line. A change to first-use cost moves every file's first op together.
- **`Not measured` and `Answer changed`:** Lists of ops with no timing. The Bench job log has the difference behind each changed answer.
- **Bytes line:** What `native-dates (full)` ships on the change against the base, measured by the same `tools/size.js` the Bundle Size check uses.
- **Across runs:** Never compare raw `ms` numbers across separate GitHub Actions runs (runner speed varies up to 2x). Tachometer interleaves `head` and `base` in one browser session so relative `%` intervals stay valid.

---

## Related Workflows

| Workflow | Load when |
|---|---|
| [`extend-bench-suite`](extend-bench-suite.md) | Adding or changing operations in `bench/` |
| [`errors-and-logs`](../standards/legibility/errors-and-logs.md) | Fixing unstripped development prose in a production bundle |
| [`contribute`](contribute.md) | Preparing a pull request |
