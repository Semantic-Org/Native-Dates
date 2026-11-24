---
source: "c85157f664b2"
title: 概览
lede: 基于浏览器原生 Temporal 与 Intl API 构建，提供直观易读、不可变的日期与时间接口。
---

现代 JavaScript 引擎已内置 `Temporal`（负责日历与时区运算）和 `Intl`（负责本地化格式化）。Native Dates 将这些原生能力封装为如自然语言般直观的接口，且零运行时依赖。

```js
import { date, now, today } from 'native-dates';

const due = today().plus(2, 'weeks');
const standup = date('2026-11-16')
  .at('9:30am', 'America/Los_Angeles')
  .in('Europe/Berlin');
```

由于运行时已自带 IANA 时区数据库与各地区语言规则，无需打包额外的时区表或语言包，即可覆盖全球各地区与语言。

## 各司其职的时间类型

JavaScript 内置的 `Date` 用同一个对象包办一切，无论你要表示节假日、营业时间还是数据库时间戳。Native Dates 为每种概念提供独立类型，让每个值只携带与自身语义相符的字段：

- [`CalendarDate`](/api/calendar-date/)：表示不受时区影响的日历日期，如 2026 年 5 月 10 日
- [`Time`](/api/time/)：表示一天中的时钟时间，如上午 9:30，跨越午夜时自动回绕
- [`DateTime`](/api/date-time/)：表示绑定了时区的具体时刻
- [`Duration`](/api/duration/)：表示一段时长，如 90 分钟或 2 周
- [`YearMonth`](/api/year-month/) 与 [`MonthDay`](/api/month-day/)：用于账单周期、银行卡有效期和每年生日等部分日期
- [范围](/api/ranges/)：表示两个日期、时钟时间或具体时刻之间的区间

计算时间间隔、构建范围，以及用本地化预设或占位符模板进行格式化，全部开箱即用：

```js
import { dateRange, datetime, monthDay, now, timeRange, yearMonth } from 'native-dates';

const deadline = datetime('2027-01-01T00:00:00Z');
now().until(deadline).format('long');

const sprint = dateRange('2026-11-02', '2026-11-15');
const shift = timeRange('9:00am', '5:00pm');
sprint.contains('2026-11-10'); // true
shift.duration.hours; // 8

const billing = yearMonth('2026-11');
const birthday = monthDay('10/17');
```

接下来可阅读[时间类型](/guides/types-of-time/)，了解如何按场景选型及在各类型间转换。

## 不可变值

所有实例均为不可变值。调用 [`plus()`](/api/date-time/#plus) 或 [`in()`](/api/date-time/#in) 等方法时，始终返回新实例，不会修改原值。

将日期传入工具函数或 UI 组件时，不必担心调用方的状态被暗中改动：

```js
const original = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
const moved = original.plus(1, 'hour');

original.text; // 'Nov 16, 2026, 9:30 AM PST'
moved.text; // 'Nov 16, 2026, 10:30 AM PST'
```

每个值还提供 `.text` 属性，可直接读取当前语言环境下的易读摘要；同时自定义了 `util.inspect` 输出，在 Node 中调用 `console.log()` 时会打印简洁的单行预览：

```js
import { time } from 'native-dates';

date('2026-05-10').text; // 'May 10, 2026'
time('9:30am').text; // '9:30 AM'
```

:::tip[比较两个值]
由于所有方法都返回新实例，`===` 比较的是对象引用而非值是否相等。判断两个实例是否表示相同的日期、时钟时间或具体时刻，请调用 [`equals()`](/api/date-time/#equals)。
:::

## 核心包与插件

核心包 [`native-dates`](/guides/installation/) 涵盖实例创建、时区转换、日历运算、部分日期、范围、时长、相对时间、本地化预设和占位符模板。

城市与时区缩写查询、宽松解析以及兼容旧版 `Date` 的方法作为可选插件，以独立子路径的形式收录在 [`@native-dates/plugins`](/plugins/) 中。参阅[自定义](/guides/customization/#adding-plugins)，了解如何引入插件或配置全局默认值。

前往[安装](/guides/installation/)将包添加到项目中，并按需为 Safari 配置 polyfill。
