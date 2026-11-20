---
title: Dates, Times, Zones, Durations, and Ranges with native-dates
description: Core guide for building with native-dates (and @native-dates/core). Use whenever code creates, parses, shifts, rounds, compares, ranges over, or formats dates, clock times, zoned timestamps, durations, billing months, or recurring month-days, handles DST or HTTP Accept-Language locales, or migrates off Date, Moment, Day.js, or raw Temporal. For city/abbreviation zones, { loose: true } parsing, legacy Date getters, or the Safari Temporal polyfill, also load native-dates-plugins.
keywords: [native-dates, "@native-dates/core", datetime, date, time, duration, monthDay, yearMonth, dateRange, datetimeRange, timeRange, today, now, fromNow, weekStart, dayOfWeek, epochSeconds, epochMilliseconds, configure, Temporal, Intl, DST]
audience: usage
skill: native-dates
type: skill
---

# Dates, Times, Zones, Durations, and Ranges with native-dates

> **Skill:** `native-dates`
> **Purpose:** Core mental model, pitfalls, and API reference for `native-dates` (`@native-dates/core`)

`native-dates` wraps the platform's `Temporal` and `Intl` APIs with immutable classes and zero runtime dependencies. Instead of routing every concept through one `Date` object, each kind of value has its own class and factory so invalid operations (adding hours to a calendar date, comparing a date to a zoned timestamp, or mutating a shared instance) fail immediately with a coded error.

**Golden rule: Pick the noun that matches the data (`datetime` for an exact moment in a zone, `date` for a calendar day, `time` for a wall clock, `yearMonth` or `monthDay` for partial dates), chain immutable methods rather than mutating, and pass explicit IANA zones or per-value `.locale()` in server code.**

---

## What You'd Get Wrong

**1. Trailing `Z` and numeric offsets (`-05:00`) fix the instant, not `.zone`.** Database and JSON timestamps routinely arrive with `Z`. Adopting `'UTC'` as `.zone` would silently disable daylight-saving rules on subsequent `.plus(1, 'day')` or `.startOf('day')` calls. `.zone` comes from the explicit `zone` argument, a bracketed `[Zone]` suffix, `configure({ zone })`, or the runtime's local zone, while `toString()` and `toJSON()` always serialize standard ISO 8601 UTC (`...Z`).

```js
// ❌ WRONG - assuming 'Z' sets .zone to 'UTC'
const dt = datetime('2026-03-08T04:30:00Z');
dt.zone; // local or configured zone (NOT 'UTC')

// ✅ RIGHT - pass 'UTC' when you want UTC wall-clock fields, or pass the user's IANA zone for DST-safe math
const utc = datetime('2026-03-08T04:30:00Z', 'UTC');
const ny = datetime('2026-03-08T04:30:00Z', 'America/New_York').plus(1, 'day'); // crosses spring-forward at local 23:30
ny.toJSON(); // '2026-03-09T03:30:00.000Z'
```

**2. `month` is `1`–`12` and `dayOfWeek` is ISO `1`–`7` (`7` = Sunday), not `0`-indexed.** `isWeekday()` is `true` Monday–Friday (`1`–`5`) and `false` on weekends (`6`–`7`). In token patterns, `'E'` outputs `'1'`–`'7'` while `'d'` keeps Moment/Day.js's `'0'`–`'6'` (`'0'` = Sunday).

```js
// ❌ WRONG - JS Date / Moment 0-indexed months or Sunday = 0 on .dayOfWeek
date(2026, 0, 15); // RangeError [invalidDate]
if (d.dayOfWeek === 0) { /* never true: Sunday is 7 */ }

// ✅ RIGHT - 1 = January..12 = December, 1 = Monday..7 = Sunday
const d = date(2026, 1, 15);
d.month; // 1
date('2026-11-15').dayOfWeek; // 7 (Sunday)
date('2026-11-15').format('E'); // '7' (token 'd' prints '0')
```

