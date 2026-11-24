---
source: "ec38498f1427"
title: Aritmética de fechas
lede: Suma duraciones, ajusta valores a los límites del calendario y avanza por días de la semana o rangos sin mutar los originales.
---

Cada fecha, hora e instante en Native Dates es inmutable. Los métodos que desplazan o redondean un valor siempre devuelven una nueva instancia y dejan el original intacto.

## Sumar y restar

Llama a [`plus()`](/api/date-time/#plus) o [`minus()`](/api/date-time/#minus) para avanzar o retroceder en el tiempo:

```js
import { date } from 'native-dates';

const created = date('2026-11-16');
const due = created.plus(2, 'weeks');

created.toString(); // '2026-11-16'
due.toString(); // '2026-11-30'
```

Ambos métodos aceptan un número y una unidad en inglés, una frase de unidades en inglés, un objeto de campos o una instancia de [`Duration`](/api/duration/). Los nombres estándar [`add()`](/api/date-time/#plus) y [`subtract()`](/api/date-time/#minus) también funcionan como alias:

```js
import { datetime, hours } from 'native-dates';

const kickoff = datetime('2026-11-16T09:00', 'America/New_York');

kickoff.plus(2, 'weeks');
kickoff.plus('1h 30m');
kickoff.plus({ days: 2, hours: 4 });
kickoff.minus(hours(3));
```

:::tip[Las unidades deben coincidir con el tipo]
Una fecha de calendario rechaza unidades de reloj como horas porque no tiene hora del día. Una hora del día rechaza unidades de calendario como días porque se reinicia a medianoche. Combínalas primero con [`at()`](/api/calendar-date/#at) cuando el cálculo involucre ambas.
:::

## Finales de mes y horario de verano

Al sumar meses o años, el resultado se ajusta al límite del mes de destino en lugar de desbordarse al mes siguiente. Sumar un mes al 31 de enero da el 28 de febrero, o el 29 de febrero en año bisiesto:

```js
import { date } from 'native-dates';

date('2026-01-31').plus(1, 'month').toString(); // '2026-02-28'
date('2028-01-31').plus(1, 'month').toString(); // '2028-02-29'
```

En un [`DateTime`](/api/date-time/), las unidades de calendario conservan la hora local al cruzar cambios del horario de verano. Las unidades de reloj, en cambio, cuentan horas y minutos exactos transcurridos:

```js
import { datetime } from 'native-dates';

const saturday = datetime('2026-03-07T09:00', 'America/New_York');

saturday.plus(1, 'day').text; // 'Mar 8, 2026, 9:00 AM EDT'
saturday.plus(24, 'hours').text; // 'Mar 8, 2026, 10:00 AM EDT'
```

Consulta [Zonas horarias](/guides/time-zones/) para ver en detalle los saltos hacia adelante y hacia atrás del reloj.

## Ajustar a los límites de una unidad

Llama a [`startOf()`](/api/date-time/#startof) y [`endOf()`](/api/date-time/#endof) para situar un valor al inicio o al final de un año, trimestre, mes, semana, día o unidad de reloj.

En una fecha de calendario, el final de un mes es su último día. En un instante, el final de una unidad es su último milisegundo:

```js
import { date, datetime } from 'native-dates';

const midMonth = date('2026-11-18');
midMonth.startOf('month').toString(); // '2026-11-01'
midMonth.endOf('month').toString(); // '2026-11-30'

const stamp = datetime('2026-11-18T14:20', 'UTC');
stamp.endOf('day').toString(); // '2026-11-18T23:59:59.999Z'
```

Las semanas empiezan el primer día del locale activo, como domingo en `'en-US'` o lunes en `'de-DE'`. Pasa el nombre de un día de la semana en inglés como segundo argumento para una sola llamada, o define un valor global con [`configure()`](/api/configure/):

```js
const wednesday = date('2026-11-18');

wednesday.locale('en-US').startOf('week').toString(); // '2026-11-15'
wednesday.locale('de-DE').startOf('week').toString(); // '2026-11-16'
wednesday.startOf('week', 'monday').toString(); // '2026-11-16'
```

Llama a [`startOfNext()`](/api/date-time/#startofnext) o [`startOfPrevious()`](/api/date-time/#startofprevious) para ir al comienzo de la unidad siguiente o anterior a la actual. Ambos métodos avanzan o retroceden siempre una unidad completa, de modo que `startOfNext('month')` el 1 de diciembre devuelve el 1 de enero:

```js
const invoiced = date('2026-11-16');

invoiced.startOfNext('month').toString(); // '2026-12-01'
invoiced.startOfNext('quarter').toString(); // '2027-01-01'
invoiced.startOfPrevious('month').toString(); // '2026-10-01'
```

## Redondear horas del día

Llama a [`round()`](/api/date-time/#round) en un instante o una hora para ajustar a la unidad o incremento más cercano, o redondea en una sola dirección:

```js
import { time } from 'native-dates';

const logged = time('9:23am');

logged.round('hour').format('short', 'en-US'); // '9:00 AM'
logged.round(15, 'minutes').format('short', 'en-US'); // '9:30 AM'
logged.floor(15, 'minutes').format('short', 'en-US'); // '9:15 AM'
logged.ceil(15, 'minutes').format('short', 'en-US'); // '9:30 AM'
```

Los incrementos como 5, 10, 15 o 30 minutos deben dividir de forma exacta a la unidad inmediatamente superior.

## Avanzar por día de la semana o fecha recurrente

Llama a [`next()`](/api/calendar-date/#next) o [`previous()`](/api/calendar-date/#previous) en una fecha o instante pasando el nombre de un día de la semana en inglés para saltar a su próxima o anterior aparición. Si el valor ya cae en ese día, se desplaza siete días completos:

```js
import { date } from 'native-dates';

const monday = date('2026-11-16');

monday.next('friday').toString(); // '2026-11-20'
monday.next('monday').toString(); // '2026-11-23'
monday.previous('friday').toString(); // '2026-11-13'
```

Pasa un [`MonthDay`](/api/month-day/) para ir directamente a la siguiente o anterior aparición de un cumpleaños o un festivo anual:

```js
import { monthDay } from 'native-dates';

const birthday = monthDay('10/17');
monday.next(birthday).toString(); // '2027-10-17'
```

En un instante, `next()` conserva la hora del día. Pasa un nombre de día en inglés a `startOfNext()` si prefieres situarte al inicio de ese día:

```js
import { datetime } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'America/New_York');

standup.next('wednesday').text; // 'Nov 18, 2026, 9:30 AM EST'
standup.startOfNext('wednesday').text; // 'Nov 18, 2026, 12:00 AM EST'
```

## Construir y recorrer rangos

Crea un [rango](/guides/ranges/) con [`dateRange()`](/api/range-fn/#daterange) o encadena [`for()`](/api/ranges/#to) y [`to()`](/api/ranges/#to) sobre un punto existente. Recorre cada paso o divídelo en subrangos más pequeños:

```js
import { dateRange } from 'native-dates';

const sprint = dateRange('2026-11-02', '2 weeks');

sprint.end.toString(); // '2026-11-15'
sprint.every('week').map(String); // ['2026-11-02', '2026-11-09']
sprint.split(1, 'week').length; // 2
```
