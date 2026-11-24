---
name: native-dates
description: "Core guide for building with native-dates (and @native-dates/core). Use whenever code creates, parses, shifts, rounds, compares, ranges over, or formats dates, clock times, zoned timestamps, durations, billing months, or recurring month-days, handles DST or HTTP Accept-Language locales, or migrates off Date, Moment, Day.js, date-fns, Luxon, or raw Temporal. For city/abbreviation zones, { loose: true } parsing, legacy Date getters, or the Temporal polyfill on Safari and Node 22–25, also load native-dates-plugins."
metadata:
  title: Dates, Times, Zones, Durations, and Ranges with native-dates
  keywords: "native-dates, @native-dates/core, datetime, date, time, duration, monthDay, yearMonth, dateRange, datetimeRange, timeRange, today, now, dayOfWeek, epochSeconds, epochMilliseconds, configure, Accept-Language, Temporal, Intl, DST"
  audience: usage
  type: skill
---

# Dates, Times, Zones, Durations, and Ranges with native-dates

> **Skill:** `native-dates`
> **Purpose:** Core mental model, pitfalls, and API reference for `native-dates` (`@native-dates/core`)

`native-dates` (`@native-dates/core` is the identical scoped alias) wraps `Temporal` and `Intl` in 9 immutable, frozen classes with zero runtime dependencies. Chrome, Firefox, Edge, and Node `>=26` run natively; load `native-dates-plugins` for Safari/Node 22–25 (`@native-dates/polyfill`), `{ loose: true }` parsing (`'11/16/2026'`, localized text), city/abbreviation zones (`'PST'`, `'Berlin'`), or legacy `Date` getters.

**Golden rule: Match the class to the data (`datetime`, `date`, `time`), chain immutable methods, and pass explicit IANA zones and per-value `.locale()` in server code.**

---

## What You'd Get Wrong

**1. Trailing `Z` and offsets (`-05:00`) fix the instant, not `.zone`; 0-arg `datetime()` throws `missingDateTime` (use `now()`/`today()`).** `.zone` resolves from explicit `zone` -> `[Zone]` suffix -> `configure({ zone })` -> system zone (adopting `'UTC'` would break DST on `.plus(1, 'day')`). `toString()`/`toJSON()` always emit UTC `...Z` (no `.toISOString()`/`.toISO()`), and `DateTime.equals()` compares **instants only** (ignoring `.zone`/`.locale()`).

```js
// ❌ datetime('2026-03-08T04:30:00Z').zone is local/configured, NOT 'UTC'
// ✅ pass 'UTC' for UTC fields, or the user's IANA zone for DST-safe math
datetime('2026-03-08T04:30:00Z', 'UTC');
datetime('2026-03-08T04:30:00Z', 'America/New_York').plus(1, 'day').toJSON(); // '2026-03-09T03:30:00.000Z'
```

**2. `month` is `1`–`12`, `dayOfWeek` is ISO `1`–`7` (`7` = Sun), `isWeekend()`/`isWeekday()` follow the locale, and tokens use Moment casing (`YYYY-MM-DD`, not `yyyy-MM-dd`).** Weekends vary by locale (`ar-SA`/`ar-EG`/`he-IL` Fri–Sat, `fa-IR` Fri, `hi-IN` Sun). In `format()`, `'yyyy'` throws `unknownFormat` (absent noun token like `'HH'` on `CalendarDate` throws `unsupportedToken`), `'dd'` is 2-letter weekday (`'Mo'`), `'E'` is `'1'`–`'7'`, `'d'` is `'0'`–`'6'` (`0` = Sun), and literals glued to accented letters (`'às'`) or `h` after `H` (`'HHhmm'`) need `[brackets]`.

```js
// ❌ date(2026, 0, 15) -> invalidDate; date('2026-11-16').format('yyyy-MM-dd') -> unknownFormat
// ✅
date(2026, 11, 15).format('YYYY-MM-DD (E / d)'); // '2026-11-15 (7 / 0)'
```

