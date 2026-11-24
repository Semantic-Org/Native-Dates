---
source: "50f6c5cb4f97"
title: datetime()
lede: Crea un DateTime a partir de una marca de tiempo, una cadena, un Date o un objeto de campos, o lee el instante actual.
---

## Leer instantes

:::entry
### `datetime()` :kind[function]

```js signature
datetime(input, zone?): DateTime
datetime(input, options?): DateTime
```

Convierte una cadena, una marca de tiempo, un objeto de campos o una fecha de calendario en un [`DateTime`](/api/date-time/) expresado en una zona horaria. Si omites la zona horaria, usa el [valor predeterminado configurado](/api/configure/) o la zona local del entorno.

```js title="read.js"
import { date, datetime } from 'native-dates';

const fromUtc = datetime('2026-11-16T17:30:00Z', 'America/Los_Angeles');
const fromWall = datetime('2026-11-16 09:30', 'Europe/Berlin');
const fromZone = datetime('2026-11-16T09:30[America/New_York]');
const fromEpoch = datetime(1794850200000, 'UTC');
const fromDate = datetime(date('2026-11-16'), 'America/New_York');
```

**Parámetros**

```params
- name: input
  type: DateTimeInput
  required: true
  description: Cadena ISO, milisegundos Unix, `Date`, objeto de campos, fecha de calendario o valor de Temporal.
- name: zoneOrOptions
  type: Zone | ReadOptions
  description: Cadena de zona horaria como `'Europe/Berlin'` o `'UTC'`, u objeto de opciones.
  options:
    - name: zone
      type: Zone
      description: Zona horaria en la que se expresa el instante; reemplaza cualquier zona entre corchetes en `input`.
    - name: locale
      type: Locale
      description: Etiqueta de locale BCP 47 asociada al `DateTime` devuelto y a cualquier valor derivado de él.
    - name: loose
      type: boolean
      default: 'false'
      description: "Lectura de cadenas de fecha informales con `@native-dates/plugins/loose`; devuelve `null` si la entrada no se puede interpretar."
    - name: dayFirst
      type: boolean
      description: "Anulación del orden numérico de fechas del locale activo para cadenas como `'07/09/2026'` en modo loose."
```

**Devuelve**

```returns
type: DateTime
description: "Instancia `DateTime` en la zona horaria resuelta, o `null` si el modo loose no logra interpretar `input`."
```

Al importar [`@native-dates/plugins/loose`](/plugins/loose/), el modo loose interpreta fechas y horas informales en el locale activo, delega en el analizador del motor los formatos de máquina y devuelve `null` si la entrada no se puede leer:

```js
import { datetime } from 'native-dates';
import '@native-dates/plugins/loose';

datetime('Mon, 16 Nov 2026 17:30:00 GMT', { zone: 'America/New_York', loose: true });
datetime('not a timestamp', { loose: true }); // null
```
:::

### Entradas aceptadas

Cada entrada produce una instancia inmutable expresada en la zona horaria de destino:

| Entrada | Ejemplo | Cómo se interpreta |
|---|---|---|
| Cadena ISO con desplazamiento | `'2026-11-16T17:30:00Z'`, `'2026-11-16 12:30-05:00'` | Fija el instante exacto y lo expresa en la zona horaria de destino. |
| Cadena con zona entre corchetes | `'2026-11-16T09:30[America/New_York]'` | Conserva la zona entre corchetes salvo que un segundo argumento la reemplace. |
| Fecha y hora local | `'2026-11-16T09:30'`, `'2026年11月16日 14:30'` | Lee una fecha con el año primero y una hora del día directamente en la zona de destino. |
| Cadena de fecha o [CalendarDate](/api/calendar-date/) | `'2026-11-16'`, `date(2026, 11, 16)` | Comienza al inicio de ese día del calendario en la zona de destino. |
| Milisegundos o `Date` | `1794850200000`, `new Date()` | Convierte la marca de tiempo Unix a la zona de destino y trunca los milisegundos fraccionarios igual que `Date`. |
| Objeto de campos | `{ year: 2026, month: 11, day: 16, hour: 9 }` | Lee campos de calendario (meses del 1 al 12) y de reloj en la zona de destino y rechaza fechas imposibles. |
| `DateTime` o Temporal | `dt`, `Temporal.Instant`, `Temporal.ZonedDateTime` | Conserva la zona existente salvo que se pase una zona explícita. |

:::note[Los valores vacíos nunca se convierten en el instante actual]
Pasar `undefined` o `null` lanza un error para evitar que una columna vacía de una base de datos se transforme por accidente en la fecha y hora actuales. Llama a [`now()`](#now) cuando necesites el instante actual.
:::

## Instante actual y día de hoy

Consulta el instante actual o define los límites de búsqueda para el día de hoy en cualquier zona horaria.

:::entry
### `now()` :kind[function]

```js signature
now(zone?): DateTime
```

Devuelve el instante actual con precisión de milisegundos en la zona horaria indicada o en la zona predeterminada. La precisión en milisegundos coincide con `Date.now()`, de modo que las marcas de tiempo se serializan y recuperan en JSON sin cambios.

**Parámetros**

```params
- name: zone
  type: Zone
  description: Zona horaria en la que se consulta el instante actual, como `'Asia/Tokyo'` o `'UTC'`.
```

**Devuelve**

```returns
type: DateTime
description: Instancia `DateTime` del milisegundo actual en `zone`.
```

```js
import { now } from 'native-dates';

const local = now();
const tokyo = now('Asia/Tokyo');
const utc = now('UTC');
```
:::

:::entry
### `startOfToday()` :kind[function]

```js signature
startOfToday(zone?): DateTime
```

Devuelve el inicio del día de hoy en la zona horaria indicada, que coincide con el comienzo del día del calendario local. Resulta útil como límite inferior al consultar eventos o registros creados hoy.

**Parámetros**

```params
- name: zone
  type: Zone
  description: Zona horaria en la que se calcula el día actual.
```

**Devuelve**

```returns
type: DateTime
description: Instancia `DateTime` al inicio de hoy en `zone`.
```

```js
import { startOfToday } from 'native-dates';

const opens = startOfToday('America/New_York');
opens.hour; // 0
opens.minute; // 0
```
:::

:::entry
### `endOfToday()` :kind[function]

```js signature
endOfToday(zone?): DateTime
```

Devuelve el último milisegundo de hoy en la zona horaria indicada.

**Parámetros**

```params
- name: zone
  type: Zone
  description: Zona horaria en la que se calcula el día actual.
```

**Devuelve**

```returns
type: DateTime
description: Instancia `DateTime` a las `23:59:59.999` de la fecha de hoy en `zone`.
```

```js
import { endOfToday } from 'native-dates';

const cutoff = endOfToday('America/New_York');
cutoff.hour; // 23
cutoff.millisecond; // 999
```
:::