**3. Unix timestamp properties require an explicit unit — there is no bare `.epoch` or `.timestamp`.** Shells, Python, SQL, and JWT `exp`/`iat` claims count seconds while `Date.now()` counts milliseconds, so every epoch property names its unit.

```js
// ❌ WRONG - undefined! No .epoch or .timestamp property exists
const exp = now().epoch;

// ✅ RIGHT - choose epochSeconds (Number, floored), epochMilliseconds (Number), or epochNanoseconds (BigInt)
const jwtExp = now().plus(15, 'minutes').epochSeconds;
const ms = now().epochMilliseconds; // also returned by valueOf()
```

**4. `next()` and `previous()` step to weekdays or `MonthDay`s and preserve clock time; `startOfNext()` and `startOfPrevious()` step to unit boundaries at `00:00`.** Passing a unit like `'month'` to `next()` throws `unknownDayOfWeek`, and passing a number like `2` to `startOfNext()` throws `unknownUnit`.

```js
// ❌ WRONG - passing a calendar unit to next()
datetime('2026-11-16T09:30', 'UTC').next('month'); // throws [unknownDayOfWeek]

// ✅ RIGHT - use next('friday') for same-clock weekday steps, startOfNext('month') for 00:00 unit boundaries
datetime('2026-11-16T09:30', 'UTC').next('friday'); // 2026-11-20T09:30:00Z
datetime('2026-11-16T09:30', 'UTC').startOfNext('month'); // 2026-12-01T00:00:00Z
```

**5. `DateRange` is closed `[start, end]`, while `DateTimeRange` and `TimeRange` are half-open `[start, end)`.** "Monday to Friday" includes Friday (`5` days), so `checkIn.for(3, 'days')` automatically subtracts 1 day from `end` (`Sep 1` through `Sep 3`). `DateTimeRange` and `TimeRange` exclude `end` so adjacent slots (`09:00`–`10:00`, `10:00`–`11:00`) do not overlap, and `TimeRange` wraps across midnight when `end < start` (`Time.prototype.until()` stays signed within a single `00:00`–`23:59` day).

```js
// ❌ WRONG - adding 3 days manually to build a 3-night/3-day DateRange spans 4 inclusive days
const bad = date('2026-09-01').to(date('2026-09-01').plus(3, 'days')); // 4 days!

// ✅ RIGHT - use .for(3, 'days') for a span, or .to() / .through() with the inclusive end date
const stay = date('2026-09-01').for(3, 'days'); // 2026-09-01 through 2026-09-03 (duration: 3 days)
const slot = time('22:00').to('06:00'); // overnight TimeRange (duration: 8 hours)
```

**6. `Duration` keeps written fields until `.balance()`, totals via `.total(unit)` / `.as(unit)` (never `.in()`), and refuses `days(1).minus(hours(1))`.** There is no `.normalize()` method. Subtracting clock units from calendar days throws `conflictingSigns` because DST days are 23 or 25 hours, and converting/comparing unanchored months or years against days/hours throws `missingAnchor` unless measured with `a.until(b)`.

```js
// ❌ WRONG - .normalize(), .in('hours'), or mixing calendar day and hour signs on a Duration
minutes(90).normalize(); // TypeError: not a function
hours(36).in('days'); // TypeError: not a function
days(1).minus(hours(1)); // RangeError [conflictingSigns]

// ✅ RIGHT - use .balance(), .total(unit) / .as(unit), and chain mixed calendar + clock steps on DateTime
minutes(90).balance(); // Duration(PT1H30M) -> hours: 1, minutes: 30
hours(36).total('days'); // 1.5
dt.plus(1, 'day').minus(1, 'hour'); // DST-accurate chaining
date('2026-01-15').until('2026-04-15', 'days'); // 90 (anchored via until)
```

