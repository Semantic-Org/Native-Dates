---
title: Errors
lede: Every invalid input or unsupported operation throws a standard Error carrying a machine-readable code.
updated: 2026-11-16
---

## Error shape

Invalid calls fail immediately instead of returning broken date objects or `NaN` numbers that corrupt downstream math. Every thrown error is a standard JavaScript error carrying two extra properties:

- **`error.code`** holds a stable camelCase identifier such as `'invalidDate'` or `'unknownZone'`.
- **`error.at`** echoes the offending input or operation target as a string, such as `'2026-02-30'`.

Wrong argument types and mismatched kinds throw a `TypeError`. Impossible dates, unreadable strings, unknown units or zones, and unsupported operations throw a `RangeError`.

```js title="catch.js"
import { date } from 'native-dates';

try {
  date('2026-02-30');
} catch (error) {
  error instanceof RangeError; // true
  error.code; // 'invalidDate'
  error.at; // '2026-02-30'
}
```

During development, `error.message` includes a second line with a plain-English hint explaining how to fix the call. Production builds with `NODE_ENV` set to `'production'` strip those hint strings automatically while keeping the error code and input echo unchanged.

## Handling untrusted input

Inspect `error.code` when you want custom validation messages for specific failure modes, and rethrow unexpected errors:

```js
import { datetime } from 'native-dates';

function parseTimestamp(raw, zone) {
  try {
    return datetime(raw, zone);
  } catch (error) {
    if (error.code === 'invalidDateTime') {
      return null;
    }
    throw error;
  }
}

parseTimestamp('not-a-date', 'UTC'); // null
```

When reading user-typed form fields, query parameters, or CSV cells where unreadable text should return `null`, import [`@native-dates/plugins/loose`](/plugins/loose/) and enable loose mode:

```js
import { date, duration } from 'native-dates';
import '@native-dates/plugins/loose';

date('2026-02-30', { loose: true }); // null
duration('whenever', { loose: true }); // null
```

:::tip[Data errors vs code errors in loose mode]
Loose mode returns `null` only when the input value itself cannot be read. Mistakes in your own call options, such as an unrecognized time zone or a backwards range, still throw so bugs stay visible.
:::

## TypeError codes

Type errors indicate that a required input is missing, has the wrong JavaScript type, or belongs to a different time concept than expected.

| Code | Thrown by | Cause |
|---|---|---|
| `missingDateTime` | `datetime()`, `DateTime` | Input is `null` or `undefined`. |
| `missingDate` | `date()`, `CalendarDate` | Input is `null` or `undefined`. |
| `missingTime` | `time()`, `Time` | Input is `null` or `undefined`. |
| `missingYearMonth` | `yearMonth()`, `monthYear()`, `YearMonth` | Input is `null` or `undefined`. |
| `missingMonthDay` | `monthDay()`, `dayMonth()`, `MonthDay` | Input is `null` or `undefined`. |
| `invalidDateTime` | `datetime()`, `DateTime` | Input is an unsupported type such as a boolean. |
| `invalidDate` | `date()`, `CalendarDate` | Input is a single bare number or an unsupported type. |
| `invalidTime` | `time()`, `Time` | Input is an unsupported type. |
| `invalidYearMonth` | `yearMonth()`, `monthYear()`, `YearMonth` | Input is a single number or an unsupported type. |
| `invalidMonthDay` | `monthDay()`, `dayMonth()`, `MonthDay` | Input is a single number or an unsupported type. |
| `invalidDuration` | `duration()`, `Duration`, `plus()`, `minus()` | Input is `null`, `undefined`, an unsupported type, or a unit passed beside a duration that already carries units. |
| `unsupportedCalendar` | `yearMonth()`, `monthDay()`, `YearMonth`, `MonthDay` | Input is a `Temporal.PlainYearMonth` or `PlainMonthDay` with a non-ISO calendar. |
| `invalidPoint` | `compare()`, `earliest()`, `latest()` | Value is not a `DateTime`, `CalendarDate`, `Time`, `YearMonth`, `Date`, epoch timestamp, Temporal point, or parseable string. |
| `conflictingKinds` | `compare()`, `earliest()`, `latest()` | Comparing values of different kinds, such as a `CalendarDate` with a `DateTime`. |
| `conflictingRanges` | `DateRange`, `DateTimeRange`, `TimeRange` | Passing a range of one kind to another range constructor or factory. |

## RangeError codes

Range errors indicate that a value cannot be parsed, falls outside valid bounds, or asks for an unsupported unit, zone, or operation.

### Parsing and values

