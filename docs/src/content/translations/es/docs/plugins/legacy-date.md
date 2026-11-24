---
source: 'a8aba5e485f9'
title: legacy-date
lede: Getters y formateadores de solo lectura de Date.prototype en DateTime para migrar de forma incremental.
---

## Migrar código que usa Date de forma incremental

Importa el plugin una sola vez para añadir getters de solo lectura en el prototipo de [`DateTime`](/api/date-time/). Así, tus utilidades, formateadores y componentes que esperan métodos nativos pueden recibir un `DateTime` directamente mientras migras archivo por archivo.

```js title="legacy-date.js"
import '@native-dates/plugins/legacy-date';
import { datetime } from 'native-dates';

const moment = datetime('2026-09-06T14:30:15.250', 'America/New_York');

moment.getFullYear(); // 2026
moment.getMonth(); // 8 (septiembre, numerado desde 0 como en Date)
moment.getDate(); // 6
moment.getHours(); // 14 (en America/New_York, no en la zona del sistema operativo)
moment.getUTCHours(); // 18
```

Las fechas nativas de JavaScript siempre leen los campos locales en la zona horaria del sistema operativo. En cambio, un `DateTime` evalúa cada getter local y cada formateador de locale en su propia `zone`.

:::warning[Meses numerados desde cero y domingo = 0]
Los getters heredados conservan la numeración nativa para que el código existente no falle en silencio. `getMonth()` va de 0 a 11 y `getDay()` devuelve 0 para el domingo, mientras que las propiedades del núcleo cuentan los meses desde 1 y los días de la semana desde el lunes.
:::

## Getters sensibles a la zona horaria y UTC

Todos los getters estándar de lectura están disponibles en cada instancia de `DateTime`.

| Método | Valor devuelto | Comportamiento en DateTime |
|---|---|---|
| `getTime()` | `number` | Milisegundos desde la época Unix, idéntico a `dt.epochMilliseconds`. |
| `getFullYear()` | `number` | Año de calendario de cuatro dígitos en `dt.zone`. |
| `getMonth()` | `number` | Mes numerado desde cero, de 0 para enero a 11 para diciembre, en `dt.zone`. |
| `getDate()` | `number` | Día del mes del 1 al 31 en `dt.zone`. |
| `getDay()` | `number` | Día de la semana, de 0 para domingo a 6 para sábado, en `dt.zone`. |
| `getHours()`, `getMinutes()`, `getSeconds()`, `getMilliseconds()` | `number` | Campos de reloj evaluados en `dt.zone`. |
| `getTimezoneOffset()` | `number` | Desplazamiento en minutos al oeste de UTC para `dt.zone`, como `240` para `-04:00` o `-330` para `+05:30`. |
| `getUTCFullYear()`, `getUTCMonth()`, `getUTCDate()`, `getUTCDay()` | `number` | Campos de calendario en UTC, con meses numerados desde cero y domingo como 0. |
| `getUTCHours()`, `getUTCMinutes()`, `getUTCSeconds()`, `getUTCMilliseconds()` | `number` | Campos de reloj en UTC. |

```js
const kolkata = datetime('2026-01-06T09:00', 'Asia/Kolkata');

kolkata.getTimezoneOffset(); // -330
kolkata.getHours(); // 9
kolkata.getUTCHours(); // 3
```

## Métodos de cadena y de locale

Los métodos heredados de cadena coinciden con la salida nativa y usan por defecto la zona horaria propia de la instancia para el formateo según el locale.

| Método | Valor devuelto | Comportamiento en DateTime |
|---|---|---|
| `toISOString()` | `string` | Marca de tiempo UTC con precisión de milisegundos, incluso si la instancia conserva dígitos submilisegundo. |
| `toLocaleString(locales?, options?)` | `string` | Fecha y hora formateadas en `dt.zone` y [`dt.locale()`](/api/date-time/#locale), salvo que se sobrescriban. |
| `toLocaleDateString(locales?, options?)` | `string` | Parte de fecha formateada en `dt.zone` y `dt.locale()`, salvo que se sobrescriban. |
| `toLocaleTimeString(locales?, options?)` | `string` | Parte de hora formateada en `dt.zone` y `dt.locale()`, salvo que se sobrescriban. |

```js
const flight = datetime('2026-09-06T14:30:15.250', 'America/New_York');

flight.toISOString(); // '2026-09-06T18:30:15.250Z'
flight.toLocaleDateString('en-US'); // '9/6/2026'
flight.toLocaleTimeString('en-US'); // '2:30:15 PM'
flight.toLocaleTimeString('en-US', { timeZone: 'UTC' }); // '6:30:15 PM'
```

## Los setters lanzan un error al intentar mutar

Las instancias son inmutables, por lo que cada setter mutador lanza un error y dirige a [`set()`](/api/date-time/#set) o [`plus()`](/api/date-time/#plus).

| Grupo | Métodos bloqueados | Reemplazo inmutable |
|---|---|---|
| Época Unix | `setTime()` | Pasa los milisegundos desde la época Unix a [`datetime()`](/api/datetime-fn/). |
| Campos locales | `setFullYear()`, `setMonth()`, `setDate()`, `setHours()`, `setMinutes()`, `setSeconds()`, `setMilliseconds()` | Reemplaza los campos en `dt.zone` con [`dt.set()`](/api/date-time/#set). |
| Campos UTC | `setUTCFullYear()`, `setUTCMonth()`, `setUTCDate()`, `setUTCHours()`, `setUTCMinutes()`, `setUTCSeconds()`, `setUTCMilliseconds()` | Cambia primero a UTC con [`dt.in('UTC').set()`](/api/date-time/#in). |

```js
const reminder = datetime('2026-09-06T14:30Z');

try {
  reminder.setHours(9);
} catch (err) {
  err.code; // 'immutable'
}

const updated = reminder.set('hour', 9);
updated.hour; // 9
```

## Cuándo usar toJSDate en su lugar

Un `DateTime` nunca suplanta `instanceof Date` ni la etiqueta nativa de objeto. Cuando necesites pasar una marca de tiempo a una biblioteca de gráficos, un controlador de base de datos o un validador que comprueba la identidad del objeto o muta su copia, llama a [`toJSDate()`](/api/date-time/#tojsdate) del núcleo:

```js
const nativeDate = datetime('2026-09-06T14:30Z').toJSDate();
nativeDate instanceof Date; // true
```
