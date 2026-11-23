---
name: native-dates
description: "Core guide for building with native-dates (and @native-dates/core). Use whenever code creates, parses, shifts, rounds, compares, ranges over, or formats dates, clock times, zoned timestamps, durations, billing months, or recurring month-days, handles DST or HTTP Accept-Language locales, or migrates off Date, Moment, Day.js, date-fns, Luxon, or raw Temporal. For city/abbreviation zones, { loose: true } parsing, legacy Date getters, or the Temporal polyfill on Safari and Node <26, also load native-dates-plugins."
metadata:
  title: Dates, Times, Zones, Durations, and Ranges with native-dates
  keywords: "native-dates, @native-dates/core, datetime, date, time, duration, monthDay, yearMonth, dateRange, datetimeRange, timeRange, today, now, dayOfWeek, epochSeconds, epochMilliseconds, configure, Accept-Language, Temporal, Intl, DST"
  audience: usage
  type: skill
---

# Dates, Times, Zones, Durations, and Ranges with native-dates

> **Skill:** `native-dates`
> **Purpose:** Core mental model, pitfalls, and API reference for `native-dates` (`@native-dates/core`)

`native-dates` (`@native-dates/core` is the identical scoped package) wraps `Temporal` and `Intl` with 9 immutable, `Object.freeze`d classes and zero runtime dependencies. Chrome, Firefox, Edge, and Node `>=26` run it natively; load `native-dates-plugins` when targeting Safari or Node `<26` (`@native-dates/polyfill`), parsing `'11/16/2026'` or localized/informal strings (`{ loose: true }`), resolving `'PST'`/`'Beijing'`/`'Berlin'` zones, or shimming `Date` getters.

**Golden rule: Match the class to the data (`datetime` for zoned instants, `date` for calendar days, `time` for clocks), chain immutable methods, and pass explicit IANA zones and per-value `.locale()` in server code.**

---

## What You'd Get Wrong

**1. Trailing `Z` and numeric offsets (`-05:00`) fix the instant, not `.zone`.** Database and JSON timestamps arrive with `Z`; adopting `'UTC'` as `.zone` would disable daylight-saving rules on `.plus(1, 'day')` or `.startOf('day')`. `.zone` resolves from the explicit `zone` argument -> bracketed `[Zone]` suffix -> `configure({ zone })` -> system zone, while `toString()` and `toJSON()` always emit UTC `...Z` (core has no `.toISOString()` or `.toISO()`).

```js
// ❌ WRONG - assuming 'Z' sets .zone to 'UTC', or calling .toISOString()
const dt = datetime('2026-03-08T04:30:00Z');
dt.zone; // local or configured zone (NOT 'UTC')

// ✅ RIGHT - pass 'UTC' for UTC wall fields, or pass the user's IANA zone for DST-safe calendar math
const utc = datetime('2026-03-08T04:30:00Z', 'UTC');
const ny = datetime('2026-03-08T04:30:00Z', 'America/New_York').plus(1, 'day'); // crosses spring-forward at local 23:30
ny.toJSON(); // '2026-03-09T03:30:00.000Z'
```

**2. `month` is `1`–`12`, `dayOfWeek` is ISO `1`–`7` (`7` = Sunday), `isWeekend()`/`isWeekday()` follow the active locale, and tokens use Moment/Day.js casing (`YYYY-MM-DD`, never `yyyy-MM-dd`).** `isWeekend()` is Friday–Saturday in `ar-SA`/`ar-EG`/`he-IL`, Friday in `fa-IR`, Sunday in `hi-IN`, and Saturday–Sunday in `en-US` and most others. In `format()`, `'yyyy'` throws `unknownFormat` (whereas a valid token missing on the noun, like `'HH'` on a `CalendarDate`, throws `unsupportedToken`), lowercase `'dd'` prints the 2-letter weekday (`'Mo'`, not day-of-month `'DD'`), `'E'` prints `'1'`–`'7'`, `'d'` prints Moment's `'0'`–`'6'` (`'0'` = Sunday), and tokens glued to accented letters (`'às'`) or `h` after `H` (`'HHhmm'`) throw `unknownFormat` unless bracketed.

```js
// ❌ WRONG - 0-indexed month/Sunday, or date-fns/Luxon 'yyyy-MM-dd' tokens
date(2026, 0, 15); // RangeError [invalidDate]
date('2026-11-16').format('yyyy-MM-dd'); // RangeError [unknownFormat] ('YYYY' is year; 'dd' is narrow weekday 'Mo'!)

// ✅ RIGHT - 1..12 months, 1..7 ISO weekdays, 'YYYY-MM-DD' tokens
const sun = date(2026, 11, 15);
sun.dayOfWeek; // 7 (Sunday)
sun.format('YYYY-MM-DD (E / d)'); // '2026-11-15 (7 / 0)'
```

