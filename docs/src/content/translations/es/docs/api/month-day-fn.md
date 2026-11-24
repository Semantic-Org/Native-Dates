---
source: "e681c4b680b0"
title: monthDay()
lede: Convierte una cadena de mes y día, dos números, un objeto de campos o una fecha en un MonthDay.
---

## Leer valores de mes y día

:::entry
### `monthDay()` :kind[function]

```js signature
monthDay(input, options?): MonthDay
monthDay(input, zone?): MonthDay
monthDay(month, day): MonthDay
```

Crea un [`MonthDay`](/api/month-day/) a partir de una cadena con el mes primero, números con meses del 1 al 12, un objeto de campos o una fecha existente. Se acepta el 29 de febrero para conservar sin cambios los cumpleaños y aniversarios de años bisiestos.

```js title="birthday.js"
import { datetime, monthDay } from 'native-dates';

const fromIso = monthDay('10-17');
const fromSlash = monthDay('10/17');
const fromNumbers = monthDay(2, 29);
const fromFields = monthDay({ month: 10, day: 17 });
const fromInstant = monthDay(datetime('2026-10-18T02:00:00Z'), 'America/Los_Angeles');

fromNumbers.toString(); // '02-29'
fromInstant.toString(); // '10-17'
```

**Parámetros**

```params
- name: input
  type: MonthDayInput | number | string
  required: true
  description: Cadena con el mes primero, objeto de campos, fecha o marca de tiempo, o el mes (`month`) del 1 al 12.
- name: options
  type: Zone | MonthDayOptions | number | string
  description: Zona horaria u objeto de opciones, o el día (`day`) como número entero del 1 al 31 al pasar dos números.
  options:
    - name: zone
      type: Zone
      description: Zona horaria usada para leer el mes y el día de una cadena de instante, un `DateTime` o un `Date`.
    - name: locale
      type: Locale
      description: Etiqueta de locale BCP 47 asociada al `MonthDay` devuelto y a cualquier valor derivado de él.
    - name: dayFirst
      type: boolean
      default: 'false'
      description: "Lectura con el día primero para cadenas con barra, punto o números de un dígito separados por guion, igual que `dayMonth()`."
    - name: loose
      type: boolean
      default: 'false'
      description: "Lectura de nombres de mes en inglés o en el locale activo como `'17 février'` con `@native-dates/plugins/loose`; devuelve `null` si la entrada no se puede interpretar."
```

**Devuelve**

```returns
type: MonthDay
description: "Instancia `MonthDay` sin año, o `null` si el modo loose no logra interpretar `input`."
```

Cuando el [plugin loose](/plugins/loose/) está cargado, el modo loose interpreta nombres de mes en inglés o en el `locale` activo y devuelve `null` ante entradas ilegibles:

```js
import { monthDay } from 'native-dates';
import '@native-dates/plugins/loose';

monthDay('Oct 17', { loose: true })?.toString(); // '10-17'
monthDay('17 février', { loose: true, locale: 'fr' })?.toString(); // '02-17'
monthDay('whenever', { loose: true }); // null
```
:::

:::entry
### `dayMonth()` :kind[function]

```js signature
dayMonth(input, options?): MonthDay
dayMonth(day, month): MonthDay
```

Lee cadenas y números con el día primero en el orden habitual en la mayor parte del mundo, como `'17/10'`. Esta función siempre interpreta el día primero, sin importar la configuración global.

Las cadenas ISO de dos dígitos separadas por guion, como `'10-17'`, siguen leyéndose con el mes primero en ambas funciones. Así la salida JSON vuelve a interpretarse como la misma fecha en cualquier entorno.

**Parámetros**

```params
- name: input
  type: MonthDayInput | number | string
  required: true
  description: Cadena con el día primero como `'17/10'`, cualquier `MonthDayInput`, o el día (`day`) como número entero del 1 al 31.
- name: options
  type: Zone | MonthDayOptions | number | string
  description: Zona horaria, opciones de lectura como `locale`, o el mes (`month`) del 1 al 12 al pasar dos números.
```

**Devuelve**

```returns
type: MonthDay
description: "Instancia `MonthDay`, o `null` si el modo loose no logra interpretar `input`."
```

```js
import { dayMonth } from 'native-dates';

dayMonth('17/10').toString(); // '10-17'
dayMonth('06.05').toString(); // '05-06'
dayMonth(17, 10).toString(); // '10-17'
dayMonth('10-17').toString(); // '10-17'
```
:::

## Entradas aceptadas

Las cadenas numéricas sin año nunca se pasan al analizador nativo de `Date`. Esto evita que se invente un año predeterminado no bisiesto o que los días inválidos pasen al mes siguiente.

| Entrada | Ejemplo | Cómo se interpreta |
|---|---|---|
| Cadena ISO de mes y día | `'10-17'`, `'--10-17'` | Lee mes y día de dos dígitos con el mes primero tanto en [`monthDay()`](#monthday) como en [`dayMonth()`](#daymonth). |
| Par numérico en cadena | `'10/17'`, `'17.10'`, `'5-6'` | Lee valores separados por `/`, `.` o `-`, con el mes primero en `monthDay()` y con el día primero en `dayMonth()`. |
| Dos números | `monthDay(10, 17)`, `dayMonth(17, 10)` | Acepta enteros en orden mes-día o día-mes. |
| Objeto de campos | `{ month: 10, day: 17 }` | Lee campos con meses del 1 al 12 y rechaza combinaciones imposibles como el 31 de abril. |
| Fecha o marca de tiempo | `'1990-10-17'`, `datetime(...)`, `new Date()` | Extrae el mes y el día del calendario en la zona indicada o en la predeterminada y descarta el año. |
| Nombre de mes en modo loose | `'Oct 17'`, `'17 février'` | Lee nombres de mes en inglés o en el locale activo y ordinales en cualquier orden en modo loose. |
| Valor de Temporal | `Temporal.PlainMonthDay`, `Temporal.PlainDate` | Envuelve directamente valores ISO 8601 de Temporal. |

:::tip[Leer el mes y el día de hoy]
Obtén el mes y el día actuales en cualquier zona horaria mediante [`today()`](/api/date-fn/#today), por ejemplo `today('Europe/Berlin').monthDay`.
:::
