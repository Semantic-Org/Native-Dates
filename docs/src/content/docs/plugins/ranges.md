---
title: ranges
kind: plugin
lede: Spans between two dates, moments, or times of day, with containment, overlap, and stepping.
import: import '@native-dates/plugins/ranges'
size: ranges
updated: 2026-11-12
---

## Creating ranges

Import the plugin once to add [`to()`](#to) and [`range()`](#range) to core dates, datetimes, and times. Classes, factories, and type guards are also exported when you want to construct or test spans directly.

```js title="ranges.js"
import '@native-dates/plugins/ranges';
import { date, datetime, time } from 'native-dates';

const sprint = date('2026-09-01').to(2, 'weeks');
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles')
  .to(30, 'minutes');
const openHours = time('9:00am').to('5:30pm');

sprint.end.toString(); // '2026-09-14'
standup.end.format('time', 'en-US'); // '10:00 AM'
openHours.contains('12:00pm'); // true
```

## Inclusive dates and half-open times

Calendar date spans include both endpoints because people write dates inclusively, so September 1 through September 7 covers all seven days. Moment and clock spans exclude their end point so back-to-back bookings meet cleanly without overlapping.

| Class | Factory | Boundary rule |
|---|---|---|
| `DateRange` | `dateRange()` | Includes both start and end. September 1 through September 7 spans seven days. |
| `DateTimeRange` | `datetimeRange()` | Includes start and excludes end, so adjacent meetings never conflict. |
| `TimeRange` | `timeRange()` | Includes start, excludes end, and wraps past midnight when end is earlier than start. |

```js
import { dateRange, datetimeRange, timeRange } from '@native-dates/plugins/ranges';

const week = dateRange('2026-09-01', '2026-09-07');
week.contains('2026-09-07'); // true
week.duration.total('days'); // 7

const firstSlot = datetimeRange('2026-09-06T09:00Z', '2026-09-06T10:00Z');
const nextSlot = datetimeRange('2026-09-06T10:00Z', '2026-09-06T11:00Z');
firstSlot.overlaps(nextSlot); // false

const nightShift = timeRange('22:00', '06:00');
nightShift.contains('01:30'); // true
nightShift.duration.total('hours'); // 8
```

:::tip[Querying timestamps across a DateRange]
Call `in()` on a date range to get a half-open `DateTimeRange` from midnight on the first day to midnight after the last, ready for database queries.
:::

## Properties

Every range instance is immutable and exposes these properties.

| Property | Type | Description |
|---|---|---|
| `text` | `string` | Locale-formatted span, such as `'Sep 1 – 7, 2026'` or `'10:00 PM – 6:00 AM'`. |
| `start` | `CalendarDate \| DateTime \| Time` | Start point of the range, matching the range class. |
| `end` | `CalendarDate \| DateTime \| Time` | End point of the range, included on `DateRange` and excluded on the others. |
| `kind` | `'date' \| 'datetime' \| 'time'` | Tag identifying which point type the range holds. |
| `duration` | `Duration` | Total length anchored at `start`, counting the last day on a `DateRange`. |

## Building from points and factories

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

Creates a range starting at this point and running to an end point or across a duration. On [`CalendarDate`](/api/calendar-date/), passing a duration steps back one day at the end so a seven-day span covers seven calendar days.

**Parameters**

```params
- name: end
  type: PointInput | DurationInput | number
  required: true
  description: End point of the same kind, duration such as `'2 weeks'`, or numeric count.
- name: unit
  type: Unit
  description: Unit name when `end` is a number, such as `'days'` or `'minutes'`.
```

**Returns**

```returns
type: DateRange | DateTimeRange | TimeRange
description: A range matching the receiver type.
```

```js
const stay = date('2026-09-06').to(7, 'days');
stay.toString(); // '2026-09-06/2026-09-12'

const shift = time('9am').to('5:30pm');
shift.duration.format('long', 'en-US'); // '8 hours, 30 minutes'
```
:::

:::entry
### `range()` :kind[method]

```js signature
d.range(unit, firstDay?): DateRange
dt.range(unit, firstDay?): DateTimeRange
```

Returns the calendar or clock unit surrounding this value as a range. A calendar date produces an inclusive `DateRange` from the first day through the last, while a datetime produces a half-open `DateTimeRange` up to the next unit boundary.

**Parameters**

```params
- name: unit
  type: Unit
  required: true
  description: Calendar or clock unit to span, from `'year'` down to `'millisecond'`.
- name: firstDay
  type: Weekday
  description: First day of the week when rounding to a week, overriding the configured default.
```

**Returns**

```returns
type: DateRange | DateTimeRange
description: Surrounding unit span as a `DateRange` or `DateTimeRange`.
```

```js
date('2026-09-15').range('month').toString();
// '2026-09-01/2026-09-30'

datetime('2026-09-06T14:30Z', 'UTC').range('day').toString();
// '2026-09-06T00:00:00.000Z/2026-09-07T00:00:00.000Z'
```
:::

:::entry
### `dateRange()` :kind[function]

```js signature
dateRange(start, end, options?): DateRange
dateRange(interval, options?): DateRange
new DateRange(start, end, options?)
```

Creates an inclusive date range from two dates, a start date and duration, or a single interval string separated by a slash, dash, or the word `to`. Throws when the end date comes before the start.

**Parameters**

```params
- name: start
  type: CalendarDateInput | string
  required: true
  description: Start date, or an interval string such as `'2026-09-01/2026-09-07'` when `end` is omitted.
- name: end
  type: CalendarDateInput | DurationInput
  description: Inclusive end date or span length.
- name: options
  type: Zone | ReadOptions
  description: "Time zone for `Date` inputs, or `{ loose: true, dayFirst }` with the loose plugin."
```

**Returns**

```returns
type: DateRange
description: "Inclusive calendar date range, or `null` on unreadable input with `{ loose: true }`."
```

```js
dateRange('2026-09-01', '2026-09-07').duration.total('days'); // 7
dateRange('2026-09-01/2026-09-07').end.day; // 7
```
:::

:::entry
### `datetimeRange()` :kind[function]

```js signature
datetimeRange(start, end, options?): DateTimeRange
datetimeRange(interval, options?): DateTimeRange
new DateTimeRange(start, end, options?)
```

Creates a half-open datetime range between two moments, from a start moment and duration, or from an interval string. Local date-time strings passed as the end value inherit `start.zone` automatically.

**Parameters**

```params
- name: start
  type: DateTimeInput | string
  required: true
  description: Start moment, or an interval string when `end` is omitted.
- name: end
  type: DateTimeInput | DurationInput
  description: Exclusive end moment or span length.
- name: options
  type: Zone | ReadOptions
  description: "Time zone or `{ zone, loose, dayFirst }` options."
```

**Returns**

```returns
type: DateTimeRange
description: "Half-open moment range, or `null` on unreadable input with `{ loose: true }`."
```

```js
const slot = datetimeRange('2026-09-07T09:00', '2h', { zone: 'Europe/Berlin' });
slot.end.hour; // 11
slot.end.zone; // 'Europe/Berlin'
```
:::

:::entry
### `timeRange()` :kind[function]

```js signature
timeRange(start, end, options?): TimeRange
timeRange(interval, options?): TimeRange
new TimeRange(start, end, options?)
```

Creates a half-open time range between two times of day, across a duration, or from an interval string like `'9am - 5pm'`. When the end is earlier than the start, the range wraps across midnight as an overnight span.

```js
timeRange('9am - 5pm').duration.total('hours'); // 8
timeRange('22:00', '06:00').contains('00:30'); // true
```
:::

## Containment and overlap

:::entry
### `contains()` :kind[method]

```js signature
range.contains(value): boolean
```

Checks whether a point or another range of the same kind falls within this span. Passing a range of a different kind throws a type error.

**Parameters**

```params
- name: value
  type: PointInput | Range
  required: true
  description: Point input or range of the same kind to test.
```

**Returns**

```returns
type: boolean
description: '`true` when `value` lies completely inside this range.'
```

```js
const september = date('2026-09-15').range('month');

september.contains('2026-09-30'); // true
september.contains(date('2026-09-10').to('2026-09-20')); // true
```
:::

:::entry
### `overlaps()` :kind[method]

```js signature
range.overlaps(other): boolean
```

Returns `true` when two ranges of the same kind share at least one day or instant. Half-open ranges that meet at a single boundary do not overlap.

**Parameters**

```params
- name: other
  type: Range | string
  required: true
  description: Another range of the same kind, or an interval string.
```

**Returns**

```returns
type: boolean
description: '`true` when both ranges share any time.'
```

```js
const morning = time('09:00').to('12:00');

morning.overlaps('11:30/13:00'); // true
morning.overlaps('12:00/13:00'); // false
```
:::

:::entry
### `intersection()` :kind[method]

```js signature
range.intersection(other): DateRange | DateTimeRange | TimeRange | null
```

Returns the shared span between two overlapping ranges of the same kind, or `null` when they do not overlap. Two overnight time ranges that cross midnight in two separate pieces throw an error.

**Parameters**

```params
- name: other
  type: Range | string
  required: true
  description: Another range of the same kind, or an interval string.
```

**Returns**

```returns
type: DateRange | DateTimeRange | TimeRange | null
description: Overlapping sub-range of the same kind, or `null`.
```

```js
const a = date('2026-09-01').to('2026-09-30');
const b = date('2026-09-20').to('2026-10-10');

a.intersection(b)?.toString(); // '2026-09-20/2026-09-30'
```
:::

:::entry
### `equals()` :kind[method]

```js signature
range.equals(other): boolean
```

Returns `true` when another range or interval string of the same kind has equal start and end points.

```js
time('22:00').to('06:00').equals('22:00:00/06:00:00'); // true
```
:::

:::entry
### `isEmpty()` :kind[method]

```js signature
range.isEmpty(): boolean
```

Returns `true` on a datetime or time range whose start and end are equal. Always false on a date range, since equal start and end dates still span one full calendar day.

```js
datetime('2026-09-06T09:00Z').to('2026-09-06T09:00Z').isEmpty(); // true
date('2026-09-06').to('2026-09-06').isEmpty(); // false
```
:::

## Stepping, splitting, and zones

:::entry
### `points()` :kind[method]

```js signature
range.points(step): Point[]
range.points(count, unit): Point[]
d.points(step, zone?): DateTime[]
d.points(count, unit, zone?): DateTime[]
```

Walks forward from the start by a positive step and returns every point inside the range. Steps count outward from the start, so stepping monthly from January 31 lands on each month's final day rather than drifting to the 28th. Also available directly on `CalendarDate` to walk a single day in a time zone.

**Parameters**

```params
- name: step
  type: Unit | DurationInput | number
  required: true
  description: Unit name such as `'day'`, duration such as `'30m'`, or numeric count.
- name: unit
  type: Unit
  description: Unit name when `step` is a number.
- name: zone
  type: Zone
  description: Time zone when calling `points()` directly on a `CalendarDate`.
```

**Returns**

```returns
type: Array<CalendarDate | DateTime | Time>
description: Ordered array of points inside the range.
```

```js
date('2026-01-31').to(4, 'months').points('month').map(String);
// ['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30']

time('09:00').to('11:00').points(30, 'minutes').map(String);
// ['09:00:00', '09:30:00', '10:00:00', '10:30:00']
```
:::

:::entry
### `split()` :kind[method]

```js signature
range.split(step): Range[]
range.split(count, unit): Range[]
d.split(step, zone?): DateTimeRange[]
d.split(count, unit, zone?): DateTimeRange[]
```

Divides a range into consecutive sub-ranges of the given step, trimming the final piece to the end of the range. Calling `split()` on a calendar date slices that day into datetime slots in a time zone, yielding 23 or 25 hour slots across daylight saving transitions.

**Parameters**

```params
- name: step
  type: Unit | DurationInput | number
  required: true
  description: Unit name, duration, or numeric count paired with `unit`.
- name: unit
  type: Unit
  description: Unit name when `step` is a number.
- name: zone
  type: Zone
  description: Time zone when calling `split()` on a `CalendarDate`.
```

**Returns**

```returns
type: Range[]
description: Non-overlapping sub-ranges covering the full span.
```

```js
date('2026-01-01').range('year').split('quarter').map(String);
// ['2026-01-01/2026-03-31', '2026-04-01/2026-06-30', '2026-07-01/2026-09-30', '2026-10-01/2026-12-31']

date('2026-03-08').split('hour', 'America/New_York').length; // 23
```
:::

:::entry
### `in()` :kind[method]

```js signature
dateRange.in(zone?): DateTimeRange
datetimeRange.in(zone?): DateTimeRange
```

Converts a date range into the half-open `DateTimeRange` covering all of its days in the target zone, from midnight on the first day to midnight after the last. On a datetime range, it views both endpoints in the target zone, while a time range throws because it has no date.

**Parameters**

```params
- name: zone
  type: Zone
  description: Target time zone, defaulting to the configured zone.
```

**Returns**

```returns
type: DateTimeRange
description: Half-open `DateTimeRange` in the target time zone.
```

```js
const bounds = date('2026-09-01').to('2026-09-07').in('UTC');
bounds.toString(); // '2026-09-01T00:00:00.000Z/2026-09-08T00:00:00.000Z'
```
:::

## Formatting, serialization, and guards

:::entry
### `format()` :kind[method]

```js signature
range.format(spec?, locale?): string
```

Formats the range as a single localized phrase, collapsing shared month or year labels automatically. Accepts core preset names or an `Intl` options object, and refuses token patterns.

**Parameters**

```params
- name: spec
  type: FormatSpec
  description: Preset style such as `'medium'` or `'time'`, or an `Intl.DateTimeFormatOptions` object.
- name: locale
  type: string
  description: BCP 47 locale tag overriding the configured default.
```

**Returns**

```returns
type: string
description: Localized range phrase.
```

```js
date('2026-09-01').to('2026-09-07').format('medium', 'en-US'); // 'Sep 1 – 7, 2026'
datetime('2026-09-06T09:00Z', 'UTC').to(1, 'hour').format('time', 'en-US'); // '9:00 – 10:00 AM'
```
:::

:::entry
### `as()` :kind[method]

```js signature
range.as('duration'): Duration
```

Returns the range's [`Duration`](/api/duration/) inside a method chain, matching `range.duration`.

```js
date('2026-09-01').to('2026-09-07').as('duration').as('days'); // 7
```
:::

:::entry
### `toString()` :kind[method]

```js signature
range.toString(): string
range.toJSON(): string
```

Serializes the range as an ISO 8601 slash-separated interval string, which `toJSON()` also returns for JSON output.

```js
const week = date('2026-09-01').to('2026-09-07');

week.toString(); // '2026-09-01/2026-09-07'
JSON.stringify({ week }); // '{"week":"2026-09-01/2026-09-07"}'
```
:::

:::entry
### `isDateRange()` :kind[guard]

```js signature
isDateRange(value): value is DateRange
isDateTimeRange(value): value is DateTimeRange
isTimeRange(value): value is TimeRange
```

Type guards that check for a date, datetime, or time range across realms and bundles.

```js
import { isDateRange, isDateTimeRange, isTimeRange } from '@native-dates/plugins/ranges';

isDateRange(date('2026-09-01').to('2026-09-07')); // true
isDateTimeRange(datetime('2026-09-06T09:00Z').to(1, 'hour')); // true
isTimeRange(time('09:00').to('17:00')); // true
```
:::
