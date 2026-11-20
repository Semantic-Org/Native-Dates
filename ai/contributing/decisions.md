# Decisions: Package Design Log

Append-only log of adjudicated decisions governing what `native-dates` exports and how it behaves: semantics, public API names, option shapes, bundle ceilings, and constraints on future surface. Entries are dated, and the latest entry on a topic supersedes earlier ones while preserving prior entries for context.

**Inclusion test.** Record decisions here when they bind package behavior across multiple changes. One-off implementation choices belong in the PR, and subjective repository conventions (CI, docs workflow, release process) belong in [`project-decisions.md`](project-decisions.md). Ask: *Does someone modifying this package two years from now need to follow this rule?*

**Prose style.** Direct, factual specification prose. State what the package does first, why it was chosen, and what alternative was rejected. Omit PR numbers, chat history, and process commentary.

**Entry format.** `## <Kind> <YYYY-MM-DD>: <one-sentence decision>`, followed by the rationale, closing with `(<score>, reopen: <observable condition>)` when scored or `(reopen: <observable condition>)` when unscored. Kinds: `Ruled`, `Amended`, `Corrected`, `Reverted`, `VOID`, and `Lean` (guidance for future API surface).

**Confidence scores.** Optional 0-100 probability assigned by the maintainer at decision time. Calibrated scores reflect actual odds of reversal rather than rhetorical finality: a 70 expects roughly 3 in 10 such calls to flip with new evidence, and a 90 still expects 1 in 10 to turn out wrong:

- **90+:** High confidence, though roughly 1 in 10 calls at 90 will still prove wrong. Reopen when its `reopen:` condition is met or concrete counter-evidence appears.
- **~60-75:** Working decision under real tradeoffs, with a meaningful chance real-world usage flips it.
- **<50:** Provisional default chosen to unblock shipping until usage data arrives.

**Reopening a decision.** Any decision may be reopened when concrete evidence shows its `reopen:` condition has been met, surfaces a tradeoff not weighed in the original entry, or exposes a clear usability hazard for downstream callers.

---

## Ruled 2026-11-05: Treat `Z` and numeric offsets in `datetime()` inputs as instant markers rather than time zones, and serialize `toString()` and `toJSON()` in UTC

`DateTime` wraps `Temporal.ZonedDateTime` and resolves `.zone` from an explicit `zone` argument, a bracketed RFC 9557 `[Zone]` suffix in the input string, `configure({ zone })`, or the runtime's local IANA zone. A trailing `Z` or numeric offset (`-05:00`) in an input string fixes the instant in time without setting `.zone` to `'UTC'` or a fixed offset, and `date()` and `time()` resolve instant strings in that same target zone (`datetime('2026-03-08T04:30:00Z', 'America/New_York').zone` is `'America/New_York'`, and omitting the second argument uses the configured or local zone). On output, `DateTime.prototype.toString()` and `toJSON()` serialize standard ISO 8601 UTC strings (`'2026-03-08T04:30:00.000Z'`). Database rows and JSON payloads normally arrive with `Z`. Locking `.zone` to `'UTC'` whenever `Z` is present silently disables daylight-saving rules on subsequent `.plus(1, 'day')` or `.startOf('day')` calls unless the caller remembers `.in(zone)`. Emitting Temporal's `-05:00[America/New_York]` string from `toString()` was rejected because `Date.parse()`, PostgreSQL `timestamptz`, and standard ISO 8601 parsers reject bracketed zone suffixes. Preserving input offsets as `.zone` (like Moment's `parseZone` or Luxon's `{ setZone: true }`) was also rejected. Callers who want UTC wall-clock fields pass `'UTC'` as the zone, and callers who need the RFC 9557 string call `toTemporal().toString()`. (reopen: downstream bug reports show callers passing `Z` strings expecting `.hour` and `.zone` to default to UTC rather than the configured or local zone)

## Ruled 2026-11-19: Step to adjacent unit boundaries with `startOfNext()` and `startOfPrevious()` rather than overloading `next()` and `previous()`

`CalendarDate` and `DateTime` expose `startOfNext(unit, firstDay?)` and `startOfPrevious(unit, firstDay?)`, and `Time` exposes `startOfNext(unit)` and `startOfPrevious(unit)`, returning the start of the enclosing unit's next or previous sibling (`date('2026-11-16').startOfNext('month')` is `'2026-12-01'`, `datetime('2026-11-16T09:30').startOfNext('month')` is December 1 at `00:00`). On `CalendarDate` and `DateTime`, weekday names such as `'wednesday'` are also accepted and return the start of that upcoming or most recent weekday, whereas numeric weekdays are rejected as `unknownUnit` so misplaced counts like `startOfNext(2, 'months')` do not silently resolve to Tuesday. Overloading `next('month')` and `previous('month')` was rejected because `DateTime.prototype.next('friday')` preserves the time of day (`09:30`) while a unit boundary resets the clock to `00:00`, and callers split on whether `next('month')` means the 1st of next month or `plus(1, 'month')`. (reopen: user studies or downstream issue reports show callers consistently expecting unit names in `next()` and `previous()`, or numeric weekdays and `MonthDay` targets in `startOfNext()`)
