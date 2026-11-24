---
source: "62b87452c7ee"
title: DateTime
lede: 带时区的具体时间点。
---

## 创建 DateTime

使用 [`datetime()`](/api/datetime-fn/) 从已有值创建实例，用 [`now()`](/api/datetime-fn/#now) 读取当前时间，或通过 [`at()`](/api/calendar-date/#at) 将日历日期与时钟时间组合。所有实例均不可变，任何修改方法都会返回一个新实例。

```js title="create.js"
import { date, datetime, now } from 'native-dates';

const fromUtc = datetime('2026-11-16T17:30:00Z', 'America/Los_Angeles');
const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
const current = now();
```

传入时区即可在该时区下查看该时间点；省略时区则使用 [`configure()`](/api/configure/) 配置的默认时区：

```js
const event = datetime('2026-11-16T17:30:00Z', 'America/New_York');
event.zone; // 'America/New_York'
event.hour; // 12
```

:::note[偏移量决定时间点，而非时区]
输入字符串末尾的 `Z` 或数字偏移量仅用于确定具体的绝对时间点，而实例本身使用你传入的时区或全局配置的默认时区。若希望按 UTC 读取字段和做日期运算，请显式传入 `'UTC'` 作为时区。
:::

## 属性

以下属性均按当前实例所在时区读取日期与时钟时间。

| 属性 | 类型 | 说明 |
|---|---|---|
| `text` | `string` | 按当前区域格式化的日期、时钟时间与短时区名，例如 `'Nov 16, 2026, 9:30 AM PST'`。 |
| `year`、`month`、`day` | `number` | 公历年份、月份（1–12）与日（1–31）。 |
| `hour`、`minute`、`second` | `number` | 24 小时制时钟字段（0–23、0–59、0–59）。 |
| `millisecond`、`microsecond`、`nanosecond` | `number` | 亚秒级时钟字段（0–999）。 |
| `zone` | `string` | 规范化的 IANA 时区标识或固定偏移量，例如 `'America/Los_Angeles'` 或 `'UTC'`。 |
| `offset` | `string` | 当前时间点生效的 UTC 偏移量，例如 `'-08:00'`。 |
| `epochSeconds` | `number` | 自 Unix 纪元以来的整秒数（向下取整）。 |
| `epochMilliseconds` | `number` | 自 Unix 纪元以来的毫秒数。 |
| `epochNanoseconds` | `bigint` | 自 Unix 纪元以来的精确纳秒数。 |
| `date` | [`CalendarDate`](/api/calendar-date/) | 该时区下的日历日期。 |
| `time` | [`Time`](/api/time/) | 该时区下的时钟时间。 |
| `yearMonth` | [`YearMonth`](/api/year-month/) | 该时区下的年月。 |
| `monthDay` | [`MonthDay`](/api/month-day/) | 该时区下的月日。 |
| `dayOfWeek` | `number` | ISO 星期几，从 1（周一）到 7（周日）。 |
| `weekStart` | `number` | 此时间点所在周的起始日（1–7），遵循 [`configure()`](/api/configure/) 或当前区域设置。 |
| `quarter` | `number` | 日历季度（1–4）。 |
| `weekOfYear`、`dayOfYear` | `number` | ISO 周数（1–53）与年中第几天（1–366）。 |
| `daysInMonth`、`daysInYear`、`hoursInDay` | `number` | 当前月份的天数、当年总天数以及该时区当天的实际小时数。 |

## 时区与字段

在另一时区下查看同一时间点，或替换单个日历或时钟字段。

:::entry
### `in()` :kind[method]

```js signature
dt.in(zone): DateTime
```

返回一个新的 `DateTime`，表示另一时区下的同一时间点。当地日历与时钟属性会随之更新为目标时区的值，底层时间戳保持不变。

**参数**

```params
- name: zone
  type: Zone
  required: true
  description: IANA 时区标识（如 `'Europe/Berlin'`）、固定 UTC 偏移量或 `'UTC'`。
```

**返回值**

```returns
type: DateTime
description: 在 `zone` 时区下查看同一时间点的新 `DateTime` 实例。
```

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
const berlin = standup.in('Europe/Berlin');

berlin.hour; // 18
berlin.equals(standup); // true
```
:::

:::entry
### `at()` :kind[method]

```js signature
dt.at(time): DateTime
```

返回同一天、同一时区下替换了时钟时间的新 `DateTime` 实例。

**参数**

```params
- name: time
  type: TimeInput
  required: true
  description: 时钟时间字符串（如 `'9:30am'`）、`Time` 实例、字段对象或 `Date`。
```

**返回值**

```returns
type: DateTime
description: 同一天内将时钟时间替换为 `time` 后的新 `DateTime` 实例。
```

```js
const morning = datetime('2026-11-16T09:30', 'America/Los_Angeles');
const wrapUp = morning.at('5:00pm');

wrapUp.hour; // 17
```
:::

:::entry
### `set()` :kind[method]

```js signature
dt.set(fields): DateTime
dt.set(unit, value): DateTime
```

返回在当前时区下替换了一个或多个日历或时钟字段的新 `DateTime`。超出有效范围的日期（如 2 月 30 日）会抛出 `RangeError`，不会进位到下个月。只更新 `month` 或 `year` 而未传入 `day` 时，若原有日期超出目标月份天数，会自动限制到目标月末。

**参数**

```params
- name: fields
  type: DateTimeFields | Unit
  required: true
  description: 包含日历或时钟字段的对象；若同时传入 `value`，则为单个单位名。
- name: value
  type: number
  description: 指定 `unit` 对应的整数值。
```

**返回值**

```returns
type: DateTime
description: 同一时区下更新字段后的新 `DateTime` 实例。
```

```js
const cutoff = datetime('2026-11-16T09:30', 'America/New_York');

cutoff.set('hour', 17);
cutoff.set({ month: 12, day: 1, hour: 0, minute: 0 });
```
:::

## 运算与舍入

增减天、周、月或年时，即便跨越夏令时切换，时钟时间也保持不变。增减小时、分钟或秒则按精确流逝时间计算。

:::entry
### `plus()` :kind[method]

```js signature
dt.plus(amount, unit?): DateTime
dt.add(amount, unit?): DateTime
```

增加一段时长，返回同一时区下的新 `DateTime`。同时提供别名 `add()`。

**参数**

```params
- name: amount
  type: DurationInput
  required: true
  description: 配合 `unit` 使用的数值、`Duration` 实例、时长字符串、字段对象或毫秒数。
- name: unit
  type: Unit
  description: 当 `amount` 为数字时的单位名，例如 `'days'` 或 `'hours'`。
```

**返回值**

```returns
type: DateTime
description: 同一时区下的新 `DateTime` 实例。
```

```js
// 纽约进入夏令时的周末（3 月 8 日只有 23 小时）
const sat = datetime('2026-03-07T09:00', 'America/New_York');

sat.plus(1, 'day').hour; // 9
sat.plus(24, 'hours').hour; // 10
sat.plus('1h 30m').format('time', 'en-US'); // '10:30 AM'
```
:::

:::entry
### `minus()` :kind[method]

```js signature
dt.minus(amount, unit?): DateTime
dt.subtract(amount, unit?): DateTime
```

在同一时区下减去一段时长。接受与 [`plus()`](#plus) 相同的参数，并提供别名 `subtract()`。

**参数**

```params
- name: amount
  type: DurationInput
  required: true
  description: 配合 `unit` 使用的数值、`Duration` 实例、时长短语、ISO 时长字符串或字段对象。
- name: unit
  type: Unit
  description: 当 `amount` 为数字时的单位名。
```

**返回值**

```returns
type: DateTime
description: 同一时区下的新 `DateTime` 实例。
```

```js
const deadline = datetime('2026-11-16T17:00', 'America/New_York');

deadline.minus(48, 'hours');
deadline.minus({ weeks: 1, days: 2 });
```
:::

:::entry
### `startOf()` :kind[method]

```js signature
dt.startOf(unit, firstDay?): DateTime
```

回退到当前时区下指定日历或时钟单位的起始点。周边界优先使用 `firstDay`，其次遵循 [`configure()`](/api/configure/) 配置的 `weekStart`，最后按该时间点当前的区域设置确定。

**参数**

```params
- name: unit
  type: Unit
  required: true
  description: 从 `'year'` 到 `'millisecond'` 的日历或时钟单位。
- name: firstDay
  type: DayOfWeek
  description: 按周对齐时的每周起始日，例如 `'sunday'` 或 `7`。
```

**返回值**

```returns
type: DateTime
description: 位于 `unit` 起始点的新 `DateTime` 实例。
```

```js
const wed = datetime('2026-11-18T14:45:12', 'America/New_York').locale('en-US');

wed.startOf('day').format('time'); // '12:00 AM'
wed.startOf('week').day; // 15
wed.startOf('week', 'monday').day; // 16
```
:::

:::entry
### `endOf()` :kind[method]

```js signature
dt.endOf(unit, firstDay?): DateTime
```

移动到当前时区下指定日历或时钟单位的最后一毫秒。

**参数**

```params
- name: unit
  type: Unit
  required: true
  description: 从 `'year'` 到 `'nanosecond'` 的日历或时钟单位。
- name: firstDay
  type: DayOfWeek
  description: 当 `unit` 为 `'week'` 时的每周起始日。
```

**返回值**

```returns
type: DateTime
description: 位于 `unit` 最后一毫秒的新 `DateTime` 实例。
```

```js
const nov = datetime('2026-11-18T14:45', 'UTC');

nov.endOf('month').toString(); // '2026-11-30T23:59:59.999Z'
```
:::

:::entry
### `startOfNext()` :kind[method]

```js signature
dt.startOfNext(unit, firstDay?): DateTime
```

在当前时区下前进到下一个日历或时钟单位的起始点。结果始终晚于当前时间点，因此从零点出发时，下一天会落在次日零点。

也可以传入星期名称代替单位，以获取下一个该星期几的零点；若需要保留当前时钟时间，请调用 [`next()`](#next)。

**参数**

```params
- name: unit
  type: Unit | Exclude<DayOfWeek, number>
  required: true
  description: 从 `'year'` 到 `'nanosecond'` 的日历或时钟单位，或星期名称（如 `'wednesday'`）。
- name: firstDay
  type: DayOfWeek
  description: 当 `unit` 为 `'week'` 时的每周起始日。
```

**返回值**

```returns
type: DateTime
description: 位于下一个 `unit` 起始点或下一个指定星期几零点的新 `DateTime` 实例。
```

```js
const standup = datetime('2026-11-16T09:30', 'America/New_York');

standup.startOfNext('month').text; // 'Dec 1, 2026, 12:00 AM EST'
standup.startOfNext('hour').text; // 'Nov 16, 2026, 10:00 AM EST'
standup.startOfNext('wednesday').text; // 'Nov 18, 2026, 12:00 AM EST'
standup.next('wednesday').text; // 'Nov 18, 2026, 9:30 AM EST'
```
:::

:::entry
### `startOfPrevious()` :kind[method]

```js signature
dt.startOfPrevious(unit, firstDay?): DateTime
```

在当前时区下回退到上一个日历或时钟单位的起始点。传入星期名称代替单位可获取上一个该星期几的零点，而 [`previous()`](#previous) 则会保留原时钟时间。

**参数**

```params
- name: unit
  type: Unit | Exclude<DayOfWeek, number>
  required: true
  description: 从 `'year'` 到 `'nanosecond'` 的日历或时钟单位，或星期名称（如 `'wednesday'`）。
- name: firstDay
  type: DayOfWeek
  description: 当 `unit` 为 `'week'` 时的每周起始日。
```

**返回值**

```returns
type: DateTime
description: 位于上一个 `unit` 起始点或上一个指定星期几零点的新 `DateTime` 实例。
```

```js
const standup = datetime('2026-11-16T09:30', 'America/New_York');

standup.startOfPrevious('day').text; // 'Nov 15, 2026, 12:00 AM EST'
standup.startOfPrevious('month').text; // 'Oct 1, 2026, 12:00 AM EDT'
standup.startOfPrevious('wednesday').text; // 'Nov 11, 2026, 12:00 AM EST'
```
:::

:::entry
### `next()` :kind[method]

```js signature
dt.next(target): DateTime
```

前进到下一个指定的星期几或 [`MonthDay`](/api/month-day/)，并保持相同的时钟时间。如果当前正好是该星期几或该年度日期，则跳到下一周期的对应日期。

**参数**

```params
- name: target
  type: DayOfWeek | MonthDay
  required: true
  description: 星期名称（如 `'friday'`）、1 到 7 的 ISO 星期数字，或周期性 `MonthDay`。
```

**返回值**

```returns
type: DateTime
description: 位于下一个匹配日期且保持当地时钟时间不变的新 `DateTime` 实例。
```

```js
import { datetime, monthDay } from 'native-dates';

const mon = datetime('2026-11-16T09:30', 'America/Los_Angeles');

mon.next('friday').day; // 20
mon.next('monday').day; // 23
mon.next(monthDay('12-25')).month; // 12
```
:::

:::entry
### `previous()` :kind[method]

```js signature
dt.previous(target): DateTime
```

回退到当前日期之前最近的一个指定星期几或 [`MonthDay`](/api/month-day/)，并保持相同的时钟时间。

**参数**

```params
- name: target
  type: DayOfWeek | MonthDay
  required: true
  description: 星期名称、三字母缩写、1 到 7 的 ISO 星期数字，或周期性 `MonthDay`。
```

**返回值**

```returns
type: DateTime
description: 位于上一个匹配日期且保持当地时钟时间不变的新 `DateTime` 实例。
```

```js
const mon = datetime('2026-11-16T09:30', 'America/Los_Angeles');

mon.previous('friday').day; // 13
mon.previous(monthDay('10-31')).month; // 10
```
:::

:::entry
### `round()` :kind[method]

```js signature
dt.round(unit): DateTime
dt.round(increment, unit): DateTime
```

舍入到最接近的单位或步长倍数，恰好居中时向上舍入。

**参数**

```params
- name: increment
  type: number | Unit
  required: true
  description: 能整除上一级单位的步长；当步长为 `1` 时直接传入目标 `unit`。
- name: unit
  type: Unit
  description: 要舍入的单位，从 `'day'` 到 `'nanosecond'`。
```

**返回值**

```returns
type: DateTime
description: 同一时区下舍入后的新 `DateTime` 实例。
```

```js
const stamp = datetime('2026-11-16T09:23:40', 'UTC');

stamp.round('hour').toString(); // '2026-11-16T09:00:00.000Z'
stamp.round(15, 'minutes').toString(); // '2026-11-16T09:30:00.000Z'
```
:::

:::entry
### `floor()` :kind[method]

```js signature
dt.floor(unit): DateTime
dt.floor(increment, unit): DateTime
```

向下舍入到指定单位或步长的起点。参数与 [`round()`](#round) 相同。

```js
datetime('2026-11-16T09:29:00Z').floor(15, 'minutes').toString(); // '2026-11-16T09:15:00.000Z'
```
:::

:::entry
### `ceil()` :kind[method]

```js signature
dt.ceil(unit): DateTime
dt.ceil(increment, unit): DateTime
```

向上舍入到下一个单位或步长。参数与 [`round()`](#round) 相同。

```js
datetime('2026-11-16T09:01:00Z').ceil(15, 'minutes').toString(); // '2026-11-16T09:15:00.000Z'
```
:::

## 比较时间点

比较操作始终按实际发生的绝对时间点进行，即使两个实例处于不同时区也一样。

:::warning[不要用 === 比较]
JavaScript 的 `===` 运算符只判断两个变量是否引用内存中的同一个对象。要判断两个 `DateTime` 实例是否表示同一时间点，请调用 [`equals()`](#equals)。
:::

:::entry
### `equals()` :kind[method]

```js signature
dt.equals(other): boolean
```

当两个值表示完全相同的绝对时间点时返回 `true`，不受各自时区影响。

**参数**

```params
- name: other
  type: DateTimeInput
  required: true
  description: 另一个 `DateTime` 实例，或任何可传入 `datetime()` 的输入。
```

**返回值**

```returns
type: boolean
description: 当两个值指向同一时间点时返回 `true`。
```

```js
const ny = datetime('2026-11-16T12:00', 'America/New_York');
const utc = datetime('2026-11-16T17:00Z', 'UTC');

ny.equals(utc); // true
```
:::

:::entry
### `isBefore()` :kind[method]

```js signature
dt.isBefore(other): boolean
```

如果当前时间点早于另一个时间点，则返回 `true`。

```js
datetime('2026-11-16T16:59Z').isBefore('2026-11-16T17:00Z'); // true
```
:::

:::entry
### `isAfter()` :kind[method]

```js signature
dt.isAfter(other): boolean
```

如果当前时间点晚于另一个时间点，则返回 `true`。

```js
datetime('2026-11-16T17:01Z').isAfter('2026-11-16T17:00Z'); // true
```
:::

:::entry
### `isSame()` :kind[method]

```js signature
dt.isSame(other, unit?, firstDay?): boolean
```

在当前实例所在时区下查看两个时间点，判断它们是否落在同一个日历或时钟单位内。不传 `unit` 时检查绝对时间点是否完全相等。

**参数**

```params
- name: other
  type: DateTimeInput
  required: true
  description: 用于比较的目标时间点，将按当前实例所在时区解读。
- name: unit
  type: Unit
  description: 用于比较的日历或时钟单位，例如 `'day'` 或 `'month'`。
- name: firstDay
  type: DayOfWeek
  description: 当 `unit` 为 `'week'` 时的每周起始日。
```

**返回值**

```returns
type: boolean
description: 当两个时间点在当前时区下属于同一 `unit` 时返回 `true`。
```

```js
const la = datetime('2026-11-16T09:30', 'America/Los_Angeles');
const lateUtc = datetime('2026-11-17T02:00Z', 'UTC');

la.isSame(lateUtc, 'day'); // true（洛杉矶时间 11 月 16 日下午 6:00）
lateUtc.isSame(la, 'day'); // false（UTC 时间 11 月 17 日与 11 月 16 日）
```
:::

### 日历判断

以下无参方法均在当前实例所在时区下计算：

| 方法 | 类型 | 说明 |
|---|---|---|
| `isPast()`、`isFuture()` | `boolean` | 该时间点是否早于或晚于当前时间。 |
| `isToday()`、`isTomorrow()`、`isYesterday()` | `boolean` | 该时区下的当地日历日期是否为今天、明天或昨天。 |
| `isWeekday()`、`isWeekend()` | `boolean` | 按当前区域设置是否为工作日或周末，例如 `en-US` 的周六、周日，或 `ar-SA` 的周五、周六。 |
| `isLeapYear()` | `boolean` | 当地年份是否为闰年。 |

## 度量时间

:::entry
### `until()` :kind[method]

```js signature
dt.until(other): Duration
dt.until(other, unit): number
```

度量从当前时间点到另一个时间点之间的时间跨度；若目标更早则返回负时长。传入单位名可直接获取换算后的单个数值，而非 [`Duration`](/api/duration/) 实例。

**参数**

```params
- name: other
  type: DateTimeInput
  required: true
  description: 作为终点的目标时间点。
- name: unit
  type: Unit
  description: 单位名，指定后将以浮点数返回换算后的总长度。
```

**返回值**

```returns
type: Duration | number
description: 按天与时钟单位计数的 `Duration` 实例；若传入 `unit` 则返回数值。
```

```js
const doors = datetime('2026-11-16T08:00', 'America/Los_Angeles');
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

doors.until(standup).format('long', 'en-US'); // '1 hour, 30 minutes'
doors.until(standup, 'hours'); // 1.5
```
:::

:::entry
### `since()` :kind[method]

```js signature
dt.since(other): Duration
dt.since(other, unit): number
```

度量自较早时间点以来经过的时间。传入单位名可直接返回总计数值。

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.since('2026-11-16T08:00', 'minutes'); // 90
```
:::

:::entry
### `to()` :kind[method]

```js signature
dt.to(end): DateTimeRange
dt.to(count, unit): DateTimeRange
dt.for(length): DateTimeRange
dt.for(count, unit): DateTimeRange
```

创建一个半开区间的 [`DateTimeRange`](/api/ranges/#datetimerange)，从当前时间点开始，至目标时间点结束（不含终点），或延续指定时长。若结束点早于起点，会抛出 `RangeError`。使用 `for()` 可显式传入时长（不接受端点值或无单位数字）。

**参数**

```params
- name: end
  type: DateTimeInput | DurationInput | number
  required: true
  description: 结束时间点、时长，或与 `unit` 配对的数值 `count`。
- name: unit
  type: Unit
  description: 当第一个参数为数值计数时的单位名，例如 `'hours'` 或 `'days'`。
```

**返回值**

```returns
type: DateTimeRange
description: 位于当前实例所在时区的半开 `DateTimeRange` 区间。
```

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.to('2026-11-16T10:00').duration.minutes; // 30
standup.for(2, 'hours').end.hour; // 11
```
:::

:::entry
### `range()` :kind[method]

```js signature
dt.range(unit, firstDay?): DateTimeRange
```

返回包含当前时间点的整个日历或时钟单位对应的半开 [`DateTimeRange`](/api/ranges/#datetimerange)，起点为该单位起始点，终点为下一单位起始点（不含终点）。

**参数**

```params
- name: unit
  type: Unit
  required: true
  description: 从 `'year'` 到 `'nanosecond'` 的日历或时钟单位。
- name: firstDay
  type: DayOfWeek
  description: 当 `unit` 为 `'week'` 时的每周起始日。
```

**返回值**

```returns
type: DateTimeRange
description: 当前时区下覆盖整个 `unit` 的半开 `DateTimeRange` 区间。
```

```js
const event = datetime('2026-11-16T14:45', 'UTC');

event.range('day').toString();
// '2026-11-16T00:00:00.000Z/2026-11-17T00:00:00.000Z'
```
:::

## 格式化与转换

:::entry
### `format()` :kind[method]

```js signature
dt.format(spec?, locale?): string
```

在当前生效时区下，使用内置预设、通过 [`configure()`](/api/configure/) 注册的自定义名称、`Intl` 选项对象或占位符模板来格式化日期与时钟时间。

内置从 `'LT'` 到 `'llll'` 的本地化预设，并支持用方括号（`[...]`）包裹字面文本。完整的预设与占位符列表请参阅[格式化](/guides/formatting/)。

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
description: 按实例所在时区格式化后的字符串。
```

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.format('medium', 'en-US'); // 'Nov 16, 2026, 9:30 AM'
standup.format('full', 'en-US'); // 'Monday, November 16, 2026 at 9:30 AM'
standup.format('LLL', 'en-US'); // 'November 16, 2026 at 9:30 AM'
standup.format('text', 'en-US'); // 'Nov 16, 2026, 9:30 AM PST'
standup.format('YYYY-MM-DD HH:mm'); // '2026-11-16 09:30'
standup.format('MMM D [at] h:mm a', 'en-US'); // 'Nov 16 at 9:30 am'
standup.format(
  { weekday: 'short', hour: '2-digit', minute: '2-digit' },
  'de-DE',
); // 'Mo., 09:30'
```
:::

:::entry
### `from()` :kind[method]

```js signature
dt.from(other?, locale?): string
dt.formatRelative(other?, locale?): string
```

通过 `Intl.RelativeTimeFormat` 将另一时间点到当前时间点之间的时间差格式化为本地化相对时间短语，例如 `'3 hours ago'` 或 `'in 2 days'`。

省略第一个参数时与当前时间比较，并提供别名 [`formatRelative()`](#formatrelative)。相差零秒时输出 `'now'`；天、月、年均采用数字计数，而非“昨天”这类日历词语。

**参数**

```params
- name: other
  type: DateTimeInput
  description: 作为基准的参考时间点；若不含时区则按当前实例的时区解读。默认使用当前时间。
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
const anchor = datetime('2026-11-16T12:00', 'UTC');

anchor.from(anchor, 'en-US'); // 'now'
anchor.minus(3, 'hours').from(anchor, 'en-US'); // '3 hours ago'
anchor.minus(23, 'hours').from(anchor, 'en-US'); // '1 day ago'
anchor.plus(45, 'minutes').from(anchor, 'en-US'); // 'in 1 hour'
anchor.minus(3, 'hours').from(anchor, 'es'); // 'hace 3 horas'
```
:::

:::entry
### `fromNow()` :kind[method]

```js signature
dt.fromNow(locale?): string
```

将当前时间点距此刻的时间差格式化为本地化相对时间短语，等价于不传参考时间点调用 [`from()`](#from)。

**参数**

```params
- name: locale
  type: Locale
  description: BCP 47 区域标签，仅对本次调用覆盖实例自带或全局配置的区域设置。
```

**返回值**

```returns
type: string
description: 相对于当前时间的本地化相对时间短语。
```

```js
now().minus(5, 'minutes').fromNow('en-US'); // '5 minutes ago'
now().plus(2, 'hours').fromNow('en-US'); // 'in 2 hours'
```
:::

:::entry
### `formatRelative()` :kind[method]

```js signature
dt.formatRelative(other?, locale?): string
```

[`from()`](#from) 的别名，将距 `other`（省略时距此刻）的时间差格式化为本地化相对时间短语。
:::

:::entry
### `locale()` :kind[method]

```js signature
dt.locale(): Locale | undefined
dt.locale(tag): DateTime
```

读取此时间点携带的区域标签，或返回一个副本，使其在预设格式、周边界及所有派生值中均采用新的区域设置。下划线分隔的标签与 `Accept-Language` 请求头会自动规范化，传入空标签可清除已绑定的区域设置，同时提供别名 [`lang()`](#lang)。

**参数**

```params
- name: tag
  type: Locale | null | undefined
  description: 要绑定并随派生值传递的区域标签、标签数组或 `Accept-Language` 请求头；传入 `null` 可清除已有标签。
```

**返回值**

```returns
type: DateTime | Locale | undefined
description: 无参调用时返回当前生效的区域标签；传入参数时返回携带 `tag` 的新 `DateTime` 实例。
```

```js
const standup = datetime('2026-11-16T09:30', 'Europe/Berlin').locale('es-ES');

standup.locale(); // 'es-ES'
standup.plus(1, 'week').date.format('long'); // '23 de noviembre de 2026'
standup.locale(null).locale(); // undefined
```
:::

:::entry
### `lang()` :kind[method]

```js signature
dt.lang(): Locale | undefined
dt.lang(tag): DateTime
```

[`locale()`](#locale) 的简写别名，用于读取或设置此时间点的 BCP 47 区域标签。
:::

:::entry
### `as()` :kind[method]

```js signature
dt.as('datetime'): DateTime
dt.as('date'): CalendarDate
dt.as('time'): Time
dt.as('yearMonth'): YearMonth
dt.as('monthDay'): MonthDay
```

在链式调用中直接将此时间点转换为其他类型，无需中断去访问属性，包括按当前生效时区提取 [`YearMonth`](/api/year-month/) 和 [`MonthDay`](/api/month-day/)。

**参数**

```params
- name: kind
  type: "'datetime' | 'date' | 'time' | 'yearMonth' | 'monthDay'"
  required: true
  description: 要在当前时区下转换的目标类型。
```

**返回值**

```returns
type: DateTime | CalendarDate | Time | YearMonth | MonthDay
description: 按当前实例时区转换后的值。
```

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.in('Asia/Tokyo').as('date').toString(); // '2026-11-17'
standup.in('Asia/Tokyo').as('time').toString(); // '02:30:00'
standup.as('yearMonth').toString(); // '2026-11'
standup.as('monthDay').toString(); // '11-16'
```
:::

:::entry
### `toString()` :kind[method]

```js signature
dt.toString(): string
dt.toJSON(): string
```

返回该时间点的 UTC ISO 8601 字符串，适合存入数据库、URL 和网络报文。`toJSON()` 返回相同字符串，供 `JSON.stringify()` 调用。

**返回值**

```returns
type: string
description: UTC ISO 8601 时间戳，例如 `'2026-11-16T17:30:00.000Z'`。
```

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.toString(); // '2026-11-16T17:30:00.000Z'
JSON.stringify({ standup }); // '{"standup":"2026-11-16T17:30:00.000Z"}'
```
:::

:::entry
### `toJSDate()` :kind[method]

```js signature
dt.toJSDate(): Date
```

返回表示同一时间点的原生 JavaScript `Date` 对象。
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
dt.toTemporal(): Temporal.ZonedDateTime
```

返回底层的 `Temporal.ZonedDateTime` 实例。
:::

:::entry
### `valueOf()` :kind[method]

```js signature
dt.valueOf(): number
```

返回纪元毫秒数，使两个 `DateTime` 实例可以直接相减或用数值运算符比较。
:::
