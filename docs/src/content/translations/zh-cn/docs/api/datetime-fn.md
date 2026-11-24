---
source: "50f6c5cb4f97"
title: datetime()
lede: 从时间戳、字符串、Date 或字段对象创建 DateTime，或读取当前时间。
---

## 读取日期时间

:::entry
### `datetime()` :kind[function]

```js signature
datetime(input, zone?): DateTime
datetime(input, options?): DateTime
```

将字符串、时间戳、字段对象或日历日期解析为指定时区下的 [`DateTime`](/api/date-time/)。省略时区时，回退到[全局默认配置](/api/configure/)或当前运行时的本地时区。

```js title="read.js"
import { date, datetime } from 'native-dates';

const fromUtc = datetime('2026-11-16T17:30:00Z', 'America/Los_Angeles');
const fromWall = datetime('2026-11-16 09:30', 'Europe/Berlin');
const fromZone = datetime('2026-11-16T09:30[America/New_York]');
const fromEpoch = datetime(1794850200000, 'UTC');
const fromDate = datetime(date('2026-11-16'), 'America/New_York');
```

**参数**

```params
- name: input
  type: DateTimeInput
  required: true
  description: ISO 字符串、Unix 毫秒时间戳、`Date`、字段对象、日历日期或 Temporal 值。
- name: zoneOrOptions
  type: Zone | ReadOptions
  description: 时区字符串（如 `'Europe/Berlin'` 或 `'UTC'`），或选项对象。
  options:
    - name: zone
      type: Zone
      description: 查看该时刻所使用的时区，会覆盖 `input` 中方括号内的时区。
    - name: locale
      type: Locale
      description: 绑定到返回的 `DateTime` 及其后续所有派生值的 BCP 47 区域标签。
    - name: loose
      type: boolean
      default: 'false'
      description: "配合 `@native-dates/plugins/loose` 解析非标准日期字符串，无法解析时返回 `null`。"
    - name: dayFirst
      type: boolean
      description: "在宽松模式下覆盖当前区域的数字日期顺序，适用于 `'07/09/2026'` 等字符串。"
```

**返回值**

```returns
type: DateTime
description: "按目标时区生成的 `DateTime` 实例；宽松模式下无法解析 `input` 时返回 `null`。"
```

导入 [`@native-dates/plugins/loose`](/plugins/loose/) 后，宽松模式会按当前区域解析非标准日期时间，对机器格式回退到引擎原生解析，并在输入无法识别时返回 `null`：

```js
import { datetime } from 'native-dates';
import '@native-dates/plugins/loose';

datetime('Mon, 16 Nov 2026 17:30:00 GMT', { zone: 'America/New_York', loose: true });
datetime('not a timestamp', { loose: true }); // null
```
:::

### 支持的输入格式

所有输入都会生成处于目标时区下的不可变实例：

| 输入类型 | 示例 | 解析规则 |
|---|---|---|
| 带偏移量的 ISO 字符串 | `'2026-11-16T17:30:00Z'`、`'2026-11-16 12:30-05:00'` | 确定精确时刻，并在目标时区下呈现。 |
| 带方括号时区的字符串 | `'2026-11-16T09:30[America/New_York]'` | 保留方括号中的时区；若传入了第二个时区参数则以其为准。 |
| 本地日期与时钟时间 | `'2026-11-16T09:30'`、`'2026年11月16日 14:30'` | 直接在目标时区中解析年-月-日顺序的日期和时钟时间。 |
| 日期字符串或 [CalendarDate](/api/calendar-date/) | `'2026-11-16'`、`date(2026, 11, 16)` | 解析为目标时区下该日历日期的起始时刻。 |
| 毫秒时间戳或 Date | `1794850200000`、`new Date()` | 将 Unix 时间戳转换到目标时区，并与 `Date` 一致截断毫秒的小数部分。 |
| 字段对象 | `{ year: 2026, month: 11, day: 16, hour: 9 }` | 在目标时区中读取日历字段（月、日从 1 开始计数）与时钟字段，拒绝不存在的日期。 |
| DateTime 或 Temporal | `dt`、`Temporal.Instant`、`Temporal.ZonedDateTime` | 除非显式传入时区参数，否则保留原有时区。 |

:::note[缺失值绝不会默认为当前时间]
传入 `undefined` 或 `null` 等缺失值会直接抛出错误，防止数据库空字段意外变成当前时间。需要读取实时时钟时，请显式调用 [`now()`](#now)。
:::

## 当前时刻与今日边界

读取实时时钟，或生成任意时区下当天的查询起止边界。

:::entry
### `now()` :kind[function]

```js signature
now(zone?): DateTime
```

返回指定时区（或全局默认时区）下毫秒精度的当前时刻。毫秒精度与 `Date.now()` 保持一致，确保时间戳在 JSON 序列化往返中不丢精度。

**参数**

```params
- name: zone
  type: Zone
  description: 用于查看当前时刻的时区，例如 `'Asia/Tokyo'` 或 `'UTC'`。
```

**返回值**

```returns
type: DateTime
description: "`zone` 时区下当前毫秒对应的 `DateTime`。"
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

返回指定时区下今天的起始时刻，即当地日历日期的开始时间，适合作为查询今日事件或记录的下界。

**参数**

```params
- name: zone
  type: Zone
  description: 要计算当天起始时刻的目标时区。
```

**返回值**

```returns
type: DateTime
description: "`zone` 时区下今天起始时刻的 `DateTime`。"
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

返回指定时区下今天的最后一毫秒。

**参数**

```params
- name: zone
  type: Zone
  description: 要计算当天结束时刻的目标时区。
```

**返回值**

```returns
type: DateTime
description: "`zone` 时区下今天 `23:59:59.999` 对应的 `DateTime`。"
```

```js
import { endOfToday } from 'native-dates';

const cutoff = endOfToday('America/New_York');
cutoff.hour; // 23
cutoff.millisecond; // 999
```
:::
