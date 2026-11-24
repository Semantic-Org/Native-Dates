---
source: "e095c0bff2bd"
title: 日语
lede: 按日语习惯格式化和历年号、括号星期与斜杠日期，并处理周日起始的周历规则。
---

传入 `'ja-JP'` 即可按日语习惯格式化日期（详见[本地化](/guides/localization/)）。默认仍采用公历年份，需要日本年号时可按需切换为 `'ja-u-ca-japanese'`。

## 日本年号与元年

传入 `'ja-u-ca-japanese'` 即可输出正式的日本和历日期，例如 2019 年 4 月 30 日为平成 31 年，次日即为令和首年（年份写作“元年”而非“1年”）：

```js
import { date } from 'native-dates';

date('2019-04-30').format('long', 'ja-u-ca-japanese'); // '平成31年4月30日'
date('2019-05-01').format('long', 'ja-u-ca-japanese'); // '令和元年5月1日'
date('2026-11-16').format('short', 'ja-u-ca-japanese'); // 'R8/11/16'
date('2026-11-16').format('llll', 'ja-u-ca-japanese'); // '令和8年11月16日(月)'
```

即使绑定了和历区域标签，`'YYYY年M月D日'` 这类占位符模板和 `year` 属性也始终读取公历年份。如需显示年号，请使用预设格式或选项对象：

```js
const reiwa = date('2026-11-16').locale('ja-u-ca-japanese');

reiwa.year; // 2026
reiwa.format('long'); // '令和8年11月16日'
reiwa.format('YYYY年M月D日'); // '2026年11月16日'
```

