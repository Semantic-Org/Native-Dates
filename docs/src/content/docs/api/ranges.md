---
title: Ranges
lede: Spans between two dates, moments, or times of day, with containment, overlap, and stepping.
import: import { DateRange, DateTimeRange, TimeRange } from 'native-dates'
size: core
updated: 2026-11-12
---

## Range classes

Create ranges from existing points with [`to()`](#to) and [`range()`](#range), or parse endpoints and interval strings with standalone factories on [`dateRange()`](/api/range-fn/). Every range instance is immutable.

:::note[Inclusive dates vs half-open clocks]
Calendar date ranges include their final day, because September 1 through September 7 means all seven days. Moment and clock ranges exclude their end so back-to-back slots meet without overlapping.
:::

:::entry
### `DateRange` :kind[class]

```js signature
new DateRange(start, end, options?)
new DateRange(interval, options?)
```

Spans two [calendar dates](/api/calendar-date/) and includes both endpoints. Passing an end date earlier than the start date throws a `RangeError`.

```js title="ranges.js"
import { date, dateRange } from 'native-dates';

const trip = date('2026-09-01').to('2026-09-07');
const week = dateRange('2026-09-01', '7 days');

trip.duration.days; // 7
week.toString(); // '2026-09-01/2026-09-07'
```
:::

:::entry
### `DateTimeRange` :kind[class]

```js signature
new DateTimeRange(start, end, options?)
new DateTimeRange(interval, options?)
```

Spans two [moments](/api/date-time/), including `start` and excluding `end`. When the end input carries no explicit time zone, it is read in the start moment's zone, and backwards endpoints throw a `RangeError`.

```js
import { datetime, datetimeRange } from 'native-dates';

const standup = datetime('2026-09-01T09:00', 'America/New_York').to('30m');
const block = datetimeRange('2026-09-01T09:00', '2026-09-01T10:30', 'America/New_York');

standup.duration.minutes; // 30
block.end.hour; // 10
```
:::

:::entry
### `TimeRange` :kind[class]

```js signature
new TimeRange(start, end, options?)
new TimeRange(interval, options?)
```

Spans two [times of day](/api/time/), including `start` and excluding `end`. When the end time is earlier on the clock than the start time, the range wraps across midnight to model overnight hours.

```js
import { time, timeRange } from 'native-dates';

const dayShift = time('9:00am').to('5:00pm');
const nightShift = timeRange('22:00', '06:00');

dayShift.duration.hours; // 8
nightShift.duration.hours; // 8
```
:::

## Properties

Every range exposes its formatted label, typed endpoints, kind tag, and measured length.

| Property | Type | Description |
|---|---|---|
| `text` | `string` | Locale-formatted range string, such as `'Sep 1 – 7, 2026'`. |
| `start`, `end` | `CalendarDate \| DateTime \| Time` | Start and end points matching the range class. |
| `kind` | `'date' \| 'datetime' \| 'time'` | Tag naming which kind of points the range holds. |
| `duration` | `Duration` | Full length anchored at `start`, counting the last day on date ranges and crossing midnight on overnight clock ranges. |

## Building from points

:::entry
### `to()` :kind[method]

```js signature
d.to(end): DateRange
d.to(count, unit): DateRange
dt.to(end): DateTimeRange
dt.to(count, unit): DateTimeRange
t.to(end): TimeRange
t.to(count, unit): TimeRange
```

Builds a range from this point to an end point or across a duration. On a [calendar date](/api/calendar-date/), passing a length of 7 days lands six days after `start` because both endpoints are included.

**Parameters**

```params
- name: end
  type: Point | DurationInput | number
  required: true
  description: Target endpoint of the same kind, duration input, or numeric `count` paired with `unit`.
- name: unit
  type: Unit
  description: Unit name when the first argument is a numeric count.
```

**Returns**

```returns
type: DateRange | DateTimeRange | TimeRange
description: A range matching the receiver's kind.
```

```js
import { date, datetime, time } from 'native-dates';

date('2026-09-01').to(7, 'days').toString(); // '2026-09-01/2026-09-07'
datetime('2026-09-01T09:00Z', 'UTC').to(90, 'minutes').toString(); // '2026-09-01T09:00:00.000Z/2026-09-01T10:30:00.000Z'
time('9:00am').to('5:00pm').toString(); // '09:00:00/17:00:00'
```
:::

:::entry
### `range()` :kind[method]

```js signature
d.range(unit, firstDay?): DateRange
dt.range(unit, firstDay?): DateTimeRange
```

Returns the full calendar or clock unit enclosing a date or moment. Date ranges span the first through last day of the unit, while moment ranges span from the unit's start until the start of the next unit.

**Parameters**

```params
- name: unit
  type: Unit
  required: true
  description: Enclosing unit such as `'week'`, `'month'`, or `'day'`.
- name: firstDay
  type: Weekday
  description: First day of the week when `unit` is `'week'`, overriding `configure()`.
```

**Returns**

```returns
type: DateRange | DateTimeRange
description: Enclosing range for `unit`.
```

```js
import { date, datetime } from 'native-dates';

date('2026-11-18').range('week').toString(); // '2026-11-16/2026-11-22'
date('2026-02-10').range('month').toString(); // '2026-02-01/2026-02-28'
datetime('2026-11-16T14:20Z', 'UTC').range('hour').toString(); // '2026-11-16T14:00:00.000Z/2026-11-16T15:00:00.000Z'
```
:::

## Containment and overlap

:::entry
### `contains()` :kind[method]

```js signature
range.contains(value): boolean
```

Checks whether a point or another range of the same kind lies inside this range. Date ranges include `end`, moment and clock ranges exclude it, and overnight clock ranges match times on either side of midnight.

**Parameters**

```params
- name: value
  type: Point | Range
  required: true
  description: Point input or range of the same kind.
```

**Returns**

```returns
type: boolean
description: "`true` when `value` falls inside this range."
```

```js
const stay = dateRange('2026-09-01', '2026-09-07');
stay.contains('2026-09-07'); // true

const night = timeRange('22:00', '06:00');
night.contains('23:30'); // true
night.contains('02:15'); // true
night.contains('06:00'); // false
```
:::

:::entry
### `overlaps()` :kind[method]

```js signature
range.overlaps(other): boolean
```

Returns `true` when two ranges of the same kind share at least one day or instant. Back-to-back moment or clock slots where the first ends at the second's start do not overlap.

**Parameters**

```params
- name: other
  type: Range | string
  required: true
  description: Range instance or interval string of the same kind.
```

**Returns**

```returns
type: boolean
description: "`true` when both ranges share time."
```

```js
const firstSlot = timeRange('09:00', '10:00');
const nextSlot = timeRange('10:00', '11:00');

firstSlot.overlaps(nextSlot); // false
dateRange('2026-09-01', '2026-09-05').overlaps('2026-09-05/2026-09-10'); // true
```
:::

:::entry
### `intersection()` :kind[method]

```js signature
range.intersection(other): Range | null
```

Returns a new range covering only the span shared by both ranges, or `null` when they are disjoint. Two overnight clock ranges that cross in two separate pieces throw a `RangeError`.

**Parameters**

```params
- name: other
  type: Range | string
  required: true
  description: Range instance or interval string of the same kind.
```

**Returns**

```returns
type: DateRange | DateTimeRange | TimeRange | null
description: Overlapping range of the same kind, or `null` when disjoint.
```

```js
const a = dateRange('2026-09-01', '2026-09-10');
const b = dateRange('2026-09-05', '2026-09-15');

a.intersection(b)?.toString(); // '2026-09-05/2026-09-10'
a.intersection('2026-09-20/2026-09-25'); // null
```
:::

:::entry
### `equals()` :kind[method]

```js signature
range.equals(other): boolean
```

Returns true when both ranges have equal start and end points. Arrays of ranges also sort chronologically with [`compare()`](/api/compare/).

```js
dateRange('2026-09-01', '2026-09-07').equals('2026-09-01/2026-09-07'); // true
```
:::

:::entry
### `isEmpty()` :kind[method]

```js signature
range.isEmpty(): boolean
```

Returns true when a moment or clock range has identical start and end points. Always returns false on a `DateRange` because a single calendar date spans one full day.

```js
timeRange('09:00', '09:00').isEmpty(); // true
dateRange('2026-09-01', '2026-09-01').isEmpty(); // false
```
:::

## Stepping, splitting, and zones

:::entry
### `points()` :kind[method]

```js signature
range.points(step): Point[]
range.points(count, unit): Point[]
```

Walks forward from `start` by a positive unit or duration and returns every point inside the range. Steps count out from the starting point rather than chaining additions, so stepping monthly from January 31 lands on each month's final day.

**Parameters**

```params
- name: step
  type: Unit | DurationInput | number
  required: true
  description: Unit name such as `'day'`, duration input, or numeric `count` paired with `unit`.
- name: unit
  type: Unit
  description: Unit name when `step` is a number.
```

**Returns**

```returns
type: Array<CalendarDate | DateTime | Time>
description: Ordered array of points inside the range.
```

```js
dateRange('2026-01-31', '2026-04-30').points('month').map(String);
// ['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30']

timeRange('22:00', '02:00').points(1, 'hour').map(String);
// ['22:00:00', '23:00:00', '00:00:00', '01:00:00']
```
:::

:::entry
### `split()` :kind[method]

```js signature
range.split(step): Range[]
range.split(count, unit): Range[]
```

Divides the range into contiguous sub-ranges of the given step size, clamping the final chunk to the range's end. Accepts the same step arguments as [`points()`](#points).

```js
dateRange('2026-09-01', '2026-09-10').split(4, 'days').map(String);
// ['2026-09-01/2026-09-04', '2026-09-05/2026-09-08', '2026-09-09/2026-09-10']
```
:::

:::entry
### `in()` :kind[method]

```js signature
dateRange.in(zone?): DateTimeRange
dtRange.in(zone): DateTimeRange
```

Converts a `DateRange` into a half-open `DateTimeRange` from midnight on the start day until midnight after the final day, matching timestamp query bounds. On a moment range, shifts both endpoints into the target time zone.

Calling `in()` on a clock range throws a `RangeError` because times of day have no calendar date.

**Parameters**

```params
- name: zone
  type: Zone
  description: Target IANA zone, fixed offset, or `'UTC'`. Defaults to the configured zone on `DateRange`.
```

**Returns**

```returns
type: DateTimeRange
description: Half-open moment range in `zone`.
```

```js
dateRange('2026-09-01', '2026-09-03').in('UTC').toString();
// '2026-09-01T00:00:00.000Z/2026-09-04T00:00:00.000Z'
```
:::

## Formatting and conversion

:::entry
### `format()` :kind[method]

```js signature
range.format(spec?, locale?): string
```

Formats the range with localized `Intl` range formatting for presets and options objects, collapsing shared dates or months automatically. Token patterns like `'YYYY-MM-DD'` format each endpoint with the pattern and join them with `' – '`.

See [Formatting](/guides/formatting/) for preset and token details.

**Parameters**

```params
- name: spec
  type: FormatSpec
  description: Preset name, `Intl.DateTimeFormatOptions` object, or token pattern.
- name: locale
  type: Locale
  description: BCP 47 locale tag overriding the configured default for this call.
```

**Returns**

```returns
type: string
description: Formatted range string.
```

```js
const trip = dateRange('2026-09-01', '2026-09-07');

trip.format('medium', 'en-US'); // 'Sep 1 – 7, 2026'
trip.format('YYYY-MM-DD'); // '2026-09-01 – 2026-09-07'
timeRange('22:00', '06:00').format('HH:mm'); // '22:00 – 06:00'
```
:::

:::entry
### `as()` :kind[method]

```js signature
range.as('duration'): Duration
```

Returns the range's duration when `'duration'` is requested in method chains, throwing a `RangeError` for other kinds.

```js
dateRange('2026-09-01', '2026-09-07').as('duration').days; // 7
```
:::

:::entry
### `toString()` :kind[method]

```js signature
range.toString(): string
range.toJSON(): string
```

Returns the ISO 8601 interval string `'start/end'`, which parses back directly in the [range factories](/api/range-fn/). `toJSON()` returns the same string for JSON serialization.

```js
dateRange('2026-09-01', '2026-09-07').toString(); // '2026-09-01/2026-09-07'
timeRange('9am', '5pm').toJSON(); // '09:00:00/17:00:00'
```
:::

:::entry
### `valueOf()` :kind[method]

```js signature
range.valueOf(): never
```

Throws a `RangeError` so numeric operators never coerce a range to a number.

Narrow unknown values at runtime with [`kindOf()`](/api/kind-of/) or the exported range guard functions:

```js
import { dateRange, isDateRange, isDateTimeRange, isTimeRange } from 'native-dates';

const stay = dateRange('2026-09-01', '2026-09-07');
isDateRange(stay); // true
isDateTimeRange(stay); // false
isTimeRange(stay); // false
```
:::
