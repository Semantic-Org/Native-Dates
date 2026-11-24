---
source: "9606dd7fa967"
title: Intervalos
lede: Intervalos entre duas datas, instantes ou horas do dia, com verificação de inclusão, sobreposição e iteração.
---

## Classes de intervalo

Crie intervalos diretamente com as [funções de criação de intervalos](/api/range-fn/) (`dateRange()`, `datetimeRange()`, `timeRange()`), ou encadeie [`to()`](#to), [`for()`](#to) e [`range()`](#range) a partir de um ponto existente. Todas as instâncias de intervalo são imutáveis.

:::note[Datas inclusivas vs. instantes e horários semiabertos]
Intervalos de datas incluem o dia final, pois de 1º a 7 de setembro engloba todos os sete dias. Já intervalos de datas e horas e intervalos de horários são semiabertos (`[início, fim)`): incluem o início e excluem o fim, para que blocos consecutivos se encostem sem se sobrepor.
:::

:::entry
### `DateRange` :kind[class]

```js signature
new DateRange(start, end, options?)
new DateRange(interval, options?)
```

Representa um intervalo entre duas [datas de calendário](/api/calendar-date/), incluindo ambas as extremidades. Passar uma data final anterior à inicial lança `RangeError`. Strings de duração como `'7 days'` aceitam apenas unidades em inglês.

Um `DateRange` itera sob demanda dia a dia com `for...of` ou sintaxe spread, produzindo cada data de calendário do início ao fim.

```js title="ranges.js"
import { dateRange } from 'native-dates';

const trip = dateRange('2026-09-01', '2026-09-07');
const week = dateRange('2026-09-01', '7 days');

trip.duration.days; // 7
week.toString(); // '2026-09-01/2026-09-07'
for (const day of trip) {
  day.toString(); // '2026-09-01', '2026-09-02', ...
}
[...dateRange('2026-09-01', '2026-09-03')].map(String); // ['2026-09-01', '2026-09-02', '2026-09-03']
```
:::

:::entry
### `DateTimeRange` :kind[class]

```js signature
new DateTimeRange(start, end, options?)
new DateTimeRange(interval, options?)
```

Representa um intervalo semiaberto (`[início, fim)`) entre dois [instantes](/api/date-time/), incluindo o início e excluindo o fim. Quando o valor final não traz um fuso horário explícito, ele é interpretado no fuso horário do instante inicial. Extremidades invertidas lançam `RangeError`.

```js
import { datetimeRange } from 'native-dates';

const block = datetimeRange('2026-09-01T09:00', '2026-09-01T10:30', 'America/New_York');
const standup = datetimeRange('2026-09-01T09:00', '30m', 'America/New_York');

standup.duration.minutes; // 30
block.end.hour; // 10
```
:::

:::entry
### `TimeRange` :kind[class]

```js signature
new TimeRange(start, end, options?)
new TimeRange(interval, options?)
```

Representa um intervalo semiaberto (`[início, fim)`) entre duas [horas do dia](/api/time/), incluindo o início e excluindo o fim. Quando o horário final é anterior ao inicial no relógio, o intervalo atravessa a meia-noite para representar turnos noturnos.

```js
import { timeRange } from 'native-dates';

const dayShift = timeRange('9:00am', '5:00pm');
const nightShift = timeRange('22:00', '06:00');

dayShift.duration.hours; // 8
nightShift.duration.hours; // 8
```
:::

## Propriedades

Todo intervalo expõe seu texto formatado, as extremidades tipadas, o identificador de tipo e a duração medida.

| Propriedade | Tipo | Descrição |
|---|---|---|
| `text` | `string` | String do intervalo formatada no locale ativo, como `'Sep 1 – 7, 2026'`. |
| `start`, `end` | `CalendarDate \| DateTime \| Time` | Pontos inicial e final correspondentes à classe do intervalo. |
| `kind` | `'date' \| 'datetime' \| 'time'` | Identificador que indica o tipo de pontos armazenados no intervalo. |
| `duration` | [`Duration`](/api/duration/) | Duração completa ancorada em `start`, contando o último dia nos intervalos de datas e atravessando a meia-noite nos intervalos de horários noturnos. |

## Construção a partir de pontos

:::entry
### `to()` :kind[method]

```js signature
d.to(end, unit?): DateRange
d.through(end, unit?): DateRange
d.for(length, unit?): DateRange
dt.to(end, unit?): DateTimeRange
dt.for(length, unit?): DateTimeRange
t.to(end, unit?): TimeRange
t.for(length, unit?): TimeRange
```

Cria um intervalo a partir deste ponto até um ponto final ou por uma duração. Em uma [data de calendário](/api/calendar-date/), passar uma extensão de 7 dias resulta em uma data final seis dias após o início, pois ambas as extremidades são incluídas.

Use `for()` para criar um intervalo a partir de uma duração explícita (recusando pontos finais e números sem unidade). Uma data de calendário também oferece `through()` como alias de `to()`, refletindo que o último dia está incluído.

**Parâmetros**

```params
- name: end
  type: Point | DurationInput | number
  required: true
  description: Ponto final do mesmo tipo, entrada de duração em inglês ou ISO 8601, ou quantidade numérica `count` acompanhada de `unit`.
- name: unit
  type: Unit
  description: Nome da unidade em inglês quando o primeiro argumento é uma quantidade numérica.
```

**Retorno**

```returns
type: DateRange | DateTimeRange | TimeRange
description: Intervalo do mesmo tipo do ponto de origem.
```

```js
import { date, datetime, time } from 'native-dates';

date('2026-09-01').for(7, 'days').toString(); // '2026-09-01/2026-09-07'
datetime('2026-09-01T09:00Z', 'UTC').for(90, 'minutes').toString(); // '2026-09-01T09:00:00.000Z/2026-09-01T10:30:00.000Z'
time('9:00am').to('5:00pm').toString(); // '09:00:00/17:00:00'
```
:::

:::entry
### `range()` :kind[method]

```js signature
d.range(unit, firstDay?): DateRange
dt.range(unit, firstDay?): DateTimeRange
```

Retorna a unidade inteira de calendário ou de relógio que contém uma data ou um instante. Intervalos de datas vão do primeiro ao último dia da unidade (ambos incluídos), enquanto intervalos de datas e horas são semiabertos (`[início, próximoInício)`): vão do início da unidade até o início da unidade seguinte, excluindo esse limite final.

**Parâmetros**

```params
- name: unit
  type: Unit
  required: true
  description: Unidade em inglês que engloba o ponto, como `'week'`, `'month'` ou `'day'`.
- name: firstDay
  type: DayOfWeek
  description: Primeiro dia da semana em inglês (como `'monday'`) quando `unit` é `'week'`, sobrescrevendo `configure()` e o locale ativo.
```

**Retorno**

```returns
type: DateRange | DateTimeRange
description: Intervalo correspondente à unidade `unit`.
```

```js
import { date, datetime } from 'native-dates';

date('2026-11-18', { locale: 'en-US' }).range('week').toString(); // '2026-11-15/2026-11-21'
date('2026-11-18').range('week', 'monday').toString(); // '2026-11-16/2026-11-22'
date('2026-02-10').range('month').toString(); // '2026-02-01/2026-02-28'
datetime('2026-11-16T14:20Z', 'UTC').range('hour').toString(); // '2026-11-16T14:00:00.000Z/2026-11-16T15:00:00.000Z'
```
:::

## Inclusão e sobreposição

:::entry
### `contains()` :kind[method]

```js signature
range.contains(value): boolean
range.includes(value): boolean
```

Verifica se um ponto ou outro intervalo do mesmo tipo está contido neste intervalo. Intervalos de datas incluem `end`, intervalos de datas e horas e intervalos de horários excluem `end`, e intervalos de horários que cruzam a meia-noite incluem horários antes e depois da meia-noite. Também tem o alias `includes()`.

**Parâmetros**

```params
- name: value
  type: Point | Range
  required: true
  description: Ponto ou intervalo do mesmo tipo.
```

**Retorno**

```returns
type: boolean
description: "`true` quando `value` está contido neste intervalo."
```

```js
const stay = dateRange('2026-09-01', '2026-09-07');
stay.contains('2026-09-07'); // true

const night = timeRange('22:00', '06:00');
night.contains('23:30'); // true
night.contains('02:15'); // true
night.contains('06:00'); // false
```
:::

:::entry
### `overlaps()` :kind[method]

```js signature
range.overlaps(other): boolean
```

Retorna `true` quando dois intervalos do mesmo tipo compartilham pelo menos um dia ou instante. Blocos consecutivos de datas e horas ou de horários em que o primeiro termina exatamente quando o segundo começa não se sobrepõem.

**Parâmetros**

```params
- name: other
  type: Range | string
  required: true
  description: Instância de intervalo ou string de intervalo ISO do mesmo tipo.
```

**Retorno**

```returns
type: boolean
description: "`true` quando ambos os intervalos têm algum ponto em comum."
```

```js
const firstSlot = timeRange('09:00', '10:00');
const nextSlot = timeRange('10:00', '11:00');

firstSlot.overlaps(nextSlot); // false
dateRange('2026-09-01', '2026-09-05').overlaps('2026-09-05/2026-09-10'); // true
```
:::

:::entry
### `intersection()` :kind[method]

```js signature
range.intersection(other): Range | null
```

Retorna um novo intervalo cobrindo apenas o trecho compartilhado pelos dois intervalos, ou `null` quando eles são disjuntos. Dois intervalos de horários noturnos que se cruzam em dois trechos separados lançam `RangeError`.

**Parâmetros**

```params
- name: other
  type: Range | string
  required: true
  description: Instância de intervalo ou string de intervalo ISO do mesmo tipo.
```

**Retorno**

```returns
type: DateRange | DateTimeRange | TimeRange | null
description: Intervalo de sobreposição do mesmo tipo, ou `null` quando disjuntos.
```

```js
const a = dateRange('2026-09-01', '2026-09-10');
const b = dateRange('2026-09-05', '2026-09-15');

a.intersection(b)?.toString(); // '2026-09-05/2026-09-10'
a.intersection('2026-09-20/2026-09-25'); // null
```
:::

:::entry
### `equals()` :kind[method]

```js signature
range.equals(other): boolean
```

Retorna `true` quando ambos os intervalos têm os mesmos pontos inicial e final. Arrays de intervalos também podem ser ordenados cronologicamente com [`compare()`](/api/compare/).

```js
dateRange('2026-09-01', '2026-09-07').equals('2026-09-01/2026-09-07'); // true
```
:::

:::entry
### `isEmpty()` :kind[method]

```js signature
range.isEmpty(): boolean
```

Retorna `true` quando um intervalo de datas e horas ou de horários tem início e fim idênticos. Sempre retorna `false` em um [`DateRange`](#daterange), pois uma única data de calendário cobre um dia inteiro.

```js
timeRange('09:00', '09:00').isEmpty(); // true
dateRange('2026-09-01', '2026-09-01').isEmpty(); // false
```
:::

## Iteração, divisão e fusos horários

:::entry
### `every()` :kind[method]

```js signature
range.every(step): Point[]
range.every(count, unit): Point[]
```

Avança a partir de `start` em passos de uma unidade ou duração positiva e retorna todos os pontos dentro do intervalo. Cada passo é calculado diretamente a partir do ponto inicial, em vez de encadear somas sucessivas; assim, avançar de mês em mês a partir de 31 de janeiro cai no último dia de cada mês.

Para percorrer um [`DateRange`](#daterange) sob demanda um dia de cada vez sem alocar um array, itere diretamente sobre ele com `for...of` ou sintaxe spread.

**Parâmetros**

```params
- name: step
  type: Unit | DurationInput | number
  required: true
  description: Nome de unidade em inglês como `'day'`, entrada de duração em inglês ou ISO 8601, ou quantidade numérica `count` acompanhada de `unit`.
- name: unit
  type: Unit
  description: Nome da unidade em inglês quando `step` é um número.
```

**Retorno**

```returns
type: Array<CalendarDate | DateTime | Time>
description: Array ordenado de pontos dentro do intervalo.
```

```js
dateRange('2026-01-31', '2026-04-30').every('month').map(String);
// ['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30']

timeRange('22:00', '02:00').every(1, 'hour').map(String);
// ['22:00:00', '23:00:00', '00:00:00', '01:00:00']
```
:::

:::entry
### `count()` :kind[method]

```js signature
dateRange.count(kind?): number
```

Conta os dias de calendário dentro de um [`DateRange`](#daterange) sem alocar instâncias intermediárias de data. Passe `'days'` (padrão), `'weekdays'`, `'weekends'` ou um nome de dia da semana em inglês, como `'mondays'`. `'weekdays'` e `'weekends'` seguem os dias de fim de semana do locale ativo.

**Parâmetros**

```params
- name: kind
  type: string
  default: "'days'"
  description: "Valores `'days'`, `'weekdays'`, `'weekends'` ou nome de dia da semana em inglês, como `'mondays'`."
```

**Retorno**

```returns
type: number
description: Quantidade de dias de calendário correspondentes no intervalo.
```

```js
const sprint = dateRange('2026-05-01', '2 weeks');

sprint.count(); // 14
sprint.count('weekdays'); // 10
sprint.count('weekends'); // 4
sprint.count('mondays'); // 2
```
:::

:::entry
### `split()` :kind[method]

```js signature
range.split(step): Range[]
range.split(count, unit): Range[]
range.splitBy(step): Range[]
range.splitBy(count, unit): Range[]
```

Divide o intervalo em subintervalos contíguos do tamanho do passo informado, ajustando o último bloco ao limite final do intervalo. Aceita os mesmos argumentos de passo que [`every()`](#every) e também tem o alias `splitBy()`.

```js
dateRange('2026-09-01', '2026-09-10').split(4, 'days').map(String);
// ['2026-09-01/2026-09-04', '2026-09-05/2026-09-08', '2026-09-09/2026-09-10']
```
:::

:::entry
### `in()` :kind[method]

```js signature
dateRange.in(zone?): DateTimeRange
dtRange.in(zone): DateTimeRange
```

Converte um [`DateRange`](#daterange) em um [`DateTimeRange`](#datetimerange) semiaberto (`[início, diaSeguinteAoFim)`), da meia-noite do dia inicial até a meia-noite do dia seguinte ao último dia (limite exclusivo), no formato exato de limites de consulta por timestamp. Em um intervalo de datas e horas, move ambas as extremidades para o fuso horário de destino.

Chamar `in()` em um intervalo de horários lança `RangeError`, pois horas do dia não têm data de calendário.

**Parâmetros**

```params
- name: zone
  type: Zone
  description: Fuso horário IANA de destino, deslocamento UTC fixo ou `'UTC'`. Em `DateRange`, usa o fuso configurado como padrão.
```

**Retorno**

```returns
type: DateTimeRange
description: Intervalo semiaberto de datas e horas em `zone`.
```

```js
dateRange('2026-09-01', '2026-09-03').in('UTC').toString();
// '2026-09-01T00:00:00.000Z/2026-09-04T00:00:00.000Z'
```
:::

## Formatação e conversão

:::entry
### `format()` :kind[method]

```js signature
range.format(spec?, locale?): string
```

Formata o intervalo com o formatador localizado de `Intl` para presets e objetos de opções, compactando automaticamente datas ou meses em comum. Padrões de tokens formatam cada extremidade separadamente e as unem com `' – '`.

Formatos personalizados registrados em [`configure()`](/api/configure/) também funcionam aqui. Veja [Formatação](/guides/formatting/) para os detalhes de presets e tokens.

**Parâmetros**

```params
- name: spec
  type: FormatSpec
  description: Nome de preset, objeto `Intl.DateTimeFormatOptions` ou padrão de tokens.
- name: locale
  type: Locale
  description: Tag de locale BCP 47 que sobrescreve, nesta chamada, o locale deste intervalo ou o configurado globalmente.
```

**Retorno**

```returns
type: string
description: String formatada do intervalo.
```

```js
const trip = dateRange('2026-09-01', '2026-09-07');

trip.format('medium', 'en-US'); // 'Sep 1 – 7, 2026'
trip.format('YYYY-MM-DD'); // '2026-09-01 – 2026-09-07'
timeRange('22:00', '06:00').format('HH:mm'); // '22:00 – 06:00'
```
:::

:::entry
### `locale()` :kind[method]

```js signature
range.locale(): Locale | undefined
range.locale(tag): Range
```

Lê o locale associado a este intervalo ou retorna uma cópia formatada em outro locale em saídas de texto, presets, extremidades e subintervalos. Passar uma tag vazia remove o locale associado, e [`lang()`](#lang) funciona como alias.

**Parâmetros**

```params
- name: tag
  type: Locale | null | undefined
  description: Tag de locale BCP 47 a propagar, ou `null` para limpar a tag atual.
```

**Retorno**

```returns
type: Range | Locale | undefined
description: Tag ativa quando chamado sem argumentos, ou novo intervalo do mesmo tipo associado a `tag`.
```

```js
const stay = dateRange('2026-09-01', '2026-09-07').locale('de-DE');

stay.locale(); // 'de-DE'
stay.format('medium'); // '01.–07.09.2026'
stay.duration.text; // '7 Tage'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
range.lang(): Locale | undefined
range.lang(tag): Range
```

Alias abreviado de [`locale()`](#locale) para ler ou associar uma tag de locale BCP 47 neste intervalo.
:::

:::entry
### `as()` :kind[method]

```js signature
range.as('duration'): Duration
```

Retorna a duração do intervalo quando `'duration'` é solicitado em encadeamentos de métodos, lançando `RangeError` para outros tipos.

```js
dateRange('2026-09-01', '2026-09-07').as('duration').days; // 7
```
:::

:::entry
### `toString()` :kind[method]

```js signature
range.toString(): string
range.toJSON(): string
```

Retorna a string de intervalo ISO 8601 `'start/end'`, que pode ser interpretada diretamente pelas [funções de criação de intervalos](/api/range-fn/). `toJSON()` retorna a mesma string na serialização JSON.

```js
dateRange('2026-09-01', '2026-09-07').toString(); // '2026-09-01/2026-09-07'
timeRange('9am', '5pm').toJSON(); // '09:00:00/17:00:00'
```
:::

:::entry
### `valueOf()` :kind[method]

```js signature
range.valueOf(): never
```

Lança `RangeError` para que operadores numéricos nunca convertam um intervalo em número.

Refine valores desconhecidos em tempo de execução com [`kindOf()`](/api/kind-of/) ou com os [type guards de intervalo](/api/kind-of/#type-guards) exportados:

```js
import { dateRange, isDateRange, isDateTimeRange, isTimeRange } from 'native-dates';

const stay = dateRange('2026-09-01', '2026-09-07');
isDateRange(stay); // true
isDateTimeRange(stay); // false
isTimeRange(stay); // false
```
:::
