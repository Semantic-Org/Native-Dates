---
source: "05899a15dfff"
title: Duration
lede: 涵盖日历与时钟单位的时间长度。
---

## 创建 Duration

使用 [`duration()`](/api/duration-fn/) 解析英文时长短语与 ISO 8601 字符串，调用 [`hours()`](/api/duration-fn/#hours) 这类单位辅助函数，或计算两个日期或时钟时间之间的跨度。所有实例均不可变，每个方法都会返回一个新值。

```js title="create.js"
import { date, days, duration, hours } from 'native-dates';

const breakTime = duration('1h 30m');
const trial = days(14);
const timeout = hours(1.5);
const quarter = date('2026-01-01').until('2026-04-01');
```

:::note[字段保持原样]
用 90 分钟创建时长时，`minutes` 会保持为 `90`，而不会自动换算为 1 小时 30 分钟。在调用 [`balance()`](#balance) 之前，日历天数也会与小时保持分离，以正确应对夏令时切换。
:::

## 属性

以下属性反映时长实例中保存的各单位计数。

| 属性 | 类型 | 说明 |
|---|---|---|
| `text` | `string` | 按当前区域以长格式输出的字符串，例如 `'1 hour, 30 minutes'`。 |
| `years`、`months`、`weeks`、`days` | `number` | 时长中保存的有符号日历单位计数。 |
| `hours`、`minutes`、`seconds` | `number` | 有符号时钟单位计数。 |
| `milliseconds`、`microseconds`、`nanoseconds` | `number` | 有符号亚秒级单位计数。 |
| `sign` | `number` | 时长的整体方向：`1`、`0` 或 `-1`。 |
| `anchor` | `TemporalValue` | 由 [`until()`](/api/date-time/#until) 或 [`since()`](/api/date-time/#since) 记录的起始点；独立创建的时长为 `undefined`。 |

## 运算与符号

加减时长、按倍率缩放，或反转正负号。同一时长中的所有非零字段必须具有相同的符号。

:::entry
### `plus()` :kind[method]

```js signature
dur.plus(other, unit?): Duration
dur.add(other, unit?): Duration
```

加上另一段时长并返回新的 `Duration` 实例。日历单位按字段逐项相加，时钟单位则直接合并。同时提供 `add()` 作为别名。

**参数**

```params
- name: other
  type: DurationInput
  required: true
  description: 与 `unit` 配对的数值、`Duration` 实例、时长字符串、字段对象或毫秒数。
- name: unit
  type: Unit
  description: 当 `other` 为数值时的单位名，例如 `'minutes'` 或 `'days'`。
```

**返回值**

```returns
type: Duration
description: 相加后的新 `Duration` 实例。
```

```js
hours(2).plus(30, 'minutes').toString(); // 'PT2H30M'
days(1).plus('6h').toString(); // 'P1DT6H'
```
:::

:::entry
### `minus()` :kind[method]

```js signature
dur.minus(other, unit?): Duration
dur.subtract(other, unit?): Duration
```

减去另一段时长，必要时会自动在年与月、周与天之间借位。若出现无法换算的异号单位组合（例如天减小时），则抛出 `RangeError`。同时提供 `subtract()` 作为别名。

**参数**

```params
- name: other
  type: DurationInput
  required: true
  description: 与 `unit` 配对的数值、`Duration` 实例、时长字符串、字段对象或毫秒数。
- name: unit
  type: Unit
  description: 当 `other` 为数值时的单位名。
```

**返回值**

```returns
type: Duration
description: 减去 `other` 后的新 `Duration` 实例。
```

```js
import { months, weeks, years } from 'native-dates';

hours(2).minus('30m').toString(); // 'PT1H30M'
years(1).minus(months(1)).toString(); // 'P11M'
weeks(1).minus(days(1)).toString(); // 'P6D'
```
:::

:::entry
### `times()` :kind[method]

```js signature
dur.times(factor): Duration
```

将每个字段乘以指定倍率，并将产生的小数部分拆入更小的单位。

**参数**

```params
- name: factor
  type: number
  required: true
  description: 用于缩放时长的乘数，支持小数或负数。
```

**返回值**

```returns
type: Duration
description: 缩放后的新 `Duration` 实例。
```

```js
hours(1).times(1.5).toString(); // 'PT1H30M'
days(1).times(3).toString(); // 'P3D'
```
:::

:::entry
### `abs()` :kind[method]

```js signature
dur.abs(): Duration
```

返回一个所有字段均转为正值的副本。

```js
duration('-1h 30m').abs().toString(); // 'PT1H30M'
```
:::

:::entry
### `negated()` :kind[method]

```js signature
dur.negated(): Duration
```

反转时长中所有字段的正负号。

```js
hours(2).negated().toString(); // '-PT2H'
```
:::

## 进位、舍入与总计

将较小单位向较大单位进位、按目标精度舍入，或将整段跨度换算为单个数值。

:::warning[将月和年换算为天]
仅包含月与年的时长可按 1 年 12 个月自行进位、求总计与比较。但由于不同日历月的天数各不相同，将其换算为周、天或时钟单位时，必须带有来自 [`until()`](/api/calendar-date/#until) 或 [`since()`](/api/calendar-date/#since) 的起始日期。
:::

:::entry
### `balance()` :kind[method]

```js signature
dur.balance(largestUnit?): Duration
```

将较小单位的溢出部分进位到较大单位。默认情况下，独立时长会把时钟单位进位到小时、把月份进位到年；由起止点度量得到的跨度则默认进位到天，除非显式传入更大的目标单位。

**参数**

```params
- name: largestUnit
  type: Unit
  description: 进位的最大目标单位，例如 `'hour'`、`'day'` 或 `'week'`。
```

**返回值**

```returns
type: Duration
description: 进位后的新 `Duration` 实例。
```

```js
import { minutes, months } from 'native-dates';

minutes(150).balance().toString(); // 'PT2H30M'
months(18).balance().toString(); // 'P1Y6M'
duration('36h').balance('day').toString(); // 'P1DT12H'
duration('10d').balance('week').toString(); // 'P1W3D'
```
:::

:::entry
### `total()` :kind[method]

```js signature
dur.total(unit): number
dur.as(unit): number
```

将整段时长换算为指定单位下的单个浮点数并返回。同时提供 [`as()`](#as) 别名，方便链式调用。

**参数**

```params
- name: unit
  type: Unit
  required: true
  description: 用于表示总长度的目标单位，例如 `'hours'` 或 `'days'`。
```

**返回值**

```returns
type: number
description: 以 `unit` 表示的总长度，包含小数部分。
```

```js
import { months } from 'native-dates';

minutes(90).total('hours'); // 1.5
months(18).total('years'); // 1.5
date('2026-01-01').until('2026-04-01').total('days'); // 90
```
:::

:::entry
### `as()` :kind[method]

```js signature
dur.as(unit): number
```

[`total()`](#total) 的链式调用别名，将时长换算为指定单位下的数值。

```js
hours(36).as('days'); // 1.5
date('2026-11-01').until('2026-11-16').as('days'); // 15
```
:::

:::entry
### `round()` :kind[method]

```js signature
dur.round(smallestUnit): Duration
```

将时长舍入到最接近的整数单位，处于中点时向远离零的方向舍入。

**参数**

```params
- name: smallestUnit
  type: Unit
  required: true
  description: 舍入后保留的最小单位，例如 `'minute'` 或 `'hour'`。
```

**返回值**

```returns
type: Duration
description: 舍入后的新 `Duration` 实例。
```

```js
minutes(90).round('hour').toString(); // 'PT2H'
duration('1h 20m').round('hour').toString(); // 'PT1H'
```
:::

## 比较时长

比较时长时按总长度而非字段写法判断，因此 60 分钟等于 1 小时。

:::entry
### `equals()` :kind[method]

```js signature
dur.equals(other): boolean
```

当两段时长表示相同的总长度时返回 `true`。

**参数**

```params
- name: other
  type: DurationInput
  required: true
  description: 另一个 `Duration` 实例，或任意 `duration()` 接受的输入。
```

**返回值**

```returns
type: boolean
description: 当两段时长长度相等时返回 `true`。
```

```js
import { months, years } from 'native-dates';

hours(1).equals(minutes(60)); // true
years(1).equals(months(12)); // true
```
:::

:::entry
### `compare()` :kind[method]

```js signature
dur.compare(other): number
```

按总长度将当前时长与另一段时长排序比较。

**参数**

```params
- name: other
  type: DurationInput
  required: true
  description: 用于比较的目标时长。
```

**返回值**

```returns
type: number
description: 较短时返回 `-1`，相等时返回 `0`，较长时返回 `1`。
```

```js
hours(1).compare(minutes(90)); // -1
date('2026-01-01').until('2026-02-01').compare(days(31)); // 0
```
:::

### 符号判断

无需参数的快捷方法，用于检查时长是否为空或为负：

| 方法 | 类型 | 说明 |
|---|---|---|
| `isZero()` | `boolean` | 时长中的所有单位是否均为零。 |
| `isNegative()` | `boolean` | 时长是否表示负跨度。 |

## 格式化与转换

:::entry
### `format()` :kind[method]

```js signature
dur.format(style?, locale?): string
```

使用 `Intl.DurationFormat` 按当前区域格式化时长。时钟字段溢出时会自动进位到小时；只要存在更大单位，亚秒字段就会保持隐藏。

**参数**

```params
- name: style
  type: "'long' | 'short' | 'narrow' | 'digital'"
  default: "'long'"
  description: 单位标签的显示样式，或用 `'digital'` 输出冒号分隔的计时器格式。
- name: locale
  type: string
  description: BCP 47 区域标签，仅对本次调用覆盖实例自带或全局配置的区域设置。
```

**返回值**

```returns
type: string
description: 按区域格式化后的时长字符串。
```

```js
const span = duration('2h 30m');

span.format('long', 'en-US'); // '2 hours, 30 minutes'
span.format('short', 'en-US'); // '2 hr, 30 min'
span.format('narrow', 'en-US'); // '2h 30m'
span.format('digital', 'en-US'); // '2:30:00'
```
:::

:::entry
### `locale()` :kind[method]

```js signature
dur.locale(): Locale | undefined
dur.locale(tag): Duration
```

读取当前时长自带的区域设置，或返回绑定了新区域的副本，该区域会作用于文本预览、预设格式及后续运算链。传入空标签可清除已绑定的区域；同时提供 [`lang()`](#lang) 作为别名。

**参数**

```params
- name: tag
  type: Locale | null | undefined
  description: 要绑定并随派生值传递的 BCP 47 区域标签；传入 `null` 可清除已有标签。
```

**返回值**

```returns
type: Duration | Locale | undefined
description: 不传参数时返回当前生效的区域标签；传入参数时返回携带 `tag` 的新 `Duration` 实例。
```

```js
import { days } from 'native-dates';

const wait = days(2).locale('ar');

wait.locale(); // 'ar'
wait.text; // 'يومان'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
dur.lang(): Locale | undefined
dur.lang(tag): Duration
```

[`locale()`](#locale) 的简写别名，用于读取或绑定当前时长的 BCP 47 区域标签。
:::

:::entry
### `toFields()` :kind[method]

```js signature
dur.toFields(): DurationFields
```

返回一个普通对象，仅包含当前时长中非零的复数形式单位字段（如 `hours`、`minutes`）。

```js
duration('1h 30m').toFields(); // { hours: 1, minutes: 30 }
```
:::

:::entry
### `toString()` :kind[method]

```js signature
dur.toString(): string
dur.toJSON(): string
```

返回 ISO 8601 时长字符串。`toJSON()` 返回相同的字符串，供 `JSON.stringify()` 序列化使用。

**返回值**

```returns
type: string
description: ISO 8601 时长字符串，例如 `'PT1H30M'`。
```

```js
const ttl = duration('1h 30m');

ttl.toString(); // 'PT1H30M'
JSON.stringify({ ttl }); // '{"ttl":"PT1H30M"}'
```
:::

:::entry
### `toMilliseconds()` :kind[method]

```js signature
dur.toMilliseconds(): number
```

返回以毫秒为单位的总长度。未绑定起点的月或年时长会抛出 `RangeError`。

```js
hours(2).toMilliseconds(); // 7200000
```
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
dur.toTemporal(): Temporal.Duration
```

返回底层的 `Temporal.Duration` 实例。
:::

:::entry
### `valueOf()` :kind[method]

```js signature
dur.valueOf(): number
```

返回总毫秒数，使定长时长或带起点的时长可直接用于计时器和数值比较运算符。
:::
