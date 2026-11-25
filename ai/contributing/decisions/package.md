# Package Decisions

> Append-only package design log (`D1`..`Dn`). Read [`README.md`](README.md) before adding or reopening an entry (features and bug fixes do not belong here), and run `npm run ai:index` to update [`../decisions.md`](../decisions.md).

## D1: Trailing `Z` and numeric offsets in `datetime()` set the instant, not `.zone` (2026-11-05)

API and database timestamps usually arrive with a trailing `Z` (`'2026-03-08T04:30:00Z'`). If `datetime()` adopted `'UTC'` or a fixed offset from the input string (as Moment's `parseZone` does), later `.plus(1, 'day')` and `.startOf('day')` calls would silently skip daylight-saving rules unless the caller remembered to chain `.in(zone)`.

Reopen: developers report expecting `datetime('...Z')` or offset strings to keep `.zone` and `.hour` in `'UTC'` or that offset rather than converting to the active zone.

## D2: `DateTime` serializes to ISO 8601 UTC rather than Temporal's bracketed `[Zone]` string (2026-11-05)

`Temporal.ZonedDateTime.prototype.toString()` appends `-05:00[America/New_York]`, which `Date.parse()`, PostgreSQL `timestamptz`, and standard ISO 8601 parsers reject. `toString()` and `toJSON()` emit standard UTC strings (`...Z`) so `DateTime` values work directly in JSON payloads and database queries.

Reopen: RFC 9557 bracketed zone strings gain broad parser and database support and users ask to round-trip `.zone` through JSON.

## D3: Instances freeze on construction with `text` as an eager own property (2026-11-05)

Putting `text` on the instance as its first own property shows the human-readable value inline in `console.log()` and DevTools instead of hiding it behind prototype getters. On `Duration`, eager `Intl.DurationFormat` formatting (~14 µs in Node) was accepted over a lazy getter so every class inspects the same way.

Superseded by D23 (2026-11-23).

## D4: Plugins attach on subpath import instead of requiring `use()` or `extend()` (2026-11-08)

Explicit registration (`use(plugin)`, built initially and removed) brings back Day.js's load-order bug whenever a module runs before startup registration, and forces TypeScript projects to keep runtime `use()` calls in sync with type imports. Because prototype methods and parser hooks are process-wide either way, `use()` added ordering bugs without isolating instances.

Reopen: reports show a mainstream bundler tree-shaking bare `@native-dates/plugins/*` imports despite `"sideEffects": ["./src/*.js"]`.

## D5: `DateRange` includes its end date while `DateTimeRange` and `TimeRange` are half-open (2026-11-12)

In plain language, SQL `BETWEEN`, and date pickers, "Monday to Friday" means five days rather than four. Timestamps and clock times use `[start, end)` instead so adjacent slots (`09:00` to `10:00`, `10:00` to `11:00`) share `10:00` with no overlap or 1 ms gap, and `TimeRange` treats `end < start` (`22:00` to `06:00`) as crossing midnight.

Reopen: bug reports show frequent off-by-one errors when converting between inclusive `DateRange` and half-open `DateTimeRange` bounds.

## D6: `.locale()` attaches a locale to instances without affecting equality or JSON (2026-11-14)

Process-wide `configure({ locale })` leaks across concurrent requests in server rendering, so instances carry an optional locale (+320 B Brotli) through chains while keeping `equals()`, `compare()`, `toString()`, and `toJSON()` locale-independent. `.locale()` also accepts POSIX `'en_US'` tags and raw HTTP `Accept-Language` headers in core (+130 B) because it has no `{ loose: true }` mode.

Reopen: users report deep-equality test failures (such as Vitest or Jest `toEqual()`) when comparing `.equals()` instances across locales because their `.text` own properties differ.

## D7: Default week boundaries follow the locale while `weekOfYear` stays ISO Monday (2026-11-14)

Defaulting `startOf('week')`, `endOf('week')`, `range('week')`, and `weekdayNames()` to Monday produced the wrong calendar week out of the box in Sunday-start (`en-US`, `ja-JP`, `pt-BR`) and Saturday-start (`ar-EG`, `fa-IR`) locales (+70 B Brotli via `Intl.Locale.prototype.getWeekInfo`). `weekOfYear` and the `W` token keep ISO 8601 Monday numbering because numbered business weeks follow an unlocalized standard.

Reopen: bug reports show `startOf('week')` shifting unexpectedly across host or instance locales when `weekStart` is unset, or users ask for localized week-of-year numbering alongside ISO `weekOfYear`.

## D8: Format tokens output ASCII digits and Gregorian years while presets localize the calendar (2026-11-14)

Token patterns like `'YYYY-MM-DD'` build URLs, filenames, and API payloads that break if localized into Arabic-Indic digits (`ar-EG`) or non-Gregorian calendars (`fa-IR`, `th-TH`), while `Intl` presets (`'short'`, `'long'`) format for human display. `MonthDay` and `YearMonth` stay Gregorian for the same reason: an ISO month-day lands on different Persian or Islamic dates each year.

Reopen: speakers of non-Gregorian or non-ASCII-numeral locales ask for an opt-in localized token mode or non-Gregorian partial dates.

## D9: Core has zero runtime dependencies and trims forked `@semantic-ui/utils` helpers to used branches (2026-11-16)

Depending on `@semantic-ui/utils` was tried and reverted because many developers filter out date libraries with runtime dependencies. Copying those helpers verbatim saved Semantic UI apps 61 B Brotli while costing standalone bundles 300 B from unused branches in `each()` and error formatting that minifiers could not strip, so `src/helpers/utils.js` keeps only the branches `native-dates` uses.

Reopen: `@semantic-ui/utils` ships tree-shakeable entrypoints with zero dead bytes and Semantic UI bundle savings outweigh zero-dependency installs.

## D10: Error explanations use inline `isDevelopment` checks, and `{ loose: true }` still throws on bad options (2026-11-16)

Error callsites guard `explanation: isDevelopment ? '...' : 0` inline because minifiers cannot strip diagnostic prose once it is passed unconditionally into `refuse()`. Under `{ loose: true }`, only unparseable date or time input returns `null`, while invalid options (`unknownZone`, `unknownLocale`, `unknownFormat`) still throw so typos in option bags do not fail silently.

Reopen: users ask for a non-throwing way to validate untrusted zone or locale strings, or mainstream production builds fail to strip `isDevelopment` prose.

## D11: Custom `weekdayNames`, `ordinals`, and named `formats` live in `configure()` instead of locale plugins (2026-11-16)

`dd` and `Do` are the only Moment and Day.js tokens without a dedicated `Intl` field. A separate `@native-dates/plugins/weekdays` plugin and a hardcoded French `1er` rule were removed once `Intl`-derived defaults covered most languages (+220 B for `weekdayNames` and `ordinals`, +70 B for `formats`). That avoids shipping per-language tables in core and removes a plugin name that implied weekday support needed an extra import.

Reopen: recurring issues or PRs repeat the same language's `Do` ordinal or `dd` overrides, warranting an opt-in locale pack.

## D12: Core accepts unambiguous non-ISO inputs and refuses inputs with two readings (2026-11-16)

Core accepts year-first `'2026/1/5'`, epoch-millisecond numbers in `compare(Date.now(), dt)`, and fixed-ratio duration borrowing such as `years(1).minus(months(1))` because each has only one valid reading (+230 B total). It refuses `'11/06/2026'` because day-month order is ambiguous, `days(1).minus(hours(1))` because a day is 23 or 25 hours across DST, and `compare(CalendarDate, DateTime)` because midnight coercion contradicts `isBefore()` while tying across a day breaks `Array.prototype.sort`.

Reopen: an accepted non-ISO form misreads real user input, or recurring issues hit one of these refusals where an explicit option could disambiguate it.

## D13: Unix timestamp properties include their unit (`epochSeconds`, `epochMilliseconds`, `epochNanoseconds`) with no bare `.epoch` (2026-11-17)

Shells, Python, SQL, and JWT `exp`/`iat` claims count Unix time in seconds while `Date.now()` uses milliseconds, so a bare `.epoch` or `.timestamp` makes `claims.exp = dt.epoch` silently 1,000x too large. Naming the unit on every property gives up a shorter round-trip with `datetime(ms)` to prevent seconds-vs-milliseconds bugs at API boundaries.

Reopen: migration feedback or user issues show omitting `.epoch` causing widespread friction.

## D14: Numeric day of the week is `dayOfWeek` (`1`-`7`) while token `d` keeps Moment's `0`-`6` (2026-11-17)

Naming the ISO `1`-`7` property `.weekday` made `sunday.weekday` return `7` while `sunday.isWeekday()` returned `false`, and collided with display names in `configure({ weekdayNames })`. Format token `d` keeps Moment and Day.js's `0` (Sunday) through `6` (Saturday) for migration compatibility, with `E` covering ISO `1`-`7`.

Reopen: bug reports show developers mixing up `format('d')` (`0` on Sunday) with `.dayOfWeek` and `format('E')` (`7` on Sunday).

## D15: `Duration` uses `balance()` without a `normalize()` alias, and `total(unit)` instead of `in(unit)` (2026-11-17)

Blind naming reviews favored `normalize()` for cascading `90 minutes` into `1 hour 30 minutes` and `hours(36).in('days')` for numeric conversion. Both were rejected because Luxon's `Duration.prototype.normalize()` leaves `{ minutes: 90 }` unchanged instead of promoting into unset units, and `.in()` returns an instance everywhere else (`datetime.in(zone)`, `monthDay.in(year)`, `range.in(zone)`).

Reopen: cold-reader studies or user issues show developers repeatedly reaching for `duration.in(unit)` or `duration.normalize()`.

## D16: Ranges accept `.for()` for durations alongside `.to()`, and only `CalendarDate` has `.through()` (2026-11-17)

Cold readers misread `start.to(3, 'days')` as a unit conversion and ranked `start.for(3, 'days')` first (+10 B). `.to()` still accepts durations because restricting it to endpoints would parse `time('9am').to(8, 'hours')` as `08:00` and produce a 23-hour overnight range, and `.through()` exists only on `CalendarDate` because `DateTimeRange` and `TimeRange` exclude their end.

Superseded by D24 (2026-11-23).

## D17: Adjacent unit boundaries use `startOfNext()` and `startOfPrevious()` instead of overloading `next()` and `previous()` (2026-11-19)

Overloading `next('month')` conflicts with `DateTime.prototype.next('friday')`, which preserves the clock time (`09:30`) while a unit boundary resets to `00:00`, and readers split on whether `next('month')` means the 1st of next month or `plus(1, 'month')`. Numeric weekdays (`1`-`7`) are refused in `startOfNext()` so a misplaced count like `startOfNext(2, 'months')` cannot silently resolve `2` as Tuesday.

Reopen: cold-reader studies or user issues show developers trying unit names in `next()` and `previous()`, or passing numeric weekdays to `startOfNext()`.

## D18: `native-dates/helpers/*` stays open for official plugins without semver guarantees (2026-11-20)

Listing individual helper subpaths in `package.json` `"exports"` would make internal modules look like curated public API and force a core release whenever `@native-dates/plugins` needs another helper. Leaving `"./helpers/*"` untyped keeps it out of TypeScript autocomplete while lockstep `@native-dates/plugins` versions coordinate internal changes.

Reopen: external packages depend on `native-dates/helpers/*` directly and report breakage across minor releases.

## D19: `isWeekend()` and `isWeekday()` follow the locale (2026-11-22)

Hardcoding Saturday and Sunday (`dayOfWeek >= 6`, as in Moment, Day.js, and date-fns) gets weekends wrong in Friday-Saturday (`ar-SA`, `he-IL`), Friday-only (`fa-IR`), and Sunday-only (`hi-IN`) locales even though `startOf('week')` already localizes via `Intl.Locale.prototype.getWeekInfo` (`D7`). The tradeoff is that `.locale()` changes `isWeekend()`, `isWeekday()`, and `DateRange.prototype.count('weekdays')`, so code needing fixed Saturday-Sunday rules has to check `dayOfWeek >= 6`.

Superseded by D27 (2026-11-25).

## D20: Loose parsing follows the locale while `monthDay()` and `dayMonth()` keep function-name order (2026-11-22)

Defaulting `dayFirst` to `false` parsed `'06/11/2026'` as June 11 even under `.locale('fr')`. Instead, `{ loose: true }` reads day-month order, month names, and AM/PM words from `Intl` for the active locale (or the host locale when unset), with `dayFirst` left `undefined` as an explicit override. `monthDay()` and `dayMonth()` keep the order stated in their names because applying locale order to `monthDay()` made `'7/9'` and `'7 / 9'` disagree under `'fr'`.

Reopen: speakers report a locale's `Intl` short date order diverging from typed input, or unconfigured host locales cause inconsistent `{ loose: true }` results across environments.

## D21: Time zone abbreviations inside `{ loose: true }` strings resolve like `{ zone }` rather than `Date.parse()` (2026-11-22)

Leaving inline abbreviations to `Date.parse()` read `'CST'` as fixed `-06:00` everywhere, rejected `'KST'` and `'MSK'`, and treated `'EST'` in July as `-05:00` even when `{ zone: 'EST' }` observed `America/New_York` daylight time under `@native-dates/plugins/zones`. Resolving post-clock abbreviations through `zoneId(name, locale)` keeps inline strings consistent with `{ zone }` and `zoneAliases`, sets the instant without changing `.zone` (`D1`), and yields to an explicit numeric offset written beside it (`'+0800 CST'`).

Reopen: users parsing RFC 2822 email or HTTP headers report bugs from `'EST'` or `'PST'` observing daylight time while `@native-dates/plugins/zones` is loaded.

## D22: `@native-dates/plugins/zones` maps non-IANA city names and resolves shared abbreviations by locale (2026-11-22)

Without built-in aliases, every localized app had to configure its own `zoneAliases` for major cities that IANA files under another name (`'Beijing'` -> `Asia/Shanghai`, `'Mumbai'` -> `Asia/Kolkata`) and for shared abbreviations like `'CST'` and `'IST'`. Shipping those tables adds ~0.9 kB Brotli to the plugin and resolves shared names against `Intl.Locale.prototype.getTimeZones()` for the active locale's country (falling back to the first listed zone). `IST` and `ACT` were also removed from the exported `timezones` defaults so they do not shadow locale lookup unless reassigned explicitly.

Reopen: city requests keep expanding the alias table without a clear boundary, or users report locale-driven lookup misreading foreign-country abbreviations.

## D23: Instances expose `.text` as a lazy prototype getter instead of an eager own property (2026-11-23)

Supersedes D3. Formatting `.text` via `Intl` inside every constructor dominated `CalendarDate`, `DateTime`, and `Duration` construction cost (measured in `bench/`), left `.text` stale after `configure({ locale })`, and caused `toEqual()` to disagree with `.equals()` across instance locales (`D6`). Moving `text` to a prototype getter removes constructor `Intl` work from arithmetic and parsing chains, keeps compact `util.inspect()` output in Node/Bun/Deno, and orders `DateTime` own fields as `month, day, year, hour, minute` first so browser DevTools' five-property preview still distinguishes same-day times.

Reopen: browser developers report collapsed DevTools previews missing timezone or formatted text frequently enough to warrant a cheap non-`Intl` preview property.

## D24: Ranges built with `.for()` accept only explicit durations, while `.to()` keeps both endpoints and durations (2026-11-23)

Supersedes D16. Aliasing `.for()` directly to `.to()` accepted target endpoints (`date('2026-09-01').for('2026-09-07')`) and muddled bare numbers (`time('9am').for(2)` parsed `2` as `02:00` for a 17-hour overnight range, while `dt.for(5_400_000)` read as `1970-01-01`). `.for()` on `CalendarDate`, `DateTime`, and `Time` now requires an explicit duration (`'2h'`, `(2, 'hours')`, `hours(2)`, `{ hours: 2 }`) and refuses endpoints and bare unitless numbers, while `.to()` remains unchanged and `.through()` stays exclusive to `CalendarDate`.

Reopen: callers building ranges from numeric millisecond constants ask for a millisecond shorthand on `.for()` rather than `milliseconds(n)` or `(n, 'ms')`.

## D25: Per-call `locale` decides numeric date order ahead of `configure({ dayFirst })` (2026-11-23)

Passing `{ locale }` on a `{ loose: true }` call declares the format convention of that input, whereas `configure({ dayFirst })` sets a process-wide fallback when neither `dayFirst` nor `locale` is given at the callsite (`{ dayFirst }` > `{ locale }` > `configure({ dayFirst })` > `configure({ locale })`). Letting `configure({ dayFirst: true })` beat `{ locale: 'en-US' }` caused `date('7/9/2026', { loose: true, locale: 'en-US' })` to ignore the locale explicitly passed for that string.

Reopen: server apps passing per-request `Accept-Language` headers alongside `configure({ dayFirst: true })` report wanting the configured `dayFirst` setting to override per-call `locale`.

## D26: Loose parsing returns `null` unless year, month, and day are all written (2026-11-23)

Delegating partial or noisy strings to `Date.parse()` fabricated V8's default year `2001` and day `01` (`'Room 12'` -> `2001-12-01`, `'Nov 16'` -> `2001-11-16`, `'May 2026'` -> `2026-05-01`). Requiring all three date parts in `date()` and `datetime()` under `{ loose: true }` returns `null` instead of invented dates, while partial dates use dedicated factories (`monthDay('Nov 16', { loose: true })`, `yearMonth('May 2026', { loose: true })`).

Reopen: callers report friction from human-typed current-year dates like `'Nov 16'` returning `null`.

## D27: `isWeekend()` and `isWeekday()` follow the locale by default, with `configure({ weekend })` overriding `.locale()` (2026-11-25)

Supersedes D19. `isWeekend()`, `isWeekday()`, and `DateRange.prototype.count('weekdays')` still follow the active locale by default via `Intl.Locale.prototype.getWeekInfo`, while `configure({ weekend })` sets a process-wide override ahead of per-instance `.locale()`, `configure({ locale })`, and the host locale. Letting per-instance `.locale()` beat `configure({ weekend })` (as per-call `{ locale }` beats `configure({ dayFirst })` in `D25`) was rejected because `.locale()` on instances is typically attached from a viewer's `Accept-Language` header for display formatting (`D6`), whereas `configure({ weekend })` mirrors `configure({ weekStart })` so business-day rules stay pinned when explicitly configured (pass `configure({ weekend: null })` to revert).

Reopen: apps serving multiple regions with different business workweeks in one process ask for a per-call or per-instance weekend override.