**3. Unix timestamps always name their unit.** Neither `.epoch`, `.timestamp`, nor `.unix()` exists.

```js
// ❌ now().epoch -> undefined
// ✅ epochSeconds (floored Number), epochMilliseconds (Number), epochNanoseconds (BigInt)
const jwtExp = now().plus(15, 'minutes').epochSeconds;
```

**4. `next()`/`previous()` step strictly to future/past weekdays or `MonthDay`s keeping clock time; `startOfNext()`/`startOfPrevious()` step to unit boundaries at `00:00`.** On Friday, `next('friday')` adds `+7` days (`previous` `-7`). A unit in `next()` throws `unknownDayOfWeek`; a count in `startOfNext()` throws `unknownUnit`.

```js
// ❌ datetime('2026-11-16T09:30', 'UTC').next('month') -> unknownDayOfWeek
// ✅
datetime('2026-11-16T09:30', 'UTC').next('friday'); // 2026-11-20T09:30:00.000Z
datetime('2026-11-16T09:30', 'UTC').startOfNext('month'); // 2026-12-01T00:00:00.000Z
```

**5. `DateRange` is closed `[start, end]`; `DateTimeRange` and `TimeRange` are half-open `[start, end)`.** `checkIn.for(3, 'days')` subtracts 1 day from `end` (`'2026-09-01/2026-09-03'` = 3 days). For `< end` DB queries, use `dt.range('month')` (`[Nov 1 00:00, Dec 1 00:00)`) over `endOf('month')` (`.999Z`). `TimeRange` wraps midnight when `end < start`; `Time.until()` stays signed within `00:00`–`23:59`.

```js
// ❌ date('2026-09-01').to(date('2026-09-01').plus(3, 'days')) -> 4 inclusive days
// ✅
const stay = date('2026-09-01').for(3, 'days'); // '2026-09-01/2026-09-03'
const { start, end } = now('UTC').range('month'); // >= start AND < end
const nightShift = time('22:00').to('06:00'); // wraps midnight (8 hours)
```

**6. `Duration` keeps written fields until `.balance()`, totals via `.total(unit)`/`.as(unit)` (never `.in()`), and refuses `days(1).minus(hours(1))`.** No `.normalize()`. Unanchored `.balance()` carries clock units up to `'hour'` (`hours(30)` stays `PT30H`) and months into years; anchored spans from `a.until(b)` default to `'day'` and balance up to `'year'` (`a.until(b).balance('year')`). Opposing signs across days/hours throw `conflictingSigns`; unanchored `months`/`years` throw `missingAnchor` in `.total()` or `compare()`.

```js
// ❌ minutes(90).normalize() -> TypeError; days(1).minus(hours(1)) -> conflictingSigns
// ✅
minutes(90).balance(); // Duration(PT1H30M); hours(36).total('days') -> 1.5
dt.plus(1, 'day').minus(1, 'hour'); // DST-accurate chaining
date('2026-01-15').until('2026-04-15', 'days'); // 90
```

**7. `0`-arg `.locale()` is a getter; `1`-arg `.locale(tag)` clones and parses HTTP `Accept-Language`.** `undefined` and `'*'` are safe (sorts `;q=`, drops `*` and `q=0`, converts `'en_US'` -> `'en-US'`). Locale drives default `weekStart`; pass `'monday'` to `startOf('week', 'monday')` for locale-independent week keys (`weekOfYear` is always ISO Monday).

```js
// ❌ configure({ locale: req.headers['accept-language'] }) -> leaks across requests
// ✅
const local = datetime(row.at, user.zone).locale(req.headers['accept-language']);
const isoWeekKey = local.date.startOf('week', 'monday').toString();
```

