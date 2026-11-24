---
source: "7f0f623e1e92"
title: dateRange()
lede: 从起止端点、时长或区间字符串创建 DateRange、DateTimeRange 或 TimeRange。
---

## 创建范围

独立工厂函数用于从原始输入、起止端点对或单个区间字符串构造[范围](/api/ranges/)。如果你已经持有具体类型的实例，也可以直接调用它的 [`to()`](/api/ranges/#to) 或 [`range()`](/api/ranges/#range) 方法。

:::entry
### `dateRange()` :kind[function]

```js signature
dateRange(start, end, options?): DateRange
dateRange(interval, options?): DateRange
```

创建跨越两个日历日期的闭区间 [`DateRange`](/api/ranges/#daterange)（包含起止两端）。当第二个参数传入时长（如 `'7 days'`）时，结束日期落在起始日期之后 6 天，使整个范围恰好覆盖 7 天。

```js title="dates.js"
import { dateRange, days } from 'native-dates';

const fromEnds = dateRange('2026-09-01', '2026-09-07');
const fromLength = dateRange('2026-09-01', days(7));
const fromInterval = dateRange('2026-09-01/2026-09-07');

fromEnds.duration.days; // 7
fromLength.toString(); // '2026-09-01/2026-09-07'
fromInterval.equals(fromEnds); // true
```

**参数**

```params
- name: start
  type: CalendarDateInput | string
  required: true
  description: 起始日期输入；省略 `end` 时为完整的区间字符串。
- name: end
  type: CalendarDateInput | DurationInput | ReadOptions
  description: 包含在内的结束日期、时长跨度，或 `start` 为区间字符串时的选项对象。
- name: options
  type: Zone | ReadOptions
  description: 解析端点时使用的时区或读取选项。
  options:
    - name: zone
      type: Zone
      description: 用于从时间戳字符串或 `Date` 对象提取当地日历日期的时区。
    - name: locale
      type: Locale
      description: 绑定到返回范围及其起止端点的 BCP 47 区域标签。
    - name: loose
      type: boolean
      default: 'false'
      description: "配合 `@native-dates/plugins/loose` 解析非标准日期字符串，无法解析时返回 `null`。"
    - name: dayFirst
      type: boolean
      description: "在宽松模式下覆盖当前区域的数字日期顺序。"
```

**返回值**

```returns
type: DateRange
description: "闭区间的 `DateRange` 实例；宽松模式下任一端点无法解析时返回 `null`。"
```
:::

:::entry
### `datetimeRange()` :kind[function]

```js signature
datetimeRange(start, end, options?): DateTimeRange
datetimeRange(interval, options?): DateTimeRange
```

创建半开区间的 [`DateTimeRange`](/api/ranges/#datetimerange)，包含起始时刻、不包含结束时刻。如果结束输入没有显式指定时区，则沿用起始时刻的时区进行解析。

**参数**

```params
- name: start
  type: DateTimeInput | string
  required: true
  description: 起始时刻输入；省略 `end` 时为完整的区间字符串。
- name: end
  type: DateTimeInput | DurationInput | ReadOptions
  description: 不包含在内的结束时刻、时长跨度，或区间字符串对应的选项对象。
- name: options
  type: Zone | ReadOptions
  description: 应用于起止两端点的时区或读取选项（如 `zone`、`locale`、`loose`）。
```

**返回值**

```returns
type: DateTimeRange
description: "半开区间的 `DateTimeRange` 实例；宽松模式下任一端点无法解析时返回 `null`。"
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

创建两个时钟时间之间的半开区间 [`TimeRange`](/api/ranges/#timerange)，不包含结束时钟时间。当结束时间早于起始时间时，该范围自动跨午夜延伸。

**参数**

```params
- name: start
  type: TimeInput | string
  required: true
  description: 起始时钟时间输入；省略 `end` 时为完整的区间字符串。
- name: end
  type: TimeInput | DurationInput | ReadOptions
  description: 不包含在内的结束时钟时间、时钟时长，或区间字符串对应的选项对象。
- name: options
  type: Zone | ReadOptions
  description: 从时间戳提取时钟时间时使用的时区或读取选项（如 `zone`、`locale`、`loose`）。
```

**返回值**

```returns
type: TimeRange
description: "半开区间的 `TimeRange` 实例；宽松模式下任一端点无法解析时返回 `null`。"
```

```js
import { timeRange } from 'native-dates';

const office = timeRange('9am - 5pm');
const overnight = timeRange('22:00', '8h');

office.toString(); // '09:00:00/17:00:00'
overnight.toString(); // '22:00:00/06:00:00'
```
:::

## 区间字符串与宽松模式

单字符串区间会按 ISO 斜杠或两侧带空格的范围分隔符拆分。方括号内 IANA 时区名称中的斜杠不会受到影响。

| 形式 | 示例 | 解析规则 |
|---|---|---|
| ISO 斜杠区间 | `'2026-09-01/2026-09-07'`、`'09:00/17:00'` | 按方括号时区名称之外的 `/` 拆分，与 [`toString()`](/api/ranges/#tostring) 输出格式一致。 |
| 带空格的连字符或短破折号 | `'9am - 5pm'`、`'2026/09/01 - 2026/09/07'` | 优先按两侧带空格的 `-` 或 `–` 拆分，保留日期内部的连字符与斜杠。 |
| 英文 `to` 分隔符 | `'2026-09-01 to 2026-09-07'` | 按两侧带空格的 ` to ` 拆分。 |
| 起点加时长 | `dateRange('2026-09-01', '7d')`、`timeRange('9am', '90m')` | 当第二个参数为 [`Duration`](/api/duration/)、时长字段对象或英文时长短语时，将其作为跨度解析。 |

加载 [loose 插件](/plugins/loose/)后，宽松模式可解析非标准格式的端点，并在任一端点无法识别时返回 `null`：

```js
import { dateRange } from 'native-dates';
import '@native-dates/plugins/loose';

dateRange('Sep 1, 2026 to Sep 7, 2026', { loose: true })?.toString();
// '2026-09-01/2026-09-07'

dateRange('not a range', { loose: true }); // null
```
