---
source: "bb49ea92ac08"
title: time()
lede: Crea un Time a partir de una cadena en formato de 12 o 24 horas, números, un objeto de campos o una marca de tiempo.
---

## Leer horas del día

:::entry
### `time()` :kind[function]

```js signature
time(input, options?): Time
time(input, zone?): Time
time(hour, minute?, second?): Time
```

Crea un [`Time`](/api/time/) a partir de una cadena de reloj, números enteros de hora, minuto y segundo, un objeto de campos o una marca de tiempo. Las entradas ausentes lanzan un `TypeError` en lugar de usar la hora actual del sistema.

```js title="clock.js"
import { datetime, time } from 'native-dates';

const morning = time('9am');
const closing = time('5:30pm');
const iso = time('17:30:00');
const fromNumbers = time(9, 30);
const fromFields = time({ hour: 17, minute: 30, millisecond: 250 });
const fromInstant = time('2026-11-16T17:30:00Z', 'America/New_York');
const fromMoment = time(datetime('2026-11-16T17:30:00Z'), 'Europe/Berlin');
const fromTemporal = time(Temporal.PlainTime.from('08:15'));

closing.toString(); // '17:30:00'
fromInstant.toString(); // '12:30:00'
fromMoment.toString(); // '18:30:00'
```

**Parámetros**

```params
- name: input
  type: TimeInput | number
  required: true
  description: Cadena de reloj, objeto de campos, hora o marca de tiempo existente, o la hora (`hour`) en formato de 24 horas del 0 al 23.
- name: options
  type: Zone | ReadOptions | number
  description: Zona horaria u objeto de opciones al leer una marca de tiempo o una cadena en modo loose, o el minuto (`minute`) del 0 al 59.
  options:
    - name: zone
      type: Zone
      description: Zona horaria usada para extraer la hora del día de una cadena de instante, un `DateTime` o un `Date`.
    - name: locale
      type: Locale
      description: Etiqueta de locale BCP 47 asociada al `Time` devuelto y a cualquier valor derivado de él.
    - name: loose
      type: boolean
      default: 'false'
      description: "Lectura de cadenas informales de fecha y hora con `@native-dates/plugins/loose`; devuelve `null` si la entrada no se puede interpretar."
    - name: dayFirst
      type: boolean
      description: "Anulación del orden numérico de fechas del locale activo cuando el modo loose interpreta una cadena con fecha y hora."
- name: second
  type: number
  description: Segundos (`second`) como número entero del 0 al 59 cuando se pasan números. Las fracciones de segundo se escriben en una cadena o en un objeto de campos.
```

**Devuelve**

```returns
type: Time
description: "Instancia `Time` que representa una hora del día, o `null` si el modo loose no logra interpretar `input`."
```

Cuando el [plugin loose](/plugins/loose/) está cargado, el modo loose interpreta horas con períodos del día localizados, horas separadas por punto en los locales que las usan y marcas de tiempo informales, y devuelve `null` ante entradas ilegibles:

```js
import { time } from 'native-dates';
import '@native-dates/plugins/loose';

time('오후 2:30', { loose: true, locale: 'ko' })?.toString(); // '14:30:00'
time('14.30', { loose: true, locale: 'fi' })?.toString(); // '14:30:00'
time('Mon, 16 Nov 2026 17:30:00 GMT', {
  zone: 'America/New_York',
  loose: true,
})?.toString(); // '12:30:00'
time('whenever', { loose: true }); // null
```
:::

## Entradas aceptadas

Las cadenas en formato de 12 horas aceptan horas del 1 al 12 seguidas de AM o PM. La medianoche es 12 AM y el mediodía es 12 PM.

| Entrada | Ejemplo | Cómo se interpreta |
|---|---|---|
| Cadena de 12 horas | `'9am'`, `'5:30pm'`, `'12:15 a.m.'` | Lee horas del 1 al 12 con `am` o `pm`, más minutos, segundos y fracciones opcionales. |
| Cadena de 24 horas | `'09:00'`, `'14h30'`, `'17:30:15.250'` | Lee cadenas de 24 horas con dos puntos o `h` entre hora y minuto, con precisión hasta nanosegundos. |
| Cadena ISO de instante | `'2026-11-16T17:30:00Z'` | Obtiene la hora local de ese instante en la zona indicada o en la predeterminada. |
| Números de reloj | `time(9)`, `time(9, 30)`, `time(17, 30, 15)` | Acepta números enteros para la hora y, de forma opcional, minutos y segundos. |
| Objeto de campos | `{ hour: 9, minute: 30, millisecond: 250 }` | Lee campos de reloj en singular o plural y rechaza valores fuera de rango. |
| [DateTime](/api/date-time/) o Temporal | `time(dt, 'Asia/Tokyo')`, `Temporal.PlainTime` | Extrae la hora del día y desplaza los instantes a la zona indicada cuando se proporciona. |
| `Date` de JavaScript | `time(jsDate, 'America/New_York')` | Obtiene la hora del día de ese instante en la zona indicada o en la predeterminada. |

:::tip[Leer la hora actual del día]
Obtén la hora actual en cualquier zona horaria mediante [`now()`](/api/datetime-fn/#now), por ejemplo `now('Europe/Berlin').time`.
:::
