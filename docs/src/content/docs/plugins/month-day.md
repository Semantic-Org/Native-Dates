---
title: month-day
kind: plugin
lede: Month-and-day values for birthdays, anniversaries, and annual holidays, with leap-year handling built in.
import: import { monthDay } from '@native-dates/plugins/month-day'
size: month-day
updated: 2026-11-12
---

## Reading month-day values

Import the plugin to hold a recurring date without inventing a placeholder year. Loading it adds `.monthDay` and `as('monthDay')` to [calendar dates](/api/calendar-date/) and [zoned datetimes](/api/date-time/), and lets `next()` accept a month-day.

```js title="month-day.js"
import { today } from 'native-dates';
import { dayMonth, monthDay } from '@native-dates/plugins/month-day';

const birthday = monthDay('10/17');
const sameDay = dayMonth('17/10');

birthday.equals(sameDay); // true
birthday.in(2027).toString(); // '2027-10-17'
birthday.next(); // upcoming CalendarDate from today
today().next(birthday); // same upcoming occurrence
```

:::entry
### `monthDay()` :kind[function]

```js signature
monthDay(input, options?): MonthDay
monthDay(month, day): MonthDay
new MonthDay(input, options?)
```

Reads month-first strings, two whole numbers, a fields object, or any date or timestamp with its year dropped. With the [loose plugin](/plugins/loose/), it also reads English month names and returns `null` when unreadable.

**Parameters**

```params
- name: input
  type: MonthDayInput | number
  required: true
  description: Month-day string, fields object, existing date or timestamp, or 1-indexed `month`.
- name: options
  type: Zone | MonthDayOptions | number
  description: Day of the month when passing two numbers, or a time zone or options object.
  options:
    - name: zone
      type: Zone
      description: Time zone used to determine the calendar day of an instant string, `DateTime`, or `Date`.
    - name: dayFirst
      type: boolean
      default: 'false'
      description: Read human-written strings like `'17/10'` day-first, matching `dayMonth()`.
    - name: loose
      type: boolean
      default: 'false'
      description: Read named months like `'Oct 17'` and return `null` instead of throwing when unreadable.
```

**Returns**

```returns
type: MonthDay
description: "An immutable `MonthDay`, or `null` when loose mode cannot read `input`."
```

```js
monthDay('10/17').toString(); // '10-17'
monthDay(2, 29).toString(); // '02-29'
monthDay({ month: 10, day: 17 }).toString(); // '10-17'
monthDay('1990-10-17').toString(); // '10-17'
```
:::

:::entry
### `dayMonth()` :kind[function]

```js signature
dayMonth(input, options?): MonthDay
dayMonth(day, month): MonthDay
```

Reads human-written strings and two-number pairs day-first into the same `MonthDay` class, regardless of global loose settings. Zero-padded ISO strings with two digits on each side of a dash always read month-first under both functions so JSON output round-trips cleanly.

**Parameters**

```params
- name: input
  type: MonthDayInput | number
  required: true
  description: Day-first string such as `'17/10'`, day of the month, or any `MonthDayInput`.
- name: options
  type: Zone | MonthDayOptions | number
  description: 1-indexed `month` when passing two numbers, or a zone or options object.
```

**Returns**

```returns
type: MonthDay
description: "An immutable `MonthDay`, or `null` when loose mode cannot read `input`."
```

```js
dayMonth('17/10').toString(); // '10-17'
dayMonth('17.10').toString(); // '10-17'
dayMonth(17, 10).toString(); // '10-17'
dayMonth('10-17').toString(); // '10-17'
```
:::

## Properties

Every `MonthDay` instance exposes its formatted label and numeric parts.

| Property | Type | Description |
|---|---|---|
| `text` | `string` | Locale-formatted month and day, such as `'Oct 17'`. |
| `month` | `number` | 1-indexed calendar month from `1` through `12`. |
| `day` | `number` | Day of the month from `1` through `31`. |

## Placing in a year and stepping

:::entry
### `in()` :kind[method]

```js signature
md.in(year): CalendarDate
```

Returns the [`CalendarDate`](/api/calendar-date/) this month-day falls on in the given year. February 29 falls on February 28 in non-leap years.

**Parameters**

```params
- name: year
  type: number | string
  required: true
  description: Whole-number calendar year, such as `2027`.
```

**Returns**

```returns
type: CalendarDate
description: Occurrence of this month-day in `year`.
```

```js
monthDay('10-17').in(2027).toString(); // '2027-10-17'
monthDay('02-29').in(2028).toString(); // '2028-02-29'
monthDay('02-29').in(2027).toString(); // '2027-02-28'
```
:::

:::entry
### `next()` / `previous()` :kind[method]

```js signature
md.next(day?): CalendarDate
md.previous(day?): CalendarDate
d.next(md): CalendarDate
dt.next(md): DateTime
```

Finds the upcoming or most recent occurrence around a reference day, defaulting to today. If the reference day is already that occurrence, it steps a full year ahead or back. Passing a `MonthDay` to a date or datetime steps the same way while preserving clock time and zone.

**Parameters**

```params
- name: day
  type: CalendarDateInput
  default: today()
  description: Reference date or timestamp to step from.
```

**Returns**

```returns
type: CalendarDate
description: Upcoming or previous `CalendarDate` occurrence.
```

