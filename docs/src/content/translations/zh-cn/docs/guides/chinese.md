---
source: de72f94c712b
reviewed: false
title: 中文
lede: 处理各中文地区的日期格式与农历显示。
---

通过[本地化](/guides/localization/)传入 `'zh-CN'` 或 `'zh-TW'` 等区域标签，即可匹配各地区的字形、短日期顺序、小时制与每周起始日。

## 中国标准时间与 CST 缩写

表示北京时间请传入 `'Asia/Shanghai'`。不同于固定的东八区偏移，它能输出本地化时区名（如 *中国标准时间*），并保留 1986 至 1991 年的中国夏令时偏移：

```js
import { datetime } from 'native-dates';

const release = datetime('2026-11-16T09:30:00Z', 'Asia/Shanghai').locale('zh-CN');

release.format('YYYY-MM-DD HH:mm zzzz'); // '2026-11-16 17:30 中国标准时间'
datetime('1988-07-15T00:00:00Z', 'Asia/Shanghai').offset; // '+09:00'
```

加载[时区插件](/plugins/zones/)后，`'CST'` 会跟随当前区域设置，在 `'zh-CN'` 下解析为 `'Asia/Shanghai'`，在 `'zh-TW'` 下解析为 `'Asia/Taipei'`。北京、深圳、广州等主要城市以及 `'北京'` 无需配置别名即可开箱解析，而乌鲁木齐仍保持东六区新疆时间：

```js
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T09:30:00Z', { zone: 'CST', locale: 'zh-CN' }).zone; // 'Asia/Shanghai'
datetime('2026-11-16T09:30:00Z', { zone: 'CST', locale: 'zh-TW' }).zone; // 'Asia/Taipei'
datetime('2026-11-16T09:30:00Z', 'Beijing').zone; // 'Asia/Shanghai'
datetime('2026-11-16T09:30:00Z', 'Shenzhen').format('HH:mm', 'zh-CN'); // '17:30'
datetime('2026-11-16T09:30:00Z', 'Urumqi').offset; // '+06:00'
```

## 地区差异

中国大陆、台湾、香港、澳门与新加坡在默认小时制、短日期顺序、星期用字和每周起始日上各有习惯：

| 区域标签 | 短日期 | 每周起始日 | 默认小时制与星期习惯 |
|---|---|---|---|
| `zh-CN` | `2026/11/16` | 周一 | 默认 24 小时制，星期简称写作 `周一` 至 `周日`。 |
| `zh-TW` | `2026/11/16` | 週日 | 默认 12 小时制并冠以 `上午` 或 `下午`，星期简称写作 `週一`。 |
| `zh-HK` | `16/11/2026` | 週日 | 默认 12 小时制，采用日月年短日期，澳门同此惯例。 |
| `zh-SG` | `16/11/26` | 周日 | 默认 12 小时制与简体 `周` 字，采用两位年份的日月年短日期。 |

同一时刻在各区域的本地预设下输出如下：

```js
import { datetime } from 'native-dates';

const meeting = datetime('2026-11-16T17:05:00+08:00', 'Asia/Shanghai');

meeting.format('medium', 'zh-CN'); // '2026年11月16日 17:05'
meeting.format('medium', 'zh-TW'); // '2026年11月16日 下午5:05'
meeting.date.format('short', 'zh-HK'); // '16/11/2026'
meeting.date.format('short', 'zh-SG'); // '16/11/26'
```

周日当天在中国大陆归入上一周末尾，而在台港澳与新加坡则是新一周的起点。跨地区周报统计键请向 `startOf()` 显式传入 `'monday'`：

```js
import { date } from 'native-dates';

const sunday = date('2026-11-15');

sunday.locale('zh-CN').range('week').toString(); // '2026-11-09/2026-11-15'
sunday.locale('zh-HK').range('week').toString(); // '2026-11-15/2026-11-21'
sunday.locale('zh-HK').startOf('week', 'monday').toString(); // '2026-11-09'
```

