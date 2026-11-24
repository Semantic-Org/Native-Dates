---
source: "af294e4ed659"
title: date()
lede: 从年-月-日顺序的日期字符串、年月日数字或字段对象创建 CalendarDate，或读取当天日期。
---

## 读取日历日期

:::entry
### `date()` :kind[function]

```js signature
date(input, options?): CalendarDate
date(input, zone?): CalendarDate
date(year, month, day): CalendarDate
```

从年-月-日顺序的日期字符串、三个从 1 开始计数的数字、字段对象，或已有日期与时间戳创建 [`CalendarDate`](/api/calendar-date/)。对于 2 月 30 日这类不存在的日期，会直接抛出 `RangeError`，不会自动进位到 3 月。

```js title="create.js"
import { date, datetime } from 'native-dates';

const fromIso = date('2026-11-16');
const fromSlashes = date('2026/11/6');
const fromNumbers = date(2026, 11, 16);
const fromFields = date({ year: 2026, month: 11, day: 16 });
const fromMoment = date(datetime('2026-11-17T02:00:00Z', 'America/Los_Angeles'));

fromSlashes.toString(); // '2026-11-06'
fromMoment.toString(); // '2026-11-16'
```

**参数**

```params
- name: input
  type: CalendarDateInput | number
  required: true
  description: ISO 日期字符串、字段对象、已有日期或时间戳，或 4 位年份 `year`。
- name: options
  type: Zone | ReadOptions | number
  description: 解析时间戳或宽松字符串时的时区或选项对象，或从 1 开始计数的月份 `month`（1 到 12）。
  options:
    - name: zone
      type: Zone
      description: 用于确定时间戳字符串、`DateTime` 或 `Date` 对应当地日历日期的时区。
    - name: locale
      type: Locale
      description: 绑定到返回的 `CalendarDate` 及其后续所有派生值的 BCP 47 区域标签。
    - name: loose
      type: boolean
      default: 'false'
      description: "配合 `@native-dates/plugins/loose` 解析非标准日期字符串，无法解析时返回 `null`。"
    - name: dayFirst
      type: boolean
      description: "在宽松模式下覆盖当前区域的数字日期顺序，适用于 `'07.09.2026'` 等字符串。"
- name: day
  type: number
  description: 传入 `year`、`month`、`day` 时表示月中第几天（1 到 31）。
```

**返回值**

```returns
type: CalendarDate
description: "不含时钟时间与时区的 `CalendarDate`；宽松模式下无法解析 `input` 时返回 `null`。"
```

读取 ISO 时间戳或原生 JavaScript `Date` 时，可传入时区，指定要提取哪个地区的日历日期：

```js
date('2026-11-17T02:00:00Z', 'America/Los_Angeles').toString(); // '2026-11-16'
date('2026-11-17T02:00:00Z', 'Asia/Tokyo').toString(); // '2026-11-17'
```
:::

### 支持的输入格式

与 JavaScript 原生 `Date` 构造函数从 0 开始计数不同，这里的月份始终从 1（一月）到 12（十二月）。仅包含年月、缺少日字段的输入会直接抛出 `RangeError`，不会擅自补成每月 1 号；若只需年月，请使用 [`yearMonth()`](/api/year-month-fn/)。

| 输入类型 | 示例 | 解析规则 |
|---|---|---|
| 年-月-日顺序字符串 | `'2026-11-16'`、`'2026/11/6'`、`'2026年11月16日'` | 解析 4 位年份、月份和日期，支持除拉丁字母和冒号外的任意分隔符。 |
| 本地日期时间字符串 | `'2026-11-16T09:30'` | 保留日历日期，舍弃时钟时间。 |
| ISO 时间戳字符串 | `'2026-11-17T02:00:00Z'` | 按指定时区或全局默认时区提取该时刻对应的当地日历日期。 |
| 年、月、日数字 | `date(2026, 11, 16)` | 传入三个整数，月份从 `1`（一月）到 `12`（十二月）。 |
| 字段对象 | `{ year: 2026, month: 11, day: 16 }` | 读取从 1 开始计数的日历字段，拒绝不存在的日期。 |
| [DateTime](/api/date-time/) | `date(dt, 'Asia/Tokyo')` | 提取指定时区下的日历日期；省略时区时使用 `dt.zone`。 |
| JavaScript Date | `date(jsDate, 'America/Los_Angeles')` | 按指定时区或全局默认时区提取该时间戳对应的日历日期。 |
| Temporal 值 | `Temporal.PlainDate`、`Temporal.Instant` | 将任意历法的纯日期按同一 ISO 日历日读取，将瞬时值转换到目标时区。 |

:::note[时间戳结果取决于时区]
带 `Z` 或 UTC 偏移量的 ISO 字符串表示一个具体时刻，在地球不同地区可能落入不同的日历日期。在服务端提取用户的日历日期时，请务必显式传入时区。
:::

## 相对日历日期

“今天”是哪一天取决于你身处的时区。以下辅助函数均支持可选的时区参数，省略时回退到[全局默认配置](/api/configure/)。

:::entry
### `today()` :kind[function]

```js signature
today(zone?): CalendarDate
```

返回指定时区（或全局默认时区）下今天的日历日期。美洲还是深夜时，亚洲与大洋洲往往已经跨过午夜进入下一天。

**参数**

```params
- name: zone
  type: Zone
  description: 要读取当天日历日期的时区，例如 `'Asia/Tokyo'` 或 `'America/Los_Angeles'`。
```

**返回值**

```returns
type: CalendarDate
description: "`zone` 时区下今天的 `CalendarDate`。"
```

```js
import { datetime, today } from 'native-dates';

const inLosAngeles = today('America/Los_Angeles');
const inTokyo = today('Asia/Tokyo');

// UTC 11 月 17 日 02:00 时，洛杉矶仍为 11 月 16 日，东京已进入 11 月 17 日
const moment = '2026-11-17T02:00:00Z';
datetime(moment, 'America/Los_Angeles').date.toString(); // '2026-11-16'
datetime(moment, 'Asia/Tokyo').date.toString(); // '2026-11-17'
```
:::

:::entry
### `tomorrow()` :kind[function]

```js signature
tomorrow(zone?): CalendarDate
```

返回指定时区下明天的日历日期，即 [`today(zone)`](#today) 的后一天。

**参数**

```params
- name: zone
  type: Zone
  description: 计算明天日期所使用的目标时区。
```

**返回值**

```returns
type: CalendarDate
description: "`zone` 时区下明天的 `CalendarDate`。"
```

```js
import { tomorrow } from 'native-dates';

const nextDay = tomorrow();
const londonTomorrow = tomorrow('Europe/London');
```
:::

:::entry
### `yesterday()` :kind[function]

```js signature
yesterday(zone?): CalendarDate
```

返回指定时区下昨天的日历日期，即 [`today(zone)`](#today) 的前一天。

**参数**

```params
- name: zone
  type: Zone
  description: 计算昨天日期所使用的目标时区。
```

**返回值**

```returns
type: CalendarDate
description: "`zone` 时区下昨天的 `CalendarDate`。"
```

```js
import { yesterday } from 'native-dates';

const priorDay = yesterday();
const londonYesterday = yesterday('Europe/London');
```
:::
