---
title: monthDay()
kind: function
lede: Read a month-and-day string, numbers, fields, or date into a MonthDay.
import: import { monthDay, dayMonth } from 'native-dates'
size: core
updated: 2026-11-12
---

## Reading month-days

:::entry
### `monthDay()` :kind[function]

```js signature
monthDay(input, options?): MonthDay
monthDay(input, zone?): MonthDay
monthDay(month, day): MonthDay
```

Creates a [`MonthDay`](/api/month-day/) from a month-first string, 1-indexed numbers, a fields object, or an existing date. February 29 is accepted so leap-day birthdays and anniversaries stay intact.

```js title="birthday.js"
import { datetime, monthDay } from 'native-dates';

const fromIso = monthDay('10-17');
const fromSlash = monthDay('10/17');
const fromNumbers = monthDay(2, 29);
const fromFields = monthDay({ month: 10, day: 17 });
const fromInstant = monthDay(datetime('2026-10-18T02:00:00Z'), 'America/Los_Angeles');

fromNumbers.toString(); // '02-29'
fromInstant.toString(); // '10-17'
```

**Parameters**

```params
- name: input
  type: MonthDayInput | number | string
  required: true
  description: Month-first string, fields object, date or timestamp, or 1-indexed `month` from 1 to 12.
- name: options
  type: Zone | MonthDayOptions | number | string
  description: Time zone or options object, or whole `day` from 1 to 31 when passing two numbers.
  options:
    - name: zone
      type: Zone
      description: Time zone used to read the month and day of an instant string, `DateTime`, or `Date`.
    - name: dayFirst
      type: boolean
      default: 'false'
      description: "Read slash, dot, or single-digit dash strings day-first, matching `dayMonth()`."
    - name: loose
      type: boolean
      default: 'false'
      description: "Read English month names like `'Oct 17'` and return `null` on unreadable input with `@native-dates/plugins/loose`."
```

**Returns**

```returns
type: MonthDay
description: "A `MonthDay` with no year, or `null` when loose mode cannot read `input`."
```

When the [loose plugin](/plugins/loose/) is loaded, loose mode parses English month names with optional ordinals and returns `null` on unreadable input:

```js
import { monthDay } from 'native-dates';
import '@native-dates/plugins/loose';

monthDay('Oct 17', { loose: true })?.toString(); // '10-17'
monthDay('17th October', { loose: true })?.toString(); // '10-17'
monthDay('whenever', { loose: true }); // null
```
:::

:::entry
### `dayMonth()` :kind[function]

```js signature
dayMonth(input, options?): MonthDay
dayMonth(day, month): MonthDay
```

Reads day-first strings and numbers in the order most of the world writes them, such as `'17/10'`. Calling this factory always reads day-first regardless of global settings.

Two-digit ISO strings across a dash such as `'10-17'` still read month-first under both functions. That keeps JSON output round-tripping back to the same date everywhere.

**Parameters**

```params
- name: input
  type: MonthDayInput | number | string
  required: true
  description: Day-first string like `'17/10'`, any `MonthDayInput`, or whole `day` from 1 to 31.
- name: options
  type: Zone | MonthDayOptions | number | string
  description: Time zone or options object, or 1-indexed `month` from 1 to 12 when passing two numbers.
```

**Returns**

```returns
type: MonthDay
description: "A `MonthDay`, or `null` when loose mode cannot read `input`."
```

```js
import { dayMonth } from 'native-dates';

dayMonth('17/10').toString(); // '10-17'
dayMonth('06.05').toString(); // '05-06'
dayMonth(17, 10).toString(); // '10-17'
dayMonth('10-17').toString(); // '10-17'
```
:::

## Accepted inputs

Numeric strings without a year are never handed to the native `Date` parser. That avoids inventing a non-leap default year or rolling invalid days into the next month.

| Input | Example | How it reads |
|---|---|---|
| ISO month-day string | `'10-17'`, `'--10-17'` | Reads two-digit month and day month-first under both `monthDay()` and `dayMonth()`. |
| Numeric pair string | `'10/17'`, `'17.10'`, `'5-6'` | Reads across `/`, `.`, or `-`, month-first in `monthDay()` and day-first in `dayMonth()`. |
| Two numbers | `monthDay(10, 17)`, `dayMonth(17, 10)` | Takes whole numbers in month-then-day or day-then-month order. |
| Fields object | `{ month: 10, day: 17 }` | Reads 1-indexed fields and rejects impossible pairs such as April 31. |
| Date or timestamp | `'1990-10-17'`, `datetime(...)`, `new Date()` | Extracts the calendar month and day in the given or configured zone and drops the year. |
| Loose month name | `'Oct 17'`, `'17th October'` | Reads English month names and ordinals in either order in loose mode. |
| Temporal value | `Temporal.PlainMonthDay`, `Temporal.PlainDate` | Wraps ISO 8601 Temporal values directly. |

:::tip[Reading today's month and day]
Read the current month and day in any time zone via [`today()`](/api/date-fn/#today), such as `today('Europe/Berlin').monthDay`.
:::
