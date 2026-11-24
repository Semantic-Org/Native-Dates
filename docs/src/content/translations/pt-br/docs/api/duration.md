---
source: "05899a15dfff"
title: Duration
lede: Uma extensão de tempo expressa em unidades de calendário e de relógio.
---

## Criar uma Duration

Interprete expressões em inglês (como `'1h 30m'`) e strings ISO 8601 com [`duration()`](/api/duration-fn/), chame funções auxiliares por unidade como [`hours()`](/api/duration-fn/#hours) ou meça o tempo decorrido entre duas datas ou dois horários. As instâncias são imutáveis, portanto cada método retorna um novo valor.

```js title="create.js"
import { date, days, duration, hours } from 'native-dates';

const breakTime = duration('1h 30m');
const trial = days(14);
const timeout = hours(1.5);
const quarter = date('2026-01-01').until('2026-04-01');
```

:::note[Os campos permanecem como foram informados]
Criar uma duração a partir de 90 minutos mantém `minutes` em `90`, sem converter automaticamente para 1 hora e 30 minutos. Dias de calendário também permanecem separados das horas em transições de horário de verão até você chamar [`balance()`](#balance).
:::

## Propriedades

As propriedades refletem as quantidades de cada unidade armazenadas na duração.

| Propriedade | Tipo | Descrição |
|---|---|---|
| `text` | `string` | Duração formatada no locale ativo em estilo longo, como `'1 hour, 30 minutes'`. |
| `years`, `months`, `weeks`, `days` | `number` | Quantidades com sinal das unidades de calendário armazenadas nesta duração. |
| `hours`, `minutes`, `seconds` | `number` | Quantidades com sinal das unidades de relógio. |
| `milliseconds`, `microseconds`, `nanoseconds` | `number` | Quantidades com sinal das unidades menores que um segundo. |
| `sign` | `number` | Direção geral da duração: `1`, `0` ou `-1`. |
| `anchor` | `TemporalValue` | Ponto de partida registrado por [`until()`](/api/date-time/#until) ou [`since()`](/api/date-time/#since), ou `undefined` em durações avulsas. |

## Aritmética e sinal

Combine durações, multiplique-as por um fator ou inverta o sinal. Todos os campos diferentes de zero em uma duração precisam ter o mesmo sinal.

:::entry
### `plus()` :kind[method]

```js signature
dur.plus(other, unit?): Duration
dur.add(other, unit?): Duration
```

Soma outra duração e retorna uma nova `Duration`. Unidades de calendário são somadas campo a campo, enquanto unidades de relógio são combinadas de forma exata. `add()` é um alias.

**Parâmetros**

```params
- name: other
  type: DurationInput
  required: true
  description: Quantidade acompanhada de `unit`, instância de `Duration`, string de duração em inglês ou ISO 8601, objeto de campos ou milissegundos.
- name: unit
  type: Unit
  description: Nome da unidade em inglês quando `other` é um número, como `'minutes'` ou `'days'`.
```

**Retorno**

```returns
type: Duration
description: Nova `Duration` combinada.
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

Subtrai outra duração, convertendo anos em meses ou semanas em dias quando necessário. Pares incompatíveis com sinais opostos, como dias menos horas, lançam `RangeError`. `subtract()` funciona como alias.

**Parâmetros**

```params
- name: other
  type: DurationInput
  required: true
  description: Quantidade acompanhada de `unit`, instância de `Duration`, string de duração em inglês ou ISO 8601, objeto de campos ou milissegundos.
- name: unit
  type: Unit
  description: Nome da unidade em inglês quando `other` é um número.
```

**Retorno**

```returns
type: Duration
description: Nova `Duration` após a subtração de `other`.
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

Multiplica cada campo por um número, redistribuindo partes fracionárias para unidades menores.

**Parâmetros**

```params
- name: factor
  type: number
  required: true
  description: Multiplicador aplicado à duração, podendo ser fracionário ou negativo.
```

**Retorno**

```returns
type: Duration
description: Nova `Duration` multiplicada pelo fator.
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

Retorna uma cópia com todos os campos positivos.

```js
duration('-1h 30m').abs().toString(); // 'PT1H30M'
```
:::

:::entry
### `negated()` :kind[method]

```js signature
dur.negated(): Duration
```

Inverte o sinal de todos os campos da duração.

```js
hours(2).negated().toString(); // '-PT2H'
```
:::

## Balanceamento, arredondamento e totais

Reagrupe unidades menores em unidades maiores, arredonde para a precisão desejada ou expresse toda a duração como um único número.

:::warning[Conversão de meses e anos para dias]
Durações compostas apenas de meses e anos podem ser balanceadas, totalizadas e comparadas entre si considerando 12 meses por ano. Para convertê-las em semanas, dias ou unidades de relógio, é necessário ter uma data inicial ancorada por [`until()`](/api/calendar-date/#until) ou [`since()`](/api/calendar-date/#since), pois cada mês do calendário tem uma quantidade diferente de dias.
:::

:::entry
### `balance()` :kind[method]

```js signature
dur.balance(largestUnit?): Duration
```

Propaga o excedente de unidades menores para unidades maiores. Por padrão, durações avulsas agrupam unidades de relógio até horas e meses em anos, enquanto durações medidas (ancoradas) balanceiam até dias, a menos que você passe uma unidade maior como destino.

**Parâmetros**

```params
- name: largestUnit
  type: Unit
  description: Maior unidade em inglês para reagrupar os valores, como `'hour'`, `'day'` ou `'week'`.
```

**Retorno**

```returns
type: Duration
description: Nova `Duration` balanceada.
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

Retorna a extensão total da duração como um único número de ponto flutuante na unidade informada. Também tem o alias [`as()`](#as) para facilitar o encadeamento.

**Parâmetros**

```params
- name: unit
  type: Unit
  required: true
  description: Unidade de destino em inglês para expressar o total, como `'hours'` ou `'days'`.
```

**Retorno**

```returns
type: number
description: Extensão total em `unit`, incluindo eventual parte fracionária.
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

Alias de [`total()`](#total) pensado para encadeamento, que converte a duração em um valor numérico na unidade informada.

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

Arredonda a duração para o inteiro mais próximo na unidade especificada, arredondando empates (exatamente na metade) para longe de zero.

**Parâmetros**

```params
- name: smallestUnit
  type: Unit
  required: true
  description: Menor unidade em inglês mantida após o arredondamento, como `'minute'` ou `'hour'`.
```

**Retorno**

```returns
type: Duration
description: Nova `Duration` arredondada.
```

```js
minutes(90).round('hour').toString(); // 'PT2H'
duration('1h 20m').round('hour').toString(); // 'PT1H'
```
:::

## Comparação de durações

As durações são comparadas pela extensão total, e não pela forma como seus campos foram escritos; assim, 60 minutos equivalem a 1 hora.

:::entry
### `equals()` :kind[method]

```js signature
dur.equals(other): boolean
```

Retorna `true` quando ambas as durações representam a mesma extensão total.

**Parâmetros**

```params
- name: other
  type: DurationInput
  required: true
  description: Outra `Duration` ou qualquer entrada aceita por `duration()`.
```

**Retorno**

```returns
type: boolean
description: "`true` quando ambas as durações têm a mesma extensão."
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

Ordena esta duração em relação a outra pela extensão total.

**Parâmetros**

```params
- name: other
  type: DurationInput
  required: true
  description: Duração usada na comparação.
```

**Retorno**

```returns
type: number
description: "`-1` quando menor, `0` quando igual ou `1` quando maior."
```

```js
hours(1).compare(minutes(90)); // -1
date('2026-01-01').until('2026-02-01').compare(days(31)); // 0
```
:::

### Predicados de sinal

Verificações sem argumentos para durações zeradas ou negativas:

| Método | Tipo | Descrição |
|---|---|---|
| `isZero()` | `boolean` | Indica se todas as unidades da duração são zero. |
| `isNegative()` | `boolean` | Indica se a duração representa um período negativo. |

## Formatação e conversão

:::entry
### `format()` :kind[method]

```js signature
dur.format(style?, locale?): string
```

Formata a duração no locale ativo usando `Intl.DurationFormat`. O excedente das unidades de relógio é balanceado automaticamente até horas, e campos menores que um segundo ficam ocultos sempre que há unidades maiores presentes.

**Parâmetros**

```params
- name: style
  type: "'long' | 'short' | 'narrow' | 'digital'"
  default: "'long'"
  description: Estilo de exibição dos rótulos de unidade, ou `'digital'` para formato de cronômetro separado por dois-pontos.
- name: locale
  type: string
  description: Tag de locale BCP 47 que sobrescreve, nesta chamada, o locale desta duração ou o configurado globalmente.
```

**Retorno**

```returns
type: string
description: String da duração formatada conforme o locale.
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

Lê o locale associado a esta duração ou retorna uma cópia formatada em outro locale em saídas de texto, presets e cadeias aritméticas. Passar uma tag vazia remove o locale associado, e [`lang()`](#lang) funciona como alias.

**Parâmetros**

```params
- name: tag
  type: Locale | null | undefined
  description: Tag de locale BCP 47 a propagar, ou `null` para limpar a tag atual.
```

**Retorno**

```returns
type: Duration | Locale | undefined
description: Tag ativa quando chamado sem argumentos, ou nova `Duration` associada a `tag`.
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

Alias abreviado de [`locale()`](#locale) para ler ou associar uma tag de locale BCP 47 nesta duração.
:::

:::entry
### `toFields()` :kind[method]

```js signature
dur.toFields(): DurationFields
```

Retorna um objeto simples contendo apenas os campos no plural diferentes de zero desta duração.

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

Retorna a string de duração no formato ISO 8601. `toJSON()` retorna a mesma string para `JSON.stringify()`.

**Retorno**

```returns
type: string
description: String de duração ISO 8601, como `'PT1H30M'`.
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

Retorna a extensão total em milissegundos. Durações com meses ou anos sem âncora lançam `RangeError`.

```js
hours(2).toMilliseconds(); // 7200000
```
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
dur.toTemporal(): Temporal.Duration
```

Retorna a instância subjacente de `Temporal.Duration`.
:::

:::entry
### `valueOf()` :kind[method]

```js signature
dur.valueOf(): number
```

Retorna o total em milissegundos para que durações de tamanho fixo ou ancoradas funcionem com temporizadores e operadores numéricos de comparação.
:::