**3. Unix timestamps name their unit explicitly.** Neither `.epoch`, `.timestamp`, nor `.unix()` exists.

```js
// ❌ WRONG - undefined!
const exp = now().epoch;

// ✅ RIGHT - epochSeconds (Number, floored), epochMilliseconds (Number), or epochNanoseconds (BigInt)
const jwtExp = now().plus(15, 'minutes').epochSeconds;
const ms = now().epochMilliseconds;
```

**4. `next()` / `previous()` step strictly to future/past weekdays or `MonthDay`s at the same clock time; `startOfNext()` / `startOfPrevious()` step to unit boundaries at `00:00`.** Calling `next('friday')` on a Friday advances `+7` days (`previous('friday')` steps `-7` days). Passing a unit like `'month'` to `next()` throws `unknownDayOfWeek`, and passing a count like `2` to `startOfNext()` throws `unknownUnit`.

```js
// ❌ WRONG - passing a calendar unit to next()
datetime('2026-11-16T09:30', 'UTC').next('month'); // RangeError [unknownDayOfWeek]

// ✅ RIGHT - next('friday') keeps 09:30; startOfNext('month') lands on Dec 1 00:00
datetime('2026-11-16T09:30', 'UTC').next('friday'); // 2026-11-20T09:30:00.000Z
datetime('2026-11-16T09:30', 'UTC').startOfNext('month'); // 2026-12-01T00:00:00.000Z
```

**5. `DateRange` is closed `[start, end]`; `DateTimeRange` and `TimeRange` are half-open `[start, end)`.** `checkIn.for(3, 'days')` subtracts 1 day from `end` (`'2026-09-01/2026-09-03'` = 3 days). For database `< end` queries, use `dt.range('month')` (`[Nov 1 00:00, Dec 1 00:00)`) rather than `dt.endOf('month')` (inclusive `.999Z`). `TimeRange` wraps midnight when `end < start`, whereas `Time.until()` stays signed within one `00:00`–`23:59` day.

```js
// ❌ WRONG - manual +3 days spans 4 inclusive dates; endOf('month') misses sub-ms rows between .999Z and Dec 1
const fourDays = date('2026-09-01').to(date('2026-09-01').plus(3, 'days')); // 4 days!

// ✅ RIGHT - .for(3, 'days') for inclusive dates; .range('month') for half-open [start, end) query bounds
const stay = date('2026-09-01').for(3, 'days'); // '2026-09-01/2026-09-03' (3 days)
const { start, end } = now('UTC').range('month'); // WHERE created_at >= start AND created_at < end
const nightShift = time('22:00').to('06:00'); // wraps midnight (duration: 8 hours)
```

**6. `Duration` keeps written fields until `.balance()`, totals via `.total(unit)` / `.as(unit)` (never `.in()`), and refuses `days(1).minus(hours(1))`.** There is no `.normalize()`. Mixing opposing signs across calendar days and clock hours throws `conflictingSigns`, and unanchored `months`/`years` throw `missingAnchor` in `.total()` or `compare()` unless anchored via `a.until(b)`.

```js
// ❌ WRONG - .normalize(), .in('days'), or days(1).minus(hours(1))
minutes(90).normalize(); // TypeError
days(1).minus(hours(1)); // RangeError [conflictingSigns]

// ✅ RIGHT - .balance(), .total(unit), chain mixed units on DateTime, and anchor calendar spans via .until()
minutes(90).balance(); // Duration(PT1H30M) -> hours: 1, minutes: 30
hours(36).total('days'); // 1.5
dt.plus(1, 'day').minus(1, 'hour'); // DST-accurate chaining
date('2026-01-15').until('2026-04-15', 'days'); // 90
```

**7. `.locale(tag)` natively parses HTTP `Accept-Language` headers and sets default `weekStart`, while `0`-arg `.locale()` is a getter.** Calling `x.locale()` with **zero arguments** returns `string | readonly string[] | undefined`; calling `x.locale(header)` with **one argument** always returns a new instance (even when `header` is `undefined` or `'*'`), sorting `;q=` weights, dropping `*` and `q=0`, and converting `'en_US'` to `'en-US'`. Pass `'monday'` to `startOf('week', 'monday')` when week keys must not shift by locale (`weekOfYear` is always ISO Monday).

```js
// ❌ WRONG - calling 0-arg .locale() expecting a clone, mutating global configure() per request, or unpinned week buckets
configure({ locale: req.headers['accept-language'] }); // leaks across concurrent requests!

// ✅ RIGHT - 1-arg .locale(header) is safe even if header is undefined or 'fr-CH, fr;q=0.9, *;q=0.5'
const local = datetime(row.at, user.zone).locale(req.headers['accept-language']);
const isoWeekKey = local.date.startOf('week', 'monday').toString();
```

