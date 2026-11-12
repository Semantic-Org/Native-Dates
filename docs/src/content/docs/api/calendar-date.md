---
title: CalendarDate
kind: class
lede: A calendar date with no time of day and no time zone.
import: import { CalendarDate } from 'native-dates'
size: core
updated: 2026-11-12
---

## Creating a CalendarDate

Create an instance from an ISO string, year-month-day numbers, or an existing value with [`date()`](/api/date-fn/), or read the current day with [`today()`](/api/date-fn/#today). Helpers for [tomorrow](/api/date-fn/#tomorrow) and [yesterday](/api/date-fn/#yesterday) work the same way, and every method returns a new immutable instance.

```js title="create.js"
import { date, today, tomorrow } from 'native-dates';

const birthday = date('2026-05-10');
const launch = date(2026, 11, 16);
const current = today();
const nextDay = tomorrow('America/New_York');
```

Because a calendar date has no clock or time zone, May 10 stays May 10 for every user regardless of where they live. You can also read the local calendar date off any [`DateTime`](/api/date-time/):

```js
import { datetime } from 'native-dates';

const flight = datetime('2026-11-16T23:30:00Z', 'Asia/Tokyo');
flight.date.toString(); // '2026-11-17'
```

## Properties

Properties read the ISO calendar fields directly.

| Property | Type | Description |
|---|---|---|
| `text` | `string` | Locale-formatted calendar date, such as `'Nov 16, 2026'`. |
| `year`, `month`, `day` | `number` | Calendar year, month (1–12), and day of month (1–31). |
| `weekday` | `number` | ISO day of the week, from 1 for Monday through 7 for Sunday. |
| `quarter` | `number` | Calendar quarter (1–4). |
| `weekOfYear`, `dayOfYear` | `number` | ISO week number (1–53) and day of the year (1–366). |
| `daysInMonth`, `daysInYear` | `number` | Number of days in the current month (28–31) and year (365 or 366). |

## Combining and fields

Attach a time of day in a time zone to create a specific moment, or replace individual calendar fields.

:::entry
### `at()` :kind[method]

```js signature
d.at(time?, zone?): DateTime
```

Combines this calendar date with a time of day in a time zone and returns a [`DateTime`](/api/date-time/). Omitting the time defaults to midnight at the start of the day.

**Parameters**

```params
- name: time
  type: TimeInput
  default: "'00:00'"
  description: Time string such as `'9:30am'`, `Time` instance, fields object, or `Date`.
- name: zone
  type: Zone
  description: IANA time zone name, fixed UTC offset, or `'UTC'`. Defaults to the configured zone.
```

**Returns**

```returns
type: DateTime
description: A new `DateTime` on this date at `time` in `zone`.
```

```js
const day = date('2026-11-16');

day.at('9:30am', 'America/Los_Angeles').toString(); // '2026-11-16T17:30:00.000Z'
day.at(undefined, 'UTC').toString(); // '2026-11-16T00:00:00.000Z'
```
:::

:::entry
### `set()` :kind[method]

```js signature
d.set(fields): CalendarDate
d.set(unit, value): CalendarDate
```

Returns a new `CalendarDate` with one or more calendar fields replaced. Out-of-range dates such as February 30 throw a `RangeError` instead of rolling into the next month.

**Parameters**

```params
- name: fields
  type: DateTimeFields | DateUnit
  required: true
  description: Object with `year`, `month`, or `day` fields, or a single unit name.
- name: value
  type: number
  description: Whole-number value for the given `unit`.
```

**Returns**

```returns
type: CalendarDate
description: A new `CalendarDate` with updated calendar fields.
```

```js
const due = date('2026-11-16');

due.set('day', 1).toString(); // '2026-11-01'
due.set({ month: 12, day: 31 }).toString(); // '2026-12-31'
```
:::

## Arithmetic and boundaries

Step across calendar units, snap to period boundaries, or move to a nearby weekday. Clock units such as hours and minutes throw a `RangeError` because a calendar date has no clock.

:::note[Month-end clamping]
Adding months or years clamps to the last valid day of the target month rather than overflowing into the next one. Adding one month to January 31 lands on February 28, or February 29 in a leap year.
:::

:::entry
### `plus()` :kind[method]

```js signature
d.plus(amount, unit?): CalendarDate
d.add(amount, unit?): CalendarDate
```

Moves forward by years, quarters, months, weeks, or days and returns a new `CalendarDate`. Also aliased as `add()`.

**Parameters**

```params
- name: amount
  type: DurationInput
  required: true
  description: Count paired with `unit`, `Duration` instance, duration string, or fields object.
- name: unit
  type: DateUnit
  description: Calendar unit name when `amount` is a number, such as `'days'` or `'months'`.
```

**Returns**

```returns
type: CalendarDate
description: A new `CalendarDate` shifted forward on the calendar.
```

```js
const billing = date('2026-01-31');

billing.plus(1, 'month').toString(); // '2026-02-28'
billing.plus('2 weeks').toString(); // '2026-02-14'
```
:::

:::entry
### `minus()` :kind[method]

```js signature
d.minus(amount, unit?): CalendarDate
d.subtract(amount, unit?): CalendarDate
d.remove(amount, unit?): CalendarDate
```

Moves backward by a calendar duration. Accepts the same inputs as [`plus()`](#plus), and is also aliased as `subtract()` and `remove()`.

**Parameters**

```params
- name: amount
  type: DurationInput
  required: true
  description: Count paired with `unit`, `Duration` instance, duration string, or fields object.
- name: unit
  type: DateUnit
  description: Calendar unit name when `amount` is a number.
```

**Returns**

```returns
type: CalendarDate
description: A new `CalendarDate` shifted backward on the calendar.
```

```js
const launch = date('2026-03-01');

launch.minus(1, 'day').toString(); // '2026-02-28'
launch.minus({ weeks: 2, days: 1 }).toString(); // '2026-02-14'
```
:::

:::entry
### `startOf()` :kind[method]

```js signature
d.startOf(unit, firstDay?): CalendarDate
```

Returns the first day of the calendar unit containing this date. Week boundaries begin on Monday unless configured otherwise with [`configure()`](/api/configure/) or overridden with `firstDay`.

**Parameters**

```params
- name: unit
  type: DateUnit
  required: true
  description: Calendar unit from `'year'` down to `'day'`.
- name: firstDay
  type: Weekday
  description: First day of the week when rounding to a week, such as `'sunday'` or `7`.
```

**Returns**

```returns
type: CalendarDate
description: The first calendar day of `unit`.
```

```js
const wed = date('2026-11-18');

wed.startOf('month').toString(); // '2026-11-01'
wed.startOf('quarter').toString(); // '2026-10-01'
wed.startOf('week').toString(); // '2026-11-16'
wed.startOf('week', 'sunday').toString(); // '2026-11-15'
```
:::

:::entry
### `endOf()` :kind[method]

```js signature
d.endOf(unit, firstDay?): CalendarDate
```

Returns the final day of the calendar unit containing this date.

**Parameters**

```params
- name: unit
  type: DateUnit
  required: true
  description: Calendar unit from `'year'` down to `'day'`.
- name: firstDay
  type: Weekday
  description: First day of the week when `unit` is `'week'`.
```

**Returns**

```returns
type: CalendarDate
description: The last calendar day of `unit`.
```

```js
date('2026-02-10').endOf('month').toString(); // '2026-02-28'
date('2028-02-10').endOf('month').toString(); // '2028-02-29'
```
:::

:::entry
### `next()` :kind[method]

```js signature
d.next(weekday): CalendarDate
```

Moves forward to the next given weekday after this date. If it is already that weekday, it advances a full week.

**Parameters**

```params
- name: weekday
  type: Weekday
  required: true
  description: Weekday name such as `'friday'`, three-letter prefix, or ISO number (1–7).
```

**Returns**

```returns
type: CalendarDate
description: A new `CalendarDate` 1 to 7 days later.
```

```js
const mon = date('2026-11-16');

mon.next('friday').toString(); // '2026-11-20'
mon.next('monday').toString(); // '2026-11-23'
```
:::

:::entry
### `previous()` :kind[method]

```js signature
d.previous(weekday): CalendarDate
```

Moves back to the most recent given weekday before this date. If it is already that weekday, it steps back a full week.

**Parameters**

```params
- name: weekday
  type: Weekday
  required: true
  description: Weekday name, three-letter prefix, or ISO number (1–7).
```

**Returns**

```returns
type: CalendarDate
description: A new `CalendarDate` 1 to 7 days earlier.
```

```js
date('2026-11-16').previous('friday').toString(); // '2026-11-13'
```
:::

## Comparing dates

Compare calendar dates directly or pass any input accepted by [`date()`](/api/date-fn/).

:::warning[Avoid numeric comparison operators]
A calendar date is not a timestamp, so numeric operators throw a `RangeError` rather than coercing to milliseconds. Compare dates with methods like `isBefore()`, or sort arrays with [`compare()`](/api/compare/).
:::

:::entry
### `equals()` :kind[method]

```js signature
d.equals(other): boolean
```

Returns `true` when both values represent the same calendar year, month, and day.

**Parameters**

```params
- name: other
  type: CalendarDateInput
  required: true
  description: Another `CalendarDate` or any input accepted by `date()`.
```

**Returns**

```returns
type: boolean
description: '`true` if both values represent the same calendar day.'
```

```js
const due = date('2026-11-16');

due.equals('2026-11-16'); // true
due.equals(date(2026, 11, 16)); // true
```
:::

:::entry
### `isBefore()` :kind[method]

```js signature
d.isBefore(other): boolean
```

Returns `true` if this date is earlier on the calendar than the other.

```js
date('2026-11-15').isBefore('2026-11-16'); // true
```
:::

:::entry
### `isAfter()` :kind[method]

```js signature
d.isAfter(other): boolean
```

Returns `true` if this date is later on the calendar than the other.

```js
date('2026-11-17').isAfter('2026-11-16'); // true
```
:::

:::entry
### `isSame()` :kind[method]

```js signature
d.isSame(other, unit?, firstDay?): boolean
```

Checks whether another date falls in the same calendar unit, such as the same month or week. Calling `isSame()` without a unit checks whether both values are the exact same day.

**Parameters**

```params
- name: other
  type: CalendarDateInput
  required: true
  description: Date to compare against.
- name: unit
  type: DateUnit
  description: Calendar unit to compare, from `'year'` down to `'day'`.
- name: firstDay
  type: Weekday
  description: First day of the week when `unit` is `'week'`.
```

**Returns**

```returns
type: boolean
description: '`true` when both dates fall in the same `unit`.'
```

```js
const wed = date('2026-09-09');

wed.isSame('2026-09-30', 'month'); // true
wed.isSame('2026-09-06', 'week'); // false
wed.isSame('2026-09-06', 'week', 'sunday'); // true
```
:::

### Calendar predicates

Relative day checks accept an optional time zone because which calendar day is today depends on where you stand. When omitted, they use the default zone from [`configure()`](/api/configure/).

| Method | Type | Description |
|---|---|---|
| `isToday(zone?)`, `isTomorrow(zone?)`, `isYesterday(zone?)` | `boolean` | Whether this date matches today, tomorrow, or yesterday in the given or configured zone. |
| `isPast(zone?)`, `isFuture(zone?)` | `boolean` | Whether this date is earlier or later than today in the given or configured zone. |
| `isWeekday()`, `isWeekend()` | `boolean` | Monday through Friday vs. Saturday and Sunday. |
| `isLeapYear()` | `boolean` | Whether this date's year has 366 days. |

## Measuring spans

:::entry
### `until()` :kind[method]

```js signature
d.until(other): Duration
d.until(other, unit): number
```

Measures the calendar span from this date to another, returning a negative duration when the target is earlier. The returned [`Duration`](/api/duration/) remembers this starting date so months and years can be totaled accurately.

**Parameters**

```params
- name: other
  type: CalendarDateInput
  required: true
  description: Target date to measure toward.
- name: unit
  type: Unit
  description: Unit to return the total length in as a floating-point number.
```

**Returns**

```returns
type: Duration | number
description: A `Duration` balanced up to years, or a number when `unit` is given.
```

```js
const start = date('2026-01-01');

start.until('2027-04-05').toString(); // 'P1Y3M4D'
start.until('2027-04-05', 'days'); // 459
start.until('2026-07-01').total('months'); // 6
```
:::

:::entry
### `since()` :kind[method]

```js signature
d.since(other): Duration
d.since(other, unit): number
```

Measures the calendar span elapsed since an earlier date. Pass a unit name to get the total as a number.

```js
date('2026-11-16').since('2026-11-02', 'weeks'); // 2
```
:::

## Formatting and conversion

:::entry
### `format()` :kind[method]

```js signature
d.format(spec?, locale?): string
```

Formats the date using `Intl.DateTimeFormat`. Accepts a preset style, an options object, or a token pattern when [`@native-dates/plugins/tokens`](/plugins/tokens/) is loaded.

**Parameters**

```params
- name: spec
  type: FormatSpec
  default: "'medium'"
  description: Date preset such as `'medium'` or `'month'`, `Intl.DateTimeFormatOptions` object, or token pattern.
- name: locale
  type: string
  description: BCP 47 locale tag overriding the configured default for this call.
```

**Returns**

```returns
type: string
description: Locale-formatted date string.
```

```js
const day = date('2026-11-16');

day.format('short', 'en-US'); // '11/16/26'
day.format('medium', 'en-US'); // 'Nov 16, 2026'
day.format('long', 'en-US'); // 'November 16, 2026'
day.format('full', 'en-US'); // 'Monday, November 16, 2026'
day.format('month', 'en-US'); // 'November 2026'
day.format({ weekday: 'long' }, 'en-US'); // 'Monday'
```
:::

:::entry
### `toString()` :kind[method]

```js signature
d.toString(): string
d.toJSON(): string
```

Returns the date as an ISO 8601 `YYYY-MM-DD` string. `toJSON()` returns the same string for `JSON.stringify()`.

**Returns**

```returns
type: string
description: ISO 8601 date string, such as `'2026-11-16'`.
```

```js
const due = date('2026-11-16');

due.toString(); // '2026-11-16'
JSON.stringify({ due }); // '{"due":"2026-11-16"}'
```
:::

:::entry
### `toJSDate()` :kind[method]

```js signature
d.toJSDate(zone?): Date
```

Returns a native JavaScript `Date` at midnight on this date in the given or configured time zone.
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
d.toTemporal(): Temporal.PlainDate
```

Returns the underlying `Temporal.PlainDate` instance.
:::

:::entry
### `valueOf()` :kind[method]

```js signature
d.valueOf(): never
```

Throws a `RangeError` so numeric operators never silently coerce a calendar date to a number.
:::
