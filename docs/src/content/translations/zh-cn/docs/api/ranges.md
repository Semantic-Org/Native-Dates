---
source: "9606dd7fa967"
title: 范围
lede: 两个日历日期、具体时刻或时钟时间之间的跨度，支持包含检测、重叠判断与步进遍历。
---

## 范围类

直接使用[范围工厂函数](/api/range-fn/)（`dateRange()`、`datetimeRange()`、`timeRange()`）创建范围，或在已有时间点上链式调用 [`to()`](#to)、[`for()`](#to) 与 [`range()`](#range)。所有范围实例均不可变。

:::note[闭区间日期与半开区间时间]
日历日期范围包含最后一天，因为 9 月 1 日至 9 月 7 日指的就是完整的 7 天。日期时间范围与时钟时间范围则不包含终点，这样相邻时段就能首尾相接而不会重叠。
:::

:::entry
### `DateRange` :kind[class]

```js signature
new DateRange(start, end, options?)
new DateRange(interval, options?)
```

跨越两个[日历日期](/api/calendar-date/)，并包含起止两端点。若结束日期早于开始日期，则抛出 `RangeError`。

`DateRange` 支持使用 `for...of` 或展开语法按天惰性迭代，从起始日到结束日逐日产出每个日历日期。

```js title="ranges.js"
import { dateRange } from 'native-dates';

const trip = dateRange('2026-09-01', '2026-09-07');
const week = dateRange('2026-09-01', '7 days');

trip.duration.days; // 7
week.toString(); // '2026-09-01/2026-09-07'
for (const day of trip) {
  day.toString(); // '2026-09-01', '2026-09-02', ...
}
[...dateRange('2026-09-01', '2026-09-03')].map(String); // ['2026-09-01', '2026-09-02', '2026-09-03']
```
:::

:::entry
### `DateTimeRange` :kind[class]

```js signature
new DateTimeRange(start, end, options?)
new DateTimeRange(interval, options?)
```

跨越两个[具体时刻](/api/date-time/)，包含起点但不包含终点。当终点输入未显式指定时区时，默认按起点所在时区解析；终点早于起点时会抛出 `RangeError`。

```js
import { datetimeRange } from 'native-dates';

const block = datetimeRange('2026-09-01T09:00', '2026-09-01T10:30', 'America/New_York');
const standup = datetimeRange('2026-09-01T09:00', '30m', 'America/New_York');

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

跨越两个[时钟时间](/api/time/)，包含起点但不包含终点。当结束时间在 24 小时时钟上早于开始时间时，范围会自动跨过午夜，以表示跨夜时段。

```js
import { timeRange } from 'native-dates';

const dayShift = timeRange('9:00am', '5:00pm');
const nightShift = timeRange('22:00', '06:00');

dayShift.duration.hours; // 8
nightShift.duration.hours; // 8
```
:::

## 属性

每个范围实例都提供格式化文本、带类型的起止端点、类型标识与度量时长。

| 属性 | 类型 | 说明 |
|---|---|---|
| `text` | `string` | 按当前区域格式化的范围字符串，例如 `'Sep 1 – 7, 2026'`。 |
| `start`、`end` | `CalendarDate \| DateTime \| Time` | 与范围类对应的起点和终点。 |
| `kind` | `'date' \| 'datetime' \| 'time'` | 标识范围所包含时间点类型的标签。 |
| `duration` | [`Duration`](/api/duration/) | 以 `start` 为起点的完整时长；日期范围会计入最后一天，跨夜时钟时间范围会跨越午夜计算。 |

## 从时间点构建

:::entry
### `to()` :kind[method]

```js signature
d.to(end, unit?): DateRange
d.through(end, unit?): DateRange
d.for(length, unit?): DateRange
dt.to(end, unit?): DateTimeRange
dt.for(length, unit?): DateTimeRange
t.to(end, unit?): TimeRange
t.for(length, unit?): TimeRange
```

从当前时间点出发，延伸至目标终点或跨越一段时长来构建范围。在[日历日期](/api/calendar-date/)上传入 7 天时长时，由于两端点均包含在内，结束日期会落在起始日期后的第 6 天。

使用 `for()` 可明确按时长构建范围（拒绝传入端点值或无单位数字）。由于日历日期范围包含最后一天，日历日期还提供了 `through()` 作为 `to()` 的别名。

**参数**

```params
- name: end
  type: Point | DurationInput | number
  required: true
  description: 同类型的目标终点、时长输入，或与 `unit` 配对的数值 `count`。
- name: unit
  type: Unit
  description: 当第一个参数为数值计数时的单位名。
```

**返回值**

```returns
type: DateRange | DateTimeRange | TimeRange
description: 与调用者类型匹配的范围实例。
```

```js
import { date, datetime, time } from 'native-dates';

date('2026-09-01').for(7, 'days').toString(); // '2026-09-01/2026-09-07'
datetime('2026-09-01T09:00Z', 'UTC').for(90, 'minutes').toString(); // '2026-09-01T09:00:00.000Z/2026-09-01T10:30:00.000Z'
time('9:00am').to('5:00pm').toString(); // '09:00:00/17:00:00'
```
:::

:::entry
### `range()` :kind[method]

```js signature
d.range(unit, firstDay?): DateRange
dt.range(unit, firstDay?): DateTimeRange
```

返回包含当前日期或具体时刻的完整日历单位或时钟单位范围。日期范围覆盖该单位的第一天至最后一天；日期时间范围则从该单位的起点延伸至下一个单位的起点（不含终点）。

**参数**

```params
- name: unit
  type: Unit
  required: true
  description: 所属的时间单位，例如 `'week'`、`'month'` 或 `'day'`。
- name: firstDay
  type: DayOfWeek
  description: 当 `unit` 为 `'week'` 时指定一周的起始日，覆盖 `configure()` 与当前区域设置。
```

**返回值**

```returns
type: DateRange | DateTimeRange
description: 包含当前时间点的完整 `unit` 范围。
```

```js
import { date, datetime } from 'native-dates';

date('2026-11-18', { locale: 'en-US' }).range('week').toString(); // '2026-11-15/2026-11-21'
date('2026-11-18').range('week', 'monday').toString(); // '2026-11-16/2026-11-22'
date('2026-02-10').range('month').toString(); // '2026-02-01/2026-02-28'
datetime('2026-11-16T14:20Z', 'UTC').range('hour').toString(); // '2026-11-16T14:00:00.000Z/2026-11-16T15:00:00.000Z'
```
:::

## 包含与重叠

:::entry
### `contains()` :kind[method]

```js signature
range.contains(value): boolean
range.includes(value): boolean
```

检查同类型的时间点或另一个范围是否落在该范围内。日期范围包含 `end`，日期时间范围和时钟时间范围不包含 `end`，跨夜时钟时间范围则会匹配午夜前后两侧的时间。同时提供 `includes()` 作为别名。

**参数**

```params
- name: value
  type: Point | Range
  required: true
  description: 同类型的时间点输入或范围实例。
```

**返回值**

```returns
type: boolean
description: 当 `value` 落在该范围内时返回 `true`。
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

当两个同类型范围至少共享一天或一个时间点时返回 `true`。对于日期时间范围和时钟时间范围，前一段的终点恰好等于后一段的起点时不算重叠。

**参数**

```params
- name: other
  type: Range | string
  required: true
  description: 同类型的范围实例或区间字符串。
```

**返回值**

```returns
type: boolean
description: 当两个范围存在公共时间时返回 `true`。
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

返回一个仅覆盖两个范围公共部分的新范围；若两者不相交则返回 `null`。若两个跨夜时钟时间范围相交于两段不连续的区间，则抛出 `RangeError`。

**参数**

```params
- name: other
  type: Range | string
  required: true
  description: 同类型的范围实例或区间字符串。
```

**返回值**

```returns
type: DateRange | DateTimeRange | TimeRange | null
description: 同类型的重叠范围；不相交时返回 `null`。
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

当两个范围的起点和终点分别相等时返回 `true`。范围数组也可以通过 [`compare()`](/api/compare/) 按时间顺序排序。

```js
dateRange('2026-09-01', '2026-09-07').equals('2026-09-01/2026-09-07'); // true
```
:::

:::entry
### `isEmpty()` :kind[method]

```js signature
range.isEmpty(): boolean
```

当日期时间范围或时钟时间范围的起点与终点相同时返回 `true`。在 [`DateRange`](#daterange) 上始终返回 `false`，因为单个日历日期代表完整的一天。

```js
timeRange('09:00', '09:00').isEmpty(); // true
dateRange('2026-09-01', '2026-09-01').isEmpty(); // false
```
:::

## 步进、拆分与时区

:::entry
### `every()` :kind[method]

```js signature
range.every(step): Point[]
range.every(count, unit): Point[]
```

从 `start` 出发，按正数单位或时长依次递增步进，返回落在范围内的所有时间点。每一步都相对于起点直接计算，而不是在前一步结果上累进相加，因此从 1 月 31 日按月步进时会依次落到每个月的最后一天。

如果希望按天惰性遍历 [`DateRange`](#daterange) 而不一次性分配整个数组，可直接用 `for...of` 或展开语法进行迭代。

**参数**

```params
- name: step
  type: Unit | DurationInput | number
  required: true
  description: 单位名（如 `'day'`）、时长输入，或与 `unit` 配对的数值 `count`。
- name: unit
  type: Unit
  description: 当 `step` 为数值时的单位名。
```

**返回值**

```returns
type: Array<CalendarDate | DateTime | Time>
description: 落在范围内的有序时间点数组。
```

```js
dateRange('2026-01-31', '2026-04-30').every('month').map(String);
// ['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30']

timeRange('22:00', '02:00').every(1, 'hour').map(String);
// ['22:00:00', '23:00:00', '00:00:00', '01:00:00']
```
:::

:::entry
### `count()` :kind[method]

```js signature
dateRange.count(kind?): number
```

统计 [`DateRange`](#daterange) 内的日历天数，且不会额外创建中间日期实例。可传入 `'days'`（默认值）、`'weekdays'`、`'weekends'`，或 `'mondays'` 这类星期名称。`'weekdays'` 与 `'weekends'` 会遵循当前区域的周末定义。

**参数**

```params
- name: kind
  type: string
  default: "'days'"
  description: "`'days'`、`'weekdays'`、`'weekends'`，或星期名称（如 `'mondays'`）。"
```

**返回值**

```returns
type: number
description: 范围内符合条件的日历天数。
```

```js
const sprint = dateRange('2026-05-01', '2 weeks');

sprint.count(); // 14
sprint.count('weekdays'); // 10
sprint.count('weekends'); // 4
sprint.count('mondays'); // 2
```
:::

:::entry
### `split()` :kind[method]

```js signature
range.split(step): Range[]
range.split(count, unit): Range[]
range.splitBy(step): Range[]
range.splitBy(count, unit): Range[]
```

按指定步长将范围拆分为若干连续子范围，最后一段会限制到原范围的终点。接受与 [`every()`](#every) 相同的步长参数，同时提供 `splitBy()` 作为别名。

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

将 [`DateRange`](#daterange) 转换为半开区间的 [`DateTimeRange`](#datetimerange)，从起始日午夜零点延伸至结束日次日午夜零点（不含终点），恰好匹配时间戳查询边界。在日期时间范围上调用时，会将两端点同时转换到目标时区。

由于时钟时间不包含日历日期，在时钟时间范围上调用 `in()` 会抛出 `RangeError`。

**参数**

```params
- name: zone
  type: Zone
  description: 目标 IANA 时区、固定偏移量或 `'UTC'`。在 `DateRange` 上默认使用全局配置的时区。
```

**返回值**

```returns
type: DateTimeRange
description: 位于 `zone` 时区的半开日期时间范围。
```

```js
dateRange('2026-09-01', '2026-09-03').in('UTC').toString();
// '2026-09-01T00:00:00.000Z/2026-09-04T00:00:00.000Z'
```
:::

## 格式化与转换

:::entry
### `format()` :kind[method]

```js signature
range.format(spec?, locale?): string
```

传入预设或选项对象时，使用本地化的 `Intl` 范围格式输出，自动合并相同的日期或月份。传入占位符模板时，则会分别格式化两端点并用 `' – '` 连接。

通过 [`configure()`](/api/configure/) 注册的自定义格式同样适用。预设与占位符详情请参阅[格式化](/guides/formatting/)。

**参数**

```params
- name: spec
  type: FormatSpec
  description: 预设名称、`Intl.DateTimeFormatOptions` 对象或占位符模板。
- name: locale
  type: Locale
  description: BCP 47 区域标签，仅对本次调用覆盖实例自带或全局配置的区域设置。
```

**返回值**

```returns
type: string
description: 格式化后的范围字符串。
```

```js
const trip = dateRange('2026-09-01', '2026-09-07');

trip.format('medium', 'en-US'); // 'Sep 1 – 7, 2026'
trip.format('YYYY-MM-DD'); // '2026-09-01 – 2026-09-07'
timeRange('22:00', '06:00').format('HH:mm'); // '22:00 – 06:00'
```
:::

:::entry
### `locale()` :kind[method]

```js signature
range.locale(): Locale | undefined
range.locale(tag): Range
```

读取当前范围自带的区域设置，或返回绑定了新区域的副本，该区域会作用于文本预览、预设格式、端点及所有拆分出的子范围。传入空标签可清除已绑定的区域；同时提供 [`lang()`](#lang) 作为别名。

**参数**

```params
- name: tag
  type: Locale | null | undefined
  description: 要绑定并随派生值传递的 BCP 47 区域标签；传入 `null` 可清除已有标签。
```

**返回值**

```returns
type: Range | Locale | undefined
description: 不传参数时返回当前生效的区域标签；传入参数时返回携带 `tag` 的同类型新范围。
```

```js
const stay = dateRange('2026-09-01', '2026-09-07').locale('de-DE');

stay.locale(); // 'de-DE'
stay.format('medium'); // '01.–07.09.2026'
stay.duration.text; // '7 Tage'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
range.lang(): Locale | undefined
range.lang(tag): Range
```

[`locale()`](#locale) 的简写别名，用于读取或绑定当前范围的 BCP 47 区域标签。
:::

:::entry
### `as()` :kind[method]

```js signature
range.as('duration'): Duration
```

在链式调用中请求 `'duration'` 时返回该范围的时长，请求其他类型时抛出 `RangeError`。

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

返回 ISO 8601 区间字符串 `'start/end'`，可直接传回[范围工厂函数](/api/range-fn/)重新解析。`toJSON()` 返回相同的字符串，供 JSON 序列化使用。

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

始终抛出 `RangeError`，防止数值运算符将范围隐式转为数字。

在运行时收窄未知值的类型，请使用 [`kindOf()`](/api/kind-of/) 或导出的[范围类型守卫函数](/api/kind-of/#type-guards)：

```js
import { dateRange, isDateRange, isDateTimeRange, isTimeRange } from 'native-dates';

const stay = dateRange('2026-09-01', '2026-09-07');
isDateRange(stay); // true
isDateTimeRange(stay); // false
isTimeRange(stay); // false
```
:::
