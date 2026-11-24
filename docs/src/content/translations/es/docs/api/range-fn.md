---
source: "7f0f623e1e92"
title: dateRange()
lede: Crea un DateRange, DateTimeRange o TimeRange a partir de extremos, duraciones o cadenas de intervalo.
---

## Crear rangos

Las funciones independientes construyen [rangos](/api/ranges/) a partir de entradas sin procesar, pares de extremos o una única cadena de intervalo. Si ya tienes una instancia tipada, llama directamente a [`to()`](/api/ranges/#to) o [`range()`](/api/ranges/#range) sobre ella.

:::entry
### `dateRange()` :kind[function]

```js signature
dateRange(start, end, options?): DateRange
dateRange(interval, options?): DateRange
```

Crea un [`DateRange`](/api/ranges/#daterange) inclusivo entre dos fechas de calendario. Cuando el segundo argumento es una duración en inglés como `'7 days'`, el último día queda seis días después de la fecha inicial para que el rango abarque siete días en total.

```js title="dates.js"
import { dateRange, days } from 'native-dates';

const fromEnds = dateRange('2026-09-01', '2026-09-07');
const fromLength = dateRange('2026-09-01', days(7));
const fromInterval = dateRange('2026-09-01/2026-09-07');

fromEnds.duration.days; // 7
fromLength.toString(); // '2026-09-01/2026-09-07'
fromInterval.equals(fromEnds); // true
```

**Parámetros**

```params
- name: start
  type: CalendarDateInput | string
  required: true
  description: Entrada de fecha inicial, o una cadena de intervalo completa cuando se omite `end`.
- name: end
  type: CalendarDateInput | DurationInput | ReadOptions
  description: Fecha final inclusiva, duración del intervalo u objeto de opciones cuando `start` es una cadena de intervalo.
- name: options
  type: Zone | ReadOptions
  description: Zona horaria u opciones de lectura aplicadas al interpretar los extremos.
  options:
    - name: zone
      type: Zone
      description: Zona horaria usada para extraer días del calendario de cadenas de instante u objetos `Date`.
    - name: locale
      type: Locale
      description: Etiqueta de locale BCP 47 asociada al rango devuelto y a sus extremos.
    - name: loose
      type: boolean
      default: 'false'
      description: "Lectura de cadenas de fecha informales con `@native-dates/plugins/loose`; devuelve `null` si la entrada no se puede interpretar."
    - name: dayFirst
      type: boolean
      description: "Anulación del orden numérico de fechas del locale activo en modo loose."
```

**Devuelve**

```returns
type: DateRange
description: "Instancia `DateRange` inclusiva, o `null` si el modo loose no logra interpretar alguno de los extremos."
```
:::

:::entry
### `datetimeRange()` :kind[function]

```js signature
datetimeRange(start, end, options?): DateTimeRange
datetimeRange(interval, options?): DateTimeRange
```

Crea un [`DateTimeRange`](/api/ranges/#datetimerange) semiabierto que incluye el instante inicial y excluye el final. Si la entrada final no indica una zona horaria explícita, se interpreta en la zona del instante inicial.

**Parámetros**

```params
- name: start
  type: DateTimeInput | string
  required: true
  description: Entrada del instante inicial, o una cadena de intervalo cuando se omite `end`.
- name: end
  type: DateTimeInput | DurationInput | ReadOptions
  description: Instante final excluido, duración u objeto de opciones para una cadena de intervalo.
- name: options
  type: Zone | ReadOptions
  description: Zona horaria u opciones de lectura como `zone`, `locale` o `loose` para ambos extremos.
```

**Devuelve**

```returns
type: DateTimeRange
description: "Instancia `DateTimeRange` semiabierta, o `null` si el modo loose no logra interpretar alguno de los extremos."
```

```js
import { datetimeRange } from 'native-dates';

const meeting = datetimeRange('2026-09-01T09:00', '90m', 'America/New_York');
meeting.end.format('short', 'en-US'); // '9/1/26, 10:30 AM'

const zoned = datetimeRange('2026-09-01T09:00[America/New_York]/2026-09-01T10:30[America/New_York]');
zoned.start.zone; // 'America/New_York'
```
:::

:::entry
### `timeRange()` :kind[function]

```js signature
timeRange(start, end, options?): TimeRange
timeRange(interval, options?): TimeRange
```

Crea un [`TimeRange`](/api/ranges/#timerange) semiabierto entre dos horas del día que excluye la hora final. Cuando la hora final es anterior en el reloj a la inicial, el rango cruza la medianoche.

**Parámetros**

```params
- name: start
  type: TimeInput | string
  required: true
  description: Entrada de hora inicial, o una cadena de intervalo cuando se omite `end`.
- name: end
  type: TimeInput | DurationInput | ReadOptions
  description: Hora final excluida, duración en unidades de reloj u objeto de opciones para una cadena de intervalo.
- name: options
  type: Zone | ReadOptions
  description: Zona horaria u opciones de lectura como `zone`, `locale` o `loose` al extraer horas de marcas de tiempo.
```

**Devuelve**

```returns
type: TimeRange
description: "Instancia `TimeRange` semiabierta, o `null` si el modo loose no logra interpretar alguno de los extremos."
```

```js
import { timeRange } from 'native-dates';

const office = timeRange('9am - 5pm');
const overnight = timeRange('22:00', '8h');

office.toString(); // '09:00:00/17:00:00'
overnight.toString(); // '22:00:00/06:00:00'
```
:::

## Cadenas de intervalo y modo loose

Los intervalos escritos en una sola cadena se dividen por una barra ISO o por separadores de rango rodeados de espacios. Las barras dentro de los nombres de zona horaria IANA entre corchetes se mantienen intactas.

| Formato | Ejemplo | Cómo se interpreta |
|---|---|---|
| Intervalo ISO con barra | `'2026-09-01/2026-09-07'`, `'09:00/17:00'` | Divide por `/` fuera de las zonas horarias entre corchetes, al igual que la salida de [`toString()`](/api/ranges/#tostring). |
| Guion o semirraya con espacios | `'9am - 5pm'`, `'2026/09/01 - 2026/09/07'` | Divide primero por `-` o `–` rodeados de espacios y conserva los guiones y barras de las fechas. |
| Separador `to` en inglés | `'2026-09-01 to 2026-09-07'` | Divide por ` to ` rodeado de espacios. |
| Inicio y duración | `dateRange('2026-09-01', '7d')`, `timeRange('9am', '90m')` | Interpreta el segundo argumento como una duración cuando es una [`Duration`](/api/duration/), un objeto de campos o una frase de duración en inglés. |

Con el [plugin loose](/plugins/loose/) cargado, el modo loose interpreta extremos informales y devuelve `null` si alguno no se puede leer:

```js
import { dateRange } from 'native-dates';
import '@native-dates/plugins/loose';

dateRange('Sep 1, 2026 to Sep 7, 2026', { loose: true })?.toString();
// '2026-09-01/2026-09-07'

dateRange('not a range', { loose: true }); // null
```
