---
source: "bb49ea92ac08"
title: time()
lede: 从 12 小时制或 24 小时制时钟字符串、数字、字段对象或时间戳创建 Time。
---

## 读取时钟时间

:::entry
### `time()` :kind[function]

```js signature
time(input, options?): Time
time(input, zone?): Time
time(hour, minute?, second?): Time
```

从时钟字符串、整数时分秒、字段对象或时间戳创建 [`Time`](/api/time/)。缺少输入时会直接抛出 `TypeError`，不会默认取当前时钟时间。

```js title="clock.js"
import { datetime, time } from 'native-dates';

const morning = time('9am');
const closing = time('5:30pm');
const iso = time('17:30:00');
const fromNumbers = time(9, 30);
const fromFields = time({ hour: 17, minute: 30, millisecond: 250 });
const fromInstant = time('2026-11-16T17:30:00Z', 'America/New_York');
const fromMoment = time(datetime('2026-11-16T17:30:00Z'), 'Europe/Berlin');
const fromTemporal = time(Temporal.PlainTime.from('08:15'));

closing.toString(); // '17:30:00'
fromInstant.toString(); // '12:30:00'
fromMoment.toString(); // '18:30:00'
```

**参数**

```params
- name: input
  type: TimeInput | number
  required: true
  description: 时钟字符串、字段对象、已有时钟时间或时间戳，或 24 小时制的小时数 `hour`（0 到 23）。
- name: options
  type: Zone | ReadOptions | number
  description: 解析时间戳或宽松字符串时的时区或选项对象，或分钟数 `minute`（0 到 59）。
  options:
    - name: zone
      type: Zone
      description: 用于从时间戳字符串、`DateTime` 或 `Date` 提取当地时钟时间的时区。
    - name: locale
      type: Locale
      description: 绑定到返回的 `Time` 及其后续所有派生值的 BCP 47 区域标签。
    - name: loose
      type: boolean
      default: 'false'
      description: "配合 `@native-dates/plugins/loose` 解析非标准日期时间字符串，无法解析时返回 `null`。"
    - name: dayFirst
      type: boolean
      description: "宽松模式解析包含日期和时间的字符串时，覆盖当前区域的数字日期顺序。"
- name: second
  type: number
  description: 传入数字时表示整数秒 `second`（0 到 59）。亚秒级精度请通过字符串或字段对象传入。
```

**返回值**

```returns
type: Time
description: "表示一天内时钟时间的 `Time` 实例；宽松模式下无法解析 `input` 时返回 `null`。"
```

加载 [loose 插件](/plugins/loose/)后，宽松模式可解析带本地化时段词的时钟字符串、使用点号分隔时分的区域格式以及非标准时间戳字符串，无法解析时返回 `null`：

```js
import { time } from 'native-dates';
import '@native-dates/plugins/loose';

time('오후 2:30', { loose: true, locale: 'ko' })?.toString(); // '14:30:00'
time('14.30', { loose: true, locale: 'fi' })?.toString(); // '14:30:00'
time('Mon, 16 Nov 2026 17:30:00 GMT', {
  zone: 'America/New_York',
  loose: true,
})?.toString(); // '12:30:00'
time('whenever', { loose: true }); // null
```
:::

## 支持的输入格式

12 小时制字符串接受 1 到 12 的小时数，后跟 AM 或 PM；午夜为 12 AM，正午为 12 PM。

| 输入类型 | 示例 | 解析规则 |
|---|---|---|
| 12 小时制字符串 | `'9am'`、`'5:30pm'`、`'12:15 a.m.'` | 解析 1 到 12 的小时数并搭配 `am` 或 `pm`，可选分钟、秒及小数部分。 |
| 24 小时制字符串 | `'09:00'`、`'14h30'`、`'17:30:15.250'` | 解析用冒号或 `h` 分隔时分的 24 小时制字符串，最高支持纳秒精度。 |
| ISO 时间戳字符串 | `'2026-11-16T17:30:00Z'` | 按指定时区或全局默认时区提取该时刻的当地时钟时间。 |
| 时分秒数字 | `time(9)`、`time(9, 30)`、`time(17, 30, 15)` | 传入整数小时，以及可选的分钟与秒。 |
| 字段对象 | `{ hour: 9, minute: 30, millisecond: 250 }` | 读取单数或复数形式的时钟字段名，拒绝越界数值。 |
| [DateTime](/api/date-time/) 或 Temporal | `time(dt, 'Asia/Tokyo')`、`Temporal.PlainTime` | 提取时钟时间；若传入瞬时值且指定了时区，则先转换到该时区。 |
| JavaScript Date | `time(jsDate, 'America/New_York')` | 按指定时区或全局默认时区提取该时间戳对应的时钟时间。 |

:::tip[获取当前时钟时间]
要读取任意时区的实时时钟时间，请调用 [`now()`](/api/datetime-fn/#now)，例如 `now('Europe/Berlin').time`。
:::
