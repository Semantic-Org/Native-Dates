---
source: "1f74e099bd7a"
title: 中文
lede: 处理各中文地区的日期与时间格式差异、时区规则与农历展示。
---

使用 `'zh-CN'`、`'zh-TW'` 等带地区码的区域标签即可按当地习惯进行[本地化](/guides/localization/)。各中文地区在简繁体字形、日期顺序、时间制和周起始日上各有差异。

## 中国标准时间与 CST

北京时间请使用 `'Asia/Shanghai'`。与固定偏移量 `UTC+8` 不同，它既能格式化出本地化时区名称（`中国标准时间`），也保留了中国 1986–1991 年间的夏令时历史偏移：

```js
import { datetime } from 'native-dates';

const release = datetime('2026-11-16T09:30:00Z', 'Asia/Shanghai').locale('zh-CN');

release.format('YYYY-MM-DD HH:mm zzzz'); // '2026-11-16 17:30 中国标准时间'
datetime('1988-07-15T00:00:00Z', 'Asia/Shanghai').offset; // '+09:00'
```

加载 [zones 插件](/plugins/zones/)后，`CST` 会按当前区域自动消歧：`zh-CN` 下解析为 `Asia/Shanghai`，`zh-TW` 下解析为 `Asia/Taipei`。中国大陆主要城市均可直接识别，而乌鲁木齐保持 `UTC+6` 新疆时间偏移：

```js
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T09:30:00Z', { zone: 'CST', locale: 'zh-CN' }).zone; // 'Asia/Shanghai'
datetime('2026-11-16T09:30:00Z', { zone: 'CST', locale: 'zh-TW' }).zone; // 'Asia/Taipei'
datetime('2026-11-16T09:30:00Z', 'Beijing').zone; // 'Asia/Shanghai'
datetime('2026-11-16T09:30:00Z', 'Shenzhen').format('HH:mm', 'zh-CN'); // '17:30'
datetime('2026-11-16T09:30:00Z', 'Urumqi').offset; // '+06:00'
```

## 各中文地区的格式差异

中国大陆、台湾、香港、澳门和新加坡在默认时间制、短日期顺序、星期写法与周起始日上各有不同：

| 区域标签 | 短日期 | 周起始日 | 默认时间制与星期写法 |
|---|---|---|---|
| `zh-CN` | `2026/11/16` | 周一 | 默认 24 小时制，星期简写为简体 `周一` 至 `周日`。 |
| `zh-TW` | `2026/11/16` | 周日 | 默认 12 小时制（带 `上午` / `下午`），星期简写为繁体 `週一` 至 `週日`。 |
| `zh-HK` | `16/11/2026` | 周日 | 默认 12 小时制，短日期采用日/月/年顺序（澳门同此规则）。 |
| `zh-SG` | `16/11/26` | 周日 | 默认 12 小时制，星期使用简体 `周`，短日期采用两位年份的日/月/年顺序。 |

同一具体时刻在各地区的本地预设输出如下：

```js
import { datetime } from 'native-dates';

const meeting = datetime('2026-11-16T17:05:00+08:00', 'Asia/Shanghai');

meeting.format('medium', 'zh-CN'); // '2026年11月16日 17:05'
meeting.format('medium', 'zh-TW'); // '2026年11月16日 下午5:05'
meeting.date.format('short', 'zh-HK'); // '16/11/2026'
meeting.date.format('short', 'zh-SG'); // '16/11/26'
```