**8. `<`, `>`, and `-` work only on `DateTime` and fixed `Duration`; non-instant nouns throw `unsupportedComparison`, there is no `.isValid()`, and production builds strip `err.message` prose.** Compare `CalendarDate`, `Time`, `YearMonth`, and ranges with `.isBefore()`, `.isAfter()`, `.equals()`, or `compare(a, b)` (`compare(date, datetime)` throws `conflictingKinds`), and catch errors by `err.code` and `err.at`.

```js
// ❌ WRONG - relational operators on CalendarDate/Time, or matching error message text
if (date('2026-01-01') < date('2026-02-01')) {} // RangeError [unsupportedComparison]

// ✅ RIGHT - .isBefore() / compare(), and structured err.code checks
const earlier = date('2026-01-01').isBefore('2026-02-01'); // true
try {
  datetime(input, untrustedZone);
} catch (err) {
  if (err?.code === 'unknownZone') { /* handle bad zone at err.at */ }
}
```

---

## Choosing the Right Noun

All 9 classes, factories, type guards (`isDateTime`, `isCalendarDate`, ...), `Symbol.for` brand keys (`IS_DATE_TIME`, ...), `monthNames`, `weekdayNames`, `dayOfWeek`, `compare`, `earliest`, `latest`, `kindOf`, and `configure` are named runtime and TypeScript exports from `'native-dates'` (`weekStart` is an instance getter and `configure` option, not a standalone function).

| Class | Factories | Represents | Key rule |
|---|---|---|---|
| `DateTime` | `datetime(input, zoneOrOpts?)`, `now(zone?)`, `startOfToday(zone?)`, `endOfToday(zone?)` | Exact instant + IANA zone (`Temporal.ZonedDateTime`) | `<` / `valueOf()` return `epochMilliseconds`; 0-arg `datetime()` throws `missingDateTime` |
| `CalendarDate` | `date(input, zoneOrOpts?)`, `date(y, m, d)`, `today(zone?)`, `tomorrow(zone?)`, `yesterday(zone?)` | Calendar day (`Temporal.PlainDate`) | Refuses clock units (`unsupportedUnit`); two-arg `date(2026, 11)` throws `missingDay` |
| `Time` | `time(input, zoneOrOpts?)`, `time(h, m, s?)` | Wall-clock time (`Temporal.PlainTime`) | Wraps modulo 24h on `plus`/`minus`; `time(9)` -> `09:00` |
| `Duration` | `duration(input, unitOrOpts?)`, `years(n)`..`milliseconds(n)` | Span of units (`Temporal.Duration`) | 8 unit helpers (`years`..`milliseconds`); use `duration(n, 'microseconds' \| 'nanoseconds')` for sub-ms |
| `MonthDay` | `monthDay(input, zoneOrOpts?)`, `monthDay(m, d)`, `dayMonth(input, zoneOrOpts?)`, `dayMonth(d, m)` | Recurring month + day (`Temporal.PlainMonthDay`) | No linear order (`equals()`, `fallsOn()`); Feb 29 falls on Feb 28 in non-leap years |
| `YearMonth` | `yearMonth(input, zoneOrOpts?)`, `monthYear(input, zoneOrOpts?)`, `yearMonth(y, m)`, `monthYear(m, y)` | Billing/calendar month (`Temporal.PlainYearMonth`) | Only `years`, `quarters`, `months` math; `monthYear('11/26')` adds `YearMonth.century` (`2000`) |
| `DateRange`, `DateTimeRange`, `TimeRange` | `dateRange(s, e?, zoneOrOpts?)`, `datetimeRange(...)`, `timeRange(...)`, `pt.to(end)`, `pt.for(n, u)`, `pt.range(u)` | Interval between two points | `DateRange` is `[start, end]` (`date.through(end)`); `DateTimeRange` & `TimeRange` are `[start, end)` |

### Cross-Noun Invariants