**8. `<`, `>`, `-` work only on `DateTime` and fixed `Duration`; non-instants throw `unsupportedComparison`, there is no `.isValid()`, and production strips `err.message` prose.** Compare `CalendarDate`, `Time`, `YearMonth`, and ranges with `.isBefore()`, `.isAfter()`, `.equals()`, or `compare(a, b)` (`compare(date, datetime)` throws `conflictingKinds`). Branch on `err.code` and `err.at`.

```js
// ❌ date('2026-01-01') < date('2026-02-01') -> RangeError [unsupportedComparison]
// ✅
date('2026-01-01').isBefore('2026-02-01');
try { datetime(input, zone); } catch (err) { if (err?.code === 'unknownZone') { /* err.at */ } }
```

---

## Choosing the Right Noun

Named exports from `'native-dates'`: all 9 classes, factories, guards (`isDateTime`..`isTimeRange`), `Symbol.for` brand keys (`IS_DATE_TIME`..`IS_TIME_RANGE`, `IS_RANGE`), `monthNames`, `weekdayNames`, `dayOfWeek`, `compare`, `earliest`, `latest`, `kindOf`, `configure` (`weekStart` is an instance getter and `configure` key, not a function).

| Class | Factories | Wraps | Key rule |
|---|---|---|---|
| `DateTime` | `datetime(in, opts?)`, `now(z?)`, `startOfToday(z?)`, `endOfToday(z?)` | `Temporal.ZonedDateTime` | `<`/`valueOf()` use `epochMilliseconds`; 0-arg throws `missingDateTime` |
| `CalendarDate` | `date(in, opts?)`, `date(y, m, d)`, `today(z?)`, `tomorrow(z?)`, `yesterday(z?)` | `Temporal.PlainDate` | Refuses clock units (`unsupportedUnit`); `date(2026, 11)` -> `missingDay` |
| `Time` | `time(in, opts?)`, `time(h, m?, s?)` | `Temporal.PlainTime` | Wraps mod 24h; `time(9)` -> `09:00` |
| `Duration` | `duration(in, unitOrOpts?)`, `years(n)`..`milliseconds(n)` | `Temporal.Duration` | 8 unit helpers (`years`..`milliseconds`); `duration(n, 'us' \| 'ns')` for sub-ms |
| `MonthDay` | `monthDay(in, opts?)`, `monthDay(m, d)`, `dayMonth(in, opts?)`, `dayMonth(d, m)` | `Temporal.PlainMonthDay` | Unordered (`equals()`, `fallsOn()`); Feb 29 -> Feb 28 in non-leap years |
| `YearMonth` | `yearMonth(in, opts?)`, `monthYear(in, opts?)`, `yearMonth(y, m)`, `monthYear(m, y)` | `Temporal.PlainYearMonth` | `years`/`quarters`/`months` only; `monthYear('11/26')` adds `YearMonth.century` (`2000`) |
| `DateRange`, `DateTimeRange`, `TimeRange` | `dateRange`/`datetimeRange`/`timeRange(s, e?, opts?)`, `pt.to(e)`, `pt.for(n, u)`, `pt.range(u)` | Endpoint pair | `DateRange` `[start, end]`; `DateTimeRange`/`TimeRange` `[start, end)` |

### Cross-Noun Invariants

