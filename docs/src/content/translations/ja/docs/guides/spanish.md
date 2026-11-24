---
source: "7c459605683f"
title: スペイン語
lede: スペインと中南米・米国の地域差を踏まえてスペイン語の日付や時刻表記を扱います。
---

単独の `'es'` はスペインの月曜始まり・24時間制に従います。中南米や米国向けのアプリでは、`'es-MX'` のような地域タグを指定してください（設定方法は[ローカライズ](/guides/localization/)を参照）。

## スペイン・中南米・米国の地域差

スペインでは24時間制が使われます。中南米や米国のスペイン語では12時間制が使われ、午前・午後記号のスペース有無、日付の区切り記号、ペルーの9月表記「setiembre」などに地域差があります。

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

週の開始曜日もスペイン語圏で分かれます。汎用タグの `'es-419'` は、メキシコやコロンビアとは異なり月曜始まりになります。

| タグ | 週の開始と時刻 | 地域の慣習 |
|---|---|---|
| `'es'`、`'es-ES'` | `1`、`17:30` | 月曜始まり、24時間制、9月の省略形は「sept」。 |
| `'es-MX'`、`'es-US'` | `7`、`5:30 p.m.` | 日曜始まり、スペースなしの午前・午後記号。 |
| `'es-AR'`、`'es-CL'` | `1`、`5:30 p. m.` | 月曜始まり、スペース付きの午前・午後記号（チリの短い日付はハイフン区切り）。 |
| `'es-CO'`、`'es-PE'` | `7`、`5:30 p. m.` | 日曜始まり、コロンビアの `'medium'` は数値形式、ペルーの9月は「setiembre」。 |
| `'es-PR'` | `7`、`5:30 p. m.` | 日曜始まり、米国式の月/日/年順数値表記。 |

週次のデータベース集計でマドリードとメキシコシティを同じ週キーにそろえるには、[`startOf('week', 'monday')`](/api/calendar-date/#startof) で月曜始まりを固定してください。

```js
import { date } from 'native-dates';

const wed = date('2026-11-18');

wed.locale('es-ES').startOf('week').toString(); // '2026-11-16'
wed.locale('es-MX').startOf('week').toString(); // '2026-11-15'
wed.locale('es-MX').startOf('week', 'monday').toString(); // '2026-11-16'
```

## 前置詞・小文字表記・曜日

スペイン語の長い日付は「de」「del」「a las」などの語句で要素をつなぎます。トークンパターンではリテラルの接続語を角括弧で囲んでください。囲まずに書くと [`unknownFormat`](/api/errors/#units-zones-and-formats) がスローされます。

```js
import { datetime } from 'native-dates';

const ev = datetime('2026-11-16T18:30:00', 'Europe/Madrid').locale('es-ES');

ev.format('D [de] MMMM [de] YYYY'); // '16 de noviembre de 2026'
ev.format('dddd, D [de] MMMM [a las] HH:mm');
// 'lunes, 16 de noviembre a las 18:30'
```

スペイン語では月名・曜日名・午前/午後記号をすべて小文字で書きます。フォーマット済みの日付を見出しの先頭に置く場合だけ、先頭の1文字を大文字にしてください。

1文字の曜日表記は「martes」（火曜）と「miércoles」（水曜）がどちらも「M」で重複します。2文字の `'dd'` なら既定で重複を避けられ、水曜を「X」にしたい場合や1日を「1.º」にしたい場合は [`configure()`](/api/configure/) でカスタマイズできます。

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

## スペイン語の日付と月名の解析

[loose プラグイン](/plugins/loose/)を読み込むと、数値日付の解釈はアクティブなロケールに自動で追従します。スペインとチリは日・月・年順で、プエルトリコは月・日・年順で解析されます。

```js
import '@native-dates/plugins/loose';
import { date, datetime, dayMonth, monthDay, time, yearMonth } from 'native-dates';

date('06/11/2026', { loose: true, locale: 'es' })?.toString(); // '2026-11-06'
date('16-09-2026', { loose: true, locale: 'es-CL' })?.toString(); // '2026-09-16'
date('06/11/2026', { loose: true, locale: 'es-PR' })?.toString(); // '2026-06-11'
```

月名を含む完全な日付、接続語、先頭の曜日、ペルーの「setiembre」、スペース入りの12時間制時刻も loose モードで解析できます。数値の [`dayMonth()`](/api/month-day-fn/#daymonth) はプラグインなしでコアから動作します。

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

## タイムゾーンと午前0時の夏時間切り替え

メキシコの大半の地域は、北部の国境都市とキンタナ・ロー州を除き通年 UTC-6 のままです。`CST` はアクティブなロケールに従い、既定ではシカゴ、キューバではハバナに解決されます。

```js
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-07-15T12:00', 'Mexico City').format('HH:mm Z'); // '12:00 -06:00'
datetime('2026-07-15T12:00', 'CST').format('HH:mm Z'); // '12:00 -05:00'
datetime('2026-07-15T12:00', { zone: 'CST', locale: 'es-CU' }).zone; // 'America/Havana'
datetime('2026-07-15T12:00', 'Tijuana').format('HH:mm Z'); // '12:00 -07:00'
```

[zones プラグイン](/plugins/zones/)はスペイン語圏の主要都市と中南米の略称を設定なしで解決します。`San Juan` は `'es-PR'` ではプエルトリコ、それ以外ではアルゼンチンに解決されます。

```js
datetime('2026-07-15T12:00', 'CDMX').zone; // 'America/Mexico_City'
datetime('2026-07-15T12:00', 'COT').zone; // 'America/Bogota'
datetime('2026-07-15T12:00', 'San Juan').zone; // 'America/Argentina/San_Juan'
datetime('2026-07-15T12:00', { zone: 'San Juan', locale: 'es-PR' }).zone; // 'America/Puerto_Rico'
```

チリとキューバは午前0時に夏時間（DST）が始まり、00:00 からそのまま 01:00 へ飛びます。[`at('00:00', zone)`](/api/calendar-date/#at) や `startOf('day')` を呼び出すと、同じ日付の 01:00 へ安全に解決されます。

```js
import { date } from 'native-dates';

const spring = date('2026-09-06').at('00:00', 'America/Santiago');

spring.format('YYYY-MM-DD HH:mm Z'); // '2026-09-06 01:00 -03:00'
spring.hoursInDay; // 23
```

## 相対時間

スペイン語には2日前の「anteayer」（一昨日）から2日後の「pasado mañana」（明後日）まで5日連続の語彙があります。[`CalendarDate`](/api/calendar-date/) はこれらの相対日付を返し、[`DateTime`](/api/date-time/) は経過時間で計算します。

```js
import { date, datetime, today } from 'native-dates';

const ref = date('2026-11-16');

ref.minus(2, 'days').from(ref, 'es'); // 'anteayer'
ref.plus(2, 'days').from(ref, 'es'); // 'pasado mañana'
datetime('2026-11-14T12:00Z').from('2026-11-16T12:00Z', 'es'); // 'hace 2 días'
date('2026-11-18').from(today('America/Bogota'), 'es-CO');
```

共有サーバー上では [`fromNow()`](/api/calendar-date/#fromnow) の代わりに [`today(zone)`](/api/date-fn/#today) を渡し、「hoy」（今日）と「mañana」（明日）の切り替わりがユーザーのタイムゾーンに従うようにしてください。
