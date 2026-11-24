---
source: "05899a15dfff"
title: Duration
lede: Una duración que abarca unidades de calendario y de reloj.
---

## Crear una Duration

Interpreta frases de duración en inglés y cadenas ISO 8601 con [`duration()`](/api/duration-fn/), usa funciones de unidad como [`hours()`](/api/duration-fn/#hours) o mide el intervalo entre dos fechas u horas. Las instancias son inmutables, así que cada método devuelve un valor nuevo.

```js title="create.js"
import { date, days, duration, hours } from 'native-dates';

const breakTime = duration('1h 30m');
const trial = days(14);
const timeout = hours(1.5);
const quarter = date('2026-01-01').until('2026-04-01');
```

:::note[Los campos se conservan tal como se escriben]
Crear una duración a partir de 90 minutos mantiene `minutes` en `90` en lugar de convertirlos en 1 hora y 30 minutos. Los días de calendario también permanecen separados de las horas ante los cambios de horario de verano hasta que llamas a [`balance()`](#balance).
:::

## Propiedades

Las propiedades reflejan las cantidades de cada unidad almacenadas en la duración.

| Propiedad | Tipo | Descripción |
|---|---|---|
| `text` | `string` | Duración formateada según el locale en estilo largo, como `'1 hour, 30 minutes'`. |
| `years`, `months`, `weeks`, `days` | `number` | Cantidades con signo de unidades de calendario almacenadas en esta duración. |
| `hours`, `minutes`, `seconds` | `number` | Cantidades con signo de unidades de reloj. |
| `milliseconds`, `microseconds`, `nanoseconds` | `number` | Cantidades con signo de unidades inferiores al segundo. |
| `sign` | `number` | Dirección general de la duración: `1`, `0` o `-1`. |
| `anchor` | `TemporalValue` | Punto de referencia registrado por [`until()`](/api/date-time/#until) o [`since()`](/api/date-time/#since), o `undefined` en duraciones independientes. |

## Aritmética y signo

Combina duraciones, escálalas por un factor o invierte su signo. Todos los campos distintos de cero en una duración deben compartir el mismo signo.

:::entry
### `plus()` :kind[method]

```js signature
dur.plus(other, unit?): Duration
dur.add(other, unit?): Duration
```

Suma otra duración y devuelve una nueva `Duration`. Las unidades de calendario se suman campo por campo, mientras que las unidades de reloj se combinan de forma directa. También dispone del alias `add()`.

**Parámetros**

```params
- name: other
  type: DurationInput
  required: true
  description: Cantidad acompañada de `unit`, instancia de `Duration`, cadena de duración en inglés o ISO 8601, objeto de campos o milisegundos.
- name: unit
  type: Unit
  description: Nombre de la unidad en inglés cuando `other` es un número, como `'minutes'` o `'days'`.
```

**Devuelve**

```returns
type: Duration
description: Nueva `Duration` combinada.
```

```js
hours(2).plus(30, 'minutes').toString(); // 'PT2H30M'
days(1).plus('6h').toString(); // 'P1DT6H'
```
:::

:::entry
### `minus()` :kind[method]

```js signature
dur.minus(other, unit?): Duration
dur.subtract(other, unit?): Duration
```

Resta otra duración, descomponiendo años en meses o semanas en días cuando hace falta. Las combinaciones incompatibles de signo opuesto, como restar horas a días, lanzan un `RangeError`. También funciona con el alias `subtract()`.

**Parámetros**

```params
- name: other
  type: DurationInput
  required: true
  description: Cantidad acompañada de `unit`, instancia de `Duration`, cadena de duración en inglés o ISO 8601, objeto de campos o milisegundos.
- name: unit
  type: Unit
  description: Nombre de la unidad en inglés cuando `other` es un número.
```

**Devuelve**

```returns
type: Duration
description: Nueva `Duration` con `other` restado.
```

```js
import { months, weeks, years } from 'native-dates';

hours(2).minus('30m').toString(); // 'PT1H30M'
years(1).minus(months(1)).toString(); // 'P11M'
weeks(1).minus(days(1)).toString(); // 'P6D'
```
:::

:::entry
### `times()` :kind[method]

```js signature
dur.times(factor): Duration
```

Multiplica cada campo por un número y reparte la parte fraccionaria en unidades más pequeñas.

**Parámetros**

```params
- name: factor
  type: number
  required: true
  description: Multiplicador para escalar la duración, incluidos números fraccionarios o negativos.
```

**Devuelve**

```returns
type: Duration
description: Nueva `Duration` escalada.
```

```js
hours(1).times(1.5).toString(); // 'PT1H30M'
days(1).times(3).toString(); // 'P3D'
```
:::

:::entry
### `abs()` :kind[method]

```js signature
dur.abs(): Duration
```

Devuelve una copia con todos los campos en positivo.

```js
duration('-1h 30m').abs().toString(); // 'PT1H30M'
```
:::

:::entry
### `negated()` :kind[method]

```js signature
dur.negated(): Duration
```

Invierte el signo de todos los campos de la duración.

```js
hours(2).negated().toString(); // '-PT2H'
```
:::

## Equilibrio, redondeo y totales

Reagrupa unidades pequeñas en otras mayores, redondea a una precisión concreta o expresa toda la duración como un solo número.

:::warning[Convertir meses y años en días]
Las duraciones compuestas solo por meses y años se equilibran, se totalizan y se comparan entre sí usando 12 meses por año. Convertirlas en semanas, días o unidades de reloj requiere una fecha de partida obtenida mediante [`until()`](/api/calendar-date/#until) o [`since()`](/api/calendar-date/#since), porque los meses del calendario no tienen siempre el mismo número de días.
:::

:::entry
### `balance()` :kind[method]

```js signature
dur.balance(largestUnit?): Duration
```

Reagrupa el exceso de las unidades menores en las mayores. Por defecto, las duraciones independientes agrupan las unidades de reloj hasta horas y los meses en años, mientras que las duraciones medidas entre dos puntos se equilibran hasta días salvo que pases una unidad de destino mayor.

**Parámetros**

```params
- name: largestUnit
  type: Unit
  description: Unidad mayor en inglés hasta la que reagrupar los valores, como `'hour'`, `'day'` o `'week'`.
```

**Devuelve**

```returns
type: Duration
description: Nueva `Duration` equilibrada.
```

```js
import { minutes, months } from 'native-dates';

minutes(150).balance().toString(); // 'PT2H30M'
months(18).balance().toString(); // 'P1Y6M'
duration('36h').balance('day').toString(); // 'P1DT12H'
duration('10d').balance('week').toString(); // 'P1W3D'
```
:::

:::entry
### `total()` :kind[method]

```js signature
dur.total(unit): number
dur.as(unit): number
```

Devuelve la longitud completa de la duración como un único número de punto flotante expresado en la unidad indicada. También dispone del alias [`as()`](#as) para encadenar llamadas.

**Parámetros**

```params
- name: unit
  type: Unit
  required: true
  description: Unidad de destino en inglés para expresar la longitud total, como `'hours'` o `'days'`.
```

**Devuelve**

```returns
type: number
description: Longitud total en `unit`, incluida cualquier parte fraccionaria.
```

```js
import { months } from 'native-dates';

minutes(90).total('hours'); // 1.5
months(18).total('years'); // 1.5
date('2026-01-01').until('2026-04-01').total('days'); // 90
```
:::

:::entry
### `as()` :kind[method]

```js signature
dur.as(unit): number
```

Alias de [`total()`](#total) pensado para encadenar llamadas que convierte la duración en un valor numérico expresado en la unidad indicada.

```js
hours(36).as('days'); // 1.5
date('2026-11-01').until('2026-11-16').as('days'); // 15
```
:::

:::entry
### `round()` :kind[method]

```js signature
dur.round(smallestUnit): Duration
```

Redondea la duración a la unidad entera más cercana; los empates en el punto medio se redondean alejándose de cero.

**Parámetros**

```params
- name: smallestUnit
  type: Unit
  required: true
  description: Unidad menor en inglés que se conserva tras el redondeo, como `'minute'` o `'hour'`.
```

**Devuelve**

```returns
type: Duration
description: Nueva `Duration` redondeada.
```

```js
minutes(90).round('hour').toString(); // 'PT2H'
duration('1h 20m').round('hour').toString(); // 'PT1H'
```
:::

## Comparar duraciones

Compara duraciones por su longitud total y no por cómo se escribieron sus campos, de modo que 60 minutos equivalen a 1 hora.

:::entry
### `equals()` :kind[method]

```js signature
dur.equals(other): boolean
```

Devuelve `true` cuando ambas duraciones representan la misma longitud total.

**Parámetros**

```params
- name: other
  type: DurationInput
  required: true
  description: Otra `Duration` o cualquier entrada aceptada por `duration()`.
```

**Devuelve**

```returns
type: boolean
description: '`true` si ambas duraciones tienen la misma longitud.'
```

```js
import { months, years } from 'native-dates';

hours(1).equals(minutes(60)); // true
years(1).equals(months(12)); // true
```
:::

:::entry
### `compare()` :kind[method]

```js signature
dur.compare(other): number
```

Compara esta duración con otra según su longitud total para ordenar colecciones.

**Parámetros**

```params
- name: other
  type: DurationInput
  required: true
  description: Duración con la que comparar.
```

**Devuelve**

```returns
type: number
description: '`-1` si es más corta, `0` si son iguales o `1` si es más larga.'
```

```js
hours(1).compare(minutes(90)); // -1
date('2026-01-01').until('2026-02-01').compare(days(31)); // 0
```
:::

### Predicados de signo

Comprobaciones sin argumentos para duraciones vacías o negativas:

| Método | Tipo | Descripción |
|---|---|---|
| `isZero()` | `boolean` | Indica si todas las unidades de la duración son cero. |
| `isNegative()` | `boolean` | Indica si la duración representa un valor negativo. |

## Formateo y conversión

:::entry
### `format()` :kind[method]

```js signature
dur.format(style?, locale?): string
```

Formatea la duración en el locale activo mediante `Intl.DurationFormat`. El exceso de unidades de reloj se equilibra automáticamente hasta horas, y los campos inferiores al segundo permanecen ocultos siempre que existan unidades mayores.

**Parámetros**

```params
- name: style
  type: "'long' | 'short' | 'narrow' | 'digital'"
  default: "'long'"
  description: Estilo visual para las etiquetas de unidad, o `'digital'` para un temporizador separado por dos puntos.
- name: locale
  type: string
  description: Etiqueta de locale BCP 47 que sobrescribe, solo para esta llamada, el locale de esta duración o el configurado globalmente.
```

**Devuelve**

```returns
type: string
description: Cadena de duración formateada según el locale.
```

```js
const span = duration('2h 30m');

span.format('long', 'en-US'); // '2 hours, 30 minutes'
span.format('short', 'en-US'); // '2 hr, 30 min'
span.format('narrow', 'en-US'); // '2h 30m'
span.format('digital', 'en-US'); // '2:30:00'
```
:::

:::entry
### `locale()` :kind[method]

```js signature
dur.locale(): Locale | undefined
dur.locale(tag): Duration
```

Lee el locale asociado a esta duración o devuelve una copia formateada con otro locale en vistas previas de texto, presets y operaciones aritméticas encadenadas. Pasar una etiqueta vacía borra el locale asociado, y [`lang()`](#lang) funciona como alias.

**Parámetros**

```params
- name: tag
  type: Locale | null | undefined
  description: Etiqueta de locale BCP 47 que se conservará, o `null` para borrar una etiqueta existente.
```

**Devuelve**

```returns
type: Duration | Locale | undefined
description: Etiqueta activa cuando se llama sin argumentos, o nueva `Duration` con `tag`.
```

```js
import { days } from 'native-dates';

const wait = days(2).locale('ar');

wait.locale(); // 'ar'
wait.text; // 'يومان'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
dur.lang(): Locale | undefined
dur.lang(tag): Duration
```

Alias abreviado de [`locale()`](#locale) que lee o asocia una etiqueta de locale BCP 47 en esta duración.
:::

:::entry
### `toFields()` :kind[method]

```js signature
dur.toFields(): DurationFields
```

Devuelve un objeto plano que incluye únicamente los campos de unidad en plural distintos de cero de esta duración.

```js
duration('1h 30m').toFields(); // { hours: 1, minutes: 30 }
```
:::

:::entry
### `toString()` :kind[method]

```js signature
dur.toString(): string
dur.toJSON(): string
```

Devuelve la cadena de duración ISO 8601. `toJSON()` devuelve la misma cadena para `JSON.stringify()`.

**Devuelve**

```returns
type: string
description: Cadena de duración ISO 8601, como `'PT1H30M'`.
```

```js
const ttl = duration('1h 30m');

ttl.toString(); // 'PT1H30M'
JSON.stringify({ ttl }); // '{"ttl":"PT1H30M"}'
```
:::

:::entry
### `toMilliseconds()` :kind[method]

```js signature
dur.toMilliseconds(): number
```

Devuelve la longitud total en milisegundos. Las duraciones de meses o años sin punto de referencia lanzan un `RangeError`.

```js
hours(2).toMilliseconds(); // 7200000
```
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
dur.toTemporal(): Temporal.Duration
```

Devuelve la instancia subyacente de `Temporal.Duration`.
:::

:::entry
### `valueOf()` :kind[method]

```js signature
dur.valueOf(): number
```

Devuelve el total en milisegundos para que las duraciones de longitud fija o con punto de referencia funcionen con temporizadores y operadores de comparación numérica.
:::
