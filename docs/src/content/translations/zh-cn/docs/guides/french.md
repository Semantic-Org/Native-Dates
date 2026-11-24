---
source: "a214ff99444f"
title: 法语
lede: 兼容各法语地区的时间制与周起始日差异，格式化并解析法语日期。
---

裸标签 `'fr'` 采用法国本土习惯。如果你的用户位于加拿大、瑞士等其他法语地区，期望当地的日期顺序、时间分隔符和周起始日，应传入 `'fr-CA'` 这类带地区码的区域标签（详见[本地化](/guides/localization/)）。

## 地区变体

不同法语地区的短日期顺序、时间分隔符和周起始日各有不同：

| 区域 | 短格式 | 周起始日 | 地区差异 |
|---|---|---|---|
| `fr-FR`、`fr-SN`、`fr-MA` | `'01/11/2026 14:30'` | `1` — 周一 | 斜杠分隔、24 小时制，7 月简写为 `'juil.'`。 |
| `fr-CA` | `'2026-11-01 14 h 30'` | `7` — 周日 | 加拿大采用 ISO 日期顺序、带空格的 `'h'` 时间写法，7 月简写为 `'juill.'`。 |
| `fr-CH` | `'01.11.26 14:30'` | `1` — 周一 | 点号分隔，`'short'` 输出两位年份，`'L'` 输出四位年份。 |
| `fr-BE` | `'1/11/26 14:30'` | `1` — 周一 | `'short'` 中日号不补零且年份为两位，`'L'` 输出四位年份。 |
| `fr-DZ` | `'01/11/2026 2:30 PM'` | `6` — 周六 | 默认周六为周起始日，采用 12 小时制。 |

传入完整区域标签，预设即可按当地标点习惯输出：

```js
import { datetime } from 'native-dates';

const rdv = datetime('2026-11-01T14:30:00', 'Europe/Paris');

rdv.format('short', 'fr-FR'); // '01/11/2026 14:30'
rdv.format('short', 'fr-CA'); // '2026-11-01 14 h 30'
rdv.format('short', 'fr-CH'); // '01.11.26 14:30'
rdv.format('L', 'fr-CH'); // '01.11.2026'
```

