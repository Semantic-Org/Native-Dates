---
source: "e095c0bff2bd"
title: Japonés
lede: Formatea eras imperiales y días entre paréntesis en japonés, interpreta fechas con barras y trabaja con semanas que empiezan en domingo.
---

Usa `'ja-JP'` como locale para formatear fechas en japonés (consulta [Localización](/guides/localization/)). Los años gregorianos se mantienen por defecto, y `'ja-u-ca-japanese'` cambia los presets a eras imperiales cuando lo necesites.

## Eras imperiales y primer año de era

Pasa `'ja-u-ca-japanese'` para formatear fechas imperiales oficiales, como Heisei 31 el 30 de abril de 2019 y el primer año *元年* de Reiwa al día siguiente:

```js
import { date } from 'native-dates';

date('2019-04-30').format('long', 'ja-u-ca-japanese'); // '平成31年4月30日'
date('2019-05-01').format('long', 'ja-u-ca-japanese'); // '令和元年5月1日'
date('2026-11-16').format('short', 'ja-u-ca-japanese'); // 'R8/11/16'
date('2026-11-16').format('llll', 'ja-u-ca-japanese'); // '令和8年11月16日(月)'
```

Los patrones de tokens como `'YYYY年M月D日'` y la propiedad `year` siempre leen años gregorianos, incluso con un locale de calendario imperial. Usa presets u objetos de opciones cuando quieras mostrar nombres de era:

```js
const reiwa = date('2026-11-16').locale('ja-u-ca-japanese');

reiwa.year; // 2026
reiwa.format('long'); // '令和8年11月16日'
reiwa.format('YYYY年M月D日'); // '2026年11月16日'
```

