---
source: "c784c44bf2d7"
title: ranges
lede: 在所有范围类型上减去重叠区间，并合并相邻范围。
---

## 范围集合运算

核心库的[范围](/api/ranges/)已内置包含检测、重叠判断与交集计算。导入本插件后，会为 `DateRange`、`DateTimeRange` 与 `TimeRange` 挂载 `subtract()` 和 `union()` 方法，并导出用于合并一组范围的 `mergeRanges()` 函数。

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

每种范围类都延续各自的端点约定：日历日期范围包含起止两端点，日期时间范围与时钟时间范围则不包含终点。

## 实例方法

:::entry
### `subtract()` :kind[method]

```js signature
range.subtract(other): Range[]
```

从当前范围中减去 `other` 覆盖的区间，按剩余情况返回 0 个、1 个或 2 个同类型范围。返回的范围会保留调用方原有的区域设置与时区。

减去不相交的范围或空范围时，返回仅包含原范围的单元素数组。在空的日期时间范围或时钟时间范围上调用 `subtract()` 会返回空数组。

**参数**

```params
- name: other
  type: Range | string
  required: true
  description: 要减去的同类型范围实例或区间字符串。
```

**返回值**

```returns
type: Array<DateRange | DateTimeRange | TimeRange>
description: 按时间排序的同类型剩余范围数组。
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

将当前范围与重叠或紧邻的同类型范围合并；如果两者之间存在间隔，则返回 `null`。返回的范围会保留调用方原有的区域设置与时区。

对于两个 `DateRange`，当后者的起始日恰好是前者结束日的次日时即视为相邻。对于两个 `DateTimeRange` 或 `TimeRange`，当一个范围的终点恰好等于另一个范围的起点时视为相邻，空范围则视为无操作。

**参数**

```params
- name: other
  type: Range | string
  required: true
  description: 要合并的同类型范围实例或区间字符串。
```

**返回值**

```returns
type: DateRange | DateTimeRange | TimeRange | null
description: "合并后的同类型范围；两者之间存在间隔时返回 `null`。"
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

## 合并范围集合

:::entry
### `mergeRanges()` :kind[function]

```js signature
mergeRanges(ranges): Range[]
```

对同类型范围的可迭代对象进行排序，并将所有重叠或相邻区间合并为最精简的不相交范围数组。空的日期时间范围与时钟时间范围不会出现在结果中。

混入不同类型的范围会抛出错误码为 `conflictingRanges` 的 `TypeError`，传入非范围条目则会抛出错误码为 `invalidRange` 的 `TypeError`。

**参数**

```params
- name: ranges
  type: Iterable<DateRange> | Iterable<DateTimeRange> | Iterable<TimeRange>
  required: true
  description: 包含单一类型范围的数组、Set 或其他可迭代对象。
```

**返回值**

```returns
type: Array<DateRange | DateTimeRange | TimeRange>
description: 按时间排序、互不重叠的最精简同类型范围数组。
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

## 跨夜时钟时间范围

跨夜的 `TimeRange` 在 `subtract()`、`union()` 与 `mergeRanges()` 中都能无缝跨越午夜。在午夜处首尾相接的相邻片段会重新拼接成一个完整的跨夜范围。

```js
import '@native-dates/plugins/ranges';
import { timeRange } from 'native-dates';

timeRange('22:00', '06:00').subtract('01:00 - 03:00').map(String);
// ['22:00:00/01:00:00', '03:00:00/06:00:00']

timeRange('22:00', '00:00').union('00:00 - 06:00')?.toString();
// '22:00:00/06:00:00'
```

:::note[覆盖全部 24 小时的时钟时间范围]
起点与终点相同的 `TimeRange` 表示空范围，因此单个 `TimeRange` 无法表示完整的 24 小时。当 `union()` 或 `mergeRanges()` 传入的时钟时间范围恰好覆盖全天时，会抛出错误码为 `unsupportedUnion` 的 `RangeError`。
:::