| Code | Thrown by | Cause |
|---|---|---|
| `invalidDateTime` | `datetime()`, `DateTime` | String cannot be parsed as a date-time, or fields contain out-of-range values like February 30. |
| `invalidDate` | `date()`, `CalendarDate` | String cannot be parsed as a date, numbers are fractional, or fields are out of range. |
| `missingDay` | `date()`, `CalendarDate` | Numeric `(year, month)` call omits the `day` argument. |
| `invalidTime` | `time()`, `Time` | String cannot be parsed as a clock time, 12-hour value is outside 1 to 12, or clock fields are out of range. |
| `invalidYearMonth` | `yearMonth()`, `monthYear()`, `YearMonth` | String cannot be parsed as a year-month, numbers are fractional, or month is outside 1 to 12. |
| `invalidMonthDay` | `monthDay()`, `dayMonth()`, `MonthDay` | String cannot be parsed as a month-day, ambiguous separator passed to `equals()`, or fields are out of range. |
| `invalidYear` | `MonthDay.in()` | Year passed to `in()` is not an integer or falls outside Temporal's supported year range. |
| `invalidDay` | `YearMonth.on()` | Day passed to `on()` is not an integer from 1 to 31. |
| `invalidDuration` | `duration()`, `Duration` | Empty or unparseable duration phrase, invalid ISO 8601 duration, or out-of-range duration fields. |
| `invalidNumber` | `datetime()`, `duration()`, unit helpers | Numeric input is `NaN`, `Infinity`, `-Infinity`, or an invalid `Date` instance. |
| `conflictingSigns` | `duration()`, `Duration`, `minus()` | Duration mixes positive and negative units that cannot borrow cleanly, such as `'1h -30m'` or unanchored days minus hours. |
| `invalidFraction` | `duration()`, `months()`, `times()` | Fractional months or nanoseconds cannot be converted to a smaller fixed unit. |

### Units, zones, and formats

| Code | Thrown by | Cause |
|---|---|---|
| `unknownUnit` | Arithmetic, rounding, `set()`, `duration()` | Unrecognized unit name or abbreviation. |
| `unknownWeekday` | `dayOfWeek()`, `next()`, `previous()`, `configure()` | Weekday string is not recognized or weekday number is outside 1 to 7. |
| `unknownWidth` | `configure()` | A `weekdayNames` entry names a width other than `narrow`, `short`, or `long`, or leaves the width out. |
| `unknownZone` | Factories, `in()`, `configure()` | Unknown IANA time zone ID, non-string zone, or malformed UTC offset. |
| `invalidZoneAliases` | `configure()` | `zoneAliases` is neither a plain object nor `null`. |
| `unknownLocale` | `locale()`, factories, `format()`, `monthNames()`, `weekdayNames()`, `configure()` | Locale tag, tag list, or `Accept-Language` header contains an invalid language tag. |
| `unknownFormat` | `format()` | Non-string format spec, unsupported duration style, or unrecognized letters in a token pattern outside `[brackets]`. |
| `unsupportedToken` | `format()` | Token pattern asks for a field the value lacks, such as `HH` on a `CalendarDate` or `YYYY` on a `Time`. |
| `unknownKind` | `as()` | Target kind is not supported by the receiver. |

### Arithmetic and measurement

| Code | Thrown by | Cause |
|---|---|---|
| `unsupportedUnit` | `CalendarDate`, `Time`, `YearMonth` | Using clock units on a `CalendarDate`, calendar units on a `Time`, or units smaller than a month on a `YearMonth`. |
| `cannotAdd` | `plus()`, `add()` | Addition overflows Temporal's representable date range. |
| `cannotSubtract` | `minus()`, `subtract()` | Subtraction overflows Temporal's representable date range. |
| `cannotSet` | `set()` | Field value is fractional or out of range for that calendar month or clock unit. |
| `cannotRound` | `round()`, `floor()`, `ceil()`, `Time.startOf()` | Unsupported rounding unit, or step increment does not divide evenly into the next unit. |
| `missingAnchor` | `Duration.balance()`, `total()`, `compare()` | Unanchored duration requires a calendar start date to convert months or years into weeks, days, or clock units. |
| `cannotBalance` | `Duration.balance()` | Balancing a duration overflows or fails Temporal rounding. |
| `cannotTotal` | `Duration.total()`, `until()`, `since()` | Computing a total length overflows or uses an unsupported unit. |
| `missingPoints` | `earliest()`, `latest()` | Called with zero arguments or an empty array. |
| `unsupportedComparison` | `CalendarDate`, `Time`, `YearMonth`, `MonthDay`, ranges | Numeric coercion via `valueOf()`, unary `+`, `-`, `<`, or `>` on a type with no epoch number. |

### Ranges

| Code | Thrown by | Cause |
|---|---|---|
| `invalidRange` | `DateRange`, `DateTimeRange`, `to()` | Range `end` is earlier than `start`. |
| `invalidStep` | `points()`, `split()` | Step duration passed to `points()` or `split()` is zero or negative. |
| `unsupportedIntersection` | `TimeRange.intersection()` | Two overnight time ranges overlap in two separate windows across midnight. |
| `unsupportedZone` | `TimeRange.in()` | Calling `in()` on a `TimeRange`, which has no calendar date to place in a zone. |

### Plugins

| Code | Thrown by | Cause |
|---|---|---|
| `missingPlugin` | Factories, `configure()` | Using `loose`, `dayFirst`, or `zoneAliases` before importing the matching plugin. |
| `immutable` | `DateTime` legacy setters | Calling a mutating `Date` setter such as `setHours()` when `@native-dates/plugins/legacy-date` is loaded. |