```js
import { date, datetime } from 'native-dates';

const birthday = monthDay('10-17');

birthday.next('2026-10-17').toString(); // '2027-10-17'
birthday.previous('2026-10-17').toString(); // '2025-10-17'
date('2026-11-11').next(birthday).toString(); // '2027-10-17'
datetime('2026-11-11T09:30', 'America/New_York').next(monthDay('03-08')).hour; // 9
```
:::

:::entry
### `after()` / `before()` :kind[method]

```js signature
md.after(day): CalendarDate
md.before(day): CalendarDate
```

Explicit required-argument forms of `next()` and `previous()`, returning the occurrence earlier or later than the given day.

**Parameters**

```params
- name: day
  type: CalendarDateInput
  required: true
  description: Reference date or timestamp.
```

**Returns**

```returns
type: CalendarDate
description: Occurrence earlier or later than `day`.
```

```js
const leapBirthday = monthDay('02-29');

leapBirthday.after('2027-02-27').toString(); // '2027-02-28'
leapBirthday.after('2027-02-28').toString(); // '2028-02-29'
leapBirthday.before('2027-03-01').toString(); // '2027-02-28'
```
:::

## Matching dates and equality

:::tip[equals() vs. fallsOn()]
Use `equals()` to check for the exact same month and day. Use `fallsOn()` for annual occurrences, where February 29 lands on February 28 in common years.
:::

:::entry
### `fallsOn()` :kind[method]

```js signature
md.fallsOn(day): boolean
```

Returns true when the given day is this month-day's occurrence in that date's own year, placing February 29 on February 28 in years without a leap day.

**Parameters**

```params
- name: day
  type: CalendarDateInput
  required: true
  description: Calendar date or timestamp to test.
```

**Returns**

```returns
type: boolean
description: "`true` when this month-day lands on `day` in that year."
```

```js
const leapDay = monthDay('02-29');

leapDay.fallsOn('2027-02-28'); // true
leapDay.fallsOn('2028-02-28'); // false
leapDay.fallsOn('2028-02-29'); // true
```
:::

:::entry
### `equals()` :kind[method]

```js signature
md.equals(other): boolean
```

Returns true when the other input carries the same month and day. Accepts another month-day, an ISO month-day string, a fields object, or a date whose year is dropped. Ambiguous slash or dot strings throw so you read them with a month-first or day-first factory first.

**Parameters**

```params
- name: other
  type: MonthDayInput
  required: true
  description: "`MonthDay`, ISO `'MM-DD'` string, fields object, or date."
```

**Returns**

```returns
type: boolean
description: "`true` when both values name the same month and day."
```

```js
monthDay('10/17').equals(dayMonth('17/10')); // true
monthDay('10-17').equals('1990-10-17'); // true
monthDay('02-29').equals('2027-02-28'); // false
```
:::

:::entry
### `isToday()` / `isTomorrow()` / `isYesterday()` :kind[method]

```js signature
md.isToday(zone?): boolean
md.isTomorrow(zone?): boolean
md.isYesterday(zone?): boolean
```

Checks whether this month-day falls on today, tomorrow, or yesterday in the given zone or the configured default time zone.

**Parameters**

```params
- name: zone
  type: Zone
  description: Time zone used to determine today's calendar date.
```

**Returns**

```returns
type: boolean
description: Boolean check result.
```

```js
today().monthDay.isToday(); // true
today().plus(1, 'day').monthDay.isTomorrow(); // true
today().minus(1, 'day').monthDay.isYesterday(); // true
```
:::

## Formatting and conversion

:::entry
### `format()` :kind[method]

```js signature
md.format(spec?, locale?): string
```

Formats the month and day in the order `locale` writes them, ignoring year, weekday, clock, and zone options. Accepts any preset name, an options object, custom entries in `MonthDay.presets`, or token patterns when the [tokens plugin](/plugins/tokens/) is loaded.

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
description: Localized month and day string.
```

```js
import '@native-dates/plugins/tokens';

const birthday = monthDay('10-17');

birthday.format('short', 'en-US'); // '10/17'
birthday.format('short', 'en-GB'); // '17/10'
birthday.format('long', 'de'); // '17. Oktober'
birthday.format('MMM Do', 'en-US'); // 'Oct 17th'
```
:::

:::entry
### `isMonthDay()` :kind[guard]

```js signature
isMonthDay(value): value is MonthDay
```

Returns true when the given value is a `MonthDay` instance, including across realms and bundles. Core [`kindOf()`](/api/kind-of/) returns `'monthDay'` for these instances.

```js
import { kindOf } from 'native-dates';
import { isMonthDay } from '@native-dates/plugins/month-day';

isMonthDay(monthDay('10/17')); // true
isMonthDay('10-17'); // false
kindOf(monthDay('10/17')); // 'monthDay'
```
:::

### Serialization and interop

| Method | Return | Description |
|---|---|---|
| `as('monthDay')` | `MonthDay` | Returns this `MonthDay` in generic conversion chains, matching `d.as('monthDay')` and `dt.as('monthDay')`. |
| `toString()`, `toJSON()` | `string` | ISO 8601 `'MM-DD'` string, such as `'10-17'`. |
| `toTemporal()` | `Temporal.PlainMonthDay` | Underlying ISO `Temporal.PlainMonthDay` instance. |
| `valueOf()` | `never` | Throws a `RangeError` because a month-day has no position on the number line. |
