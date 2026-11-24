---
source: "3e14665094ab"
title: Time
lede: 不含日历日期与时区的时钟时间。
---

## 创建 Time

使用 [`time()`](/api/time-fn/) 解析 12 小时制或 24 小时制时间字符串、传入时分数字或转换已有值。所有实例均不可变，任何修改方法都会返回一个新实例。

```js title="create.js"
import { time } from 'native-dates';

const morning = time('9:30am');
const evening = time('17:30');
const alarm = time(6, 45);
```

你也可以通过任意 [`DateTime`](/api/date-time/) 实例的 `time` 属性读取当地时钟时间：

```js
import { datetime, now } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
standup.time.toString(); // '09:30:00'
const currentClock = now().time;
```

## 属性

以下属性按 24 小时制读取从小时到纳秒的时钟字段。

| 属性 | 类型 | 说明 |
|---|---|---|
| `text` | `string` | 按当前区域格式化的时钟时间，例如 `'9:30 AM'`。 |
| `hour`、`minute`、`second` | `number` | 24 小时制时钟字段（0–23、0–59、0–59）。 |
| `millisecond`、`microsecond`、`nanosecond` | `number` | 亚秒级时钟字段（0–999）。 |

## 组合与字段

将时钟时间与某个日历日期组合，或替换单个时钟字段。

:::entry
### `on()` :kind[method]

```js signature
t.on(date, zone?): DateTime
```

