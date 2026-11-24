---
source: "d8be401b7194"
title: 时长
lede: 用单位辅助函数或英文短语创建时长，并计算或格式化时间间隔。
---

[`Duration`](/api/duration/) 表示一段时长，例如 90 分钟或 2 周。你可以直接创建它用于日期运算，也可以在计算两个值的间隔时自动得到它。

## 创建 Duration

通过 [`hours()`](/api/duration-fn/#hours) 等单位辅助函数创建时长，或将易读的英文短语、ISO 8601 字符串、字段对象传入 [`duration()`](/api/duration-fn/)：

```js
import { days, duration, hours } from 'native-dates';

const call = hours(1.5);
const trial = days(14);
const turnaround = duration('2 weeks, 3 days');
const iso = duration('PT1H30M');
const window = duration({ hours: 2, minutes: 45 });
```

可以直接读取实例上各单位的数值。小数输入会自动折算到下一级更小单位，而整数会保留在原单位中：

```js
call.hours; // 1
call.minutes; // 30

const ninety = duration(90, 'minutes');
ninety.hours; // 0
ninety.minutes; // 90
```

## 计算两个值的间隔

对两个日期、时钟时间、[`YearMonth`](/api/year-month/) 或具体时刻调用 [`until()`](/api/date-time/#until) 或 [`since()`](/api/date-time/#since)，即可计算它们之间的时长：

```js
import { datetime } from 'native-dates';

const opened = datetime('2026-11-16T08:00', 'America/Los_Angeles');
const resolved = datetime('2026-11-16T10:30', 'America/Los_Angeles');

const elapsed = opened.until(resolved);
elapsed.hours; // 2
elapsed.minutes; // 30
```

如果数值计算或进度条只需要单个数字，把目标单位作为第二个参数传入即可：

```js
opened.until(resolved, 'hours'); // 2.5
resolved.since(opened, 'minutes'); // 150
```

每个[范围](/api/ranges/)也都直接提供 `.duration` 属性：

```js
import { dateRange, timeRange } from 'native-dates';

dateRange('2026-11-01', '2026-11-07').duration.days; // 7
timeRange('9:00am', '5:30pm').duration.hours; // 8
```

## 单位归整与总计换算

除非显式指定，数值都会保留在最初写入的单位中。调用 [`balance()`](/api/duration/#balance) 可将超出部分进位到更大的单位：

```js
import { hours, minutes, months } from 'native-dates';

minutes(90).balance().toFields(); // { hours: 1, minutes: 30 }
months(18).balance().toFields(); // { years: 1, months: 6 }
hours(36).balance('day').toFields(); // { days: 1, hours: 12 }
```

不传参数时，独立时长会将月进位到年，并将时钟单位向上进位到小时，但不改动天字段，以避免跨越夏令时边界时出现偏差。

如果你需要按固定的 24 小时一天或 7 天一周进行换算，传入 `'day'` 或 `'week'` 即可。

调用 [`total()`](/api/duration/#total) 或其别名 [`as()`](/api/duration/#as)，可将整段时长折算为单一单位的浮点数：

```js
import { duration } from 'native-dates';

const shift = duration('7h 30m');

shift.total('hours'); // 7.5
shift.as('minutes'); // 450
```

:::note[按月和按年统计总时长]
年和月可直接按 1 年 12 个月互相换算与进位。天与月之间的换算依赖具体的日历日期，而通过 `until()` 和 `since()` 算出的时长会自动记住参考日期。
:::

```js
import { date, months } from 'native-dates';

months(18).total('years'); // 1.5

const span = date('2026-01-15').until('2026-04-15');
span.total('months'); // 3
span.total('days'); // 90
```

## 格式化时长

每个实例的 `.text` 属性都默认输出当前语言环境下的完整长格式。调用 [`format()`](/api/duration/#format) 并传入预设风格，可输出完整词、缩写、紧凑格式或电子表数字格式：

```js
import { duration } from 'native-dates';

const flight = duration({ hours: 2, minutes: 30 });

flight.text; // '2 hours, 30 minutes'
flight.format('long', 'en-US'); // '2 hours, 30 minutes'
flight.format('short', 'en-US'); // '2 hr, 30 min'
flight.format('narrow', 'en-US'); // '2h 30m'
flight.format('digital', 'en-US'); // '2:30:00'
```

将语言标签作为第二个参数传入即可切换单位文本的语言；若要生成用于 API 载荷的 ISO 8601 字符串，请调用 [`toString()`](/api/duration/#tostring)。
