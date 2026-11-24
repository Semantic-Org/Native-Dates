---
source: "3f7711941af9"
title: 从 Day.js 迁移
lede: 用专用的日期与时间类型和内置时区替代 dayjs() 包装对象与插件链。
---

Day.js 用单一的 `dayjs()` 对象封装 JavaScript `Date`，再通过插件补齐时区、UTC、范围和时长功能。迁移到 Native Dates 后，你可以保留同样轻量、不可变的写法，同时在核心库里直接拥有日历日期、时钟时间、具体时刻、部分日期、范围与时长等各自独立的专用类型。

## 选用 date() 还是 datetime()

在 Day.js 中，无论是生日还是接口时间戳，都统一用 `dayjs()` 包装。

在 Native Dates 中，日历日期使用 [`date()`](/api/date-fn/) 或 [`today()`](/api/date-fn/#today)，而[账单月份](/api/year-month-fn/)和[周期性生日](/api/month-day-fn/)则有核心库自带的部分日期工厂函数。

表示具体时间点时，使用 [`datetime()`](/api/datetime-fn/) 或 [`now()`](/api/datetime-fn/#now)：

```js
import { date, datetime, monthDay, now, today, yearMonth } from 'native-dates';

const current = now(); // 替代 dayjs() 获取时间戳
const due = today().plus(2, 'weeks'); // 替代 dayjs().add(2, 'week') 计算日历日期
const created = datetime('2026-11-16T17:30:00Z');
const birthday = date('2026-05-10');
const billing = yearMonth('2026-11');
const recurring = monthDay('05-10');
```

如果你的代码库已经在用标准的加减方法名，内置别名也能直接兼容。向工厂函数传入空值时会直接抛出错误，而不会静默返回当前时间，有助于尽早发现缺失的接口字段。

## 月份从 1 开始计数

Day.js 沿用了从 0 开始计数的月份编号（1 月为 0），并通过 `.date()` 读取当月第几天。在这里，所有日历字段都是直接可读的属性，月份从 1 到 12 计数。

```js
import { date } from 'native-dates';

const d = date('2026-11-16');

d.year; // 2026
d.month; // 11，即 11 月
d.day; // 16
d.dayOfWeek; // 1，即周一
```

:::warning[留意月份与星期的数字编号]
Day.js 的月份编号为 0 到 11，星期从周日 0 开始。在 Native Dates 中，`month` 取值 1 到 12，`dayOfWeek` 按 ISO 标准从周一 1 到周日 7。在占位符模板中，`'E'` 输出 ISO 的 1 到 7，而 `'d'` 保留了 Day.js 的 0 到 6 习惯。
:::

## 内置时区、时长与范围

在 Day.js 中，跨城市转换时区、构建时长或判断日期是否落在时间窗口内，都必须分别加载插件。Native Dates 核心库原生包含 IANA 时区、[时长](/api/duration/)和[范围](/api/ranges/)，无需任何额外配置。

```js
import { dateRange, datetime, duration, hours } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
const berlin = standup.in('Europe/Berlin'); // 替代 .tz('Europe/Berlin')

const span = duration('1h 30m').plus(hours(0.5));
span.total('minutes'); // 120

const november = dateRange('2026-11-01', '2026-11-30');
november.contains('2026-11-16'); // true
dateRange('2026-11-01', '2026-11-15').overlaps(november); // true
```

你不再需要给 `isBetween()` 传入方括号开闭区间字符串：日期范围自动包含首尾两天，而日期时间范围与时钟时间范围自动排除结束边界。

## 预设格式与占位符模板

核心库的 [`format()`](/api/date-time/#format) 直接支持 `Intl` 预设、Day.js 风格的本地化预设名以及自定义[占位符模板](/guides/formatting/#token-patterns)，无需引入任何语言包或插件：

```js
import { datetime } from 'native-dates';

const dt = datetime('2026-11-16T17:30:00Z', 'America/New_York');

dt.format('medium', 'en-US'); // 'Nov 16, 2026, 12:30 PM'
dt.format('LLL', 'en-US'); // 'November 16, 2026 at 12:30 PM'
dt.format('YYYY-MM-DD HH:mm'); // '2026-11-16 12:30'
```

## 按需引入的插件

只有非 ISO 文本解析、城市与时区缩写查询以及旧版 `Date` 读取方法放在 [`@native-dates/plugins`](/plugins/) 中。在应用启动时按子路径导入一次即可：

```js
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { date, datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'Berlin').zone; // 'Europe/Berlin'
date('Nov 16, 2026', { loose: true }); // CalendarDate(2026-11-16)
```

## 常用 API 对照表

| Day.js | Native Dates | 说明 |
|---|---|---|
| `dayjs()` | `now()` 或 `today()` | 按需选用具体时刻或日历日期 |
| `d.month()`、`d.date()` | `d.month`、`d.day` | 直接属性访问，月份从 1 到 12 |
| `d.day()`、`d.isoWeekday()` | `d.dayOfWeek` | ISO 编号（周一 1 至周日 7）；模板中 `'E'` 为 1–7，`'d'` 为 0–6 |
| `d.unix()`、`d.valueOf()` | `dt.epochSeconds`、`dt.epochMilliseconds` | 自 1970 年起的计数，属性名明确标出单位 |
| `d.add(2, 'day')` | `d.plus(2, 'days')` | 同样兼容 `add()` 和 `subtract()` 别名 |
| `dayjs.tz(x, zone)` | `datetime(x, zone)` | 核心库内置，无需 `timezone` 插件 |
| `d.tz(zone)` | `dt.in(zone)` | 将同一时刻转换到另一个 IANA 时区查看 |
| `dayjs.utc(x)` | `datetime(x, 'UTC')` | 核心库内置，无需 `utc` 插件 |
| `b.diff(a, 'day', true)` | `a.until(b, 'days')` | 返回按指定单位换算的带小数总量 |
| `dayjs.duration(90, 'm')` | `minutes(90)` 或 `duration('90m')` | 核心库内置，无需 `duration` 插件 |
| `d.format('LLL')` | `dt.format('LLL')` | 支持 `'LT'` 至 `'llll'` 本地化预设 |
| `d.format('YYYY-MM-DD HH:mm')` | `dt.format('YYYY-MM-DD HH:mm')` | 核心库内置[占位符模板](/guides/formatting/#token-patterns) |
| `d.isBetween(a, b)` | `dateRange(a, b).contains(d)` | 支持 `to()`、`for()` 和 `overlaps()` 的[范围](/api/ranges/) |
| `d.fromNow()`、`d.from(other)` | `d.fromNow()`、`d.from(other)` | 核心库内置，无需 `relativeTime` 插件 |
| `customParseFormat` | `{ format }` 或 `{ loose: true }` | 固定模板由 [`@native-dates/plugins/parse`](/plugins/parse/) 提供，自由格式输入由 [`@native-dates/plugins/loose`](/plugins/loose/) 提供 |
