---
title: year-month
kind: plugin
lede: Year-and-month values for billing periods, card expiries, and month pickers, without an invented day.
import: import { yearMonth } from '@native-dates/plugins/year-month'
size: year-month
updated: 2026-11-12
---

## Reading year-month values

Import the plugin to hold a calendar month without pretending it is the first of the month. Loading it also adds `.yearMonth` and `as('yearMonth')` to [calendar dates](/api/calendar-date/) and [zoned datetimes](/api/date-time/).

```js title="year-month.js"
import { date, today } from 'native-dates';
import { monthYear, yearMonth } from '@native-dates/plugins/year-month';

const billing = yearMonth('2026-11');
const expiry = monthYear('11/28');

billing.plus(2, 'months').toString(); // '2027-01'
billing.contains(date('2026-11-16')); // true
expiry.isFuture(); // true
today().as('yearMonth').on(15); // 15th of the current month
```

:::entry
### `yearMonth()` :kind[function]

```js signature
yearMonth(input, options?): YearMonth
yearMonth(year, month): YearMonth
new YearMonth(input, options?)
```

Reads an ISO year-month string, two whole numbers, a fields object, or any date or timestamp with its day dropped. With loose mode from the [loose plugin](/plugins/loose/), it also reads English month names paired with a four-digit year and returns `null` when unreadable.

**Parameters**

```params
- name: input
  type: YearMonthInput | number
  required: true
  description: ISO year-month string, fields object, existing date or timestamp, or the 4-digit `year`.
- name: options
  type: Zone | ReadOptions | number
  description: Time zone or options object when reading a timestamp or loose string, or 1-indexed `month` from 1 to 12.
  options:
    - name: zone
      type: Zone
      description: Time zone used to determine the calendar month of an instant string, `DateTime`, or `Date`.
    - name: loose
      type: boolean
      default: 'false'
      description: Read named months like `'Nov 2026'` and return `null` instead of throwing when unreadable.
```

**Returns**

```returns
type: YearMonth
description: "An immutable `YearMonth`, or `null` when loose mode cannot read `input`."
```

```js
yearMonth('2026-11').toString(); // '2026-11'
yearMonth(2026, 11).toString(); // '2026-11'
yearMonth({ year: 2026, month: 11 }).toString(); // '2026-11'
yearMonth('2026-10-31T23:30:00Z', 'Asia/Tokyo').toString(); // '2026-11'
```
:::

:::entry
### `monthYear()` :kind[function]

```js signature
monthYear(input, options?): YearMonth
monthYear(month, year): YearMonth
```

Reads month-first strings and number pairs in the order printed on payment cards. Two-digit years are added to `YearMonth.century`, defaulting to 2000, while ISO year-month strings still read year-first.

**Parameters**

```params
- name: input
  type: YearMonthInput | string | number
  required: true
  description: Card-style `'MM/YY'` or `'MM/YYYY'` string, 1-indexed month, or any `YearMonthInput`.
- name: options
  type: Zone | ReadOptions | number
  description: Two- or four-digit `year` when passing two numbers, or a zone or options object.
```

**Returns**

```returns
type: YearMonth
description: "An immutable `YearMonth`, or `null` when loose mode cannot read `input`."
```

```js
monthYear('11/26').toString(); // '2026-11'
monthYear('03/2028').toString(); // '2028-03'
monthYear(11, 26).toString(); // '2026-11'
monthYear('2026-11').toString(); // '2026-11'
```
:::

## Properties and calendar facts

Every `YearMonth` instance exposes its fields, month lengths, and boundary dates.

| Member | Type | Description |
|---|---|---|
| `text` | `string` | Locale-formatted month and year, such as `'Nov 2026'`. |
| `year` | `number` | Full calendar year, such as `2026`. |
| `month` | `number` | 1-indexed calendar month from `1` through `12`. |
| `quarter` | `number` | Quarter of the year from `1` through `4`. |
| `daysInMonth` | `number` | Count of days in this month, from `28` through `31`. |
| `daysInYear` | `number` | Count of days in `year`, either `365` or `366`. |
| `start` | `CalendarDate` | First calendar day of the month. |
| `end` | `CalendarDate` | Last calendar day of the month. |
| `isLeapYear()` | `boolean` | Returns `true` when `year` is a leap year. |

