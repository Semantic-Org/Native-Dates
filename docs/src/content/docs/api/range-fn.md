---
title: dateRange()
kind: function
lede: Create a DateRange, DateTimeRange, or TimeRange from endpoints, durations, or interval strings.
import: import { dateRange, datetimeRange, timeRange } from 'native-dates'
size: core
updated: 2026-11-12
---

## Creating ranges

Standalone factories construct [Ranges](/api/ranges/) from raw inputs, endpoint pairs, or single interval strings. When you already hold a typed point, call [`to()`](/api/ranges/#to) or [`range()`](/api/ranges/#range) on it directly.

:::entry
### `dateRange()` :kind[function]

```js signature
dateRange(start, end, options?): DateRange
dateRange(interval, options?): DateRange
```

Creates an inclusive [`DateRange`](/api/ranges/#daterange) spanning two calendar dates. When the second argument is a duration like `'7 days'`, the final day sits six days after the start date so the span covers seven days total.

```js title="dates.js"
import { dateRange, days } from 'native-dates';

const fromEnds = dateRange('2026-09-01', '2026-09-07');
const fromLength = dateRange('2026-09-01', days(7));
const fromInterval = dateRange('2026-09-01/2026-09-07');

fromEnds.duration.days; // 7
fromLength.toString(); // '2026-09-01/2026-09-07'
fromInterval.equals(fromEnds); // true
```

**Parameters**

```params
- name: start
  type: CalendarDateInput | string
  required: true
  description: Start date input, or a full interval string when `end` is omitted.
- name: end
  type: CalendarDateInput | DurationInput | ReadOptions
  description: Inclusive end date, duration length, or options object when `start` is an interval string.
- name: options
  type: Zone | ReadOptions
  description: Time zone or read options applied when parsing endpoints.
  options:
    - name: zone
      type: Zone
      description: Time zone used to extract calendar days from instant strings or `Date` objects.
    - name: loose
      type: boolean
      default: 'false'
      description: "Parse informal date strings and return `null` on unreadable input with `@native-dates/plugins/loose`."
    - name: dayFirst
      type: boolean
      description: "Interpret ambiguous numeric dates day-first in loose mode."
```

**Returns**

```returns
type: DateRange
description: "An inclusive `DateRange`, or `null` when loose mode cannot read an endpoint."
```
:::

:::entry
### `datetimeRange()` :kind[function]

```js signature
datetimeRange(start, end, options?): DateTimeRange
datetimeRange(interval, options?): DateTimeRange
```

Creates a half-open [`DateTimeRange`](/api/ranges/#datetimerange) that includes its start moment and excludes its end. When the end input carries no explicit time zone, it is read in the start moment's zone.

**Parameters**

```params
- name: start
  type: DateTimeInput | string
  required: true
  description: Start moment input, or an interval string when `end` is omitted.
- name: end
  type: DateTimeInput | DurationInput | ReadOptions
  description: Exclusive end moment, duration length, or options object for an interval string.
- name: options
  type: Zone | ReadOptions
  description: Time zone or read options for both endpoints.
```

**Returns**

```returns
type: DateTimeRange
description: "A half-open `DateTimeRange`, or `null` when loose mode cannot read an endpoint."
```

```js
import { datetimeRange } from 'native-dates';

const meeting = datetimeRange('2026-09-01T09:00', '90m', 'America/New_York');
meeting.end.format('short', 'en-US'); // '9/1/26, 10:30 AM'

const zoned = datetimeRange('2026-09-01T09:00[America/New_York]/2026-09-01T10:30[America/New_York]');
zoned.start.zone; // 'America/New_York'
```
:::

:::entry
### `timeRange()` :kind[function]

```js signature
timeRange(start, end, options?): TimeRange
timeRange(interval, options?): TimeRange
```

Creates a half-open [`TimeRange`](/api/ranges/#timerange) between two times of day, excluding its end time. When the end time is earlier on the clock than the start time, the range wraps across midnight.

**Parameters**

```params
- name: start
  type: TimeInput | string
  required: true
  description: Start clock input, or an interval string when `end` is omitted.
- name: end
  type: TimeInput | DurationInput | ReadOptions
  description: Exclusive end time, clock duration, or options object for an interval string.
- name: options
  type: Zone | ReadOptions
  description: Time zone or read options when extracting times from timestamps.
```

**Returns**

```returns
type: TimeRange
description: "A half-open `TimeRange`, or `null` when loose mode cannot read an endpoint."
```

```js
import { timeRange } from 'native-dates';

const office = timeRange('9am - 5pm');
const overnight = timeRange('22:00', '8h');

office.toString(); // '09:00:00/17:00:00'
overnight.toString(); // '22:00:00/06:00:00'
```
:::

## Interval strings and loose mode

Single-string intervals split on an ISO slash or on spaced range separators. Slashes inside bracketed IANA zone names stay untouched.

| Form | Example | How it reads |
|---|---|---|
| ISO slash interval | `'2026-09-01/2026-09-07'`, `'09:00/17:00'` | Splits on `/` outside bracketed time zone names, matching `toString()` output. |
| Spaced hyphen or en-dash | `'9am - 5pm'`, `'2026-09-01 – 2026-09-07'` | Splits on `-` or `–` surrounded by spaces so hyphens inside ISO dates stay intact. |
| English `to` separator | `'2026-09-01 to 2026-09-07'` | Splits on ` to ` surrounded by spaces. |
| Start and length | `dateRange('2026-09-01', '7d')`, `timeRange('9am', '90m')` | Reads the second argument as a duration when it is a `Duration`, duration fields, or duration phrase. |

With the [loose plugin](/plugins/loose/) loaded, loose mode parses informal endpoints and returns `null` when an endpoint cannot be read:

```js
import { dateRange } from 'native-dates';
import '@native-dates/plugins/loose';

dateRange('Sep 1, 2026 to Sep 7, 2026', { loose: true })?.toString();
// '2026-09-01/2026-09-07'

dateRange('not a range', { loose: true }); // null
```
