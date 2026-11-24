---
source: "7c459605683f"
title: 西班牙语
lede: 覆盖西班牙与美洲各地，处理西班牙语日期格式、时间制与夏令时差异。
---

裸标签 `'es'` 采用西班牙本土以周一为起点的一周与 24 小时制。面向拉丁美洲或美国用户的应用应传入 `'es-MX'` 这类带地区码的区域标签（详见[本地化](/guides/localization/)）。

## 西班牙、拉丁美洲与美国

西班牙采用 24 小时制；拉丁美洲与美国西班牙语采用 12 小时制，且各地在 AM/PM 空格、日期分隔符上各有不同（秘鲁还将 9 月拼作 *setiembre*）：

```js
import { datetime } from 'native-dates';

const cita = datetime('2026-09-16T17:30:00', 'UTC');

cita.format('medium', 'es-ES'); // '16 sept 2026, 17:30'
cita.format('medium', 'es-MX'); // '16 sep 2026, 5:30 p.m.'
cita.format('medium', 'es-AR'); // '16 sept 2026, 5:30 p. m.'
cita.format('medium', 'es-CO'); // '16/09/2026, 5:30 p. m.'
cita.format('long', 'es-PE'); // '16 de setiembre de 2026 a las 5:30 p. m.'
cita.date.format('short', 'es-PR'); // '09/16/26'
```

西班牙语世界的周起始日也存在分歧。通用的 `'es-419'` 标签从周一开始，这与墨西哥和哥伦比亚的周日起始习惯不同：

| 标签 | 周起始日与时间 | 地区习惯 |
|---|---|---|
| `'es'`、`'es-ES'` | `1`、`17:30` | 周一起始、24 小时制，9 月简写为 *sept*。 |
| `'es-MX'`、`'es-US'` | `7`、`5:30 p.m.` | 周日起始，12 小时制标记不带空格。 |
| `'es-AR'`、`'es-CL'` | `1`、`5:30 p. m.` | 周一起始，12 小时制标记带空格；智利短日期使用连字符。 |
| `'es-CO'`、`'es-PE'` | `7`、`5:30 p. m.` | 周日起始，哥伦比亚 `'medium'` 预设为纯数字日期，秘鲁使用 *setiembre*。 |
| `'es-PR'` | `7`、`5:30 p. m.` | 周日起始，数字日期采用美式月/日/年顺序。 |

