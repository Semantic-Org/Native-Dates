---
source: "91937c1bc2c8"
title: yearMonth()
lede: 将 ISO 年月字符串、银行卡有效期、数字或日期解析为 YearMonth。
---

## 读取年月

:::entry
### `yearMonth()` :kind[function]

```js signature
yearMonth(input, options?): YearMonth
yearMonth(input, zone?): YearMonth
yearMonth(year, month): YearMonth
```

从年份在前的字符串、年份与从 1 开始计数的月份数字、字段对象，或任意日期与时间戳创建 [`YearMonth`](/api/year-month/)（传入日期或时间戳时自动舍弃日字段）。缺少输入时会抛出 `TypeError`，不会默认取当前月份。

```js title="billing.js"
import { datetime, yearMonth } from 'native-dates';

const fromIso = yearMonth('2026-11');
const fromNumbers = yearMonth(2026, 11);
const fromFields = yearMonth({ year: 2026, month: 11 });
const fromDate = yearMonth('2026-11-16');
const fromInstant = yearMonth(datetime('2026-11-01T02:00:00Z'), 'America/Los_Angeles');

fromNumbers.toString(); // '2026-11'
fromInstant.toString(); // '2026-10'
```

**参数**

```params
- name: input
  type: YearMonthInput | number | string
  required: true
  description: ISO 年月字符串、字段对象、日期或时间戳，或日历年份 `year`。
- name: options
  type: Zone | ReadOptions | number | string
  description: 解析时间戳或宽松字符串时的时区或选项对象，或从 1 开始计数的月份 `month`（1 到 12）。
  options:
    - name: zone
      type: Zone
      description: 用于确定时间戳字符串、`DateTime` 或 `Date` 对应当地日历月份的时区。
    - name: locale
      type: Locale
      description: 绑定到返回的 `YearMonth` 及其后续所有派生值的 BCP 47 区域标签。
    - name: loose
      type: boolean
      default: 'false'
      description: "配合 `@native-dates/plugins/loose` 解析英文或本地化月份名（如 `'février 2026'`），无法解析时返回 `null`。"
```

**返回值**

```returns
type: YearMonth
description: "不含日字段的 `YearMonth` 实例；宽松模式下无法解析 `input` 时返回 `null`。"
```

加载 [loose 插件](/plugins/loose/)后，宽松模式可以解析英文或当前 `locale` 下的月份名搭配 4 位年份，无法解析时返回 `null`：

```js
import { yearMonth } from 'native-dates';
import '@native-dates/plugins/loose';

yearMonth('Nov 2026', { loose: true })?.toString(); // '2026-11'
yearMonth('février 2026', { loose: true, locale: 'fr' })?.toString(); // '2026-02'
yearMonth('not-a-month', { loose: true }); // null
```
:::

:::entry
### `monthYear()` :kind[function]

```js signature
monthYear(input, options?): YearMonth
monthYear(month, year): YearMonth
```

按银行卡有效期印刷的“月在前”顺序读取字符串与数字，例如 `'11/26'`。0 到 99 的两位年份会自动加上 [`YearMonth.century`](/api/year-month/#properties)（默认为 2000）。

像 `'2026-11'` 这样的 ISO 字符串在两个函数中都按年份在前解析，确保序列化后的值往返无误。

**参数**

```params
- name: input
  type: YearMonthInput | number | string
  required: true
  description: 卡有效期字符串（如 `'11/26'`）、任意 `YearMonthInput`，或从 1 开始计数的月份 `month`（1 到 12）。
- name: options
  type: Zone | ReadOptions | number | string
  description: 时区、包含 `locale` 的读取选项，或传入两个数字时的两位或四位年份 `year`。
```

**返回值**

```returns
type: YearMonth
description: "`YearMonth` 实例；宽松模式下无法解析 `input` 时返回 `null`。"
```

```js
import { monthYear } from 'native-dates';

monthYear('11/26').toString(); // '2026-11'
monthYear('05/2028').toString(); // '2028-05'
monthYear(11, 26).toString(); // '2026-11'
monthYear('2026-11').toString(); // '2026-11'
```
:::

## 支持的输入格式

无论是数字、字符串还是字段对象，月份始终从 1（一月）到 12（十二月）。

| 输入类型 | 示例 | 解析规则 |
|---|---|---|
| 年份在前字符串 | `'2026-11'`、`'2026/11'`、`'2026年11月'` | 解析 4 位年份与 1 或 2 位月份，支持除拉丁字母和冒号外的任意分隔符。 |
| 卡有效期字符串 | `monthYear('11/26')`、`monthYear('11.2026')` | 以 `/`、`-` 或 `.` 分隔并按月在前解析，两位年份按 `YearMonth.century` 补全。 |
| 两个数字 | `yearMonth(2026, 11)`、`monthYear(11, 26)` | 按“年、月”或“月、年”顺序传入两个整数。 |
| 字段对象 | `{ year: 2026, month: 11 }` | 读取从 1 开始计数的日历字段，拒绝超出 1 到 12 范围的月份。 |
| 日期或时间戳 | `'2026-11-16'`、`datetime(...)`、`new Date()` | 按指定时区或全局默认时区提取日历月份，并舍弃日字段。 |
| 宽松月份名 | `'Nov 2026'`、`'février 2026'` | 宽松模式下解析英文或当前区域月份名搭配 4 位年份。 |
| Temporal 值 | `Temporal.PlainYearMonth`、`Temporal.PlainDate` | 直接包装 ISO 8601 的 Temporal 值。 |

:::tip[获取当前月份]
要读取任意时区的当前日历月份，请使用 [`today()`](/api/date-fn/#today)，例如 `today('Asia/Tokyo').yearMonth`。
:::