- **Units:** Singular, plural, or short: `'y'`/`'yr'`, `'q'`/`'qtr'`, `'M'`/`'mo'` (month) vs `'m'`/`'min'` (minute), `'w'`/`'wk'`, `'d'`, `'h'`/`'hr'`, `'s'`/`'sec'`, `'ms'`, `'us'`/`'µs'`, `'ns'`.
- **Options (`opts`):** Bare `zone` string (`'+05:30'`, `'UTC'`, `'America/New_York'`) or `{ zone, locale, disambiguation, loose, dayFirst }` (`duration` takes unit or `{ locale, loose }`; `loose`/`dayFirst` need `@native-dates/plugins/loose`).
- **Shared surface:** `toString()`/`toJSON()` (ISO wire: `'start/end'` on ranges; `.sssZ` on `DateTime`, expanding to 6/9 digits when µs/ns nonzero), lazy `.text`, `.locale()`/`.locale(tag)` (alias `lang`, propagated across chains), `equals()`. Ordered nouns add `isBefore`, `isAfter`, `isSame(other, unit?, firstDay?)` (no `unit` -> `equals()`), `plus`/`add`, `minus`/`subtract`, `set(field, val)`/`set(obj)`, `until`/`since(other, unit?)` (no `unit` -> anchored `Duration`; with `unit` -> float `Number`). Non-range nouns have `toTemporal()`.
- **Strict parsing:** Core accepts ISO and unambiguous year-first strings with non-Latin/non-colon separators (`'2026/11/16'`, `'2026. 11. 16.'`, `'2026年11月16日'`, `'2026년 11월 16일'`), refusing locale-ambiguous slash/dot dates (`'11/16/2026'`) unless `{ loose: true }` is loaded (only explicit `monthYear('11/26')` / `monthDay('10/17')` read slash pairs in core).
- **Coercion, overflow & DST:** Binary methods (`equals`, `isBefore`, `isAfter`, `isSame`, `until`, `since`, `from`, `to`, `on`, `at`, `contains`) coerce valid factory inputs (unzoned inputs on `DateTime` resolve in `this.zone`). Explicit invalid fields throw (`{ month: 2, day: 30 }` -> `invalid*`, `set('day', 31)` in Feb -> `cannotSet`); calendar steps (`Jan 31 + 1mo`) and `set` changing `month`/`year` without `day` clamp to month-end. Wall-clock zoning (`datetime()`, `.at()`, `.on()`) defaults to `'compatible'` (gaps forward, folds earlier) and accepts `{ disambiguation: 'compatible' | 'earlier' | 'later' | 'reject' }` (`'reject'` -> `invalidDateTime`). Date-only strings in `datetime('2026-11-16', zone)` start at `00:00`.
- **Conversions:** `.date`, `.time`, `.monthDay`, `.yearMonth`, `date.at(time = '00:00', opts?)`, `time.on(date, opts?)`, `monthDay.in(year)`, `yearMonth.on(day)` (`.start`/`.end`), `range.in(zone)`, or `.as('date' | 'time' | 'datetime' | 'monthDay' | 'yearMonth' | 'duration')`.

---

## DateTime

```js
const slot = datetime('2026-11-16T09:30', 'America/Los_Angeles').plus(2, 'days').at('14:17').round(15, 'minutes').in('Europe/Berlin');
```

- **Inputs:** ISO strings (`'2026-11-16'`, `'2026-11-16T09:30'`, `'...Z'`, `'...-08:00[America/Los_Angeles]'`), year-first strings (`'2026/11/16 9:30'`, `'2026年11月16日 14:30'`), epoch ms (`Number`, truncated), `Date`, fields object, `CalendarDate`, `DateTime`, or `Temporal.{ZonedDateTime,Instant,PlainDateTime,PlainDate}` (non-ISO calendars convert to ISO day). Nullish throws `missingDateTime`.
- **Fields & predicates:** `year`, `month` (`1`–`12`), `day`, `dayOfWeek` (`1`–`7`), `hour` (`0`–`23`), `minute`, `second`, `millisecond`, `microsecond`, `nanosecond`, `zone`, `offset`, `epochSeconds`, `epochMilliseconds`, `epochNanoseconds` (`BigInt`), `weekStart`, `quarter`, `dayOfYear`, `weekOfYear` (ISO), `daysInMonth`, `daysInYear`, `hoursInDay` (`23`/`24`/`25`), `isLeapYear()`, `isWeekday()`, `isWeekend()`, `isPast()`, `isFuture()`, `isToday()`, `isTomorrow()`, `isYesterday()`.
- **Methods:** `at(time, opts?)` (wall clock in `this.zone`), `in(zone)` (same instant, new zone), `startOf`/`endOf(unit, firstDay?)` (`endOf` steps back 1 ms to `.999`, or 1 ns for `us`/`ns`), `startOfNext`/`startOfPrevious(unitOrWeekday, firstDay?)`, `next`/`previous(weekdayOrMonthDay)`, `round`/`floor`/`ceil(unit | (inc, unit))` (half-expand; 2 args for `inc > 1`, never `'15m'`; `inc` must divide parent unit), `until`/`since` (`largestUnit: 'day'`), `from(other?, locale?)` (alias `formatRelative`; `"in 2 days"` when `this > other`), `fromNow(locale?)`, `to`/`for`/`range`, `toJSDate()`.