按周生成数据库报表时，使用 [`startOf('week', 'monday')`](/api/calendar-date/#startof) 固定从周一开始，确保马德里和墨西哥城的数据落入同一分组：

```js
import { date } from 'native-dates';

const wed = date('2026-11-18');

wed.locale('es-ES').startOf('week').toString(); // '2026-11-16'
wed.locale('es-MX').startOf('week').toString(); // '2026-11-15'
wed.locale('es-MX').startOf('week', 'monday').toString(); // '2026-11-16'
```

## 介词、小写名称与星期写法

西班牙语长日期使用 *de*、*del* 和 *a las* 连接各部分。在占位符模板中必须用方括号包裹字面连接词，避免裸字母触发 [`unknownFormat`](/api/errors/#units-zones-and-formats) 错误：

```js
import { datetime } from 'native-dates';

const ev = datetime('2026-11-16T18:30:00', 'Europe/Madrid').locale('es-ES');

ev.format('D [de] MMMM [de] YYYY'); // '16 de noviembre de 2026'
ev.format('dddd, D [de] MMMM [a las] HH:mm');
// 'lunes, 16 de noviembre a las 18:30'
```

西班牙语中的月份、星期以及 AM/PM 标记均为小写。仅当格式化后的日期位于标题开头时，再将首字符转为大写。

单字母窄星期中，*martes*（周二）和 *miércoles*（周三）均缩写为 *M*。两字母的 `'dd'` 开箱即可避免冲突，也可以通过 [`configure()`](/api/configure/) 自定义周三缩写或每月 1 日的序数 *1.º*：

```js
import { configure, date, weekdayNames } from 'native-dates';

const s = date('2026-05-01').format('full', 'es'); // 'viernes, 1 de mayo de 2026'
s[0].toUpperCase() + s.slice(1); // 'Viernes, 1 de mayo de 2026'
weekdayNames('narrow', 1, 'es-MX'); // ['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do']

configure({
  weekdayNames: { es: { narrow: { tue: 'M', wed: 'X' } } },
  ordinals: { es: (day) => (day === 1 ? '1.º' : day) },
});
date('2026-05-06').format('dd', 'es-MX'); // 'X'
date('2026-05-01').format('Do [de] MMMM', 'es-AR'); // '1.º de mayo'
```

## 解析西班牙语日期与月份

加载 [loose 插件](/plugins/loose/)后，纯数字日期会自动遵循当前区域顺序：西班牙和智利按日-月-年解析，波多黎各则按月-日-年解析：

```js
import '@native-dates/plugins/loose';
import { date, datetime, dayMonth, monthDay, time, yearMonth } from 'native-dates';

date('06/11/2026', { loose: true, locale: 'es' })?.toString(); // '2026-11-06'
date('16-09-2026', { loose: true, locale: 'es-CL' })?.toString(); // '2026-09-16'
date('06/11/2026', { loose: true, locale: 'es-PR' })?.toString(); // '2026-06-11'
```

完整文字日期、连接词、前置星期、秘鲁拼法 *setiembre* 以及带空格的 12 小时制时钟时间也均可在宽松模式下解析；纯数字的 [`dayMonth()`](/api/month-day-fn/#daymonth) 则内置于核心库，无需插件：

```js
date('16 de noviembre de 2026', { loose: true, locale: 'es' })?.toString(); // '2026-11-16'
date('mar, 16 jun 2026', { loose: true, locale: 'es' })?.toString(); // '2026-06-16'
datetime('el 16 de noviembre de 2026 a las 14:30', {
  loose: true,
  locale: 'es',
  zone: 'Europe/Madrid',
})?.hour; // 14
time('5:30 p. m.', { loose: true, locale: 'es-MX' })?.toString(); // '17:30:00'
dayMonth('16/11').toString(); // '11-16'
monthDay('16 set.', { loose: true, locale: 'es-PE' })?.toString(); // '09-16'
yearMonth('enero de 2026', { loose: true, locale: 'es' })?.toString(); // '2026-01'
```

## 时区与午夜夏令时跳变

除北部边境城市和金塔纳罗奥州外，墨西哥大部分地区全年保持 `UTC-6`。`CST` 会按当前区域消歧：默认映射到芝加哥，在古巴（`'es-CU'`）则映射到哈瓦那：

```js
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-07-15T12:00', 'Mexico City').format('HH:mm Z'); // '12:00 -06:00'
datetime('2026-07-15T12:00', 'CST').format('HH:mm Z'); // '12:00 -05:00'
datetime('2026-07-15T12:00', { zone: 'CST', locale: 'es-CU' }).zone; // 'America/Havana'
datetime('2026-07-15T12:00', 'Tijuana').format('HH:mm Z'); // '12:00 -07:00'
```

[zones 插件](/plugins/zones/)开箱支持西班牙语主要城市与拉丁美洲时区代码。`San Juan` 在 `'es-PR'` 下解析为波多黎各，在其他区域下解析为阿根廷圣胡安：

```js
datetime('2026-07-15T12:00', 'CDMX').zone; // 'America/Mexico_City'
datetime('2026-07-15T12:00', 'COT').zone; // 'America/Bogota'
datetime('2026-07-15T12:00', 'San Juan').zone; // 'America/Argentina/San_Juan'
datetime('2026-07-15T12:00', { zone: 'San Juan', locale: 'es-PR' }).zone; // 'America/Puerto_Rico'
```

智利和古巴在午夜进入夏令时，时钟会直接从 `00:00` 跳至 `01:00`。调用 [`at('00:00', zone)`](/api/calendar-date/#at) 或 `startOf('day')` 会准确落到当天的 `01:00`：

```js
import { date } from 'native-dates';

const spring = date('2026-09-06').at('00:00', 'America/Santiago');

spring.format('YYYY-MM-DD HH:mm Z'); // '2026-09-06 01:00 -03:00'
spring.hoursInDay; // 23
```

## 相对时间

西班牙语为连续五天都设有专门词汇，从前天 *anteayer* 一直到后天 *pasado mañana*。[`CalendarDate`](/api/calendar-date/) 会返回这些自然词，而 [`DateTime`](/api/date-time/) 按经过的小时数计数：

```js
import { date, datetime, today } from 'native-dates';

const ref = date('2026-11-16');

ref.minus(2, 'days').from(ref, 'es'); // 'anteayer'
ref.plus(2, 'days').from(ref, 'es'); // 'pasado mañana'
datetime('2026-11-14T12:00Z').from('2026-11-16T12:00Z', 'es'); // 'hace 2 días'
date('2026-11-18').from(today('America/Bogota'), 'es-CO');
```

在共享服务器上，请传入 [`today(zone)`](/api/date-fn/#today) 而非无参 [`fromNow()`](/api/calendar-date/#fromnow)，确保 *hoy*（今天）与 *mañana*（明天）的午夜切换遵循用户本地时区。
