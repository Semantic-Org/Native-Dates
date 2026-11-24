---
source: "6f9a2cfc4ed9"
title: duration()
lede: Crea una Duration a partir de una frase de unidades en inglés, una duración ISO 8601, un número con unidad o funciones auxiliares de unidad.
---

## Crear duraciones

:::entry
### `duration()` :kind[function]

```js signature
duration(input, unit?): Duration
duration(input, options?): Duration
```

Crea una [`Duration`](/api/duration/) a partir de un número y una unidad, una frase legible en inglés, una cadena de duración ISO 8601, un objeto de campos o milisegundos. Los campos se conservan tal como se escriben hasta que llamas a [`balance()`](/api/duration/#balance), de modo que 90 minutos siguen siendo 90 minutos y no se convierten en una hora y media.

```js title="lengths.js"
import { duration } from 'native-dates';

const phrase = duration('1h 30m');
const words = duration('2 weeks and 3 days');
const iso = duration('PT1H30M');
const count = duration(90, 'minutes');
const spilled = duration(1.5, 'days');
const fields = duration({ hours: 1, minutes: 30 });
const ms = duration(1500);

spilled.days; // 1
spilled.hours; // 12
ms.seconds; // 0
ms.milliseconds; // 1500
```

**Parámetros**

```params
- name: input
  type: DurationInput
  required: true
  description: Número acompañado de `unit`, frase de duración en inglés, cadena ISO 8601, objeto de campos, `Duration` o milisegundos.
- name: unitOrOptions
  type: "Unit | { locale?: Locale, loose?: boolean }"
  description: Nombre de unidad en inglés cuando `input` es una cantidad numérica, u objeto de opciones.
  options:
    - name: locale
      type: Locale
      description: Etiqueta de locale BCP 47 asociada a la `Duration` devuelta y a cualquier valor derivado de ella.
    - name: loose
      type: boolean
      default: 'false'
      description: "Devolución de `null` ante entradas ilegibles cuando está cargado `@native-dates/plugins/loose`."
```

**Devuelve**

```returns
type: Duration
description: "Instancia `Duration` que conserva los campos escritos, o `null` si el modo loose no logra interpretar `input`."
```

Con [`@native-dates/plugins/loose`](/plugins/loose/) importado, el modo loose devuelve `null` en lugar de lanzar un error cuando el texto introducido por el usuario no se puede interpretar como una duración:

```js
import { duration } from 'native-dates';
import '@native-dates/plugins/loose';

duration('45 mins', { loose: true })?.minutes; // 45
duration('soon', { loose: true }); // null
```
:::

### Entradas aceptadas

| Entrada | Ejemplo | Cómo se interpreta |
|---|---|---|
| Cantidad y unidad | `duration(90, 'minutes')`, `duration(1.5, 'days')` | Combina un número o una cadena numérica con una unidad en inglés y traslada las fracciones a la unidad inferior. |
| Frase en inglés | `'1h 30m'`, `'2 weeks and 3 days'`, `'-15m'` | Lee cantidades separadas por espacios, comas o `and` con nombres de unidades en inglés o abreviaturas. |
| Cadena ISO 8601 | `'PT1H30M'`, `'P2W3D'` | Interpreta cadenas estándar de duración ISO 8601. |
| Objeto de campos | `{ hours: 1, minutes: 30 }` | Lee claves de unidad en singular o plural donde todos los campos distintos de cero comparten el mismo signo. |
| Milisegundos | `duration(1500)`, `duration(0)` | Interpreta un número o una cadena numérica sin unidad como milisegundos. |
| `Duration` o Temporal | `hours(2)`, `Temporal.Duration` | Devuelve sin cambios una `Duration` existente o envuelve un `Temporal.Duration`. |

:::note[Unidades fraccionarias y un único signo]
Las cantidades decimales se descomponen en unidades exactas más pequeñas, así que `duration(1.5, 'days')` equivale a 1 día y 12 horas. Como los meses no tienen una cantidad fija de días, las fracciones de mes lanzan un `RangeError`, igual que las frases con signos mezclados como `'1h -30m'`.
:::

## Funciones auxiliares de unidad

Las funciones auxiliares de unidad crean duraciones de una sola unidad que se leen de forma natural en operaciones aritméticas y expresiones. Cada función acepta un número positivo o negativo, o una cadena numérica.

```js
import { days, hours, minutes, today } from 'native-dates';

const reminder = today().plus(days(3)).at('9:00am');
const block = hours(1).plus(minutes(30));

block.format('short', 'en-US'); // '1 hr, 30 min'
```

:::entry
### `years()` :kind[function]

```js signature
years(count): Duration
```

Crea una duración para la cantidad indicada de años y traslada las fracciones de año a meses.
:::

:::entry
### `months()` :kind[function]

```js signature
months(count): Duration
```

Crea una duración para un número entero de meses del calendario.
:::

:::entry
### `weeks()` :kind[function]

```js signature
weeks(count): Duration
```

Crea una duración para la cantidad indicada de semanas y traslada las fracciones a días.
:::

:::entry
### `days()` :kind[function]

```js signature
days(count): Duration
```

Crea una duración para la cantidad indicada de días del calendario y traslada las fracciones a horas.
:::

:::entry
### `hours()` :kind[function]

```js signature
hours(count): Duration
```

Crea una duración para la cantidad indicada de horas y traslada las fracciones a minutos.
:::

:::entry
### `minutes()` :kind[function]

```js signature
minutes(count): Duration
```

Crea una duración para la cantidad indicada de minutos y traslada las fracciones a segundos.
:::

:::entry
### `seconds()` :kind[function]

```js signature
seconds(count): Duration
```

Crea una duración para la cantidad indicada de segundos y traslada las fracciones a milisegundos.
:::

:::entry
### `milliseconds()` :kind[function]

```js signature
milliseconds(count): Duration
```

Crea una duración para la cantidad indicada de milisegundos y traslada las fracciones a microsegundos y nanosegundos.
:::