**7. `.locale()` affects both formatting and default week start (`startOf('week')`), while `weekOfYear` stays ISO Monday.** On multi-user servers, attach `.locale(req.headers['accept-language'])` to values instead of mutating process-wide `configure({ locale })`, and pass `'monday'` explicitly when keying stored weekly buckets.

```js
// ❌ WRONG - mutating global configure() per HTTP request, or assuming startOf('week') is Monday in en-US
configure({ locale: req.headers['accept-language'] });
const bucket = rowDate.startOf('week').toString(); // Sunday in en-US, Monday in de-DE, Saturday in ar-EG!

// ✅ RIGHT - attach locale per value, and pass firstDay when week keys must not shift by locale
const localized = datetime(row.at, user.zone).locale(req.headers['accept-language']);
const isoWeekKey = localized.date.startOf('week', 'monday').toString();
```

**8. Core rejects ambiguous inputs and city/abbreviation zones without plugins, and strips error prose in production.** `'11/06/2026'` and `{ loose: true }` require `@native-dates/plugins/loose`, `'Berlin'` and `'PST'` require `@native-dates/plugins/zones`, `compare(date, datetime)` throws `conflictingKinds`, `CalendarDate` / `Time` throw `unsupportedComparison` on `<` or `-`, and `err.message` explanations fold out of production builds — branch on `err.code` and `err.at`, never `err.message` substrings.

---

## Choosing the Right Noun

| Class | Factories | Represents | Key rule |
|---|---|---|---|
| `DateTime` | `datetime(input, zoneOrOpts?)`, `now(zone?)`, `startOfToday(zone?)`, `endOfToday(zone?)` | Exact instant + IANA zone (`Temporal.ZonedDateTime`) | DST-aware; `toString()` / `toJSON()` emit UTC `...Z`; `<` / `valueOf()` use `epochMilliseconds` |
| `CalendarDate` | `date(input, opts?)`, `date(y, m, d)`, `today(zone?)`, `tomorrow(zone?)`, `yesterday(zone?)` | Calendar day (`Temporal.PlainDate`) | Refuses clock units (`hours`) and `<` / `-`; two-arg `date(2026, 11)` throws `missingDay` |
| `Time` | `time(input, zoneOrOpts?)`, `time(h, m, s?)` | Wall-clock time (`Temporal.PlainTime`) | Wraps modulo 24h on `plus`/`minus`; accepts `'9am'`, `'17:30'`, `'9:05:08.428'` |
| `Duration` | `duration(input, unitOrOpts?)`, `years(n)`..`milliseconds(n)` | Span of units (`Temporal.Duration`) | 8 unit helpers (`years`, `months`, `weeks`, `days`, `hours`, `minutes`, `seconds`, `milliseconds`); use `duration(n, 'microseconds' \| 'nanoseconds')` for sub-ms |
| `MonthDay` | `monthDay(input, opts?)`, `monthDay(m, d)`, `dayMonth(input, opts?)`, `dayMonth(d, m)` | Recurring month + day (`Temporal.PlainMonthDay`) | No linear order (`equals()`, `fallsOn()` / `isOn()`); Feb 29 falls on Feb 28 in non-leap years |
| `YearMonth` | `yearMonth(input, opts?)`, `yearMonth(y, m)`, `monthYear(input, opts?)`, `monthYear(m, y)` | Billing/calendar month (`Temporal.PlainYearMonth`) | Only `years`, `quarters`, `months` arithmetic; `monthYear('11/26')` adds `YearMonth.century` (`2000`) |
| `DateRange`, `DateTimeRange`, `TimeRange` | `dateRange(s, e?, opts?)`, `datetimeRange(...)`, `timeRange(...)`, `pt.to(end)`, `pt.for(n, unit)`, `pt.range(unit)` | Interval between two points | `DateRange` is `[start, end]` (also `date.through(end)`); `DateTimeRange` & `TimeRange` are `[start, end)` |

