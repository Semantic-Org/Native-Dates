---
title: ranges
kind: plugin
lede: Subtract overlapping spans and coalesce adjacent ranges across every range type.
import: import '@native-dates/plugins/ranges'
size: ranges
updated: 2026-11-24
---

## Range set operations

Core [ranges](/api/ranges/) include containment, overlap checks, and intersection. Importing this plugin attaches `subtract()` and `union()` onto `DateRange`, `DateTimeRange`, and `TimeRange`, and exports `mergeRanges()` for coalescing lists of ranges.

```js title="ranges.js"
import { mergeRanges } from '@native-dates/plugins/ranges';
import { dateRange, timeRange } from 'native-dates';

const trip = dateRange('2026-11-01', '2026-11-10');
trip.subtract('2026-11-04/2026-11-06').map(String);
// ['2026-11-01/2026-11-03', '2026-11-07/2026-11-10']

dateRange('2026-11-01', '2026-11-05').union('2026-11-06/2026-11-10')?.toString();
// '2026-11-01/2026-11-10'

mergeRanges([
  timeRange('22:00', '02:00'),
  timeRange('01:00', '06:00'),
  timeRange('10:00', '12:00'),
]).map(String);
// ['10:00:00/12:00:00', '22:00:00/06:00:00']
```

Each range class keeps its own endpoint convention. Calendar date ranges are inclusive at both ends, while moment and clock ranges exclude their end point.

## Instance methods

:::entry
### `subtract()` :kind[method]

```js signature
range.subtract(other): Range[]
```

Removes the span covered by `other` from this range and returns zero, one, or two remaining ranges of the same kind. Returned ranges keep the receiver's locale and time zone.

Subtracting a disjoint or empty range returns the original range in a one-element array. Calling `subtract()` on an empty moment or clock range returns an empty array.

**Parameters**

```params
- name: other
  type: Range | string
  required: true
  description: Range instance or interval string of the same kind to remove.
```

**Returns**

```returns
type: Array<DateRange | DateTimeRange | TimeRange>
description: Ordered array of remaining ranges of the same kind.
```

```js
import '@native-dates/plugins/ranges';
import { dateRange, datetimeRange, timeRange } from 'native-dates';

dateRange('2026-11-01', '2026-11-10').subtract('2026-11-01/2026-11-03').map(String);
// ['2026-11-04/2026-11-10']

const day = datetimeRange('2026-11-02T09:00', '2026-11-02T17:00', 'America/New_York');
day.subtract('2026-11-02T12:00/2026-11-02T13:00').map((part) => `${part.start.hour}-${part.end.hour}`);
// ['9-12', '13-17']

timeRange('22:00', '06:00').subtract('23:00 - 02:00').map(String);
// ['22:00:00/23:00:00', '02:00:00/06:00:00']
```
:::

:::entry
### `union()` :kind[method]

```js signature
range.union(other): Range | null
```

Combines this range with an overlapping or directly adjacent range of the same kind, returning `null` when a gap separates them. Returned ranges keep the receiver's locale and time zone.

Two `DateRange` values count as adjacent when the second starts the day after the first ends. Two `DateTimeRange` or `TimeRange` values count as adjacent when one ends at the exact start of the other, and empty ranges act as no-ops.

**Parameters**

```params
- name: other
  type: Range | string
  required: true
  description: Range instance or interval string of the same kind to combine with.
```

**Returns**

```returns
type: DateRange | DateTimeRange | TimeRange | null
description: "Combined range of the same kind, or `null` when a gap separates them."
```

```js
import '@native-dates/plugins/ranges';
import { dateRange, timeRange } from 'native-dates';

dateRange('2026-11-01', '2026-11-05').union('2026-11-06/2026-11-10')?.toString();
// '2026-11-01/2026-11-10'

dateRange('2026-11-01', '2026-11-05').union('2026-11-07/2026-11-10');
// null

timeRange('22:00', '06:00').union('06:00 - 08:00')?.toString();
// '22:00:00/08:00:00'
```
:::

## Merging collections

:::entry
### `mergeRanges()` :kind[function]

```js signature
mergeRanges(ranges): Range[]
```

Sorts an iterable of same-kind ranges and coalesces every overlapping or adjacent span into minimal disjoint ranges. Empty moment and clock ranges are omitted from the output.

Passing mixed range kinds throws a `TypeError` with code `conflictingRanges`, and passing non-range items throws a `TypeError` with code `invalidRange`.

**Parameters**

```params
- name: ranges
  type: Iterable<DateRange> | Iterable<DateTimeRange> | Iterable<TimeRange>
  required: true
  description: Array, Set, or other iterable of ranges sharing one kind.
```

**Returns**

```returns
type: Array<DateRange | DateTimeRange | TimeRange>
description: Minimal sorted array of non-overlapping ranges of the same kind.
```

```js
import { mergeRanges } from '@native-dates/plugins/ranges';
import { dateRange, datetimeRange } from 'native-dates';

mergeRanges([
  dateRange('2026-11-12', '2026-11-15'),
  dateRange('2026-11-01', '2026-11-05'),
  dateRange('2026-11-06', '2026-11-08'),
]).map(String);
// ['2026-11-01/2026-11-08', '2026-11-12/2026-11-15']

mergeRanges([
  datetimeRange('2026-11-02T11:00', '2026-11-02T12:00', 'UTC'),
  datetimeRange('2026-11-02T09:00', '2026-11-02T11:00', 'UTC'),
]).map((part) => part.duration.hours);
// [3]
```
:::

## Overnight clock ranges

Overnight `TimeRange` values wrap across midnight cleanly in `subtract()`, `union()`, and `mergeRanges()`. Adjacent pieces that touch midnight stitch back into a single overnight range.

```js
import '@native-dates/plugins/ranges';
import { timeRange } from 'native-dates';

timeRange('22:00', '06:00').subtract('01:00 - 03:00').map(String);
// ['22:00:00/01:00:00', '03:00:00/06:00:00']

timeRange('22:00', '00:00').union('00:00 - 06:00')?.toString();
// '22:00:00/06:00:00'
```

:::note[Full 24-hour clock coverage]
A `TimeRange` with equal start and end times is empty, so no single `TimeRange` can represent all 24 hours. Calling `union()` or `mergeRanges()` on clock ranges that cover the entire day throws a `RangeError` with code `unsupportedUnion`.
:::