- **Unit spellings:** Every `unit` argument accepts singular, plural, or shorthand (`'y'`/`'yr'`, `'q'`/`'qtr'`, `'M'`/`'mo'` for month vs lowercase `'m'`/`'min'` for minute, `'w'`/`'wk'`, `'d'`, `'h'`/`'hr'`, `'s'`/`'sec'`, `'ms'`, `'us'`/`'µs'`, `'ns'`).
- **Options (`zoneOrOpts`):** Point and range factories accept either a bare `zone` string (`'+05:30'`, `'UTC'`, `'America/New_York'`) or `{ zone, locale, disambiguation, loose, dayFirst }` (`duration` accepts a unit string or `{ locale, loose }`; `loose` and `dayFirst` require `@native-dates/plugins/loose`).
- **Serialization & state:** Every noun implements `toString()` & `toJSON()` (canonical ISO wire string: `'start/end'` on ranges, `.sssZ` on `DateTime` expanding to 6/9 digits when µs/ns are nonzero), `.text` (default human format), `String(x)` / `` `${x}` `` (`toString()`), and `.locale()` / `.locale(tag)` (propagated across `.plus()`, `.date`, `.time`, `.in()`, `.to()`). All 6 non-range nouns implement `toTemporal()` (ranges expose `start.toTemporal()` and `end.toTemporal()`).
- **Input coercion:** Binary and composition methods (`equals`, `isBefore`, `isAfter`, `isSame`, `until`, `since`, `from`, `to`, `on`, `at`, `contains`) accept an instance or any valid factory input for that noun (unzoned inputs on `DateTime` methods resolve in `this.zone`).
- **Overflow & DST disambiguation:** Explicit out-of-range fields (`{ month: 2, day: 30 }`) throw `invalid*`, whereas month/year steps (`Jan 31 + 1 month`) and `set` on other fields clamp existing days to month-end (`Feb 28`). Zoned wall-clock construction and `.at()` / `.on()` default to `Temporal`'s `'compatible'` rule (spring-forward gaps push forward; fall-back folds pick the earlier offset) and accept `{ disambiguation: 'compatible' | 'earlier' | 'later' | 'reject' }` (`'reject'` throws `invalidDateTime` on nonexistent or ambiguous local times).
- **Type conversions:** Cross between nouns via `.date`, `.time`, `.monthDay`, `.yearMonth`, `date.at(time = '00:00', zoneOrOpts?)` (`d.at(undefined, zone)` for midnight in `zone`), `time.on(date, zoneOrOpts?)`, `monthDay.in(year)`, `yearMonth.on(day)` (`yearMonth.start` / `.end`), `range.in(zone)`, or `.as('date' | 'time' | 'datetime' | 'monthDay' | 'yearMonth' | 'duration')`.

---

## DateTime

```js
import { DateTime, datetime, endOfToday, now, startOfToday } from 'native-dates';

const dt = datetime('2026-11-16T09:30', 'America/Los_Angeles');
const slot = dt.plus(2, 'days').at('14:17').round(15, 'minutes').in('Europe/Berlin');
```

- **Inputs:** ISO strings (`'2026-11-16'`, `'2026-11-16T09:30'`, `'2026-11-16T17:30Z'`, `'2026-11-16T09:30-08:00[America/Los_Angeles]'`), year-first strings with any non-Latin, non-colon separator (`'2026/11/16 9:30'`, `'2026年11月16日 14:30'`), epoch ms (`Number`, truncated if fractional), `Date`, `{ year, month, day, hour, ... }`, `CalendarDate`, `DateTime`, or `Temporal.{ZonedDateTime,Instant,PlainDateTime,PlainDate}` (non-ISO calendars convert to the same ISO day). `null`/`undefined` throws `missingDateTime` (use `now(zone?)`).
- **Fields & getters:** `text`, `year`, `month` (`1`–`12`), `day` (`1`–`31`), `dayOfWeek` (`1`–`7`), `hour` (`0`–`23`), `minute`, `second`, `millisecond`, `microsecond`, `nanosecond`, `zone` (IANA ID), `offset` (`'-08:00'`), `epochSeconds` (floored `Number`), `epochMilliseconds` (`Number`), `epochNanoseconds` (`BigInt`), `weekStart`, `quarter` (`1`–`4`), `dayOfYear`, `weekOfYear` (ISO), `daysInMonth`, `daysInYear`, `hoursInDay` (`23`/`24`/`25` across DST), `date`, `time`, `monthDay`, `yearMonth`.
- **Predicates:** `isLeapYear()`, `isWeekday()`, `isWeekend()`, `isPast()`, `isFuture()`, `isToday()`, `isTomorrow()`, `isYesterday()`.
- **Arithmetic & boundaries:**
  - `plus(n, unit)` / `add`, `minus(n, unit)` / `subtract` (also `'1h 30m'`, `{ days: 2 }`, or `Duration`), `set(field, value)` / `set({ year, month })`, `at(time)` (wall clock in `this.zone`), `in(zone)` (same instant in new zone).
  - `startOf(unit, firstDay?)`, `endOf(unit, firstDay?)` (steps back `1` ms to `.999` for `'year'`..`'millisecond'`, or `1` ns for `'microsecond'`/`'nanosecond'`), `startOfNext(unitOrWeekday, firstDay?)`, `startOfPrevious(unitOrWeekday, firstDay?)`, `next(weekdayOrMonthDay)`, `previous(weekdayOrMonthDay)`.
  - `round(unit)` or `round(increment, unit)` (same for `floor` and `ceil`, e.g. `dt.round('hour')` or `dt.round(15, 'minutes')` — pass two arguments for increments > 1, never `'15m'`).
