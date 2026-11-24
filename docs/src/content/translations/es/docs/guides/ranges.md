---
source: "8e9d9ff9bd0c"
title: Rangos
lede: Trabaja con intervalos entre dos fechas, horas o instantes, desde comprobar solapamientos hasta formatear rangos.
---

Un [rango](/api/ranges/) representa un intervalo con un inicio y un final, como una reserva de hotel, un horario de atención o una reunión programada. Cada tipo de tiempo tiene su propia clase de rango para que las fechas de calendario sigan siendo fechas y las franjas horarias nunca incorporen una fecha ficticia.

## Crear rangos

Crea un rango directamente con [`dateRange()`](/api/range-fn/), [`timeRange()`](/api/range-fn/#timerange) o [`datetimeRange()`](/api/range-fn/#datetimerange). Cada fábrica acepta dos extremos, un inicio junto con una duración (como una frase de unidades en inglés o una `Duration`), o una única cadena de intervalo:

```js
import { dateRange, datetimeRange, timeRange } from 'native-dates';

const sprint = dateRange('2026-05-01', '2 weeks');
const trip = dateRange('2026-09-01', '2026-09-07');
const hours = timeRange('9am - 5pm');
const meeting = datetimeRange('2026-09-01T09:00', '90m', 'America/New_York');
```

Si ya tienes una fecha, hora o instante tipado, encadena [`for()`](/api/ranges/#to), [`to()`](/api/ranges/#to) o [`range()`](/api/ranges/#range) directamente sobre ese valor:

```js
import { today } from 'native-dates';

const upcoming = today().for(2, 'weeks');
const thisMonth = today().range('month');
```

## Fechas inclusivas y horas semiabiertas

Los rangos de fechas de calendario incluyen su último día, porque del 1 al 7 de septiembre abarca los siete días completos. En cambio, los rangos de instantes y de horas excluyen el límite final para que dos franjas consecutivas nunca se solapen:

```js
import { dateRange, timeRange } from 'native-dates';

dateRange('2026-09-01', '2026-09-07').duration.days; // 7

const first = timeRange('9:00am', '10:00am');
const second = timeRange('10:00am', '11:00am');
first.overlaps(second); // false
```

Cuando un rango de horas termina antes de la hora a la que empieza, cruza la medianoche para cubrir turnos nocturnos o locales que cierran de madrugada:

```js
const nightShift = timeRange('22:00', '06:00');

nightShift.contains('02:30'); // true
nightShift.duration.hours; // 8
```

## Contención y solapamiento

Comprueba si un punto o un subrango cae dentro de un intervalo con [`contains()`](/api/ranges/#contains), o compara dos rangos entre sí con [`overlaps()`](/api/ranges/#overlaps) e [`intersection()`](/api/ranges/#intersection):

```js
import { dateRange } from 'native-dates';

const booking = dateRange('2026-11-10', '2026-11-18');
const holiday = dateRange('2026-11-15', '2026-11-22');

booking.contains('2026-11-14'); // true
booking.overlaps(holiday); // true
booking.intersection(holiday).toString(); // '2026-11-15/2026-11-18'
```

`intersection()` devuelve `null` cuando dos rangos no se solapan.

## Recorrer, contar y dividir rangos

Llama a [`every()`](/api/ranges/#every) para recorrer un rango y obtener cada fecha, hora o instante del trayecto. En un rango de fechas, llama a [`count()`](/api/ranges/#count) para contar días, días laborables, fines de semana o un día concreto usando nombres en inglés (como `'weekdays'` o `'mondays'`):

```js
import { dateRange } from 'native-dates';

const sprint = dateRange('2026-05-01', '2 weeks');

sprint.every('week').map(String); // ['2026-05-01', '2026-05-08']
sprint.count(); // 14
sprint.count('weekdays'); // 10
sprint.count('mondays'); // 2
```

Llama a [`split()`](/api/ranges/#split) cuando necesites subrangos en lugar de puntos sueltos, por ejemplo para dividir un turno en franjas reservables o un sprint en bloques semanales:

```js
import { timeRange } from 'native-dates';

const morning = timeRange('9:00am', '12:00pm');
const slots = morning.split(30, 'minutes');

slots.length; // 6
slots[0].toString(); // '09:00:00/09:30:00'
```

## Formatear y serializar

Formatear un rango con un preset contrae los meses y años compartidos según las reglas del locale activo en el entorno. Pasa un patrón de tokens si quieres formatear ambos extremos de forma explícita:

```js
import { dateRange, timeRange } from 'native-dates';

const week = dateRange('2026-09-01', '2026-09-07');

week.format('medium', 'en-US'); // 'Sep 1 – 7, 2026'
week.format('YYYY-MM-DD'); // '2026-09-01 – 2026-09-07'
timeRange('9:00am', '5:00pm').format('short', 'en-US'); // '9:00 AM – 5:00 PM'
```

Cada rango expone su longitud en `.duration` y genera una cadena de intervalo ISO 8601 con [`toString()`](/api/ranges/#tostring). Al pasar esa cadena a la misma fábrica, recuperas el rango original:

```js
const raw = week.toString(); // '2026-09-01/2026-09-07'
dateRange(raw).equals(week); // true
```
