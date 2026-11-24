---
source: "6291509fd7f2"
title: Meses y días
lede: Almacena un mes sin día o un cumpleaños recurrente sin año.
---

En JavaScript puro, guardar el vencimiento de una tarjeta obliga a añadir un día 1 ficticio al final, y guardar un cumpleaños sin el año de nacimiento exige elegir un año bisiesto de relleno como 2000. [`YearMonth`](/api/year-month/) y [`MonthDay`](/api/month-day/) almacenan únicamente las partes que existen de verdad.

## Meses de facturación y vencimientos de tarjetas

Usa [`yearMonth()`](/api/year-month-fn/) para cadenas ISO o números de año y mes, y [`monthYear()`](/api/year-month-fn/#monthyear) para vencimientos de tarjetas como `11/28`:

```js
import { monthYear, yearMonth } from 'native-dates';

const billing = yearMonth('2026-11');
const expiry = monthYear('11/28');

billing.daysInMonth; // 30
billing.quarter; // 4
expiry.isPast('UTC'); // false
```

Comprueba si una fecha cae dentro de un mes con [`contains()`](/api/year-month/#contains), avanza en meses o trimestres con [`plus()`](/api/year-month/#plus) y elige un día concreto con [`on()`](/api/year-month/#on):

```js
billing.contains('2026-11-16'); // true
billing.plus(3, 'months').toString(); // '2027-02'
yearMonth('2026-02').on(31).toString(); // '2026-02-28'
yearMonth('2028-02').on(31).toString(); // '2028-02-29'
```

El día 31 se ajusta automáticamente al límite del mes en los meses más cortos, incluido el 29 de febrero en años bisiestos.

## Cumpleaños y festivos anuales

Usa [`monthDay()`](/api/month-day-fn/) para cadenas que empiezan por el mes y [`dayMonth()`](/api/month-day-fn/#daymonth) para las que empiezan por el día. El nombre de la función fija el orden, así que `05/10` significa siempre lo mismo en cualquier lugar:

```js
import { dayMonth, monthDay } from 'native-dates';

const birthday = monthDay('10/17');
const european = dayMonth('17/10');

birthday.equals(european); // true
birthday.in(2027).toString(); // '2027-10-17'
```

Encuentra la aparición siguiente o más reciente a partir de hoy o de cualquier fecha de referencia con [`next()`](/api/month-day/#next) y [`previous()`](/api/month-day/#previous):

```js
birthday.next('2026-05-01').toString(); // '2026-10-17'
birthday.next('2026-10-17').toString(); // '2027-10-17'
birthday.previous('2026-10-17').toString(); // '2025-10-17'
```

El 29 de febrero pasa al 28 de febrero en años no bisiestos. Llama a [`fallsOn()`](/api/month-day/#fallson) para comprobar si una fecha coincide:

```js
const leapDay = monthDay(2, 29);

leapDay.in(2027).toString(); // '2027-02-28'
leapDay.fallsOn('2027-02-28'); // true
leapDay.fallsOn('2028-02-28'); // false
leapDay.fallsOn('2028-02-29'); // true
```

## Pasar entre meses, días y fechas completas

Accede a `.yearMonth` o `.monthDay` desde cualquier fecha o instante, o llama a [`as()`](/api/date-time/#as) dentro de una cadena de métodos:

```js
import { date, datetime } from 'native-dates';

const invoice = date('2026-11-16');
invoice.yearMonth.toString(); // '2026-11'
invoice.monthDay.toString(); // '11-16'

datetime('2026-11-01T02:00:00Z', 'America/Los_Angeles').as('yearMonth').toString();
// '2026-10'
```

En sentido inverso, llama a `on()` con un día sobre un `YearMonth` o a [`in()`](/api/month-day/#in) con un año sobre un `MonthDay` para obtener una fecha de calendario completa.

## Formatear y almacenar

Ambos tipos se formatean mediante `.text` y [`format()`](/api/year-month/#format), y se convierten en cadenas ISO con [`toString()`](/api/year-month/#tostring):

```js
import { monthDay, yearMonth } from 'native-dates';

yearMonth('2026-11').format('long', 'en-US'); // 'November 2026'
yearMonth('2026-05').format('long', 'ru'); // 'май 2026 г.'
monthDay('10-17').format('long', 'en-US'); // 'October 17'

yearMonth('2026-11').toString(); // '2026-11'
monthDay('10/17').toString(); // '10-17'
```

Cadenas como `2026-11` y `10-17` se guardan limpiamente en una base de datos o una URL y se reconstruyen directamente con `yearMonth()` y `monthDay()`.