- **Comparisons & measurement:**
  - `equals(other)`, `isBefore(other)`, `isAfter(other)`, `isSame(other, unit?, firstDay?)`.
  - `until(other, unit?)` / `since(other, unit?)`: without `unit`, returns an anchored `Duration` (`largestUnit: 'day'`); with `unit`, returns an **exact floating-point `Number`** (e.g. `1.5`, not truncated).
  - `from(other?, locale?)` / `formatRelative` (`this` relative to `other`: `"in 2 days"` when `this > other`, `"2 days ago"` when `this < other`), `fromNow(locale?)`, `to(endOrDuration, unit?)` / `for`, `range(unit, firstDay?)`, `toJSDate()`.

---

## CalendarDate

```js
import { CalendarDate, date, today, tomorrow, yesterday } from 'native-dates';

const due = today('America/New_York').plus(2, 'weeks').next('friday');
```

- **Inputs:** Year-first strings with any non-Latin, non-colon separator (`'2026-11-16'`, `'2026/11/16'`, `'2026. 11. 16.'`, `'2026年11月16日'`, `'2026년 11월 16일'`), `(year, month, day)` integers, `{ year, month, day }`, `DateTime`, `Date`, instant strings (resolved in `zone`), or `Temporal.PlainDate` (any calendar). Single bare numbers throw `invalidDate` (use `datetime(ms).date` or `date(y, m, d)`).
- **Clock guard & methods:** Refuses clock units (`hours`, `minutes`, ...) with `unsupportedUnit`. Shares `DateTime`'s calendar getters, `plus`/`minus`, `set`, `startOf`/`endOf`, `startOfNext`/`startOfPrevious`, `next`/`previous`, `isSame`, `until`/`since` (`Duration` in days, or float `Number` when `unit` is passed), `from(other?, locale?)` / `fromNow(locale?)` (on servers, pass explicit `d.from(today(user.zone), locale)` since `fromNow` reads default `today()`), `.through(end)` (alias for `.to(end)`), `.at(time = '00:00', zone?)` -> `DateTime`, and `.every(step, unit?, zone?)` / `.split(step, unit?, zone?)` / `.splitBy` across that date's zoned day.

---

## Time

```js
import { Time, time } from 'native-dates';

const scheduled = time('9:30am').plus(45, 'minutes').round(15, 'minutes').on('2026-11-16', 'America/Chicago');
```

- **Inputs:** `'09:30'`, `'14h30'`, `'14 h 30'`, `'9am'`, `'5:30:15 pm'`, `time(9, 30, 0)`, `time(9)` (`09:00`), `{ hour, minute }`, `DateTime`, `Date`, instant strings (resolved in `zone`), or `Temporal.PlainTime`. Bare `'14h'` throws (stays a duration).
- **Methods:** `plus`/`minus` and `set` (wrap modulo 24h), `startOf`/`endOf`, `startOfNext(unit)` / `startOfPrevious(unit)` (clock units only), `round(unit)` / `round(inc, unit)` (and `floor`/`ceil`), `equals`/`isBefore`/`isAfter`/`isSame`, `until(other, unit?)` / `since(other, unit?)` (within one `00:00`–`23:59` day, `largestUnit: 'hour'`), `to(end, unit?)` / `for`, `on(day, zone?)` -> `DateTime`.

---

## Duration

```js
import { Duration, days, duration, hours, minutes } from 'native-dates';

const span = duration('2h 45m').plus(30, 'minutes').balance(); // 3 hours, 15 minutes
span.total('hours'); // 3.25
```

- **Inputs:** ISO 8601 (`'PT1H30M'`, `'-P2D'`), natural phrases (`'1h 30m'`, `'2 weeks, 3 days'`, `'90 mins'`, `'1.5 hours'` -> spills fractional units to ns), `(count, unit)`, `{ hours: 1, minutes: 30 }`, or `Temporal.Duration`.
- **Fields:** `text` (`'long'` preset), `years`, `months`, `weeks`, `days`, `hours`, `minutes`, `seconds`, `milliseconds`, `microseconds`, `nanoseconds`, `sign` (`-1 | 0 | 1`), `anchor`, `isZero()`, `isNegative()`, `toFields()`.
- **Transforms & totals:** `plus`/`add`, `minus`/`subtract` (borrows signs across fixed ratios `1y = 12mo` and `1w = 7d`), `times(factor)`, `negated()`, `abs()`, `balance(largestUnit?)`, `round(smallestUnit)` (single unit string), `total(unit)` / `as(unit)` (float `Number`), `toMilliseconds()` / `valueOf()`, `compare(other)`, `equals(other)`, `format(style = 'long', locale?)` (`style` in `'long' | 'short' | 'narrow' | 'digital'`; other specs throw `unknownFormat`).

