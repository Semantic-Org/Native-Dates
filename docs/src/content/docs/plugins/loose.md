---
title: loose
kind: plugin
lede: Opt-in fallback parsing and `null` returns for untrusted text from forms, CSVs, and legacy feeds.
import: import '@native-dates/plugins/loose'
size: loose
updated: 2026-11-12
---

## Opt-in loose parsing

Every factory parses strict ISO 8601 strings by default and throws on malformed input. Importing this plugin enables `{ loose: true }` for untrusted user text, CSV columns, and legacy headers.

```js title="loose.js"
import '@native-dates/plugins/loose';
import { date, datetime, duration, time } from 'native-dates';

date('September 6, 2026', { loose: true })?.toString(); // '2026-09-06'
datetime('Sat, 06 Sep 2026 14:30:00 GMT', { loose: true })?.toString();
// '2026-09-06T14:30:00.000Z'
time('September 6, 2026 5:30 PM', { loose: true })?.toString(); // '17:30:00'
duration('2h', { loose: true })?.toString(); // 'PT2H'
```

Strict parsing stays the default wherever you omit `{ loose: true }`. Importing the plugin never alters existing calls across your codebase.

## Returning null on bad data

With loose mode enabled, unreadable strings, empty fields, missing values, and impossible calendar dates like February 30 return `null` instead of throwing. Form handlers and import scripts can check the result directly without wrapping every field in a try block.

```js
const submitted = date('TBD', { loose: true }); // null
const rolled = date('2026-02-30', { loose: true }); // null
const missing = datetime(undefined, { loose: true }); // null
```

Range factories from [ranges](/plugins/ranges/) and partial-date factories from [year-month](/plugins/year-month/) and [month-day](/plugins/month-day/) accept the same option:

```js
import { monthDay } from '@native-dates/plugins/month-day';
import { dateRange } from '@native-dates/plugins/ranges';
import { yearMonth } from '@native-dates/plugins/year-month';

dateRange('Sep 1 2026', 'Sep 7 2026', { loose: true })?.toString(); // '2026-09-01/2026-09-07'
yearMonth('Nov 2026', { loose: true })?.toString(); // '2026-11'
monthDay('Oct 17', { loose: true })?.toString(); // '10-17'
dateRange('TBD', '2026-09-07', { loose: true }); // null
```

:::note[Bad data returns null, bad options still throw]
Loose mode only forgives unreadable input data. Passing an unknown time zone like `'Mars/Olympus'` is a mistake in application code rather than user input, so it still throws immediately.
:::

## Time zones on loose strings

Strings carrying a UTC marker or numeric offset identify a specific moment and convert it into your target or configured zone. Strings without an offset keep the exact date and time written in the text and place them directly in your target zone.

```js
datetime('Sat, 06 Sep 2026 14:30:00 GMT', {
  loose: true,
  zone: 'America/New_York',
})?.hour; // 10

datetime('September 6, 2026 5:30 PM', {
  loose: true,
  zone: 'America/Los_Angeles',
})?.hour; // 17
```

## Day-first numeric dates

Numeric dates written with slashes, dots, or hyphens default to month-first order. Pass `dayFirst: true` per call or set it app-wide with [`configure()`](/api/configure/) for regions that write the day before the month.

```js
import { configure } from 'native-dates';

date('07.09.2026', { loose: true })?.toString(); // '2026-07-09'
date('07.09.2026', { loose: true, dayFirst: true })?.toString(); // '2026-09-07'

configure({ dayFirst: true });
date('7/9/26', { loose: true })?.toString(); // '2026-09-07'
date('07.09.2026', { loose: true, dayFirst: false })?.toString(); // '2026-07-09'
configure({ dayFirst: false });
```

## Factory options

:::entry
### `datetime()` :kind[function]

```js signature
datetime(input, { loose: true, zone?, dayFirst? }): DateTime | null
date(input, { loose: true, zone?, dayFirst? }): CalendarDate | null
time(input, { loose: true, zone?, dayFirst? }): Time | null
duration(input, { loose: true }): Duration | null
yearMonth(input, { loose: true, zone? }): YearMonth | null
monthDay(input, { loose: true, zone?, dayFirst? }): MonthDay | null
```

Extends core, partial-date, and range factories with fallback parsing and `null` returns on unreadable input. Calling class constructors like `new DateTime()` with `{ loose: true }` enables fallback parsing while still throwing if the input cannot be read.

**Parameters**

```params
- name: loose
  type: boolean
  default: "false"
  description: Fall back to engine `Date` parsing and return `null` when input cannot be read.
- name: dayFirst
  type: boolean
  default: "false"
  description: Read numeric dates like `'07.09.2026'` with the day before the month.
- name: zone
  type: Zone
  description: Time zone used to interpret local date-time strings or view instants.
```

**Returns**

```returns
type: DateTime | CalendarDate | Time | Duration | null
description: Parsed instance, or `null` when `input` cannot be read.
```

```js
const parsed = date('2026-09', { loose: true });
parsed?.toString(); // '2026-09-01'
```
:::

:::entry
### `configure()` :kind[function]

```js signature
configure({ dayFirst }): Settings
```

Sets the default numeric date order for all loose calls that do not specify `dayFirst` explicitly.

**Parameters**

```params
- name: dayFirst
  type: boolean
  default: "false"
  description: When `true`, loose numeric dates default to day-first order across the app.
```
:::
