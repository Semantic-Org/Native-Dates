---
title: Errors
lede: Every invalid input or unsupported operation throws a standard Error carrying a machine-readable code.
updated: 2026-11-12
---

## Error shape

Invalid calls fail immediately instead of returning broken date objects or `NaN` numbers that corrupt downstream math. Every thrown error is a standard JavaScript error carrying two extra properties:

- **`error.code`** holds a stable camelCase identifier such as `'unreadableDate'` or `'unknownZone'`.
- **`error.at`** echoes the offending input or operation target as a string, such as `'2026-02-30'`.

Wrong argument types and mismatched kinds throw a `TypeError`. Impossible dates, unreadable strings, unknown units or zones, and unsupported operations throw a `RangeError`.

```js title="catch.js"
import { date } from 'native-dates';

try {
  date('2026-02-30');
} catch (error) {
  error instanceof RangeError; // true
  error.code; // 'unreadableDate'
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
    if (error.code === 'unreadableDateTime') {
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

Type errors indicate that an argument has the wrong JavaScript type or belongs to a different time concept than expected.

| Code | Thrown by | Cause |
|---|---|---|
| `notADateTime` | `datetime()`, `DateTime` | Input is `null`, `undefined`, or an unsupported type such as a boolean. |
| `notADate` | `date()`, `CalendarDate` | Input is `null`, `undefined`, a bare single number, or an unsupported type. |
| `notATime` | `time()`, `Time` | Input is `null`, `undefined`, or an unsupported type. |
| `notAYearMonth` | `yearMonth()`, `monthYear()`, `YearMonth` | Input is `null`, `undefined`, a single number, a non-ISO calendar, or an unsupported type. |
| `notAMonthDay` | `monthDay()`, `dayMonth()`, `MonthDay` | Input is `null`, `undefined`, a single number, a non-ISO calendar, or an unsupported type. |
| `notADuration` | `duration()`, `Duration`, `plus()`, `minus()` | Input is `null`, `undefined`, an unsupported type, or a unit passed beside a duration that already carries units. |
| `notAPoint` | `compare()`, `earliest()`, `latest()` | Value is not a `DateTime`, `CalendarDate`, `Time`, `YearMonth`, `Date`, Temporal point, or parseable string. |
| `mixedKinds` | `compare()`, `earliest()`, `latest()` | Comparing values of different kinds, such as a `CalendarDate` with a `DateTime`. |
| `mixedRange` | `DateRange`, `DateTimeRange`, `TimeRange` | Passing a range of one kind to another range constructor or factory. |

## RangeError codes

Range errors indicate that a value cannot be parsed, falls outside valid bounds, or asks for an unsupported unit, zone, or operation.

### Parsing and values

| Code | Thrown by | Cause |
|---|---|---|
| `unreadableDateTime` | `datetime()`, `DateTime` | String cannot be parsed as a date-time, or fields contain out-of-range values like February 30. |
| `unreadableDate` | `date()`, `CalendarDate`, `on()`, `in()` | String cannot be parsed as a date, day is omitted, numbers are fractional, or fields are out of range. |
| `unreadableTime` | `time()`, `Time` | String cannot be parsed as a clock time, 12-hour value is outside 1 to 12, or clock fields are out of range. |
| `unreadableYearMonth` | `yearMonth()`, `monthYear()`, `YearMonth` | String cannot be parsed as a year-month, numbers are fractional, or month is outside 1 to 12. |
| `unreadableMonthDay` | `monthDay()`, `dayMonth()`, `MonthDay` | String cannot be parsed as a month-day, ambiguous separator passed to `equals()`, or fields are out of range. |
| `unreadableDuration` | `duration()`, `Duration` | Empty or unparseable duration phrase, invalid ISO 8601 duration, or out-of-range duration fields. |
| `notFinite` | `datetime()`, `duration()`, unit helpers | Numeric input is `NaN`, `Infinity`, `-Infinity`, or an invalid `Date` instance. |
| `mixedSigns` | `duration()`, `Duration` | Duration phrase or fields mix positive and negative units, such as `'1h -30m'`. |
| `fractionalMonth` | `duration()`, `months()`, `times()` | Fractional months or nanoseconds have no smaller fixed unit to spill into. |

### Units, zones, and formats

| Code | Thrown by | Cause |
|---|---|---|
| `unknownUnit` | Arithmetic, rounding, `set()`, `duration()` | Unrecognized unit name or abbreviation. |
| `unknownWeekday` | `weekday()`, `next()`, `previous()`, `configure()` | Weekday string is not recognized or weekday number is outside 1 to 7. |
| `unknownZone` | Factories, `in()`, `configure()` | Unknown IANA time zone ID, malformed UTC offset, or non-object `zoneAliases`. |
| `unknownLocale` | `format()`, `monthNames()`, `weekdayNames()`, `configure()` | Invalid BCP 47 locale tag rejected by `Intl.getCanonicalLocales()`. |
| `unknownFormat` | `format()` | Non-string format spec, unsupported duration style, or unrecognized letters in a token pattern outside `[brackets]`. |
| `noField` | `format()` | Token pattern asks for a field the value lacks, such as `HH` on a `CalendarDate` or `YYYY` on a `Time`. |
| `unknownKind` | `as()` | Target kind is not supported by the receiver. |

### Arithmetic and measurement

| Code | Thrown by | Cause |
|---|---|---|
| `notADateUnit` | `CalendarDate` math, `startOf()`, `endOf()` | Adding, subtracting, or rounding a `CalendarDate` by a clock unit such as hours or minutes. |
| `notATimeUnit` | `Time` math | Adding or subtracting a calendar unit such as days, weeks, months, or years on a `Time`. |
| `notAYearMonthUnit` | `YearMonth` math, `set()` | Adding, subtracting, or setting a unit smaller than a month, such as weeks, days, or hours. |
| `cannotAdd` | `plus()`, `add()` | Addition overflows Temporal's representable date range. |
| `cannotSubtract` | `minus()`, `subtract()`, `remove()` | Subtraction overflows Temporal's representable date range. |
| `cannotSet` | `set()` | Field value is fractional or out of range for that calendar month or clock unit. |
| `cannotRound` | `round()`, `floor()`, `ceil()`, `Time.startOf()` | Unsupported rounding unit, or step increment does not divide evenly into the next unit. |
| `needsAnchor` | `Duration.balance()`, `total()`, `compare()` | Unanchored duration requires a calendar start date to convert or compare months or years. |
| `cannotBalance` | `Duration.balance()` | Balancing a duration overflows or fails Temporal rounding. |
| `cannotTotal` | `Duration.total()`, `until()`, `since()` | Computing a total length overflows or uses an unsupported unit. |
| `noPoints` | `earliest()`, `latest()` | Called with zero arguments or an empty array. |
| `notANumber` | `CalendarDate`, `Time`, `YearMonth`, `MonthDay`, ranges | Numeric coercion via `valueOf()`, unary `+`, `-`, `<`, or `>` on a type with no epoch number. |

### Ranges

| Code | Thrown by | Cause |
|---|---|---|
| `backwards` | `DateRange`, `DateTimeRange`, `to()` | Range `end` is earlier than `start`. |
| `emptyStep` | `points()`, `split()` | Step duration passed to a range walk is zero or negative. |
| `twoPieces` | `TimeRange.intersection()` | Two overnight time ranges overlap in two separate intervals across midnight. |
| `noZone` | `TimeRange.in()` | Calling `in()` on a `TimeRange`, which has no calendar date to place in a zone. |

### Environment and plugins

| Code | Thrown by | Cause |
|---|---|---|
| `noTemporal` | Module load | `globalThis.Temporal` is missing and `@native-dates/polyfill` has not been imported yet. |
| `missingPlugin` | Factories, `configure()` | Using `loose`, `dayFirst`, or `zoneAliases` before importing the matching plugin. |
| `immutable` | `DateTime` legacy setters | Calling a mutating `Date` setter such as `setHours()` when `@native-dates/plugins/legacy-date` is loaded. |
