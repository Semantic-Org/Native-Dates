---
source: "62b87452c7ee"
title: DateTime
lede: Um instante específico no tempo, visto em um fuso horário.
---

## Criar um DateTime

Crie uma instância a partir de um valor existente com [`datetime()`](/api/datetime-fn/), leia o instante atual com [`now()`](/api/datetime-fn/#now) ou combine uma data de calendário com um horário usando [`at()`](/api/calendar-date/#at). As instâncias são imutáveis, portanto todo método que altera um valor retorna uma nova instância.

```js title="create.js"
import { date, datetime, now } from 'native-dates';

const fromUtc = datetime('2026-11-16T17:30:00Z', 'America/Los_Angeles');
const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
const current = now();
```

Passe um fuso horário para visualizar o instante nesse fuso, ou omita o argumento para usar o padrão definido em [`configure()`](/api/configure/):

```js
const event = datetime('2026-11-16T17:30:00Z', 'America/New_York');
event.zone; // 'America/New_York'
event.hour; // 12
```

:::note[Deslocamentos definem o instante, não o fuso horário]
Um `Z` final ou um deslocamento UTC numérico na string de entrada identifica quando o instante ocorreu, enquanto a instância adota o fuso horário que você passa ou o padrão configurado. Passe `'UTC'` como fuso horário quando quiser campos e cálculos em UTC.
:::

## Propriedades

As propriedades leem a data e a hora no fuso horário da instância.

| Propriedade | Tipo | Descrição |
|---|---|---|
| `text` | `string` | Data, horário e nome abreviado do fuso formatados no locale ativo, como `'Nov 16, 2026, 9:30 AM PST'`. |
| `year`, `month`, `day` | `number` | Ano do calendário, mês (1–12) e dia do mês (1–31). |
| `hour`, `minute`, `second` | `number` | Campos de relógio no formato de 24 horas (0–23, 0–59, 0–59). |
| `millisecond`, `microsecond`, `nanosecond` | `number` | Campos subsegundo do relógio (0–999). |
| `zone` | `string` | Identificador IANA canônico de fuso horário ou deslocamento UTC fixo, como `'America/Los_Angeles'` ou `'UTC'`. |
| `offset` | `string` | Deslocamento UTC ativo nesse instante, como `'-08:00'`. |
| `epochSeconds` | `number` | Segundos inteiros desde a época Unix, arredondados para baixo. |
| `epochMilliseconds` | `number` | Milissegundos desde a época Unix. |
| `epochNanoseconds` | `bigint` | Nanossegundos exatos desde a época Unix. |
| `date` | [`CalendarDate`](/api/calendar-date/) | Data de calendário neste fuso horário. |
| `time` | [`Time`](/api/time/) | Hora do dia neste fuso horário. |
| `yearMonth` | [`YearMonth`](/api/year-month/) | Ano e mês de calendário neste fuso horário. |
| `monthDay` | [`MonthDay`](/api/month-day/) | Mês e dia de calendário neste fuso horário. |
| `dayOfWeek` | `number` | Dia ISO da semana, de 1 para segunda-feira até 7 para domingo. |
| `weekStart` | `number` | Primeiro dia das semanas deste instante, de 1 a 7, seguindo [`configure()`](/api/configure/) ou o seu locale. |
| `quarter` | `number` | Trimestre do calendário (1–4). |
| `weekOfYear`, `dayOfYear` | `number` | Número da semana ISO (1–53) e dia do ano (1–366). |
| `daysInMonth`, `daysInYear`, `hoursInDay` | `number` | Quantidade de dias do mês e do ano atuais e de horas do dia local. |

## Fuso horário e campos

Visualize o mesmo instante em outro fuso horário ou substitua campos individuais de calendário e de relógio.

:::entry
### `in()` :kind[method]

```js signature
dt.in(zone): DateTime
```

Retorna um novo `DateTime` que representa o mesmo instante em outro fuso horário. As propriedades locais de calendário e de relógio mudam para refletir o fuso de destino, enquanto o timestamp subjacente permanece o mesmo.

**Parâmetros**

```params
- name: zone
  type: Zone
  required: true
  description: Nome de fuso horário IANA como `'Europe/Berlin'`, deslocamento UTC fixo ou `'UTC'`.
```

**Retorno**

```returns
type: DateTime
description: Novo `DateTime` no mesmo instante, visto em `zone`.
```

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
const berlin = standup.in('Europe/Berlin');

berlin.hour; // 18
berlin.equals(standup); // true
```
:::

:::entry
### `at()` :kind[method]

```js signature
dt.at(time): DateTime
```

Retorna um novo `DateTime` no mesmo dia e no mesmo fuso horário, com a hora do dia substituída.

**Parâmetros**

```params
- name: time
  type: TimeInput
  required: true
  description: String de horário como `'9:30am'`, instância de `Time`, objeto de campos ou `Date`.
```

**Retorno**

```returns
type: DateTime
description: Novo `DateTime` na mesma data, no horário `time`.
```

```js
const morning = datetime('2026-11-16T09:30', 'America/Los_Angeles');
const wrapUp = morning.at('5:00pm');

wrapUp.hour; // 17
```
:::

:::entry
### `set()` :kind[method]

```js signature
dt.set(fields): DateTime
dt.set(unit, value): DateTime
```

Retorna um novo `DateTime` com um ou mais campos de calendário ou de relógio substituídos no fuso horário atual. Datas fora do intervalo válido, como 30 de fevereiro, lançam um `RangeError` em vez de avançar para o mês seguinte. Atualizar `month` ou `year` sem informar `day` limita o dia excedente ao último dia do mês de destino.

**Parâmetros**

```params
- name: fields
  type: DateTimeFields | Unit
  required: true
  description: Objeto com campos de calendário ou de relógio, ou o nome de uma única unidade ao passar `value`.
- name: value
  type: number
  description: Valor inteiro para a unidade `unit` informada.
```

**Retorno**

```returns
type: DateTime
description: Novo `DateTime` no mesmo fuso horário com os campos atualizados.
```

```js
const cutoff = datetime('2026-11-16T09:30', 'America/New_York');

cutoff.set('hour', 17);
cutoff.set({ month: 12, day: 1, hour: 0, minute: 0 });
```
:::

## Aritmética e arredondamento

Somar dias, semanas, meses ou anos mantém a mesma hora do dia nas transições de horário de verão. Somar horas, minutos ou segundos conta o tempo exato decorrido.

:::entry
### `plus()` :kind[method]

```js signature
dt.plus(amount, unit?): DateTime
dt.add(amount, unit?): DateTime
```

Soma uma duração a este instante e retorna um novo `DateTime` no mesmo fuso horário. Também disponível pelo alias `add()`.

**Parâmetros**

```params
- name: amount
  type: DurationInput
  required: true
  description: Contagem combinada com `unit`, instância de `Duration`, string de duração em inglês ou ISO, objeto de campos ou milissegundos.
- name: unit
  type: Unit
  description: Nome da unidade em inglês quando `amount` é numérico, como `'days'` ou `'hours'`.
```

**Retorno**

```returns
type: DateTime
description: Novo `DateTime` no mesmo fuso horário.
```

```js
// Fim de semana de início do horário de verão em Nova York (8 de março tem 23 horas)
const sat = datetime('2026-03-07T09:00', 'America/New_York');

sat.plus(1, 'day').hour; // 9
sat.plus(24, 'hours').hour; // 10
sat.plus('1h 30m').format('time', 'en-US'); // '10:30 AM'
```
:::

:::entry
### `minus()` :kind[method]

```js signature
dt.minus(amount, unit?): DateTime
dt.subtract(amount, unit?): DateTime
```

Subtrai uma duração deste instante no mesmo fuso horário. Aceita as mesmas entradas que [`plus()`](#plus) e também está disponível pelo alias `subtract()`.

**Parâmetros**

```params
- name: amount
  type: DurationInput
  required: true
  description: Contagem numérica combinada com `unit`, `Duration`, expressão de duração em inglês, duração ISO ou objeto de campos.
- name: unit
  type: Unit
  description: Nome da unidade em inglês quando `amount` é numérico.
```

**Retorno**

```returns
type: DateTime
description: Novo `DateTime` no mesmo fuso horário.
```

```js
const deadline = datetime('2026-11-16T17:00', 'America/New_York');

deadline.minus(48, 'hours');
deadline.minus({ weeks: 1, days: 2 });
```
:::

:::entry
### `startOf()` :kind[method]

```js signature
dt.startOf(unit, firstDay?): DateTime
```

Recua para o início de uma unidade de calendário ou de relógio neste fuso horário. Os limites de semana começam em `firstDay`, no `weekStart` configurado em [`configure()`](/api/configure/) ou no locale ativo deste instante.

**Parâmetros**

```params
- name: unit
  type: Unit
  required: true
  description: Unidade de calendário ou de relógio, de `'year'` até `'millisecond'`.
- name: firstDay
  type: DayOfWeek
  description: Primeiro dia da semana ao alinhar por semana, usando nome em inglês como `'sunday'` ou número ISO como `7`.
```

**Retorno**

```returns
type: DateTime
description: Novo `DateTime` no início de `unit`.
```

```js
const wed = datetime('2026-11-18T14:45:12', 'America/New_York').locale('en-US');

wed.startOf('day').format('time'); // '12:00 AM'
wed.startOf('week').day; // 15
wed.startOf('week', 'monday').day; // 16
```
:::

:::entry
### `endOf()` :kind[method]

```js signature
dt.endOf(unit, firstDay?): DateTime
```

Avança até o último milissegundo de uma unidade de calendário ou de relógio neste fuso horário.

**Parâmetros**

```params
- name: unit
  type: Unit
  required: true
  description: Unidade de calendário ou de relógio, de `'year'` até `'nanosecond'`.
- name: firstDay
  type: DayOfWeek
  description: Primeiro dia da semana quando `unit` for `'week'`.
```

**Retorno**

```returns
type: DateTime
description: Novo `DateTime` no último milissegundo de `unit`.
```

```js
const nov = datetime('2026-11-18T14:45', 'UTC');

nov.endOf('month').toString(); // '2026-11-30T23:59:59.999Z'
```
:::

:::entry
### `startOfNext()` :kind[method]

```js signature
dt.startOfNext(unit, firstDay?): DateTime
```

Avança para o início da unidade de calendário ou de relógio seguinte à que contém este instante, neste fuso horário. O resultado é sempre um instante posterior: a partir da meia-noite, o dia seguinte começa na próxima meia-noite.

Passe um nome de dia da semana em inglês no lugar da unidade para obter o início do próximo dia com esse nome. Chamar [`next()`](#next) encontra o mesmo dia preservando a hora do dia.

**Parâmetros**

```params
- name: unit
  type: Unit | Exclude<DayOfWeek, number>
  required: true
  description: Unidade de calendário ou de relógio, de `'year'` até `'nanosecond'`, ou nome de dia da semana em inglês, como `'wednesday'`.
- name: firstDay
  type: DayOfWeek
  description: Primeiro dia da semana quando `unit` for `'week'`.
```

**Retorno**

```returns
type: DateTime
description: Novo `DateTime` no início da próxima unidade `unit` ou do próximo dia da semana informado.
```

```js
const standup = datetime('2026-11-16T09:30', 'America/New_York');

standup.startOfNext('month').text; // 'Dec 1, 2026, 12:00 AM EST'
standup.startOfNext('hour').text; // 'Nov 16, 2026, 10:00 AM EST'
standup.startOfNext('wednesday').text; // 'Nov 18, 2026, 12:00 AM EST'
standup.next('wednesday').text; // 'Nov 18, 2026, 9:30 AM EST'
```
:::

:::entry
### `startOfPrevious()` :kind[method]

```js signature
dt.startOfPrevious(unit, firstDay?): DateTime
```

Recua para o início da unidade de calendário ou de relógio anterior à que contém este instante, neste fuso horário. Passar um nome de dia da semana em inglês no lugar da unidade retorna o início do dia anterior com esse nome, enquanto [`previous()`](#previous) preserva a hora do dia.

**Parâmetros**

```params
- name: unit
  type: Unit | Exclude<DayOfWeek, number>
  required: true
  description: Unidade de calendário ou de relógio, de `'year'` até `'nanosecond'`, ou nome de dia da semana em inglês, como `'wednesday'`.
- name: firstDay
  type: DayOfWeek
  description: Primeiro dia da semana quando `unit` for `'week'`.
```

**Retorno**

```returns
type: DateTime
description: Novo `DateTime` no início da unidade `unit` anterior ou do dia da semana anterior informado.
```

```js
const standup = datetime('2026-11-16T09:30', 'America/New_York');

standup.startOfPrevious('day').text; // 'Nov 15, 2026, 12:00 AM EST'
standup.startOfPrevious('month').text; // 'Oct 1, 2026, 12:00 AM EDT'
standup.startOfPrevious('wednesday').text; // 'Nov 11, 2026, 12:00 AM EST'
```
:::

:::entry
### `next()` :kind[method]

```js signature
dt.next(target): DateTime
```

Avança para o próximo dia da semana ou [`MonthDay`](/api/month-day/) informado, mantendo a mesma hora do dia. Se o instante já cair nesse dia da semana ou nessa data anual, ele avança para a ocorrência seguinte.

**Parâmetros**

```params
- name: target
  type: DayOfWeek | MonthDay
  required: true
  description: Nome de dia da semana em inglês, como `'friday'`, número ISO de 1 a 7 ou `MonthDay` recorrente.
```

**Retorno**

```returns
type: DateTime
description: Novo `DateTime` na próxima data correspondente com o mesmo horário local.
```

```js
import { datetime, monthDay } from 'native-dates';

const mon = datetime('2026-11-16T09:30', 'America/Los_Angeles');

mon.next('friday').day; // 20
mon.next('monday').day; // 23
mon.next(monthDay('12-25')).month; // 12
```
:::

:::entry
### `previous()` :kind[method]

```js signature
dt.previous(target): DateTime
```

Recua para a ocorrência mais recente do dia da semana ou do [`MonthDay`](/api/month-day/) anterior a esta data, mantendo a mesma hora do dia.

**Parâmetros**

```params
- name: target
  type: DayOfWeek | MonthDay
  required: true
  description: Nome de dia da semana em inglês, prefixo de três letras em inglês, número ISO de 1 a 7 ou `MonthDay` recorrente.
```

**Retorno**

```returns
type: DateTime
description: Novo `DateTime` na data anterior correspondente com o mesmo horário local.
```

```js
const mon = datetime('2026-11-16T09:30', 'America/Los_Angeles');

mon.previous('friday').day; // 13
mon.previous(monthDay('10-31')).month; // 10
```
:::

:::entry
### `round()` :kind[method]

```js signature
dt.round(unit): DateTime
dt.round(increment, unit): DateTime
```

Arredonda para a unidade ou o incremento mais próximo, desempatando valores exatamente no meio para cima.

**Parâmetros**

```params
- name: increment
  type: number | Unit
  required: true
  description: Tamanho do passo que divide exatamente a unidade superior, ou a própria `unit` ao arredondar para `1`.
- name: unit
  type: Unit
  description: Unidade a arredondar, de `'day'` até `'nanosecond'`.
```

**Retorno**

```returns
type: DateTime
description: Novo `DateTime` arredondado no mesmo fuso horário.
```

```js
const stamp = datetime('2026-11-16T09:23:40', 'UTC');

stamp.round('hour').toString(); // '2026-11-16T09:00:00.000Z'
stamp.round(15, 'minutes').toString(); // '2026-11-16T09:30:00.000Z'
```
:::

:::entry
### `floor()` :kind[method]

```js signature
dt.floor(unit): DateTime
dt.floor(increment, unit): DateTime
```

Arredonda para baixo até o início de uma unidade ou incremento. Aceita os mesmos argumentos que [`round()`](#round).

```js
datetime('2026-11-16T09:29:00Z').floor(15, 'minutes').toString(); // '2026-11-16T09:15:00.000Z'
```
:::

:::entry
### `ceil()` :kind[method]

```js signature
dt.ceil(unit): DateTime
dt.ceil(increment, unit): DateTime
```

Arredonda para cima até a próxima unidade ou incremento. Aceita os mesmos argumentos que [`round()`](#round).

```js
datetime('2026-11-16T09:01:00Z').ceil(15, 'minutes').toString(); // '2026-11-16T09:15:00.000Z'
```
:::

## Comparação de instantes

As comparações verificam quando cada instante ocorreu, mesmo que os dois valores estejam em fusos horários diferentes.

:::warning[Comparação com ===]
O operador `===` do JavaScript verifica se duas variáveis apontam para o mesmo objeto em memória. Chame [`equals()`](#equals) para conferir se duas instâncias de `DateTime` representam o mesmo instante.
:::

:::entry
### `equals()` :kind[method]

```js signature
dt.equals(other): boolean
```

Retorna `true` quando ambos os valores representam exatamente o mesmo instante, independentemente de seus fusos horários.

**Parâmetros**

```params
- name: other
  type: DateTimeInput
  required: true
  description: Outro `DateTime` ou qualquer entrada aceita por `datetime()`.
```

**Retorno**

```returns
type: boolean
description: "`true` quando ambos os valores apontam para o mesmo instante."
```

```js
const ny = datetime('2026-11-16T12:00', 'America/New_York');
const utc = datetime('2026-11-16T17:00Z', 'UTC');

ny.equals(utc); // true
```
:::

:::entry
### `isBefore()` :kind[method]

```js signature
dt.isBefore(other): boolean
```

Retorna `true` se este instante for anterior ao outro.

```js
datetime('2026-11-16T16:59Z').isBefore('2026-11-16T17:00Z'); // true
```
:::

:::entry
### `isAfter()` :kind[method]

```js signature
dt.isAfter(other): boolean
```

Retorna `true` se este instante for posterior ao outro.

```js
datetime('2026-11-16T17:01Z').isAfter('2026-11-16T17:00Z'); // true
```
:::

:::entry
### `isSame()` :kind[method]

```js signature
dt.isSame(other, unit?, firstDay?): boolean
```

Verifica se outro instante cai na mesma unidade de calendário ou de relógio quando ambos são vistos no fuso horário desta instância. Chamar `isSame()` sem unidade verifica igualdade exata de instante.

**Parâmetros**

```params
- name: other
  type: DateTimeInput
  required: true
  description: Instante de comparação, visto no fuso horário desta instância.
- name: unit
  type: Unit
  description: Unidade de calendário ou de relógio a comparar, como `'day'` ou `'month'`.
- name: firstDay
  type: DayOfWeek
  description: Primeiro dia da semana quando `unit` for `'week'`.
```

**Retorno**

```returns
type: boolean
description: "`true` quando ambos os instantes caem na mesma unidade `unit` neste fuso horário."
```

```js
const la = datetime('2026-11-16T09:30', 'America/Los_Angeles');
const lateUtc = datetime('2026-11-17T02:00Z', 'UTC');

la.isSame(lateUtc, 'day'); // true (18h de 16 de nov. em Los Angeles)
lateUtc.isSame(la, 'day'); // false (17 de nov. vs. 16 de nov. em UTC)
```
:::

### Predicados de calendário

Verificações sem argumentos avaliadas no fuso horário da instância:

| Método | Tipo | Descrição |
|---|---|---|
| `isPast()`, `isFuture()` | `boolean` | Se este instante é anterior ou posterior ao instante atual. |
| `isToday()`, `isTomorrow()`, `isYesterday()` | `boolean` | Se a data de calendário local corresponde a hoje, amanhã ou ontem neste fuso horário. |
| `isWeekday()`, `isWeekend()` | `boolean` | Dia útil ou fim de semana no locale ativo, como sábado e domingo em `en-US` ou sexta e sábado em `ar-SA`. |
| `isLeapYear()` | `boolean` | Se o ano local é bissexto. |

## Medição de tempo

:::entry
### `until()` :kind[method]

```js signature
dt.until(other): Duration
dt.until(other, unit): number
```

Mede o tempo deste instante até outro, retornando uma duração negativa quando o destino é anterior. Passe o nome de uma unidade para obter o total como um número em vez de uma [`Duration`](/api/duration/).

**Parâmetros**

```params
- name: other
  type: DateTimeInput
  required: true
  description: Instante de destino até o qual medir.
- name: unit
  type: Unit
  description: Unidade usada para retornar o total como número de ponto flutuante.
```

**Retorno**

```returns
type: Duration | number
description: Uma `Duration` contada em dias e unidades de relógio, ou um número quando `unit` é informada.
```

```js
const doors = datetime('2026-11-16T08:00', 'America/Los_Angeles');
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

doors.until(standup).format('long', 'en-US'); // '1 hour, 30 minutes'
doors.until(standup, 'hours'); // 1.5
```
:::

:::entry
### `since()` :kind[method]

```js signature
dt.since(other): Duration
dt.since(other, unit): number
```

Mede o tempo decorrido desde um instante anterior. Passe o nome de uma unidade para obter o total como número.

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.since('2026-11-16T08:00', 'minutes'); // 90
```
:::

:::entry
### `to()` :kind[method]

```js signature
dt.to(end): DateTimeRange
dt.to(count, unit): DateTimeRange
dt.for(length): DateTimeRange
dt.for(count, unit): DateTimeRange
```

Cria um [`DateTimeRange`](/api/ranges/#datetimerange) semiaberto que começa neste instante e vai até o instante final ou o fim da duração decorrida (limite final exclusivo). Lança um `RangeError` se o fim for anterior ao início. Use `for()` para informar uma duração explícita (instantes finais e números sem unidade são recusados).

**Parâmetros**

```params
- name: end
  type: DateTimeInput | DurationInput | number
  required: true
  description: Instante final (exclusivo), duração ou contagem numérica `count` combinada com `unit`.
- name: unit
  type: Unit
  description: Nome da unidade em inglês quando o primeiro argumento é uma contagem numérica, como `'hours'` ou `'days'`.
```

**Retorno**

```returns
type: DateTimeRange
description: Um `DateTimeRange` semiaberto no fuso horário desta instância.
```

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.to('2026-11-16T10:00').duration.minutes; // 30
standup.for(2, 'hours').end.hour; // 11
```
:::

:::entry
### `range()` :kind[method]

```js signature
dt.range(unit, firstDay?): DateTimeRange
```

Retorna o [`DateTimeRange`](/api/ranges/#datetimerange) semiaberto da unidade de calendário ou de relógio que contém este instante, do início da unidade até o início da unidade seguinte (exclusivo).

**Parâmetros**

```params
- name: unit
  type: Unit
  required: true
  description: Unidade de calendário ou de relógio, de `'year'` até `'nanosecond'`.
- name: firstDay
  type: DayOfWeek
  description: Primeiro dia da semana quando `unit` for `'week'`.
```

**Retorno**

```returns
type: DateTimeRange
description: Um `DateTimeRange` semiaberto que abrange `unit` neste fuso horário.
```

```js
const event = datetime('2026-11-16T14:45', 'UTC');

event.range('day').toString();
// '2026-11-16T00:00:00.000Z/2026-11-17T00:00:00.000Z'
```
:::

## Formatação e conversão

:::entry
### `format()` :kind[method]

```js signature
dt.format(spec?, locale?): string
```

Formata a data e a hora no fuso horário ativo usando presets integrados, nomes personalizados de [`configure()`](/api/configure/), objetos de opções `Intl` ou padrões de tokens.

Os presets localizados de `'LT'` a `'llll'` já vêm integrados, junto com `[colchetes]` para texto literal. Consulte [Formatação](/guides/formatting/) para a referência completa de presets e tokens.

**Parâmetros**

```params
- name: spec
  type: FormatSpec
  default: "'medium'"
  description: Nome de formato integrado ou configurado, objeto de opções `Intl` ou padrão de tokens.
- name: locale
  type: string
  description: Tag de locale BCP 47 que sobrescreve o locale deste instante ou o padrão configurado apenas nesta chamada.
```

**Retorno**

```returns
type: string
description: String formatada no fuso horário da instância.
```

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.format('medium', 'en-US'); // 'Nov 16, 2026, 9:30 AM'
standup.format('full', 'en-US'); // 'Monday, November 16, 2026 at 9:30 AM'
standup.format('LLL', 'en-US'); // 'November 16, 2026 at 9:30 AM'
standup.format('text', 'en-US'); // 'Nov 16, 2026, 9:30 AM PST'
standup.format('YYYY-MM-DD HH:mm'); // '2026-11-16 09:30'
standup.format('MMM D [at] h:mm a', 'en-US'); // 'Nov 16 at 9:30 am'
standup.format(
  { weekday: 'short', hour: '2-digit', minute: '2-digit' },
  'de-DE',
); // 'Mo., 09:30'
```
:::

:::entry
### `from()` :kind[method]

```js signature
dt.from(other?, locale?): string
dt.formatRelative(other?, locale?): string
```

Formata o tempo decorrido entre outro instante e este como uma expressão localizada via `Intl.RelativeTimeFormat`, como “há 3 horas” ou “em 2 dias”.

Omitir o primeiro argumento compara com o instante atual, e [`formatRelative()`](#formatrelative) funciona como alias. Zero segundos produz o termo localizado para agora (como “agora” em `pt-BR` ou `'now'` em `en-US`), enquanto dias, meses e anos usam contagens numéricas em vez de palavras de calendário como “ontem”.

**Parâmetros**

```params
- name: other
  type: DateTimeInput
  description: Instante de referência a partir do qual medir, interpretado no fuso horário desta instância quando não informar fuso horário. Por padrão, o instante atual.
- name: locale
  type: Locale
  description: Tag de locale BCP 47 que sobrescreve o locale deste instante ou o padrão configurado apenas nesta chamada.
```

**Retorno**

```returns
type: string
description: Expressão localizada de tempo relativo.
```

```js
const anchor = datetime('2026-11-16T12:00', 'UTC');

anchor.from(anchor, 'en-US'); // 'now'
anchor.minus(3, 'hours').from(anchor, 'en-US'); // '3 hours ago'
anchor.minus(23, 'hours').from(anchor, 'en-US'); // '1 day ago'
anchor.plus(45, 'minutes').from(anchor, 'en-US'); // 'in 1 hour'
anchor.minus(3, 'hours').from(anchor, 'es'); // 'hace 3 horas'
```
:::

:::entry
### `fromNow()` :kind[method]

```js signature
dt.fromNow(locale?): string
```

Formata quanto tempo falta ou se passou em relação a agora como uma expressão localizada, equivalente a chamar [`from()`](#from) sem instante de referência.

**Parâmetros**

```params
- name: locale
  type: Locale
  description: Tag de locale BCP 47 que sobrescreve o locale deste instante ou o padrão configurado apenas nesta chamada.
```

**Retorno**

```returns
type: string
description: Expressão localizada de tempo relativo medida a partir de agora.
```

```js
now().minus(5, 'minutes').fromNow('en-US'); // '5 minutes ago'
now().plus(2, 'hours').fromNow('en-US'); // 'in 2 hours'
```
:::

:::entry
### `formatRelative()` :kind[method]

```js signature
dt.formatRelative(other?, locale?): string
```

Alias de [`from()`](#from) que formata como expressão localizada o tempo decorrido desde `other`, ou desde agora quando omitido.
:::

:::entry
### `locale()` :kind[method]

```js signature
dt.locale(): Locale | undefined
dt.locale(tag): DateTime
```

Lê o locale associado a este instante ou retorna uma cópia que formata e inicia semanas em outro locale nos presets, nos limites de semana e nos valores derivados. Tags com sublinhado e cabeçalhos `Accept-Language` são normalizados automaticamente, uma tag vazia remove o locale e [`lang()`](#lang) funciona como alias.

**Parâmetros**

```params
- name: tag
  type: Locale | null | undefined
  description: Tag de locale, array de tags ou cabeçalho `Accept-Language` a propagar, ou `null` para limpar o valor atual.
```

**Retorno**

```returns
type: DateTime | Locale | undefined
description: Tag ativa ao chamar sem argumentos, ou um novo `DateTime` com `tag`.
```

```js
const standup = datetime('2026-11-16T09:30', 'Europe/Berlin').locale('es-ES');

standup.locale(); // 'es-ES'
standup.plus(1, 'week').date.format('long'); // '23 de noviembre de 2026'
standup.locale(null).locale(); // undefined
```
:::

:::entry
### `lang()` :kind[method]

```js signature
dt.lang(): Locale | undefined
dt.lang(tag): DateTime
```

Alias curto de [`locale()`](#locale) que lê ou associa uma tag de locale BCP 47 a este instante.
:::

:::entry
### `as()` :kind[method]

```js signature
dt.as('datetime'): DateTime
dt.as('date'): CalendarDate
dt.as('time'): Time
dt.as('yearMonth'): YearMonth
dt.as('monthDay'): MonthDay
```

Converte este instante para outro tipo dentro de um encadeamento de métodos sem interromper a cadeia para acessar propriedades, incluindo valores [`YearMonth`](/api/year-month/) e [`MonthDay`](/api/month-day/) no fuso horário ativo.

**Parâmetros**

```params
- name: kind
  type: "'datetime' | 'date' | 'time' | 'yearMonth' | 'monthDay'"
  required: true
  description: Tipo de destino para converter este instante em seu fuso horário ativo.
```

**Retorno**

```returns
type: DateTime | CalendarDate | Time | YearMonth | MonthDay
description: Valor convertido no fuso horário desta instância.
```

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.in('Asia/Tokyo').as('date').toString(); // '2026-11-17'
standup.in('Asia/Tokyo').as('time').toString(); // '02:30:00'
standup.as('yearMonth').toString(); // '2026-11'
standup.as('monthDay').toString(); // '11-16'
```
:::

:::entry
### `toString()` :kind[method]

```js signature
dt.toString(): string
dt.toJSON(): string
```

Retorna o instante como uma string ISO 8601 em UTC, pronta para bancos de dados, URLs e payloads de rede. `toJSON()` retorna a mesma string para `JSON.stringify()`.

**Retorno**

```returns
type: string
description: Timestamp ISO 8601 em UTC, como `'2026-11-16T17:30:00.000Z'`.
```

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.toString(); // '2026-11-16T17:30:00.000Z'
JSON.stringify({ standup }); // '{"standup":"2026-11-16T17:30:00.000Z"}'
```
:::

:::entry
### `toJSDate()` :kind[method]

```js signature
dt.toJSDate(): Date
```

Retorna um `Date` nativo do JavaScript para o mesmo instante.
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
dt.toTemporal(): Temporal.ZonedDateTime
```

Retorna a instância subjacente de `Temporal.ZonedDateTime`.
:::

:::entry
### `valueOf()` :kind[method]

```js signature
dt.valueOf(): number
```

Retorna os milissegundos desde a época Unix para permitir subtrair ou comparar dois valores `DateTime` com operadores numéricos.
:::
