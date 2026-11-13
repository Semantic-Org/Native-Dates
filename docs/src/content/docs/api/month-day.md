---
title: MonthDay
kind: class
lede: A calendar month and day with no year, for birthdays, anniversaries, and annual holidays.
import: import { MonthDay } from 'native-dates'
size: core
updated: 2026-11-12
---

## Creating a MonthDay

Create an instance month-first with [`monthDay()`](/api/month-day-fn/) or day-first with [`dayMonth()`](/api/month-day-fn/#daymonth). Instances are immutable, so every method returns a new value.

```js title="create.js"
import { dayMonth, monthDay } from 'native-dates';

const birthday = monthDay(10, 17);
const fromIso = monthDay('10-17');
const european = dayMonth('17/10');
```

Read the month and day off any [calendar date](/api/calendar-date/) or [moment](/api/date-time/) through its `monthDay` property, or convert inside a chain with `as('monthDay')`:

```js
import { date, datetime, today } from 'native-dates';

date('1990-10-17').monthDay.toString(); // '10-17'
datetime('2026-10-18T02:00:00Z', 'America/Los_Angeles').as('monthDay').toString(); // '10-17'
const currentMonthDay = today().monthDay;
```

## Properties

Properties read the 1-indexed month and day of the month.

| Property | Type | Description |
|---|---|---|
| `text` | `string` | Locale-formatted month and day, such as `'Oct 17'`. |
| `month`, `day` | `number` | Calendar month from 1 through 12, and day of the month from 1 through 31. |
| `MonthDay.presets` | `object` | Named format presets read by `format()`, open to custom entries. |

## Placing in a year and stepping

Combine a recurring month and day with a year to get a concrete date, or step forward and backward to nearby occurrences.

:::entry
### `in()` :kind[method]

```js signature
md.in(year): CalendarDate
```

Places this month and day in a calendar year and returns a [`CalendarDate`](/api/calendar-date/). February 29 lands on February 28 in common years that have no leap day.

**Parameters**

```params
- name: year
  type: number | string
  required: true
  description: Whole calendar year such as `2027`.
```

**Returns**

```returns
type: CalendarDate
description: The `CalendarDate` this month-day falls on in `year`.
```

```js
const birthday = monthDay(10, 17);
const leapDay = monthDay(2, 29);

birthday.in(2027).toString(); // '2027-10-17'
leapDay.in(2027).toString(); // '2027-02-28'
leapDay.in(2028).toString(); // '2028-02-29'
```
:::

:::entry
### `next()` :kind[method]

```js signature
md.next(day?): CalendarDate
```

Returns the next occurrence strictly after a reference date, defaulting to `today()`. When the reference date already falls on this month and day, the method advances to the following year.

Calendar dates and moments also accept a month-day directly in `d.next(md)` and `dt.next(md)`.

**Parameters**

```params
- name: day
  type: CalendarDateInput
  default: today()
  description: Starting date to count forward from.
```

**Returns**

```returns
type: CalendarDate
description: Upcoming `CalendarDate` strictly after `day`.
```

```js
import { date, monthDay } from 'native-dates';

const birthday = monthDay(10, 17);

birthday.next('2026-05-01').toString(); // '2026-10-17'
birthday.next('2026-10-17').toString(); // '2027-10-17'
date('2026-11-16').next(birthday).toString(); // '2027-10-17'
```
:::

:::entry
### `previous()` :kind[method]

```js signature
md.previous(day?): CalendarDate
```

Returns the most recent occurrence strictly before a reference date, defaulting to `today()`. Calendar dates and moments also accept a month-day directly in `previous()`.

**Parameters**

```params
- name: day
  type: CalendarDateInput
  default: today()
  description: Reference date to count backward from.
```

**Returns**

```returns
type: CalendarDate
description: Most recent `CalendarDate` strictly before `day`.
```

```js
import { date, monthDay } from 'native-dates';

const birthday = monthDay(10, 17);

birthday.previous('2026-10-17').toString(); // '2025-10-17'
date('2026-11-16').previous(birthday).toString(); // '2026-10-17'
```
:::

:::entry
### `after()` :kind[method]

```js signature
md.after(day): CalendarDate
```

Returns the next occurrence strictly after a required reference date. Behaves like [`next()`](#next) without defaulting to today.

**Parameters**

```params
- name: day
  type: CalendarDateInput
  required: true
  description: Reference date to step forward past.
```

**Returns**

```returns
type: CalendarDate
description: First `CalendarDate` occurrence after `day`.
```

```js
monthDay(2, 29).after('2026-03-01').toString(); // '2027-02-28'
```
:::

:::entry
### `before()` :kind[method]

```js signature
md.before(day): CalendarDate
```

Returns the most recent occurrence strictly before a required reference date. Behaves like [`previous()`](#previous) without defaulting to today.

```js
monthDay(10, 17).before('2026-10-01').toString(); // '2025-10-17'
```
:::

## Matching and equality

Because a month-day repeats every year rather than sitting at one point on a timeline, ordering methods like `isBefore()` do not apply.

:::tip[Choosing equals or fallsOn]
Use `fallsOn()` to check whether a calendar date is that year's observance, since February 29 lands on February 28 in common years. Reserve `equals()` for checking whether two values write the exact same month and day numbers.
:::

:::entry
### `fallsOn()` :kind[method]

```js signature
md.fallsOn(day): boolean
```

Returns `true` when the given date is this month-day's occurrence in that date's own year. In a common year, February 29 falls on February 28, whereas in a leap year it falls only on February 29.

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
description: "`true` when `day` is this month-day's date in that year."
```

```js
const leapDay = monthDay(2, 29);

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

Returns `true` when both values carry the exact same month and day numbers, extracting the month and day when given a full date or timestamp.

Ambiguous slash or dot strings like `'05/10'` throw a `RangeError`. Parse them with [month-first or day-first factories](/api/month-day-fn/) before comparing.

**Parameters**

```params
- name: other
  type: MonthDayInput
  required: true
  description: Another `MonthDay`, ISO `'10-17'` string, fields object, or date value.
```

**Returns**

```returns
type: boolean
description: "`true` when both values have the same month and day."
```

```js
const birthday = monthDay(10, 17);

birthday.equals('10-17'); // true
birthday.equals('1990-10-17'); // true
monthDay(2, 29).equals('2027-02-28'); // false
```
:::

:::entry
### `isToday()` :kind[method]

```js signature
md.isToday(zone?): boolean
```

Returns true when this month-day falls on today's date in the given or configured time zone.

```js
import { today } from 'native-dates';

today('UTC').monthDay.isToday('UTC'); // true
```
:::

:::entry
### `isTomorrow()` :kind[method]

```js signature
md.isTomorrow(zone?): boolean
```

Returns true when this month-day falls on tomorrow's date in the given or configured time zone.

```js
import { tomorrow } from 'native-dates';

tomorrow('UTC').monthDay.isTomorrow('UTC'); // true
```
:::

:::entry
### `isYesterday()` :kind[method]

```js signature
md.isYesterday(zone?): boolean
```

Returns true when this month-day falls on yesterday's date in the given or configured time zone.

```js
import { yesterday } from 'native-dates';

yesterday('UTC').monthDay.isYesterday('UTC'); // true
```
:::

## Formatting and conversion

:::entry
### `format()` :kind[method]

```js signature
md.format(spec?, locale?): string
```

Formats the month and day in the locale's own order, or with a built-in token pattern such as `'MMM Do'`. Shared options objects ignore year, clock, and zone keys automatically.

Custom named presets can be added on `MonthDay.presets`, and non-Gregorian locales format Gregorian month names so annual dates stay stable. See [Formatting](/guides/formatting/) for all preset and token options.

**Parameters**

```params
- name: spec
  type: FormatSpec
  default: "'medium'"
  description: Preset name such as `'short'` or `'long'`, `Intl` options object, or token pattern.
- name: locale
  type: Locale
  description: BCP 47 locale tag overriding the configured default for this call.
```

**Returns**

```returns
type: string
description: Formatted month-and-day string.
```

```js
const oct17 = monthDay(10, 17);

oct17.format('short', 'en-US'); // '10/17'
oct17.format('short', 'en-GB'); // '17/10'
oct17.format('medium', 'en-US'); // 'Oct 17'
oct17.format('long', 'en-US'); // 'October 17'
oct17.format('MMM Do', 'en-US'); // 'Oct 17th'
```
:::

:::entry
### `as()` :kind[method]

```js signature
md.as('monthDay'): MonthDay
```

Returns this instance when `'monthDay'` is requested in generic conversion chains, throwing a `RangeError` for other kinds.
:::

:::entry
### `toString()` :kind[method]

```js signature
md.toString(): string
md.toJSON(): string
```

Returns the two-digit ISO month-day string `'MM-DD'`, which round-trips month-first under both [month-day factories](/api/month-day-fn/). `toJSON()` returns the same string for JSON serialization.

**Returns**

```returns
type: string
description: ISO month-day string such as `'10-17'`.
```

```js
monthDay(5, 6).toString(); // '05-06'
JSON.stringify({ birthday: monthDay(10, 17) }); // '{"birthday":"10-17"}'
```
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
md.toTemporal(): Temporal.PlainMonthDay
```

Returns the underlying `Temporal.PlainMonthDay` instance.
:::

:::entry
### `valueOf()` :kind[method]

```js signature
md.valueOf(): never
```

Throws a `RangeError` so numeric operators never coerce a month-day to a number. Narrow unknown values with `isMonthDay()` or [`kindOf()`](/api/kind-of/).
:::