加拿大法语以周日为一周起点，[`startOf('week')`](/api/calendar-date/#startof) 和 [`weekdayNames()`](/api/month-names/#weekdaynames) 会自动遵循该规则。若数据库报表需要按 ISO 周统计，显式固定为周一即可：

```js
import { date, weekdayNames } from 'native-dates';

const mercredi = date('2026-11-18');

mercredi.locale('fr-FR').startOf('week').toString(); // '2026-11-16'
mercredi.locale('fr-CA').startOf('week').toString(); // '2026-11-15'
weekdayNames('short', undefined, 'fr-CA')[0]; // 'dim.'
mercredi.locale('fr-CA').startOf('week', 'monday').toString(); // '2026-11-16'
```

## 法语排版习惯与格式占位符

在 `'HH[h]mm'` 这类占位符模板中，字面拉丁字母必须用方括号包裹。不加方括号直接写 `'HHhmm'` 会抛出 [`unknownFormat`](/api/errors/#units-zones-and-formats)，而独立的带重音字符 *à* 无需转义即可原样保留：

```js
import { datetime } from 'native-dates';

const depart = datetime('2026-11-01T14:30:00', 'Europe/Paris').locale('fr-FR');

depart.format('HH[h]mm'); // '14h30'
depart.format('[le] dddd D MMMM à HH[h]mm'); // 'le dimanche 1 novembre à 14h30'
```

法语将每月 1 日写作序数 *1er*，其余日期使用普通数字。只需为 `'fr'` 注册一条 [`ordinals`](/api/configure/) 规则，各法语地区标签便会自动继承：

```js
import { configure, date } from 'native-dates';

date('2026-11-01').format('long', 'fr-FR'); // '1 novembre 2026'

configure({ ordinals: { fr: (jour) => (jour === 1 ? '1er' : jour) } });
date('2026-11-01').format('Do MMMM YYYY', 'fr-FR'); // '1er novembre 2026'
date('2026-11-02').format('Do MMMM YYYY', 'fr-FR'); // '2 novembre 2026'
date('2026-11-01').format('Do MMMM YYYY', 'fr-CA'); // '1er novembre 2026'
```

法语正文中的星期和月份名称均为小写，仅当日期位于标题开头时再将首字母大写。

不要在 `MMM` 后手动补句点：需要缩写的月份名本身已带句点，而 *mars*、*mai*、*juin*、*août* 等短月名则不加句点：

```js
import { monthNames } from 'native-dates';

const s = date('2026-11-01').format('full', 'fr'); // 'dimanche 1 novembre 2026'
s[0].toUpperCase() + s.slice(1); // 'Dimanche 1 novembre 2026'
monthNames('short', 'fr-FR').slice(4, 8); // ['mai', 'juin', 'juil.', 'août']
monthNames('short', 'fr-CA').slice(4, 8); // ['mai', 'juin', 'juill.', 'août']
```

## 解析法语日期与时钟时间

核心库原生支持加拿大 ISO 日期字符串以及 `'14h30'` 这类法语小时-分钟格式。加载 [loose 插件](/plugins/loose/)后，法语区域可自动解析日-月-年斜杠日期、点号日期、序数与完整文字日期：

```js
import '@native-dates/plugins/loose';
import { date, datetime, time } from 'native-dates';

time('14h30').toString(); // '14:30:00'
time('14 h 30').toString(); // '14:30:00'
date('06/11/2026', { loose: true, locale: 'fr' })?.toString(); // '2026-11-06'
date('14.07.2026', { loose: true, locale: 'fr' })?.toString(); // '2026-07-14'
date('1er mai 2026', { loose: true, locale: 'fr' })?.toString(); // '2026-05-01'
date('6 juil 2026', { loose: true, locale: 'fr' })?.toString(); // '2026-07-06'
date('6 jui 2026', { loose: true, locale: 'fr' }); // null
datetime('lundi 16 novembre 2026 à 14h30', {
  loose: true,
  locale: 'fr',
  zone: 'Europe/Paris',
})?.hour; // 14
```

月份缩写必须能唯一确定某个月份：*juil* 可以明确解析为 7 月，而 *jui* 同时是 *juin*（6 月）和 *juillet*（7 月）的前缀，因此返回 `null`。

宽松模式下，部分日期同样可匹配法语月份名及带重音符号的缩写。[`dayMonth()`](/api/month-day-fn/#daymonth) 与 [`duration()`](/api/duration-fn/) 则直接内置于核心库，无需插件：

```js
import { dayMonth, duration, monthDay, yearMonth } from 'native-dates';

dayMonth('14/07').toString(); // '07-14'
monthDay('1er mai', { loose: true, locale: 'fr' })?.toString(); // '05-01'
yearMonth('févr. 2026', { loose: true, locale: 'fr' })?.toString(); // '2026-02'
duration('2h 30m').toString(); // 'PT2H30M'
```

## 时区

北美春季进入夏令时比欧洲早两到三周，秋季退出时又晚一周，这会让巴黎与蒙特利尔的时差短暂从 6 小时缩短到 5 小时。

摩洛哥还会在斋月期间回调至 UTC+0，因此跨时区转换务必使用 [`in()`](/api/date-time/#in)，不要手动加减固定小时数：

```js
import { date } from 'native-dates';

const hiver = date('2026-01-15').at('15:00', 'Europe/Paris');
const mars = date('2026-03-16').at('15:00', 'Europe/Paris');

hiver.in('America/Montreal').format('short', 'fr-CA'); // '2026-01-15 09 h 00'
mars.in('America/Montreal').format('short', 'fr-CA'); // '2026-03-16 10 h 00'
```

加载 [zones 插件](/plugins/zones/)后，主要法语城市及加拿大时区缩写可直接解析，无需额外别名：

```js
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'Montréal').zone; // 'America/Montreal'
datetime('2026-11-16T09:30', 'Bruxelles').zone; // 'Europe/Brussels'
datetime('2026-11-16T09:30', 'Genève').zone; // 'Europe/Zurich'
datetime('2026-11-16T09:30', 'HNE').zone; // 'America/Toronto'
```

## 相对日期与不换行空格

日历日期的前天返回 *avant-hier*，后天返回 *après-demain*；[`DateTime`](/api/date-time/) 则按精确时间单位计数，确保深夜相隔数小时不会被误读为昨天。

编写测试断言时，请注意 *aujourd’hui*（今天）使用弯撇号，短格式时长内部包含窄不换行空格（`\u202f`）和标准不换行空格（`\u00a0`）：

```js
import { date, datetime, duration } from 'native-dates';

const ref = date('2026-11-10');

ref.minus(2, 'days').from(ref, 'fr-FR'); // 'avant-hier'
ref.from(ref, 'fr-FR'); // 'aujourd’hui'
ref.plus(2, 'days').from(ref, 'fr-FR'); // 'après-demain'
datetime('2026-11-09T14:00Z').from('2026-11-10T14:00Z', 'fr-FR'); // 'il y a 1 jour'
duration({ hours: 3, minutes: 15 }).format('short', 'fr-FR');
// '3\u202fh et 15\u00a0min'
```
