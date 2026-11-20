# Decisions: Package Design Log

Append-only log of adjudicated decisions governing what `native-dates` exports and how it behaves: semantics, public API names, option shapes, bundle ceilings, and constraints on future surface. Entries are dated, and the latest entry on a topic supersedes earlier ones while preserving prior entries for context.

**Inclusion test.** Record decisions here when they bind package behavior across multiple changes. One-off implementation choices belong in the PR, and subjective repository conventions (CI, docs workflow, release process) belong in [`project-decisions.md`](project-decisions.md). Ask: *Does someone modifying this package two years from now need to follow this rule?*

**Prose style.** Keep entries brief and human-scannable. The heading states the rule, and 2-3 sentences explain the tradeoff or failure mode that ruled out the obvious alternative. Do not restate signatures or behavior already readable in source or API docs, and omit PR numbers and session history.

**Entry format.** `## <Kind> <YYYY-MM-DD>: <short rule>`, a concise rationale, and a closing `Reopen: <observable condition>` line (or `Confidence: <0-100> · Reopen: <observable condition>` when scored). Kinds: `Ruled`, `Amended`, `Corrected`, `Reverted`, `VOID`, and `Lean` (guidance for future API surface).

**Confidence scores.** Optional 0-100 probability assigned by the maintainer at decision time. Calibrated scores reflect actual odds of reversal rather than rhetorical finality: a 70 expects roughly 3 in 10 such calls to flip with new evidence, and a 90 still expects 1 in 10 to turn out wrong:

- **90+:** High confidence, though roughly 1 in 10 calls at 90 will still prove wrong. Reopen when its `Reopen:` condition is met or concrete counter-evidence appears.
- **~60-75:** Working decision under real tradeoffs, with a meaningful chance real-world usage flips it.
- **<50:** Provisional default chosen to unblock shipping until usage data arrives.

**Reopening a decision.** Any decision may be reopened when concrete evidence shows its `Reopen:` condition has been met, surfaces a tradeoff not weighed in the original entry, or exposes a clear usability hazard for downstream callers.

---

## Ruled 2026-11-05: Input `Z` and numeric offsets fix the instant, never `.zone`

Database and JSON timestamps normally arrive with `Z` (`'2026-03-08T04:30:00Z'`). Adopting `'UTC'` or a fixed offset from the input string (like Moment's `parseZone`) would silently disable DST rules on subsequent `.plus(1, 'day')` or `.startOf('day')` calls unless callers remember `.in(zone)`.

Reopen: downstream bug reports show callers passing `Z` strings expecting `.hour` and `.zone` to default to `'UTC'`.

## Ruled 2026-11-19: Use `startOfNext()` and `startOfPrevious()` for unit boundaries rather than overloading `next()` and `previous()`

Overloading `next('month')` conflicts with `DateTime.prototype.next('friday')`, which preserves the time of day (`09:30`) while a unit boundary resets to `00:00`, and callers split on whether `next('month')` means the 1st of next month or `plus(1, 'month')`. Numeric weekdays are rejected in `startOfNext()` so misplaced counts like `startOfNext(2, 'months')` cannot silently resolve `2` as Tuesday.

Reopen: callers consistently try unit names in `next()` and `previous()`, or expect numeric weekdays in `startOfNext()`.
