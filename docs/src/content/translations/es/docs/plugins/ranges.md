---
source: "c784c44bf2d7"
title: ranges
lede: Resta intervalos solapados y fusiona rangos adyacentes en cualquier tipo de rango.
---

## Operaciones de conjuntos sobre rangos

Los [rangos](/api/ranges/) del núcleo incluyen comprobaciones de inclusión, solapamiento e intersección. Importar este plugin añade `subtract()` y `union()` a `DateRange`, `DateTimeRange` y `TimeRange`, y exporta `mergeRanges()` para unificar listas de rangos.

```js title="ranges.js"
import { mergeRanges } from '@native-dates/plugins/ranges';
import { dateRange, timeRange } from 'native-dates';

const trip = dateRange('2026-11-01', '2026-11-10');
trip.subtract('2026-11-04/2026-11-06').map(String);
// ['2026-11-01/2026-11-03', '2026-11-07/2026-11-10']

dateRange('2026-11-01', '2026-11-05').union('2026-11-06/2026-11-10')?.toString();
// '2026-11-01/2026-11-10'

mergeRanges([
  timeRange('22:00', '02:00'),
  timeRange('01:00', '06:00'),
  timeRange('10:00', '12:00'),
]).map(String);
// ['10:00:00/12:00:00', '22:00:00/06:00:00']
```

Cada clase de rango mantiene su propia convención de extremos. Los rangos de fechas de calendario incluyen ambos extremos, mientras que los rangos de instantes y de horas excluyen el extremo final.

## Métodos de instancia

:::entry
### `subtract()` :kind[method]

```js signature
range.subtract(other): Range[]
```

Elimina de este rango el tramo cubierto por `other` y devuelve cero, uno o dos rangos restantes del mismo tipo. Los rangos devueltos conservan el locale y la zona horaria del rango original.

Restar un rango disjunto o vacío devuelve el rango original en un array de un elemento. Llamar a `subtract()` sobre un rango vacío de instantes o de horas devuelve un array vacío.

**Parámetros**

```params
- name: other
  type: Range | string
  required: true
  description: Instancia de rango o cadena de intervalo del mismo tipo que se va a eliminar.
```

**Devuelve**

```returns
type: Array<DateRange | DateTimeRange | TimeRange>
description: Array ordenado con los rangos restantes del mismo tipo.
```

```js
import '@native-dates/plugins/ranges';
import { dateRange, datetimeRange, timeRange } from 'native-dates';

dateRange('2026-11-01', '2026-11-10').subtract('2026-11-01/2026-11-03').map(String);
// ['2026-11-04/2026-11-10']

const day = datetimeRange('2026-11-02T09:00', '2026-11-02T17:00', 'America/New_York');
day.subtract('2026-11-02T12:00/2026-11-02T13:00').map((part) => `${part.start.hour}-${part.end.hour}`);
// ['9-12', '13-17']

timeRange('22:00', '06:00').subtract('23:00 - 02:00').map(String);
// ['22:00:00/23:00:00', '02:00:00/06:00:00']
```
:::

:::entry
### `union()` :kind[method]

```js signature
range.union(other): Range | null
```

Combina este rango con otro rango solapado o directamente adyacente del mismo tipo, y devuelve `null` cuando existe un hueco entre ambos. Los rangos devueltos conservan el locale y la zona horaria del rango original.

Dos valores `DateRange` se consideran adyacentes cuando el segundo empieza al día siguiente de terminar el primero. Dos valores `DateTimeRange` o `TimeRange` se consideran adyacentes cuando uno termina en el inicio exacto del otro, y los rangos vacíos no producen cambios.

**Parámetros**

```params
- name: other
  type: Range | string
  required: true
  description: Instancia de rango o cadena de intervalo del mismo tipo que se va a combinar.
```

**Devuelve**

```returns
type: DateRange | DateTimeRange | TimeRange | null
description: "Rango combinado del mismo tipo, o `null` cuando hay un hueco entre ambos."
```

```js
import '@native-dates/plugins/ranges';
import { dateRange, timeRange } from 'native-dates';

dateRange('2026-11-01', '2026-11-05').union('2026-11-06/2026-11-10')?.toString();
// '2026-11-01/2026-11-10'

dateRange('2026-11-01', '2026-11-05').union('2026-11-07/2026-11-10');
// null

timeRange('22:00', '06:00').union('06:00 - 08:00')?.toString();
// '22:00:00/08:00:00'
```
:::

## Fusión de colecciones

:::entry
### `mergeRanges()` :kind[function]

```js signature
mergeRanges(ranges): Range[]
```

Ordena un iterable de rangos del mismo tipo y unifica todos los tramos solapados o adyacentes en un conjunto mínimo de rangos disjuntos. Los rangos vacíos de instantes y de horas se omiten de la salida.

Pasar rangos de tipos mezclados lanza un `TypeError` con el código `conflictingRanges`, y pasar elementos que no son rangos lanza un `TypeError` con el código `invalidRange`.

**Parámetros**

```params
- name: ranges
  type: Iterable<DateRange> | Iterable<DateTimeRange> | Iterable<TimeRange>
  required: true
  description: Array, Set u otro iterable de rangos que comparten un mismo tipo.
```

**Devuelve**

```returns
type: Array<DateRange | DateTimeRange | TimeRange>
description: Array mínimo y ordenado de rangos no solapados del mismo tipo.
```

```js
import { mergeRanges } from '@native-dates/plugins/ranges';
import { dateRange, datetimeRange } from 'native-dates';

mergeRanges([
  dateRange('2026-11-12', '2026-11-15'),
  dateRange('2026-11-01', '2026-11-05'),
  dateRange('2026-11-06', '2026-11-08'),
]).map(String);
// ['2026-11-01/2026-11-08', '2026-11-12/2026-11-15']

mergeRanges([
  datetimeRange('2026-11-02T11:00', '2026-11-02T12:00', 'UTC'),
  datetimeRange('2026-11-02T09:00', '2026-11-02T11:00', 'UTC'),
]).map((part) => part.duration.hours);
// [3]
```
:::

## Rangos de horas nocturnos

Los valores `TimeRange` nocturnos cruzan la medianoche sin problemas en `subtract()`, `union()` y `mergeRanges()`. Los tramos adyacentes que se tocan en la medianoche vuelven a unirse en un único rango nocturno.

```js
import '@native-dates/plugins/ranges';
import { timeRange } from 'native-dates';

timeRange('22:00', '06:00').subtract('01:00 - 03:00').map(String);
// ['22:00:00/01:00:00', '03:00:00/06:00:00']

timeRange('22:00', '00:00').union('00:00 - 06:00')?.toString();
// '22:00:00/06:00:00'
```

:::note[Cobertura completa de 24 horas]
Un `TimeRange` con la misma hora de inicio y fin está vacío, de modo que un solo `TimeRange` no puede representar las 24 horas completas. Llamar a `union()` o `mergeRanges()` sobre rangos de horas que cubren el día entero lanza un `RangeError` con el código `unsupportedUnion`.
:::
