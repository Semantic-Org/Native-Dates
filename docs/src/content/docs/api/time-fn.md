---
title: time()
kind: function
lede: Create a Time from a 12-hour or 24-hour clock string, numbers, fields, or a timestamp.
import: import { time } from 'native-dates'
size: core
updated: 2026-11-12
---

## Reading clock times

:::entry
### `time()` :kind[function]

```js signature
time(input, options?): Time
time(input, zone?): Time
time(hour, minute?, second?): Time
```

Creates a [`Time`](/api/time/) from a clock string, whole-number clock parts, a fields object, or a timestamp. Missing inputs throw a `TypeError` instead of defaulting to the current clock.

```js title="clock.js"
import { datetime, time } from 'native-dates';

const morning = time('9am');
const closing = time('5:30pm');
const iso = time('17:30:00');
const fromNumbers = time(9, 30);
const fromFields = time({ hour: 17, minute: 30, millisecond: 250 });
const fromInstant = time('2026-11-16T17:30:00Z', 'America/New_York');
const fromMoment = time(datetime('2026-11-16T17:30:00Z'), 'Europe/Berlin');
const fromTemporal = time(Temporal.PlainTime.from('08:15'));

closing.toString(); // '17:30:00'
fromInstant.toString(); // '12:30:00'
fromMoment.toString(); // '18:30:00'
```

**Parameters**

```params
- name: input
  type: TimeInput | number
  required: true
  description: Clock string, fields object, existing time or timestamp, or 24-hour `hour` from 0 to 23.
- name: options
  type: Zone | ReadOptions | number
  description: Time zone or options object when reading a timestamp or loose string, or `minute` from 0 to 59.
  options:
    - name: zone
      type: Zone
      description: Time zone used to extract the time of day from an instant string, `DateTime`, or `Date`.
    - name: loose
      type: boolean
      default: 'false'
      description: "Read informal date-time strings and return `null` on unreadable input with `@native-dates/plugins/loose`."
    - name: dayFirst
      type: boolean
      description: "Interpret ambiguous numeric dates day-first when loose mode parses a date-and-time string."
- name: second
  type: number
  description: Whole `second` from 0 to 59 when passing numbers. Write sub-second digits in a string or fields object.
```

**Returns**

```returns
type: Time
description: "A `Time` representing a time of day, or `null` when loose mode cannot read `input`."
```

When the [loose plugin](/plugins/loose/) is loaded, loose mode parses informal timestamp strings and returns `null` instead of throwing on unreadable input:

```js
import { time } from 'native-dates';
import '@native-dates/plugins/loose';

time('Mon, 16 Nov 2026 17:30:00 GMT', {
  zone: 'America/New_York',
  loose: true,
})?.toString(); // '12:30:00'
time('whenever', { loose: true }); // null
```
:::

## Accepted inputs

Twelve-hour strings accept hours from 1 through 12 followed by AM or PM. Midnight is 12 AM and noon is 12 PM.

| Input | Example | How it reads |
|---|---|---|
| 12-hour clock string | `'9am'`, `'5:30pm'`, `'12:15 a.m.'` | Reads hours 1 through 12 with `am` or `pm` and optional minutes, seconds, and fractions. |
| 24-hour clock string | `'09:00'`, `'17:30:00'`, `'17:30:15.250'` | Reads 24-hour clock strings down to nanosecond precision. |
| ISO instant string | `'2026-11-16T17:30:00Z'` | Reads the local clock of that moment in the given zone or configured default. |
| Clock numbers | `time(9)`, `time(9, 30)`, `time(17, 30, 15)` | Takes whole numbers for hour, optional minute, and optional second. |
| Fields object | `{ hour: 9, minute: 30, millisecond: 250 }` | Reads singular or plural clock fields and rejects out-of-range numbers. |
| DateTime or Temporal | `time(dt, 'Asia/Tokyo')`, `Temporal.PlainTime` | Extracts the time of day, shifting instants into the given zone when provided. |
| JavaScript Date | `time(jsDate, 'America/New_York')` | Reads the clock time of that instant in the given zone or configured default. |

:::tip[Reading the current time of day]
Read the live clock in any time zone via [`now()`](/api/datetime-fn/#now), such as `now('Europe/Berlin').time`.
:::
