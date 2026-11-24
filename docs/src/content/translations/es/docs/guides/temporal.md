---
source: "ed93e959dec0"
title: Trabajar con Temporal
lede: Cómo se corresponde Native Dates con la API Temporal de JavaScript e interopera con valores Temporal nativos.
---

Native Dates envuelve las APIs integradas `Temporal` e `Intl` de JavaScript.

Temporal ofrece primitivas exactas de calendario y zona horaria mediante objetos de opciones explícitos. Native Dates envuelve los casos cotidianos en métodos concisos sin perder interoperabilidad directa con instancias nativas de Temporal.

## Correspondencia de tipos con Temporal

Cada clase principal envuelve un tipo subyacente de `Temporal` y lo devuelve cuando necesitas control de bajo nivel:

| Tipo | Envuelve | Qué aporta Native Dates |
|---|---|---|
| [`DateTime`](/api/date-time/) | `Temporal.ZonedDateTime` | Lee instantes ISO, desplazamientos UTC, instancias `Date` y marcas de tiempo numéricas en un único tipo con zona horaria y serializa a UTC |
| [`CalendarDate`](/api/calendar-date/) | `Temporal.PlainDate` | Se combina con `at(time, zone)` y formatea presets y patrones de tokens directamente |
| [`Time`](/api/time/) | `Temporal.PlainTime` | Lee cadenas de 12 horas como `'9:30am'` además de horas ISO de 24 horas |
| [`Duration`](/api/duration/) | `Temporal.Duration` | Interpreta expresiones como `'1h 30m'`, propaga unidades fraccionarias y conserva la referencia de `until()` |
| [`YearMonth`](/api/year-month/) | `Temporal.PlainYearMonth` | Clase integrada para meses de facturación y vencimientos de tarjetas, con [`monthYear()`](/api/year-month-fn/#monthyear) y `on()` |
| [`MonthDay`](/api/month-day/) | `Temporal.PlainMonthDay` | Clase integrada para cumpleaños y fechas recurrentes, con [`dayMonth()`](/api/month-day-fn/#daymonth), `fallsOn()` y `next()` |

Temporal deja los rangos fuera de su especificación. El núcleo añade [`DateRange`, `DateTimeRange` y `TimeRange`](/api/ranges/) sobre pares de extremos para comprobar pertenencia y solapamiento, e iterar por pasos.

## Pasar objetos Temporal como entrada

Todas las funciones de creación, los métodos aritméticos y las comparaciones aceptan valores `Temporal` directamente.

```js
import { date, datetime, time, yearMonth } from 'native-dates';

const instant = Temporal.Instant.from('2026-11-16T17:30:00Z');
const standup = datetime(instant, 'America/Los_Angeles');

const plainDate = Temporal.PlainDate.from('2026-11-16');
date(plainDate).plus(Temporal.Duration.from({ weeks: 2 }));

const plainTime = Temporal.PlainTime.from('09:30');
time(plainTime).format('short', 'en-US'); // '9:30 AM'

const ym = yearMonth(Temporal.PlainYearMonth.from('2026-11'));
ym.daysInMonth; // 30
```

Si pasas un `Temporal.ZonedDateTime` a [`datetime()`](/api/datetime-fn/), conserva su zona horaria a menos que indiques una nueva. Si pasas un instante o una fecha y hora sin zona, el valor se ubica en la zona que especifiques o en la configurada por defecto.

Los valores y cadenas de Temporal con calendarios no ISO, como el japonés o el persa, se convierten al mismo día ISO sin necesidad de llamar antes a `withCalendar()`.

Las comparaciones y mediciones de intervalos también aceptan valores de Temporal directamente:

```js
const berlin = Temporal.ZonedDateTime.from('2026-11-16T18:30:00+01:00[Europe/Berlin]');
standup.equals(berlin); // true
```

## Obtener la instancia interna con toTemporal()

Llama a [`toTemporal()`](/api/date-time/#totemporal) en cualquier valor para acceder a su instancia subyacente de Temporal.

Úsalo al trabajar con bibliotecas de terceros que esperan objetos Temporal o al operar con sistemas de calendario no ISO.

```js
import { date } from 'native-dates';

const d = date('2026-11-16');
const plain = d.toTemporal(); // Temporal.PlainDate

const japanese = plain.withCalendar('japanese');
japanese.era; // 'reiwa'
japanese.eraYear; // 8
```

:::note[Acceso sin copias]
Cada instancia guarda internamente un objeto Temporal real, así que `toTemporal()` devuelve ese mismo objeto sin volver a interpretarlo ni reservar memoria para una copia.
:::

## Polyfill para entornos anteriores

Las versiones actuales de Chrome, Edge, Firefox, Node 26+, Deno y Bun traen `Temporal` integrado, por lo que el núcleo no incluye código de polyfill.

En Safari, navegadores antiguos o Node 22–25, carga `@native-dates/polyfill` junto con `temporal-polyfill` al arrancar la aplicación (también ofrece un respaldo de `Intl.DurationFormat` en Node 22–23). Consulta [Compatibilidad con Safari y versiones anteriores de Node](/guides/installation/#supporting-safari-and-older-node) para ver la configuración y las opciones de carga síncrona.
