---
source: "8bfe5a8d41c8"
title: 时间类型
lede: 为日历日期、时钟时间、具体时刻、部分日期、范围与时长选用最合适的类型。
---

JavaScript 内置的 `Date` 用同一个对象表示所有时间概念，不管是某人的生日、上午 9:30 的闹钟，还是订单落库的具体那一秒。

每种概念都有对应的独立类型，让你只处理真正需要的字段：

- **[`CalendarDate`](/api/calendar-date/)**：日历上的某一天，如 2026 年 5 月 10 日
- **[`Time`](/api/time/)**：一天中的时钟时间，如上午 9:30
- **[`DateTime`](/api/date-time/)**：某个时区下的具体时刻
- **[`Duration`](/api/duration/)**：一段时长，如 2 小时或 3 周
- **[`YearMonth`](/api/year-month/)** 与 **[`MonthDay`](/api/month-day/)**：不含“日”的年月，或不含“年”的周期性月日
- **[范围](/api/ranges/)**：两个日期、时钟时间或具体时刻之间的区间

## CalendarDate

当事件按“天”发生而非精确到某一秒时，使用 [`CalendarDate`](/api/calendar-date/)，例如生日、截止日期、节假日或日期选择器的值。

通过 [`today()`](/api/date-fn/#today) 或 [`date()`](/api/date-fn/) 创建：

```js
import { date, today } from 'native-dates';

const birthday = date('2026-05-10');
const due = today().plus(2, 'weeks');

birthday.month; // 5
birthday.day; // 10
```

由于日历日期不含时钟时间也没有时区，无论用户身在何处，5 月 10 日始终是 5 月 10 日。

## Time

当时间不绑定到特定日期时，使用 [`Time`](/api/time/)，例如门店营业时间或每日定时提醒。

```js
import { time } from 'native-dates';

const opens = time('9:00am');
const closes = opens.plus(8, 'hours');

closes.hour; // 17
closes.format('short', 'en-US'); // '5:00 PM'
```

时钟时间本身不含日期，加减小时跨过午夜后会按 24 小时制自然回绕，不会触发跨日进位。

## DateTime

当事件发生在真实时间轴上的某个具体点时，使用 [`DateTime`](/api/date-time/)，例如会议、航班起飞时间或数据库时间戳。

通过 [`now()`](/api/datetime-fn/#now) 或 [`datetime()`](/api/datetime-fn/) 创建，也可以给日历日期附加一个时钟时间：

```js
import { date, datetime, now } from 'native-dates';

const current = now();
const created = datetime('2026-11-16T17:30:00Z');
const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
```

每个具体时刻都同时记录了发生的时间点和当前查看所用的时区。调用 [`in()`](/api/date-time/#in) 可在其他城市时区下查看同一时刻：

```js
standup.in('Europe/Berlin').format('time', 'en-US'); // '6:30 PM'
```

## Duration

需要表示一段时长时，使用 [`Duration`](/api/duration/)。可以通过 [`hours()`](/api/duration-fn/#hours) 等单位辅助函数创建，也可以把英文时长短语传入 [`duration()`](/api/duration-fn/)：

```js
import { days, duration, hours } from 'native-dates';

const call = hours(1.5);
const trial = days(14);
const turnaround = duration('2 weeks, 3 days');
```

计算两个值之间的时间差时，返回的同样是时长：

```js
const opens = time('9:00am');
const lunch = time('12:30pm');

opens.until(lunch).format('long', 'en-US'); // '3 hours, 30 minutes'
```

## YearMonth

当值只有年份和月份、不含具体日期时，使用 [`YearMonth`](/guides/months-and-days/#billing-months-and-card-expiries)，例如账单周期、银行卡有效期或月份输入框的值。

```js
import { monthYear, yearMonth } from 'native-dates';

const billing = yearMonth('2026-11');
const expiry = monthYear('11/28');

billing.daysInMonth; // 30
billing.on(15); // 2026-11-15 对应的 CalendarDate
```

它以月和年为单位进行运算，调用 [`on()`](/api/year-month/#on) 可选定该月内的任意一天，得到对应的日历日期。

## MonthDay

表示不带年份的周期性日期（如生日或年度节假日）时，使用 [`MonthDay`](/guides/months-and-days/#birthdays-and-annual-holidays)。

```js
import { monthDay } from 'native-dates';

const birthday = monthDay('10/17');

birthday.in(2026); // 2026-10-17 对应的 CalendarDate
birthday.fallsOn('2026-10-17'); // true
```

调用 [`fallsOn()`](/api/month-day/#fallson) 或 [`in()`](/api/month-day/#in) 时，2 月 29 日在平年会自动落到 2 月 28 日。

## 范围

表示两个日期、时钟时间或具体时刻之间的区间时，使用[范围](/guides/ranges/)。可通过 [`dateRange()`](/api/range-fn/#daterange)、[`timeRange()`](/api/range-fn/#timerange) 或 [`datetimeRange()`](/api/range-fn/#datetimerange) 直接创建：

```js
import { dateRange, timeRange } from 'native-dates';

const sprint = dateRange('2026-11-02', '2026-11-15');
const shift = timeRange('9:00am', '5:00pm');

sprint.contains('2026-11-10'); // true
shift.duration.hours; // 8
```

日期范围包含结束当天，而日期时间范围与时钟时间范围采用左闭右开（不含结束边界），从而确保首尾相接的时段不会重叠。

## 在类型之间转换

补全或剥离字段即可在各类型间直接转换。对日历日期调用 [`at()`](/api/calendar-date/#at) 附加时钟时间，即可得到具体时刻；从已有值出发调用 [`for()`](/api/ranges/#to) 或 [`to()`](/api/ranges/#to)，则可向外延展为范围：

```js
const reminder = today().plus(1, 'day').at('9:00am');
const upcoming = today().for(2, 'weeks');
```

反向转换同样直接：你可以直接读取具体时刻或日期上的各字段属性，或在链式调用中使用 [`as()`](/api/date-time/#as)：

```js
reminder.date; // 明天的 CalendarDate
reminder.time; // 09:00:00 对应的 Time
reminder.yearMonth; // YearMonth
reminder.monthDay; // MonthDay
reminder.in('Asia/Tokyo').as('time'); // 东京时区的 Time
```

:::tip[选 DateTime 还是 CalendarDate？]
判断标准很简单：切换时区时，用户看到的内容是否应该跟着变化？洛杉矶上午 9:30 的会议在柏林是下午 6:30，应使用 `DateTime`；5 月 10 日的生日在世界各地都是 5 月 10 日，应使用 `CalendarDate`。
:::
