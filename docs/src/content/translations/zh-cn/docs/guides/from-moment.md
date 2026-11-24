---
source: "f7719b9dc227"
title: 从 Moment 迁移
lede: 告别 Moment 与 moment-timezone，转向不可变值类型、内置占位符模板与零打包时区数据。
---

Moment 和 `moment-timezone` 多年来一直承担着 JavaScript 的日期处理工作，但代价是可变对象、从 0 开始计数的月份以及体积庞大的时区数据包。

迁移到 Native Dates 后，可以省去所有防御性拷贝并甩掉打包体积负担，同时支持在大型代码库中逐个模块渐进替换。

## 所有值均不可变

在 Moment 中，加减天数或切换到月初都会原地修改原实例。把共享日期传给辅助函数时，只要任何一处忘了先克隆，就会悄悄破坏调用方的状态。

Native Dates 中的所有值均不可变。[`plus()`](/api/date-time/#plus) 和 [`in()`](/api/date-time/#in) 等方法始终返回新实例，绝不改动原值。

```js
import { date } from 'native-dates';

const start = date('2026-11-16');
const deadline = start.plus(7, 'days');

start.toString(); // '2026-11-16'
deadline.toString(); // '2026-11-23'
```

:::tip[移除防御性的 clone 调用]
迁移过程中可以删掉所有 `.clone()` 调用。内置也提供了不可变版本的 `add()` 和 `subtract()` 别名，原有加减调用点可继续使用。
:::

## 专用类型与从 1 开始的月份

Moment 将所有时间概念揉进同一个类，且月份从 0 到 11 计数（10 代表 11 月）。在这里，`month` 是直接可读的属性，取值从 1 到 12。

用 [`date()`](/api/date-fn/) 表示日历日期，用 [`datetime()`](/api/datetime-fn/) 表示带时区的具体时刻，并用核心工厂函数处理[时钟时间](/api/time-fn/)、[账单月份](/api/year-month-fn/)与[周期性生日](/api/month-day-fn/)：

```js
import { date, datetime, monthDay, yearMonth } from 'native-dates';

const invoiceDate = date(2026, 11, 16);
invoiceDate.month; // 11，即 11 月

const sentAt = datetime('2026-11-16T17:30:00Z', 'America/New_York');
sentAt.hour; // 12

const billing = yearMonth('2026-11');
const birthday = monthDay('10/17');
```

## 零打包时区数据

`moment-timezone` 需要把整份 IANA 时区数据库打包下发到浏览器。

Native Dates 核心库直接读取运行时的 Temporal 和 Intl 引擎规则。所有 IANA 时区开箱即用；当调用方需要传入 Berlin 或 Pacific Time 这类城市名与缩写时，再按需加载 [`@native-dates/plugins/zones`](/plugins/zones/) 即可。

```js
import { datetime } from 'native-dates';

const kickoff = datetime('2026-11-16T09:30', 'America/Los_Angeles');

kickoff.in('Europe/London').format('short', 'en-GB'); // '16/11/2026, 17:30'
kickoff.in('Asia/Tokyo').format('short', 'en-US'); // '11/17/26, 2:30 AM'
```

## 核心库内置模板、预设与范围

Moment 的[占位符模板](/guides/formatting/#token-patterns)、`'LT'` 到 `'llll'` 本地化预设、相对时间短语以及[范围](/api/ranges/)全部内置于核心库，无需加载任何插件：

```js
import { dateRange, datetime } from 'native-dates';

const kickoff = datetime('2026-11-16T09:30', 'America/Los_Angeles');
kickoff.format('YYYY-MM-DD HH:mm'); // '2026-11-16 09:30'
kickoff.format('LLL', 'en-US'); // 'November 16, 2026 at 9:30 AM'
kickoff.from('2026-11-16T07:30-08:00', 'en-US'); // 'in 2 hours'

const quarter = dateRange('2026-10-01', '2026-12-31');
quarter.contains('2026-11-16'); // true
quarter.overlaps(dateRange('2026-12-15', '2027-01-15')); // true
```

## 常用 API 对照表

| Moment | Native Dates | 说明 |
|---|---|---|
| `moment()` | `now()` 或 `today()` | 明确区分具体时刻与日历日期 |
| `moment.tz(str, zone)` | `datetime(str, zone)` | 核心库内置，零打包时区数据 |
| `m.clone().add(7, 'days')` | `d.plus(7, 'days')` | 始终不可变，同时兼容 `add()` 别名 |
| `m.tz('Europe/Berlin')` | `dt.in('Europe/Berlin')` | 将同一时刻转换到另一个时区查看 |
| `m.month()`、`m.date()` | `d.month`、`d.day` | 直接属性访问，月份从 1 到 12 |
| `m.day()`、`m.isoWeekday()` | `d.dayOfWeek` | ISO 编号（周一 1 至周日 7）；模板中 `'E'` 为 1–7，`'d'` 为 0–6 |
| `m.unix()`、`m.valueOf()` | `dt.epochSeconds`、`dt.epochMilliseconds` | 自 1970 年起的计数，属性名明确标出单位 |
| `b.diff(a, 'hours', true)` | `a.until(b, 'hours')` | 返回按指定单位换算的带小数总量 |
| `moment.duration(2, 'h')` | `hours(2)` 或 `duration('2h')` | 核心库内置时长辅助函数 |
| `m.format('LLL')` | `dt.format('LLL')` | 支持 `'LT'` 至 `'llll'` 本地化预设，无需语言包 |
| `m.format('YYYY-MM-DD HH:mm')` | `dt.format('YYYY-MM-DD HH:mm')` | [占位符模板](/guides/formatting/#token-patterns) |
| `m.isBetween(a, b)` | `dateRange(a, b).contains(d)` | 支持 `to()`、`for()` 和 `overlaps()` 的[范围](/api/ranges/) |
| `m.fromNow()`、`m.from(other)` | `dt.fromNow()`、`dt.from(other)` | [相对时间短语](/guides/formatting/#relative-phrases) |
| 非 ISO 字符串解析 | `{ format }` 或 `{ loose: true }` | 加载 [`@native-dates/plugins/parse`](/plugins/parse/) 解析固定格式模板，或加载 [`@native-dates/plugins/loose`](/plugins/loose/) 解析按区域与非规范文本 |

## 渐进式迁移

大型代码库很少能在一次 PR 内完成全部切换。在仍需接收原生 JavaScript `Date` 的边界处调用 [`toJSDate()`](/api/date-time/#tojsdate)，数据回流时再将其传入 [`datetime()`](/api/datetime-fn/) 即可。

```js
import { datetime } from 'native-dates';

const sentAt = datetime('2026-11-16T17:30:00Z', 'America/New_York');
const legacy = sentAt.toJSDate();
const restored = datetime(legacy, 'America/New_York');
```

如果下游辅助函数仍直接调用 `getFullYear()` 等旧版读取方法，可以引入 [`legacy-date`](/plugins/legacy-date/) 插件。

这些读取方法会按实例自身的时区读取字段，并保留从 0 开始的月份编号以实现无缝兼容；而任何修改状态的 setter 方法都会立即抛出错误，让隐藏的原地修改在测试阶段尽早暴露。

```js
import '@native-dates/plugins/legacy-date';
import { datetime } from 'native-dates';

const dt = datetime('2026-11-16T09:30', 'America/Los_Angeles');

dt.getFullYear(); // 2026
dt.getMonth(); // 10，与 Date.prototype.getMonth() 一致
dt.getHours(); // 9，按 America/Los_Angeles 时区读取
```
