# Decisions: Package Design Log

Append-only log of decisions governing what `native-dates` exports and how it behaves: semantics, public API names, option shapes, bundle ceilings, and constraints on future surface. Entries are ordered chronologically, and the latest entry on a topic supersedes earlier ones while preserving prior entries for context (see [`decisions-index.md`](decisions-index.md) for the generated topic and chronological index).

**Inclusion test.** Record decisions here when they bind package behavior across multiple changes. One-off implementation choices belong in the PR, obvious facts already visible in source stay tacit, and repository conventions (CI, docs workflow, release process) belong in [`project-decisions.md`](project-decisions.md). Ask: *Does someone modifying this package two years from now need to follow this rule?*

**Prose style.** Keep entries brief and human-scannable. Write the heading as a plain claim (`A uses B instead of C`), followed by 2-3 sentences on the tradeoff or failure mode that ruled out the alternative. Skip signatures or mechanics already readable in source or API docs, and omit PR numbers and session history.

**Entry format.** `## <Plain claim> (<YYYY-MM-DD>)`, an optional `*<0-100>% confident*` line when scored (omitted when unscored), a concise rationale, and a closing `Reopen: <observable condition>` line. When a later decision overturns an earlier one, add `Superseded by <YYYY-MM-DD>.` to the earlier entry.

**Confidence scores.** Optional 0-100 probability assigned by the maintainer at decision time. Calibrated scores reflect actual odds of reversal rather than rhetorical finality: a 70 expects roughly 3 in 10 such calls to flip with new evidence, and a 90 still expects 1 in 10 to turn out wrong:

- **90+:** High confidence, though roughly 1 in 10 calls at 90 will still prove wrong. Reopen when its `Reopen:` condition is met or concrete counter-evidence appears.
- **~60-75:** Working decision under real tradeoffs, with a meaningful chance real-world usage flips it.
- **<50:** Provisional default chosen to unblock shipping until usage data arrives.

**Reopening a decision.** Any decision may be reopened when concrete evidence shows its `Reopen:` condition has been met, surfaces a tradeoff not weighed in the original entry, or exposes a clear usability hazard for downstream callers.

---

## Trailing `Z` and numeric offsets in `datetime()` set the instant, not `.zone` (2026-11-05)

