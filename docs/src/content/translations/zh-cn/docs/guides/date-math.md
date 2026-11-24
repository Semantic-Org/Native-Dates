---
source: "ec38498f1427"
title: 日期运算
lede: 在不修改原值的前提下，完成时长加减、日历边界对齐以及按星期或范围步进。
---

Native Dates 中的所有日期、时钟时间和具体时刻都是不可变的。任何偏移或舍入方法都会返回新实例，原值保持不变。

## 加减运算

调用 [`plus()`](/api/date-time/#plus) 或 [`minus()`](/api/date-time/#minus) 向前或向后推移时间：

```js
import { date } from 'native-dates';

const created = date('2026-11-16');
const due = created.plus(2, 'weeks');

created.toString(); // '2026-11-16'
due.toString(); // '2026-11-30'
```

这两个方法均接受“数量 + 单位”、易读的英文短语、字段对象或 [`Duration`](/api/duration/) 实例。常用的 [`add()`](/api/date-time/#plus) 和 [`subtract()`](/api/date-time/#minus) 也可作为别名使用：

```js
import { datetime, hours } from 'native-dates';

const kickoff = datetime('2026-11-16T09:00', 'America/New_York');

kickoff.plus(2, 'weeks');
kickoff.plus('1h 30m');
kickoff.plus({ days: 2, hours: 4 });
kickoff.minus(hours(3));
```

:::tip[单位必须与类型匹配]
日历日期不含时钟时间，因此不接受小时等时钟单位；时钟时间会在午夜回绕，因此不接受天等日历单位。若运算同时涉及日期与时钟时间，请先用 [`at()`](/api/calendar-date/#at) 将两者合并。
:::

## 月末与夏令时

加减月份或年份时，结果会限制到目标月份的最后一天，而不会溢出到下个月。给 1 月 31 日加 1 个月会得到 2 月 28 日，闰年则得到 2 月 29 日：

```js
import { date } from 'native-dates';

date('2026-01-31').plus(1, 'month').toString(); // '2026-02-28'
date('2028-01-31').plus(1, 'month').toString(); // '2028-02-29'
```

对 [`DateTime`](/api/date-time/) 进行运算时，日历单位在跨越夏令时切换时会保持本地时钟时间不变，而时钟单位则严格按实际流逝的小时与分钟计算：

```js
import { datetime } from 'native-dates';

const saturday = datetime('2026-03-07T09:00', 'America/New_York');

saturday.plus(1, 'day').text; // 'Mar 8, 2026, 9:00 AM EDT'
saturday.plus(24, 'hours').text; // 'Mar 8, 2026, 10:00 AM EDT'
```

关于夏令时拨快与拨慢的详细行为，参阅[时区](/guides/time-zones/)。

## 对齐到单位边界

调用 [`startOf()`](/api/date-time/#startof) 和 [`endOf()`](/api/date-time/#endof) 可对齐到年、季度、月、周、日或时钟单位的起点与终点。

对于日历日期，月末即该月的最后一天；对于具体时刻，单位终点精确到最后一个毫秒：

```js
import { date, datetime } from 'native-dates';

const midMonth = date('2026-11-18');
midMonth.startOf('month').toString(); // '2026-11-01'
midMonth.endOf('month').toString(); // '2026-11-30'

const stamp = datetime('2026-11-18T14:20', 'UTC');
stamp.endOf('day').toString(); // '2026-11-18T23:59:59.999Z'
```

每周起始日默认跟随当前语言环境，例如 `'en-US'` 从周日开始，`'de-DE'` 从周一开始。你可以在单次调用时通过第二个参数指定星期几，也可以用 [`configure()`](/api/configure/) 设置全局覆盖：

```js
const wednesday = date('2026-11-18');

wednesday.locale('en-US').startOf('week').toString(); // '2026-11-15'
wednesday.locale('de-DE').startOf('week').toString(); // '2026-11-16'
wednesday.startOf('week', 'monday').toString(); // '2026-11-16'
```

调用 [`startOfNext()`](/api/date-time/#startofnext) 或 [`startOfPrevious()`](/api/date-time/#startofprevious) 可跳到下一个或上一个单位的起点。两者始终步进到相邻单位，因此在 12 月 1 日调用 `startOfNext('month')` 会返回次年 1 月 1 日：

```js
const invoiced = date('2026-11-16');

invoiced.startOfNext('month').toString(); // '2026-12-01'
invoiced.startOfNext('quarter').toString(); // '2027-01-01'
invoiced.startOfPrevious('month').toString(); // '2026-10-01'
```

## 舍入时钟时间

对具体时刻或时钟时间调用 [`round()`](/api/date-time/#round)，可舍入到最近的单位或指定步长，也可以按单一方向向上或向下取整：

```js
import { time } from 'native-dates';

const logged = time('9:23am');

logged.round('hour').format('short', 'en-US'); // '9:00 AM'
logged.round(15, 'minutes').format('short', 'en-US'); // '9:30 AM'
logged.floor(15, 'minutes').format('short', 'en-US'); // '9:15 AM'
logged.ceil(15, 'minutes').format('short', 'en-US'); // '9:30 AM'
```

步长（如 5、10、15 或 30 分钟）必须能整除上一级单位。

## 按星期或周期性日期步进

对日期或具体时刻调用 [`next()`](/api/calendar-date/#next) 或 [`previous()`](/api/calendar-date/#previous)，可跳转到下一个或最近的前一个指定星期几。如果当前日期本身就是该星期几，则会完整跨越 7 天：

```js
import { date } from 'native-dates';

const monday = date('2026-11-16');

monday.next('friday').toString(); // '2026-11-20'
monday.next('monday').toString(); // '2026-11-23'
monday.previous('friday').toString(); // '2026-11-13'
```

传入 [`MonthDay`](/api/month-day/) 即可直接跳转到生日或年度节假日的下一次或上一次出现日期：

```js
import { monthDay } from 'native-dates';

const birthday = monthDay('10/17');
monday.next(birthday).toString(); // '2027-10-17'
```

对具体时刻调用 `next()` 时会保留原有的时钟时间。如果你希望直接对齐到那一天的零点，请将星期名称传给 `startOfNext()`：

```js
import { datetime } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'America/New_York');

standup.next('wednesday').text; // 'Nov 18, 2026, 9:30 AM EST'
standup.startOfNext('wednesday').text; // 'Nov 18, 2026, 12:00 AM EST'
```

## 构建与步进范围

使用 [`dateRange()`](/api/range-fn/#daterange) 创建[范围](/guides/ranges/)，或从已有值出发链式调用 [`for()`](/api/ranges/#to) 与 [`to()`](/api/ranges/#to)。之后便可按步长遍历其中的节点，或将其拆分为更小的子范围：

```js
import { dateRange } from 'native-dates';

const sprint = dateRange('2026-11-02', '2 weeks');

sprint.end.toString(); // '2026-11-15'
sprint.every('week').map(String); // ['2026-11-02', '2026-11-09']
sprint.split(1, 'week').length; // 2
```
