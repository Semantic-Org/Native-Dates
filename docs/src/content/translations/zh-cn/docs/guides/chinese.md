---
source: '0c3a904f42de'
reviewed: false
title: 中文日期与时间
lede: 处理中文应用的地区格式差异与农历展示边界，避开 CST 时区缩写陷阱。
---

除通用的[国际化配置](/guides/internationalization/)外，中文应用还需处理大中华区的小时制与周起点差异、农历边界以及容易混淆的 CST 时区缩写。

## 中国标准时间与 CST 缩写陷阱

表示北京时间请始终传入 `'Asia/Shanghai'`。不同于固定的东八区偏移，它能输出本地化时区名，并保留 1986 至 1991 年的中国夏令时偏移：

```js
import { datetime } from 'native-dates';

const release = datetime('2026-11-16T09:30:00Z', 'Asia/Shanghai').locale('zh-CN');
release.format('YYYY-MM-DD HH:mm zzzz'); // '2026-11-16 17:30 中国标准时间'
datetime('1988-07-15T00:00:00Z', 'Asia/Shanghai').offset; // '+09:00'
```

[时区插件](/plugins/zones/)按北美惯例把 CST 映射为芝加哥时间，与北京时间相差 13 至 14 小时，并将乌鲁木齐解析为东六区新疆时间。北京、深圳等未收录进 IANA 的城市会抛出 `unknownZone`，需在启动时配置别名：

```js
import '@native-dates/plugins/zones';
import { configure, datetime } from 'native-dates';

datetime('2026-11-16T09:30:00Z', 'CST').zone; // 'America/Chicago'
datetime('2026-11-16T09:30:00Z', 'Urumqi').offset; // '+06:00'

configure({
  zoneAliases: {
    CST: 'Asia/Shanghai',
    beijing: 'Asia/Shanghai',
    shenzhen: 'Asia/Shanghai',
  },
});
datetime('2026-11-16T09:30:00Z', 'Beijing').format('HH:mm', 'zh-CN'); // '17:30'
datetime('2026-11-16T09:30:00Z', 'CST').zone; // 'Asia/Shanghai'
```

:::warning[切勿用宽松模式直接解析含 CST 的日志]
在 `{ loose: true }` 字符串中，引擎原生解析器会绕过别名并将 CST 当作北美中部时间，导致结果偏移 14 小时。解析前请先裁掉末尾缩写，再显式传入 `'Asia/Shanghai'`。
:::

## 大中华区与新加坡的地区差异

中国大陆、香港、澳门、台湾与新加坡在默认小时制、短日期顺序、星期用字和每周起始日上各不相同：

| 区域标签 | 短日期 | 每周起始日 | 默认小时制与星期习惯 |
|---|---|---|---|
| `zh-CN` | `2026/11/16` | 周一 | 默认 24 小时制，星期简称写作 `周一` 至 `周日`。 |
| `zh-TW` | `2026/11/16` | 週日 | 默认 12 小时制并冠以 `上午` 或 `下午`，星期简称写作 `週一`。 |
| `zh-HK` | `16/11/2026` | 週日 | 默认 12 小时制，采用英式日月年短日期，澳门同此惯例。 |
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

周日当天在中国大陆归入上一周末尾，而在台港澳与新加坡则是新一周的起点。跨地区周报或统计键请向 `startOf()` 显式传入 `'monday'`：

```js
import { date } from 'native-dates';

const sunday = date('2026-11-15');
sunday.locale('zh-CN').range('week').toString(); // '2026-11-09/2026-11-15'
sunday.locale('zh-HK').range('week').toString(); // '2026-11-15/2026-11-21'
sunday.locale('zh-HK').startOf('week', 'monday').toString(); // '2026-11-09'
```

简体中文下，`'Ah:mm'` 输出标准的上午或下午标记，而 `dayPeriod: 'short'` 会细分出凌晨、早上、中午和晚上等自然时段：

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

## 中文格式模板与输入解析

格式模板只把拉丁字母当作占位符，年、月、日与中文标点可直接书写而无需方括号。短月份输出数字，`'MMMM'` 输出汉字月份，序数日自动附带日字，而补零日期须大写，避免误用输出单字星期的 `'dd'`：

```js
import { datetime } from 'native-dates';

const slot = datetime('2026-11-06T14:05:00+08:00', 'Asia/Shanghai').locale('zh-CN');
slot.format('YYYY年M月D日 ddd HH:mm'); // '2026年11月6日 周五 14:05'
slot.format('MMMDo / MMMMDo'); // '11月6日 / 十一月6日'
slot.format('dd / ddd / dddd'); // '五 / 周五 / 星期五'
slot.format('ddd', 'zh-TW'); // '週五'
```

核心工厂函数原生支持斜杠、句点及不补零的年月日字符串。[宽松解析插件](/plugins/loose/)遇到年月日汉字或全角冒号会返回 `null`，香港与新加坡的斜杠日期则需开启 `dayFirst: true`：

```js
import '@native-dates/plugins/loose';
import { date, datetime } from 'native-dates';

date('2026/1/5').toString(); // '2026-01-05'
datetime('2026.11.6 9:30', 'Asia/Shanghai').format('YYYY-MM-DD HH:mm');
// '2026-11-06 09:30'
date('2026年11月16日', { loose: true }); // null
date('16/11/2026', { loose: true, dayFirst: true }).toString(); // '2026-11-16'
```

处理用户粘贴的年月日文本时，先将汉字分隔符替换为连字符再传入 `date()`，即可复用核心库的大小月与闰年校验。

## 农历与民国纪年展示

格式化完整日期或时刻时传入 `'zh-CN-u-ca-chinese'`，预设样式会输出干支纪年、正月与闰月等传统农历表示。

模板占位符始终读取公历字段。由于 `YearMonth` 和 `MonthDay` 不含具体日期，传入农历标签会回退为公历，而与公历月份对齐的民国纪年可正常显示：

```js
import { date, yearMonth } from 'native-dates';

date('2026-02-17').format('long', 'zh-CN-u-ca-chinese'); // '2026丙午年正月初一'
date('2025-07-25').format('medium', 'zh-CN-u-ca-chinese'); // '2025年闰六月初一'
date('2026-02-17').format('YYYY-MM-DD', 'zh-CN-u-ca-chinese'); // '2026-02-17'
yearMonth('2026-02').format('long', 'zh-CN-u-ca-chinese'); // '2026年2月'
yearMonth('2026-11').format('long', 'zh-TW-u-ca-roc'); // '民國115年11月'
```

## 前天与后天的相对时间

`CalendarDate` 按整日历天计算，相差两天时返回前天和后天。`DateTime` 则按精确秒数计算，避免将 23 小时前算作昨天或将 46 小时前算作前天：

```js
import { date, datetime, today } from 'native-dates';

const base = date('2026-11-16');
date('2026-11-14').from(base, 'zh-CN'); // '前天'
date('2026-11-18').from(base, 'zh-CN'); // '后天'

const anchor = datetime('2026-11-16T12:00:00+08:00', 'Asia/Shanghai');
anchor.minus(2, 'days').from(anchor, 'zh-CN'); // '2天前'
date('2026-11-18').from(today('Asia/Shanghai'), 'zh-CN');
```

在 UTC 云服务器上，北京时间凌晨零点到早八点之间调用无参 `fromNow()` 会落入 UTC 前一天，请显式传入 `today('Asia/Shanghai')`。