将此时钟时间与某时区下的日历日期组合，返回一个 [`DateTime`](/api/date-time/) 实例。它与在 [`CalendarDate`](/api/calendar-date/) 上调用 [`at()`](/api/calendar-date/#at) 互为镜像。

**参数**

```params
- name: date
  type: CalendarDateInput
  required: true
  description: ISO 日期字符串、`CalendarDate`、`DateTime`、字段对象或 `Date`。
- name: zone
  type: Zone
  description: IANA 时区标识、固定 UTC 偏移量或 `'UTC'`。默认使用全局配置的时区。
```

**返回值**

```returns
type: DateTime
description: 在 `zone` 时区下、由 `date` 与此时钟时间组合而成的新 `DateTime` 实例。
```

```js
const opens = time('9:30am');

opens.on('2026-11-16', 'America/New_York').toString(); // '2026-11-16T14:30:00.000Z'
```
:::

:::entry
### `set()` :kind[method]

```js signature
t.set(fields): Time
t.set(unit, value): Time
```

返回替换了一个或多个时钟字段的新 `Time`。超出范围的值（如分钟为 75）会抛出 `RangeError`。

**参数**

```params
- name: fields
  type: DateTimeFields | Unit
  required: true
  description: 包含时钟字段的对象；若同时传入 `value`，则为单个单位名。
- name: value
  type: number
  description: 指定 `unit` 对应的整数值。
```

**返回值**

```returns
type: Time
description: 更新时钟字段后的新 `Time` 实例。
```

```js
const reminder = time('9:30am');

reminder.set('minute', 45).toString(); // '09:45:00'
reminder.set({ hour: 17, minute: 0 }).toString(); // '17:00:00'
```
:::

## 运算与舍入

增减时钟单位、对齐单位边界，或按步长舍入。由于时钟时间不含日期，传入天、周等日历单位会抛出 `RangeError`。

:::note[跨午夜自动回绕]
时钟运算像表盘一样在 24 小时内循环，因此 23:00 加 2 小时得到 01:00。如果希望跨越午夜时同步推进日历日期，请先调用 [`on()`](#on) 将其与日期组合。
:::

:::entry
### `plus()` :kind[method]

```js signature
t.plus(amount, unit?): Time
t.add(amount, unit?): Time
```

在 24 小时表盘上增加一段时长并返回新的 `Time`，必要时跨过午夜回绕。同时提供别名 `add()`。

**参数**

```params
- name: amount
  type: DurationInput
  required: true
  description: 配合 `unit` 使用的数值、`Duration` 实例、时长字符串、字段对象或毫秒数。
- name: unit
  type: Unit
  description: 当 `amount` 为数字时的时钟单位名，例如 `'hours'` 或 `'minutes'`。
```

**返回值**

```returns
type: Time
description: 按 24 小时制回绕后的新 `Time` 实例。
```

```js
time('9:00am').plus(90, 'minutes').toString(); // '10:30:00'
time('23:00').plus('2h').toString(); // '01:00:00'
```
:::

:::entry
### `minus()` :kind[method]

```js signature
t.minus(amount, unit?): Time
t.subtract(amount, unit?): Time
```

在 24 小时表盘上减去一段时长，必要时跨过午夜回绕。接受与 [`plus()`](#plus) 相同的参数，并提供别名 `subtract()`。

**参数**

```params
- name: amount
  type: DurationInput
  required: true
  description: 配合 `unit` 使用的数值、`Duration` 实例、时长字符串、字段对象或毫秒数。
- name: unit
  type: Unit
  description: 当 `amount` 为数字时的时钟单位名。
```

**返回值**

```returns
type: Time
description: 按 24 小时制回绕后的新 `Time` 实例。
```

```js
time('00:30').minus(45, 'minutes').toString(); // '23:45:00'
```
:::

:::entry
### `startOf()` :kind[method]

```js signature
t.startOf(unit): Time
```

将所有小于指定单位的时钟字段清零。

**参数**

```params
- name: unit
  type: Unit
  required: true
  description: 从 `'hour'` 到 `'nanosecond'` 的时钟单位。
```

**返回值**

```returns
type: Time
description: 位于 `unit` 起始点的新 `Time` 实例。
```

```js
time('14:37:22').startOf('hour').toString(); // '14:00:00'
```
:::

:::entry
### `endOf()` :kind[method]

```js signature
t.endOf(unit): Time
```

移动到指定时钟单位的最后一毫秒。

**参数**

```params
- name: unit
  type: Unit
  required: true
  description: 从 `'hour'` 到 `'nanosecond'` 的时钟单位。
```

**返回值**

```returns
type: Time
description: 位于 `unit` 最后一毫秒的新 `Time` 实例。
```

```js
time('14:37:22').endOf('hour').toString(); // '14:59:59.999'
```
:::

:::entry
### `startOfNext()` :kind[method]

```js signature
t.startOfNext(unit): Time
```

前进到下一个时钟单位的起始点，跨过午夜时自动回绕。结果始终进入下一个单位，因此对 `14:00:00` 调用 `startOfNext('hour')` 会返回 `15:00:00`。

**参数**

```params
- name: unit
  type: Unit
  required: true
  description: 从 `'hour'` 到 `'nanosecond'` 的时钟单位。
```

**返回值**

```returns
type: Time
description: 位于下一个 `unit` 起始点的新 `Time` 实例。
```

```js
time('14:37:22').startOfNext('hour').toString(); // '15:00:00'
time('23:37:22').startOfNext('hour').toString(); // '00:00:00'
```
:::

:::entry
### `startOfPrevious()` :kind[method]

```js signature
t.startOfPrevious(unit): Time
```

回退到上一个时钟单位的起始点，跨过午夜时自动回绕。

**参数**

```params
- name: unit
  type: Unit
  required: true
  description: 从 `'hour'` 到 `'nanosecond'` 的时钟单位。
```

**返回值**

```returns
type: Time
description: 位于上一个 `unit` 起始点的新 `Time` 实例。
```

```js
time('14:37:22').startOfPrevious('hour').toString(); // '13:00:00'
time('00:15:00').startOfPrevious('hour').toString(); // '23:00:00'
```
:::

:::entry
### `round()` :kind[method]

```js signature
t.round(unit): Time
t.round(increment, unit): Time
```

舍入到最接近的时钟单位或步长倍数，恰好居中时向上舍入。

**参数**

```params
- name: increment
  type: number | Unit
  required: true
  description: 能整除上一级单位的步长；当步长为 `1` 时直接传入目标 `unit`。
- name: unit
  type: Unit
  description: 要舍入的时钟单位，从 `'hour'` 到 `'nanosecond'`。
```

**返回值**

```returns
type: Time
description: 舍入后的新 `Time` 实例。
```

```js
const checkin = time('14:36:00');

checkin.round('hour').toString(); // '15:00:00'
checkin.round(15, 'minutes').toString(); // '14:30:00'
```
:::

:::entry
### `floor()` :kind[method]

```js signature
t.floor(unit): Time
t.floor(increment, unit): Time
```

向下舍入到指定时钟单位或步长的起点。参数与 [`round()`](#round) 相同。

```js
time('14:29').floor(15, 'minutes').toString(); // '14:15:00'
```
:::

:::entry
### `ceil()` :kind[method]

```js signature
t.ceil(unit): Time
t.ceil(increment, unit): Time
```

向上舍入到下一个时钟单位或步长。参数与 [`round()`](#round) 相同。

```js
time('14:01').ceil(15, 'minutes').toString(); // '14:15:00'
```
:::

## 比较时钟时间

比较操作在同一天内从零点到当日结束按先后排序。`<` 等关系运算符会抛出 `RangeError`，请改用比较方法或 [`compare()`](/api/compare/)。

:::entry
### `equals()` :kind[method]

```js signature
t.equals(other): boolean
```

当两个值表示完全相同的时钟时间时返回 `true`。

**参数**

```params
- name: other
  type: TimeInput
  required: true
  description: 另一个 `Time` 实例，或任何可传入 `time()` 的输入。
```

**返回值**

```returns
type: boolean
description: 当两个值精确到纳秒完全一致时返回 `true`。
```

```js
time('5:30pm').equals('17:30'); // true
```
:::

:::entry
### `isBefore()` :kind[method]

```js signature
t.isBefore(other): boolean
```

如果当前时钟时间在当天早于另一个时钟时间，则返回 `true`。

```js
time('9:00am').isBefore('5:00pm'); // true
```
:::

:::entry
### `isAfter()` :kind[method]

```js signature
t.isAfter(other): boolean
```

如果当前时钟时间在当天晚于另一个时钟时间，则返回 `true`。

```js
time('5:00pm').isAfter('9:00am'); // true
```
:::

:::entry
### `isSame()` :kind[method]

```js signature
t.isSame(other, unit?): boolean
```

判断另一个时钟时间是否落在同一个时钟单位内（例如同一小时或同一分钟）。不传 `unit` 时检查精确相等。

**参数**

```params
- name: other
  type: TimeInput
  required: true
  description: 用于比较的目标时钟时间。
- name: unit
  type: Unit
  description: 用于比较的时钟单位，例如 `'hour'` 或 `'minute'`。
```

**返回值**

```returns
type: boolean
description: 当两个时钟时间属于同一 `unit` 时返回 `true`。
```

```js
time('9:05am').isSame('9:45am', 'hour'); // true
time('9:05am').isSame('10:05am', 'hour'); // false
```
:::

## 度量跨度

:::entry
### `until()` :kind[method]

```js signature
t.until(other): Duration
t.until(other, unit): number
```

度量同一天内从当前时钟时间到另一个时钟时间的有符号间隔；若目标更早则返回负时长。传入单位名可直接获取换算后的总计数值。

**参数**

```params
- name: other
  type: TimeInput
  required: true
  description: 作为终点的目标时钟时间。
- name: unit
  type: Unit
  description: 时钟单位，指定后将以浮点数返回换算后的总长度。
```

**返回值**

```returns
type: Duration | number
description: 最高进位至小时的 `Duration` 实例；若传入 `unit` 则返回数值。
```

```js
const opens = time('9:00am');
const closes = time('5:30pm');

opens.until(closes).format('long', 'en-US'); // '8 hours, 30 minutes'
opens.until(closes, 'hours'); // 8.5
time('22:00').until('02:00', 'hours'); // -20
```
:::

:::entry
### `since()` :kind[method]

```js signature
t.since(other): Duration
t.since(other, unit): number
```

度量同一天内自较早时钟时间以来经过的间隔。传入单位名可直接返回总计数值。

```js
time('5:00pm').since('9:00am', 'hours'); // 8
```
:::

:::entry
### `to()` :kind[method]

```js signature
t.to(end): TimeRange
t.to(count, unit): TimeRange
t.for(length): TimeRange
t.for(count, unit): TimeRange
```

创建一个半开区间的 [`TimeRange`](/api/ranges/#timerange)，从当前时钟时间开始，至目标时钟时间结束（不含终点），或延续指定时长。若结束时间早于开始时间，则跨午夜视为跨夜范围。使用 `for()` 可显式传入时长（不接受端点值或无单位数字）。

**参数**

```params
- name: end
  type: TimeInput | DurationInput | number
  required: true
  description: 结束时钟时间、时钟时长，或与 `unit` 配对的数值 `count`。
- name: unit
  type: Unit
  description: 当第一个参数为数值计数时的时钟单位名，例如 `'hours'` 或 `'minutes'`。
```

**返回值**

```returns
type: TimeRange
description: 从当前时钟时间开始的半开 `TimeRange` 区间。
```

```js
time('9:00am').to('5:00pm').duration.hours; // 8
time('9:00am').for(90, 'minutes').end.toString(); // '10:30:00'
time('22:00').to('06:00').duration.hours; // 8
```
:::

## 格式化与转换

:::entry
### `format()` :kind[method]

```js signature
t.format(spec?, locale?): string
```

使用内置预设、通过 [`configure()`](/api/configure/) 注册的自定义名称、选项对象或占位符模板来格式化时钟时间。

内置 `'LT'` 与 `'LTS'` 本地化预设，传入选项对象时会自动忽略日期与时区相关的键。完整的预设与占位符列表请参阅[格式化](/guides/formatting/)。

**参数**

```params
- name: spec
  type: FormatSpec
  default: "'short'"
  description: 内置或自定义的格式名称、`Intl` 选项对象，或占位符模板。
- name: locale
  type: string
  description: BCP 47 区域标签，仅对本次调用覆盖实例自带或全局配置的区域设置。
```

**返回值**

```returns
type: string
description: 格式化后的时钟时间字符串。
```

```js
const afternoon = time('17:30:15');

afternoon.format('short', 'en-US'); // '5:30 PM'
afternoon.format('LTS', 'en-US'); // '5:30:15 PM'
afternoon.format('HH:mm:ss'); // '17:30:15'
afternoon.format('h:mm a'); // '5:30 pm'
afternoon.format({ hour12: false }, 'en-US'); // '17:30'
```
:::

:::entry
### `locale()` :kind[method]

```js signature
t.locale(): Locale | undefined
t.locale(tag): Time
```

读取此时钟时间携带的区域标签，或返回一个副本，使其在文本预览、预设格式及所有派生值中均采用新的区域设置。传入空标签可清除已绑定的区域设置，同时提供别名 [`lang()`](#lang)。

**参数**

```params
- name: tag
  type: Locale | null | undefined
  description: 要绑定并随派生值传递的 BCP 47 区域标签；传入 `null` 可清除已有标签。
```

**返回值**

```returns
type: Time | Locale | undefined
description: 无参调用时返回当前生效的区域标签；传入参数时返回携带 `tag` 的新 `Time` 实例。
```

```js
const closing = time('17:30').locale('ko-KR');

closing.locale(); // 'ko-KR'
closing.text; // '오후 5:30'
closing.on('2026-05-01', 'Asia/Seoul').locale(); // 'ko-KR'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
t.lang(): Locale | undefined
t.lang(tag): Time
```

[`locale()`](#locale) 的简写别名，用于读取或设置此时钟时间的 BCP 47 区域标签。
:::

:::entry
### `toString()` :kind[method]

```js signature
t.toString(): string
t.toJSON(): string
```

返回 24 小时制 ISO 8601 时间字符串，仅在亚秒部分非零时按三位一组输出小数位。`toJSON()` 返回相同字符串，供 `JSON.stringify()` 调用。

**返回值**

```returns
type: string
description: ISO 8601 时间字符串，例如 `'17:30:00'` 或 `'17:30:15.250'`。
```

```js
time('5:30pm').toString(); // '17:30:00'
time('17:30:15.25').toString(); // '17:30:15.250'
JSON.stringify({ opens: time('9am') }); // '{"opens":"09:00:00"}'
```
:::

:::entry
### `as()` :kind[method]

```js signature
t.as('time'): Time
```

在通用转换链中请求 `'time'` 时返回当前 `Time` 实例；传入其他类型则抛出 `RangeError`。
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
t.toTemporal(): Temporal.PlainTime
```

返回底层的 `Temporal.PlainTime` 实例。
:::

:::entry
### `valueOf()` :kind[method]

```js signature
t.valueOf(): never
```

抛出 `RangeError`，避免数值运算符将时钟时间静默转换为数字。
:::