Every instance is `Object.freeze`d on construction with `.text` as its first enumerable own property. Cross between types with `.date`, `.time`, `.monthDay`, `.yearMonth`, `date.at(time?, zone?)`, `time.on(date, zone?)`, `monthDay.in(year)`, `yearMonth.on(day)` (`yearMonth.start` / `.end`), `range.in(zone)`, or `.as('date' | 'time' | 'datetime' | 'monthDay' | 'yearMonth' | 'duration')`.

---

## DateTime

```js
import { datetime, endOfToday, now, startOfToday } from 'native-dates';

const dt = datetime('2026-11-16T09:30', 'America/Los_Angeles');
const shifted = dt.plus(2, 'days').at('14:00').in('Europe/Berlin');
```

- **Accepted inputs:** ISO strings (`'2026-11-16'`, `'2026-11-16T09:30'`, `'2026-11-16T17:30Z'`, `'2026-11-16T09:30-08:00[America/Los_Angeles]'`), year-first `'2026/11/16 9:30'`, epoch milliseconds (`Number`, truncated if fractional), `Date`, `{ year, month, day, hour, ... }`, `CalendarDate`, `DateTime`, or `Temporal.{ZonedDateTime,Instant,PlainDateTime,PlainDate}`. Passing `null`/`undefined` throws `missingDateTime` (use `now()`).
- **Own properties:** `text`, `year`, `month` (`1`–`12`), `day` (`1`–`31`), `dayOfWeek` (`1`–`7`), `hour` (`0`–`23`), `minute`, `second`, `millisecond`, `zone` (IANA ID), `offset` (`'-08:00'`), `epochMilliseconds`.
- **Getters & predicates:** `microsecond`, `nanosecond`, `epochSeconds`, `epochNanoseconds` (`BigInt`), `weekStart`, `quarter` (`1`–`4`), `dayOfYear`, `weekOfYear` (ISO), `daysInMonth`, `daysInYear`, `hoursInDay` (`23`/`24`/`25` across DST), `date`, `time`, `monthDay`, `yearMonth`, `isLeapYear()`, `isWeekday()`, `isWeekend()`, `isPast()`, `isFuture()`, `isToday()`, `isTomorrow()`, `isYesterday()`.
- **Transforms:** `plus(n, unit)` / `add`, `minus(n, unit)` / `subtract` (also accepts `'1h 30m'`, `{ days: 2 }`, or `Duration`), `set(field, value)` / `set({ year, month })` (clamps existing day on month/year change, rejects out-of-range explicit fields), `at(time)` (wall clock in `this.zone`), `in(zone)` (same instant in new zone), `startOf(unit, firstDay?)`, `endOf(unit, firstDay?)` (inclusive last ms/ns — prefer `range(unit)` for `< end` queries), `startOfNext(unitOrWeekday, firstDay?)`, `startOfPrevious(unitOrWeekday, firstDay?)`, `next(weekdayOrMonthDay)`, `previous(weekdayOrMonthDay)`, `round(inc, unit?)`, `floor(inc, unit?)`, `ceil(inc, unit?)`, `locale(tag?)` / `lang`.
- **Comparisons & spans:** `equals(other)`, `isBefore(other)`, `isAfter(other)`, `isSame(other, unit?, firstDay?)`, `until(other, unit?)`, `since(other, unit?)`, `from(other?, locale?)` / `formatRelative`, `fromNow(locale?)`, `to(endOrDuration, unit?)` / `for`, `range(unit, firstDay?)`, `toString()`, `toJSON()`, `toJSDate()`, `toTemporal()`.

---

## CalendarDate

```js
import { date, today, tomorrow, yesterday } from 'native-dates';

const due = today('America/New_York').plus(2, 'weeks').next('friday');
```

