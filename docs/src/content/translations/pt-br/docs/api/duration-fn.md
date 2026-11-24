---
source: "6f9a2cfc4ed9"
title: duration()
lede: Crie uma Duration a partir de uma expressão em inglês, uma duração ISO 8601, um número com unidade ou auxiliares de unidade.
---

## Criar durações

:::entry
### `duration()` :kind[function]

```js signature
duration(input, unit?): Duration
duration(input, options?): Duration
```

Cria uma [`Duration`](/api/duration/) a partir de uma quantidade com unidade em inglês, uma expressão legível em inglês, uma string de duração ISO 8601, um objeto de campos ou milissegundos. Os campos permanecem exatamente como foram escritos até você chamar [`balance()`](/api/duration/#balance); assim, 90 minutos continuam sendo 90 minutos em vez de virarem 1 hora e 30 minutos.

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

**Parâmetros**

```params
- name: input
  type: DurationInput
  required: true
  description: Número acompanhado de `unit`, expressão de duração em inglês, string ISO 8601, objeto de campos, `Duration` ou milissegundos.
- name: unitOrOptions
  type: "Unit | { locale?: Locale, loose?: boolean }"
  description: Nome de unidade em inglês quando `input` é uma contagem numérica, ou objeto de opções.
  options:
    - name: locale
      type: Locale
      description: Tag de locale BCP 47 mantida na `Duration` retornada e em todos os valores derivados dela.
    - name: loose
      type: boolean
      default: 'false'
      description: "Retorno de `null` em entradas ilegíveis com `@native-dates/plugins/loose`."
```

**Retorno**

```returns
type: Duration
description: "Uma `Duration` preservando os campos informados, ou `null` quando o modo loose não consegue interpretar `input`."
```

Com [`@native-dates/plugins/loose`](/plugins/loose/) importado, o modo loose retorna `null` em vez de lançar erro quando um texto digitado pelo usuário não pode ser interpretado como duração:

```js
import { duration } from 'native-dates';
import '@native-dates/plugins/loose';

duration('45 mins', { loose: true })?.minutes; // 45
duration('soon', { loose: true }); // null
```
:::

### Entradas aceitas

| Entrada | Exemplo | Como é lida |
|---|---|---|
| Quantidade e unidade | `duration(90, 'minutes')`, `duration(1.5, 'days')` | Combina um número ou string numérica com uma unidade em inglês, convertendo frações para a unidade menor seguinte. |
| Expressão em inglês | `'1h 30m'`, `'2 weeks and 3 days'`, `'-15m'` | Lê quantidades separadas por espaço, vírgula ou `and` com nomes de unidades em inglês ou abreviações. |
| String ISO 8601 | `'PT1H30M'`, `'P2W3D'` | Interpreta strings de duração no padrão ISO 8601. |
| Objeto de campos | `{ hours: 1, minutes: 30 }` | Lê chaves de unidade em inglês no singular ou plural, desde que todos os campos diferentes de zero tenham o mesmo sinal. |
| Milissegundos | `duration(1500)`, `duration(0)` | Trata um número ou string numérica sem unidade como milissegundos. |
| Duration ou Temporal | `hours(2)`, `Temporal.Duration` | Retorna uma `Duration` existente sem alterações ou encapsula uma `Temporal.Duration`. |

:::note[Unidades fracionárias e sinal único]
Contagens fracionárias são convertidas para unidades exatas menores: `duration(1.5, 'days')` vira 1 dia e 12 horas. Como meses não têm número fixo de dias, meses fracionários lançam `RangeError`, assim como expressões com sinais mistos como `'1h -30m'`.
:::

## Auxiliares de unidade

Os auxiliares de unidade criam durações de uma única unidade que tornam chamadas e expressões aritméticas naturais de ler. Cada auxiliar aceita um número positivo ou negativo, ou uma string numérica.

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

Cria uma duração para o número de anos informado, convertendo frações de ano em meses.
:::

:::entry
### `months()` :kind[function]

```js signature
months(count): Duration
```

Cria uma duração para um número inteiro de meses de calendário.
:::

:::entry
### `weeks()` :kind[function]

```js signature
weeks(count): Duration
```

Cria uma duração para o número de semanas informado, convertendo frações em dias.
:::

:::entry
### `days()` :kind[function]

```js signature
days(count): Duration
```

Cria uma duração para o número de dias de calendário informado, convertendo frações em horas.
:::

:::entry
### `hours()` :kind[function]

```js signature
hours(count): Duration
```

Cria uma duração para o número de horas informado, convertendo frações em minutos.
:::

:::entry
### `minutes()` :kind[function]

```js signature
minutes(count): Duration
```

Cria uma duração para o número de minutos informado, convertendo frações em segundos.
:::

:::entry
### `seconds()` :kind[function]

```js signature
seconds(count): Duration
```

Cria uma duração para o número de segundos informado, convertendo frações em milissegundos.
:::

:::entry
### `milliseconds()` :kind[function]

```js signature
milliseconds(count): Duration
```

Cria uma duração para o número de milissegundos informado, convertendo frações até microssegundos e nanossegundos.
:::
