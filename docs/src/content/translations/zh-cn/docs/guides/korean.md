---
source: "1ff5dd8e887b"
title: 韩语
lede: 解析韩语点号日期，并格式化括号星期、上下午时段与农历节日。
---

传入 `'ko-KR'` 即可按韩语规则格式化日期（详见[本地化](/guides/localization/)）。韩语预设会在数字之间使用带空格的点号并以句点收尾（如 `'2026. 11. 16.'`），并将 *오전*（上午）或 *오후*（下午）置于小时之前。

## 点号日期与韩文字符串

带空格与末尾句点的韩语点号日期以及韩文单位字符串均可由核心库直接解析，无需任何插件：

```js
import { date, datetime, yearMonth } from 'native-dates';

date('2026. 11. 16.').toString(); // '2026-11-16'
date('2026년 11월 16일').toString(); // '2026-11-16'
datetime('2026. 11. 16. 14:30', 'Asia/Seoul').toString(); // '2026-11-16T05:30:00.000Z'
yearMonth('2026년 11월').toString(); // '2026-11'
```

加载 [loose 插件](/plugins/loose/)并指定韩语区域标签，即可读取两位年份开头的短日期、*오전* / *오후* 时钟时间以及韩文月日：

```js
import '@native-dates/plugins/loose';
import { date, monthDay, time } from 'native-dates';

date('26. 5. 5.', { loose: true, locale: 'ko' })?.toString(); // '2026-05-05'
date('12.11.26', { loose: true, locale: 'ko' })?.toString(); // '2012-11-26'
time('오후 2:30', { loose: true, locale: 'ko' })?.toString(); // '14:30:00'
monthDay('11월 16일', { loose: true })?.toString(); // '11-16'
```

解析两位年份时务必传入 `locale: 'ko'`，因为在美式英语运行时中 `'12.11.26'` 会被解读为 2026 年 12 月 11 日：

| 输入 | 解析方式 | 处理说明 |
|---|---|---|
| `'2026. 11. 16.'`、`'2026년 11월 16일'` | 核心库直接解析 | 直接传入即可，无需插件。 |
| `'26. 5. 5.'`、`'12.11.26'`、`'오후 2:30'` | 宽松模式解析 | 导入 `loose` 插件并传入 `{ loose: true, locale: 'ko' }`。 |

## 括号星期与上下午顺序

`'full'` 预设输出完整星期名（如 *화요일* 表示周二）。`'llll'` 和短星期选项会用括号包裹单字星期，并用波浪号连接日期范围：

```js
import { date, dateRange } from 'native-dates';

const holiday = date('2026-05-05').locale('ko-KR');

holiday.format('llll'); // '2026년 5월 5일 (화)'
holiday.format({ month: 'long', day: 'numeric', weekday: 'short' });
// '5월 5일 (화)'

const week = dateRange('2026-11-16', '2026-11-20');
week.format({ month: 'long', day: 'numeric', weekday: 'short' }, 'ko-KR');
// '11월 16일 (월)~20일 (금)'
```

韩文字符在占位符模板中无需方括号转义。短月份和序数日占位符已自带 *월*（月）和 *일*（日），`'ddd'` 则输出单字星期：

```js
import { datetime } from 'native-dates';

const slot = datetime('2026-05-05T14:05:00', 'Asia/Seoul').locale('ko-KR');

slot.format('YYYY. MM. DD. (ddd)'); // '2026. 05. 05. (화)'
slot.format('YYYY년 M월 D일 A h시 m분'); // '2026년 5월 5일 오후 2시 5분'
slot.format('MMM Do (dd)'); // '5월 5일 (화)'
```

韩语习惯将 *오전*（上午）和 *오후*（下午）放在小时数字之前。传入 `'ko-KR-u-hc-h23'` 可将默认的 12 小时制预设切换为 24 小时制：

```js
slot.format('medium'); // '2026. 5. 5. 오후 2:05'
slot.format('medium', 'ko-KR-u-hc-h23'); // '2026. 5. 5. 14:05'
```

## 韩国标准时间与时区别名