- **Accepted inputs:** `'2026-11-16'`, `'2026/11/16'`, `'2026.11.16'`, `'2026-1-5'`, `(year, month, day)` integers, `{ year, month, day }`, `DateTime`, `Date`, instant strings (resolved in `zone`), or `Temporal.PlainDate`. Bare single numbers throw `invalidDate` (`datetime(ms).date` or `date(y, m, d)`).
- **Clock guard:** Refuses clock units (`hours`, `minutes`, ...) with `unsupportedUnit`; attach a clock first via `.at('00:00', zone)`.
- **Day-specific methods:** Shares `DateTime`'s calendar properties, `plus`/`minus`, `set`, `startOf`/`endOf`, `startOfNext`/`startOfPrevious`, `next`/`previous`, `isSame`, `until`/`since` (returns `Duration` in days or `Number` when `unit` is passed), `from`/`fromNow`, plus `.through(end)` (alias for `.to(end)`), `.at(time?, zone?)` -> `DateTime`, and `.points(step, unit?, zone?)` / `.split(step, unit?, zone?)` / `.splitBy` across that date's zoned day.

---

## Time

```js
import { time } from 'native-dates';

const shiftStart = time('9:30am').plus(45, 'minutes'); // Time(10:15:00)
const scheduled = shiftStart.on('2026-11-16', 'America/Chicago'); // DateTime
```

- **Accepted inputs:** `'09:30'`, `'9am'`, `'5:30:15 pm'`, `time(9, 30, 0)`, `{ hour, minute }`, `DateTime`, `Date`, instant strings (resolved in `zone`), or `Temporal.PlainTime`. Single bare hour integer is accepted in `time(9)` -> `09:00` (`set` / arithmetic wrap around midnight).
- **Methods:** `plus`/`minus`, `set`, `startOf`/`endOf`, `startOfNext(unit)` / `startOfPrevious(unit)` (clock units only), `round`/`floor`/`ceil`, `equals`/`isBefore`/`isAfter`/`isSame`, `until(other, unit?)` / `since(other, unit?)` (within a single `00:00`–`23:59` day), `to(end, unit?)` / `for`, `on(day, zone?)` -> `DateTime`, `format(spec?, locale?)`, `toString()`.

---

## Duration

```js
import { days, duration, hours, minutes } from 'native-dates';

const span = duration('2h 45m').plus(30, 'minutes').balance(); // 3 hours, 15 minutes
span.total('hours'); // 3.25
```

- **Accepted inputs:** ISO 8601 (`'PT1H30M'`, `'-P2D'`), natural phrases (`'1h 30m'`, `'2 weeks, 3 days'`, `'90 mins'`, `'1.5 hours'` -> spills fractional units down to nanoseconds), `(count, unit)`, `{ hours: 1, minutes: 30 }`, or `Temporal.Duration`.
- **Properties & methods:** `text`, `years`, `months`, `weeks`, `days`, `hours`, `minutes`, `seconds`, `milliseconds`, `microseconds`, `nanoseconds`, `sign` (`-1 | 0 | 1`), `anchor`, `isZero()`, `isNegative()`, `toFields()`, `plus`/`add`, `minus`/`subtract` (borrows signs automatically across fixed ratios `1y = 12mo` and `1w = 7d`), `times(factor)`, `negated()`, `abs()`, `balance(largestUnit?)`, `round(smallestUnit)`, `total(unit)` / `as(unit)`, `toMilliseconds()` / `valueOf()`, `compare(other)`, `equals(other)`, `format('long' | 'short' | 'narrow' | 'digital', locale?)`.

---

## MonthDay and YearMonth

```js
import { dayMonth, monthDay, monthYear, yearMonth } from 'native-dates';

const birthday = monthDay('10-17'); // or monthDay(10, 17), dayMonth('17/10')
birthday.in(2027); // CalendarDate(2027-10-17)
birthday.next('2026-11-16'); // CalendarDate(2027-10-17) — strictly after reference date

const billing = monthYear('11/26'); // YearMonth(2026-11)
billing.start; // CalendarDate(2026-11-01)
billing.end; // CalendarDate(2026-11-30)
```

