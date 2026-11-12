---
title: datetime()
kind: function
lede: Read an existing timestamp, string, or clock reading into a DateTime, or read the current moment.
import: import { datetime, now } from 'native-dates'
size: core
updated: 2026-11-12
---

## Reading moments

:::entry
### `datetime()` :kind[function]

```js signature
datetime(input, zone?): DateTime
datetime(input, options?): DateTime
```

Reads a string, timestamp, fields object, or calendar date into a [`DateTime`](/api/date-time/) viewed in a time zone. Omit the time zone to use your configured default or the runtime's local zone.

```js title="read.js"
import { date, datetime } from 'native-dates';

const fromUtc = datetime('2026-11-16T17:30:00Z', 'America/Los_Angeles');
const fromWall = datetime('2026-11-16 09:30', 'Europe/Berlin');
const fromZone = datetime('2026-11-16T09:30[America/New_York]');
const fromEpoch = datetime(1794850200000, 'UTC');
const fromDate = datetime(date('2026-11-16'), 'America/New_York');
```

**Parameters**

```params
- name: input
  type: DateTimeInput
  required: true
  description: ISO string, epoch milliseconds, `Date`, fields object, calendar date, or Temporal value.
- name: zoneOrOptions
  type: Zone | ReadOptions
  description: Time zone string such as `'Europe/Berlin'` or `'UTC'`, or an options object.
  options:
    - name: zone
      type: Zone
      description: Time zone to view the moment in, overriding any bracketed zone in `input`.
    - name: loose
      type: boolean
      default: 'false'
      description: "Parse informal date strings and return `null` on unreadable input with `@native-dates/plugins/loose`."
    - name: dayFirst
      type: boolean
      description: "Read ambiguous numeric dates such as `'07/09/2026'` as day-first in loose mode."
```

**Returns**

```returns
type: DateTime
description: "A `DateTime` in the resolved time zone, or `null` when loose mode cannot read `input`."
```

When [`@native-dates/plugins/loose`](/plugins/loose/) is imported, loose mode parses informal strings that JavaScript's built-in parser accepts and returns `null` instead of throwing on unreadable input:

```js
import { datetime } from 'native-dates';
import '@native-dates/plugins/loose';

datetime('Mon, 16 Nov 2026 17:30:00 GMT', { zone: 'America/New_York', loose: true });
datetime('not a timestamp', { loose: true }); // null
```
:::

### Accepted inputs

Every input produces an immutable instance viewed in the target time zone:

| Input | Example | How it reads |
|---|---|---|
| ISO string with offset | `'2026-11-16T17:30:00Z'`, `'2026-11-16 12:30-05:00'` | Fixes the exact moment and views it in the target time zone. |
| Bracketed zone string | `'2026-11-16T09:30[America/New_York]'` | Keeps the bracketed zone unless a second zone argument overrides it. |
| Local date and time | `'2026-11-16T09:30'`, `'2026-11-16 09:30:00'` | Reads the date and time of day directly in the target zone. |
| Date string or CalendarDate | `'2026-11-16'`, `date(2026, 11, 16)` | Starts at the beginning of that calendar day in the target zone. |
| Milliseconds or Date | `1794850200000`, `new Date()` | Converts the Unix timestamp to the target zone and rejects invalid dates. |
| Fields object | `{ year: 2026, month: 11, day: 16, hour: 9 }` | Reads 1-indexed calendar and clock fields in the target zone and rejects impossible dates. |
| DateTime or Temporal | `dt`, `Temporal.Instant`, `Temporal.ZonedDateTime` | Preserves an existing zone unless an explicit zone argument is passed. |

:::note[Missing values never become now]
Missing values such as `undefined` or `null` throw an error so an empty database column never turns into the current time by accident. Call [`now()`](#now) when you want the live clock.
:::

## Current moment and today

Read the live clock or build query bounds for the current day in any time zone.

:::entry
### `now()` :kind[function]

```js signature
now(zone?): DateTime
```

Returns the current moment at millisecond precision in the given time zone or your configured default. Millisecond precision matches `Date.now()`, so timestamps round-trip through JSON payloads unchanged.

**Parameters**

```params
- name: zone
  type: Zone
  description: Time zone to view the current moment in, such as `'Asia/Tokyo'` or `'UTC'`.
```

**Returns**

```returns
type: DateTime
description: A `DateTime` for the current millisecond in `zone`.
```

```js
import { now } from 'native-dates';

const local = now();
const tokyo = now('Asia/Tokyo');
const utc = now('UTC');
```
:::

:::entry
### `startOfToday()` :kind[function]

```js signature
startOfToday(zone?): DateTime
```

Returns the start of today in the given time zone, matching the beginning of the local calendar day. Useful as the lower bound when querying events or records created today.

**Parameters**

```params
- name: zone
  type: Zone
  description: Time zone whose current day to measure.
```

**Returns**

```returns
type: DateTime
description: A `DateTime` at the start of today in `zone`.
```

```js
import { startOfToday } from 'native-dates';

const opens = startOfToday('America/New_York');
opens.hour; // 0
opens.minute; // 0
```
:::

:::entry
### `endOfToday()` :kind[function]

```js signature
endOfToday(zone?): DateTime
```

Returns the final millisecond of today in the given time zone.

**Parameters**

```params
- name: zone
  type: Zone
  description: Time zone whose current day to measure.
```

**Returns**

```returns
type: DateTime
description: A `DateTime` at `23:59:59.999` on today's date in `zone`.
```

```js
import { endOfToday } from 'native-dates';

const cutoff = endOfToday('America/New_York');
cutoff.hour; // 23
cutoff.millisecond; // 999
```
:::