在周日这一天，中国大陆算作本周的最后一天，而台湾、香港和新加坡已归入新的一周。跨地区汇总周报时，向 [`startOf()`](/api/calendar-date/#startof) 显式传入 `'monday'` 即可对齐分组键：

```js
import { date } from 'native-dates';

const sunday = date('2026-11-15');

sunday.locale('zh-CN').range('week').toString(); // '2026-11-09/2026-11-15'
sunday.locale('zh-HK').range('week').toString(); // '2026-11-15/2026-11-21'
sunday.locale('zh-HK').startOf('week', 'monday').toString(); // '2026-11-09'
```

在 `zh-CN` 下，`'Ah:mm'` 输出 `上午` / `下午`；若需按时段输出 `凌晨`、`早上`、`中午`、`晚上`，传入 `dayPeriod: 'short'` 即可：

```js
import { time } from 'native-dates';

const night = time('20:30').locale('zh-CN');

night.format('short'); // '20:30'
night.format('Ah:mm'); // '下午8:30'
night.format({
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  dayPeriod: 'short',
}); // '晚上8:30'
```

## 占位符模板与文本解析

占位符模板仅把拉丁字母解析为格式占位符，因此 `年`、`月`、`日` 及中文标点无需用方括号转义。`'MMMM'` 输出 `十一月` 这类汉字月份，`'dd'` 则输出单字星期：

```js
import { datetime } from 'native-dates';

const slot = datetime('2026-11-06T14:05:00+08:00', 'Asia/Shanghai').locale('zh-CN');

slot.format('YYYY年M月D日 ddd HH:mm'); // '2026年11月6日 周五 14:05'
slot.format('MMMDo / MMMMDo'); // '11月6日 / 十一月6日'
slot.format('dd / ddd / dddd'); // '五 / 周五 / 星期五'
slot.format('ddd', 'zh-TW'); // '週五'
```

核心工厂函数可直接解析中文年-月-日格式以及斜杠、点号分隔的日期，无需插件即可还原 `'long'` 预设的输出。若要解析香港常见的日/月/年斜杠日期、全角数字、带时段词的时钟时间或内联 `CST`，加载 [loose 插件](/plugins/loose/)即可：

```js
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { date, datetime, monthDay, time, yearMonth } from 'native-dates';

date('2026年11月16日').toString(); // '2026-11-16'
yearMonth('2026年11月').toString(); // '2026-11'
date('16/11/2026', { loose: true, locale: 'zh-HK' })?.toString(); // '2026-11-16'
date('２０２６年１１月１６日', { loose: true })?.toString(); // '2026-11-16'
time('下午5:05', { loose: true, locale: 'zh-TW' })?.toString(); // '17:05:00'
time('晚上9:10', { loose: true, locale: 'zh-CN' })?.toString(); // '21:10:00'
time('凌晨12:00', { loose: true, locale: 'zh-TW' })?.toString(); // '00:00:00'
monthDay('11月16日', { loose: true })?.toString(); // '11-16'
datetime('2026年11月16日 14:30 CST', {
  loose: true,
  locale: 'zh-CN',
  zone: 'UTC',
})?.toString(); // '2026-11-16T06:30:00.000Z'
```

宽松模式在 `'zh-CN'` 和 `'zh-TW'` 下均同时支持 `上午` / `下午` 以及 `凌晨`、`中午`、`晚上` 等时段词。

## 农历与民国纪年

格式化日历日期或日期时间时传入 `'zh-CN-u-ca-chinese'`，预设格式会自动输出干支纪年、正月以及闰月（如 `闰六月`）。

占位符模板始终读取公历字段。部分日期因缺少日字段会回退到公历，而台湾的民国历标签 `'zh-TW-u-ca-roc'` 在月份上与公历对齐，可直接用于 `YearMonth`：

```js
import { date, yearMonth } from 'native-dates';

date('2026-02-17').format('long', 'zh-CN-u-ca-chinese'); // '2026丙午年正月初一'
date('2025-07-25').format('medium', 'zh-CN-u-ca-chinese'); // '2025年闰六月初一'
date('2026-02-17').format('YYYY-MM-DD', 'zh-CN-u-ca-chinese'); // '2026-02-17'
yearMonth('2026-02').format('long', 'zh-CN-u-ca-chinese'); // '2026年2月'
yearMonth('2026-11').format('long', 'zh-TW-u-ca-roc'); // '民國115年11月'
```

## 相对时间

[`CalendarDate`](/api/calendar-date/) 按日历天数计算相对时间，相差两天时直接返回 `前天` 和 `后天`。[`DateTime`](/api/date-time/) 则按经过的秒数计算，因此 23 小时前不会误显示为昨天：

```js
import { date, datetime, today } from 'native-dates';

const base = date('2026-11-16');
date('2026-11-14').from(base, 'zh-CN'); // '前天'
date('2026-11-18').from(base, 'zh-CN'); // '后天'

const anchor = datetime('2026-11-16T12:00:00+08:00', 'Asia/Shanghai');
anchor.minus(2, 'days').from(anchor, 'zh-CN'); // '2天前'
date('2026-11-18').from(today('Asia/Shanghai'), 'zh-CN');
```

在 UTC 服务器上，北京时间 00:00 至 08:00 之间直接调用无参 [`fromNow()`](/api/calendar-date/#fromnow) 会落到 UTC 的前一天，因此请显式传入 [`today('Asia/Shanghai')`](/api/date-fn/#today)。
