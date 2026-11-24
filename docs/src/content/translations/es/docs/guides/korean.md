---
source: "1ff5dd8e887b"
title: Coreano
lede: Interpreta fechas coreanas con puntos y formatea días de la semana y festividades lunares.
---

Usa `'ko-KR'` como locale para formatear fechas en coreano (consulta [Localización](/guides/localization/)). Los presets coreanos imprimen puntos espaciados con punto final, como `'2026. 11. 16.'`, y anteponen *오전* u *오후* a la hora.

## Fechas con puntos y cadenas en coreano

Las fechas coreanas con puntos espaciados y punto final, así como las cadenas con unidades en hangul, se interpretan directamente en el núcleo sin plugins:

```js
import { date, datetime, yearMonth } from 'native-dates';

date('2026. 11. 16.').toString(); // '2026-11-16'
date('2026년 11월 16일').toString(); // '2026-11-16'
datetime('2026. 11. 16. 14:30', 'Asia/Seoul').toString(); // '2026-11-16T05:30:00.000Z'
yearMonth('2026년 11월').toString(); // '2026-11'
```

Importa [el plugin loose](/plugins/loose/) con un locale coreano para leer fechas cortas con el año de dos dígitos al principio, relojes con *오전* / *오후* y pares mes-día en hangul:

```js
import '@native-dates/plugins/loose';
import { date, monthDay, time } from 'native-dates';

date('26. 5. 5.', { loose: true, locale: 'ko' })?.toString(); // '2026-05-05'
date('12.11.26', { loose: true, locale: 'ko' })?.toString(); // '2012-11-26'
time('오후 2:30', { loose: true, locale: 'ko' })?.toString(); // '14:30:00'
monthDay('11월 16일', { loose: true })?.toString(); // '11-16'
```

Pasa `locale: 'ko'` siempre que interpretes años de dos dígitos, ya que `'12.11.26'` se interpreta como 11 de diciembre de 2026 en un entorno en inglés de Estados Unidos:

| Entrada | Resultado | Uso |
|---|---|---|
| `'2026. 11. 16.'`, `'2026년 11월 16일'` | Interpretado en el núcleo | Pásalo directamente sin plugin. |
| `'26. 5. 5.'`, `'12.11.26'`, `'오후 2:30'` | Interpretado en modo loose | Importa el plugin loose y pasa `{ loose: true, locale: 'ko' }`. |

## Días entre paréntesis y orden de AM/PM

El preset `'full'` imprime el nombre completo del día, como *화요일* (martes). `'llll'` y las opciones cortas de día colocan un solo carácter entre paréntesis y unen rangos con una virgulilla:

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

Los caracteres hangul pasan por los patrones de tokens sin corchetes. Los tokens cortos de mes y ordinales de día ya incluyen *월* e *일*, y `'ddd'` devuelve el día de la semana de un solo carácter:

```js
import { datetime } from 'native-dates';

const slot = datetime('2026-05-05T14:05:00', 'Asia/Seoul').locale('ko-KR');

slot.format('YYYY. MM. DD. (ddd)'); // '2026. 05. 05. (화)'
slot.format('YYYY년 M월 D일 A h시 m분'); // '2026년 5월 5일 오후 2시 5분'
slot.format('MMM Do (dd)'); // '5월 5일 (화)'
```

El coreano antepone *오전* (AM) y *오후* (PM) a la hora. Pasa `'ko-KR-u-hc-h23'` para cambiar los presets de 12 horas al reloj de 24 horas:

```js
slot.format('medium'); // '2026. 5. 5. 오후 2:05'
slot.format('medium', 'ko-KR-u-hc-h23'); // '2026. 5. 5. 14:05'
```

## Hora estándar de Corea y alias de zona

El núcleo acepta `'Asia/Seoul'` y desplazamientos fijos. Importa [el plugin zones](/plugins/zones/) para resolver de serie KST, ciudades coreanas como Busan y nombres en hangul, incluidas las abreviaturas dentro de cadenas en modo loose:

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

Las zonas coreanas en formato corto imprimen `GMT+9`, mientras que `'zzz'` muestra el nombre completo en coreano *한국 표준시*. Como los servidores en UTC siguen en el día anterior hasta las 8:59 en Corea, pasa `'Asia/Seoul'` a [`today()`](/api/date-fn/#today):

```js
import { datetime, today } from 'native-dates';

const meeting = datetime('2026-11-16T05:30:00Z', 'Asia/Seoul').locale('ko-KR');

meeting.text; // '2026년 11월 16일 오후 2:30 GMT+9'
meeting.format('A h:mm zzz'); // '오후 2:30 한국 표준시'
today('Asia/Seoul');
```

## Calendarios desde domingo y semanas laborales desde lunes

El locale `'ko-KR'` empieza la semana en domingo, como los calendarios de pared. Las semanas laborales coreanas, las liquidaciones y `weekOfYear` en estándar ISO cuentan desde el lunes:

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

Pasa `'monday'` en cada llamada, fija el primer día en la [configuración](/api/configure/) o usa `'ko-KR-u-fw-mon'` para mantener texto coreano con semanas iniciadas en lunes:

```js
const wed = date('2026-11-18').locale('ko-KR-u-fw-mon');

wed.weekStart; // 1
wed.startOf('week').toString(); // '2026-11-16'
```

## Fechas relativas y festividades lunares

Las fechas de calendario en coreano devuelven *그저께* para anteayer y *모레* para pasado mañana. [`DateTime`](/api/date-time/) devuelve *지금* cuando la diferencia es de cero segundos y unidades contadas en el resto de casos:

```js
import { date, datetime } from 'native-dates';

const day = date('2026-11-16').locale('ko-KR');
day.minus(2, 'days').from(day); // '그저께'
day.plus(2, 'days').from(day); // '모레'

const moment = datetime('2026-11-16T12:00', 'Asia/Seoul').locale('ko-KR');
moment.minus(2, 'days').from(moment); // '2일 전'
```

Pasa `'ko-KR-u-ca-dangi'` para Seollal, Chuseok y cumpleaños lunares, incluidos meses intercalares como *윤6월*. Los presets cortos imprimen el número del ciclo de 1 a 60 en lugar del año, así que usa `'long'` u opciones de mes y día:

```js
const chuseok = date('2026-09-25');
const leapDay = date('2025-07-25');

chuseok.format('long', 'ko-KR-u-ca-dangi'); // '병오년 8월 15일'
chuseok.format({ month: 'long', day: 'numeric' }, 'ko-KR-u-ca-dangi'); // '8월 15일'
leapDay.format('long', 'ko-KR-u-ca-dangi'); // '을사년 윤6월 1일'
```

:::tip[Formatear fechas lunares recurrentes]
[`MonthDay`](/api/month-day/) y [`YearMonth`](/api/year-month/) permanecen en el calendario gregoriano aunque reciban un locale lunar. Formatea cumpleaños y festividades lunares a partir del [`CalendarDate`](/api/calendar-date/) gregoriano de ese año.
:::
