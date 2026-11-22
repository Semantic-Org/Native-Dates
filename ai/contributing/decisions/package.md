# Package Decisions

> Append-only package design log (`D1`..`Dn`). Read [`README.md`](README.md) before adding or reopening an entry (features and bug fixes do not belong here), and run `npm run ai:index` to update [`../decisions.md`](../decisions.md).

## D1: Trailing `Z` and numeric offsets in `datetime()` set the instant, not `.zone` (2026-11-05)

Database and JSON timestamps normally arrive with `Z` (`'2026-03-08T04:30:00Z'`). Adopting `'UTC'` or a fixed offset from the input string (like Moment's `parseZone`) would silently disable DST rules on subsequent `.plus(1, 'day')` or `.startOf('day')` calls unless callers remember `.in(zone)`.

Reopen: downstream bug reports show callers passing `Z` strings expecting `.hour` and `.zone` to default to `'UTC'`.

## D2: `DateTime` serializes to ISO 8601 UTC rather than Temporal's bracketed `[Zone]` string (2026-11-05)

`Temporal.ZonedDateTime.prototype.toString()` appends `-05:00[America/New_York]`, which `Date.parse()`, PostgreSQL `timestamptz`, and standard ISO 8601 parsers reject. `toString()` and `toJSON()` output standard UTC strings (`...Z`) so `DateTime` values work directly in JSON payloads and database parameters.

Reopen: RFC 9557 bracketed zone strings gain broad database and parser support and callers request round-tripping `.zone` through JSON.

## D3: Instances freeze on construction with `text` as an eager own property (2026-11-05)

Setting `text` as the first enumerable own property shows the human-readable value first in `console.log()` and object spreads without clicking prototype getters in DevTools or Node. On `Duration`, eager `Intl.DurationFormat` formatting (~14 µs in Node) was accepted over a lazy getter so console output behaves the same across every class.

Reopen: benchmark profiles in `bench/` show eager `text` construction dominating hot arithmetic or `range.points()` loops.

## D4: Plugins attach on subpath import instead of requiring `use()` or `extend()` (2026-11-08)

Explicit registration (`use(plugin)`, used initially and removed) recreates Day.js's load-order bug when a module parses or formats a date before startup code runs, and requires TypeScript callers to keep runtime `use()` calls in sync with type imports. Because prototype methods and parser hooks are process-wide anyway, `use()` added ordering bugs without isolating instances.

Reopen: a standard bundler configuration tree-shakes an imported `@native-dates/plugins/*` module despite `"sideEffects": ["./src/*.js"]`.

## D5: `DateRange` includes its end date while `DateTimeRange` and `TimeRange` are half-open (2026-11-12)

In everyday English, SQL `BETWEEN`, and date pickers, "Monday to Friday" means 5 days rather than 4, so half-open `DateRange` bounds would cause off-by-one end dates. Timestamps and clock times use `[start, end)` so adjacent slots (`09:00` to `10:00`, `10:00` to `11:00`) share `10:00` without overlap or a 1 ms gap, and `TimeRange` treats `end < start` as crossing midnight (`22:00` to `06:00`) for overnight shifts.

Reopen: bug reports show callers frequently off by one day when converting between `DateRange` and `DateTimeRange`.

## D6: `.locale()` attaches a formatting locale to values without affecting equality or JSON (2026-11-14)

Process-wide `configure({ locale })` leaks across concurrent requests on Node servers, so instances carry an optional locale (+320 B Brotli) through method chains while keeping `equals()`, `compare()`, `toString()`, and `toJSON()` locale-independent. `.locale()` also accepts POSIX `'en_US'` tags and HTTP `Accept-Language` headers in core (+130 B) because `.locale()` has no `{ loose: true }` option.

Reopen: callers hit assertion bugs because two `.equals()` values in different locales have different `.text` own properties under deep-object equality.

## D7: Default week boundaries follow the locale while `weekOfYear` stays ISO Monday (2026-11-14)

Defaulting `startOf('week')`, `endOf('week')`, `range('week')`, and `weekdayNames()` to Monday produced the wrong calendar week out of the box in Sunday-start (`en-US`, `ja-JP`, `pt-BR`) and Saturday-start (`ar-EG`, `fa-IR`) locales (+70 B Brotli via `Intl.Locale.prototype.getWeekInfo`). `weekOfYear` and the `W` token keep ISO 8601 Monday numbering because business week numbers are an unlocalized standard.

Reopen: server code accidentally partitions stored weekly aggregates differently across requests carrying different `.locale()` tags.

## D8: Format tokens output ASCII digits and Gregorian years while presets localize the calendar (2026-11-14)

Developers use `'YYYY-MM-DD'` for URLs, filenames, and API payloads that need ASCII digits and Gregorian years even when the active locale uses Arabic-Indic digits (`ar-EG`) or non-Gregorian calendars (`fa-IR`, `th-TH`). `MonthDay` and `YearMonth` also use Gregorian months because ISO anniversaries fall on different Persian or Islamic dates each year, and `YearMonth` `'short'` uses 4-digit years (`'11/2026'`) so `'11/26'` is not misread as November 26.

Reopen: native speakers request an opt-in localized-numeral token mode or non-Gregorian partial dates.

## D9: Core has zero runtime dependencies and trims forked `@semantic-ui/utils` helpers to used branches (2026-11-16)

Depending on `@semantic-ui/utils` was tried and reverted because zero dependencies is a common requirement when picking a date library. Copying the shared helpers verbatim saved apps already bundling `@semantic-ui/utils` 61 B Brotli while costing standalone consumers 300 B from unused branches in `each()` and `createErrors` that bundlers could not tree-shake, so `src/helpers/utils.js` keeps only the branches `native-dates` uses.

Reopen: `@semantic-ui/utils` publishes tree-shakeable single-branch entrypoints with zero unreached bytes and consumers favor cross-package deduplication over zero dependencies.

## D10: Error explanations use inline `isDevelopment` checks, and `{ loose: true }` still throws on bad options (2026-11-16)

Error calls pass `explanation: isDevelopment ? '...' : 0` inline at the callsite because minifiers cannot strip string literals passed unconditionally into a helper. When `{ loose: true }` is enabled, only malformed input data returns `null`, while invalid caller options (`unknownZone`, `unknownLocale`, `unknownFormat`) still throw.

Reopen: callers building dynamic zone or format inputs from untrusted user text need a non-throwing validation helper.

## D11: Custom `weekdayNames`, `ordinals`, and named `formats` live in `configure()` instead of locale plugins (2026-11-16)

`dd` and `Do` are the only Moment/Day.js tokens with no `Intl` field. A `@native-dates/plugins/weekdays` plugin and hard-coded French `1er` rule were removed once `Intl`-derived defaults covered nearly all locales (+220 B for `weekdayNames`/`ordinals`, +70 B for `formats`), avoiding per-language tables in core and a plugin name suggesting weekdays required an extra import. `weekdayNames` keys days by name (`fri`, `sun`) rather than array index to avoid Sunday-0 vs. Monday-1 off-by-one bugs.

Reopen: multiple downstream apps duplicate the same locale ordinal or `dd` overrides and warrant a shared community table.

## D12: Core parses unambiguous non-ISO inputs and refuses inputs with two readings (2026-11-16)

Year-first `'2026/1/5'`, leading epoch-ms numbers in `compare(Date.now(), dt)`, and fixed-ratio duration borrowing (`years(1).minus(months(1))` -> 11 months, `weeks(1).minus(days(1))` -> 6 days) each have a single valid interpretation (+230 B total). Core still refuses `'11/06/2026'` (ambiguous between US and European order), `days(1).minus(hours(1))` (differs by an hour from `.plus(days(1)).minus(hours(1))` across DST), and `compare(CalendarDate, DateTime)` (treating dates as midnight contradicts `isBefore()`, while tying across the day breaks `Array.prototype.sort`).

Reopen: a non-ISO form accepted in core misparses real input, or callers repeatedly hit one of the remaining refusals where an explicit option could disambiguate.

## D13: Unix timestamp properties include their unit (`epochSeconds`, `epochMilliseconds`, `epochNanoseconds`) with no bare `.epoch` (2026-11-17)

Shells, Python, SQL, and JWT `exp`/`iat` claims count Unix time in seconds while `Date.now()` uses milliseconds, so an unqualified `.epoch` or `.timestamp` makes `claims.exp = dt.epoch` silently 1,000x too large. Requiring the unit in the property name gives up short round-tripping with `datetime(ms)` to prevent seconds-vs-milliseconds bugs at API boundaries.

Reopen: migration feedback shows omitting `.epoch` causes widespread friction without preventing real seconds-vs-milliseconds bugs.

## D14: Numeric day of the week is `dayOfWeek` (`1`-`7`) while token `d` keeps Moment's `0`-`6` (2026-11-17)

Naming the `1`-`7` property `.weekday` made `sunday.weekday` return `7` while `sunday.isWeekday()` returned `false`, and collided with custom display names in `configure({ weekdayNames })`. Format token `d` keeps `0` = Sunday through `6` = Saturday to match Moment and Day.js alongside `E` for ISO `1`-`7`.

Reopen: callers hit bugs from `format('d')` returning `0` on Sunday while `.dayOfWeek` and `format('E')` return `7`.

## D15: `Duration` uses `balance()` without a `normalize()` alias, and `total(unit)` instead of `in(unit)` (2026-11-17)

Blind naming reviewers guessed `normalize()` for cascading `90 minutes` into `1 hour 30 minutes` and preferred `hours(36).in('days')` for numeric conversion. Aliasing `normalize` to `balance` was rejected because Luxon's `Duration.prototype.normalize()` leaves `{ minutes: 90 }` unchanged instead of promoting into absent units, and `.in()` returns an object instance everywhere else (`datetime.in(zone)`, `monthDay.in(year)`, `range.in(zone)`).

Reopen: cold-reader studies or user issues show callers repeatedly reaching for `duration.in(unit)` or `duration.normalize()`.

## D16: Ranges accept `.for()` for durations alongside `.to()`, and only `CalendarDate` has `.through()` (2026-11-17)

Cold readers misread `start.to(3, 'days')` as a unit conversion and ranked `start.for(3, 'days')` first (+10 B), which also avoids inclusive-end off-by-one math on `CalendarDate`. `.to()` still accepts durations because restricting `.to()` to endpoints would make `time('9am').to(8, 'hours')` parse `8` as `08:00` and return a 23-hour range, while `.through()` is limited to `CalendarDate` because `DateTimeRange` and `TimeRange` exclude their end.

Reopen: callers pass endpoints to `.for()` expecting runtime rejection, or expect `.through()` on `DateTime` with inclusive end semantics.

## D17: Adjacent unit boundaries use `startOfNext()` and `startOfPrevious()` instead of overloading `next()` and `previous()` (2026-11-19)

Overloading `next('month')` conflicts with `DateTime.prototype.next('friday')`, which preserves the time of day (`09:30`) while a unit boundary resets to `00:00`, and callers split on whether `next('month')` means the 1st of next month or `plus(1, 'month')`. Numeric weekdays are rejected in `startOfNext()` so misplaced counts like `startOfNext(2, 'months')` cannot silently resolve `2` as Tuesday.

Reopen: callers consistently try unit names in `next()` and `previous()`, or expect numeric weekdays in `startOfNext()`.

## D18: `native-dates/helpers/*` stays open for official plugins without semver guarantees (2026-11-20)

Narrowing `"./helpers/*"` to the four files `@native-dates/plugins` currently imports would make internal helpers look like curated public API and force a core version bump whenever a future official plugin needs another helper. Omitting `"types"` on `"./helpers/*"` keeps those modules out of editor autocomplete while lockstep `@native-dates/plugins` releases coordinate internal changes.

Reopen: third-party consumers couple to `native-dates/helpers/*` in production and break on minor releases.

## D19: `isWeekend()` and `isWeekday()` follow the locale like week boundaries do (2026-11-22)

Hardcoding Saturday and Sunday (`dayOfWeek >= 6`, as in Moment, Day.js, and date-fns) misclassifies Friday-Saturday (`ar-SA`, `he-IL`), Friday-only (`fa-IR`), and Sunday-only (`hi-IN`) weekends even when `startOf('week')` already localizes via `Intl.Locale.prototype.getWeekInfo` (`D7`). The tradeoff is that `.locale()` changes boolean weekday predicates rather than display formatting alone, so callers needing fixed ISO Saturday-Sunday checks must test `dayOfWeek >= 6`.

Reopen: bug reports show users surprised when `.locale()` changes `isWeekend()` or `isWeekday()` results, or users request a `configure()` weekend override.

## D20: Loose parsing reads non-ISO dates in the active locale while `monthDay()` and `dayMonth()` keep function-name order (2026-11-22)

Defaulting `dayFirst` to `false` parsed `'06/11/2026'` as June 11 even under `.locale('fr')`, so `{ loose: true }` now takes numeric day-month order, month names, and AM/PM words from `Intl` for the active locale (or the runtime locale when unset) with `dayFirst` left `undefined` unless overridden. `monthDay()` and `dayMonth()` keep numeric order from their function name because applying locale order to `monthDay()` made `'7/9'` and `'7 / 9'` return different dates under `'fr'`.

Reopen: user reports show a locale's `Intl` short date order diverging from how native speakers type dates, or bug reports show unconfigured host locales causing unexpected `{ loose: true }` parses across environments.

## D21: Time zone abbreviations inside `{ loose: true }` strings resolve like the `zone` option rather than `Date.parse()` (2026-11-22)

Leaving inline abbreviations to `Date.parse()` read `'CST'` as fixed `-06:00` everywhere, rejected `'KST'` and `'MSK'`, and interpreted `'EST'` in July as standard `-05:00` while `{ zone: 'EST' }` observed `America/New_York` daylight time with `@native-dates/plugins/zones` loaded. Resolving post-clock abbreviations through `zoneId(name, locale)` aligns inline text with `{ zone }` and `zoneAliases`, fixes the instant without setting `.zone` (`D1`), and yields whenever a numeric offset is written beside it (`'+0800 CST'`).

Reopen: bug reports show users parsing RFC 2822 email or HTTP timestamps expecting fixed standard-time offsets for `'EST'` or `'PST'` while `@native-dates/plugins/zones` is loaded.

## D22: `@native-dates/plugins/zones` maps non-IANA city names and resolves shared abbreviations by locale (2026-11-22)

Requiring callers to map major cities that IANA files under another name (`'Beijing'` -> `Asia/Shanghai`, `'Mumbai'` -> `Asia/Kolkata`) or shared abbreviations (`'CST'`, `'IST'`, `'PST'`, `'BST'`, `'AST'`, `'ACT'`, `'AMT'`, `'San Juan'`) in `zoneAliases` pushed ~0.9 kB Brotli of boilerplate onto every localized app. Resolving shared names against `Intl.Locale.prototype.getTimeZones()` for the active locale's country (falling back to the first listed zone) also required dropping `IST` and `ACT` from the exported `timezones` override map so defaults do not shadow locale lookup unless reassigned explicitly.

Reopen: recurring city issues and PRs turn the alias table into an open-ended gazetteer, or bug reports show locale-driven zone lookup misreading foreign-country abbreviations under a viewer's UI locale.
