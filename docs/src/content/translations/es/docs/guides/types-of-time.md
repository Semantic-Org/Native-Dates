---
source: "8bfe5a8d41c8"
title: Tipos de tiempo
lede: Elige el tipo adecuado para una fecha de calendario, una hora del día, un instante con zona horaria, una fecha parcial, un rango o una duración.
---

El objeto `Date` integrado de JavaScript usa una única estructura para todo, ya sea un cumpleaños, una alarma a las 9:30 AM o el segundo exacto en que se registró un pedido.

Aquí cada concepto tiene su propio tipo para que trabajes solo con los datos que realmente existen:

- **[`CalendarDate`](/api/calendar-date/)** para un día del calendario, como el 10 de mayo de 2026
- **[`Time`](/api/time/)** para una hora del día, como las 9:30 AM
- **[`DateTime`](/api/date-time/)** para un instante concreto en una zona horaria
- **[`Duration`](/api/duration/)** para una duración, como 2 horas o 3 semanas
- **[`YearMonth`](/api/year-month/)** y **[`MonthDay`](/api/month-day/)** para un mes sin día o una fecha anual recurrente sin año
- **[Rangos](/api/ranges/)** para un intervalo entre dos fechas, horas o instantes

## CalendarDate

Usa [`CalendarDate`](/api/calendar-date/) cuando algo ocurre en un día concreto y no en un segundo exacto: cumpleaños, fechas de vencimiento, días festivos o valores de un selector de fecha.

Crea una instancia con [`today()`](/api/date-fn/#today) o [`date()`](/api/date-fn/):

```js
import { date, today } from 'native-dates';

const birthday = date('2026-05-10');
const due = today().plus(2, 'weeks');

birthday.month; // 5
birthday.day; // 10
```

Como una fecha de calendario no tiene reloj ni zona horaria, el 10 de mayo sigue siendo el 10 de mayo para todos los usuarios, vivan donde vivan.

## Time

Usa [`Time`](/api/time/) para una hora del día que no está ligada a una fecha concreta, como el horario de apertura de una tienda o un recordatorio diario.

```js
import { time } from 'native-dates';

const opens = time('9:00am');
const closes = opens.plus(8, 'hours');

closes.hour; // 17
closes.format('short', 'en-US'); // '5:00 PM'
```

Si sumas horas más allá de la medianoche, el reloj de 24 horas vuelve a empezar limpiamente porque no hay ninguna fecha que cambiar.

## DateTime

Usa [`DateTime`](/api/date-time/) cuando algo ocurre en un punto real de la línea de tiempo: una reunión, la salida de un vuelo o una marca de tiempo de tu base de datos.

Crea una instancia con [`now()`](/api/datetime-fn/#now) o [`datetime()`](/api/datetime-fn/), o combina una fecha de calendario con una hora:

```js
import { date, datetime, now } from 'native-dates';

const current = now();
const created = datetime('2026-11-16T17:30:00Z');
const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
```

Cada instante conoce tanto el momento exacto en que sucede como la zona horaria desde la que lo observas. Llama a [`in()`](/api/date-time/#in) para ver ese mismo instante en otra ciudad:

```js
standup.in('Europe/Berlin').format('time', 'en-US'); // '6:30 PM'
```

## Duration

Usa [`Duration`](/api/duration/) para expresar cuánto dura algo. Crea una duración con funciones de unidad como [`hours()`](/api/duration-fn/#hours) o pasa una frase de unidades en inglés a [`duration()`](/api/duration-fn/):

```js
import { days, duration, hours } from 'native-dates';

const call = hours(1.5);
const trial = days(14);
const turnaround = duration('2 weeks, 3 days');
```

Medir la diferencia entre dos valores también devuelve una duración:

```js
const opens = time('9:00am');
const lunch = time('12:30pm');

opens.until(lunch).format('long', 'en-US'); // '3 hours, 30 minutes'
```

## YearMonth

Usa [`YearMonth`](/guides/months-and-days/#billing-months-and-card-expiries) cuando un valor consta de año y mes sin día, como un período de facturación, el vencimiento de una tarjeta o un campo de mes.

```js
import { monthYear, yearMonth } from 'native-dates';

const billing = yearMonth('2026-11');
const expiry = monthYear('11/28');

billing.daysInMonth; // 30
billing.on(15); // CalendarDate para 2026-11-15
```

Opera en meses y años, y [`on()`](/api/year-month/#on) selecciona cualquier día dentro de ese mes como una fecha de calendario.

## MonthDay

Usa [`MonthDay`](/guides/months-and-days/#birthdays-and-annual-holidays) para una fecha recurrente sin año, como un cumpleaños o un festivo anual.

```js
import { monthDay } from 'native-dates';

const birthday = monthDay('10/17');

birthday.in(2026); // CalendarDate para 2026-10-17
birthday.fallsOn('2026-10-17'); // true
```

El 29 de febrero se ajusta automáticamente al 28 de febrero en años no bisiestos cuando llamas a [`fallsOn()`](/api/month-day/#fallson) o [`in()`](/api/month-day/#in).

## Rangos

Usa [Rangos](/guides/ranges/) para representar un intervalo entre dos fechas, horas o instantes. Crea uno directamente con [`dateRange()`](/api/range-fn/#daterange), [`timeRange()`](/api/range-fn/#timerange) o [`datetimeRange()`](/api/range-fn/#datetimerange):

```js
import { dateRange, timeRange } from 'native-dates';

const sprint = dateRange('2026-11-02', '2026-11-15');
const shift = timeRange('9:00am', '5:00pm');

sprint.contains('2026-11-10'); // true
shift.duration.hours; // 8
```

Los rangos de fechas incluyen su último día, mientras que los rangos de instantes y de horas excluyen el límite final para que dos franjas consecutivas nunca se solapen.

## Pasar de un tipo a otro

Estos tipos se conectan directamente al añadir o descartar partes. Asocia una hora a una fecha de calendario con [`at()`](/api/calendar-date/#at) para obtener un instante, o construye un rango a partir de un punto existente con [`for()`](/api/ranges/#to) o [`to()`](/api/ranges/#to):

```js
const reminder = today().plus(1, 'day').at('9:00am');
const upcoming = today().for(2, 'weeks');
```

En sentido inverso, accede directamente a las propiedades de cada parte en cualquier fecha o instante, o llama a [`as()`](/api/date-time/#as) dentro de una cadena de métodos:

```js
reminder.date; // CalendarDate de mañana
reminder.time; // Time para las 09:00:00
reminder.yearMonth; // YearMonth
reminder.monthDay; // MonthDay
reminder.in('Asia/Tokyo').as('time'); // Time en Tokio
```

:::tip[¿DateTime o CalendarDate?]
Pregúntate si cambiar de zona horaria debería alterar lo que ve el usuario. Una llamada a las 9:30 AM en Los Ángeles son las 6:30 PM en Berlín, así que corresponde usar `DateTime`. Un cumpleaños el 10 de mayo sigue siendo el 10 de mayo en cualquier lugar, así que corresponde usar `CalendarDate`.
:::