核心库原生支持 `'Asia/Seoul'` 与固定偏移量。导入 [zones 插件](/plugins/zones/)后，开箱即可解析 `KST`、釜山（Busan）等韩国城市以及韩文地名，并支持宽松字符串中的内联缩写：

```js
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T14:30', 'KST').zone; // 'Asia/Seoul'
datetime('2026-11-16T14:30', '서울').zone; // 'Asia/Seoul'
datetime('2026-11-16T14:30', 'Busan').zone; // 'Asia/Seoul'
datetime('2026. 11. 16. 14:30 KST', { loose: true, zone: 'UTC' })?.toString();
// '2026-11-16T05:30:00.000Z'
```

短格式韩语时区输出 `GMT+9`，`'zzz'` 则输出完整韩文名称 *한국 표준시*（韩国标准时间）。由于 UTC 服务器在韩国时间上午 8:59 之前仍停留在前一天，服务端调用 [`today()`](/api/date-fn/#today) 时请显式传入首尔时区：

```js
import { datetime, today } from 'native-dates';

const meeting = datetime('2026-11-16T05:30:00Z', 'Asia/Seoul').locale('ko-KR');

meeting.text; // '2026년 11월 16일 오후 2:30 GMT+9'
meeting.format('A h:mm zzz'); // '오후 2:30 한국 표준시'
today('Asia/Seoul');
```

## 周日起始日历与周一起始工作周

`'ko-KR'` 遵循挂历习惯以周日为一周起点，而韩国的工作周、结算周期以及 ISO `weekOfYear` 均从周一开始计算：

```js
import { date, weekdayNames } from 'native-dates';

const sun = date('2026-11-15').locale('ko-KR');

sun.weekStart; // 7
sun.startOf('week').toString(); // '2026-11-15'
sun.weekOfYear; // 46
weekdayNames('short', undefined, 'ko-KR');
// ['일', '월', '화', '수', '목', '금', '토']
weekdayNames('short', 'monday', 'ko-KR');
// ['월', '화', '수', '목', '금', '토', '일']
```

你可以按次传入 `'monday'`、在 [`configure()`](/api/configure/) 中固定周起始日，或使用 `'ko-KR-u-fw-mon'` 在保留韩文文案的同时采用周一起始：

```js
const wed = date('2026-11-18').locale('ko-KR-u-fw-mon');

wed.weekStart; // 1
wed.startOf('week').toString(); // '2026-11-16'
```

## 相对日期与农历节日

韩语日历日期的前天返回 *그저께*，后天返回 *모레*。[`DateTime`](/api/date-time/) 在差值为 0 秒时返回 *지금*（现在），其余情况则输出计数单位：

```js
import { date, datetime } from 'native-dates';

const day = date('2026-11-16').locale('ko-KR');
day.minus(2, 'days').from(day); // '그저께'
day.plus(2, 'days').from(day); // '모레'

const moment = datetime('2026-11-16T12:00', 'Asia/Seoul').locale('ko-KR');
moment.minus(2, 'days').from(moment); // '2일 전'
```

传入 `'ko-KR-u-ca-dangi'` 可格式化春节、秋夕（中秋）与农历生日，并自动输出闰月（如 *윤6월* 表示闰六月）。短预设会输出 1–60 的干支序号而非年份，因此建议优先使用 `'long'` 或月日选项对象：

```js
const chuseok = date('2026-09-25');
const leapDay = date('2025-07-25');

chuseok.format('long', 'ko-KR-u-ca-dangi'); // '병오년 8월 15일'
chuseok.format({ month: 'long', day: 'numeric' }, 'ko-KR-u-ca-dangi'); // '8월 15일'
leapDay.format('long', 'ko-KR-u-ca-dangi'); // '을사년 윤6월 1일'
```

:::tip[格式化周期性农历日期]
即使传入农历区域标签，[`MonthDay`](/api/month-day/) 和 [`YearMonth`](/api/year-month/) 也始终保持公历。格式化农历生日和节日时，请从当年的公历 [`CalendarDate`](/api/calendar-date/) 出发。
:::
