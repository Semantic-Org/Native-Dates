---
title: compare()
kind: function
lede: Sort and pick boundary values across dates, moments, times, durations, and ranges.
import: import { compare, earliest, latest } from 'native-dates'
size: core
updated: 2026-11-16
---

## Sorting and ordering

:::entry
### `compare()` :kind[function]

```js signature
compare(a, b): -1 | 0 | 1
```

Orders two values of the same kind for `Array.prototype.sort()`, returning negative, zero, or positive numbers. Works across moments, epoch timestamps, calendar dates, clock times, durations, [year-month values](/api/year-month/), and [ranges](/api/ranges/).

Either argument can also be a raw ISO string, native JavaScript `Date`, or epoch millisecond timestamp. When compared with a clock time, a number is read as an hour, while comparing different kinds throws a `TypeError`.

```js title="sort.js"
import { compare, date, datetime, hours, minutes } from 'native-dates';

const dates = [date('2026-12-01'), date('2026-05-10'), date('2026-08-20')];
dates.sort(compare).map(String); // ['2026-05-10', '2026-08-20', '2026-12-01']

const moments = [
  datetime('2026-11-16T18:00', 'Europe/Berlin'),
  datetime('2026-11-16T08:00', 'America/Los_Angeles'),
];
moments.sort(compare)[0].zone; // 'America/Los_Angeles'

compare(1794840000000, datetime('2026-11-16T18:00Z')); // -1

const spans = [hours(2), minutes(45), minutes(90)].sort(compare);
spans[0].minutes; // 45
```

**Parameters**

```params
- name: a
  type: Point | Duration | YearMonth | Range
  required: true
  description: First typed value, ISO string, `Date`, or epoch millisecond timestamp to compare.
- name: b
  type: Point | Duration | YearMonth | Range
  required: true
  description: Second value of the same kind, or a raw input matching `a`.
```

**Returns**

```returns
type: -1 | 0 | 1
description: "Returns `-1` when the first value comes earlier, `0` when equal, and `1` when later."
```

Ranges of the same kind sort by their start point first and break ties by their end point:

```js
import { compare, dateRange } from 'native-dates';

const windows = [
  dateRange('2026-11-10', '2026-11-20'),
  dateRange('2026-11-10', '2026-11-14'),
  dateRange('2026-11-01', '2026-11-05'),
];

windows.sort(compare).map(String);
// ['2026-11-01/2026-11-05', '2026-11-10/2026-11-14', '2026-11-10/2026-11-20']
```
:::

:::note[Comparing moments across time zones]
`compare()` orders [`DateTime`](/api/date-time/) values by their exact instant rather than their local clock digits. A 9:00 AM meeting in New York sorts before an 8:00 AM meeting on the same day in Los Angeles.
:::

## Picking boundary points

Find the minimum or maximum value across a set of dates, moments, clock times, or [`YearMonth`](/api/year-month/) values. Both helpers accept rest arguments or a single non-empty array.

:::entry
### `earliest()` :kind[function]

```js signature
earliest(...points): DateTime | CalendarDate | Time | YearMonth
earliest(points): DateTime | CalendarDate | Time | YearMonth
```

Returns the earliest value from one or more arguments or a non-empty array of the same kind, converting raw dates or epoch millisecond inputs into a [`DateTime`](/api/date-time/). Passing an empty array throws a `RangeError`.

**Parameters**

```params
- name: points
  type: Point[] | YearMonth[]
  required: true
  description: One or more dates, moments, epoch timestamps, clock times, or year-months of the same kind.
```

**Returns**

```returns
type: DateTime | CalendarDate | Time | YearMonth
description: The value that comes first. Equal moments keep the earlier item in the list.
```

```js
import { date, earliest, time } from 'native-dates';

earliest(date('2026-11-20'), date('2026-11-04'), date('2026-11-16')).toString(); // '2026-11-04'
earliest([time('5:30pm'), time('9:00am'), time('12:15pm')]).toString(); // '09:00:00'
earliest(1794850200000, 1794840000000).epochMilliseconds; // 1794840000000
```
:::

:::entry
### `latest()` :kind[function]

```js signature
latest(...points): DateTime | CalendarDate | Time | YearMonth
latest(points): DateTime | CalendarDate | Time | YearMonth
```

Returns the latest value from one or more arguments or a non-empty array of the same kind. Passing an empty array throws a `RangeError`.

**Parameters**

```params
- name: points
  type: Point[] | YearMonth[]
  required: true
  description: One or more dates, moments, clock times, or year-months of the same kind.
```

**Returns**

```returns
type: DateTime | CalendarDate | Time | YearMonth
description: The value that comes last. Equal moments keep the earlier item in the list.
```

Combine [`earliest()`](#earliest) and `latest()` to clamp a value between two bounds:

```js
import { date, earliest, latest } from 'native-dates';

const minDate = date('2026-11-01');
const maxDate = date('2026-11-30');
const picked = date('2026-12-12');

const clamped = earliest(maxDate, latest(minDate, picked));
clamped.toString(); // '2026-11-30'
```
:::
