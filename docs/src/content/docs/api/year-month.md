---
title: YearMonth
kind: class
lede: A calendar year and month with no day, for billing periods, card expiries, and month pickers.
import: import { YearMonth } from 'native-dates'
size: core
updated: 2026-11-12
---

## Creating a YearMonth

Create an instance from an ISO string, year and month numbers, or an existing date with [`yearMonth()`](/api/year-month-fn/), or read card-expiry strings month-first with [`monthYear()`](/api/year-month-fn/#monthyear). Instances are immutable, so every method that changes a value returns a new one.

```js title="create.js"
import { monthYear, yearMonth } from 'native-dates';

const billing = yearMonth('2026-11');
const quarterEnd = yearMonth(2026, 12);
const expiry = monthYear('11/26');
```

Read the year and month off any [calendar date](/api/calendar-date/) or [moment](/api/date-time/) through its `yearMonth` property, or convert inside a chain with `as('yearMonth')`:

```js
import { date, datetime, today } from 'native-dates';

date('2026-11-16').yearMonth.toString(); // '2026-11'
datetime('2026-11-01T02:00:00Z', 'America/Los_Angeles').as('yearMonth').toString(); // '2026-10'
const currentMonth = today().yearMonth;
```

## Properties

Properties read the ISO year, month, and surrounding calendar bounds.

| Property | Type | Description |
|---|---|---|
| `text` | `string` | Locale-formatted month and year, such as `'Nov 2026'`. |
| `year`, `month` | `number` | Calendar year and 1-indexed month from 1 through 12. |
| `quarter` | `number` | Calendar quarter from 1 through 4. |
| `daysInMonth`, `daysInYear` | `number` | Days in this month from 28 to 31, and days in this year as 365 or 366. |
| `start`, `end` | `CalendarDate` | First and last calendar day of this month. |
| `YearMonth.century` | `number` | Base century added to two-digit years in `monthYear()`, defaulting to `2000`. |
| `YearMonth.presets` | `object` | Named format presets read by `format()`, open to custom entries. |

## Arithmetic and fields

Step forward or backward by months, quarters, or years, replace fields, or pick a specific day of the month.

:::note[Month and year units only]
Units smaller than a month throw a `RangeError` because a year-month carries no day. Call `on()` to pick a day first when you need week or day math.
:::

:::entry
### `plus()` :kind[method]

```js signature
ym.plus(amount, unit?): YearMonth
ym.add(amount, unit?): YearMonth
```

Moves forward by years, quarters, or months and returns a new `YearMonth`. Also aliased as `add()`.

**Parameters**

```params
- name: amount
  type: DurationInput
  required: true
  description: Count paired with `unit`, `Duration` instance, duration string, or fields object.
- name: unit
  type: Unit
  description: Month, quarter, or year unit name when `amount` is a number.
```

**Returns**

```returns
type: YearMonth
description: A new `YearMonth` shifted forward on the calendar.
```

```js
const billing = yearMonth('2026-11');

billing.plus(3, 'months').toString(); // '2027-02'
billing.plus('1 year').toString(); // '2027-11'
```
:::

:::entry
### `minus()` :kind[method]

```js signature
ym.minus(amount, unit?): YearMonth
ym.subtract(amount, unit?): YearMonth
ym.remove(amount, unit?): YearMonth
```

Moves backward by years, quarters, or months and returns a new instance. Accepts the same inputs as [`plus()`](#plus), with `subtract()` and `remove()` as aliases.

**Parameters**

```params
- name: amount
  type: DurationInput
  required: true
  description: Count paired with `unit`, `Duration` instance, duration string, or fields object.
- name: unit
  type: Unit
  description: Month, quarter, or year unit name when `amount` is a number.
```

**Returns**

```returns
type: YearMonth
description: A new `YearMonth` shifted backward on the calendar.
```

```js
yearMonth('2026-11').minus(1, 'year').toString(); // '2025-11'
```
:::

:::entry
### `set()` :kind[method]

```js signature
ym.set(fields): YearMonth
ym.set(unit, value): YearMonth
```

Returns a new `YearMonth` with the year, month, or both replaced. Out-of-range months and units smaller than a month throw a `RangeError`.

**Parameters**

```params
- name: fields
  type: Partial<YearMonthFields> | Unit
  required: true
  description: Object with `year` or `month` fields, or a single unit name.
- name: value
  type: number
  description: Whole-number value when passing a unit name.
```

**Returns**

```returns
type: YearMonth
description: A new `YearMonth` with updated calendar fields.
```

```js
const billing = yearMonth('2026-11');

billing.set('month', 2).toString(); // '2026-02'
billing.set({ year: 2028, month: 2 }).daysInMonth; // 29
```
:::

:::entry
### `on()` :kind[method]

```js signature
ym.on(day): CalendarDate
```

Places a whole day number from 1 through 31 in this month and returns a [`CalendarDate`](/api/calendar-date/). Day 31 clamps to the final day of shorter months such as February or April, while numbers outside 1 to 31 throw a `RangeError`.

**Parameters**

```params
- name: day
  type: number | string
  required: true
  description: Whole day of the month from 1 through 31.
```

**Returns**

```returns
type: CalendarDate
description: The `CalendarDate` for that day of the month.
```

```js
yearMonth('2026-11').on(15).toString(); // '2026-11-15'
yearMonth('2026-02').on(31).toString(); // '2026-02-28'
yearMonth('2028-02').on(31).toString(); // '2028-02-29'
```
:::

## Comparison and containment

Compare year-months chronologically or check whether a calendar day falls inside the month. Relational operators like `<` throw an error, while arrays sort cleanly with [`compare()`](/api/compare/) and [boundary helpers](/api/compare/#earliest).

:::entry
### `compare()` :kind[method]

```js signature
ym.compare(other): -1 | 0 | 1
```

Orders this year-month against another, returning negative, zero, or positive numbers for sorting. Passing a full date or timestamp compares against the month it falls in.

**Parameters**

```params
- name: other
  type: YearMonthInput
  required: true
  description: Another `YearMonth` or any input accepted by `yearMonth()`.
```

**Returns**

```returns
type: -1 | 0 | 1
description: "Returns `-1` when earlier, `0` when equal, and `1` when later."
```

```js
yearMonth('2026-05').compare('2026-11'); // -1
yearMonth('2026-11').compare('2026-11-16'); // 0
```
:::

:::entry
### `equals()` :kind[method]

```js signature
ym.equals(other): boolean
```

Returns `true` when both values represent the same year and month.

```js
yearMonth('2026-11').equals(yearMonth(2026, 11)); // true
```
:::

:::entry
### `isBefore()` :kind[method]

```js signature
ym.isBefore(other): boolean
```

Returns `true` when this year-month comes earlier than the other.

```js
yearMonth('2026-10').isBefore('2026-11'); // true
```
:::

:::entry
### `isAfter()` :kind[method]

```js signature
ym.isAfter(other): boolean
```

Returns `true` when this year-month comes later than the other.

```js
yearMonth('2026-12').isAfter('2026-11'); // true
```
:::

:::entry
### `contains()` :kind[method]

```js signature
ym.contains(day): boolean
```

Returns `true` when the given calendar date or timestamp falls inside this year and month.

**Parameters**

```params
- name: day
  type: CalendarDateInput
  required: true
  description: Date string, `CalendarDate`, `DateTime`, fields object, or `Date`.
```

**Returns**

```returns
type: boolean
description: "`true` when `day` falls within this month."
```

```js
const nov = yearMonth('2026-11');

nov.contains('2026-11-16'); // true
nov.contains('2026-12-01'); // false
```
:::

:::entry
### `isPast()` :kind[method]

```js signature
ym.isPast(zone?): boolean
```

Returns `true` once this entire month is earlier than today's month in the given or configured time zone.

```js
yearMonth('2020-01').isPast('UTC'); // true
```
:::

:::entry
### `isFuture()` :kind[method]

```js signature
ym.isFuture(zone?): boolean
```

Returns `true` while this month is still ahead of today's month in the given or configured time zone.

```js
yearMonth('2099-01').isFuture('UTC'); // true
```
:::

:::entry
### `isLeapYear()` :kind[method]

```js signature
ym.isLeapYear(): boolean
```

Returns `true` when this month's calendar year has 366 days.

```js
yearMonth('2028-02').isLeapYear(); // true
yearMonth('2026-02').isLeapYear(); // false
```
:::

## Measuring spans

:::entry
### `until()` :kind[method]

```js signature
ym.until(other): Duration
ym.until(other, unit): number
```

Measures the span from this month to another, returning a negative duration when the target is earlier. The returned [`Duration`](/api/duration/) remembers the start of this month so months and years can be totaled in any unit.

**Parameters**

```params
- name: other
  type: YearMonthInput
  required: true
  description: Target year-month to measure toward.
- name: unit
  type: Unit
  description: Unit name to return the total span in as a floating-point number.
```

**Returns**

```returns
type: Duration | number
description: A `Duration` of years and months, or a number when `unit` is given.
```

```js
const start = yearMonth('2026-03');

start.until('2027-06').toString(); // 'P1Y3M'
start.until('2027-06', 'months'); // 15
```
:::

:::entry
### `since()` :kind[method]

```js signature
ym.since(other): Duration
ym.since(other, unit): number
```

Measures the span elapsed since an earlier year-month. Pass a unit name to get the total as a number.

```js
yearMonth('2026-11').since('2026-05', 'months'); // 6
```
:::

## Formatting and conversion

:::entry
### `format()` :kind[method]

```js signature
ym.format(spec?, locale?): string
```

Formats the year and month using named presets, `Intl` options objects, or built-in token patterns such as `'MM/YY'`. Shared options objects drop day, clock, and zone keys automatically.

Standard and localized presets print only the year and month, and custom styles can be added on `YearMonth.presets`. See [Formatting](/guides/formatting/) for the full preset and token tables.

**Parameters**

```params
- name: spec
  type: FormatSpec
  default: "'medium'"
  description: Preset name such as `'medium'` or `'long'`, `Intl` options object, or token pattern.
- name: locale
  type: Locale
  description: BCP 47 locale tag overriding the configured default for this call.
```

**Returns**

```returns
type: string
description: Formatted month-and-year string.
```

```js
const nov = yearMonth('2026-11');

nov.format('short', 'en-US'); // '11/26'
nov.format('medium', 'en-US'); // 'Nov 2026'
nov.format('long', 'en-US'); // 'November 2026'
nov.format('L', 'en-US'); // '11/2026'
nov.format('MM/YY'); // '11/26'
```
:::

:::entry
### `as()` :kind[method]

```js signature
ym.as('yearMonth'): YearMonth
```

Returns this instance when `'yearMonth'` is requested in generic conversion chains, throwing a `RangeError` for other kinds.
:::

:::entry
### `toString()` :kind[method]

```js signature
ym.toString(): string
ym.toJSON(): string
```

Returns the ISO 8601 year-month string, matching month form inputs in HTML. `toJSON()` returns the same string for JSON serialization.

**Returns**

```returns
type: string
description: ISO 8601 year-month string such as `'2026-11'`.
```

```js
yearMonth(2026, 11).toString(); // '2026-11'
JSON.stringify({ billing: yearMonth(2026, 11) }); // '{"billing":"2026-11"}'
```
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
ym.toTemporal(): Temporal.PlainYearMonth
```

Returns the underlying `Temporal.PlainYearMonth` instance.
:::

:::entry
### `valueOf()` :kind[method]

```js signature
ym.valueOf(): never
```

Throws a `RangeError` so numeric operators never coerce a year-month to a number. Narrow unknown values with `isYearMonth()` or [`kindOf()`](/api/kind-of/).
:::