---

## CalendarDate

```js
const due = today('America/New_York').plus(2, 'weeks').next('friday');
```

- **Inputs:** Year-first strings, `(y, m, d)`, `{ year, month, day }`, `DateTime`, `Date`, instant strings (in `zone`), or `Temporal.PlainDate`. Bare numbers throw `invalidDate`.
- **Methods:** Refuses clock units (`unsupportedUnit`) and has no `round()`/`floor()`/`ceil()`. Shares `DateTime`'s calendar getters, boundaries, `until`/`since`, `isPast`/`isFuture`/`isToday`/`isTomorrow`/`isYesterday(zone?)`, `from`/`fromNow` (on servers pass `d.from(today(user.zone), locale)`), `.through(end)` (alias for `.to(end)`), and `.at(time = '00:00', opts?)` -> `DateTime` (configured/system zone when `opts` omitted). `.every(step, unit?, zone?)` and `.split`/`.splitBy(step, unit?, zone?)` accept clock units across that half-open zoned day and return `DateTime[]`/`DateTimeRange[]`.

---

## Time

```js
const scheduled = time('9:30am').plus(45, 'minutes').round(15, 'minutes').on('2026-11-16', 'America/Chicago');
```

- **Inputs:** `'09:30'`, `'14h30'`, `'14 h 30'`, `'9am'`, `'5:30:15 pm'`, `time(h, m?, s?)`, `{ hour, minute }`, `DateTime`, `Date`, instant strings (in `zone`), or `Temporal.PlainTime`. Bare `'14h'` throws (duration).
- **Methods:** `plus`/`minus` wrap mod 24h (`set` rejects out-of-range clock fields with `cannotSet`); `startOf`/`endOf`/`startOfNext`/`startOfPrevious` (clock units), `round`/`floor`/`ceil`, `until`/`since` (`00:00`–`23:59`, `largestUnit: 'hour'`), `to`/`for`, `on(day, opts?)` -> `DateTime`.

---

## Duration

```js
const span = duration('2h 45m').plus(30, 'minutes').balance(); // 3h 15m; span.total('hours') -> 3.25
```

- **Inputs:** ISO 8601 (`'PT1H30M'`, `'-P2D'`), phrases (`'1h 30m'`, `'2 weeks, 3 days'`, `'90 mins'`, `'1.5 hours'` -> spills to ns), `(n, unit)`, fields object, or `Temporal.Duration`.
- **Surface:** `years`..`nanoseconds`, `sign` (`-1 | 0 | 1`), `anchor` (set by `until`/`since`, not manually), `isZero()`, `isNegative()`, `toFields()`, `plus`/`minus` (`1y = 12mo`, `1w = 7d`), `times(n)`, `negated()`, `abs()`, `balance(largestUnit?)` (unanchored default `'hour'`; anchored `'day'`), `round(smallestUnit)` (single unit; calendar units need `anchor`), `total(unit)`/`as(unit)` (float `Number`), `toMilliseconds()`/`valueOf()`, `compare()`, `format(style = 'long', locale?)` (`'long' | 'short' | 'narrow' | 'digital'` only; others throw `unknownFormat`).

---

