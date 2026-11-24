---
source: "e681c4b680b0"
title: monthDay()
lede: 将月日字符串、数字、字段对象或日期解析为 MonthDay。
---

## 读取月日

:::entry
### `monthDay()` :kind[function]

```js signature
monthDay(input, options?): MonthDay
monthDay(input, zone?): MonthDay
monthDay(month, day): MonthDay
```

从月在前的字符串、从 1 开始计数的数字、字段对象或已有日期创建 [`MonthDay`](/api/month-day/)。允许 2 月 29 日，因此闰日生日和纪念日能够原样保留。

```js title="birthday.js"
import { datetime, monthDay } from 'native-dates';

const fromIso = monthDay('10-17');
const fromSlash = monthDay('10/17');
const fromNumbers = monthDay(2, 29);
const fromFields = monthDay({ month: 10, day: 17 });
const fromInstant = monthDay(datetime('2026-10-18T02:00:00Z'), 'America/Los_Angeles');

fromNumbers.toString(); // '02-29'
fromInstant.toString(); // '10-17'
```

**参数**

```params
- name: input
  type: MonthDayInput | number | string
  required: true
  description: 月在前的字符串、字段对象、日期或时间戳，或从 1 开始计数的月份 `month`（1 到 12）。
- name: options
  type: Zone | MonthDayOptions | number | string
  description: 时区或选项对象，或传入两个数字时的整数日期 `day`（1 到 31）。
  options:
    - name: zone
      type: Zone
      description: 用于从时间戳字符串、`DateTime` 或 `Date` 读取当地月日的时区。
    - name: locale
      type: Locale
      description: 绑定到返回的 `MonthDay` 及其后续所有派生值的 BCP 47 区域标签。
    - name: dayFirst
      type: boolean
      default: 'false'
      description: "将斜杠、点号分隔的字符串以及用连字符分隔的个位数字符串按日在前解析，行为与 `dayMonth()` 一致。"
    - name: loose
      type: boolean
      default: 'false'
      description: "配合 `@native-dates/plugins/loose` 解析英文或本地化月份名（如 `'17 février'`），无法解析时返回 `null`。"
```

**返回值**

```returns
type: MonthDay
description: "不含年份的 `MonthDay` 实例；宽松模式下无法解析 `input` 时返回 `null`。"
```

加载 [loose 插件](/plugins/loose/)后，宽松模式可解析英文或当前 `locale` 下的月份名，无法解析时返回 `null`：

```js
import { monthDay } from 'native-dates';
import '@native-dates/plugins/loose';

monthDay('Oct 17', { loose: true })?.toString(); // '10-17'
monthDay('17 février', { loose: true, locale: 'fr' })?.toString(); // '02-17'
monthDay('whenever', { loose: true }); // null
```
:::

:::entry
### `dayMonth()` :kind[function]

```js signature
dayMonth(input, options?): MonthDay
dayMonth(day, month): MonthDay
```

按全球多数地区的书写习惯（日在前）读取字符串与数字，例如 `'17/10'`。无论全局配置如何，调用此工厂函数都会始终按日在前解析。

带连字符的两位 ISO 字符串（如 `'10-17'`）在两个函数中都仍按月在前解析，确保 JSON 输出在任何地区都能准确往返。

**参数**

```params
- name: input
  type: MonthDayInput | number | string
  required: true
  description: 日在前的字符串（如 `'17/10'`）、任意 `MonthDayInput`，或整数日期 `day`（1 到 31）。
- name: options
  type: Zone | MonthDayOptions | number | string
  description: 时区、包含 `locale` 的读取选项，或传入两个数字时从 1 开始计数的月份 `month`（1 到 12）。
```

**返回值**

```returns
type: MonthDay
description: "`MonthDay` 实例；宽松模式下无法解析 `input` 时返回 `null`。"
```

```js
import { dayMonth } from 'native-dates';

dayMonth('17/10').toString(); // '10-17'
dayMonth('06.05').toString(); // '05-06'
dayMonth(17, 10).toString(); // '10-17'
dayMonth('10-17').toString(); // '10-17'
```
:::

## 支持的输入格式

不含年份的数字字符串绝不会交给原生 `Date` 解析，避免凭空套用非闰年默认年份，或把无效日期悄悄进位到下个月。

| 输入类型 | 示例 | 解析规则 |
|---|---|---|
| ISO 月日字符串 | `'10-17'`、`'--10-17'` | 在 [`monthDay()`](#monthday) 和 [`dayMonth()`](#daymonth) 中均按月在前解析两位月份与日期。 |
| 数字对字符串 | `'10/17'`、`'17.10'`、`'5-6'` | 解析 `/`、`.` 或 `-` 分隔的数字对：`monthDay()` 按月在前，`dayMonth()` 按日在前。 |
| 两个数字 | `monthDay(10, 17)`、`dayMonth(17, 10)` | 按“月、日”或“日、月”顺序传入两个整数。 |
| 字段对象 | `{ month: 10, day: 17 }` | 读取从 1 开始计数的字段，拒绝 4 月 31 日等不存在的组合。 |
| 日期或时间戳 | `'1990-10-17'`、`datetime(...)`、`new Date()` | 按指定时区或全局默认时区提取日历月日，并舍弃年份。 |
| 宽松月份名 | `'Oct 17'`、`'17 février'` | 宽松模式下支持任意顺序的英文或当前区域月份名与序数日期。 |
| Temporal 值 | `Temporal.PlainMonthDay`、`Temporal.PlainDate` | 直接包装 ISO 8601 的 Temporal 值。 |

:::tip[获取今天的月日]
要读取任意时区今天的月和日，请使用 [`today()`](/api/date-fn/#today)，例如 `today('Europe/Berlin').monthDay`。
:::
