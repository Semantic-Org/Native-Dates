---
source: "f7719b9dc227"
title: Migrar desde Moment
lede: Deja atrás Moment y moment-timezone y pasa a valores inmutables con tokens integrados y sin tablas de zonas horarias en el paquete.
---

Moment y `moment-timezone` resolvieron el manejo de fechas en JavaScript durante años, a costa de objetos mutables, meses numerados desde cero y paquetes pesados de zonas horarias.

Migrar elimina las copias defensivas y el peso extra del paquete, y te permite actualizar repositorios grandes un módulo a la vez.

## Todos los valores son inmutables

Sumar días o mover una fecha al inicio del mes en Moment muta la instancia original. Pasar una fecha compartida a una función auxiliar puede corromper en silencio el estado del código que la invocó si alguien olvida clonarla antes.

En Native Dates todos los valores son inmutables. Métodos como [`plus()`](/api/date-time/#plus) e [`in()`](/api/date-time/#in) devuelven siempre una instancia nueva y dejan intacta la original.

```js
import { date } from 'native-dates';

const start = date('2026-11-16');
const deadline = start.plus(7, 'days');

start.toString(); // '2026-11-16'
deadline.toString(); // '2026-11-23'
```

:::tip[Elimina las llamadas defensivas a clone]
Puedes borrar cada llamada a `.clone()` durante la migración. También se incluyen alias inmutables para sumar y restar para que las llamadas aritméticas existentes sigan funcionando.
:::

## Tipos dedicados y meses numerados desde 1

Moment agrupa todos los conceptos en una sola clase y numera los meses del 0 al 11, donde el mes 10 representa noviembre. Aquí `month` es una propiedad simple que va del 1 al 12.

Usa [`date()`](/api/date-fn/) para fechas de calendario, [`datetime()`](/api/datetime-fn/) para instantes con zona horaria y las funciones del núcleo para [horas del día](/api/time-fn/), [meses de facturación](/api/year-month-fn/) y [cumpleaños recurrentes](/api/month-day-fn/):

```js
import { date, datetime, monthDay, yearMonth } from 'native-dates';

const invoiceDate = date(2026, 11, 16);
invoiceDate.month; // 11, noviembre

const sentAt = datetime('2026-11-16T17:30:00Z', 'America/New_York');
sentAt.hour; // 12

const billing = yearMonth('2026-11');
const birthday = monthDay('10/17');
```

## Sin datos de zonas horarias en tu paquete

`moment-timezone` envía al navegador su propia copia de la base de datos IANA.

El núcleo lee las reglas de zona horaria directamente de los motores Temporal e Intl del entorno de ejecución. Todas las zonas IANA funcionan de serie, y [`@native-dates/plugins/zones`](/plugins/zones/) añade la resolución de ciudades y abreviaturas cuando recibes nombres en inglés como `'Berlin'` o `'Pacific Time'`.

```js
import { datetime } from 'native-dates';

const kickoff = datetime('2026-11-16T09:30', 'America/Los_Angeles');

kickoff.in('Europe/London').format('short', 'en-GB'); // '16/11/2026, 17:30'
kickoff.in('Asia/Tokyo').format('short', 'en-US'); // '11/17/26, 2:30 AM'
```

## Tokens, presets y rangos en el núcleo

Los [patrones de tokens](/guides/formatting/#token-patterns) de Moment, los presets localizados desde `'LT'` hasta `'llll'`, las expresiones relativas y los [rangos](/api/ranges/) funcionan en el núcleo sin plugins:

```js
import { dateRange, datetime } from 'native-dates';

const kickoff = datetime('2026-11-16T09:30', 'America/Los_Angeles');
kickoff.format('YYYY-MM-DD HH:mm'); // '2026-11-16 09:30'
kickoff.format('LLL', 'en-US'); // 'November 16, 2026 at 9:30 AM'
kickoff.from('2026-11-16T07:30-08:00', 'en-US'); // 'in 2 hours'

const quarter = dateRange('2026-10-01', '2026-12-31');
quarter.contains('2026-11-16'); // true
quarter.overlaps(dateRange('2026-12-15', '2027-01-15')); // true
```

## Referencia comparativa

| Moment | Native Dates | Notas |
|---|---|---|
| `moment()` | `now()` o `today()` | Instante explícito frente a fecha de calendario |
| `moment.tz(str, zone)` | `datetime(str, zone)` | Integrado en el núcleo sin datos tzdata empaquetados |
| `m.clone().add(7, 'days')` | `d.plus(7, 'days')` | Siempre inmutable, y el alias `add()` también funciona |
| `m.tz('Europe/Berlin')` | `dt.in('Europe/Berlin')` | Muestra el mismo instante en otra zona horaria |
| `m.month()`, `m.date()` | `d.month`, `d.day` | Propiedades simples con meses del 1 al 12 |
| `m.day()`, `m.isoWeekday()` | `d.dayOfWeek` | Estándar ISO del 1 en lunes al 7 en domingo; tokens `'E'` para 1–7 y `'d'` para 0–6 |
| `m.unix()`, `m.valueOf()` | `dt.epochSeconds`, `dt.epochMilliseconds` | Cada conteo desde 1970 indica su unidad en el nombre |
| `b.diff(a, 'hours', true)` | `a.until(b, 'hours')` | Total fraccionario en la unidad solicitada |
| `moment.duration(2, 'h')` | `hours(2)` o `duration('2h')` | Utilidades de duración integradas en el núcleo |
| `m.format('LLL')` | `dt.format('LLL')` | Presets localizados de `'LT'` a `'llll'` sin archivos de locale |
| `m.format('YYYY-MM-DD HH:mm')` | `dt.format('YYYY-MM-DD HH:mm')` | [Patrones de tokens](/guides/formatting/#token-patterns) |
| `m.isBetween(a, b)` | `dateRange(a, b).contains(d)` | [Rangos](/api/ranges/) con `to()`, `for()` y `overlaps()` |
| `m.fromNow()`, `m.from(other)` | `dt.fromNow()`, `dt.from(other)` | [Expresiones relativas](/guides/formatting/#relative-phrases) |
| Interpretación de cadenas no ISO | `{ format }` o `{ loose: true }` | Carga [`@native-dates/plugins/parse`](/plugins/parse/) para patrones de formato fijos, o [`@native-dates/plugins/loose`](/plugins/loose/) para entradas informales y adaptadas al locale |

## Migrar de forma gradual

Los proyectos grandes rara vez se migran en un único cambio. Llama a [`toJSDate()`](/api/date-time/#tojsdate) en los puntos de integración que aún esperan un objeto `Date` nativo de JavaScript, y vuelve a pasar esas fechas a [`datetime()`](/api/datetime-fn/) al entrar en el código migrado.

```js
import { datetime } from 'native-dates';

const sentAt = datetime('2026-11-16T17:30:00Z', 'America/New_York');
const legacy = sentAt.toJSDate();
const restored = datetime(legacy, 'America/New_York');
```

Cuando los módulos dependientes aún llaman directamente a getters heredados como `getFullYear()`, importa el plugin [`legacy-date`](/plugins/legacy-date/).

Los métodos getter leen los campos en la propia zona horaria del valor y mantienen los meses numerados desde 0 para ofrecer compatibilidad directa. Los setters que mutan la instancia lanzan un error de inmediato para que las modificaciones ocultas afloren en las pruebas.

```js
import '@native-dates/plugins/legacy-date';
import { datetime } from 'native-dates';

const dt = datetime('2026-11-16T09:30', 'America/Los_Angeles');

dt.getFullYear(); // 2026
dt.getMonth(); // 10, igual que Date.prototype.getMonth()
dt.getHours(); // 9, en America/Los_Angeles
```
