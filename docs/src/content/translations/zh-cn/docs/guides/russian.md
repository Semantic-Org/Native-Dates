---
source: "621cb0fa9e99"
title: 俄语
lede: 在俄语中格式化带变格的月份与复数单位，并解析点号日期和地区时区。
---

传入 `'ru'` 即可按俄语规则格式化日期（详见[本地化](/guides/localization/)）。内置的 `Intl` 数据开箱即支持月份格位变化与三种时长复数形式，无需任何语言包。

## 月份变格与“г.”年份后缀

预设格式会在月份紧邻日期数字时使用属格，在独立年月中保留主格，并在年份后附带 *г.*（年）后缀：

```js
import { date, yearMonth } from 'native-dates';

const release = date('2026-11-16').locale('ru');

release.format('long'); // '16 ноября 2026 г.'
release.format('medium'); // '16 нояб. 2026 г.'
yearMonth('2026-11').format('long', 'ru'); // 'ноябрь 2026 г.'
```

自定义占位符模板会省略 *г.*，更适合紧凑的界面标签。紧跟在日期占位符之后，`MMMM` 和 `MMM` 会自动从主格 *май*（5 月）切换为属格 *мая*：

```js
const may = date('2026-05-06').locale('ru');

may.format('MMMM YYYY'); // 'май 2026'
may.format('D MMMM YYYY'); // '6 мая 2026'
may.format('D MMM'); // '6 мая'
date('2026-03-08').format('D MMM', 'ru'); // '8 мар.'
```

即使在日期与月份之间插入 `-го` 这类字面词尾（无论是否加方括号），`MMMM` 仍会保持属格变格：

```js
may.format('D-го MMMM'); // '6-го мая'
```

## 星期、小写名称与日期数字

俄语中的月份和星期名称均使用小写，每周从周一开始（`weekStart` 为 `1`）。

由于俄语中多个星期的单字母首字重合，窄格式与短格式都会返回两字母缩写，从周一到周日依次为 *пн* 至 *вс*：

```js
import { date, weekdayNames } from 'native-dates';

weekdayNames('narrow', undefined, 'ru');
// ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']
date('2026-11-16').format('dddd, D MMMM', 'ru'); // 'понедельник, 16 ноября'
```

俄语日期数字后不加句点，因此 `Do` 输出纯数字。如需自定义序数词尾或首字母大写的星期名，可在 [`configure()`](/api/configure/) 中配置：

```js
import { configure, date } from 'native-dates';

configure({
  weekdayNames: { ru: { short: { mon: 'Пн', fri: 'Пт' } } },
  ordinals: { ru: (day) => `${day}-е` },
});

date('2026-11-16').format('ddd, Do MMMM', 'ru'); // 'Пн, 16-е ноября'
```

## 时长复数与相对日期

俄语复数按末尾数字分为三类：1 和 21、2 到 4，以及 5 到 20 等其余数字。格式化 [`Duration`](/api/duration/) 时会自动选择对应词形：

```js
import { days, duration } from 'native-dates';

days(1).format('long', 'ru'); // '1 день'
days(2).format('long', 'ru'); // '2 дня'
days(5).format('long', 'ru'); // '5 дней'
days(21).format('long', 'ru'); // '21 день'
duration({ days: 2, hours: 5, minutes: 21 }).format('long', 'ru');
// '2 дня 5 часов 21 минута'
```

在 [`DateTime`](/api/date-time/) 上，[`from()`](/api/date-time/#from) 按经过的小时与分钟计数，因此午夜前 22 小时仍保持数字表达。

在 [`CalendarDate`](/api/calendar-date/) 上，它按日历天数比较，前天和后天会分别返回自然词汇 *позавчера* 和 *послезавтра*：

```js
import { date, datetime } from 'native-dates';

const day = date('2026-11-16').locale('ru');
day.minus(2, 'days').from(day); // 'позавчера'
day.minus(1, 'day').from(day); // 'вчера'
day.plus(2, 'days').from(day); // 'послезавтра'

const moment = datetime('2026-11-16T12:00:00Z', 'Europe/Moscow').locale('ru');
moment.minus(1, 'minute').from(moment); // '1 минуту назад'
moment.plus(2, 'days').from(moment); // 'через 2 дня'
```

## 解析点号日期与俄语月份名称

核心库直接支持年-月-日顺序的 `'2026.11.16'`。加载 [loose 插件](/plugins/loose/)后，俄语区域可自动解析日-月-年点号日期、带变格的月份名以及 *г.* 年份后缀：

```js
import '@native-dates/plugins/loose';
import { date, datetime } from 'native-dates';

date('16.11.2026', { loose: true, locale: 'ru' })?.toString(); // '2026-11-16'
date('06.11.2026', { loose: true, locale: 'ru' })?.toString(); // '2026-11-06'
date('16 ноября 2026 г.', { loose: true, locale: 'ru' })?.toString(); // '2026-11-16'
datetime('16.11.2026, 14:30', {
  zone: 'Europe/Moscow',
  locale: 'ru',
  loose: true,
})?.hour; // 14
```

核心库可直接读取点号分隔的日-月和月-年组合。宽松模式在部分日期上同时匹配主格与属格俄语月份名：

```js
import { dayMonth, monthDay, monthYear, yearMonth } from 'native-dates';

dayMonth('06.11').toString(); // '11-06'
monthYear('11.2026').toString(); // '2026-11'
monthDay('16 ноября', { loose: true, locale: 'ru' })?.toString(); // '11-16'
yearMonth('ноябрь 2026 г.', { loose: true, locale: 'ru' })?.toString(); // '2026-11'
```

## 俄罗斯及周边国家时区

俄罗斯横跨 11 个时区且无夏令时切换，哈萨克斯坦也已于 2024 年统一为 UTC+5。使用完整 IANA 时区标识可保留所有地区的历史偏移变更记录。

加载 [zones 插件](/plugins/zones/)后，IANA 城市、俄罗斯和哈萨克斯坦主要枢纽城市以及莫斯科缩写均可直接解析，无需配置别名：

| 输入 | 默认支持情况 | 解析说明 |
|---|---|---|
| `'Europe/Moscow'`、`'Asia/Almaty'` | 核心库支持 | 完整 IANA 标识开箱即用，并保留历史偏移规则。 |
| `'Moscow'`、`'Yekaterinburg'`、`'Minsk'` | 需加载插件 | 加载 `zones` 插件后，IANA 标识中的城市名可不区分大小写匹配。 |
| `'MSK'`、`'мск'`、`'SPB'`、`'Kazan'`、`'Astana'` | 需加载插件 | 内置支持地区缩写、常见别称与西里尔字母写法。 |

```js
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T12:00:00Z', 'MSK').format('HH:mm', 'ru'); // '15:00'
datetime('2026-11-16T12:00:00Z', 'мск').zone; // 'Europe/Moscow'
datetime('2026-11-16T12:00:00Z', 'SPB').zone; // 'Europe/Moscow'
datetime('2026-11-16T12:00:00Z', 'Astana').offset; // '+05:00'
datetime('16 ноября 2026 14:30 мск', {
  loose: true,
  locale: 'ru',
  zone: 'UTC',
})?.toString(); // '2026-11-16T11:30:00.000Z'
```