```js
const feb = yearMonth('2028-02');

feb.quarter; // 1
feb.daysInMonth; // 29
feb.isLeapYear(); // true
feb.start.toString(); // '2028-02-01'
feb.end.toString(); // '2028-02-29'
```

## Month arithmetic and picking a day

:::tip[Sub-month units throw]
Adding days, weeks, or hours to a `YearMonth` throws a range error instead of silently dropping remainder days. Call `on()` first when you want a specific day of the month.
:::

:::entry
### `plus()` / `minus()` :kind[method]

```js signature
ym.plus(amount, unit?): YearMonth
ym.minus(amount, unit?): YearMonth
```

Moves forward or backward by whole months, quarters, or years. The `add()`, `subtract()`, and `remove()` aliases work identically.

**Parameters**

```params
- name: amount
  type: DurationInput | number
  required: true
  description: Duration value, phrase like `'1 year 2 months'`, fields object, or numeric count.
- name: unit
  type: Unit
  description: Calendar unit when `amount` is a number, from `'month'` up to `'year'`.
```

**Returns**

```returns
type: YearMonth
description: Shifted `YearMonth` instance.
```

```js
const period = yearMonth('2026-11');

period.plus(2, 'months').toString(); // '2027-01'
period.plus(1, 'quarter').toString(); // '2027-02'
period.minus('1 year 2 months').toString(); // '2025-09'
```
:::

:::entry
### `set()` :kind[method]

```js signature
ym.set(fields): YearMonth
ym.set(unit, value): YearMonth
```

Returns a copy with the year, month, or both replaced. Out-of-range months and units smaller than a month throw a `RangeError`.

**Parameters**

```params
- name: fields
  type: Partial<YearMonthFields> | Unit
  required: true
  description: "Object with `year` or `month`, or a unit name."
- name: value
  type: number
  description: Whole-number replacement when `fields` is a unit name.
```

**Returns**

```returns
type: YearMonth
description: Updated `YearMonth` instance.
```

```js
yearMonth('2026-11').set('month', 1).toString(); // '2026-01'
yearMonth('2026-11').set({ year: 2027 }).toString(); // '2027-11'
```
:::

:::entry
### `on()` :kind[method]

```js signature
ym.on(day): CalendarDate
```

Returns the [`CalendarDate`](/api/calendar-date/) for that 1-indexed day of the month. Passing 31 clamps to the last day of shorter months, while numbers below 1 or above 31 throw an error.

**Parameters**

```params
- name: day
  type: number | string
  required: true
  description: Day of the month from `1` through `31`.
```

**Returns**

```returns
type: CalendarDate
description: Calendar date within this year and month.
```

```js
yearMonth('2026-11').on(15).toString(); // '2026-11-15'
yearMonth('2026-02').on(31).toString(); // '2026-02-28'
```
:::

## Comparing, containment, and spans

Core [comparison helpers](/api/compare/) also accept year-month values directly when sorting arrays or picking the earliest or latest month.

:::entry
### `compare()` / `equals()` / `isBefore()` / `isAfter()` :kind[method]

```js signature
ym.compare(other): -1 | 0 | 1
ym.equals(other): boolean
ym.isBefore(other): boolean
ym.isAfter(other): boolean
```

Orders or compares this month against another year-month, an ISO year-month string, or a date or timestamp read as the month it falls in.

**Parameters**

```params
- name: other
  type: YearMonthInput
  required: true
  description: Month, date, or timestamp to compare against.
```

**Returns**

```returns
type: number | boolean
description: "Sort order (-1, 0, or 1) from `compare()`, or a boolean result."
```