[`YearMonth`](/api/year-month/) no tiene día y formatea con la era vigente el día 1. Para transiciones a mitad de mes, como enero de 1989 de Showa 64 a Heisei 1, fija antes un día con [`on()`](/api/year-month/#on):

```js
import { yearMonth } from 'native-dates';

const jan1989 = yearMonth('1989-01');

jan1989.format('long', 'ja-u-ca-japanese'); // '昭和64年1月'
jan1989.on(8).format('long', 'ja-u-ca-japanese'); // '平成元年1月8日'
```

## Días entre paréntesis y formato de 12 horas

Los presets estándar en japonés varían en sus separadores y en el estilo del día de la semana:

| Preset | Salida | Estilo y uso habitual |
|---|---|---|
| `'medium'` | `'2026/11/16'` | Notación compacta con barras para tablas y campos de formulario. |
| `'long'` | `'2026年11月16日'` | Fecha estándar en kanji (año, mes y día) sin día de la semana. |
| `'full'` | `'2026年11月16日月曜日'` | Añade el día completo, como *月曜日* (lunes), sin espacios ni paréntesis. |
| `'llll'` | `'2026年11月16日(月)'` | Estilo habitual de interfaz con un solo kanji (*月*) entre paréntesis de ancho medio. |

El token `'ddd'` devuelve el kanji del día sin adornos (como *月*), lo que permite rodearlo con paréntesis de ancho completo. Los tokens largos de mes y ordinales de día ya añaden *月* y *日*, así que combina tokens numéricos de mes y día con kanji literales:

```js
import { date } from 'native-dates';

const day = date('2026-11-16').locale('ja-JP');

day.format('YYYY年M月D日（ddd）'); // '2026年11月16日（月）'
day.format('MMMMDo(ddd)'); // '11月16日(月)'
day.format({ month: 'long', day: 'numeric', weekday: 'short' }); // '11月16日(月)'
```

El reloj por defecto es de 24 horas. Pasa `hour12: true` para la notación japonesa desde 0 (*午前0:30* y *午後0:30*), o usa `'Ah:mm'` para contar del 1 al 12:

```js
import { datetime } from 'native-dates';

const midnight = datetime('2026-11-16T00:30', 'Asia/Tokyo').locale('ja-JP');

midnight.format('time'); // '0:30'
midnight.format({ hour: 'numeric', minute: '2-digit', hour12: true }); // '午前0:30'
midnight.format('Ah:mm'); // '午前12:30'
```

## Notación con barras y entradas en japonés

Las fechas en orden año-mes-día con kanji, barras o puntos procedentes de archivos CSV y formularios japoneses se interpretan directamente en el núcleo sin plugins:

```js
import { date, datetime, yearMonth } from 'native-dates';

date('2026年11月16日').toString(); // '2026-11-16'
date('2026/1/5').toString(); // '2026-01-05'
datetime('2026年11月16日 9:30', 'Asia/Tokyo').toString(); // '2026-11-16T00:30:00.000Z'
yearMonth('2026年11月').toString(); // '2026-11'
```

Con [el plugin loose](/plugins/loose/), los dígitos y signos de puntuación de ancho completo, las horas con *午前* / *午後* y los pares mes-día en kanji se interpretan sin normalización manual:

```js
import '@native-dates/plugins/loose';
import { date, monthDay, time } from 'native-dates';

date('２０２６／１１／１６', { loose: true })?.toString(); // '2026-11-16'
time('午後2:30', { loose: true, locale: 'ja' })?.toString(); // '14:30:00'
monthDay('11月16日', { loose: true })?.toString(); // '11-16'
```

Las cadenas con era como `'令和8年11月16日'` requieren todavía entrada estructurada. Cuando un formulario recoge la era y el año por separado, pasa un `Temporal.PlainDate` japonés directamente a [`date()`](/api/date-fn/) sin convertir calendarios antes:

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

## Zonas horarias e inicio de semana

El núcleo acepta `'Asia/Tokyo'` y desplazamientos fijos. Con [el plugin zones](/plugins/zones/), JST y las principales ciudades japonesas se resuelven de serie:

```js
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'JST').zone; // 'Asia/Tokyo'
datetime('2026-11-16T09:30', 'Osaka').zone; // 'Asia/Tokyo'
datetime('2026-11-16T09:30', '東京').zone; // 'Asia/Tokyo'
```

Los locales japoneses inician la semana en domingo, como los calendarios de pared. Pasa `'monday'` o fija `weekStart` cuando construyas horarios laborales que empiecen en lunes:

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

## Rangos y expresiones relativas

Los presets de rango unen fechas con barras u horas en kanji mediante una virgulilla de ancho completo. Pasa un patrón de tokens a [`format()`](/api/ranges/#format) cuando ambos extremos necesiten fechas en kanji y días de la semana:

```js
import { dateRange, timeRange } from 'native-dates';

const span = dateRange('2026-11-16', '2026-11-20').locale('ja-JP');

span.format('long'); // '2026/11/16～2026/11/20'
span.format('M月D日(ddd)'); // '11月16日(月) – 11月20日(金)'
timeRange('09:00', '17:30').format('short', 'ja-JP'); // '9時00分～17時30分'
```

[`CalendarDate`](/api/calendar-date/) devuelve expresiones propias hasta *一昨日* (anteayer) y *明後日* (pasado mañana). [`DateTime`](/api/date-time/) devuelve siempre unidades contadas para que una diferencia en horas nunca se confunda con días de calendario:

```js
import { date, datetime, duration } from 'native-dates';

const baseDate = date('2026-11-16').locale('ja-JP');
baseDate.minus(2, 'days').from(baseDate); // '一昨日'
baseDate.plus(2, 'days').from(baseDate); // '明後日'

const baseTime = datetime('2026-11-16T12:00', 'Asia/Tokyo').locale('ja-JP');
baseTime.minus(1, 'day').from(baseTime); // '1 日前'
duration({ hours: 2, minutes: 30 }).format('long', 'ja-JP'); // '2 時間 30 分'
```

:::tip[Espacios y punto de código de la virgulilla de ancho completo]
Las cadenas relativas y de duración en japonés insertan espacios de ancho medio alrededor de los números según los datos estándar del motor. Los presets de rango emiten la virgulilla de ancho completo `U+FF5E` en lugar del guion ondulado `U+301C`, así que comprueba el punto de código en tus pruebas.
:::
