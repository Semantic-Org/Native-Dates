---
source: "d8be401b7194"
title: Duraciones
lede: Crea duraciones con funciones de unidad o frases de texto en inglés, y mide o formatea intervalos.
---

Una [`Duration`](/api/duration/) representa una duración, como 90 minutos o 2 semanas. Puedes crearla directamente para hacer cálculos de fechas, u obtenerla al medir la distancia entre dos valores.

## Crear una duración

Crea una duración con funciones de unidad como [`hours()`](/api/duration-fn/#hours), o pasa a [`duration()`](/api/duration-fn/) una frase de unidades en inglés, una cadena ISO 8601 o un objeto de campos:

```js
import { days, duration, hours } from 'native-dates';

const call = hours(1.5);
const trial = days(14);
const turnaround = duration('2 weeks, 3 days');
const iso = duration('PT1H30M');
const window = duration({ hours: 2, minutes: 45 });
```

Consulta cada unidad directamente en la instancia. Los valores decimales se trasladan automáticamente a la unidad menor siguiente, mientras que los números enteros permanecen en la unidad que escribiste:

```js
call.hours; // 1
call.minutes; // 30

const ninety = duration(90, 'minutes');
ninety.hours; // 0
ninety.minutes; // 90
```

## Medir entre dos valores

Llama a [`until()`](/api/date-time/#until) o [`since()`](/api/date-time/#since) sobre una fecha, hora, valor [`YearMonth`](/api/year-month/) o instante para medir el intervalo con otro:

```js
import { datetime } from 'native-dates';

const opened = datetime('2026-11-16T08:00', 'America/Los_Angeles');
const resolved = datetime('2026-11-16T10:30', 'America/Los_Angeles');

const elapsed = opened.until(resolved);
elapsed.hours; // 2
elapsed.minutes; // 30
```

Si solo necesitas un número para hacer cálculos o barras de progreso, pasa la unidad de destino en inglés como segundo argumento:

```js
opened.until(resolved, 'hours'); // 2.5
resolved.since(opened, 'minutes'); // 150
```

Todos los [rangos](/api/ranges/) también exponen `.duration` directamente:

```js
import { dateRange, timeRange } from 'native-dates';

dateRange('2026-11-01', '2026-11-07').duration.days; // 7
timeRange('9:00am', '5:30pm').duration.hours; // 8
```

## Equilibrar y totalizar unidades

Los valores se quedan en las unidades originales hasta que pidas lo contrario. Llama a [`balance()`](/api/duration/#balance) cuando quieras trasladar el exceso hacia unidades mayores:

```js
import { hours, minutes, months } from 'native-dates';

minutes(90).balance().toFields(); // { hours: 1, minutes: 30 }
months(18).balance().toFields(); // { years: 1, months: 6 }
hours(36).balance('day').toFields(); // { days: 1, hours: 12 }
```

Sin argumentos, una duración independiente convierte meses en años y unidades de reloj hasta horas, dejando los días intactos para que no intervengan los cambios del horario de verano.

Pasa `'day'` o `'week'` si quieres días fijos de 24 horas o semanas de 7 días.

Llama a [`total()`](/api/duration/#total) o a su alias [`as()`](/api/duration/#as) para reducir toda la duración a un único número decimal expresado en una sola unidad:

```js
import { duration } from 'native-dates';

const shift = duration('7h 30m');

shift.total('hours'); // 7.5
shift.as('minutes'); // 450
```

:::note[Totales en meses y años]
Los años y los meses se totalizan y equilibran entre sí directamente a razón de 12 meses por año. Convertir entre días y meses requiere una fecha de calendario de referencia, que las duraciones devueltas por `until()` y `since()` conservan automáticamente.
:::

```js
import { date, months } from 'native-dates';

months(18).total('years'); // 1.5

const span = date('2026-01-15').until('2026-04-15');
span.total('months'); // 3
span.total('days'); // 90
```

## Formatear duraciones

Cada instancia expone en `.text` su formato largo localizado. Llama a [`format()`](/api/duration/#format) con un preset de estilo para obtener una salida completa, abreviada, compacta o digital:

```js
import { duration } from 'native-dates';

const flight = duration({ hours: 2, minutes: 30 });

flight.text; // '2 hours, 30 minutes'
flight.format('long', 'en-US'); // '2 hours, 30 minutes'
flight.format('short', 'en-US'); // '2 hr, 30 min'
flight.format('narrow', 'en-US'); // '2h 30m'
flight.format('digital', 'en-US'); // '2:30:00'
```

Pasa una etiqueta de locale como segundo argumento para traducir los nombres de las unidades, o llama a [`toString()`](/api/duration/#tostring) cuando necesites una cadena ISO 8601 para enviar en una API.
