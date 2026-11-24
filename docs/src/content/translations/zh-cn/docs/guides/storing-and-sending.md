---
source: "2eb400c31ff1"
title: 存储与传输
lede: 在 JSON API、数据库与 HTML 表单控件之间规范地序列化日期、时钟时间与范围。
---

每种类型在转为文本或传入 `JSON.stringify()` 时，都会序列化为标准的 ISO 8601 字符串；在接收端将它们传回对应的工厂函数，即可原样还原。

## JSON 与传输格式

无需自定义 replacer 或包装对象，直接将实例传入 `JSON.stringify()` 即可：

```js
import { date, duration, time } from 'native-dates';

const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');

JSON.stringify({
  startsAt: standup,
  dueOn: date('2026-11-16'),
  opensAt: time('9:30am'),
  length: duration('1h 30m'),
});
// '{"startsAt":"2026-11-16T17:30:00.000Z","dueOn":"2026-11-16","opensAt":"09:30:00","length":"PT1H30M"}'
```

| 类型 | 传输输出 | 典型载荷字段 |
|---|---|---|
| [`DateTime`](/api/date-time/) | `'2026-11-16T17:30:00.000Z'` | 审计时间戳、航班起飞时间与会议时刻 |
| [`CalendarDate`](/api/calendar-date/) | `'2026-11-16'` | 截止日期、节假日与酒店入住日期 |
| [`Time`](/api/time/) | `'09:30:00'` | 门店营业时间与每日提醒时间 |
| [`Duration`](/api/duration/) | `'PT1H30M'` | 超时时长、SLA、计费周期与计时器 |
| [`YearMonth`](/api/year-month/) | `'2026-11'` | 账单周期、银行卡有效期与月份输入 |
| [`MonthDay`](/api/month-day/) | `'10-17'` | 不带出生年份的周期性生日与年度节假日 |
| [范围](/api/ranges/) | `'2026-11-01/2026-11-07'` | 预订窗口、迭代周期与 ISO 8601 斜杠区间 |

当外部 API、缓存键或整数列要求数字时，按对方需要的单位读取自 1970 年以来的计数即可。由于有的系统按秒、有的按毫秒，每个属性都在名称中明确标明了单位：

```js
standup.toString(); // '2026-11-16T17:30:00.000Z'
standup.epochSeconds; // 1794850200
standup.epochMilliseconds; // 1794850200000
duration('1h 30m').toMilliseconds(); // 5400000
```

## 反序列化还原到代码

读取 JSON 响应、数据库记录或 URL 参数时，将传输字符串直接传回对应的工厂函数：

```js
import { date, dateRange, datetime, duration, time, yearMonth } from 'native-dates';

const startsAt = datetime('2026-11-16T17:30:00.000Z', 'America/Los_Angeles');
const dueOn = date('2026-11-16');
const opensAt = time('09:30:00');
const length = duration('PT1H30M');
const billing = yearMonth('2026-11');
const window = dateRange('2026-11-01/2026-11-07');
```

每个 `DateTime` 都序列化为 UTC，确保不同客户端记录同一事件时生成完全一致的字符串。读回时传入目标时区，即可在当地视角下查看这一精确的 UTC 时刻，而不会改变事件实际发生的时间点。

## 未来事件与周期性事件

对于订单回执、服务日志这类已发生的历史事件，单存一个 UTC 时间戳就已完备。但由人预约的未来事件，必须把 IANA `zone` 与时间戳一并存储。

```js
import { date, datetime } from 'native-dates';

const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
const row = {
  startsAt: standup.toString(),
  zone: standup.zone, // 'America/Los_Angeles'
};

const nextWeek = datetime(row.startsAt, row.zone).plus(1, 'week');
nextWeek.hour; // 9
```

保留时区后，跨夏令时加减周或月时仍能维持当地上午 9:30 的时钟时间；即便未来当地政策调整夏令时规则，也能自动适配。

:::tip[存储 IANA 时区名，而非偏移量]
像 `'-08:00'` 这样的偏移量只适用于洛杉矶的冬季。只要未来的日历运算需要跟随当地夏令时变化，就务必存储 `zone`。
:::

## 数据库列类型

让 SQL 列类型与数据的语义一一对应，这样数据库层就能与应用代码守住同一条边界。

| 类型 | SQL 列类型 | 适用原因 |
|---|---|---|
| `DateTime` | `timestamptz` 或 `bigint` | 无歧义地存储精确的 UTC 时刻 |
| `CalendarDate` | `date` | 直接存储 `YYYY-MM-DD`，避免午夜零点因时区偏移跨天 |
| `Time` | `time` | 直接存储 `HH:MM:SS`，无需编造虚拟日期 |
| `Duration` | `interval` 或 `text` | 存储结构化时间间隔或 ISO 8601 `PT` 字符串 |

切勿使用不带时区的 SQL `timestamp` 列来存储真实时刻，因为数据库驱动常会按服务器本地时区重新解释它。

## HTML 表单控件与 URL

原生 HTML 的日期、月份与时间控件读写的字符串，与核心类型输出的 ISO 格式完全一致；URL 查询参数同样可直接采用这种紧凑格式。

```js
import { date, time, yearMonth } from 'native-dates';

// <input type="date" value="2026-11-16">
const due = date('2026-11-16');
due.toString(); // '2026-11-16'

// <input type="month" value="2026-11">
const billing = yearMonth('2026-11');
billing.toString(); // '2026-11'

// <input type="time" value="09:30">
const opens = time('09:30');
opens.toString().slice(0, 5); // '09:30'

const params = new URLSearchParams({ from: due.toString() });
params.toString(); // 'from=2026-11-16'
```

用 [`date()`](/api/date-fn/) 读取日期输入框还能避开经典的 `new Date('2026-11-16')` 陷阱：后者在西半球时区会把 UTC 零点往前偏移一天。
