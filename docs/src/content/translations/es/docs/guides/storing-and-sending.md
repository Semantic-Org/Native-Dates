---
source: "2eb400c31ff1"
title: Almacenamiento y envío
lede: Serializa fechas, horas e intervalos de forma limpia en APIs JSON, bases de datos y campos HTML.
---

Cada tipo se serializa a una cadena estándar ISO 8601 al convertirse en texto o pasar por `JSON.stringify()`. Al otro lado, esas mismas cadenas se reconstruyen directamente con la fábrica correspondiente.

## JSON y formatos de intercambio

Pasa los valores directamente a `JSON.stringify()` sin funciones de reemplazo ni objetos envolventes:

```js
import { date, duration, time } from 'native-dates';

const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');

JSON.stringify({
  startsAt: standup,
  dueOn: date('2026-11-16'),
  opensAt: time('9:30am'),
  length: duration('1h 30m'),
});
// '{"startsAt":"2026-11-16T17:30:00.000Z","dueOn":"2026-11-16","opensAt":"09:30:00","length":"PT1H30M"}'
```

| Tipo | Salida serializada | Uso habitual en cargas útiles |
|---|---|---|
| [`DateTime`](/api/date-time/) | `'2026-11-16T17:30:00.000Z'` | Marcas de auditoría, salidas de vuelos e instantes de reuniones |
| [`CalendarDate`](/api/calendar-date/) | `'2026-11-16'` | Fechas de vencimiento, días festivos y noches de reserva |
| [`Time`](/api/time/) | `'09:30:00'` | Horarios de apertura y recordatorios diarios |
| [`Duration`](/api/duration/) | `'PT1H30M'` | Tiempos de espera, SLA, duraciones de facturación y temporizadores |
| [`YearMonth`](/api/year-month/) | `'2026-11'` | Períodos de facturación, vencimientos de tarjetas y campos de mes |
| [`MonthDay`](/api/month-day/) | `'10-17'` | Cumpleaños recurrentes y festivos anuales sin año de nacimiento |
| [Rangos](/api/ranges/) | `'2026-11-01/2026-11-07'` | Ventanas de reserva, sprints e intervalos ISO 8601 con barra |

Cuando una API externa, una clave de caché o una columna de enteros espera un número, obtén el tiempo transcurrido desde 1970 en la unidad que necesites. Cada propiedad indica explícitamente su unidad, ya que algunos sistemas cuentan en segundos y otros en milisegundos:

```js
standup.toString(); // '2026-11-16T17:30:00.000Z'
standup.epochSeconds; // 1794850200
standup.epochMilliseconds; // 1794850200000
duration('1h 30m').toMilliseconds(); // 5400000
```

## Recuperar valores en el código

Pasa cada cadena serializada a su fábrica correspondiente al leer respuestas JSON, filas de base de datos o parámetros de URL:

```js
import { date, dateRange, datetime, duration, time, yearMonth } from 'native-dates';

const startsAt = datetime('2026-11-16T17:30:00.000Z', 'America/Los_Angeles');
const dueOn = date('2026-11-16');
const opensAt = time('09:30:00');
const length = duration('PT1H30M');
const billing = yearMonth('2026-11');
const window = dateRange('2026-11-01/2026-11-07');
```

Cada `DateTime` se serializa en UTC para que dos clientes que registren el mismo evento generen cadenas idénticas. Pasar una zona horaria al leer esa cadena muestra ese instante UTC exacto en hora local sin alterar cuándo ocurrió.

## Eventos futuros y recurrentes

Para eventos pasados como recibos de pedidos o registros de servidor, basta con una marca de tiempo UTC. Los eventos futuros programados por personas necesitan guardar también la `zone` IANA junto con la marca de tiempo.

```js
import { date, datetime } from 'native-dates';

const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
const row = {
  startsAt: standup.toString(),
  zone: standup.zone, // 'America/Los_Angeles'
};

const nextWeek = datetime(row.startsAt, row.zone).plus(1, 'week');
nextWeek.hour; // 9
```

Al conservar la zona horaria, sumar semanas o meses mantiene la hora local de las 9:30 AM incluso al cruzar cambios del horario de verano, y recoge automáticamente futuras modificaciones legales en las reglas horarias locales.

:::tip[Guarda nombres IANA, no desplazamientos]
Un desplazamiento como `'-08:00'` solo describe el invierno en Los Ángeles. Guarda `zone` siempre que los cálculos de calendario futuros deban respetar los cambios locales del horario de verano.
:::

## Columnas de base de datos

Elige el tipo de columna SQL que corresponda al valor que guardas para que la base de datos aplique los mismos límites que tu aplicación.

| Tipo | Columna SQL | Por qué encaja |
|---|---|---|
| `DateTime` | `timestamptz` o `bigint` | Almacena un instante UTC exacto sin ambigüedad |
| `CalendarDate` | `date` | Almacena `YYYY-MM-DD` sin desplazamientos de medianoche por zona horaria |
| `Time` | `time` | Almacena `HH:MM:SS` sin inventar una fecha ficticia |
| `Duration` | `interval` o `text` | Almacena intervalos estructurados o cadenas `PT` de ISO 8601 |

Evita columnas SQL `timestamp` sin zona horaria para instantes reales. Muchos controladores de base de datos reinterpretan esas marcas de tiempo en la zona horaria local del servidor.

## Campos HTML y URLs

Los controles HTML nativos de fecha, mes y hora leen y escriben exactamente las mismas cadenas ISO que producen los tipos del núcleo. Los parámetros de consulta en una URL aprovechan el mismo formato compacto.

```js
import { date, time, yearMonth } from 'native-dates';

// <input type="date" value="2026-11-16">
const due = date('2026-11-16');
due.toString(); // '2026-11-16'

// <input type="month" value="2026-11">
const billing = yearMonth('2026-11');
billing.toString(); // '2026-11'

// <input type="time" value="09:30">
const opens = time('09:30');
opens.toString().slice(0, 5); // '09:30'

const params = new URLSearchParams({ from: due.toString() });
params.toString(); // 'from=2026-11-16'
```

Leer los campos de fecha con [`date()`](/api/date-fn/) evita además el clásico error de `new Date('2026-11-16')`, donde la medianoche UTC retrocede un día en zonas horarias del hemisferio occidental.