简体中文下，`'Ah:mm'` 输出上午或下午，而 `dayPeriod: 'short'` 会细分出凌晨、早上、中午和晚上等自然时段：

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

## 格式模板与输入解析

格式模板只把拉丁字母当作占位符，年、月、日与中文标点无需方括号。`'MMMM'` 输出汉字月份，而 `'dd'` 输出单字星期：

```js
import { datetime } from 'native-dates';

const slot = datetime('2026-11-06T14:05:00+08:00', 'Asia/Shanghai').locale('zh-CN');

slot.format('YYYY年M月D日 ddd HH:mm'); // '2026年11月6日 周五 14:05'
slot.format('MMMDo / MMMMDo'); // '11月6日 / 十一月6日'
slot.format('dd / ddd / dddd'); // '五 / 周五 / 星期五'
slot.format('ddd', 'zh-TW'); // '週五'
```

核心函数可直接解析年先头的汉字日期、斜杠与句点格式，无需插件即可往返还原 `format('long')` 的输出。若需解析香港的日月年斜杠日期、全角数字、上下午时间或行内 `'CST'`，请加载[宽松解析插件](/plugins/loose/)：

```js
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { date, datetime, monthDay, time, yearMonth } from 'native-dates';

date('2026年11月16日').toString(); // '2026-11-16'
yearMonth('2026年11月').toString(); // '2026-11'
date('16/11/2026', { loose: true, locale: 'zh-HK' })?.toString(); // '2026-11-16'
date('２０２６年１１月１６日', { loose: true })?.toString(); // '2026-11-16'
time('下午5:05', { loose: true, locale: 'zh-TW' })?.toString(); // '17:05:00'
monthDay('11月16日', { loose: true })?.toString(); // '11-16'
datetime('2026年11月16日 14:30 CST', {
  loose: true,
  locale: 'zh-CN',
  zone: 'UTC',
})?.toString(); // '2026-11-16T06:30:00.000Z'
```

## 农历与民国纪年

格式化日期或时刻时传入 `'zh-CN-u-ca-chinese'`，预设样式会输出干支纪年、正月与闰月。

模板占位符始终读取公历字段。由于部分日期类型不含具体日期，传入农历标签会回退为公历，而与公历月份对齐的民国纪年 `'zh-TW-u-ca-roc'` 可正常显示：

```js
import { date, yearMonth } from 'native-dates';

date('2026-02-17').format('long', 'zh-CN-u-ca-chinese'); // '2026丙午年正月初一'
date('2025-07-25').format('medium', 'zh-CN-u-ca-chinese'); // '2025年闰六月初一'
date('2026-02-17').format('YYYY-MM-DD', 'zh-CN-u-ca-chinese'); // '2026-02-17'
yearMonth('2026-02').format('long', 'zh-CN-u-ca-chinese'); // '2026年2月'
yearMonth('2026-11').format('long', 'zh-TW-u-ca-roc'); // '民國115年11月'
```

## 相对时间

`CalendarDate` 按日历天计算，相差两天时返回前天和后天。`DateTime` 则按精确秒数计算，避免将 23 小时前算作昨天：

```js
import { date, datetime, today } from 'native-dates';

const base = date('2026-11-16');
date('2026-11-14').from(base, 'zh-CN'); // '前天'
date('2026-11-18').from(base, 'zh-CN'); // '后天'

const anchor = datetime('2026-11-16T12:00:00+08:00', 'Asia/Shanghai');
anchor.minus(2, 'days').from(anchor, 'zh-CN'); // '2天前'
date('2026-11-18').from(today('Asia/Shanghai'), 'zh-CN');
```

在 UTC 云服务器上，北京时间凌晨零点到早八点之间调用无参 `fromNow()` 会落入前一天，请显式传入 `today('Asia/Shanghai')`。