[`YearMonth`](/api/year-month/) 不含日字段，因此默认按当月 1 日生效的年号格式化。遇到 1989 年 1 月这样月中改元（昭和 64 年转平成元年）的月份，需先用 [`on()`](/api/year-month/#on) 定位到具体日期：

```js
import { yearMonth } from 'native-dates';

const jan1989 = yearMonth('1989-01');

jan1989.format('long', 'ja-u-ca-japanese'); // '昭和64年1月'
jan1989.on(8).format('long', 'ja-u-ca-japanese'); // '平成元年1月8日'
```

## 括号星期与 12 小时制

标准日语预设在分隔符与星期样式上各有侧重：

| 预设 | 输出 | 样式与典型用途 |
|---|---|---|
| `'medium'` | `'2026/11/16'` | 紧凑的斜杠写法，适合表格和表单字段。 |
| `'long'` | `'2026年11月16日'` | 标准汉字年月日格式，不含星期。 |
| `'full'` | `'2026年11月16日月曜日'` | 末尾直接拼接完整星期名（如 `月曜日` 表示周一），不带空格和括号。 |
| `'llll'` | `'2026年11月16日(月)'` | 常见界面样式，用半角括号包裹单字星期（如 `月` 表示周一）。 |

格式占位符 `'ddd'` 返回裸单字星期（如 `月`），方便你自行包裹全角括号。长月份和序数日占位符已自带 `月` 和 `日`，因此在与字面汉字组合时请使用纯数字月份和日期占位符：

```js
import { date } from 'native-dates';

const day = date('2026-11-16').locale('ja-JP');

day.format('YYYY年M月D日（ddd）'); // '2026年11月16日（月）'
day.format('MMMMDo(ddd)'); // '11月16日(月)'
day.format({ month: 'long', day: 'numeric', weekday: 'short' }); // '11月16日(月)'
```

时间默认采用 24 小时制。传入 `hour12: true` 会按日本习惯从 0 时起计（`午前0:30`、`午後0:30`）；若希望按 1 至 12 时计数，使用 `'Ah:mm'` 即可：

```js
import { datetime } from 'native-dates';

const midnight = datetime('2026-11-16T00:30', 'Asia/Tokyo').locale('ja-JP');

midnight.format('time'); // '0:30'
midnight.format({ hour: 'numeric', minute: '2-digit', hour12: true }); // '午前0:30'
midnight.format('Ah:mm'); // '午前12:30'
```

## 斜杠日期与日语文本解析

日本 CSV 和表单中常见的汉字年-月-日日期、斜杠与点号格式均可由核心库直接解析，无需插件：

```js
import { date, datetime, yearMonth } from 'native-dates';

date('2026年11月16日').toString(); // '2026-11-16'
date('2026/1/5').toString(); // '2026-01-05'
datetime('2026年11月16日 9:30', 'Asia/Tokyo').toString(); // '2026-11-16T00:30:00.000Z'
yearMonth('2026年11月').toString(); // '2026-11'
```

加载 [loose 插件](/plugins/loose/)后，全角数字和标点、`午前` / `午後`（上午 / 下午）时钟时间以及汉字月日均可直接解析，无需手动规范化：

```js
import '@native-dates/plugins/loose';
import { date, monthDay, time } from 'native-dates';

date('２０２６／１１／１６', { loose: true })?.toString(); // '2026-11-16'
time('午後2:30', { loose: true, locale: 'ja' })?.toString(); // '14:30:00'
monthDay('11月16日', { loose: true })?.toString(); // '11-16'
```

`'令和8年11月16日'` 这类和历字符串仍需结构化输入。当表单分别收集年号和年份时，可直接构造日本历 `Temporal.PlainDate` 传给 [`date()`](/api/date-fn/)，无需先转换历法：

```js
const reiwaInput = Temporal.PlainDate.from({
  calendar: 'japanese',
  era: 'reiwa',
  eraYear: 8,
  month: 11,
  day: 16,
});

date(reiwaInput).toString(); // '2026-11-16'
```

## 时区与周起始日

核心库原生支持 `'Asia/Tokyo'` 与固定偏移量。加载 [zones 插件](/plugins/zones/)后，`JST` 以及日本主要城市名开箱即可解析：

```js
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'JST').zone; // 'Asia/Tokyo'
datetime('2026-11-16T09:30', 'Osaka').zone; // 'Asia/Tokyo'
datetime('2026-11-16T09:30', '東京').zone; // 'Asia/Tokyo'
```

日语区域默认遵循挂历习惯从周日开始计算一周。制作以周一为起点的商务排班表时，显式传入 `'monday'` 或固定 `weekStart` 即可：

```js
import { date, weekdayNames } from 'native-dates';

const wed = date('2026-11-18').locale('ja-JP');

wed.weekStart; // 7
wed.startOf('week').toString(); // '2026-11-15'
wed.startOf('week', 'monday').toString(); // '2026-11-16'
weekdayNames('short', undefined, 'ja-JP');
// ['日', '月', '火', '水', '木', '金', '土']
weekdayNames('short', 'monday', 'ja-JP');
// ['月', '火', '水', '木', '金', '土', '日']
```

## 范围与相对时间表达

范围预设使用全角波浪号连接斜杠日期或汉字时钟时间。如果希望起止两端同时显示汉字日期和星期，向 [`format()`](/api/ranges/#format) 传入占位符模板即可：

```js
import { dateRange, timeRange } from 'native-dates';

const span = dateRange('2026-11-16', '2026-11-20').locale('ja-JP');

span.format('long'); // '2026/11/16～2026/11/20'
span.format('M月D日(ddd)'); // '11月16日(月) – 11月20日(金)'
timeRange('09:00', '17:30').format('short', 'ja-JP'); // '9時00分～17時30分'
```

[`CalendarDate`](/api/calendar-date/) 会为前天和后天分别输出自然词汇“一昨日”和“明後日”。[`DateTime`](/api/date-time/) 则始终输出计数单位，避免小时差被误解为日历天数：

```js
import { date, datetime, duration } from 'native-dates';

const baseDate = date('2026-11-16').locale('ja-JP');
baseDate.minus(2, 'days').from(baseDate); // '一昨日'
baseDate.plus(2, 'days').from(baseDate); // '明後日'

const baseTime = datetime('2026-11-16T12:00', 'Asia/Tokyo').locale('ja-JP');
baseTime.minus(1, 'day').from(baseTime); // '1 日前'
duration({ hours: 2, minutes: 30 }).format('long', 'ja-JP'); // '2 時間 30 分'
```

:::tip[留意空格与全角波浪号的码点]
遵循运行时标准本地化数据，日语相对时间与时长字符串会在数字两侧插入半角空格。范围预设输出的是 `U+FF5E` 全角波浪号（`～`），而非 `U+301C` 波浪破折号（`〜`），编写测试断言时请核对字符码点。
:::
