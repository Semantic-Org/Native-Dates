---
source: "a03fe5ee9f3b"
title: compare()
lede: 对日期、具体时刻、时钟时间、时长与范围进行排序及边界选取。
---

## 排序与比较

:::entry
### `compare()` :kind[function]

```js signature
compare(a, b): -1 | 0 | 1
```

按先后顺序比较两个同类值，返回负数、零或正数，可直接传给 `Array.prototype.sort()`。支持具体时刻、Unix 时间戳、日历日期、时钟时间、时长、[年月](/api/year-month/)以及[范围](/api/ranges/)。

任意一个参数也可以是原始 ISO 字符串、原生 JavaScript `Date` 或毫秒级 Unix 时间戳。与时钟时间比较时，数字会被视为小时数；比较不同类型的值则会抛出 `TypeError`。

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

**参数**

```params
- name: a
  type: Point | Duration | YearMonth | Range
  required: true
  description: 第一个待比较的本库实例、ISO 字符串、`Date` 或 Unix 毫秒时间戳。
- name: b
  type: Point | Duration | YearMonth | Range
  required: true
  description: 与 `a` 同类的第二个值，或对应的原始输入。
```

**返回值**

```returns
type: -1 | 0 | 1
description: "第一个值更早时返回 `-1`，相等时返回 `0`，更晚时返回 `1`。"
```

同类范围先按起始点排序，起始点相同时再按结束点排序：

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

:::note[跨时区比较具体时刻]
`compare()` 按精确时刻对 [`DateTime`](/api/date-time/) 排序，而非比较当地时钟时间。同一天里，纽约上午 9:00 的会议排在洛杉矶上午 8:00 的会议之前。
:::

## 选取边界值

在一组日历日期、具体时刻、时钟时间或 [`YearMonth`](/api/year-month/) 中找出最早或最晚的值。两个辅助函数均支持不定参数或单个非空数组。

:::entry
### `earliest()` :kind[function]

```js signature
earliest(...points): DateTime | CalendarDate | Time | YearMonth
earliest(points): DateTime | CalendarDate | Time | YearMonth
```

从一个或多个同类参数或非空数组中返回最早的值，并将原生 `Date` 或 Unix 毫秒时间戳转换为 [`DateTime`](/api/date-time/)。传入空数组会抛出 `RangeError`。

**参数**

```params
- name: points
  type: Point[] | YearMonth[]
  required: true
  description: 一个或多个同类的日历日期、具体时刻、Unix 时间戳、时钟时间或年月。
```

**返回值**

```returns
type: DateTime | CalendarDate | Time | YearMonth
description: 最早的值；多个时刻相等时保留列表中靠前的项。
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

从一个或多个同类参数或非空数组中返回最晚的值。传入空数组会抛出 `RangeError`。

**参数**

```params
- name: points
  type: Point[] | YearMonth[]
  required: true
  description: 一个或多个同类的日历日期、具体时刻、时钟时间或年月。
```

**返回值**

```returns
type: DateTime | CalendarDate | Time | YearMonth
description: 最晚的值；多个时刻相等时保留列表中靠前的项。
```

组合使用 [`earliest()`](#earliest) 和 `latest()`，即可将值限制到上下边界之内：

```js
import { date, earliest, latest } from 'native-dates';

const minDate = date('2026-11-01');
const maxDate = date('2026-11-30');
const picked = date('2026-12-12');

const clamped = earliest(maxDate, latest(minDate, picked));
clamped.toString(); // '2026-11-30'
```
:::