- **`MonthDay`:** `month` (`1`–`12`), `day` (`1`–`31`), `in(year)` -> `CalendarDate` (Feb 29 constrains to Feb 28 in non-leap years), `next(fromDay?)` / `after(day)`, `previous(fromDay?)` / `last(fromDay?)` / `before(day)`, `fallsOn(day)` / `isOn(day)` (Feb 29 falls on Feb 28 in non-leap years, whereas `equals()` checks exact `month` & `day` and rejects slash/dot strings as order-ambiguous), `isToday(zone?)`, `isTomorrow(zone?)`, `isYesterday(zone?)`. Note: two-digit `'MM-DD'` with a hyphen always parses month-first even in `dayMonth('10-17')`.
- **`YearMonth`:** `year`, `month`, `quarter`, `daysInMonth`, `daysInYear`, `isLeapYear()`, `start`, `end`, `on(day)` -> `CalendarDate`, `plus`/`minus` (`years`, `quarters`, `months` only), `set`, `contains(day)` / `includes(day)`, `equals`/`isBefore`/`isAfter`/`compare`, `isPast(zone?)`/`isFuture(zone?)`, `until(other, unit?)`/`since(other, unit?)`. `YearMonth` `'short'` preset prints 4-digit years (`'11/2026'`); use `.format('MM/YY')` for 2-digit card expiries.

---

## DateRange, DateTimeRange, and TimeRange

```js
import { date, dateRange, datetimeRange, timeRange } from 'native-dates';

const sprint = date('2026-11-02').for(2, 'weeks'); // 2026-11-02 through 2026-11-15
const daysInSprint = sprint.points('day'); // 14 CalendarDate instances
const weeks = sprint.split(1, 'week'); // [DateRange(Nov 2..Nov 8), DateRange(Nov 9..Nov 15)]
```

- **Construction:** `point.to(end)`, `point.for(amount, unit)` / `point.for(duration)`, `date.through(end)`, `point.range(unit, firstDay?)`, or `dateRange` / `datetimeRange` / `timeRange` with `(start, end, options?)` or a single interval string (`'2026-09-01/2026-09-07'`, `'2026-09-01 to 2026-09-07'`, `'09:00-17:00'`).
- **Properties & methods:** `text`, `kind` (`'date' | 'datetime' | 'time'`), `start`, `end`, `duration` (`Duration`), `isEmpty()` (`false` on all `DateRange`s; `start.equals(end)` on `DateTimeRange`/`TimeRange`), `contains(pointOrRange)` / `includes`, `overlaps(otherRange)`, `intersection(otherRange)` (returns range or `null`; throws `unsupportedIntersection` if two overnight `TimeRange`s overlap in two disjoint windows), `equals(other)`, `points(step, unit?)` (`step` > 0, e.g. `'day'`, `'30m'`, `(15, 'minutes')`), `split(step, unit?)` / `splitBy`, `in(zone)` (converts inclusive `DateRange` `[start, end]` to half-open `DateTimeRange` `[start 00:00, (end + 1d) 00:00)` in `zone`; throws `unsupportedZone` on `TimeRange`), `format(spec?, locale?)`, `toString()` (`'start/end'`).

---

## format, monthNames, and weekdayNames

`value.format(spec?, locale?)` accepts four kinds of `spec`:

1. **Built-in presets:** `'short'`, `'medium'` (default, except `'short'` on `Time`), `'long'`, `'full'`, `'date'`, `'time'`, `'month'`, `'text'`, plus Moment/Day.js localized presets `'LT'`, `'LTS'`, `'L'`, `'l'`, `'LL'`, `'ll'`, `'LLL'`, `'lll'`, `'LLLL'`, `'llll'`. (`Duration.prototype.format` accepts `'long'` default, `'short'`, `'narrow'`, `'digital'`.)
2. **Custom named formats** registered via `configure({ formats: { invoice: 'YYYY-MM-DD' } })` (checked before built-in presets; `value.text` and bare `value.format()` stay on built-in defaults).
3. **`Intl.DateTimeFormat` options objects** (`{ month: 'short', day: 'numeric', weekday: 'short' }`) — fields absent on a noun (such as `hour` on `CalendarDate` or `year` on `Time`) are stripped automatically.
4. **Token patterns** (literal text escaped in `[brackets]`, `'T'` allowed bare; digits and years stay Western ASCII/Gregorian):

