# Package Decisions

> Append-only package design log (`D1`..`Dn`). Read [`README.md`](README.md) before adding or reopening an entry (features and bug fixes do not belong here), and run `npm run ai:index` to update [`../decisions.md`](../decisions.md).

## D1: Trailing `Z` and numeric offsets in `datetime()` set the instant, not `.zone` (2026-11-05)

API and database timestamps normally arrive with `Z` (`'2026-03-08T04:30:00Z'`). Adopting `'UTC'` or a fixed offset from the input string (like Moment's `parseZone`) would silently disable DST transitions on later `.plus(1, 'day')` or `.startOf('day')` calls unless the user remembers to call `.in(zone)`.

Reopen: issues show developers passing `Z` or offset strings to `datetime()` expecting `.zone` and `.hour` to stay in `'UTC'` or that fixed offset rather than converting to the active zone.

## D2: `DateTime` serializes to ISO 8601 UTC rather than Temporal's bracketed `[Zone]` string (2026-11-05)

`Temporal.ZonedDateTime.prototype.toString()` appends `-05:00[America/New_York]`, which `Date.parse()`, PostgreSQL `timestamptz`, and standard ISO 8601 parsers reject. `toString()` and `toJSON()` emit standard UTC strings (`...Z`) so `DateTime` values drop directly into JSON payloads and database queries.

Reopen: RFC 9557 bracketed zone strings gain broad database and parser support and users request round-tripping `.zone` through JSON.

## D3: Instances freeze on construction with `text` as an eager own property (2026-11-05)

Defining `text` as an own property displays the human-readable value inline in `console.log()` and DevTools without expanding `(...)` prototype getters. On `Duration`, eager `Intl.DurationFormat` formatting (~14 µs in Node) was accepted over a lazy getter so every class inspects the same way.

Reopen: profiles in `bench/` or performance reports show eager `text` formatting dominating hot arithmetic or `range.every()` loops.

## D4: Plugins attach on subpath import instead of requiring `use()` or `extend()` (2026-11-08)

Explicit registration (`use(plugin)`, built initially and removed) recreates Day.js's load-order bug whenever a module parses a date before startup code runs, and forces TypeScript projects to keep runtime `use()` calls in sync with type imports. Because prototype methods and parser hooks are process-wide anyway, `use()` added ordering hazards without isolating instances.

Reopen: bundler issues show default Vite, Rollup, Webpack, or esbuild setups tree-shaking bare `@native-dates/plugins/*` imports despite `"sideEffects": ["./src/*.js"]`.

## D5: `DateRange` includes its end date while `DateTimeRange` and `TimeRange` are half-open (2026-11-12)

In everyday language, SQL `BETWEEN`, and date pickers, "Monday to Friday" spans five days rather than four, whereas timestamps and clock times need `[start, end)` so adjacent slots (`09:00` to `10:00`, `10:00` to `11:00`) meet at `10:00` without overlap or a 1 ms gap. `TimeRange` also treats `end < start` (`22:00` to `06:00`) as crossing midnight for overnight shifts.

Reopen: user bug reports show frequent off-by-one day errors when converting between inclusive `DateRange` and half-open `DateTimeRange` bounds.

## D6: `.locale()` attaches a locale to instances without affecting equality or JSON (2026-11-14)

Process-wide `configure({ locale })` leaks across concurrent requests in server rendering, so instances carry an optional locale (+320 B Brotli) through chains while keeping `equals()`, `compare()`, `toString()`, and `toJSON()` locale-independent. `.locale()` also accepts POSIX `'en_US'` tags and raw HTTP `Accept-Language` headers directly in core (+130 B) because `.locale()` takes no `{ loose: true }` option.

Reopen: test-runner issues show Vitest or Jest `toEqual()` failing on `.equals()` values across locales because their `.text` own properties differ.

## D7: Default week boundaries follow the locale while `weekOfYear` stays ISO Monday (2026-11-14)

Defaulting `startOf('week')`, `endOf('week')`, `range('week')`, and `weekdayNames()` to Monday gave the wrong calendar week out of the box in Sunday-start (`en-US`, `ja-JP`, `pt-BR`) and Saturday-start (`ar-EG`, `fa-IR`) locales (+70 B Brotli via `Intl.Locale.prototype.getWeekInfo`). `weekOfYear` and the `W` token stay ISO 8601 Monday because numbered business weeks follow an unlocalized standard.

Reopen: issues show users surprised when `startOf('week')` shifts with the host or instance locale while `weekStart` is unset, or users request localized US week-of-year numbering alongside ISO `weekOfYear`.

## D8: Format tokens output ASCII digits and Gregorian years while presets localize the calendar (2026-11-14)

Token strings like `'YYYY-MM-DD'` build URLs, filenames, and wire payloads that break if localized into Arabic-Indic digits (`ar-EG`) or non-Gregorian eras (`fa-IR`, `th-TH`), whereas `Intl` presets (`'short'`, `'long'`) format for human display. `MonthDay` and `YearMonth` likewise stay Gregorian because an ISO month-day falls on different Persian or Islamic dates each year.

Reopen: speakers of non-Gregorian or non-ASCII-numeral locales request an opt-in localized token mode or non-Gregorian partial dates.

## D9: Core has zero runtime dependencies and trims forked `@semantic-ui/utils` helpers to used branches (2026-11-16)

Depending on `@semantic-ui/utils` was tried and reverted because zero install dependencies is table stakes when evaluating a date library. Copying those helpers verbatim saved Semantic UI apps 61 B Brotli while costing standalone bundles 300 B from unreached branches in `each()` and error formatting that minifiers could not eliminate, so `src/helpers/utils.js` keeps only the branches `native-dates` calls.

Reopen: `@semantic-ui/utils` ships tree-shakeable entrypoints with zero dead bytes and Semantic UI bundle savings outweigh zero-dependency installs.

## D10: Error explanations use inline `isDevelopment` checks, and `{ loose: true }` still throws on bad options (2026-11-16)

Error callsites guard `explanation: isDevelopment ? '...' : 0` inline because minifiers cannot dead-code-eliminate diagnostic strings once passed unconditionally into `refuse()`. Under `{ loose: true }`, only unparseable date or time input returns `null`, whereas invalid configuration options (`unknownZone`, `unknownLocale`, `unknownFormat`) still throw so typos in option bags do not fail silently.

Reopen: users request non-throwing validation for dynamic zone or locale strings, or production bundler setups leave `isDevelopment` prose unstripped.

## D11: Custom `weekdayNames`, `ordinals`, and named `formats` live in `configure()` instead of locale plugins (2026-11-16)

`dd` and `Do` are the only Moment and Day.js tokens without a dedicated `Intl` field. A separate `@native-dates/plugins/weekdays` plugin and hardcoded French `1er` rule were removed once `Intl`-derived defaults covered most languages (+220 B for `weekdayNames` and `ordinals`, +70 B for `formats`), avoiding per-language tables in core and a plugin name that implied basic weekday support needed an import.

Reopen: recurring issues or PRs duplicate the same language's `Do` ordinal or `dd` weekday overrides, warranting an opt-in locale pack.

## D12: Core accepts unambiguous non-ISO inputs and refuses inputs with two readings (2026-11-16)

Year-first `'2026/1/5'`, epoch-millisecond numbers in `compare(Date.now(), dt)`, and fixed-ratio duration borrowing (`years(1).minus(months(1))`, `weeks(1).minus(days(1))`) each have only one valid reading (+230 B total). Core refuses `'11/06/2026'` (US vs. European order), `days(1).minus(hours(1))` (23 vs. 25 hours across DST), and `compare(CalendarDate, DateTime)` (midnight coercion contradicts `isBefore()`, while tying across a day breaks `Array.prototype.sort`).

Reopen: an accepted non-ISO form misreads real user input, or recurring issues hit one of the refusals where an explicit option could disambiguate.

## D13: Unix timestamp properties include their unit (`epochSeconds`, `epochMilliseconds`, `epochNanoseconds`) with no bare `.epoch` (2026-11-17)

Shells, Python, SQL, and JWT `exp`/`iat` claims count Unix time in seconds while `Date.now()` uses milliseconds, so a bare `.epoch` or `.timestamp` makes `claims.exp = dt.epoch` silently 1,000x too large. Requiring the unit in the property name trades shorter round-tripping with `datetime(ms)` to prevent seconds-vs-milliseconds bugs at API boundaries.

Reopen: migration feedback or user issues show omitting `.epoch` causing widespread friction.

## D14: Numeric day of the week is `dayOfWeek` (`1`-`7`) while token `d` keeps Moment's `0`-`6` (2026-11-17)

Naming the ISO `1`-`7` property `.weekday` made `sunday.weekday` return `7` alongside `sunday.isWeekday() === false` and collided with display names in `configure({ weekdayNames })`. Format token `d` keeps Moment and Day.js's `0` (Sunday) through `6` (Saturday) for migration compatibility, with `E` providing ISO `1`-`7`.

Reopen: bug reports show developers confusing `format('d')` (`0` on Sunday) with `.dayOfWeek` and `format('E')` (`7` on Sunday).

## D15: `Duration` uses `balance()` without a `normalize()` alias, and `total(unit)` instead of `in(unit)` (2026-11-17)

Blind naming reviews favored `normalize()` for cascading `90 minutes` into `1 hour 30 minutes` and `hours(36).in('days')` for numeric conversion. Both were rejected because Luxon's `Duration.prototype.normalize()` leaves `{ minutes: 90 }` unchanged instead of promoting into unset units, and `.in()` returns an instance everywhere else in the library (`datetime.in(zone)`, `monthDay.in(year)`, `range.in(zone)`).

Reopen: cold-reader studies or user issues show developers repeatedly reaching for `duration.in(unit)` or `duration.normalize()`.

## D16: Ranges accept `.for()` for durations alongside `.to()`, and only `CalendarDate` has `.through()` (2026-11-17)

Cold readers misread `start.to(3, 'days')` as a unit conversion and ranked `start.for(3, 'days')` first (+10 B). `.to()` still accepts durations because restricting `.to()` to endpoints would parse `time('9am').to(8, 'hours')` as `08:00` (a 23-hour overnight range), and `.through()` exists only on `CalendarDate` because `DateTimeRange` and `TimeRange` exclude their end.

Reopen: issues report bugs from `.for()` accepting endpoint values as an alias of `.to()`, or users request inclusive `.through()` on `DateTime`.

## D17: Adjacent unit boundaries use `startOfNext()` and `startOfPrevious()` instead of overloading `next()` and `previous()` (2026-11-19)

Overloading `next('month')` collides with `DateTime.prototype.next('friday')`, which keeps the clock time (`09:30`) whereas a unit boundary resets to `00:00`, and readers split on whether `next('month')` means the 1st of next month or `plus(1, 'month')`. Numeric weekdays (`1`-`7`) are refused in `startOfNext()` so a misplaced count like `startOfNext(2, 'months')` cannot silently resolve `2` as Tuesday.

Reopen: cold-reader studies or user issues show developers reaching for `next('month')` and `previous('month')`, or passing numeric weekdays to `startOfNext()`.

## D18: `native-dates/helpers/*` stays open for official plugins without semver guarantees (2026-11-20)

Listing individual helper subpaths in `package.json` `"exports"` would make internal modules look like curated public API and force a core release whenever `@native-dates/plugins` imports another helper. Leaving `"./helpers/*"` untyped keeps it out of TypeScript autocomplete while lockstep `@native-dates/plugins` versions coordinate internal changes.

Reopen: external packages import `native-dates/helpers/*` directly and report breakage across minor releases.

## D19: `isWeekend()` and `isWeekday()` follow the locale (2026-11-22)

Hardcoding Saturday and Sunday (`dayOfWeek >= 6`, as in Moment, Day.js, and date-fns) misclassifies Friday-Saturday (`ar-SA`, `he-IL`), Friday-only (`fa-IR`), and Sunday-only (`hi-IN`) weekends even though `startOf('week')` already localizes via `Intl.Locale.prototype.getWeekInfo` (`D7`). The tradeoff is that `.locale()` changes boolean weekday predicates (and `DateRange.prototype.count('weekdays')`) rather than display output alone, so fixed ISO Saturday-Sunday checks must test `dayOfWeek >= 6`.

Reopen: issues show users surprised when `.locale()` changes `isWeekend()`, `isWeekday()`, or `count('weekdays')`, or users request a `configure()` weekend override.

## D20: Loose parsing follows the locale while `monthDay()` and `dayMonth()` keep function-name order (2026-11-22)

Defaulting `dayFirst` to `false` parsed `'06/11/2026'` as June 11 even under `.locale('fr')`, so `{ loose: true }` now takes numeric day-month order, month names, and AM/PM words from `Intl` for the active locale (or the host locale when unset) with `dayFirst` acting only as an override. `monthDay()` and `dayMonth()` keep numeric order from their function name because applying locale order to `monthDay()` made `'7/9'` and `'7 / 9'` return different dates under `'fr'`.

Reopen: speakers report a locale's `Intl` short date order diverging from typed input, or unconfigured host locales cause unexpected `{ loose: true }` results across environments.

## D21: Time zone abbreviations inside `{ loose: true }` strings resolve like `{ zone }` rather than `Date.parse()` (2026-11-22)

Leaving inline abbreviations to `Date.parse()` read `'CST'` as fixed `-06:00` everywhere, rejected `'KST'` and `'MSK'`, and treated `'EST'` in July as `-05:00` while `{ zone: 'EST' }` observed `America/New_York` daylight time with `@native-dates/plugins/zones` loaded. Resolving post-clock abbreviations through `zoneId(name, locale)` matches `{ zone }` and `zoneAliases`, sets the instant without changing `.zone` (`D1`), and yields whenever a numeric offset sits beside it (`'+0800 CST'`).

Reopen: users parsing RFC 2822 email or HTTP headers report bugs from `'EST'` or `'PST'` observing daylight time while `@native-dates/plugins/zones` is loaded.

## D22: `@native-dates/plugins/zones` maps non-IANA city names and resolves shared abbreviations by locale (2026-11-22)

Requiring apps to map major cities that IANA files under another name (`'Beijing'` -> `Asia/Shanghai`, `'Mumbai'` -> `Asia/Kolkata`) or shared abbreviations (`'CST'`, `'IST'`, `'PST'`, `'BST'`, `'AST'`, `'ACT'`, `'AMT'`, `'San Juan'`) in `zoneAliases` pushed ~0.9 kB Brotli of boilerplate onto every localized app. Resolving shared names via `Intl.Locale.prototype.getTimeZones()` for the active locale's country (falling back to the first listed zone) also required removing `IST` and `ACT` from the exported `timezones` override map so defaults do not shadow locale lookup unless reassigned explicitly.

Reopen: recurring city issues and PRs turn the alias table into an open-ended gazetteer, or users report locale-driven lookup misreading foreign-country abbreviations.
