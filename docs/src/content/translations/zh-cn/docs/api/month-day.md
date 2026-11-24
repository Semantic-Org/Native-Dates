---
source: "436c0292465a"
title: MonthDay
lede: 不含年份的日历月日，适用于生日、纪念日与年度节日。
---

## 创建 MonthDay

使用 [`monthDay()`](/api/month-day-fn/) 按“月-日”顺序创建实例，或使用 [`dayMonth()`](/api/month-day-fn/#daymonth) 按“日-月”顺序解析。所有实例均不可变，每个方法都会返回一个新值。

```js title="create.js"
import { dayMonth, monthDay } from 'native-dates';

const birthday = monthDay(10, 17);
const fromIso = monthDay('10-17');
const european = dayMonth('17/10');
```

你可以通过任意[日历日期](/api/calendar-date/)或[具体时刻](/api/date-time/)的 `monthDay` 属性读取月日，也可以在链式调用中用 `as('monthDay')` 转换：

```js
import { date, datetime, today } from 'native-dates';

date('1990-10-17').monthDay.toString(); // '10-17'
datetime('2026-10-18T02:00:00Z', 'America/Los_Angeles').as('monthDay').toString(); // '10-17'
const currentMonthDay = today().monthDay;
```

## 属性

以下属性读取从 1 开始计数的月份和日期。

| 属性 | 类型 | 说明 |
|---|---|---|
| `text` | `string` | 按当前区域格式化的月日，例如 `'Oct 17'`。 |
| `month`、`day` | `number` | 日历月份（1 到 12）以及当月日期（1 到 31）。 |

## 指定年份与步进

为周期性出现的月日指定年份以得到具体日期，或查找前一次或下一次对应日期。

:::entry
### `in()` :kind[method]

```js signature
md.in(year): CalendarDate
```

为当前月日指定日历年份，返回一个 [`CalendarDate`](/api/calendar-date/)。在没有闰日的平年中，2 月 29 日会落到 2 月 28 日。

**参数**

```params
- name: year
  type: number | string
  required: true
  description: 整数日历年份，例如 `2027`。
```

**返回值**

```returns
type: CalendarDate
description: 该月日在 `year` 年对应的 `CalendarDate` 实例。
```

```js
const birthday = monthDay(10, 17);
const leapDay = monthDay(2, 29);

birthday.in(2027).toString(); // '2027-10-17'
leapDay.in(2027).toString(); // '2027-02-28'
leapDay.in(2028).toString(); // '2028-02-29'
```
:::

:::entry
### `next()` :kind[method]

```js signature
md.next(day?): CalendarDate
```

返回参考日期之后的下一次对应日期，参考日期默认为 [`today()`](/api/date-fn/#today)。若参考日期恰好就是当前月日，则推进到下一年。

日历日期与具体时刻也支持在 [`d.next(md)`](/api/calendar-date/#next) 和 [`dt.next(md)`](/api/date-time/#next) 中直接传入月日。

**参数**

```params
- name: day
  type: CalendarDateInput
  default: today()
  description: 起始参考日期，将从该日期之后开始查找。
```

**返回值**

```returns
type: CalendarDate
description: 位于 `day` 之后的下一个 `CalendarDate` 实例。
```

```js
import { date, monthDay } from 'native-dates';

const birthday = monthDay(10, 17);

birthday.next('2026-05-01').toString(); // '2026-10-17'
birthday.next('2026-10-17').toString(); // '2027-10-17'
date('2026-11-16').next(birthday).toString(); // '2027-10-17'
```
:::

:::entry
### `previous()` :kind[method]

```js signature
md.previous(day?): CalendarDate
md.last(day?): CalendarDate
```

返回参考日期之前的最近一次对应日期，参考日期默认为 [`today()`](/api/date-fn/#today)。日历日期与具体时刻同样支持在 `previous()` 中直接传入月日。同时提供 `last()` 作为别名。

**参数**

```params
- name: day
  type: CalendarDateInput
  default: today()
  description: 参考日期，将从该日期之前开始查找。
```

**返回值**

```returns
type: CalendarDate
description: 位于 `day` 之前最近一次对应的 `CalendarDate` 实例。
```

```js
import { date, monthDay } from 'native-dates';

const birthday = monthDay(10, 17);

birthday.previous('2026-10-17').toString(); // '2025-10-17'
date('2026-11-16').previous(birthday).toString(); // '2026-10-17'
```
:::

:::entry
### `after()` :kind[method]

```js signature
md.after(day): CalendarDate
```

返回指定参考日期之后的下一次对应日期。行为与 [`next()`](#next) 相同，但必须显式传入参考日期，不默认使用今天。

**参数**

```params
- name: day
  type: CalendarDateInput
  required: true
  description: 作为查找起点的参考日期。
```

**返回值**

```returns
type: CalendarDate
description: 严格晚于 `day` 的首个 `CalendarDate` 实例。
```

```js
monthDay(2, 29).after('2026-03-01').toString(); // '2027-02-28'
```
:::

:::entry
### `before()` :kind[method]

```js signature
md.before(day): CalendarDate
```

返回指定参考日期之前的最近一次对应日期。行为与 [`previous()`](#previous) 相同，但必须显式传入参考日期，不默认使用今天。

```js
monthDay(10, 17).before('2026-10-01').toString(); // '2025-10-17'
```
:::

## 匹配与相等

由于月日每年都会重复出现，而非指向某个单一日期，因此 `isBefore()` 等顺序比较方法并不适用。

:::tip[选择 equals 还是 fallsOn]
若要判断某个日历日期是否是该月日在当年的实际对应日期，请使用 [`fallsOn()`](#fallson)，因为 2 月 29 日在平年会对应到 2 月 28 日。若只需检查两个值的月份和日期数字是否完全一致，再使用 [`equals()`](#equals)。
:::

:::entry
### `fallsOn()` :kind[method]

```js signature
md.fallsOn(day): boolean
md.isOn(day): boolean
```

当给定日期恰好是当前月日在该年份的实际对应日期时返回 `true`。在平年中，2 月 29 日对应 2 月 28 日；而在闰年中，它仅对应 2 月 29 日。同时提供 `isOn()` 作为别名。

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
description: 当 `day` 是该月日在当年的对应日期时返回 `true`。
```

```js
const leapDay = monthDay(2, 29);

leapDay.fallsOn('2027-02-28'); // true
leapDay.fallsOn('2028-02-28'); // false
leapDay.fallsOn('2028-02-29'); // true
```
:::

:::entry
### `equals()` :kind[method]

```js signature
md.equals(other): boolean
```

当两个值的月份和日期数字完全相同时返回 `true`；传入完整日期或时间戳时，会自动提取其中的月和日来比较。

像 `'05/10'` 这类带斜杠或点号的歧义字符串会抛出 `RangeError`。请先使用[按“月-日”或“日-月”顺序解析的工厂函数](/api/month-day-fn/)转换后再比较。

**参数**

```params
- name: other
  type: MonthDayInput
  required: true
  description: 另一个 `MonthDay` 实例、ISO `'10-17'` 字符串、字段对象或日期值。
```

**返回值**

```returns
type: boolean
description: 当两个值的月份和日期相同时返回 `true`。
```

```js
const birthday = monthDay(10, 17);

birthday.equals('10-17'); // true
birthday.equals('1990-10-17'); // true
monthDay(2, 29).equals('2027-02-28'); // false
```
:::

:::entry
### `isToday()` :kind[method]

```js signature
md.isToday(zone?): boolean
```

在指定或全局配置的时区下，当该月日恰好落在今天时返回 `true`。

```js
import { today } from 'native-dates';

today('UTC').monthDay.isToday('UTC'); // true
```
:::

:::entry
### `isTomorrow()` :kind[method]

```js signature
md.isTomorrow(zone?): boolean
```

在指定或全局配置的时区下，当该月日恰好落在明天时返回 `true`。

```js
import { tomorrow } from 'native-dates';

tomorrow('UTC').monthDay.isTomorrow('UTC'); // true
```
:::

:::entry
### `isYesterday()` :kind[method]

```js signature
md.isYesterday(zone?): boolean
```

在指定或全局配置的时区下，当该月日恰好落在昨天时返回 `true`。

```js
import { yesterday } from 'native-dates';

yesterday('UTC').monthDay.isYesterday('UTC'); // true
```
:::

## 格式化与转换

:::entry
### `format()` :kind[method]

```js signature
md.format(spec?, locale?): string
```

按目标区域的惯例顺序格式化月日，或使用内置占位符模板（如 `'MMM Do'`）。传入共用选项对象时，会自动忽略年、时钟和时区相关的键。

通过 [`configure()`](/api/configure/) 注册的自定义格式同样适用；非公历区域仍会按公历月份名称格式化，以确保年度日期保持稳定。完整的预设与占位符选项请参阅[格式化](/guides/formatting/)。

**参数**

```params
- name: spec
  type: FormatSpec
  default: "'medium'"
  description: 预设名称（如 `'short'` 或 `'long'`）、`Intl` 选项对象或占位符模板。
- name: locale
  type: Locale
  description: BCP 47 区域标签，仅对本次调用覆盖实例自带或全局配置的区域设置。
```

**返回值**

```returns
type: string
description: 格式化后的月日字符串。
```

```js
const oct17 = monthDay(10, 17);

oct17.format('short', 'en-US'); // '10/17'
oct17.format('short', 'en-GB'); // '17/10'
oct17.format('medium', 'en-US'); // 'Oct 17'
oct17.format('long', 'en-US'); // 'October 17'
oct17.format('MMM Do', 'en-US'); // 'Oct 17th'
```
:::

:::entry
### `locale()` :kind[method]

```js signature
md.locale(): Locale | undefined
md.locale(tag): MonthDay
```

读取当前月日自带的区域设置，或返回绑定了新区域的副本，该区域会作用于文本预览、预设格式及所有由此派生的日期。传入空标签可清除已绑定的区域；同时提供 [`lang()`](#lang) 作为别名。

**参数**

```params
- name: tag
  type: Locale | null | undefined
  description: 要绑定并随派生值传递的 BCP 47 区域标签；传入 `null` 可清除已有标签。
```

**返回值**

```returns
type: MonthDay | Locale | undefined
description: 不传参数时返回当前生效的区域标签；传入参数时返回携带 `tag` 的新 `MonthDay` 实例。
```

```js
const labourDay = monthDay(5, 1).locale('ru');

labourDay.locale(); // 'ru'
labourDay.format('long'); // '1 мая'
labourDay.in(2026).format('long'); // '1 мая 2026 г.'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
md.lang(): Locale | undefined
md.lang(tag): MonthDay
```

[`locale()`](#locale) 的简写别名，用于读取或绑定当前月日的 BCP 47 区域标签。
:::

:::entry
### `as()` :kind[method]

```js signature
md.as('monthDay'): MonthDay
```

在通用转换链中请求 `'monthDay'` 时返回当前实例，请求其他类型时抛出 `RangeError`。
:::

:::entry
### `toString()` :kind[method]

```js signature
md.toString(): string
md.toJSON(): string
```

返回月和日均补零为两位的 ISO 月日字符串 `'MM-DD'`，无论传给哪一个[月日工厂函数](/api/month-day-fn/)，都能按“月-日”顺序无损解析回原值。`toJSON()` 返回相同的字符串，供 JSON 序列化使用。

**返回值**

```returns
type: string
description: ISO 月日字符串，例如 `'10-17'`。
```

```js
monthDay(5, 6).toString(); // '05-06'
JSON.stringify({ birthday: monthDay(10, 17) }); // '{"birthday":"10-17"}'
```
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
md.toTemporal(): Temporal.PlainMonthDay
```

返回底层的 `Temporal.PlainMonthDay` 实例。
:::

:::entry
### `valueOf()` :kind[method]

```js signature
md.valueOf(): never
```

始终抛出 `RangeError`，防止数值运算符将月日隐式转为数字。如需收窄未知值的类型，请使用 [`isMonthDay()`](/api/kind-of/#ismonthday) 或 [`kindOf()`](/api/kind-of/)。
:::