---

## MonthDay and YearMonth

```js
import { MonthDay, YearMonth, dayMonth, monthDay, monthYear, yearMonth } from 'native-dates';

const leapBday = monthDay('02-29');
leapBday.fallsOn('2026-02-28'); // true (equals('2026-02-28') is false)
leapBday.next('2026-02-28'); // CalendarDate(2027-02-28) — strictly after reference date

const cardExpiry = monthYear('11/26'); // YearMonth(2026-11)
cardExpiry.format('MM/YY'); // '11/26' ('short' preset prints '11/2026')
```

- **`MonthDay`:** `month` (`1`–`12`), `day` (`1`–`31`), `in(year)` -> `CalendarDate` (Feb 29 -> Feb 28 in non-leap years), `next(fromDay?)` / `after(day)`, `previous(fromDay?)` / `last(fromDay?)` / `before(day)`, `fallsOn(day)` / `isOn(day)` vs exact `equals()` (which rejects slash/dot strings as order-ambiguous), `isToday(zone?)`, `isTomorrow(zone?)`, `isYesterday(zone?)`. Two-digit `'MM-DD'` with a hyphen always parses month-first even in `dayMonth('10-17')`.
- **`YearMonth`:** Accepts year-first strings with any non-Latin, non-colon separator (`'2026-11'`, `'2026/11'`, `'2026年11月'`, `'2026. 11.'`), `(year, month)` numbers, `{ year, month }`, or date/timestamp inputs (`monthYear('11/26')` reads month-first). Exposes `year`, `month`, `quarter`, `daysInMonth`, `daysInYear`, `isLeapYear()`, `start`, `end`, `on(day)` -> `CalendarDate`, `plus`/`minus` (`years`, `quarters`, `months` only), `set`, `contains(day)` / `includes(day)`, `equals`/`isBefore`/`isAfter`/`compare`, `isPast(zone?)`/`isFuture(zone?)`, `until(other, unit?)`/`since(other, unit?)` (`largestUnit: 'year'`).

---

## DateRange, DateTimeRange, and TimeRange

```js
import { DateRange, DateTimeRange, TimeRange, date, dateRange, datetimeRange, timeRange } from 'native-dates';

const sprint = date('2026-11-02').for(2, 'weeks'); // '2026-11-02/2026-11-15'
const weeks = sprint.split(1, 'week'); // [DateRange('2026-11-02/2026-11-08'), DateRange('2026-11-09/2026-11-15')]
```

- **Construction:** `point.to(end)`, `point.for(amount, unit)` / `point.for(duration)`, `date.through(end)`, `point.range(unit, firstDay?)`, or `dateRange` / `datetimeRange` / `timeRange` with `(start, end, zoneOrOpts?)` or one interval string (`'2026-09-01/2026-09-07'`, `'2026-09-01 to 2026-09-07'`, `'09:00-17:00'`).
- **Properties, formatting & set ops:** `text`, `kind` (`'date' | 'datetime' | 'time'`), `start`, `end`, `duration` (`Duration`), `isEmpty()` (`false` on `DateRange`; `start.equals(end)` on `DateTimeRange`/`TimeRange`), `contains(pointOrRange)` / `includes`, `overlaps(otherRange)`, `intersection(otherRange)` (range or `null`; throws `unsupportedIntersection` if two overnight `TimeRange`s overlap twice), `equals(other)`, `format(spec?, locale?)` (`Intl` range formatting on presets/options; `'start – end'` on token patterns), `toString()` / `toJSON()` (`'start/end'`).
- **Iteration, counting & zone lift:** `every(step, unit?)` returns an `Array` of points (`step` > 0: `'day'`, `'30m'`, `(15, 'minutes')`), `DateRange.count(kind = 'days')` counts `'days'`, `'weekdays'`, `'weekends'`, or a weekday name (`'mondays'`) in O(1), `split(step, unit?)` / `splitBy` returns an `Array` of sub-ranges (clipping any uneven remainder at `end`), and `in(zone)` lifts inclusive `DateRange` `[start, end]` to half-open `DateTimeRange` `[start 00:00, (end + 1d) 00:00)` in `zone` (`unsupportedZone` on `TimeRange`).

---

## format, monthNames, and weekdayNames

Point, partial, and range `.format(spec?, locale?)` accepts four `spec` forms (`Duration.format` accepts `'long' | 'short' | 'narrow' | 'digital'` only):