Database and JSON timestamps normally arrive with `Z` (`'2026-03-08T04:30:00Z'`). Adopting `'UTC'` or a fixed offset from the input string (like Moment's `parseZone`) would silently disable DST rules on subsequent `.plus(1, 'day')` or `.startOf('day')` calls unless callers remember `.in(zone)`.

Reopen: downstream bug reports show callers passing `Z` strings expecting `.hour` and `.zone` to default to `'UTC'`.

## `DateTime` serializes to ISO 8601 UTC rather than Temporal's bracketed `[Zone]` string (2026-11-05)

`Temporal.ZonedDateTime.prototype.toString()` appends `-05:00[America/New_York]`, which `Date.parse()`, PostgreSQL `timestamptz`, and standard ISO 8601 parsers reject. `toString()` and `toJSON()` output standard UTC strings (`...Z`) so `DateTime` values work directly in JSON payloads and database parameters.

Reopen: RFC 9557 bracketed zone strings gain broad database and parser support and callers request round-tripping `.zone` through JSON.

## Instances freeze on construction with `text` as an eager own property (2026-11-05)

Setting `text` as the first enumerable own property shows the human-readable value first in `console.log()` and object spreads without clicking prototype getters in DevTools or Node. On `Duration`, eager `Intl.DurationFormat` formatting (~14 µs in Node) was accepted over a lazy getter so console output behaves the same across every class.

Reopen: benchmark profiles in `bench/` show eager `text` construction dominating hot arithmetic or `range.points()` loops.

## Plugins attach on subpath import instead of requiring `use()` or `extend()` (2026-11-08)

Explicit registration (`use(plugin)`, used initially and removed) recreates Day.js's load-order bug when a module parses or formats a date before startup code runs, and requires TypeScript callers to keep runtime `use()` calls in sync with type imports. Because prototype methods and parser hooks are process-wide anyway, `use()` added ordering bugs without isolating instances.

Reopen: a standard bundler configuration tree-shakes an imported `@native-dates/plugins/*` module despite `"sideEffects": ["./src/*.js"]`.

## `DateRange` includes its end date while `DateTimeRange` and `TimeRange` are half-open (2026-11-12)

In everyday English, SQL `BETWEEN`, and date pickers, "Monday to Friday" means 5 days rather than 4, so half-open `DateRange` bounds would cause off-by-one end dates. Timestamps and clock times use `[start, end)` so adjacent slots (`09:00` to `10:00`, `10:00` to `11:00`) share `10:00` without overlap or a 1 ms gap, and `TimeRange` treats `end < start` as crossing midnight (`22:00` to `06:00`) for overnight shifts.

Reopen: bug reports show callers frequently off by one day when converting between `DateRange` and `DateTimeRange`.

## `.locale()` attaches a formatting locale to values without affecting equality or JSON (2026-11-14)

Process-wide `configure({ locale })` leaks across concurrent requests on Node servers, so instances carry an optional locale (+320 B Brotli) through method chains while keeping `equals()`, `compare()`, `toString()`, and `toJSON()` locale-independent. `.locale()` also accepts POSIX `'en_US'` tags and HTTP `Accept-Language` headers in core (+130 B) because `.locale()` has no `{ loose: true }` option.

Reopen: callers hit assertion bugs because two `.equals()` values in different locales have different `.text` own properties under deep-object equality.

## Default week boundaries follow the locale while `weekOfYear` stays ISO Monday (2026-11-14)

Defaulting `startOf('week')`, `endOf('week')`, `range('week')`, and `weekdayNames()` to Monday produced the wrong calendar week out of the box in Sunday-start (`en-US`, `ja-JP`, `pt-BR`) and Saturday-start (`ar-EG`, `fa-IR`) locales (+70 B Brotli via `Intl.Locale.prototype.getWeekInfo`). `weekOfYear` and the `W` token keep ISO 8601 Monday numbering because business week numbers are an unlocalized standard.

Reopen: server code accidentally partitions stored weekly aggregates differently across requests carrying different `.locale()` tags.

## Format tokens output ASCII digits and Gregorian years while presets localize the calendar (2026-11-14)

Developers use `'YYYY-MM-DD'` for URLs, filenames, and API payloads that need ASCII digits and Gregorian years even when the active locale uses Arabic-Indic digits (`ar-EG`) or non-Gregorian calendars (`fa-IR`, `th-TH`). `MonthDay` and `YearMonth` also use Gregorian months because ISO anniversaries fall on different Persian or Islamic dates each year, and `YearMonth` `'short'` uses 4-digit years (`'11/2026'`) so `'11/26'` is not misread as November 26.

Reopen: native speakers request an opt-in localized-numeral token mode or non-Gregorian partial dates.

## Core has zero runtime dependencies and trims forked `@semantic-ui/utils` helpers to used branches (2026-11-16)

Depending on `@semantic-ui/utils` was tried and reverted because zero dependencies is a common requirement when picking a date library. Copying the shared helpers verbatim saved apps already bundling `@semantic-ui/utils` 61 B Brotli while costing standalone consumers 300 B from unused branches in `each()` and `createErrors` that bundlers could not tree-shake, so `src/helpers/utils.js` keeps only the branches `native-dates` uses.

Reopen: `@semantic-ui/utils` publishes tree-shakeable single-branch entrypoints with zero unreached bytes and consumers favor cross-package deduplication over zero dependencies.

## Error explanations use inline `isDevelopment` checks, and `{ loose: true }` still throws on bad options (2026-11-16)

Error calls pass `explanation: isDevelopment ? '...' : 0` inline at the callsite because minifiers cannot strip string literals passed unconditionally into a helper. When `{ loose: true }` is enabled, only malformed input data returns `null`, while invalid caller options (`unknownZone`, `unknownLocale`, `unknownFormat`) still throw.

Reopen: callers building dynamic zone or format inputs from untrusted user text need a non-throwing validation helper.

## Custom `weekdayNames`, `ordinals`, and named `formats` live in `configure()` instead of locale plugins (2026-11-16)

`dd` and `Do` are the only Moment/Day.js tokens with no `Intl` field. A `@native-dates/plugins/weekdays` plugin and hard-coded French `1er` rule were removed once `Intl`-derived defaults covered nearly all locales (+220 B for `weekdayNames`/`ordinals`, +70 B for `formats`), avoiding per-language tables in core and a plugin name suggesting weekdays required an extra import. `weekdayNames` keys days by name (`fri`, `sun`) rather than array index to avoid Sunday-0 vs. Monday-1 off-by-one bugs.

Reopen: multiple downstream apps duplicate the same locale ordinal or `dd` overrides and warrant a shared community table.

## Core parses unambiguous non-ISO inputs and refuses inputs with two readings (2026-11-16)

Year-first `'2026/1/5'`, leading epoch-ms numbers in `compare(Date.now(), dt)`, and fixed-ratio duration borrowing (`years(1).minus(months(1))` -> 11 months, `weeks(1).minus(days(1))` -> 6 days) each have a single valid interpretation (+230 B total). Core still refuses `'11/06/2026'` (ambiguous between US and European order), `days(1).minus(hours(1))` (differs by an hour from `.plus(days(1)).minus(hours(1))` across DST), and `compare(CalendarDate, DateTime)` (treating dates as midnight contradicts `isBefore()`, while tying across the day breaks `Array.prototype.sort`).

Reopen: a non-ISO form accepted in core misparses real input, or callers repeatedly hit one of the remaining refusals where an explicit option could disambiguate.

## Unix timestamp properties include their unit (`epochSeconds`, `epochMilliseconds`, `epochNanoseconds`) with no bare `.epoch` (2026-11-17)

Shells, Python, SQL, and JWT `exp`/`iat` claims count Unix time in seconds while `Date.now()` uses milliseconds, so an unqualified `.epoch` or `.timestamp` makes `claims.exp = dt.epoch` silently 1,000x too large. Requiring the unit in the property name gives up short round-tripping with `datetime(ms)` to prevent seconds-vs-milliseconds bugs at API boundaries.

Reopen: migration feedback shows omitting `.epoch` causes widespread friction without preventing real seconds-vs-milliseconds bugs.

## Numeric day of the week is `dayOfWeek` (`1`-`7`) while token `d` keeps Moment's `0`-`6` (2026-11-17)

Naming the `1`-`7` property `.weekday` made `sunday.weekday` return `7` while `sunday.isWeekday()` returned `false`, and collided with custom display names in `configure({ weekdayNames })`. Format token `d` keeps `0` = Sunday through `6` = Saturday to match Moment and Day.js alongside `E` for ISO `1`-`7`.

Reopen: callers hit bugs from `format('d')` returning `0` on Sunday while `.dayOfWeek` and `format('E')` return `7`.

## `Duration` uses `balance()` without a `normalize()` alias, and `total(unit)` instead of `in(unit)` (2026-11-17)

Blind naming reviewers guessed `normalize()` for cascading `90 minutes` into `1 hour 30 minutes` and preferred `hours(36).in('days')` for numeric conversion. Aliasing `normalize` to `balance` was rejected because Luxon's `Duration.prototype.normalize()` leaves `{ minutes: 90 }` unchanged instead of promoting into absent units, and `.in()` returns an object instance everywhere else (`datetime.in(zone)`, `monthDay.in(year)`, `range.in(zone)`).

Reopen: cold-reader studies or user issues show callers repeatedly reaching for `duration.in(unit)` or `duration.normalize()`.

## Ranges accept `.for()` for durations alongside `.to()`, and only `CalendarDate` has `.through()` (2026-11-17)

Cold readers misread `start.to(3, 'days')` as a unit conversion and ranked `start.for(3, 'days')` first (+10 B), which also avoids inclusive-end off-by-one math on `CalendarDate`. `.to()` still accepts durations because restricting `.to()` to endpoints would make `time('9am').to(8, 'hours')` parse `8` as `08:00` and return a 23-hour range, while `.through()` is limited to `CalendarDate` because `DateTimeRange` and `TimeRange` exclude their end.

Reopen: callers pass endpoints to `.for()` expecting runtime rejection, or expect `.through()` on `DateTime` with inclusive end semantics.

## Adjacent unit boundaries use `startOfNext()` and `startOfPrevious()` instead of overloading `next()` and `previous()` (2026-11-19)

Overloading `next('month')` conflicts with `DateTime.prototype.next('friday')`, which preserves the time of day (`09:30`) while a unit boundary resets to `00:00`, and callers split on whether `next('month')` means the 1st of next month or `plus(1, 'month')`. Numeric weekdays are rejected in `startOfNext()` so misplaced counts like `startOfNext(2, 'months')` cannot silently resolve `2` as Tuesday.

Reopen: callers consistently try unit names in `next()` and `previous()`, or expect numeric weekdays in `startOfNext()`.