## MonthDay and YearMonth

```js
monthDay('02-29').fallsOn('2026-02-28'); // true (equals() is false); .next('2026-02-28') -> 2027-02-28
monthYear('11/26').format('MM/YY'); // '11/26' ('short' preset -> '11/2026')
```

- **`MonthDay`:** `month`, `day`, `in(year)` -> `CalendarDate`, `next`/`after(from?)` and `previous`/`last`/`before(from?)` (`from` defaults to today), `fallsOn`/`isOn(day)` (Feb 29 matches Feb 28 in non-leap years) vs exact `equals(other)` (order-ambiguous slash/dot strings throw in `equals()`), `isToday`/`isTomorrow`/`isYesterday(zone?)`. Hyphenated `'MM-DD'` is always month-first even in `dayMonth('10-17')`.
- **`YearMonth`:** Year-first strings (`'2026-11'`, `'2026/11'`, `'2026年11月'`, `'2026. 11.'`), `(y, m)`, `{ year, month }`, date/timestamp inputs (`monthYear('11/26')` reads month-first). Has `year`, `month`, `quarter`, `daysInMonth`, `daysInYear`, `isLeapYear()`, `start`, `end`, `on(day)`, `plus`/`minus` (`years`/`quarters`/`months`), `contains`/`includes(day)`, `isPast`/`isFuture(zone?)`, `until`/`since` (`largestUnit: 'year'`).

---

## DateRange, DateTimeRange, and TimeRange

```js
const sprint = date('2026-11-02').for(2, 'weeks'); // '2026-11-02/2026-11-15'
sprint.split(1, 'week'); // [DateRange('2026-11-02/2026-11-08'), DateRange('2026-11-09/2026-11-15')]
```

- **Construction:** `pt.to(end)`, `pt.for(n, unit)`/`pt.for(dur)` (explicit durations only), `date.through(end)`, `pt.range(unit, firstDay?)`, or `dateRange`/`datetimeRange`/`timeRange` with `(start, end, opts?)` or `(intervalStr, opts?)` (`'2026-09-01/2026-09-07'`, `'2026-09-01 to 2026-09-07'`, `'09:00-17:00'`).
- **Ops:** `kind` (`'date' | 'datetime' | 'time'`), `start`, `end`, `duration` (inclusive on `DateRange`, e.g. `P3D` for 3 days), `isEmpty()`, `contains`/`includes(ptOrRange)`, `overlaps(other)`, `intersection(other)` (`null` or range; `unsupportedIntersection` on double overnight overlap), `format(spec?, locale?)` (`Intl` range format on presets/options; `'start – end'` on tokens).
- **Iteration, count & zone:** `every(step, unit?)` -> `Array` (includes `end` on `DateRange`, excludes `end` on `DateTimeRange`/`TimeRange`; `step` is unit `'day'`, phrase `'30m'`, `Duration`, or `(n, unit)` with `n > 0`), `DateRange.count(kind = 'days')` (`'days'`, `'weekdays'`, `'weekends'`, or weekday like `'mondays'`, O(1)), `split`/`splitBy(step, unit?)` (clips remainder at `end`), `in(zone)` (lifts inclusive `DateRange` to half-open `DateTimeRange` `[start 00:00, (end + 1d) 00:00)`; `unsupportedZone` on `TimeRange`).

---

## format, monthNames, and weekdayNames

Point, partial, and range `.format(spec?, locale?)` takes 4 `spec` forms (`Duration.format`: `'long' | 'short' | 'narrow' | 'digital'` only):

