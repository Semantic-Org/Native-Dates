---
source: "326d94af83a9"
title: Interpretación
lede: Interpreta cadenas ISO, duraciones, rangos y entradas flexibles del usuario sin suposiciones silenciosas.
---

El núcleo interpreta entradas estándar y sin ambigüedad directamente en el tipo que solicitas:

- [`datetime()`](/api/datetime-fn/) para instantes en el tiempo, milisegundos Unix y marcas de tiempo
- [`date()`](/api/date-fn/) para fechas de calendario sin hora ni zona horaria
- [`time()`](/api/time-fn/) para horas del día en formato de 24 y 12 horas
- [`duration()`](/api/duration-fn/) para frases de unidades en inglés y duraciones ISO 8601
- [`yearMonth()`](/api/year-month-fn/) y [`monthDay()`](/api/month-day-fn/) para meses de facturación, vencimientos de tarjetas y cumpleaños recurrentes
- [`dateRange()`](/api/range-fn/#daterange), [`datetimeRange()`](/api/range-fn/#datetimerange) y [`timeRange()`](/api/range-fn/#timerange) para intervalos y pares de extremos

## Fechas ISO y marcas de tiempo

Pasa a `date()` una cadena que empiece por el año, tres números (año, mes y día) o un objeto de campos. Las cadenas con el año al principio aceptan meses y días de uno o dos dígitos con cualquier separador salvo letras latinas o dos puntos. Las fechas en chino, japonés, coreano y las separadas por puntos con espacio se interpretan directamente en el núcleo.

Los meses van del 1 al 12. Las fechas imposibles como el 30 de febrero y las cadenas ISO de semana o trimestre como `'2026-W05-1'` lanzan un error en lugar de adivinar.

```js
import { date } from 'native-dates';

date('2026-11-16');
date('2026/11/6');
date('2026年11月16日');
date('2026. 11. 16.');
date(2026, 11, 16);
date({ year: 2026, month: 11, day: 16 });
```

Pasa cadenas ISO 8601 u objetos de campos a `datetime()`. Una `Z` final o un desplazamiento numérico fija el instante exacto, mientras que una cadena sin desplazamiento se interpreta como hora local en la zona horaria de destino.

```js
import { datetime } from 'native-dates';

datetime('2026-11-16T17:30:00Z', 'America/Los_Angeles'); // 9:30 AM PST
datetime('2026-11-16T09:30', 'America/Los_Angeles'); // 9:30 AM PST
datetime('2026-11-16T09:30[Europe/Berlin]'); // 9:30 AM CET
datetime({ year: 2026, month: 11, day: 16, hour: 9, minute: 30 }, 'Europe/Berlin');
```

Pasar una marca de tiempo con desplazamiento a `date()` o `time()` extrae el día de calendario o la hora local en la zona horaria que indiques:

```js
import { time } from 'native-dates';

date('2026-11-17T01:30:00Z', 'America/Los_Angeles'); // 2026-11-16
date('2026-11-17T01:30:00Z', 'Asia/Tokyo'); // 2026-11-17
time('2026-11-17T01:30:00Z', 'America/Los_Angeles'); // 17:30:00
```

## Horas del día y duraciones

Pasa a `time()` horas ISO de 24 horas, cadenas de hora y minuto como `'14h30'`, horas en formato de 12 horas, argumentos numéricos o un objeto de campos. Una hora suelta como `'14h'` sigue lanzando error para no confundirse con una duración.

```js
import { time } from 'native-dates';

time('09:30');
time('14h30');
time('9:30am');
time('5:15 PM');
time(17, 15, 30);
time({ hour: 9, minute: 30 });
```

Pasa a `duration()` frases de unidades en inglés, cadenas de duración ISO 8601, un número con su unidad en inglés o un objeto de campos.

```js
import { duration } from 'native-dates';

duration('1h 30m');
duration('2 weeks and 3 days');
duration('PT90M');
duration(90, 'minutes');
duration({ hours: 1, minutes: 30 });
```

## Fechas parciales y rangos

Pasa cadenas ISO de año y mes a [`yearMonth()`](/api/year-month-fn/), o lee vencimientos de tarjetas que empiezan por el mes con [`monthYear()`](/api/year-month-fn/#monthyear):

```js
import { dayMonth, monthDay, monthYear, yearMonth } from 'native-dates';

yearMonth('2026-11');
monthYear('11/28'); // YearMonth(2028-11)

monthDay('10/17');
dayMonth('17/10'); // MonthDay(10-17)
```

Las fechas recurrentes sin año funcionan igual mediante [`monthDay()`](/api/month-day-fn/) y [`dayMonth()`](/api/month-day-fn/#daymonth). Para intervalos, las [fábricas de rangos](/api/range-fn/) aceptan dos extremos o una única cadena de intervalo:

```js
import { dateRange, timeRange } from 'native-dates';

dateRange('2026-11-01/2026-11-07');
timeRange('9am - 5pm');
```

## Marcas de tiempo Unix, Date y Temporal

Los milisegundos Unix, las instancias nativas de `Date` de JavaScript y los objetos [Temporal](/guides/temporal/) pasan directamente a `datetime()`.

Pasar un número suelto a una fábrica de fechas lanza un error por ambigüedad. Convierte primero los milisegundos Unix a un instante en una zona horaria y después obtén su fecha de calendario.

```js
import { date, datetime } from 'native-dates';

const fromEpoch = datetime(1794850200000, 'UTC');
const fromJSDate = datetime(new Date('2026-11-16T17:30:00Z'));
const localDay = date(new Date('2026-11-16T17:30:00Z'), 'America/Los_Angeles');
```

## Por qué las cadenas ambiguas lanzan un error

Mientras que un año de cuatro dígitos al principio solo admite una lectura, `'03/05/2026'` significa 5 de marzo en Estados Unidos y 3 de mayo en Europa y América Latina. El núcleo rechaza cadenas numéricas ambiguas en lugar de adivinar el mes equivocado en producción.

:::warning[Los valores vacíos nunca toman el momento actual]
Pasar un valor vacío a cualquier fábrica lanza un error en lugar de devolver la fecha actual, para que un campo faltante en una API nunca se tome por el día de hoy. Llama a [`now()`](/api/datetime-fn/#now) o [`today()`](/api/date-fn/#today) cuando necesites la fecha o el instante actual.
:::

## Entrada de usuarios con el plugin loose

Cuando necesites interpretar texto libre de formularios, exportaciones CSV o encabezados RFC 2822, importa [`@native-dates/plugins/loose`](/plugins/loose/) y pasa `{ loose: true }`. El modo loose interpreta fechas y horas tal como las escribe el locale activo, incluidos nombres de meses localizados, períodos del día, horas separadas por punto y dígitos no ASCII.

```js
import '@native-dates/plugins/loose';
import { date, datetime, monthDay, time, yearMonth } from 'native-dates';

date('Nov 16, 2026', { loose: true }); // 2026-11-16
date('16 de noviembre de 2026', { loose: true, locale: 'es' }); // 2026-11-16
datetime('Mon, 16 Nov 2026 17:30:00 GMT', { loose: true });
time('오후 2:30', { loose: true, locale: 'ko' }); // 14:30:00
yearMonth('Nov 2026', { loose: true }); // 2026-11
monthDay('17 février', { loose: true, locale: 'fr' }); // 02-17
```

Las fechas numéricas con barras o puntos siguen el orden del locale activo. Pasa `dayFirst` en una llamada concreta o defínelo en la [configuración de la aplicación](/api/configure/) cuando una entrada use un orden distinto al del locale activo.

```js
date('03/05/2026', { loose: true, locale: 'en-US' }); // 2026-03-05
date('03/05/2026', { loose: true, locale: 'fr' }); // 2026-05-03
date('03/05/2026', { loose: true, locale: 'en-US', dayFirst: true }); // 2026-05-03
```

En modo loose, las entradas ilegibles devuelven `null` en lugar de lanzar un error en todas las fábricas y rangos. Las opciones inválidas, como una zona horaria desconocida, siguen lanzando error.

```js
import { duration } from 'native-dates';

date('not a date', { loose: true }); // null
duration('soon', { loose: true }); // null
```

Cuando las entradas siguen una estructura fija distinta de ISO, como exportaciones CSV (`'24112026'`), logs de servidor o fechas por semana y ordinales, importa [`@native-dates/plugins/parse`](/plugins/parse/) y pasa `{ format }` para usar coincidencia determinista de tokens en lugar de interpretación heurística.

```js
import '@native-dates/plugins/parse';
import { date, datetime } from 'native-dates';

date('24112026', { format: 'DDMMYYYY' }); // 2026-11-24
datetime('24/Nov/2026:12:40:01 -0500', { format: 'DD/MMM/YYYY:HH:mm:ss ZZ' });
```
