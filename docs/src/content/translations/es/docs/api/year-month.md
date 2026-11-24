---
source: "09d43cd55ced"
title: YearMonth
lede: Un año y un mes de calendario sin día, para períodos de facturación, vencimientos de tarjetas y selectores de mes.
---

## Crear un YearMonth

Crea una instancia a partir de una cadena ISO, números de año y mes o una fecha existente con [`yearMonth()`](/api/year-month-fn/), o interpreta cadenas de vencimiento de tarjetas con el mes primero mediante [`monthYear()`](/api/year-month-fn/#monthyear). Las instancias son inmutables, así que todo método que modifica un valor devuelve una instancia nueva.

```js title="create.js"
import { monthYear, yearMonth } from 'native-dates';

const billing = yearMonth('2026-11');
const quarterEnd = yearMonth(2026, 12);
const expiry = monthYear('11/26');
```

Obtén el año y el mes de cualquier [fecha de calendario](/api/calendar-date/) o [instante](/api/date-time/) mediante su propiedad `yearMonth`, o realiza la conversión dentro de una cadena de llamadas con `as('yearMonth')`:

```js
import { date, datetime, today } from 'native-dates';

date('2026-11-16').yearMonth.toString(); // '2026-11'
datetime('2026-11-01T02:00:00Z', 'America/Los_Angeles').as('yearMonth').toString(); // '2026-10'
const currentMonth = today().yearMonth;
```

## Propiedades

Las propiedades exponen el año ISO, el mes y los límites de calendario correspondientes.

| Propiedad | Tipo | Descripción |
|---|---|---|
| `text` | `string` | Mes y año formateados según el locale, como `'Nov 2026'`. |
| `year`, `month` | `number` | Año de calendario y mes numerado del 1 al 12. |
| `quarter` | `number` | Trimestre del calendario del 1 al 4. |
| `daysInMonth`, `daysInYear` | `number` | Cantidad de días de este mes (de 28 a 31) y cantidad de días de este año (365 o 366). |
| `start`, `end` | [`CalendarDate`](/api/calendar-date/) | Primer y último día de calendario de este mes. |
| `YearMonth.century` | `number` | Siglo base sumado a años de dos dígitos en [`monthYear()`](/api/year-month-fn/#monthyear); el valor predeterminado es `2000`. |

## Aritmética y campos

Avanza o retrocede en meses, trimestres o años, reemplaza campos o elige un día concreto del mes.

:::note[Solo unidades de mes y año]
Las unidades menores que un mes lanzan un `RangeError` porque un año y mes no tiene día. Llama primero a [`on()`](#on) para fijar un día cuando necesites operar con semanas o días.
:::

:::entry
### `plus()` :kind[method]

```js signature
ym.plus(amount, unit?): YearMonth
ym.add(amount, unit?): YearMonth
```

Avanza en años, trimestres o meses y devuelve un nuevo `YearMonth`. También dispone del alias `add()`.

**Parámetros**

```params
- name: amount
  type: DurationInput
  required: true
  description: Cantidad acompañada de `unit`, instancia de `Duration`, cadena de duración en inglés o ISO 8601, o bien objeto de campos.
- name: unit
  type: Unit
  description: Nombre de unidad de mes, trimestre o año en inglés cuando `amount` es un número.
```

**Devuelve**

```returns
type: YearMonth
description: Nuevo `YearMonth` desplazado hacia adelante en el calendario.
```

```js
const billing = yearMonth('2026-11');

billing.plus(3, 'months').toString(); // '2027-02'
billing.plus('1 year').toString(); // '2027-11'
```
:::

:::entry
### `minus()` :kind[method]

```js signature
ym.minus(amount, unit?): YearMonth
ym.subtract(amount, unit?): YearMonth
```

Retrocede en años, trimestres o meses y devuelve una instancia nueva. Acepta las mismas entradas que [`plus()`](#plus) y cuenta con el alias `subtract()`.

**Parámetros**

```params
- name: amount
  type: DurationInput
  required: true
  description: Cantidad acompañada de `unit`, instancia de `Duration`, cadena de duración en inglés o ISO 8601, o bien objeto de campos.
- name: unit
  type: Unit
  description: Nombre de unidad de mes, trimestre o año en inglés cuando `amount` es un número.
```

**Devuelve**

```returns
type: YearMonth
description: Nuevo `YearMonth` desplazado hacia atrás en el calendario.
```

```js
yearMonth('2026-11').minus(1, 'year').toString(); // '2025-11'
```
:::

:::entry
### `set()` :kind[method]

```js signature
ym.set(fields): YearMonth
ym.set(unit, value): YearMonth
```

Devuelve un nuevo `YearMonth` con el año, el mes o ambos reemplazados. Los meses fuera de rango y las unidades menores que un mes lanzan un `RangeError`.

**Parámetros**

```params
- name: fields
  type: Partial<YearMonthFields> | Unit
  required: true
  description: Objeto con los campos `year` o `month`, o nombre de una sola unidad en inglés.
- name: value
  type: number
  description: Valor numérico entero al pasar un nombre de unidad.
```

**Devuelve**

```returns
type: YearMonth
description: Nuevo `YearMonth` con los campos de calendario actualizados.
```

```js
const billing = yearMonth('2026-11');

billing.set('month', 2).toString(); // '2026-02'
billing.set({ year: 2028, month: 2 }).daysInMonth; // 29
```
:::

:::entry
### `on()` :kind[method]

```js signature
ym.on(day): CalendarDate
```

Combina este mes con un número entero de día del 1 al 31 y devuelve una [`CalendarDate`](/api/calendar-date/). El día 31 se ajusta al límite del mes en meses más cortos como febrero o abril, mientras que los números fuera del rango de 1 a 31 lanzan un `RangeError`.

**Parámetros**

```params
- name: day
  type: number | string
  required: true
  description: Número entero de día del mes, del 1 al 31.
```

**Devuelve**

```returns
type: CalendarDate
description: Fecha de calendario (`CalendarDate`) correspondiente a ese día del mes.
```

```js
yearMonth('2026-11').on(15).toString(); // '2026-11-15'
yearMonth('2026-02').on(31).toString(); // '2026-02-28'
yearMonth('2028-02').on(31).toString(); // '2028-02-29'
```
:::

## Comparación e inclusión

Compara pares de año y mes cronológicamente o comprueba si un día de calendario cae dentro del mes. Los operadores relacionales como `<` lanzan un error, mientras que los arrays se ordenan directamente con [`compare()`](/api/compare/) y las [funciones auxiliares de extremos](/api/compare/#earliest).

:::entry
### `compare()` :kind[method]

```js signature
ym.compare(other): -1 | 0 | 1
```

Compara este año y mes con otro y devuelve un número negativo, cero o positivo para ordenar arrays. Si pasas una fecha completa o una marca de tiempo, compara con el mes al que pertenece.

**Parámetros**

```params
- name: other
  type: YearMonthInput
  required: true
  description: Otro `YearMonth` o cualquier entrada aceptada por `yearMonth()`.
```

**Devuelve**

```returns
type: -1 | 0 | 1
description: "`-1` si es anterior, `0` si son iguales o `1` si es posterior."
```

```js
yearMonth('2026-05').compare('2026-11'); // -1
yearMonth('2026-11').compare('2026-11-16'); // 0
```
:::

:::entry
### `equals()` :kind[method]

```js signature
ym.equals(other): boolean
```

Devuelve `true` cuando ambos valores representan el mismo año y el mismo mes.

```js
yearMonth('2026-11').equals(yearMonth(2026, 11)); // true
```
:::

:::entry
### `isBefore()` :kind[method]

```js signature
ym.isBefore(other): boolean
```

Devuelve `true` cuando este año y mes es anterior al otro.

```js
yearMonth('2026-10').isBefore('2026-11'); // true
```
:::

:::entry
### `isAfter()` :kind[method]

```js signature
ym.isAfter(other): boolean
```

Devuelve `true` cuando este año y mes es posterior al otro.

```js
yearMonth('2026-12').isAfter('2026-11'); // true
```
:::

:::entry
### `contains()` :kind[method]

```js signature
ym.contains(day): boolean
ym.includes(day): boolean
```

Devuelve `true` cuando la fecha de calendario o marca de tiempo indicada cae dentro de este año y mes. También dispone del alias `includes()`.

**Parámetros**

```params
- name: day
  type: CalendarDateInput
  required: true
  description: Cadena de fecha, `CalendarDate`, `DateTime`, objeto de campos o `Date`.
```

**Devuelve**

```returns
type: boolean
description: "`true` si `day` cae dentro de este mes."
```

```js
const nov = yearMonth('2026-11');

nov.contains('2026-11-16'); // true
nov.contains('2026-12-01'); // false
```
:::

:::entry
### `isPast()` :kind[method]

```js signature
ym.isPast(zone?): boolean
```

Devuelve `true` cuando este mes completo es anterior al mes actual en la zona horaria indicada o configurada.

```js
yearMonth('2020-01').isPast('UTC'); // true
```
:::

:::entry
### `isFuture()` :kind[method]

```js signature
ym.isFuture(zone?): boolean
```

Devuelve `true` mientras este mes siga siendo posterior al mes actual en la zona horaria indicada o configurada.

```js
yearMonth('2099-01').isFuture('UTC'); // true
```
:::

:::entry
### `isLeapYear()` :kind[method]

```js signature
ym.isLeapYear(): boolean
```

Devuelve `true` cuando el año de calendario de este mes tiene 366 días.

```js
yearMonth('2028-02').isLeapYear(); // true
yearMonth('2026-02').isLeapYear(); // false
```
:::

## Medir duraciones

:::entry
### `until()` :kind[method]

```js signature
ym.until(other): Duration
ym.until(other, unit): number
```

Mide el intervalo desde este mes hasta otro y devuelve una duración negativa cuando el destino es anterior. La [`Duration`](/api/duration/) devuelta conserva el inicio de este mes como referencia para que los meses y los años puedan totalizarse en cualquier unidad.

**Parámetros**

```params
- name: other
  type: YearMonthInput
  required: true
  description: Año y mes de destino para calcular el intervalo.
- name: unit
  type: Unit
  description: Nombre de unidad en inglés para devolver la duración total como número de punto flotante.
```

**Devuelve**

```returns
type: Duration | number
description: Instancia de `Duration` en años y meses, o número cuando se especifica `unit`.
```

```js
const start = yearMonth('2026-03');

start.until('2027-06').toString(); // 'P1Y3M'
start.until('2027-06', 'months'); // 15
```
:::

:::entry
### `since()` :kind[method]

```js signature
ym.since(other): Duration
ym.since(other, unit): number
```

Mide el tiempo transcurrido desde un año y mes anterior. Pasa un nombre de unidad en inglés para obtener el total como número.

```js
yearMonth('2026-11').since('2026-05', 'months'); // 6
```
:::

## Formateo y conversión

:::entry
### `format()` :kind[method]

```js signature
ym.format(spec?, locale?): string
```

Formatea el año y el mes mediante presets con nombre, objetos de opciones de `Intl` o patrones de tokens integrados como `'MM/YY'`. Los objetos de opciones compartidos descartan automáticamente las claves de día, reloj y zona horaria.

Los presets estándar y localizados muestran únicamente el año y el mes, y los formatos personalizados registrados con [`configure()`](/api/configure/) también funcionan aquí. Consulta [Formateo](/guides/formatting/) para ver las tablas completas de presets y tokens.

**Parámetros**

```params
- name: spec
  type: FormatSpec
  default: "'medium'"
  description: Nombre de preset como `'medium'` o `'long'`, objeto de opciones de `Intl` o patrón de tokens.
- name: locale
  type: Locale
  description: Etiqueta de locale BCP 47 que sobrescribe, solo para esta llamada, el locale de este mes o el configurado globalmente.
```

**Devuelve**

```returns
type: string
description: Cadena formateada de mes y año.
```

```js
const nov = yearMonth('2026-11');

nov.format('short', 'en-US'); // '11/2026'
nov.format('medium', 'en-US'); // 'Nov 2026'
nov.format('long', 'en-US'); // 'November 2026'
nov.format('L', 'en-US'); // '11/2026'
nov.format('MM/YY'); // '11/26'
```
:::

:::entry
### `locale()` :kind[method]

```js signature
ym.locale(): Locale | undefined
ym.locale(tag): YearMonth
```

Lee el locale asociado a este mes o devuelve una copia formateada con otro locale en vistas previas de texto, presets y todos los valores derivados de él. Pasar una etiqueta vacía borra el locale asociado, y [`lang()`](#lang) funciona como alias.

**Parámetros**

```params
- name: tag
  type: Locale | null | undefined
  description: Etiqueta de locale BCP 47 que se conservará, o `null` para borrar una etiqueta existente.
```

**Devuelve**

```returns
type: YearMonth | Locale | undefined
description: Etiqueta activa cuando se llama sin argumentos, o nuevo `YearMonth` con `tag`.
```

```js
const may = yearMonth('2026-05').locale('ru');

may.locale(); // 'ru'
may.format('long'); // 'май 2026 г.'
may.on(1).format('long'); // '1 мая 2026 г.'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
ym.lang(): Locale | undefined
ym.lang(tag): YearMonth
```

Alias abreviado de [`locale()`](#locale) que lee o asocia una etiqueta de locale BCP 47 en este mes.
:::

:::entry
### `as()` :kind[method]

```js signature
ym.as('yearMonth'): YearMonth
```

Devuelve esta instancia cuando se solicita `'yearMonth'` en cadenas genéricas de conversión, y lanza un `RangeError` para otros tipos.
:::

:::entry
### `toString()` :kind[method]

```js signature
ym.toString(): string
ym.toJSON(): string
```

Devuelve la cadena ISO 8601 de año y mes, compatible con los campos de mes de los formularios HTML. `toJSON()` devuelve la misma cadena para serialización JSON.

**Devuelve**

```returns
type: string
description: Cadena ISO 8601 de año y mes, como `'2026-11'`.
```

```js
yearMonth(2026, 11).toString(); // '2026-11'
JSON.stringify({ billing: yearMonth(2026, 11) }); // '{"billing":"2026-11"}'
```
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
ym.toTemporal(): Temporal.PlainYearMonth
```

Devuelve la instancia subyacente de `Temporal.PlainYearMonth`.
:::

:::entry
### `valueOf()` :kind[method]

```js signature
ym.valueOf(): never
```

Lanza un `RangeError` para que los operadores numéricos nunca conviertan un año y mes en número. Comprueba el tipo de valores desconocidos con [`isYearMonth()`](/api/kind-of/#isyearmonth) o [`kindOf()`](/api/kind-of/).
:::