1. **Presets:** `'short'`, `'medium'` (default; `'short'` on `Time`), `'long'`, `'full'`, `'date'`, `'time'`, `'month'`, `'text'`, and Moment `'LT'`/`'LTS'`/`'L'`/`'l'`/`'LL'`/`'ll'`/`'LLL'`/`'lll'`/`'LLLL'`/`'llll'`.
2. **Named formats:** `configure({ formats: { invoice: 'YYYY-MM-DD', receipt: { dateStyle: 'long' } } })` (token string or `Intl` options bag; checked before presets; `.text` and bare `.format()` keep built-ins).
3. **`Intl.DateTimeFormat` options bag:** strips fields absent on the noun.
4. **Tokens** (escape literals in `[brackets]`, bare `'T'` ok; ASCII digits, Gregorian years):

| Tokens | Output |
|---|---|
| `YYYY`, `YY`, `Q` | 4-digit year, 2-digit year, quarter (`1`–`4`) |
| `M`, `MM`, `MMM`, `MMMM` | Month `1`–`12`, `01`–`12`, short/long (inflected after day) |
| `D`, `DD`, `Do`, `DDD`, `DDDD` | Day, padded, ordinal (`'16th'`, `'6.'`, `'6日'`), day of year, 3-digit |
| `E`, `d`, `dd`, `ddd`, `dddd` | ISO `1`–`7` (`7` = Sun), `0`–`6` (`0` = Sun), 2-letter/narrow (`'Mo'`), short, long |
| `W`, `WW` | ISO week (`1`–`53`), padded |
| `H`, `HH`, `h`, `hh`, `a`, `A` | 24h, 12h (`1`–`12`), lower/upper am/pm (locale's own case outside English) |
| `m`, `mm`, `s`, `ss`, `S`, `SS`, `SSS` | Minute, second, fractional digits (`1`–`3`) |
| `Z`, `ZZ`, `z`/`zz`, `zzz`/`zzzz` | Offset `'-08:00'`, `'-0800'`, short/long zone name |
| `X`, `x`, `[text]` | Epoch seconds, epoch ms, literal |

- `monthNames(style = 'long' | 'short', locale?)`: 12 Gregorian names (`0` = Jan..`11` = Dec).
- `weekdayNames(style = 'short' | 'long' | 'narrow', firstDay?, locale?)`: 7 names starting on `firstDay`/`weekStart`/locale (`locale` is **3rd** arg; `'narrow'` matches `dd`).

---

## configure, compare, and Guards

```js
configure({
  zone: 'America/New_York', // null resets
  locale: 'en-US', // null resets
  weekStart: 'monday', // 1..7 or name (null -> locale)
  formats: { sql: 'YYYY-MM-DD HH:mm:ss' }, // null clears
  weekdayNames: { lv: { narrow: { fri: 'Pk', sun: 'Sv' } } },
  ordinals: { fr: (day) => (day === 1 ? '1er' : day) },
});
```

- **`configure()`** (0 args) returns the current settings snapshot (`undefined` for unset keys); setting `formats`, `weekdayNames`, or `ordinals` replaces its table (`null` clears).
- **`compare(a, b)` / `earliest(...items)` / `latest(...items)`:** Compares `DateTime`, `CalendarDate`, `Time`, `YearMonth`, `Duration` (`compare`), or same-kind ranges (rest args or array; no `min`/`max`). Bare `Number` first = epoch ms; bare `Number` after `Time` = hour.
- **`dayOfWeek(input)`:** Maps `'monday'`..`'sunday'`, `'mon'`..`'sun'`, `1`–`7`, or `0` (`7`) to ISO `1`–`7`.
- **Cross-realm guards:** `kindOf(x)` -> `'datetime' | 'date' | 'time' | 'duration' | 'monthDay' | 'yearMonth' | 'dateRange' | 'datetimeRange' | 'timeRange' | undefined`. Guards (`isDateTime`..`isTimeRange`) and `instanceof` use `Symbol.for` brands across realms and duplicate bundles.

---

## Errors

`missing*`, wrong JS types (`invalidPoint`, bare numbers on `date()`), `unsupportedCalendar`, `conflictingKinds`, and `conflictingRanges` throw `TypeError`; malformed strings, out-of-range fields, `cannot*`, `unknown*`, `conflictingSigns`, and other `unsupported*` throw `RangeError` (`dates refused [code] <at>` with `.code` and `.at`):

| Error codes | Thrown when |
|---|---|
| `missingDateTime`, `missingDate`, `missingTime`, `missingMonthDay`, `missingYearMonth`, `missingDay`, `missingPoints`, `missingAnchor`, `missingPlugin`, `missingTemporal` | Nullish input, `date(2026, 11)`, unanchored `months(2).total('days')`, unloaded plugin option, or missing `globalThis.Temporal` in development (`RangeError`; production throws native `ReferenceError`) |
| `invalidDateTime`, `invalidDate`, `invalidTime`, `invalidDuration`, `invalidMonthDay`, `invalidYearMonth`, `invalidRange`, `invalidStep`, `invalidNumber`, `invalidFraction`, `invalidYear`, `invalidDay`, `invalidPoint` | Malformed input, `Feb 30`, rejected DST gap/fold, non-positive step, or `end < start` |
| `cannotAdd`, `cannotSubtract`, `cannotSet`, `cannotRound`, `cannotBalance`, `cannotTotal` | Overflow, invalid `set()` field, or bad rounding increment (`round(7, 'minutes')`) |
| `unknownZone`, `unknownLocale`, `unknownDisambiguation`, `unknownUnit`, `unknownDayOfWeek`, `unknownFormat`, `unknownKind`, `unknownSetting`, `unknownWidth` | Bad zone, BCP 47 tag, `disambiguation`, unit, weekday, token/preset (`'yyyy'`), `as()`/`count()` target, or `configure()` key |
| `unsupportedUnit`, `unsupportedToken`, `unsupportedComparison`, `unsupportedZone`, `unsupportedCalendar`, `unsupportedIntersection` | Absent unit/token, `<`/`-` on non-`DateTime`, `timeRange.in()`, non-ISO partial, or double overnight overlap |
| `conflictingSigns`, `conflictingKinds`, `conflictingRanges` | `days(1).minus(hours(1))`, `compare(date, datetime)`, or mismatched range kind |

---

## Quick Reference

| Coming from `Date` / Moment / Day.js / date-fns / Luxon / Temporal | `native-dates` idiom |
|---|---|
| `new Date()` / `dayjs()` / `DateTime.now()` | `now(zone?)` or `today(zone?)` (`datetime()` throws `missingDateTime`) |
| `d.toISOString()` / `dt.toISO()` | `dt.toJSON()` or `dt.toString()` |
| `dayjs(x).isValid()` / `isValid(d)` | Throws on bad input (`null` with `{ loose: true }` plugin) |
| `addDays(d, 2)` / `format(d, 'yyyy-MM-dd')` | `d.plus(2, 'days')` / `d.format('YYYY-MM-DD')` |
| `moment.tz(x, z)` / `zdt.withTimeZone(z)` | `datetime(x, z)` on parse, `.in(z)` to convert |
| `zdt.with({ hour: 9, minute: 0 })` | `dt.at('09:00')` or `dt.set({ hour: 9, minute: 0 })` |
| `moment.min(a, b)` / `DateTime.max(a, b)` | `earliest(a, b)` / `latest(a, b)` |
| `x.isBetween(a, b)` | `a.to(b).contains(x)` (`[a, b]` date, `[a, b)` datetime/time) |
| `b.diff(a, 'hours', true)` | `a.until(b, 'hours')` (exact float; `Math.trunc` for int) |

**Golden rule: Match the class to the data, chain immutable methods, and pass explicit IANA zones and per-value `.locale()` in server code.**

---

## Related Skills

| Skill | Use when... |
|---|---|
| `native-dates-plugins` | City/abbreviation zones (`'Berlin'`, `'PST'`), `{ loose: true, dayFirst }` parsing, `Date` getters, `@native-dates/polyfill` on Safari/Node 22–25, or custom plugins |
