---
source: "df57e2243cc3"
title: CalendarDate
lede: Uma data de calendário sem horário e sem fuso horário.
---

## Criar uma CalendarDate

Crie uma instância a partir de uma string ISO, números de ano, mês e dia ou um valor existente com [`date()`](/api/date-fn/), ou obtenha o dia atual com [`today()`](/api/date-fn/#today). Os auxiliares [`tomorrow()`](/api/date-fn/#tomorrow) e [`yesterday()`](/api/date-fn/#yesterday) funcionam da mesma maneira, e todo método retorna uma nova instância imutável.

```js title="create.js"
import { date, today, tomorrow } from 'native-dates';

const birthday = date('2026-05-10');
const launch = date(2026, 11, 16);
const current = today();
const nextDay = tomorrow('America/New_York');
```

Como uma data de calendário não possui relógio nem fuso horário, 10 de maio continua sendo 10 de maio para qualquer usuário, onde quer que ele esteja. Você também pode extrair a data de calendário local de qualquer [`DateTime`](/api/date-time/):

```js
import { datetime } from 'native-dates';

const flight = datetime('2026-11-16T23:30:00Z', 'Asia/Tokyo');
flight.date.toString(); // '2026-11-17'
```

## Propriedades

As propriedades leem os campos ISO do calendário diretamente.

| Propriedade | Tipo | Descrição |
|---|---|---|
| `text` | `string` | Data de calendário formatada no locale ativo, como `'Nov 16, 2026'`. |
| `year`, `month`, `day` | `number` | Ano do calendário, mês (1–12) e dia do mês (1–31). |
| `yearMonth` | [`YearMonth`](/api/year-month/) | Ano e mês do calendário sem o dia. |
| `monthDay` | [`MonthDay`](/api/month-day/) | Mês e dia do calendário sem o ano. |
| `dayOfWeek` | `number` | Dia ISO da semana, de 1 para segunda-feira até 7 para domingo. |
| `weekStart` | `number` | Primeiro dia das semanas desta data, de 1 a 7, seguindo [`configure()`](/api/configure/) ou o seu locale. |
| `quarter` | `number` | Trimestre do calendário (1–4). |
| `weekOfYear`, `dayOfYear` | `number` | Número da semana ISO (1–53) e dia do ano (1–366). |
| `daysInMonth`, `daysInYear` | `number` | Quantidade de dias no mês atual (28–31) e no ano atual (365 ou 366). |

## Combinação e campos

Associe uma hora do dia em um fuso horário para criar um instante específico ou substitua campos individuais do calendário.

:::entry
### `at()` :kind[method]

```js signature
d.at(time?, zone?): DateTime
```

Combina esta data de calendário com uma hora do dia em um fuso horário e retorna um [`DateTime`](/api/date-time/). Omitir o horário usa a meia-noite no início do dia.

**Parâmetros**

```params
- name: time
  type: TimeInput
  default: "'00:00'"
  description: String de horário como `'9:30am'`, instância de `Time`, objeto de campos ou `Date`.
- name: zone
  type: Zone
  description: Nome de fuso horário IANA, deslocamento UTC fixo ou `'UTC'`. Por padrão, o fuso horário configurado.
```

**Retorno**

```returns
type: DateTime
description: Novo `DateTime` nesta data, no horário `time`, em `zone`.
```

```js
const day = date('2026-11-16');

day.at('9:30am', 'America/Los_Angeles').toString(); // '2026-11-16T17:30:00.000Z'
day.at(undefined, 'UTC').toString(); // '2026-11-16T00:00:00.000Z'
```
:::

:::entry
### `set()` :kind[method]

```js signature
d.set(fields): CalendarDate
d.set(unit, value): CalendarDate
```

Retorna uma nova `CalendarDate` com um ou mais campos do calendário substituídos. Datas fora do intervalo válido, como 30 de fevereiro, lançam um `RangeError` em vez de avançar para o mês seguinte. Atualizar `month` ou `year` sem informar `day` limita o dia excedente ao último dia do mês de destino.

**Parâmetros**

```params
- name: fields
  type: DateTimeFields | DateUnit
  required: true
  description: Objeto com campos `year`, `month` ou `day`, ou o nome de uma única unidade.
- name: value
  type: number
  description: Valor inteiro para a unidade `unit` informada.
```

**Retorno**

```returns
type: CalendarDate
description: Nova `CalendarDate` com os campos do calendário atualizados.
```

```js
const due = date('2026-11-16');

due.set('day', 1).toString(); // '2026-11-01'
due.set({ month: 12, day: 31 }).toString(); // '2026-12-31'
```
:::

## Aritmética e limites

Avance ou recue em unidades de calendário, alinhe a limites de período ou vá para um dia da semana próximo. Unidades de relógio como horas e minutos lançam um `RangeError`, pois uma data de calendário não tem relógio.

:::note[Limitação ao fim do mês]
Somar meses ou anos ajusta o dia ao último dia válido do mês de destino em vez de estourar para o mês seguinte. Somar um mês a 31 de janeiro resulta em 28 de fevereiro, ou 29 de fevereiro em anos bissextos.
:::

:::entry
### `plus()` :kind[method]

```js signature
d.plus(amount, unit?): CalendarDate
d.add(amount, unit?): CalendarDate
```

Soma anos, trimestres, meses, semanas ou dias e retorna uma nova `CalendarDate`. Também disponível pelo alias `add()`.

**Parâmetros**

```params
- name: amount
  type: DurationInput
  required: true
  description: Contagem combinada com `unit`, instância de `Duration`, string de duração em inglês ou ISO, ou objeto de campos.
- name: unit
  type: DateUnit
  description: Nome da unidade de calendário em inglês quando `amount` é numérico, como `'days'` ou `'months'`.
```

**Retorno**

```returns
type: CalendarDate
description: Nova `CalendarDate` avançada no calendário.
```

```js
const billing = date('2026-01-31');

billing.plus(1, 'month').toString(); // '2026-02-28'
billing.plus('2 weeks').toString(); // '2026-02-14'
```
:::

:::entry
### `minus()` :kind[method]

```js signature
d.minus(amount, unit?): CalendarDate
d.subtract(amount, unit?): CalendarDate
```

Subtrai uma duração de calendário. Aceita as mesmas entradas que [`plus()`](#plus) e também está disponível pelo alias `subtract()`.

**Parâmetros**

```params
- name: amount
  type: DurationInput
  required: true
  description: Contagem combinada com `unit`, instância de `Duration`, string de duração em inglês ou ISO, ou objeto de campos.
- name: unit
  type: DateUnit
  description: Nome da unidade de calendário em inglês quando `amount` é numérico.
```

**Retorno**

```returns
type: CalendarDate
description: Nova `CalendarDate` recuada no calendário.
```

```js
const launch = date('2026-03-01');

launch.minus(1, 'day').toString(); // '2026-02-28'
launch.minus({ weeks: 2, days: 1 }).toString(); // '2026-02-14'
```
:::

:::entry
### `startOf()` :kind[method]

```js signature
d.startOf(unit, firstDay?): CalendarDate
```

Retorna o primeiro dia da unidade de calendário que contém esta data. Os limites de semana começam em `firstDay`, no `weekStart` configurado em [`configure()`](/api/configure/) ou no locale ativo desta data.

**Parâmetros**

```params
- name: unit
  type: DateUnit
  required: true
  description: Unidade de calendário, de `'year'` até `'day'`.
- name: firstDay
  type: DayOfWeek
  description: Primeiro dia da semana ao alinhar por semana, usando nome em inglês como `'sunday'` ou número ISO como `7`.
```

**Retorno**

```returns
type: CalendarDate
description: Primeiro dia de calendário de `unit`.
```

```js
const wed = date('2026-11-18', { locale: 'en-US' });

wed.startOf('month').toString(); // '2026-11-01'
wed.startOf('quarter').toString(); // '2026-10-01'
wed.startOf('week').toString(); // '2026-11-15'
wed.startOf('week', 'monday').toString(); // '2026-11-16'
```
:::

:::entry
### `endOf()` :kind[method]

```js signature
d.endOf(unit, firstDay?): CalendarDate
```

Retorna o último dia da unidade de calendário que contém esta data.

**Parâmetros**

```params
- name: unit
  type: DateUnit
  required: true
  description: Unidade de calendário, de `'year'` até `'day'`.
- name: firstDay
  type: DayOfWeek
  description: Primeiro dia da semana quando `unit` for `'week'`.
```

**Retorno**

```returns
type: CalendarDate
description: Último dia de calendário de `unit`.
```

```js
date('2026-02-10').endOf('month').toString(); // '2026-02-28'
date('2028-02-10').endOf('month').toString(); // '2028-02-29'
```
:::

:::entry
### `startOfNext()` :kind[method]

```js signature
d.startOfNext(unit, firstDay?): CalendarDate
```

Retorna o primeiro dia da unidade de calendário seguinte à que contém esta data. O resultado é sempre uma data posterior: a partir de 1º de dezembro, o mês seguinte começa em 1º de janeiro.

Passe um nome de dia da semana em inglês no lugar da unidade para obter o próximo dia com esse nome, o mesmo resultado retornado por [`next()`](#next).

**Parâmetros**

```params
- name: unit
  type: DateUnit | Exclude<DayOfWeek, number>
  required: true
  description: Unidade de calendário, de `'year'` até `'day'`, ou nome de dia da semana em inglês, como `'wednesday'`.
- name: firstDay
  type: DayOfWeek
  description: Primeiro dia da semana quando `unit` for `'week'`.
```

**Retorno**

```returns
type: CalendarDate
description: Primeiro dia de calendário da próxima unidade `unit` ou o próximo dia da semana informado.
```

```js
const mon = date('2026-11-16', { locale: 'en-US' });

mon.startOfNext('month').toString(); // '2026-12-01'
mon.startOfNext('quarter').toString(); // '2027-01-01'
mon.startOfNext('week').toString(); // '2026-11-22'
mon.startOfNext('wednesday').toString(); // '2026-11-18'
```
:::

:::entry
### `startOfPrevious()` :kind[method]

```js signature
d.startOfPrevious(unit, firstDay?): CalendarDate
```

Retorna o primeiro dia da unidade de calendário anterior à que contém esta data. Passar um nome de dia da semana em inglês no lugar da unidade retorna o dia anterior mais recente com esse nome, assim como [`previous()`](#previous).

**Parâmetros**

```params
- name: unit
  type: DateUnit | Exclude<DayOfWeek, number>
  required: true
  description: Unidade de calendário, de `'year'` até `'day'`, ou nome de dia da semana em inglês, como `'wednesday'`.
- name: firstDay
  type: DayOfWeek
  description: Primeiro dia da semana quando `unit` for `'week'`.
```

**Retorno**

```returns
type: CalendarDate
description: Primeiro dia de calendário da unidade `unit` anterior ou o dia da semana anterior informado.
```

```js
const mon = date('2026-11-16');

mon.startOfPrevious('month').toString(); // '2026-10-01'
mon.startOfPrevious('year').toString(); // '2025-01-01'
mon.startOfPrevious('wednesday').toString(); // '2026-11-11'
```
:::

:::entry
### `next()` :kind[method]

```js signature
d.next(target): CalendarDate
```

Avança para o próximo dia da semana ou [`MonthDay`](/api/month-day/) posterior a esta data. Se já estiver nesse dia da semana ou nessa data anual, avança para a ocorrência seguinte.

**Parâmetros**

```params
- name: target
  type: DayOfWeek | MonthDay
  required: true
  description: Nome de dia da semana em inglês, como `'friday'`, número ISO de 1 a 7 ou `MonthDay` recorrente.
```

**Retorno**

```returns
type: CalendarDate
description: Nova `CalendarDate` no próximo dia correspondente.
```

```js
import { date, monthDay } from 'native-dates';

const mon = date('2026-11-16');

mon.next('friday').toString(); // '2026-11-20'
mon.next('monday').toString(); // '2026-11-23'
mon.next(monthDay('12-25')).toString(); // '2026-12-25'
```
:::

:::entry
### `previous()` :kind[method]

```js signature
d.previous(target): CalendarDate
```

Recua para o dia da semana ou [`MonthDay`](/api/month-day/) mais recente antes desta data. Se já estiver nesse dia da semana ou nessa data anual, recua para a ocorrência anterior.

**Parâmetros**

```params
- name: target
  type: DayOfWeek | MonthDay
  required: true
  description: Nome de dia da semana em inglês, prefixo de três letras em inglês, número ISO de 1 a 7 ou `MonthDay` recorrente.
```

**Retorno**

```returns
type: CalendarDate
description: Nova `CalendarDate` no dia anterior correspondente.
```

```js
date('2026-11-16').previous('friday').toString(); // '2026-11-13'
date('2026-11-16').previous(monthDay('10-31')).toString(); // '2026-10-31'
```
:::

## Comparação de datas

Compare datas de calendário diretamente ou passe qualquer entrada aceita por [`date()`](/api/date-fn/).

:::warning[Evite operadores de comparação numérica]
Uma data de calendário não é um timestamp, por isso operadores numéricos lançam um `RangeError` em vez de converter para milissegundos. Compare datas com métodos como [`isBefore()`](#isbefore) ou ordene arrays com [`compare()`](/api/compare/).
:::

:::entry
### `equals()` :kind[method]

```js signature
d.equals(other): boolean
```

Retorna `true` quando ambos os valores representam o mesmo ano, mês e dia no calendário.

**Parâmetros**

```params
- name: other
  type: CalendarDateInput
  required: true
  description: Outra `CalendarDate` ou qualquer entrada aceita por `date()`.
```

**Retorno**

```returns
type: boolean
description: "`true` quando ambos os valores representam o mesmo dia de calendário."
```

```js
const due = date('2026-11-16');

due.equals('2026-11-16'); // true
due.equals(date(2026, 11, 16)); // true
```
:::

:::entry
### `isBefore()` :kind[method]

```js signature
d.isBefore(other): boolean
```

Retorna `true` se esta data for anterior à outra no calendário.

```js
date('2026-11-15').isBefore('2026-11-16'); // true
```
:::

:::entry
### `isAfter()` :kind[method]

```js signature
d.isAfter(other): boolean
```

Retorna `true` se esta data for posterior à outra no calendário.

```js
date('2026-11-17').isAfter('2026-11-16'); // true
```
:::

:::entry
### `isSame()` :kind[method]

```js signature
d.isSame(other, unit?, firstDay?): boolean
```

Verifica se outra data cai na mesma unidade de calendário, como o mesmo mês ou a mesma semana. Chamar `isSame()` sem unidade verifica se ambos os valores são exatamente o mesmo dia.

**Parâmetros**

```params
- name: other
  type: CalendarDateInput
  required: true
  description: Data de comparação.
- name: unit
  type: DateUnit
  description: Unidade de calendário a comparar, de `'year'` até `'day'`.
- name: firstDay
  type: DayOfWeek
  description: Primeiro dia da semana quando `unit` for `'week'`.
```

**Retorno**

```returns
type: boolean
description: "`true` quando ambas as datas caem na mesma unidade `unit`."
```

```js
const wed = date('2026-09-09', { locale: 'en-US' });

wed.isSame('2026-09-30', 'month'); // true
wed.isSame('2026-09-06', 'week'); // true
wed.isSame('2026-09-06', 'week', 'monday'); // false
```
:::

### Predicados de calendário

Verificações relativas de dia aceitam um fuso horário opcional, pois qual dia corresponde a hoje depende de onde você está. Quando omitido, usam o fuso horário padrão de [`configure()`](/api/configure/).

| Método | Tipo | Descrição |
|---|---|---|
| `isToday(zone?)`, `isTomorrow(zone?)`, `isYesterday(zone?)` | `boolean` | Se esta data corresponde a hoje, amanhã ou ontem no fuso horário informado ou configurado. |
| `isPast(zone?)`, `isFuture(zone?)` | `boolean` | Se esta data é anterior ou posterior a hoje no fuso horário informado ou configurado. |
| `isWeekday()`, `isWeekend()` | `boolean` | Dia útil ou fim de semana no locale ativo, como sábado e domingo em `en-US` ou sexta e sábado em `ar-SA`. |
| `isLeapYear()` | `boolean` | Se o ano desta data tem 366 dias. |

## Medição de períodos

:::entry
### `until()` :kind[method]

```js signature
d.until(other): Duration
d.until(other, unit): number
```

Mede a diferença no calendário desta data até outra, retornando uma duração negativa quando o destino é anterior. A [`Duration`](/api/duration/) retornada preserva esta data inicial para que meses e anos possam ser totalizados com exatidão.

**Parâmetros**

```params
- name: other
  type: CalendarDateInput
  required: true
  description: Data de destino até a qual medir.
- name: unit
  type: Unit
  description: Unidade usada para retornar o total como número de ponto flutuante.
```

**Retorno**

```returns
type: Duration | number
description: Uma `Duration` contada em dias, ou um número quando `unit` é informada.
```

```js
const start = date('2026-01-01');

start.until('2027-04-05').toString(); // 'P459D'
start.until('2027-04-05').balance('year').toString(); // 'P1Y3M4D'
start.until('2027-04-05', 'days'); // 459
start.until('2026-07-01').total('months'); // 6
```
:::

:::entry
### `since()` :kind[method]

```js signature
d.since(other): Duration
d.since(other, unit): number
```

Mede a diferença no calendário decorrida desde uma data anterior. Passe o nome de uma unidade para obter o total como número.

```js
date('2026-11-16').since('2026-11-02', 'weeks'); // 2
```
:::

:::entry
### `to()` :kind[method]

```js signature
d.to(end): DateRange
d.to(count, unit): DateRange
d.through(end): DateRange
d.through(count, unit): DateRange
d.for(length): DateRange
d.for(count, unit): DateRange
```

Cria um [`DateRange`](/api/ranges/#daterange) inclusivo que começa nesta data e vai até a data final ou pela duração informada. Tanto o dia inicial quanto o dia final fazem parte do intervalo. Também disponível pelo alias `through()`; use `for()` para informar uma duração explícita (datas finais e números sem unidade são recusados).

**Parâmetros**

```params
- name: end
  type: CalendarDateInput | DurationInput | number
  required: true
  description: Data final incluída, duração de calendário ou contagem numérica `count` combinada com `unit`.
- name: unit
  type: DateUnit
  description: Nome da unidade de calendário em inglês quando o primeiro argumento é uma contagem numérica, como `'days'` ou `'weeks'`.
```

**Retorno**

```returns
type: DateRange
description: Um `DateRange` inclusivo começando nesta data.
```

```js
date('2026-11-01').to('2026-11-07').duration.days; // 7
date('2026-11-01').for(7, 'days').toString(); // '2026-11-01/2026-11-07'
```
:::

:::entry
### `range()` :kind[method]

```js signature
d.range(unit, firstDay?): DateRange
```

Retorna um [`DateRange`](/api/ranges/#daterange) inclusivo que abrange todos os dias da unidade de calendário que contém esta data, do primeiro ao último dia.

**Parâmetros**

```params
- name: unit
  type: DateUnit
  required: true
  description: Unidade de calendário, de `'year'` até `'day'`.
- name: firstDay
  type: DayOfWeek
  description: Primeiro dia da semana quando `unit` for `'week'`.
```

**Retorno**

```returns
type: DateRange
description: Um `DateRange` inclusivo do início até o fim de `unit`.
```

```js
date('2026-02-10').range('month').toString(); // '2026-02-01/2026-02-28'
date('2026-11-18', { locale: 'en-US' }).range('week').toString(); // '2026-11-15/2026-11-21'
date('2026-11-18').range('week', 'monday').toString(); // '2026-11-16/2026-11-22'
```
:::

:::entry
### `every()` :kind[method]

```js signature
d.every(step, zone?): DateTime[]
d.every(count, unit, zone?): DateTime[]
```

Percorre este dia de calendário em incrementos positivos no fuso horário informado ou configurado, retornando um array de instantes [`DateTime`](/api/date-time/) a partir da meia-noite. Transições de horário de verão produzem 23 ou 25 instantes de hora em hora automaticamente.

**Parâmetros**

```params
- name: step
  type: Unit | DurationInput | number
  required: true
  description: Nome de unidade em inglês como `'hour'`, duração em inglês como `'30m'` ou contagem numérica combinada com `unit`.
- name: unit
  type: Unit
  description: Nome da unidade em inglês quando o primeiro argumento é uma contagem numérica.
- name: zone
  type: Zone
  description: Fuso horário dos limites do dia; por padrão, o fuso horário configurado.
```

**Retorno**

```returns
type: DateTime[]
description: Instantes ao longo deste dia de calendário em `zone`.
```

```js
const slots = date('2026-11-16').every(6, 'hours', 'UTC');

slots.length; // 4
slots[1].toString(); // '2026-11-16T06:00:00.000Z'
```
:::

:::entry
### `split()` :kind[method]

```js signature
d.split(step, zone?): DateTimeRange[]
d.split(count, unit, zone?): DateTimeRange[]
d.splitBy(step, zone?): DateTimeRange[]
d.splitBy(count, unit, zone?): DateTimeRange[]
```

Divide este dia de calendário em intervalos [`DateTimeRange`](/api/ranges/#datetimerange) contíguos e semiabertos no fuso horário informado ou configurado. Também disponível pelo alias `splitBy()`.

**Parâmetros**

```params
- name: step
  type: Unit | DurationInput | number
  required: true
  description: Nome de unidade em inglês, duração ou contagem numérica combinada com `unit`.
- name: unit
  type: Unit
  description: Nome da unidade em inglês quando o primeiro argumento é uma contagem numérica.
- name: zone
  type: Zone
  description: Fuso horário dos limites do dia; por padrão, o fuso horário configurado.
```

**Retorno**

```returns
type: DateTimeRange[]
description: Fatias `DateTimeRange` contíguas cobrindo este dia em `zone`.
```

```js
const halves = date('2026-11-16').split(12, 'hours', 'UTC');

halves.map(String);
// ['2026-11-16T00:00:00.000Z/2026-11-16T12:00:00.000Z', '2026-11-16T12:00:00.000Z/2026-11-17T00:00:00.000Z']
```
:::

## Formatação e conversão

:::entry
### `format()` :kind[method]

```js signature
d.format(spec?, locale?): string
```

Formata a data usando presets integrados, nomes personalizados de [`configure()`](/api/configure/), objetos de opções `Intl` ou padrões de tokens.

Os presets localizados de `'L'` a `'LLLL'` já vêm integrados, e objetos de opções ignoram chaves de relógio e de fuso horário automaticamente. Consulte [Formatação](/guides/formatting/) para a referência completa de presets e tokens.

**Parâmetros**

```params
- name: spec
  type: FormatSpec
  default: "'medium'"
  description: Nome de formato integrado ou configurado, objeto de opções `Intl` ou padrão de tokens.
- name: locale
  type: string
  description: Tag de locale BCP 47 que sobrescreve o locale desta data ou o padrão configurado apenas nesta chamada.
```

**Retorno**

```returns
type: string
description: String da data formatada.
```

```js
const day = date('2026-11-16');

day.format('short', 'en-US'); // '11/16/26'
day.format('medium', 'en-US'); // 'Nov 16, 2026'
day.format('long', 'en-US'); // 'November 16, 2026'
day.format('full', 'en-US'); // 'Monday, November 16, 2026'
day.format('L', 'en-US'); // '11/16/2026'
day.format('YYYY-MM-DD'); // '2026-11-16'
day.format('ddd, MMM D', 'en-US'); // 'Mon, Nov 16'
day.format({ weekday: 'long' }, 'en-US'); // 'Monday'
```
:::

:::entry
### `from()` :kind[method]

```js signature
d.from(other?, locale?): string
d.formatRelative(other?, locale?): string
```

Formata a distância no calendário entre outra data e esta como uma expressão localizada via `Intl.RelativeTimeFormat`, como “ontem” ou “em 3 semanas”.

Omitir o primeiro argumento compara com [`today()`](/api/date-fn/#today), e [`formatRelative()`](#formatrelative) funciona como alias. Distâncias menores que sete dias usam palavras naturais para ontem, hoje e amanhã, enquanto semanas, meses e anos usam contagens numéricas.

**Parâmetros**

```params
- name: other
  type: CalendarDateInput
  description: Data de calendário de referência a partir da qual medir. Por padrão, `today()` no fuso horário ativo.
- name: locale
  type: Locale
  description: Tag de locale BCP 47 que sobrescreve o locale desta data ou o padrão configurado apenas nesta chamada.
```

**Retorno**

```returns
type: string
description: Expressão localizada de tempo relativo.
```

```js
const anchor = date('2026-11-16');

date('2026-11-15').from(anchor, 'en-US'); // 'yesterday'
date('2026-11-16').from(anchor, 'en-US'); // 'today'
date('2026-11-17').from(anchor, 'en-US'); // 'tomorrow'
date('2026-11-30').from(anchor, 'en-US'); // 'in 2 weeks'
date('2026-11-15').from(anchor, 'de'); // 'gestern'
```
:::

:::entry
### `fromNow()` :kind[method]

```js signature
d.fromNow(locale?): string
```

Formata a distância desta data em relação a hoje como uma expressão localizada, equivalente a chamar [`from()`](#from) sem data de referência.

**Parâmetros**

```params
- name: locale
  type: Locale
  description: Tag de locale BCP 47 que sobrescreve o locale desta data ou o padrão configurado apenas nesta chamada.
```

**Retorno**

```returns
type: string
description: Expressão localizada de tempo relativo medida a partir de hoje.
```

```js
today().minus(1, 'day').fromNow('en-US'); // 'yesterday'
today().plus(3, 'days').fromNow('en-US'); // 'in 3 days'
```
:::

:::entry
### `formatRelative()` :kind[method]

```js signature
d.formatRelative(other?, locale?): string
```

Alias de [`from()`](#from) que formata como expressão localizada a distância no calendário desde `other`, ou desde hoje quando omitido.
:::

:::entry
### `locale()` :kind[method]

```js signature
d.locale(): Locale | undefined
d.locale(tag): CalendarDate
```

Lê o locale associado a esta data ou retorna uma cópia que formata e inicia semanas em outro locale nos presets, nos limites de semana e nos valores derivados. Tags com sublinhado e cabeçalhos `Accept-Language` são normalizados automaticamente, uma tag vazia remove o locale e [`lang()`](#lang) funciona como alias.

**Parâmetros**

```params
- name: tag
  type: Locale | null | undefined
  description: Tag de locale, array de tags ou cabeçalho `Accept-Language` a propagar, ou `null` para limpar o valor atual.
```

**Retorno**

```returns
type: CalendarDate | Locale | undefined
description: Tag ativa ao chamar sem argumentos, ou uma nova `CalendarDate` com `tag`.
```

```js
const trip = date('2026-05-15').locale('fr-FR');

trip.locale(); // 'fr-FR'
trip.format('long'); // '15 mai 2026'
trip.to('2026-05-19').format('long'); // '15–19 mai 2026'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
d.lang(): Locale | undefined
d.lang(tag): CalendarDate
```

Alias curto de [`locale()`](#locale) que lê ou associa uma tag de locale BCP 47 a esta data.
:::

:::entry
### `as()` :kind[method]

```js signature
d.as('date'): CalendarDate
d.as('datetime', zone?): DateTime
d.as('yearMonth'): YearMonth
d.as('monthDay'): MonthDay
```

Converte esta data para outro tipo dentro de um encadeamento de métodos, incluindo [`YearMonth`](/api/year-month/) e [`MonthDay`](/api/month-day/). A conversão para um instante retorna a meia-noite no início desta data no fuso horário informado ou configurado.

**Parâmetros**

```params
- name: kind
  type: "'date' | 'datetime' | 'yearMonth' | 'monthDay'"
  required: true
  description: Tipo de destino para converter esta data de calendário.
- name: zone
  type: Zone
  description: Fuso horário usado ao converter para `'datetime'`; por padrão, o fuso horário configurado.
```

**Retorno**

```returns
type: CalendarDate | DateTime | YearMonth | MonthDay
description: Valor convertido.
```

```js
const due = date('2026-11-16');

due.as('datetime', 'UTC').toString(); // '2026-11-16T00:00:00.000Z'
due.as('yearMonth').toString(); // '2026-11'
due.as('monthDay').toString(); // '11-16'
```
:::

:::entry
### `toString()` :kind[method]

```js signature
d.toString(): string
d.toJSON(): string
```

Retorna a data como uma string ISO 8601 no formato `YYYY-MM-DD`. `toJSON()` retorna a mesma string para `JSON.stringify()`.

**Retorno**

```returns
type: string
description: String de data ISO 8601, como `'2026-11-16'`.
```

```js
const due = date('2026-11-16');

due.toString(); // '2026-11-16'
JSON.stringify({ due }); // '{"due":"2026-11-16"}'
```
:::

:::entry
### `toJSDate()` :kind[method]

```js signature
d.toJSDate(zone?): Date
```

Retorna um `Date` nativo do JavaScript à meia-noite desta data no fuso horário informado ou configurado.
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
d.toTemporal(): Temporal.PlainDate
```

Retorna a instância subjacente de `Temporal.PlainDate`.
:::

:::entry
### `valueOf()` :kind[method]

```js signature
d.valueOf(): never
```

Lança um `RangeError` para que operadores numéricos nunca convertam silenciosamente uma data de calendário em número.
:::
