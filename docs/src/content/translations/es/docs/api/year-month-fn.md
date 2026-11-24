---
source: "91937c1bc2c8"
title: yearMonth()
lede: Convierte una cadena ISO de año y mes, el vencimiento de una tarjeta, dos números o una fecha en un YearMonth.
---

## Leer valores de año y mes

:::entry
### `yearMonth()` :kind[function]

```js signature
yearMonth(input, options?): YearMonth
yearMonth(input, zone?): YearMonth
yearMonth(year, month): YearMonth
```

Crea un [`YearMonth`](/api/year-month/) a partir de una cadena con el año primero, el año y el mes del 1 al 12, un objeto de campos o cualquier fecha o marca de tiempo descartando el día. Las entradas ausentes lanzan un error de tipo en lugar de usar el mes actual.

```js title="billing.js"
import { datetime, yearMonth } from 'native-dates';

const fromIso = yearMonth('2026-11');
const fromNumbers = yearMonth(2026, 11);
const fromFields = yearMonth({ year: 2026, month: 11 });
const fromDate = yearMonth('2026-11-16');
const fromInstant = yearMonth(datetime('2026-11-01T02:00:00Z'), 'America/Los_Angeles');

fromNumbers.toString(); // '2026-11'
fromInstant.toString(); // '2026-10'
```

**Parámetros**

```params
- name: input
  type: YearMonthInput | number | string
  required: true
  description: Cadena ISO de año y mes, objeto de campos, fecha o marca de tiempo, o año del calendario (`year`).
- name: options
  type: Zone | ReadOptions | number | string
  description: Zona horaria u objeto de opciones al leer una marca de tiempo o una cadena en modo loose, o el mes (`month`) del 1 al 12.
  options:
    - name: zone
      type: Zone
      description: Zona horaria usada para determinar el mes del calendario de una cadena de instante, un `DateTime` o un `Date`.
    - name: locale
      type: Locale
      description: Etiqueta de locale BCP 47 asociada al `YearMonth` devuelto y a cualquier valor derivado de él.
    - name: loose
      type: boolean
      default: 'false'
      description: "Lectura de nombres de mes en inglés o en el locale activo como `'février 2026'` con `@native-dates/plugins/loose`; devuelve `null` si la entrada no se puede interpretar."
```

**Devuelve**

```returns
type: YearMonth
description: "Instancia `YearMonth` sin día, o `null` si el modo loose no logra interpretar `input`."
```

Cuando el [plugin loose](/plugins/loose/) está cargado, el modo loose interpreta nombres de mes en inglés o en el `locale` activo acompañados de un año de cuatro dígitos y devuelve `null` ante cadenas ilegibles:

```js
import { yearMonth } from 'native-dates';
import '@native-dates/plugins/loose';

yearMonth('Nov 2026', { loose: true })?.toString(); // '2026-11'
yearMonth('février 2026', { loose: true, locale: 'fr' })?.toString(); // '2026-02'
yearMonth('not-a-month', { loose: true }); // null
```
:::

:::entry
### `monthYear()` :kind[function]

```js signature
monthYear(input, options?): YearMonth
monthYear(month, year): YearMonth
```

Lee cadenas y números con el mes primero en el orden impreso en las tarjetas de pago, como `'11/26'`. Los años de dos dígitos entre 0 y 99 se suman a [`YearMonth.century`](/api/year-month/#properties), cuyo valor predeterminado es 2000.

Las cadenas ISO escritas como `'2026-11'` se siguen leyendo con el año primero en ambas funciones, de modo que los valores serializados siempre se recuperan sin ambigüedad.

**Parámetros**

```params
- name: input
  type: YearMonthInput | number | string
  required: true
  description: Cadena de vencimiento de tarjeta como `'11/26'`, cualquier `YearMonthInput`, o el mes (`month`) del 1 al 12.
- name: options
  type: Zone | ReadOptions | number | string
  description: Zona horaria, opciones de lectura como `locale`, o el año (`year`) de dos o cuatro dígitos al pasar dos números.
```

**Devuelve**

```returns
type: YearMonth
description: "Instancia `YearMonth`, o `null` si el modo loose no logra interpretar `input`."
```

```js
import { monthYear } from 'native-dates';

monthYear('11/26').toString(); // '2026-11'
monthYear('05/2028').toString(); // '2028-05'
monthYear(11, 26).toString(); // '2026-11'
monthYear('2026-11').toString(); // '2026-11'
```
:::

## Entradas aceptadas

Los meses van del 1 para enero al 12 para diciembre en números, cadenas y objetos de campos.

| Entrada | Ejemplo | Cómo se interpreta |
|---|---|---|
| Cadena con el año primero | `'2026-11'`, `'2026/11'`, `'2026年11月'` | Lee un año de 4 dígitos y un mes de 1 o 2 dígitos con cualquier separador que no sea una letra latina ni dos puntos. |
| Vencimiento de tarjeta | `monthYear('11/26')`, `monthYear('11.2026')` | Lee el mes primero separado por `/`, `-` o `.` y expande los años de 2 dígitos con `YearMonth.century`. |
| Dos números | `yearMonth(2026, 11)`, `monthYear(11, 26)` | Acepta enteros en orden año-mes o mes-año. |
| Objeto de campos | `{ year: 2026, month: 11 }` | Lee campos de calendario con meses del 1 al 12 y rechaza meses fuera de ese rango. |
| Fecha o marca de tiempo | `'2026-11-16'`, `datetime(...)`, `new Date()` | Extrae el mes del calendario en la zona indicada o en la predeterminada y descarta el día. |
| Nombre de mes en modo loose | `'Nov 2026'`, `'février 2026'` | Lee nombres de mes en inglés o en el locale activo junto a un año de 4 dígitos en modo loose. |
| Valor de Temporal | `Temporal.PlainYearMonth`, `Temporal.PlainDate` | Envuelve directamente valores ISO 8601 de Temporal. |

:::tip[Leer el mes actual]
Obtén el mes del calendario actual en cualquier zona horaria mediante [`today()`](/api/date-fn/#today), por ejemplo `today('Asia/Tokyo').yearMonth`.
:::
