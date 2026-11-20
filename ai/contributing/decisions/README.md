# Using and Recording Decisions

Read this guide before appending to or reopening an entry in [`package.md`](package.md) or [`project.md`](project.md). For browsing existing decisions by topic, start at [`../decisions.md`](../decisions.md).

## Files

| File | Role |
|---|---|
| [`../decisions.md`](../decisions.md) | Generated topic and chronological index (`npm run ai:index`). Do not edit by hand |
| [`package.md`](package.md) | Append-only package design log (`D1`, `D2`, ...) |
| [`project.md`](project.md) | Append-only repository, CI, docs workflow, and release process log (`P1`, `P2`, ...) |

## What Belongs Here

Record a decision only when reading `src/`, `types/`, and `docs/` alone would leave a future contributor guessing why another reasonable option was not taken:

- **Competing mental models:** Choosing one position among ambiguous or overlapping options (`Z` setting the instant rather than `.zone`, `DateRange` closed vs `DateTimeRange` half-open, `weekStart` following locale while `weekOfYear` stays ISO Monday).
- **Deliberate omissions and rejected names:** Leaving out an API or alias that callers or contributors would naturally propose (`no bare .epoch`, `no Duration.prototype.normalize()`, `no next('month')`, `no use(plugin)`).
- **Tried-and-reverted experiments:** Approaches built, measured, and removed so nobody repeats them (`@semantic-ui/utils` verbatim copy costing standalone apps +300 B Brotli, `days(1).minus(hours(1))` diverging across DST, `@native-dates/plugins/weekdays`).

## What Does Not Belong Here

- **Features and enhancements** whose behavior follows expected conventions (adding an ISO token like `E`, adding `fromNow()`). Source, types, docs, and `git log` already record what shipped.
- **Bug fixes** where prior behavior was simply broken rather than an intentional tradeoff.
- **Unbuilt backlog notes** (*"omitted until requested"*). Deferred work belongs in [`../plan/roadmap.md`](../plan/roadmap.md) or nowhere, never inside a decision entry where building it later creates churn.
- **Single-site implementation details** explainable by a one-line code comment at the callsite.

**Gut check:** *If a capable engineer only read the code and docs two years from now, would they reasonably propose the rejected option and reintroduce a bug, ambiguity, or bundle cost?* If no, do not write an entry.

## Entry Format

Append new entries to the bottom of [`package.md`](package.md) (next `D<n>`) or [`project.md`](project.md) (next `P<n>`), then run `npm run ai:index`:

```markdown
## D18: A uses B instead of C (2026-11-20)

*85% confident*

2-3 sentences on the tradeoff, failure mode, or measurement that ruled out C. Skip signatures or mechanics already readable in source or API docs, and omit PR numbers and session history.

Reopen: observable condition that justifies revisiting this call.
```

- **Confidence line (`*0-100% confident*`):** Optional probability assigned by the maintainer at decision time; omit the line when unscored. Calibrated scores reflect actual reversal odds rather than finality: a `70%` call expects roughly 3 in 10 such calls to flip with new evidence, and a `90%` call still expects 1 in 10 to prove wrong (`~60-75%` working tradeoff, `<50%` provisional default).
- **Superseding an earlier entry:** Append the new `D<k>` entry at the bottom and replace the earlier entry's `Reopen:` line with `Superseded by D<k> (<YYYY-MM-DD>).` so history stays intact while the topic index shows only active calls.
- **Reopening:** Surface an entry to reopen whenever concrete evidence shows its `Reopen:` condition has been met, exposes a tradeoff not weighed in the entry, or reveals a clear usability hazard.
