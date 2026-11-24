---
source: "436c0292465a"
title: MonthDay
lede: Un mes y un día de calendario sin año, para cumpleaños, aniversarios y días festivos anuales.
---

## Crear un MonthDay

Crea una instancia con el mes primero mediante [`monthDay()`](/api/month-day-fn/) o con el día primero mediante [`dayMonth()`](/api/month-day-fn/#daymonth). Las instancias son inmutables, así que cada método devuelve un valor nuevo.

```js title="create.js"
import { dayMonth, monthDay } from 'native-dates';

const birthday = monthDay(10, 17);
const fromIso = monthDay('10-17');
const european = dayMonth('17/10');
```

Obtén el mes y el día de cualquier [fecha de calendario](/api/calendar-date/) o [instante](/api/date-time/) mediante su propiedad `monthDay`, o realiza la conversión dentro de una cadena de llamadas con `as('monthDay')`:

```js
import { date, datetime, today } from 'native-dates';

date('1990-10-17').monthDay.toString(); // '10-17'
datetime('2026-10-18T02:00:00Z', 'America/Los_Angeles').as('monthDay').toString(); // '10-17'
const currentMonthDay = today().monthDay;
```

## Propiedades

Las propiedades exponen el mes y el día del mes numerados desde 1.

| Propiedad | Tipo | Descripción |
|---|---|---|
| `text` | `string` | Mes y día formateados según el locale, como `'Oct 17'`. |
| `month`, `day` | `number` | Mes de calendario del 1 al 12 y día del mes del 1 al 31. |

## Situar en un año y desplazarse

Combina un mes y día anual con un año concreto para obtener una fecha de calendario, o avanza y retrocede hacia las ocurrencias más cercanas.

:::entry
### `in()` :kind[method]

```js signature
md.in(year): CalendarDate
```

Sitúa este mes y día en un año de calendario y devuelve una [`CalendarDate`](/api/calendar-date/). El 29 de febrero cae en el 28 de febrero en años no bisiestos.

**Parámetros**

```params
- name: year
  type: number | string
  required: true
  description: Año de calendario (número entero), como `2027`.
```

**Devuelve**

```returns
type: CalendarDate
description: Fecha de calendario (`CalendarDate`) en la que cae este mes y día en `year`.
```

```js
const birthday = monthDay(10, 17);
const leapDay = monthDay(2, 29);

birthday.in(2027).toString(); // '2027-10-17'
leapDay.in(2027).toString(); // '2027-02-28'
leapDay.in(2028).toString(); // '2028-02-29'
```
:::

:::entry
### `next()` :kind[method]

```js signature
md.next(day?): CalendarDate
```

Devuelve la siguiente ocurrencia posterior a una fecha de referencia, usando [`today()`](/api/date-fn/#today) por defecto. Si la fecha de referencia ya coincide con este mes y día, el método avanza al año siguiente.

Las fechas de calendario y los instantes también aceptan un mes y día directamente en [`d.next(md)`](/api/calendar-date/#next) y [`dt.next(md)`](/api/date-time/#next).

**Parámetros**

```params
- name: day
  type: CalendarDateInput
  default: today()
  description: Fecha de referencia desde la que buscar hacia adelante.
```

**Devuelve**

```returns
type: CalendarDate
description: Próxima `CalendarDate` posterior a `day`.
```

```js
import { date, monthDay } from 'native-dates';

const birthday = monthDay(10, 17);

birthday.next('2026-05-01').toString(); // '2026-10-17'
birthday.next('2026-10-17').toString(); // '2027-10-17'
date('2026-11-16').next(birthday).toString(); // '2027-10-17'
```
:::

:::entry
### `previous()` :kind[method]

```js signature
md.previous(day?): CalendarDate
md.last(day?): CalendarDate
```

Devuelve la ocurrencia más reciente anterior a una fecha de referencia, usando [`today()`](/api/date-fn/#today) por defecto. Las fechas de calendario y los instantes también aceptan un mes y día directamente en `previous()`. Cuenta además con el alias `last()`.

**Parámetros**

```params
- name: day
  type: CalendarDateInput
  default: today()
  description: Fecha de referencia desde la que buscar hacia atrás.
```

**Devuelve**

```returns
type: CalendarDate
description: Instancia de `CalendarDate` más reciente anterior a `day`.
```

```js
import { date, monthDay } from 'native-dates';

const birthday = monthDay(10, 17);

birthday.previous('2026-10-17').toString(); // '2025-10-17'
date('2026-11-16').previous(birthday).toString(); // '2026-10-17'
```
:::

:::entry
### `after()` :kind[method]

```js signature
md.after(day): CalendarDate
```

Devuelve la siguiente ocurrencia posterior a una fecha de referencia obligatoria. Se comporta igual que [`next()`](#next), pero sin usar el día de hoy por defecto.

**Parámetros**

```params
- name: day
  type: CalendarDateInput
  required: true
  description: Fecha de referencia a partir de la cual buscar la siguiente ocurrencia.
```

**Devuelve**

```returns
type: CalendarDate
description: Primera `CalendarDate` posterior a `day` en la que ocurre este mes y día.
```

```js
monthDay(2, 29).after('2026-03-01').toString(); // '2027-02-28'
```
:::

:::entry
### `before()` :kind[method]

```js signature
md.before(day): CalendarDate
```

Devuelve la ocurrencia más reciente anterior a una fecha de referencia obligatoria. Se comporta igual que [`previous()`](#previous), pero sin usar el día de hoy por defecto.

```js
monthDay(10, 17).before('2026-10-01').toString(); // '2025-10-17'
```
:::

## Coincidencia e igualdad

Como un mes y día se repite cada año en lugar de representar una fecha concreta, los métodos de ordenación como `isBefore()` no tienen sentido.

:::tip[Elegir entre equals y fallsOn]
Usa [`fallsOn()`](#fallson) para comprobar si una fecha de calendario corresponde a la ocurrencia efectiva de ese año, ya que el 29 de febrero se resuelve como el 28 de febrero en años no bisiestos. Reserva [`equals()`](#equals) para verificar si dos valores tienen exactamente los mismos números de mes y día.
:::

:::entry
### `fallsOn()` :kind[method]

```js signature
md.fallsOn(day): boolean
md.isOn(day): boolean
```

Devuelve `true` cuando la fecha indicada corresponde a la ocurrencia de este mes y día en ese año. En un año no bisiesto, el 29 de febrero cae en el 28 de febrero, mientras que en un año bisiesto cae solo en el 29 de febrero. También dispone del alias `isOn()`.

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
description: "`true` si `day` corresponde a este mes y día en ese año."
```

```js
const leapDay = monthDay(2, 29);

leapDay.fallsOn('2027-02-28'); // true
leapDay.fallsOn('2028-02-28'); // false
leapDay.fallsOn('2028-02-29'); // true
```
:::

:::entry
### `equals()` :kind[method]

```js signature
md.equals(other): boolean
```

Devuelve `true` cuando ambos valores tienen exactamente los mismos números de mes y día; si recibe una fecha completa o una marca de tiempo, extrae su mes y su día.

Las cadenas ambiguas con barras o puntos como `'05/10'` lanzan un `RangeError`. Interprétalas antes de comparar usando las [funciones de creación de mes y día](/api/month-day-fn/) con el orden de mes primero o día primero.

**Parámetros**

```params
- name: other
  type: MonthDayInput
  required: true
  description: Otro `MonthDay`, cadena ISO `'10-17'`, objeto de campos o valor de fecha.
```

**Devuelve**

```returns
type: boolean
description: "`true` si ambos valores tienen el mismo mes y el mismo día."
```

```js
const birthday = monthDay(10, 17);

birthday.equals('10-17'); // true
birthday.equals('1990-10-17'); // true
monthDay(2, 29).equals('2027-02-28'); // false
```
:::

:::entry
### `isToday()` :kind[method]

```js signature
md.isToday(zone?): boolean
```

Devuelve `true` cuando este mes y día cae en la fecha de hoy en la zona horaria indicada o configurada.

```js
import { today } from 'native-dates';

today('UTC').monthDay.isToday('UTC'); // true
```
:::

:::entry
### `isTomorrow()` :kind[method]

```js signature
md.isTomorrow(zone?): boolean
```

Devuelve `true` cuando este mes y día cae en la fecha de mañana en la zona horaria indicada o configurada.

```js
import { tomorrow } from 'native-dates';

tomorrow('UTC').monthDay.isTomorrow('UTC'); // true
```
:::

:::entry
### `isYesterday()` :kind[method]

```js signature
md.isYesterday(zone?): boolean
```

Devuelve `true` cuando este mes y día cae en la fecha de ayer en la zona horaria indicada o configurada.

```js
import { yesterday } from 'native-dates';

yesterday('UTC').monthDay.isYesterday('UTC'); // true
```
:::

## Formateo y conversión

:::entry
### `format()` :kind[method]

```js signature
md.format(spec?, locale?): string
```

Formatea el mes y el día en el orden propio del locale o con un patrón de tokens integrado como `'MMM Do'`. Los objetos de opciones compartidos ignoran automáticamente las claves de año, reloj y zona horaria.

Los formatos personalizados registrados en [`configure()`](/api/configure/) también funcionan aquí, y los locales con calendarios no gregorianos formatean nombres de meses gregorianos para que las fechas anuales se mantengan estables. Consulta [Formateo](/guides/formatting/) para ver todas las opciones de presets y tokens.

**Parámetros**

```params
- name: spec
  type: FormatSpec
  default: "'medium'"
  description: Nombre de preset como `'short'` o `'long'`, objeto de opciones de `Intl` o patrón de tokens.
- name: locale
  type: Locale
  description: Etiqueta de locale BCP 47 que sobrescribe, solo para esta llamada, el locale de este valor o el configurado globalmente.
```

**Devuelve**

```returns
type: string
description: Cadena formateada de mes y día.
```

```js
const oct17 = monthDay(10, 17);

oct17.format('short', 'en-US'); // '10/17'
oct17.format('short', 'en-GB'); // '17/10'
oct17.format('medium', 'en-US'); // 'Oct 17'
oct17.format('long', 'en-US'); // 'October 17'
oct17.format('MMM Do', 'en-US'); // 'Oct 17th'
```
:::

:::entry
### `locale()` :kind[method]

```js signature
md.locale(): Locale | undefined
md.locale(tag): MonthDay
```

Lee el locale asociado a este mes y día o devuelve una copia formateada con otro locale en vistas previas de texto, presets y todas las fechas derivadas de él. Pasar una etiqueta vacía borra el locale asociado, y [`lang()`](#lang) funciona como alias.

**Parámetros**

```params
- name: tag
  type: Locale | null | undefined
  description: Etiqueta de locale BCP 47 que se conservará, o `null` para borrar una etiqueta existente.
```

**Devuelve**

```returns
type: MonthDay | Locale | undefined
description: Etiqueta activa cuando se llama sin argumentos, o nuevo `MonthDay` con `tag`.
```

```js
const labourDay = monthDay(5, 1).locale('ru');

labourDay.locale(); // 'ru'
labourDay.format('long'); // '1 мая'
labourDay.in(2026).format('long'); // '1 мая 2026 г.'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
md.lang(): Locale | undefined
md.lang(tag): MonthDay
```

Alias abreviado de [`locale()`](#locale) que lee o asocia una etiqueta de locale BCP 47 en este mes y día.
:::

:::entry
### `as()` :kind[method]

```js signature
md.as('monthDay'): MonthDay
```

Devuelve esta instancia cuando se solicita `'monthDay'` en cadenas genéricas de conversión, y lanza un `RangeError` para otros tipos.
:::

:::entry
### `toString()` :kind[method]

```js signature
md.toString(): string
md.toJSON(): string
```

Devuelve la cadena ISO de mes y día con dos dígitos por campo (`'MM-DD'`), que ambas [funciones de creación de mes y día](/api/month-day-fn/) vuelven a interpretar con el mes primero. `toJSON()` devuelve la misma cadena para serialización JSON.

**Devuelve**

```returns
type: string
description: Cadena ISO de mes y día, como `'10-17'`.
```

```js
monthDay(5, 6).toString(); // '05-06'
JSON.stringify({ birthday: monthDay(10, 17) }); // '{"birthday":"10-17"}'
```
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
md.toTemporal(): Temporal.PlainMonthDay
```

Devuelve la instancia subyacente de `Temporal.PlainMonthDay`.
:::

:::entry
### `valueOf()` :kind[method]

```js signature
md.valueOf(): never
```

Lanza un `RangeError` para que los operadores numéricos nunca conviertan un mes y día en número. Comprueba el tipo de valores desconocidos con [`isMonthDay()`](/api/kind-of/#ismonthday) o [`kindOf()`](/api/kind-of/).
:::
