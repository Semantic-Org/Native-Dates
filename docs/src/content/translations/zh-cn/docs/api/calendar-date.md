---
source: "df57e2243cc3"
title: CalendarDate
lede: 不含时钟时间与时区的日历日期。
---

## 创建 CalendarDate

使用 [`date()`](/api/date-fn/) 从 ISO 字符串、年月日数字或已有值创建实例，或用 [`today()`](/api/date-fn/#today) 获取当天日期。获取[明天](/api/date-fn/#tomorrow)和[昨天](/api/date-fn/#yesterday)的辅助函数用法相同，且所有方法都会返回新的不可变实例。

```js title="create.js"
import { date, today, tomorrow } from 'native-dates';

const birthday = date('2026-05-10');
const launch = date(2026, 11, 16);
const current = today();
const nextDay = tomorrow('America/New_York');
```

由于日历日期不含时钟与时区，5 月 10 日对身处世界各地的用户而言始终是 5 月 10 日。你也可以直接从任意 [`DateTime`](/api/date-time/) 实例读取当地日历日期：

```js
import { datetime } from 'native-dates';

const flight = datetime('2026-11-16T23:30:00Z', 'Asia/Tokyo');
flight.date.toString(); // '2026-11-17'
```

## 属性

以下属性直接读取 ISO 日历字段。

| 属性 | 类型 | 说明 |
|---|---|---|
| `text` | `string` | 按当前区域格式化的日历日期，例如 `'Nov 16, 2026'`。 |
| `year`、`month`、`day` | `number` | 公历年份、月份（1–12）与日（1–31）。 |
| `yearMonth` | [`YearMonth`](/api/year-month/) | 去掉日字段后的公历年月。 |
| `monthDay` | [`MonthDay`](/api/month-day/) | 去掉年字段后的公历月日。 |
| `dayOfWeek` | `number` | ISO 星期几，从 1（周一）到 7（周日）。 |
| `weekStart` | `number` | 此日期所在周的起始日（1–7），遵循 [`configure()`](/api/configure/) 或当前区域设置。 |
| `quarter` | `number` | 日历季度（1–4）。 |
| `weekOfYear`、`dayOfYear` | `number` | ISO 周数（1–53）与年中第几天（1–366）。 |
| `daysInMonth`、`daysInYear` | `number` | 当前月份的天数（28–31）与年份的天数（365 或 366）。 |

## 组合与字段

为日历日期附加某时区下的时钟时间以构成具体时刻，或替换单个日历字段。

:::entry
### `at()` :kind[method]

```js signature
d.at(time?, zone?): DateTime
```

将此日历日期与某时区下的时钟时间组合，返回一个 [`DateTime`](/api/date-time/) 实例。省略时钟时间时默认为当天零点。

**参数**

```params
- name: time
  type: TimeInput
  default: "'00:00'"
  description: 时钟时间字符串（如 `'9:30am'`）、`Time` 实例、字段对象或 `Date`。
- name: zone
  type: Zone
  description: IANA 时区标识、固定 UTC 偏移量或 `'UTC'`。默认使用全局配置的时区。
```

**返回值**

```returns
type: DateTime
description: 此日期在 `zone` 时区下、时钟时间为 `time` 的新 `DateTime` 实例。
```

```js
const day = date('2026-11-16');

day.at('9:30am', 'America/Los_Angeles').toString(); // '2026-11-16T17:30:00.000Z'
day.at(undefined, 'UTC').toString(); // '2026-11-16T00:00:00.000Z'
```
:::

:::entry
### `set()` :kind[method]

```js signature
d.set(fields): CalendarDate
d.set(unit, value): CalendarDate
```

返回替换了一个或多个日历字段的新 `CalendarDate`。超出有效范围的日期（如 2 月 30 日）会抛出 `RangeError`，不会进位到下个月。只更新 `month` 或 `year` 而未传入 `day` 时，若原有日期超出目标月份天数，会自动限制到目标月末。

**参数**

```params
- name: fields
  type: DateTimeFields | DateUnit
  required: true
  description: 包含 `year`、`month` 或 `day` 字段的对象，或单个日历单位名。
- name: value
  type: number
  description: 指定 `unit` 对应的整数值。
```

**返回值**

```returns
type: CalendarDate
description: 更新日历字段后的新 `CalendarDate` 实例。
```

```js
const due = date('2026-11-16');

due.set('day', 1).toString(); // '2026-11-01'
due.set({ month: 12, day: 31 }).toString(); // '2026-12-31'
```
:::

## 运算与边界

按日历单位增减日期、对齐周期边界，或跳转到邻近的星期几。由于日历日期不含时钟，传入小时、分钟等时钟单位会抛出 `RangeError`。

:::note[月末边界限制]
增加月份或年份时，结果会限制到目标月份的最后一天，而不会溢出进位到下个月。例如 1 月 31 日加 1 个月会落在 2 月 28 日，闰年则落在 2 月 29 日。
:::

:::entry
### `plus()` :kind[method]

```js signature
d.plus(amount, unit?): CalendarDate
d.add(amount, unit?): CalendarDate
```

按年、季度、月、周或天增加指定跨度，返回新的 `CalendarDate`。同时提供别名 `add()`。

**参数**

```params
- name: amount
  type: DurationInput
  required: true
  description: 配合 `unit` 使用的数值、`Duration` 实例、时长字符串或字段对象。
- name: unit
  type: DateUnit
  description: 当 `amount` 为数字时的日历单位名，例如 `'days'` 或 `'months'`。
```

**返回值**

```returns
type: CalendarDate
description: 增加指定跨度后的新 `CalendarDate` 实例。
```

```js
const billing = date('2026-01-31');

billing.plus(1, 'month').toString(); // '2026-02-28'
billing.plus('2 weeks').toString(); // '2026-02-14'
```
:::

:::entry
### `minus()` :kind[method]

```js signature
d.minus(amount, unit?): CalendarDate
d.subtract(amount, unit?): CalendarDate
```

减去指定的日历时长。接受与 [`plus()`](#plus) 相同的参数，并提供别名 `subtract()`。

**参数**

```params
- name: amount
  type: DurationInput
  required: true
  description: 配合 `unit` 使用的数值、`Duration` 实例、时长字符串或字段对象。
- name: unit
  type: DateUnit
  description: 当 `amount` 为数字时的日历单位名。
```

**返回值**

```returns
type: CalendarDate
description: 减去指定跨度后的新 `CalendarDate` 实例。
```

```js
const launch = date('2026-03-01');

launch.minus(1, 'day').toString(); // '2026-02-28'
launch.minus({ weeks: 2, days: 1 }).toString(); // '2026-02-14'
```
:::

:::entry
### `startOf()` :kind[method]

```js signature
d.startOf(unit, firstDay?): CalendarDate
```

返回包含当前日期的指定日历单位的第一天。周边界优先使用 `firstDay`，其次遵循 [`configure()`](/api/configure/) 配置的 `weekStart`，最后按此日期当前的区域设置确定。

**参数**

```params
- name: unit
  type: DateUnit
  required: true
  description: 从 `'year'` 到 `'day'` 的日历单位。
- name: firstDay
  type: DayOfWeek
  description: 按周对齐时的每周起始日，例如 `'sunday'` 或 `7`。
```

**返回值**

```returns
type: CalendarDate
description: 指定 `unit` 的第一天。
```

```js
const wed = date('2026-11-18', { locale: 'en-US' });

wed.startOf('month').toString(); // '2026-11-01'
wed.startOf('quarter').toString(); // '2026-10-01'
wed.startOf('week').toString(); // '2026-11-15'
wed.startOf('week', 'monday').toString(); // '2026-11-16'
```
:::

:::entry
### `endOf()` :kind[method]

```js signature
d.endOf(unit, firstDay?): CalendarDate
```

返回包含当前日期的指定日历单位的最后一天。

**参数**

```params
- name: unit
  type: DateUnit
  required: true
  description: 从 `'year'` 到 `'day'` 的日历单位。
- name: firstDay
  type: DayOfWeek
  description: 当 `unit` 为 `'week'` 时的每周起始日。
```

**返回值**

```returns
type: CalendarDate
description: 指定 `unit` 的最后一天。
```

```js
date('2026-02-10').endOf('month').toString(); // '2026-02-28'
date('2028-02-10').endOf('month').toString(); // '2028-02-29'
```
:::

:::entry
### `startOfNext()` :kind[method]

```js signature
d.startOfNext(unit, firstDay?): CalendarDate
```

返回紧接当前所在日历单位之后的下一个单位的第一天。结果始终晚于当前日期，因此从 12 月 1 日出发时，下一个月的起点是 1 月 1 日。

传入星期名称代替单位可直接获取下一个该星期几，结果与 [`next()`](#next) 相同。

**参数**

```params
- name: unit
  type: DateUnit | Exclude<DayOfWeek, number>
  required: true
  description: 从 `'year'` 到 `'day'` 的日历单位，或星期名称（如 `'wednesday'`）。
- name: firstDay
  type: DayOfWeek
  description: 当 `unit` 为 `'week'` 时的每周起始日。
```

**返回值**

```returns
type: CalendarDate
description: 下一个 `unit` 的第一天，或下一个指定星期几。
```

```js
const mon = date('2026-11-16', { locale: 'en-US' });

mon.startOfNext('month').toString(); // '2026-12-01'
mon.startOfNext('quarter').toString(); // '2027-01-01'
mon.startOfNext('week').toString(); // '2026-11-22'
mon.startOfNext('wednesday').toString(); // '2026-11-18'
```
:::

:::entry
### `startOfPrevious()` :kind[method]

```js signature
d.startOfPrevious(unit, firstDay?): CalendarDate
```

返回当前所在日历单位之前的上一个单位的第一天。传入星期名称代替单位可获取此前最近一个该星期几，与 [`previous()`](#previous) 相同。

**参数**

```params
- name: unit
  type: DateUnit | Exclude<DayOfWeek, number>
  required: true
  description: 从 `'year'` 到 `'day'` 的日历单位，或星期名称（如 `'wednesday'`）。
- name: firstDay
  type: DayOfWeek
  description: 当 `unit` 为 `'week'` 时的每周起始日。
```

**返回值**

```returns
type: CalendarDate
description: 上一个 `unit` 的第一天，或上一个指定星期几。
```

```js
const mon = date('2026-11-16');

mon.startOfPrevious('month').toString(); // '2026-10-01'
mon.startOfPrevious('year').toString(); // '2025-01-01'
mon.startOfPrevious('wednesday').toString(); // '2026-11-11'
```
:::

:::entry
### `next()` :kind[method]

```js signature
d.next(target): CalendarDate
```

前进到当前日期之后的下一个指定星期几或 [`MonthDay`](/api/month-day/)。如果当前正好是该星期几或该年度日期，则跳到下一周期的对应日期。

**参数**

```params
- name: target
  type: DayOfWeek | MonthDay
  required: true
  description: 星期名称（如 `'friday'`）、1 到 7 的 ISO 星期数字，或周期性 `MonthDay`。
```

**返回值**

```returns
type: CalendarDate
description: 落在下一个匹配日期的新 `CalendarDate` 实例。
```

```js
import { date, monthDay } from 'native-dates';

const mon = date('2026-11-16');

mon.next('friday').toString(); // '2026-11-20'
mon.next('monday').toString(); // '2026-11-23'
mon.next(monthDay('12-25')).toString(); // '2026-12-25'
```
:::

:::entry
### `previous()` :kind[method]

```js signature
d.previous(target): CalendarDate
```

回退到当前日期之前最近的一个指定星期几或 [`MonthDay`](/api/month-day/)。如果当前正好是该星期几或该年度日期，则回退到上一周期的对应日期。

**参数**

```params
- name: target
  type: DayOfWeek | MonthDay
  required: true
  description: 星期名称、三字母缩写、1 到 7 的 ISO 星期数字，或周期性 `MonthDay`。
```

**返回值**

```returns
type: CalendarDate
description: 落在上一个匹配日期的新 `CalendarDate` 实例。
```

```js
date('2026-11-16').previous('friday').toString(); // '2026-11-13'
date('2026-11-16').previous(monthDay('10-31')).toString(); // '2026-10-31'
```
:::

## 比较日期

直接比较日历日期，或传入任意可被 [`date()`](/api/date-fn/) 接受的输入。

:::warning[不要使用数值比较运算符]
日历日期不是时间戳，因此使用数值运算符不会隐式转换为毫秒，而是直接抛出 `RangeError`。请改用 [`isBefore()`](#isbefore) 等方法比较日期，或使用 [`compare()`](/api/compare/) 为数组排序。
:::

:::entry
### `equals()` :kind[method]

```js signature
d.equals(other): boolean
```

当两个值表示相同的公历年、月、日时返回 `true`。

**参数**

```params
- name: other
  type: CalendarDateInput
  required: true
  description: 另一个 `CalendarDate` 实例，或任何可传入 `date()` 的输入。
```

**返回值**

```returns
type: boolean
description: 当两个值表示同一日历日时返回 `true`。
```

```js
const due = date('2026-11-16');

due.equals('2026-11-16'); // true
due.equals(date(2026, 11, 16)); // true
```
:::

:::entry
### `isBefore()` :kind[method]

```js signature
d.isBefore(other): boolean
```

如果当前日期在日历上早于另一个日期，则返回 `true`。

```js
date('2026-11-15').isBefore('2026-11-16'); // true
```
:::

:::entry
### `isAfter()` :kind[method]

```js signature
d.isAfter(other): boolean
```

如果当前日期在日历上晚于另一个日期，则返回 `true`。

```js
date('2026-11-17').isAfter('2026-11-16'); // true
```
:::

:::entry
### `isSame()` :kind[method]

```js signature
d.isSame(other, unit?, firstDay?): boolean
```

判断另一个日期是否落在同一个日历单位内（例如同一个月或同一周）。不传 `unit` 时检查两个值是否为完全同一天。

**参数**

```params
- name: other
  type: CalendarDateInput
  required: true
  description: 用于比较的目标日期。
- name: unit
  type: DateUnit
  description: 用于比较的日历单位，从 `'year'` 到 `'day'`。
- name: firstDay
  type: DayOfWeek
  description: 当 `unit` 为 `'week'` 时的每周起始日。
```

**返回值**

```returns
type: boolean
description: 当两个日期属于同一 `unit` 时返回 `true`。
```

```js
const wed = date('2026-09-09', { locale: 'en-US' });

wed.isSame('2026-09-30', 'month'); // true
wed.isSame('2026-09-06', 'week'); // true
wed.isSame('2026-09-06', 'week', 'monday'); // false
```
:::

### 日历判断

相对日期判断接受可选的时区参数，因为“今天是哪一天”取决于你所在的时区。省略时使用 [`configure()`](/api/configure/) 配置的默认时区。

| 方法 | 类型 | 说明 |
|---|---|---|
| `isToday(zone?)`、`isTomorrow(zone?)`、`isYesterday(zone?)` | `boolean` | 该日期在指定或配置时区下是否为今天、明天或昨天。 |
| `isPast(zone?)`、`isFuture(zone?)` | `boolean` | 该日期在指定或配置时区下是否早于或晚于今天。 |
| `isWeekday()`、`isWeekend()` | `boolean` | 按当前区域设置是否为工作日或周末，例如 `en-US` 的周六、周日，或 `ar-SA` 的周五、周六。 |
| `isLeapYear()` | `boolean` | 该日期所在年份是否有 366 天。 |

## 度量跨度

:::entry
### `until()` :kind[method]

```js signature
d.until(other): Duration
d.until(other, unit): number
```

度量从当前日期到另一个日期的日历跨度；若目标更早则返回负时长。返回的 [`Duration`](/api/duration/) 会记住此起始日期，以便准确换算月份和年份总数。

**参数**

```params
- name: other
  type: CalendarDateInput
  required: true
  description: 作为终点的目标日期。
- name: unit
  type: Unit
  description: 单位名，指定后将以浮点数返回换算后的总长度。
```

**返回值**

```returns
type: Duration | number
description: 按天计数的 `Duration` 实例；若传入 `unit` 则返回数值。
```

```js
const start = date('2026-01-01');

start.until('2027-04-05').toString(); // 'P459D'
start.until('2027-04-05').balance('year').toString(); // 'P1Y3M4D'
start.until('2027-04-05', 'days'); // 459
start.until('2026-07-01').total('months'); // 6
```
:::

:::entry
### `since()` :kind[method]

```js signature
d.since(other): Duration
d.since(other, unit): number
```

度量自较早日期以来经过的日历跨度。传入单位名可直接返回总计数值。

```js
date('2026-11-16').since('2026-11-02', 'weeks'); // 2
```
:::

:::entry
### `to()` :kind[method]

```js signature
d.to(end): DateRange
d.to(count, unit): DateRange
d.through(end): DateRange
d.through(count, unit): DateRange
d.for(length): DateRange
d.for(count, unit): DateRange
```

创建一个闭区间的 [`DateRange`](/api/ranges/#daterange)，从当前日期开始，延续至结束日期或指定跨度。起始日与结束日均包含在内。同时提供别名 `through()`；使用 `for()` 可显式传入时长（不接受端点值或无单位数字）。

**参数**

```params
- name: end
  type: CalendarDateInput | DurationInput | number
  required: true
  description: 要包含的结束日期、日历时长，或与 `unit` 配对的数值 `count`。
- name: unit
  type: DateUnit
  description: 当第一个参数为数值计数时的日历单位名，例如 `'days'` 或 `'weeks'`。
```

**返回值**

```returns
type: DateRange
description: 从当前日期开始的闭区间 `DateRange`。
```

```js
date('2026-11-01').to('2026-11-07').duration.days; // 7
date('2026-11-01').for(7, 'days').toString(); // '2026-11-01/2026-11-07'
```
:::

:::entry
### `range()` :kind[method]

```js signature
d.range(unit, firstDay?): DateRange
```

返回一个闭区间的 [`DateRange`](/api/ranges/#daterange)，覆盖包含当前日期的整个日历单位，从第一天到最后一天。

**参数**

```params
- name: unit
  type: DateUnit
  required: true
  description: 从 `'year'` 到 `'day'` 的日历单位。
- name: firstDay
  type: DayOfWeek
  description: 当 `unit` 为 `'week'` 时的每周起始日。
```

**返回值**

```returns
type: DateRange
description: 覆盖整个 `unit` 首尾的闭区间 `DateRange`。
```

```js
date('2026-02-10').range('month').toString(); // '2026-02-01/2026-02-28'
date('2026-11-18', { locale: 'en-US' }).range('week').toString(); // '2026-11-15/2026-11-21'
date('2026-11-18').range('week', 'monday').toString(); // '2026-11-16/2026-11-22'
```
:::

:::entry
### `every()` :kind[method]

```js signature
d.every(step, zone?): DateTime[]
d.every(count, unit, zone?): DateTime[]
```

在指定或配置的时区下，以正步长遍历当前日历日，返回从零点开始的 [`DateTime`](/api/date-time/) 时间点数组。遇到夏令时切换日时，按小时遍历会自动生成 23 个或 25 个时间点。

**参数**

```params
- name: step
  type: Unit | DurationInput | number
  required: true
  description: 单位名（如 `'hour'`）、时长（如 `'30m'`），或与 `unit` 配对的数值计数。
- name: unit
  type: Unit
  description: 当第一个参数为数值计数时的单位名。
- name: zone
  type: Zone
  description: 确定当日边界所用的时区，默认使用全局配置的时区。
```

**返回值**

```returns
type: DateTime[]
description: 在 `zone` 时区下覆盖该日历日的多个时间点。
```

```js
const slots = date('2026-11-16').every(6, 'hours', 'UTC');

slots.length; // 4
slots[1].toString(); // '2026-11-16T06:00:00.000Z'
```
:::

:::entry
### `split()` :kind[method]

```js signature
d.split(step, zone?): DateTimeRange[]
d.split(count, unit, zone?): DateTimeRange[]
d.splitBy(step, zone?): DateTimeRange[]
d.splitBy(count, unit, zone?): DateTimeRange[]
```

在指定或配置的时区下，将当前日历日切分为连续的半开 [`DateTimeRange`](/api/ranges/#datetimerange) 区间。同时提供别名 `splitBy()`。

**参数**

```params
- name: step
  type: Unit | DurationInput | number
  required: true
  description: 单位名、时长，或与 `unit` 配对的数值计数。
- name: unit
  type: Unit
  description: 当第一个参数为数值计数时的单位名。
- name: zone
  type: Zone
  description: 确定当日边界所用的时区，默认使用全局配置的时区。
```

**返回值**

```returns
type: DateTimeRange[]
description: 在 `zone` 时区下覆盖全天的连续 `DateTimeRange` 切片数组。
```

```js
const halves = date('2026-11-16').split(12, 'hours', 'UTC');

halves.map(String);
// ['2026-11-16T00:00:00.000Z/2026-11-16T12:00:00.000Z', '2026-11-16T12:00:00.000Z/2026-11-17T00:00:00.000Z']
```
:::

## 格式化与转换

:::entry
### `format()` :kind[method]

```js signature
d.format(spec?, locale?): string
```

使用内置预设、通过 [`configure()`](/api/configure/) 注册的自定义名称、选项对象或占位符模板来格式化日期。

内置从 `'L'` 到 `'LLLL'` 的本地化预设，传入选项对象时会自动忽略时钟与时区相关的键。完整的预设与占位符列表请参阅[格式化](/guides/formatting/)。

**参数**

```params
- name: spec
  type: FormatSpec
  default: "'medium'"
  description: 内置或自定义的格式名称、`Intl` 选项对象，或占位符模板。
- name: locale
  type: string
  description: BCP 47 区域标签，仅对本次调用覆盖实例自带或全局配置的区域设置。
```

**返回值**

```returns
type: string
description: 格式化后的日期字符串。
```

```js
const day = date('2026-11-16');

day.format('short', 'en-US'); // '11/16/26'
day.format('medium', 'en-US'); // 'Nov 16, 2026'
day.format('long', 'en-US'); // 'November 16, 2026'
day.format('full', 'en-US'); // 'Monday, November 16, 2026'
day.format('L', 'en-US'); // '11/16/2026'
day.format('YYYY-MM-DD'); // '2026-11-16'
day.format('ddd, MMM D', 'en-US'); // 'Mon, Nov 16'
day.format({ weekday: 'long' }, 'en-US'); // 'Monday'
```
:::

:::entry
### `from()` :kind[method]

```js signature
d.from(other?, locale?): string
d.formatRelative(other?, locale?): string
```

通过 `Intl.RelativeTimeFormat` 将另一日期到当前日期的日历间隔格式化为本地化相对时间短语，例如 `'yesterday'` 或 `'in 3 weeks'`。

省略第一个参数时与 [`today()`](/api/date-fn/#today) 比较，并提供别名 [`formatRelative()`](#formatrelative)。相差不足 7 天时，昨天、今天和明天会输出自然语言词语；按周、月、年计则使用数字计数。

**参数**

```params
- name: other
  type: CalendarDateInput
  description: 作为基准的参考日历日期。默认使用当前时区的 `today()`。
- name: locale
  type: Locale
  description: BCP 47 区域标签，仅对本次调用覆盖实例自带或全局配置的区域设置。
```

**返回值**

```returns
type: string
description: 本地化的相对时间短语。
```

```js
const anchor = date('2026-11-16');

date('2026-11-15').from(anchor, 'en-US'); // 'yesterday'
date('2026-11-16').from(anchor, 'en-US'); // 'today'
date('2026-11-17').from(anchor, 'en-US'); // 'tomorrow'
date('2026-11-30').from(anchor, 'en-US'); // 'in 2 weeks'
date('2026-11-15').from(anchor, 'de'); // 'gestern'
```
:::

:::entry
### `fromNow()` :kind[method]

```js signature
d.fromNow(locale?): string
```

将当前日期距今天的间隔格式化为本地化相对时间短语，等价于不传参考日期调用 [`from()`](#from)。

**参数**

```params
- name: locale
  type: Locale
  description: BCP 47 区域标签，仅对本次调用覆盖实例自带或全局配置的区域设置。
```

**返回值**

```returns
type: string
description: 相对于今天的本地化相对时间短语。
```

```js
today().minus(1, 'day').fromNow('en-US'); // 'yesterday'
today().plus(3, 'days').fromNow('en-US'); // 'in 3 days'
```
:::

:::entry
### `formatRelative()` :kind[method]

```js signature
d.formatRelative(other?, locale?): string
```

[`from()`](#from) 的别名，将距 `other`（省略时距今天）的日历间隔格式化为本地化相对时间短语。
:::

:::entry
### `locale()` :kind[method]

```js signature
d.locale(): Locale | undefined
d.locale(tag): CalendarDate
```

读取此日期携带的区域标签，或返回一个副本，使其在预设格式、周边界及所有派生值中均采用新的区域设置。下划线分隔的标签与 `Accept-Language` 请求头会自动规范化，传入空标签可清除已绑定的区域设置，同时提供别名 [`lang()`](#lang)。

**参数**

```params
- name: tag
  type: Locale | null | undefined
  description: 要绑定并随派生值传递的区域标签、标签数组或 `Accept-Language` 请求头；传入 `null` 可清除已有标签。
```

**返回值**

```returns
type: CalendarDate | Locale | undefined
description: 无参调用时返回当前生效的区域标签；传入参数时返回携带 `tag` 的新 `CalendarDate` 实例。
```

```js
const trip = date('2026-05-15').locale('fr-FR');

trip.locale(); // 'fr-FR'
trip.format('long'); // '15 mai 2026'
trip.to('2026-05-19').format('long'); // '15–19 mai 2026'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
d.lang(): Locale | undefined
d.lang(tag): CalendarDate
```

[`locale()`](#locale) 的简写别名，用于读取或设置此日期的 BCP 47 区域标签。
:::

:::entry
### `as()` :kind[method]

```js signature
d.as('date'): CalendarDate
d.as('datetime', zone?): DateTime
d.as('yearMonth'): YearMonth
d.as('monthDay'): MonthDay
```

在链式调用中直接将此日期转换为其他类型，包括 [`YearMonth`](/api/year-month/) 和 [`MonthDay`](/api/month-day/)。转换为时间点时，返回该日期在指定或配置时区下的零点。

**参数**

```params
- name: kind
  type: "'date' | 'datetime' | 'yearMonth' | 'monthDay'"
  required: true
  description: 要转换的目标类型。
- name: zone
  type: Zone
  description: 转换为 `'datetime'` 时使用的时区，默认使用全局配置的时区。
```

**返回值**

```returns
type: CalendarDate | DateTime | YearMonth | MonthDay
description: 转换后的值。
```

```js
const due = date('2026-11-16');

due.as('datetime', 'UTC').toString(); // '2026-11-16T00:00:00.000Z'
due.as('yearMonth').toString(); // '2026-11'
due.as('monthDay').toString(); // '11-16'
```
:::

:::entry
### `toString()` :kind[method]

```js signature
d.toString(): string
d.toJSON(): string
```

返回该日期的 ISO 8601 `YYYY-MM-DD` 字符串。`toJSON()` 返回相同字符串，供 `JSON.stringify()` 调用。

**返回值**

```returns
type: string
description: ISO 8601 日期字符串，例如 `'2026-11-16'`。
```

```js
const due = date('2026-11-16');

due.toString(); // '2026-11-16'
JSON.stringify({ due }); // '{"due":"2026-11-16"}'
```
:::

:::entry
### `toJSDate()` :kind[method]

```js signature
d.toJSDate(zone?): Date
```

返回该日期在指定或配置时区下零点对应的原生 JavaScript `Date` 对象。
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
d.toTemporal(): Temporal.PlainDate
```

返回底层的 `Temporal.PlainDate` 实例。
:::

:::entry
### `valueOf()` :kind[method]

```js signature
d.valueOf(): never
```

抛出 `RangeError`，避免数值运算符将日历日期静默转换为数字。
:::