| Tokens | Output |
|---|---|
| `YYYY`, `YY`, `Q` | 4-digit year, 2-digit year, quarter (`1`–`4`) |
| `M`, `MM`, `MMM`, `MMMM` | Month `1`–`12`, padded `01`–`12`, localized Gregorian short/long name (auto-inflected after day tokens) |
| `D`, `DD`, `Do`, `DDD`, `DDDD` | Day of month, padded, ordinal (`'16th'`, `'6.'`, `'6日'`), day of year, 3-digit day of year |
| `E`, `d`, `dd`, `ddd`, `dddd` | ISO weekday `1`–`7` (`7` = Sun), Moment weekday `0`–`6` (`0` = Sun), narrow (`'Mo'`), short, long |
| `W`, `WW` | ISO week of year (`1`–`53`), padded |
| `H`, `HH`, `h`, `hh`, `a`, `A` | 24h hour, 12h hour (`1`–`12`), localized am/pm |
| `m`, `mm`, `s`, `ss`, `S`, `SS`, `SSS` | Minute, second, fractional digits (`1`–`3`) |
| `Z`, `ZZ`, `z`/`zz`, `zzz`/`zzzz` | Offset `'-08:00'`, `'-0800'`, localized short/long zone name |
| `X`, `x`, `[text]` | Epoch seconds, epoch milliseconds, escaped literal text |

- `monthNames(style = 'long' | 'short', locale?)`: 12 Gregorian month names (`0` = Jan..`11` = Dec).
- `weekdayNames(style = 'short' | 'long' | 'narrow', firstDay?, locale?)`: 7 weekday names rotated to start on `firstDay` / `weekStart` / locale's first day (note: `locale` is the **3rd** argument!).

---

## configure, compare, and Guards

```js
import { compare, configure, dayOfWeek, earliest, kindOf, latest } from 'native-dates';

configure({
  zone: 'America/New_York', // default IANA zone (null resets to system)
  locale: 'en-US', // default locale (null resets to system)
  weekStart: 'monday', // 1..7 or day name (null resets to locale-driven)
  formats: { sql: 'YYYY-MM-DD HH:mm:ss' }, // null clears
  weekdayNames: { lv: { narrow: { fri: 'Pk', sun: 'Sv' } } }, // width in [narrow, short, long]
  ordinals: { fr: (day) => (day === 1 ? '1er' : day) },
});
```

- **`compare(a, b)` / `earliest(...items)` / `latest(...items)`:** Sorts `DateTime`, `CalendarDate`, `Time`, `YearMonth`, `Duration` (in `compare`), or same-kind ranges (accepts a single array or rest args in `earliest`/`latest`). A bare `Number` in first position (`compare(Date.now(), dt)`) is epoch milliseconds; a trailing `Number` after a `Time` (`compare(time('09:00'), 9)`) coerces to an hour. Mixing kinds (`compare(date, datetime)`) throws `conflictingKinds`.
- **`dayOfWeek(input)`:** Converts `'monday'`..`'sunday'`, 3-letter prefixes (`'mon'`), `1`–`7`, or `0` (mapped to `7`) into ISO `1`–`7`.
- **Cross-realm guards & brands:** `kindOf(x)` returns `'datetime' | 'date' | 'time' | 'duration' | 'monthDay' | 'yearMonth' | 'dateRange' | 'datetimeRange' | 'timeRange' | undefined`. Guards `isDateTime`, `isCalendarDate`, `isTime`, `isDuration`, `isMonthDay`, `isYearMonth`, `isDateRange`, `isDateTimeRange`, `isTimeRange` and `instanceof` use `Symbol.for` brands (`IS_DATE_TIME`, etc.) so they work across realms and duplicate bundles.

