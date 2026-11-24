---
source: "09d43cd55ced"
title: YearMonth
lede: 不含日字段的日历年月，适用于账单周期、银行卡有效期与月份选择器。
---

## 创建 YearMonth

使用 [`yearMonth()`](/api/year-month-fn/) 从 ISO 字符串、年月数字或已有日期创建实例，或使用 [`monthYear()`](/api/year-month-fn/#monthyear) 按“月/年”顺序解析银行卡有效期字符串。所有实例均不可变，任何修改方法都会返回一个新实例。

```js title="create.js"
import { monthYear, yearMonth } from 'native-dates';

const billing = yearMonth('2026-11');
const quarterEnd = yearMonth(2026, 12);
const expiry = monthYear('11/26');
```

你可以通过任意[日历日期](/api/calendar-date/)或[具体时刻](/api/date-time/)的 `yearMonth` 属性读取年月，也可以在链式调用中用 `as('yearMonth')` 转换：

```js
import { date, datetime, today } from 'native-dates';

date('2026-11-16').yearMonth.toString(); // '2026-11'
datetime('2026-11-01T02:00:00Z', 'America/Los_Angeles').as('yearMonth').toString(); // '2026-10'
const currentMonth = today().yearMonth;
```

## 属性

以下属性读取 ISO 年份、月份以及当月的日历边界。

| 属性 | 类型 | 说明 |
|---|---|---|
| `text` | `string` | 按当前区域格式化的年月，例如 `'Nov 2026'`。 |
| `year`、`month` | `number` | 日历年份，以及从 1 开始计数的月份（1 到 12）。 |
| `quarter` | `number` | 日历季度（1 到 4）。 |
| `daysInMonth`、`daysInYear` | `number` | 当月天数（28 到 31）以及当年天数（365 或 366）。 |
| `start`、`end` | [`CalendarDate`](/api/calendar-date/) | 当月的第一天和最后一天。 |
| `YearMonth.century` | `number` | [`monthYear()`](/api/year-month-fn/#monthyear) 解析两位年份时叠加的基准世纪，默认为 `2000`。 |

## 运算与字段

按月、季度或年推算，替换字段，或选取当月的具体某一天。

:::note[仅支持月和年单位]
由于年月不包含日字段，传入小于月的单位会抛出 `RangeError`。如需按周或按天运算，请先调用 [`on()`](#on) 指定具体日期。
:::

:::entry
### `plus()` :kind[method]

```js signature
ym.plus(amount, unit?): YearMonth
ym.add(amount, unit?): YearMonth
```

加上指定的年、季度或月数，返回新的 `YearMonth` 实例。同时提供 `add()` 作为别名。

**参数**

```params
- name: amount
  type: DurationInput
  required: true
  description: 与 `unit` 配对的数值、`Duration` 实例、时长字符串或字段对象。
- name: unit
  type: Unit
  description: 当 `amount` 为数值时的月、季度或年单位名。
```

**返回值**

```returns
type: YearMonth
description: 加上指定跨度后的新 `YearMonth` 实例。
```

```js
const billing = yearMonth('2026-11');

billing.plus(3, 'months').toString(); // '2027-02'
billing.plus('1 year').toString(); // '2027-11'
```
:::

:::entry
### `minus()` :kind[method]

```js signature
ym.minus(amount, unit?): YearMonth
ym.subtract(amount, unit?): YearMonth
```

减去指定的年、季度或月数，返回新实例。接受与 [`plus()`](#plus) 相同的参数，同时提供 `subtract()` 作为别名。

**参数**

```params
- name: amount
  type: DurationInput
  required: true
  description: 与 `unit` 配对的数值、`Duration` 实例、时长字符串或字段对象。
- name: unit
  type: Unit
  description: 当 `amount` 为数值时的月、季度或年单位名。
```

**返回值**

```returns
type: YearMonth
description: 减去指定跨度后的新 `YearMonth` 实例。
```

```js
yearMonth('2026-11').minus(1, 'year').toString(); // '2025-11'
```
:::

:::entry
### `set()` :kind[method]

```js signature
ym.set(fields): YearMonth
ym.set(unit, value): YearMonth
```

返回一个替换了年份、月份或两者的 `YearMonth` 新实例。超出范围的月份或小于月的单位都会抛出 `RangeError`。

**参数**

```params
- name: fields
  type: Partial<YearMonthFields> | Unit
  required: true
  description: 包含 `year` 或 `month` 字段的对象，或单个单位名。
- name: value
  type: number
  description: 传入单位名时对应的整数值。
```

**返回值**

```returns
type: YearMonth
description: 更新日历字段后的新 `YearMonth` 实例。
```

```js
const billing = yearMonth('2026-11');

billing.set('month', 2).toString(); // '2026-02'
billing.set({ year: 2028, month: 2 }).daysInMonth; // 29
```
:::

:::entry
### `on()` :kind[method]

```js signature
ym.on(day): CalendarDate
```

在当前月份中指定 1 到 31 之间的整数日期，返回一个 [`CalendarDate`](/api/calendar-date/)。在 2 月、4 月等天数较少的月份中，31 日会自动限制到月末最后一天；超出 1 到 31 范围的数值则会抛出 `RangeError`。

**参数**

```params
- name: day
  type: number | string
  required: true
  description: 当月的日期数字（1 到 31 之间的整数）。
```

**返回值**

```returns
type: CalendarDate
description: 当月对应那一天的 `CalendarDate` 实例。
```

```js
yearMonth('2026-11').on(15).toString(); // '2026-11-15'
yearMonth('2026-02').on(31).toString(); // '2026-02-28'
yearMonth('2028-02').on(31).toString(); // '2028-02-29'
```
:::

## 比较与包含

按时间顺序比较年月，或判断某个日历日期是否落在该月份内。使用 `<` 等关系运算符会抛出错误；对数组排序时，请使用 [`compare()`](/api/compare/) 和[边界辅助函数](/api/compare/#earliest)。

:::entry
### `compare()` :kind[method]

```js signature
ym.compare(other): -1 | 0 | 1
```

将当前年月与另一个年月比较先后，返回负数、零或正数以便排序。传入完整日期或时间戳时，会与其所属月份比较。

**参数**

```params
- name: other
  type: YearMonthInput
  required: true
  description: 另一个 `YearMonth` 实例，或任意 `yearMonth()` 接受的输入。
```

**返回值**

```returns
type: -1 | 0 | 1
description: 更早时返回 `-1`，相等时返回 `0`，更晚时返回 `1`。
```

```js
yearMonth('2026-05').compare('2026-11'); // -1
yearMonth('2026-11').compare('2026-11-16'); // 0
```
:::

:::entry
### `equals()` :kind[method]

```js signature
ym.equals(other): boolean
```

当两个值表示相同的年份和月份时返回 `true`。

```js
yearMonth('2026-11').equals(yearMonth(2026, 11)); // true
```
:::

:::entry
### `isBefore()` :kind[method]

```js signature
ym.isBefore(other): boolean
```

当前年月早于另一个年月时返回 `true`。

```js
yearMonth('2026-10').isBefore('2026-11'); // true
```
:::

:::entry
### `isAfter()` :kind[method]

```js signature
ym.isAfter(other): boolean
```

当前年月晚于另一个年月时返回 `true`。

```js
yearMonth('2026-12').isAfter('2026-11'); // true
```
:::

:::entry
### `contains()` :kind[method]

```js signature
ym.contains(day): boolean
ym.includes(day): boolean
```

当给定的日历日期或时间戳落在该年该月内时返回 `true`。同时提供 `includes()` 作为别名。

**参数**

```params
- name: day
  type: CalendarDateInput
  required: true
  description: 日期字符串、`CalendarDate`、`DateTime`、字段对象或 `Date`。
```

**返回值**

```returns
type: boolean
description: 当 `day` 落在该月份内时返回 `true`。
```

```js
const nov = yearMonth('2026-11');

nov.contains('2026-11-16'); // true
nov.contains('2026-12-01'); // false
```
:::

:::entry
### `isPast()` :kind[method]

```js signature
ym.isPast(zone?): boolean
```

在指定或全局配置的时区下，当整个月份都早于今天所在月份时返回 `true`。

```js
yearMonth('2020-01').isPast('UTC'); // true
```
:::

:::entry
### `isFuture()` :kind[method]

```js signature
ym.isFuture(zone?): boolean
```

在指定或全局配置的时区下，当该月份晚于今天所在月份时返回 `true`。

```js
yearMonth('2099-01').isFuture('UTC'); // true
```
:::

:::entry
### `isLeapYear()` :kind[method]

```js signature
ym.isLeapYear(): boolean
```

当该月份所属的日历年份有 366 天时返回 `true`。

```js
yearMonth('2028-02').isLeapYear(); // true
yearMonth('2026-02').isLeapYear(); // false
```
:::

## 度量跨度

:::entry
### `until()` :kind[method]

```js signature
ym.until(other): Duration
ym.until(other, unit): number
```

度量从当前月份到目标月份之间的跨度；若目标更早，则返回负时长。返回的 [`Duration`](/api/duration/) 会记住当前月份的起点，因此其中的月和年可按任意单位求总计。

**参数**

```params
- name: other
  type: YearMonthInput
  required: true
  description: 作为终点的目标年月。
- name: unit
  type: Unit
  description: 单位名，指定后将以浮点数返回换算后的总跨度。
```

**返回值**

```returns
type: Duration | number
description: 包含年与月的 `Duration` 实例；若传入 `unit` 则返回数值。
```

```js
const start = yearMonth('2026-03');

start.until('2027-06').toString(); // 'P1Y3M'
start.until('2027-06', 'months'); // 15
```
:::

:::entry
### `since()` :kind[method]

```js signature
ym.since(other): Duration
ym.since(other, unit): number
```

度量自较早年月以来经过的跨度。传入单位名可直接以数值形式返回总跨度。

```js
yearMonth('2026-11').since('2026-05', 'months'); // 6
```
:::

## 格式化与转换

:::entry
### `format()` :kind[method]

```js signature
ym.format(spec?, locale?): string
```

使用命名预设、`Intl` 选项对象或内置占位符模板（如 `'MM/YY'`）来格式化年月。传入共用选项对象时，会自动丢弃日、时钟和时区相关的键。

标准预设与本地化预设都只输出年份和月份，通过 [`configure()`](/api/configure/) 注册的自定义格式同样适用。完整的预设与占位符列表请参阅[格式化](/guides/formatting/)。

**参数**

```params
- name: spec
  type: FormatSpec
  default: "'medium'"
  description: 预设名称（如 `'medium'` 或 `'long'`）、`Intl` 选项对象或占位符模板。
- name: locale
  type: Locale
  description: BCP 47 区域标签，仅对本次调用覆盖实例自带或全局配置的区域设置。
```

**返回值**

```returns
type: string
description: 格式化后的年月字符串。
```

```js
const nov = yearMonth('2026-11');

nov.format('short', 'en-US'); // '11/2026'
nov.format('medium', 'en-US'); // 'Nov 2026'
nov.format('long', 'en-US'); // 'November 2026'
nov.format('L', 'en-US'); // '11/2026'
nov.format('MM/YY'); // '11/26'
```
:::

:::entry
### `locale()` :kind[method]

```js signature
ym.locale(): Locale | undefined
ym.locale(tag): YearMonth
```

读取当前年月自带的区域设置，或返回绑定了新区域的副本，该区域会作用于文本预览、预设格式及所有由此派生的值。传入空标签可清除已绑定的区域；同时提供 [`lang()`](#lang) 作为别名。

**参数**

```params
- name: tag
  type: Locale | null | undefined
  description: 要绑定并随派生值传递的 BCP 47 区域标签；传入 `null` 可清除已有标签。
```

**返回值**

```returns
type: YearMonth | Locale | undefined
description: 不传参数时返回当前生效的区域标签；传入参数时返回携带 `tag` 的新 `YearMonth` 实例。
```

```js
const may = yearMonth('2026-05').locale('ru');

may.locale(); // 'ru'
may.format('long'); // 'май 2026 г.'
may.on(1).format('long'); // '1 мая 2026 г.'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
ym.lang(): Locale | undefined
ym.lang(tag): YearMonth
```

[`locale()`](#locale) 的简写别名，用于读取或绑定当前年月的 BCP 47 区域标签。
:::

:::entry
### `as()` :kind[method]

```js signature
ym.as('yearMonth'): YearMonth
```

在通用转换链中请求 `'yearMonth'` 时返回当前实例，请求其他类型时抛出 `RangeError`。
:::

:::entry
### `toString()` :kind[method]

```js signature
ym.toString(): string
ym.toJSON(): string
```

返回 ISO 8601 年月字符串，与 HTML 中的 `month` 表单输入格式一致。`toJSON()` 返回相同的字符串，供 JSON 序列化使用。

**返回值**

```returns
type: string
description: ISO 8601 年月字符串，例如 `'2026-11'`。
```

```js
yearMonth(2026, 11).toString(); // '2026-11'
JSON.stringify({ billing: yearMonth(2026, 11) }); // '{"billing":"2026-11"}'
```
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
ym.toTemporal(): Temporal.PlainYearMonth
```

返回底层的 `Temporal.PlainYearMonth` 实例。
:::

:::entry
### `valueOf()` :kind[method]

```js signature
ym.valueOf(): never
```

始终抛出 `RangeError`，防止数值运算符将年月隐式转为数字。如需收窄未知值的类型，请使用 [`isYearMonth()`](/api/kind-of/#isyearmonth) 或 [`kindOf()`](/api/kind-of/)。
:::
