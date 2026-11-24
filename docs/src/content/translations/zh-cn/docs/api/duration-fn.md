---
source: "6f9a2cfc4ed9"
title: duration()
lede: 从英文时长短语、ISO 8601 时长字符串、数值与单位或单位辅助函数创建 Duration。
---

## 创建时长

:::entry
### `duration()` :kind[function]

```js signature
duration(input, unit?): Duration
duration(input, options?): Duration
```

从数值与单位、英文时长短语、ISO 8601 时长字符串、字段对象或毫秒数创建 [`Duration`](/api/duration/)。在调用 [`balance()`](/api/duration/#balance) 之前，所有字段都按原始输入保留，因此 90 分钟会保持为 90 分钟，而不会自动折算为 1 小时 30 分钟。

```js title="lengths.js"
import { duration } from 'native-dates';

const phrase = duration('1h 30m');
const words = duration('2 weeks and 3 days');
const iso = duration('PT1H30M');
const count = duration(90, 'minutes');
const spilled = duration(1.5, 'days');
const fields = duration({ hours: 1, minutes: 30 });
const ms = duration(1500);

spilled.days; // 1
spilled.hours; // 12
ms.seconds; // 0
ms.milliseconds; // 1500
```

**参数**

```params
- name: input
  type: DurationInput
  required: true
  description: 搭配 `unit` 的数值、英文时长短语、ISO 8601 字符串、字段对象、`Duration` 或毫秒数。
- name: unitOrOptions
  type: "Unit | { locale?: Locale, loose?: boolean }"
  description: 当 `input` 为数值时为目标单位名称，否则为选项对象。
  options:
    - name: locale
      type: Locale
      description: 绑定到返回的 `Duration` 及其后续所有派生值的 BCP 47 区域标签。
    - name: loose
      type: boolean
      default: 'false'
      description: "配合 `@native-dates/plugins/loose` 在输入无法解析时返回 `null`。"
```

**返回值**

```returns
type: Duration
description: "保留原始字段的 `Duration` 实例；宽松模式下无法解析 `input` 时返回 `null`。"
```

导入 [`@native-dates/plugins/loose`](/plugins/loose/) 后，当用户输入的文本无法解析为时长时，宽松模式会返回 `null` 而非抛出错误：

```js
import { duration } from 'native-dates';
import '@native-dates/plugins/loose';

duration('45 mins', { loose: true })?.minutes; // 45
duration('soon', { loose: true }); // null
```
:::

### 支持的输入格式

| 输入类型 | 示例 | 解析规则 |
|---|---|---|
| 数值与单位 | `duration(90, 'minutes')`、`duration(1.5, 'days')` | 将数字或数字字符串与单位配对，小数部分自动换算到更小的相邻单位。 |
| 英文时长短语 | `'1h 30m'`、`'2 weeks and 3 days'`、`'-15m'` | 解析以空格、逗号或 `and` 分隔的数值与英文完整单位名或缩写。 |
| ISO 8601 字符串 | `'PT1H30M'`、`'P2W3D'` | 解析标准 ISO 8601 时长字符串。 |
| 字段对象 | `{ hours: 1, minutes: 30 }` | 读取单数或复数形式的单位键名，要求所有非零字段符号一致。 |
| 毫秒数 | `duration(1500)`、`duration(0)` | 不带单位的纯数字或数字字符串一律按毫秒解析。 |
| Duration 或 Temporal | `hours(2)`、`Temporal.Duration` | 原样返回已有 `Duration`，或包装 `Temporal.Duration`。 |

:::note[小数单位与统一符号]
小数数值会自动换算到更小的精确单位，因此 `duration(1.5, 'days')` 会拆分为 1 天 12 小时。由于自然月没有固定天数，小数月会抛出 `RangeError`；正负混杂的短语（如 `'1h -30m'`）同样会抛出错误。
:::

## 单位辅助函数

单位辅助函数用于构造单单位时长，放进运算调用和表达式中读起来自然直观。每个辅助函数都接受正数、负数或数字字符串。

```js
import { days, hours, minutes, today } from 'native-dates';

const reminder = today().plus(days(3)).at('9:00am');
const block = hours(1).plus(minutes(30));

block.format('short', 'en-US'); // '1 hr, 30 min'
```

:::entry
### `years()` :kind[function]

```js signature
years(count): Duration
```

创建指定年数的时长，小数部分自动换算为月。
:::

:::entry
### `months()` :kind[function]

```js signature
months(count): Duration
```

创建指定整数个自然月的时长。
:::

:::entry
### `weeks()` :kind[function]

```js signature
weeks(count): Duration
```

创建指定周数的时长，小数部分自动换算为天。
:::

:::entry
### `days()` :kind[function]

```js signature
days(count): Duration
```

创建指定天数的时长，小数部分自动换算为小时。
:::

:::entry
### `hours()` :kind[function]

```js signature
hours(count): Duration
```

创建指定小时数的时长，小数部分自动换算为分钟。
:::

:::entry
### `minutes()` :kind[function]

```js signature
minutes(count): Duration
```

创建指定分钟数的时长，小数部分自动换算为秒。
:::

:::entry
### `seconds()` :kind[function]

```js signature
seconds(count): Duration
```

创建指定秒数的时长，小数部分自动换算为毫秒。
:::

:::entry
### `milliseconds()` :kind[function]

```js signature
milliseconds(count): Duration
```

创建指定毫秒数的时长，小数部分自动换算至微秒和纳秒。
:::