1. **Built-in presets:** `'short'`, `'medium'` (default, except `'short'` on `Time`), `'long'`, `'full'`, `'date'`, `'time'`, `'month'`, `'text'`, plus Moment/Day.js localized `'LT'`, `'LTS'`, `'L'`, `'l'`, `'LL'`, `'ll'`, `'LLL'`, `'lll'`, `'LLLL'`, `'llll'`.
2. **Custom named formats** via `configure({ formats: { invoice: 'YYYY-MM-DD' } })` (checked before built-in presets; `.text` and bare `.format()` keep built-in defaults).
3. **`Intl.DateTimeFormat` options** (`{ month: 'short', day: 'numeric', weekday: 'short' }`), automatically stripping fields absent on the noun.
4. **Token patterns** (escape literal words in `[brackets]`, bare `'T'` allowed; digits and years stay Western ASCII/Gregorian):

| Tokens | Output |
|---|---|
| `YYYY`, `YY`, `Q` | 4-digit year, 2-digit year, quarter (`1`–`4`) |
| `M`, `MM`, `MMM`, `MMMM` | Month `1`–`12`, padded `01`–`12`, localized short/long name (inflected after day tokens) |
| `D`, `DD`, `Do`, `DDD`, `DDDD` | Day of month, padded, ordinal (`'16th'`, `'6.'`, `'6日'`), day of year, 3-digit day of year |
| `E`, `d`, `dd`, `ddd`, `dddd` | ISO weekday `1`–`7` (`7` = Sun), Moment weekday `0`–`6` (`0` = Sun), narrow (`'Mo'`), short, long |
| `W`, `WW` | ISO week of year (`1`–`53`), padded |
| `H`, `HH`, `h`, `hh`, `a`, `A` | 24h hour, 12h hour (`1`–`12`), localized am/pm |
| `m`, `mm`, `s`, `ss`, `S`, `SS`, `SSS` | Minute, second, fractional digits (`1`–`3`) |
| `Z`, `ZZ`, `z`/`zz`, `zzz`/`zzzz` | Offset `'-08:00'`, `'-0800'`, localized short/long zone name |
| `X`, `x`, `[text]` | Epoch seconds, epoch milliseconds, escaped literal text |

- `monthNames(style = 'long' | 'short', locale?)`: 12 Gregorian month names (`0` = Jan..`11` = Dec).
- `weekdayNames(style = 'short' | 'long' | 'narrow', firstDay?, locale?)`: 7 weekday names starting on `firstDay` / `weekStart` / locale's first day (`locale` is the **3rd** argument).

---

## configure, compare, and Guards

```js
import { compare, configure, dayOfWeek, earliest, isDateTime, kindOf, latest } from 'native-dates';

configure({
  zone: 'America/New_York', // null resets to system zone
  locale: 'en-US', // null resets to system locale
  weekStart: 'monday', // 1..7 or weekday name (null resets to locale-driven)
  formats: { sql: 'YYYY-MM-DD HH:mm:ss' }, // null clears
  weekdayNames: { lv: { narrow: { fri: 'Pk', sun: 'Sv' } } }, // width in [narrow, short, long]
  ordinals: { fr: (day) => (day === 1 ? '1er' : day) },
});
```

- **`compare(a, b)` / `earliest(...items)` / `latest(...items)`:** Sorts `DateTime`, `CalendarDate`, `Time`, `YearMonth`, `Duration` (in `compare`), or same-kind ranges (rest args or single array in `earliest`/`latest`; there is no `min`/`max`). A bare `Number` first (`compare(Date.now(), dt)`) is epoch ms; a bare `Number` after a `Time` (`compare(time('09:00'), 9)`) is an hour.
- **`dayOfWeek(input)`:** Maps `'monday'`..`'sunday'`, `'mon'`..`'sun'`, `1`–`7`, or `0` (`7`) to ISO `1`–`7`.
- **Cross-realm guards:** `kindOf(x)` returns `'datetime' | 'date' | 'time' | 'duration' | 'monthDay' | 'yearMonth' | 'dateRange' | 'datetimeRange' | 'timeRange' | undefined`. `isDateTime`, `isCalendarDate`, `isTime`, `isDuration`, `isMonthDay`, `isYearMonth`, `isDateRange`, `isDateTimeRange`, `isTimeRange` and `instanceof` use `Symbol.for` brands across realms and duplicate bundles.

---

## Errors

Nullish factory inputs (`missingDateTime`, `missingDate`, `missingTime`, `missingMonthDay`, `missingYearMonth`), wrong JS argument types (`invalidPoint`, bare numbers on `date()`, or non-string/object inputs), `unsupportedCalendar`, `conflictingKinds`, and `conflictingRanges` throw `TypeError`; malformed strings, out-of-range fields, `cannot*`, `unknown*`, `conflictingSigns`, and other `unsupported*` refusals throw `RangeError` (`dates refused [code] <at>` with `.code` and `.at`):

