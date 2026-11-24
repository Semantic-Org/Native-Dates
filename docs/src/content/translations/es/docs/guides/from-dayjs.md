---
source: "3f7711941af9"
title: Migrar desde Day.js
lede: Sustituye envoltorios de dayjs() y cadenas de plugins por tipos de fecha dedicados y zonas horarias integradas.
---

Day.js envuelve un objeto `Date` de JavaScript en un único contenedor `dayjs()` y añade zonas horarias, UTC, rangos y duraciones mediante plugins. Al migrar a Native Dates mantienes el estilo ligero e inmutable, pero las fechas de calendario, horas del día, instantes, fechas parciales, rangos y duraciones tienen sus propios tipos integrados en el núcleo.

## Elegir entre date() y datetime()

En Day.js, tanto un cumpleaños como una marca de tiempo de una API pasan por `dayjs()`.

Aquí las fechas de calendario usan [`date()`](/api/date-fn/) o [`today()`](/api/date-fn/#today), mientras que los [meses de facturación](/api/year-month-fn/) y los [cumpleaños recurrentes](/api/month-day-fn/) cuentan con funciones de creación de fechas parciales en el núcleo.

Los instantes reales en el tiempo usan [`datetime()`](/api/datetime-fn/) o [`now()`](/api/datetime-fn/#now):

```js
import { date, datetime, monthDay, now, today, yearMonth } from 'native-dates';

const current = now(); // reemplaza a dayjs() para una marca de tiempo
const due = today().plus(2, 'weeks'); // reemplaza a dayjs().add(2, 'week') para una fecha de calendario
const created = datetime('2026-11-16T17:30:00Z');
const birthday = date('2026-05-10');
const billing = yearMonth('2026-11');
const recurring = monthDay('05-10');
```

Los nombres habituales de suma y resta funcionan como alias si tu código ya los utiliza. Pasar un valor vacío a una función de creación lanza un error en lugar de devolver en silencio la fecha y hora actuales, lo que permite detectar pronto los campos que faltan en una API.

## Los meses empiezan en 1

Day.js hereda los meses numerados desde 0, donde enero es 0 y `.date()` lee el día del mes. Aquí los campos del calendario son propiedades simples y los meses van del 1 al 12.

```js
import { date } from 'native-dates';

const d = date('2026-11-16');

d.year; // 2026
d.month; // 11, noviembre
d.day; // 16
d.dayOfWeek; // 1, lunes
```

:::warning[Revisa los números de mes y día de la semana]
Day.js numera los meses del 0 al 11 y empieza la semana en domingo con 0. Aquí `month` va del 1 al 12, y `dayOfWeek` va del 1 en lunes al 7 en domingo. En patrones de tokens, `'E'` imprime el estándar ISO del 1 al 7, mientras que `'d'` conserva el rango del 0 al 6 de Day.js.
:::

## Zonas horarias, duraciones y rangos integrados

Day.js exige cargar plugins aparte antes de convertir fechas y horas entre ciudades, construir duraciones o comprobar si una fecha cae dentro de un intervalo. El núcleo incluye zonas horarias IANA, [duraciones](/api/duration/) y [rangos](/api/ranges/) sin configuración adicional.

```js
import { dateRange, datetime, duration, hours } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
const berlin = standup.in('Europe/Berlin'); // reemplaza a .tz('Europe/Berlin')

const span = duration('1h 30m').plus(hours(0.5));
span.total('minutes'); // 120

const november = dateRange('2026-11-01', '2026-11-30');
november.contains('2026-11-16'); // true
dateRange('2026-11-01', '2026-11-15').overlaps(november); // true
```

En lugar de pasar cadenas con corchetes de inclusión a `isBetween()`, los rangos de fechas incluyen ambos extremos del calendario y los rangos de instantes o de horas excluyen automáticamente su extremo final.

## Presets y patrones de tokens

El núcleo admite presets de `Intl`, nombres de formato localizado de Day.js y [patrones de tokens](/guides/formatting/#token-patterns) personalizados directamente en [`format()`](/api/date-time/#format), sin archivos de locale ni plugins:

```js
import { datetime } from 'native-dates';

const dt = datetime('2026-11-16T17:30:00Z', 'America/New_York');

dt.format('medium', 'en-US'); // 'Nov 16, 2026, 12:30 PM'
dt.format('LLL', 'en-US'); // 'November 16, 2026 at 12:30 PM'
dt.format('YYYY-MM-DD HH:mm'); // '2026-11-16 12:30'
```

## Plugins opcionales

Solo la interpretación de cadenas no ISO, la resolución de nombres de ciudades en inglés (como `'Berlin'`) y abreviaturas de zona, y los getters heredados de `Date` están en [`@native-dates/plugins`](/plugins/). Importa cada subruta una sola vez al arrancar:

```js
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { date, datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'Berlin').zone; // 'Europe/Berlin'
date('Nov 16, 2026', { loose: true }); // CalendarDate(2026-11-16)
```

## Referencia comparativa

| Day.js | Native Dates | Notas |
|---|---|---|
| `dayjs()` | `now()` o `today()` | Elige un instante exacto o una fecha de calendario |
| `d.month()`, `d.date()` | `d.month`, `d.day` | Propiedades simples con meses del 1 al 12 |
| `d.day()`, `d.isoWeekday()` | `d.dayOfWeek` | Estándar ISO del 1 en lunes al 7 en domingo; tokens `'E'` para 1–7 y `'d'` para 0–6 |
| `d.unix()`, `d.valueOf()` | `dt.epochSeconds`, `dt.epochMilliseconds` | Cada conteo desde 1970 indica su unidad en el nombre |
| `d.add(2, 'day')` | `d.plus(2, 'days')` | Los alias `add()` y `subtract()` también funcionan |
| `dayjs.tz(x, zone)` | `datetime(x, zone)` | En el núcleo, sin plugin `timezone` |
| `d.tz(zone)` | `dt.in(zone)` | Muestra el mismo instante en otra zona horaria IANA |
| `dayjs.utc(x)` | `datetime(x, 'UTC')` | En el núcleo, sin plugin `utc` |
| `b.diff(a, 'day', true)` | `a.until(b, 'days')` | Total fraccionario en la unidad solicitada |
| `dayjs.duration(90, 'm')` | `minutes(90)` o `duration('90m')` | En el núcleo, sin plugin `duration` |
| `d.format('LLL')` | `dt.format('LLL')` | Presets localizados desde `'LT'` hasta `'llll'` |
| `d.format('YYYY-MM-DD HH:mm')` | `dt.format('YYYY-MM-DD HH:mm')` | [Patrones de tokens](/guides/formatting/#token-patterns) en el núcleo |
| `d.isBetween(a, b)` | `dateRange(a, b).contains(d)` | [Rangos](/api/ranges/) con `to()`, `for()` y `overlaps()` |
| `d.fromNow()`, `d.from(other)` | `d.fromNow()`, `d.from(other)` | En el núcleo, sin plugin `relativeTime` |
| `customParseFormat` | `{ format }` o `{ loose: true }` | Patrones fijos mediante [`@native-dates/plugins/parse`](/plugins/parse/), entrada libre mediante [`@native-dates/plugins/loose`](/plugins/loose/) |