```js
const nov = yearMonth('2026-11');

nov.isBefore('2026-12'); // true
nov.equals(date('2026-11-30')); // true
nov.compare('2026-10'); // 1
```
:::

:::entry
### `contains()` / `isPast()` / `isFuture()` :kind[method]

```js signature
ym.contains(day): boolean
ym.isPast(zone?): boolean
ym.isFuture(zone?): boolean
```

`contains()` checks whether a date or timestamp falls within this calendar month. Past and future checks compare against the full month in the target zone, so the current month is neither past nor future.

**Parameters**

```params
- name: day
  type: CalendarDateInput
  description: Date or timestamp tested by `contains()`.
- name: zone
  type: Zone
  description: Time zone used by `isPast()` and `isFuture()` to determine the current month.
```

**Returns**

```returns
type: boolean
description: Boolean check result.
```

```js
const current = today().yearMonth;

current.contains(today()); // true
current.isPast(); // false
current.isFuture(); // false
current.minus(1, 'month').isPast(); // true
```
:::

:::entry
### `until()` / `since()` :kind[method]

```js signature
ym.until(other, unit?): Duration | number
ym.since(other, unit?): Duration | number
```

Measures the span between two year-month values. Without a unit, it returns a [`Duration`](/api/duration/) of years and months, and passing a unit returns the signed numeric total.

**Parameters**

```params
- name: other
  type: YearMonthInput
  required: true
  description: Target or starting month.
- name: unit
  type: Unit
  description: Unit name to return a numeric count instead of a `Duration`.
```

**Returns**

```returns
type: Duration | number
description: Span as a `Duration`, or a signed number when `unit` is given.
```

```js
const start = yearMonth('2026-11');

start.until('2028-01').toString(); // 'P1Y2M'
start.until('2028-01', 'months'); // 14
start.since('2026-01', 'months'); // 10
```
:::

## Formatting and conversion

:::entry
### `format()` :kind[method]

```js signature
ym.format(spec?, locale?): string
```

Formats the year and month through `Intl`, printing only year, month, and era parts. Accepts any preset name, an options object, custom entries on `YearMonth.presets`, or token patterns when the [tokens plugin](/plugins/tokens/) is loaded.

**Parameters**

```params
- name: spec
  type: FormatSpec
  default: "'medium'"
  description: Preset name such as `'short'` or `'long'`, `Intl.DateTimeFormatOptions`, or token pattern.
- name: locale
  type: string
  description: BCP 47 locale tag overriding the configured default for this call.
```

**Returns**

```returns
type: string
description: Localized month and year string.
```

```js
import '@native-dates/plugins/tokens';

const period = yearMonth('2026-11');

period.format('short', 'en-US'); // '11/26'
period.format('medium', 'en-US'); // 'Nov 2026'
period.format('long', 'en-US'); // 'November 2026'
period.format('MM/YY'); // '11/26'
```
:::

:::entry
### `isYearMonth()` :kind[guard]

```js signature
isYearMonth(value): value is YearMonth
```

Returns true when the given value is a `YearMonth` instance, including across realms and bundles. Core [`kindOf()`](/api/kind-of/) returns `'yearMonth'` for these instances.

```js
import { kindOf } from 'native-dates';
import { isYearMonth } from '@native-dates/plugins/year-month';

isYearMonth(yearMonth('2026-11')); // true
isYearMonth('2026-11'); // false
kindOf(yearMonth('2026-11')); // 'yearMonth'
```
:::

### Serialization and interop

| Method | Return | Description |
|---|---|---|
| `as('yearMonth')` | `YearMonth` | Returns this `YearMonth` in generic conversion chains, matching `d.as('yearMonth')` and `dt.as('yearMonth')`. |
| `toString()`, `toJSON()` | `string` | ISO 8601 `'YYYY-MM'` string, such as `'2026-11'`. |
| `toTemporal()` | `Temporal.PlainYearMonth` | Underlying ISO `Temporal.PlainYearMonth` instance. |
| `valueOf()` | `never` | Throws a `RangeError` so numeric operators never silently coerce a month to a number. |
