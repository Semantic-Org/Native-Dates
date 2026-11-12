---
title: date()
kind: function
lede: Create a CalendarDate from an ISO date string, year-month-day numbers, fields, or the current day.
import: import { date, today } from 'native-dates'
size: core
updated: 2026-11-12
---

## Reading calendar dates

:::entry
### `date()` :kind[function]

```js signature
date(input, options?): CalendarDate
date(input, zone?): CalendarDate
date(year, month, day): CalendarDate
```

Creates a [`CalendarDate`](/api/calendar-date/) from an ISO date string, three 1-indexed numbers, a fields object, or an existing date or timestamp. Impossible dates such as February 30 throw a `RangeError` instead of rolling into March.

```js title="create.js"
import { date, datetime } from 'native-dates';

const fromIso = date('2026-11-16');
const fromNumbers = date(2026, 11, 16);
const fromFields = date({ year: 2026, month: 11, day: 16 });
const fromMoment = date(datetime('2026-11-17T02:00:00Z', 'America/Los_Angeles'));

fromNumbers.toString(); // '2026-11-16'
fromMoment.toString(); // '2026-11-16'
```

**Parameters**

```params
- name: input
  type: CalendarDateInput | number
  required: true
  description: ISO date string, fields object, existing date or timestamp, or the 4-digit `year`.
- name: options
  type: Zone | ReadOptions | number
  description: Time zone or options object when reading a `Date` or loose string, or 1-indexed `month` from 1 to 12.
  options:
    - name: zone
      type: Zone
      description: Time zone used to determine the calendar day of a JavaScript `Date` or loose timestamp.
    - name: loose
      type: boolean
      default: 'false'
      description: "Parse informal date strings and return `null` on unreadable input with `@native-dates/plugins/loose`."
    - name: dayFirst
      type: boolean
      description: "Read numeric dates such as `'07.09.2026'` as day-first in loose mode."
- name: day
  type: number
  description: Day of the month from 1 to 31 when passing `year`, `month`, and `day`.
```

**Returns**

```returns
type: CalendarDate
description: "A `CalendarDate` with no clock or zone, or `null` when loose mode cannot read `input`."
```

When reading a native JavaScript `Date`, pass a time zone to choose which location's calendar day to extract:

```js
const stamp = new Date('2026-11-17T02:00:00Z');

date(stamp, 'America/Los_Angeles').toString(); // '2026-11-16'
date(stamp, 'UTC').toString(); // '2026-11-17'
```
:::

### Accepted inputs

Months always run from 1 for January through 12 for December, unlike JavaScript's zero-indexed `Date` constructor.

| Input | Example | How it reads |
|---|---|---|
| ISO date string | `'2026-11-16'` | Reads the 4-digit year, 1-indexed month, and day directly. |
| Local date-time string | `'2026-11-16T09:30'` | Keeps the calendar date and drops the time of day. |
| Year, month, and day | `date(2026, 11, 16)` | Takes three whole numbers with `1` for January through `12` for December. |
| Fields object | `{ year: 2026, month: 11, day: 16 }` | Reads 1-indexed calendar fields and rejects impossible dates. |
| DateTime | `datetime('2026-11-17T02:00Z', 'America/Los_Angeles')` | Extracts the calendar date in that instance's own time zone. |
| JavaScript Date | `date(jsDate, 'America/Los_Angeles')` | Reads the calendar day of that timestamp in the given zone or configured default. |
| Temporal value | `Temporal.PlainDate`, `Temporal.ZonedDateTime` | Extracts the ISO calendar date. |

:::warning[Instant strings require a time zone]
An ISO string with a trailing `Z` or UTC offset names a moment that can fall on two different calendar days around the world. Call `datetime(text, zone).date` to choose the time zone explicitly, or pass a zone in loose mode with [`@native-dates/plugins/loose`](/plugins/loose/).
:::

## Relative calendar days

Today's date depends on where you stand on Earth. Each helper below accepts an optional time zone and falls back to your configured default.

:::entry
### `today()` :kind[function]

```js signature
today(zone?): CalendarDate
```

Returns today's calendar date in the given time zone or your configured default. Late in the evening in the Americas, Asia and Oceania have already crossed midnight into the next calendar date.

**Parameters**

```params
- name: zone
  type: Zone
  description: Time zone whose current calendar date to read, such as `'Asia/Tokyo'` or `'America/Los_Angeles'`.
```

**Returns**

```returns
type: CalendarDate
description: Today's `CalendarDate` in `zone`.
```

```js
import { datetime, today } from 'native-dates';

const inLosAngeles = today('America/Los_Angeles');
const inTokyo = today('Asia/Tokyo');

// At 02:00 UTC on Nov 17, Los Angeles is still on Nov 16 while Tokyo is on Nov 17
const moment = '2026-11-17T02:00:00Z';
datetime(moment, 'America/Los_Angeles').date.toString(); // '2026-11-16'
datetime(moment, 'Asia/Tokyo').date.toString(); // '2026-11-17'
```
:::

:::entry
### `tomorrow()` :kind[function]

```js signature
tomorrow(zone?): CalendarDate
```

Returns tomorrow's calendar date in the given time zone, one calendar day after `today(zone)`.

**Parameters**

```params
- name: zone
  type: Zone
  description: Time zone whose calendar to advance from today.
```

**Returns**

```returns
type: CalendarDate
description: Tomorrow's `CalendarDate` in `zone`.
```

```js
import { tomorrow } from 'native-dates';

const nextDay = tomorrow();
const londonTomorrow = tomorrow('Europe/London');
```
:::

:::entry
### `yesterday()` :kind[function]

```js signature
yesterday(zone?): CalendarDate
```

Returns yesterday's calendar date in the given time zone, one calendar day before `today(zone)`.

**Parameters**

```params
- name: zone
  type: Zone
  description: Time zone whose calendar to step back from today.
```

**Returns**

```returns
type: CalendarDate
description: Yesterday's `CalendarDate` in `zone`.
```

```js
import { yesterday } from 'native-dates';

const priorDay = yesterday();
const londonYesterday = yesterday('Europe/London');
```
:::
