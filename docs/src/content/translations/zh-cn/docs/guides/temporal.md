---
source: "ed93e959dec0"
title: 与 Temporal 协作
lede: Native Dates 如何映射 JavaScript 的 Temporal API，并与原生 Temporal 值自由互操作。
---

Native Dates 封装了 JavaScript 内置的 `Temporal` 和 `Intl` API。

Temporal 提供了精确的历法和时区原语，但日常调用往往需要传入显式的选项对象。Native Dates 为常见场景提供了更简洁的方法，同时支持与原生 Temporal 实例无缝互操作。

## 类型与 Temporal 的映射关系

每个核心值类都封装一个底层 `Temporal` 类型，需要底层控制时随时可以取出：

| 类型 | 封装的底层类型 | Native Dates 的增强能力 |
|---|---|---|
| [`DateTime`](/api/date-time/) | `Temporal.ZonedDateTime` | 将 ISO 时间戳、偏移量字符串、`Date` 对象和纪元数值统一读取为带时区类型，并序列化为 UTC |
| [`CalendarDate`](/api/calendar-date/) | `Temporal.PlainDate` | 可直接配合 `at(time, zone)` 使用，并支持预设格式与占位符模板格式化 |
| [`Time`](/api/time/) | `Temporal.PlainTime` | 除 24 小时制 ISO 时钟时间外，还可解析 `'9:30am'` 这类 12 小时制字符串 |
| [`Duration`](/api/duration/) | `Temporal.Duration` | 解析 `'1h 30m'` 这类短语、自动向低单位展开小数时长，并保留来自 `until()` 的锚点信息 |
| [`YearMonth`](/api/year-month/) | `Temporal.PlainYearMonth` | 专用于账单月份和卡片有效期，内置 [`monthYear()`](/api/year-month-fn/#monthyear) 与 `on()` |
| [`MonthDay`](/api/month-day/) | `Temporal.PlainMonthDay` | 专用于生日和周期性日期，内置 [`dayMonth()`](/api/month-day-fn/#daymonth)、`fallsOn()` 与 `next()` |

Temporal 规范不包含范围类型。核心库基于起止端点提供了 [`DateRange`、`DateTimeRange` 和 `TimeRange`](/api/ranges/)，支持包含判断、重叠检测和步进迭代。

## 直接传入 Temporal 对象

所有工厂函数、运算方法和比较函数都可以直接接收原生 `Temporal` 值。

```js
import { date, datetime, time, yearMonth } from 'native-dates';

const instant = Temporal.Instant.from('2026-11-16T17:30:00Z');
const standup = datetime(instant, 'America/Los_Angeles');

const plainDate = Temporal.PlainDate.from('2026-11-16');
date(plainDate).plus(Temporal.Duration.from({ weeks: 2 }));

const plainTime = Temporal.PlainTime.from('09:30');
time(plainTime).format('short', 'en-US'); // '9:30 AM'

const ym = yearMonth(Temporal.PlainYearMonth.from('2026-11'));
ym.daysInMonth; // 30
```

向 [`datetime()`](/api/datetime-fn/) 传入 `Temporal.ZonedDateTime` 时，除非另行指定新时区，否则会保留其原有时区。传入 `Temporal.Instant` 或无时区日期时间时，则会自动放入你指定的时区或默认配置的时区。

使用日本历、波斯历等非 ISO 历法的 Temporal 值或字符串会直接转换到对应的 ISO 日期，无需先调用 `withCalendar()`。

比较方法和跨度计算同样直接支持 Temporal 输入：

```js
const berlin = Temporal.ZonedDateTime.from('2026-11-16T18:30:00+01:00[Europe/Berlin]');
standup.equals(berlin); // true
```

## 使用 toTemporal() 取出底层对象

在任意值上调用 [`toTemporal()`](/api/date-time/#totemporal)，即可拿到它底层的 Temporal 实例。

当你需要调用依赖 Temporal 对象的第三方库，或直接操作非 ISO 历法时，可以这样取出底层对象：

```js
import { date } from 'native-dates';

const d = date('2026-11-16');
const plain = d.toTemporal(); // Temporal.PlainDate

const japanese = plain.withCalendar('japanese');
japanese.era; // 'reiwa'
japanese.eraYear; // 8
```

:::note[零拷贝取出]
每个实例内部直接持有一个真实的 Temporal 对象，因此 `toTemporal()` 会直接返回该对象，不会重新解析，也不会分配副本。
:::

## 为旧版运行时加载 polyfill

新版 Chrome、Edge、Firefox、Node 26+、Deno 和 Bun 均已原生内置 `Temporal`，因此核心库不包含任何 polyfill 代码。

如需兼容 Safari、旧版浏览器或 Node 22–25，请在启动时搭配 `temporal-polyfill` 加载 `@native-dates/polyfill`（该包同时在 Node 22–23 上提供 `Intl.DurationFormat` 回退实现）。安装与同步加载方案请参见[兼容 Safari 与旧版 Node](/guides/installation/#supporting-safari-and-older-node)。