---

## Errors

Every refusal throws `RangeError` or `TypeError` formatted as `dates refused [code] <at>` with `.code` and `.at` properties:

| Error code | Thrown when |
|---|---|
| `missingDateTime`, `missingDate`, `missingTime`, `missingMonthDay`, `missingYearMonth`, `missingDay`, `missingPoints`, `missingAnchor`, `missingPlugin` | Required argument, day (`date(2026, 11)`), anchor (`months(2).total('days')`), or plugin (`{ loose: true }` without `@native-dates/plugins/loose`) is missing |
| `invalidDateTime`, `invalidDate`, `invalidTime`, `invalidDuration`, `invalidMonthDay`, `invalidYearMonth`, `invalidRange`, `invalidStep`, `invalidNumber`, `invalidFraction`, `invalidYear`, `invalidDay`, `invalidPoint` | Unparseable syntax, out-of-range calendar field (`Feb 30`), non-positive `points()` step, or `end < start` on `DateRange`/`DateTimeRange` |
| `unknownZone`, `unknownLocale`, `unknownUnit`, `unknownDayOfWeek`, `unknownFormat`, `unknownKind`, `unknownSetting`, `unknownWidth` | Unrecognized IANA zone, BCP 47 tag, unit, weekday, token/preset, `as(kind)` target, or `configure()` key |
| `unsupportedUnit`, `unsupportedToken`, `unsupportedComparison`, `unsupportedZone`, `unsupportedCalendar`, `unsupportedIntersection` | Valid unit/token applied to a noun that lacks it (`hours` on `CalendarDate`), `<` / `-` coercion on non-`DateTime` points, or double-window overnight `TimeRange` intersection |
| `conflictingSigns`, `conflictingKinds`, `conflictingRanges` | `days(1).minus(hours(1))`, `compare(date, datetime)`, or passing a `TimeRange` to `dateRange()` |

---

## Quick Reference

```js
import { date, datetime, days, hours, monthDay, now, time, today, yearMonth } from 'native-dates';

// Zoned moment + DST-safe math + UTC wire output
const kickoff = datetime('2026-03-08T04:30:00Z', 'America/New_York').plus(1, 'day').at('09:30');
kickoff.toJSON(); // '2026-03-09T13:30:00.000Z'
kickoff.epochSeconds; // 1773063000

// Calendar day + inclusive range + unit boundary
const billingWindow = today('Europe/Berlin').startOfNext('month').for(1, 'month'); // inclusive DateRange
const eachDay = billingWindow.points('day');

// Server-safe per-request locale + pinned ISO Monday week key
const userTime = datetime(row.createdAt, user.zone).locale(req.headers['accept-language']);
const label = userTime.fromNow(); // localized relative phrase
const weekBucket = userTime.date.startOf('week', 'monday').toString();

// Anchored calendar span vs fixed duration balancing
const ageDays = date('2026-01-15').until('2026-04-15', 'days'); // 90
const totalHrs = hours(1).plus(days(2)).total('hours'); // 49
```

**Golden rule: Pick the noun that matches the data (`datetime` for an exact moment in a zone, `date` for a calendar day, `time` for a wall clock, `yearMonth` or `monthDay` for partial dates), chain immutable methods rather than mutating, and pass explicit IANA zones or per-value `.locale()` in server code.**

---

## Related Skills

| Skill | Use when... |
|---|---|
| `native-dates-plugins` | Resolving city names (`'Berlin'`) or zone abbreviations (`'PST'`), parsing untrusted/slash strings with `{ loose: true, dayFirst }`, shimming legacy `Date` getters, loading `@native-dates/polyfill` for Safari, or writing a custom plugin |