| Error code | Thrown when |
|---|---|
| `missingDateTime`, `missingDate`, `missingTime`, `missingMonthDay`, `missingYearMonth`, `missingDay`, `missingPoints`, `missingAnchor`, `missingPlugin` | Nullish input, two-arg `date(2026, 11)`, unanchored `months(2).total('days')`, or `{ loose: true }` / `dayFirst` / `zoneAliases` without its plugin |
| `invalidDateTime`, `invalidDate`, `invalidTime`, `invalidDuration`, `invalidMonthDay`, `invalidYearMonth`, `invalidRange`, `invalidStep`, `invalidNumber`, `invalidFraction`, `invalidYear`, `invalidDay`, `invalidPoint` | Malformed string, nonexistent field (`Feb 30`), rejected DST gap/fold (`disambiguation: 'reject'`), non-positive `every()` step, or `end < start` on `DateRange`/`DateTimeRange` |
| `cannotAdd`, `cannotSubtract`, `cannotSet`, `cannotRound`, `cannotBalance`, `cannotTotal` | Arithmetic/balance/total overflow, disallowed/non-integer `set()` field, or invalid `roundingIncrement` (such as `dt.round(7, 'minutes')`, since `60 % 7 !== 0`) |
| `unknownZone`, `unknownLocale`, `unknownDisambiguation`, `unknownUnit`, `unknownDayOfWeek`, `unknownFormat`, `unknownKind`, `unknownSetting`, `unknownWidth` | Unrecognized IANA zone, malformed BCP 47 tag, invalid `disambiguation` mode, unit, weekday, token/preset (`'yyyy'`), `as(kind)` or `DateRange.count(kind)` target, or `configure()` key |
| `unsupportedUnit`, `unsupportedToken`, `unsupportedComparison`, `unsupportedZone`, `unsupportedCalendar`, `unsupportedIntersection` | Unit/token absent on noun (`hours` or `'HH'` on `CalendarDate`), `<`/`-` on non-`DateTime`, `timeRange.in(zone)`, non-ISO `PlainMonthDay`/`PlainYearMonth`, or double overnight intersection |
| `conflictingSigns`, `conflictingKinds`, `conflictingRanges` | `days(1).minus(hours(1))`, `compare(date, datetime)`, or passing a `TimeRange` to `dateRange()` |

---

## Quick Reference

| Coming from `Date` / Moment / Day.js / Luxon / Temporal | `native-dates` idiom |
|---|---|
| `new Date()` / `dayjs()` / `moment()` / `DateTime.now()` | `now(zone?)` or `today(zone?)` (`0`-arg `datetime()` throws `missingDateTime`) |
| `d.toISOString()` / `dt.toISO()` | `dt.toJSON()` or `dt.toString()` (no `.toISOString()` in core) |
| `d.isValid` / `dayjs(x).isValid()` | Construction throws immediately (or returns `null` with `{ loose: true }` plugin) |
| `moment.tz(x, z)` / `dt.setZone(z)` / `zdt.withTimeZone(z)` | `datetime(x, z)` on parse, `.in(z)` to convert an existing `DateTime` |
| `zdt.with({ hour: 9, minute: 0 })` | `dt.at('09:00')` or `dt.set({ hour: 9, minute: 0 })` |
| `moment.min(a, b)` / `DateTime.max(a, b)` | `earliest(a, b)` / `latest(a, b)` |
| `x.isBetween(a, b)` | `a.to(b).contains(x)` (`[a, b]` on `CalendarDate`, `[a, b)` on `DateTime`/`Time`) |
| `b.diff(a, 'hours', true)` | `a.until(b, 'hours')` (always exact float; `Math.trunc` if integer needed) |

```js
import { compare, date, datetime, earliest, isDateTime, today } from 'native-dates';

const start = date('2026-11-01');
const deadline = earliest(start.plus(2, 'w'), today('Europe/Berlin').next('friday'));
const midnightInBerlin = deadline.at(undefined, 'Europe/Berlin'); // 2026-11-xxT00:00 in Europe/Berlin
const inWindow = start.through(deadline).contains('2026-11-05') && isDateTime(midnightInBerlin);
const ordered = [deadline, start].sort(compare);
```

**Golden rule: Match the class to the data (`datetime` for zoned instants, `date` for calendar days, `time` for clocks), chain immutable methods, and pass explicit IANA zones and per-value `.locale()` in server code.**

---

## Related Skills

| Skill | Use when... |
|---|---|
| `native-dates-plugins` | Resolving city names (`'Berlin'`, `'Beijing'`) or locale-aware zone abbreviations (`'PST'`, `'CST'`), parsing localized/slash/informal strings with `{ loose: true, dayFirst }`, shimming `Date` getters, polyfilling `Temporal` on Safari or Node `<26`, or writing a custom plugin |
