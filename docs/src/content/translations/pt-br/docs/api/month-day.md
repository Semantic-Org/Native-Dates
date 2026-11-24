---
source: "436c0292465a"
title: MonthDay
lede: Mês e dia de calendário sem ano, para aniversários, datas comemorativas e feriados anuais.
---

## Criar um MonthDay

Crie uma instância informando o mês primeiro com [`monthDay()`](/api/month-day-fn/) ou o dia primeiro com [`dayMonth()`](/api/month-day-fn/#daymonth). As instâncias são imutáveis, portanto cada método retorna um novo valor.

```js title="create.js"
import { dayMonth, monthDay } from 'native-dates';

const birthday = monthDay(10, 17);
const fromIso = monthDay('10-17');
const european = dayMonth('17/10');
```

Obtenha o mês e o dia de qualquer [data de calendário](/api/calendar-date/) ou [instante](/api/date-time/) pela propriedade `monthDay`, ou faça a conversão dentro de um encadeamento com `as('monthDay')`:

```js
import { date, datetime, today } from 'native-dates';

date('1990-10-17').monthDay.toString(); // '10-17'
datetime('2026-10-18T02:00:00Z', 'America/Los_Angeles').as('monthDay').toString(); // '10-17'
const currentMonthDay = today().monthDay;
```

## Propriedades

As propriedades expõem o mês (de 1 a 12) e o dia do mês (de 1 a 31).

| Propriedade | Tipo | Descrição |
|---|---|---|
| `text` | `string` | Mês e dia formatados no locale ativo, como `'Oct 17'`. |
| `month`, `day` | `number` | Mês de calendário de 1 a 12 e dia do mês de 1 a 31. |

## Associar a um ano e percorrer ocorrências

Combine um mês e dia recorrente com um ano para obter uma data concreta, ou avance e retroceda até ocorrências próximas.

:::entry
### `in()` :kind[method]

```js signature
md.in(year): CalendarDate
```

Posiciona este mês e dia em um ano de calendário e retorna uma [`CalendarDate`](/api/calendar-date/). Em anos comuns sem dia bissexto, 29 de fevereiro cai em 28 de fevereiro.

**Parâmetros**

```params
- name: year
  type: number | string
  required: true
  description: Ano de calendário (número inteiro), como `2027`.
```

**Retorno**

```returns
type: CalendarDate
description: Instância de `CalendarDate` em que este mês e dia ocorre em `year`.
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

Retorna a próxima ocorrência após uma data de referência, usando [`today()`](/api/date-fn/#today) como padrão. Quando a data de referência já cai neste mês e dia, o método avança para o ano seguinte.

Datas de calendário e instantes também aceitam um mês e dia diretamente em [`d.next(md)`](/api/calendar-date/#next) e [`dt.next(md)`](/api/date-time/#next).

**Parâmetros**

```params
- name: day
  type: CalendarDateInput
  default: today()
  description: Data inicial usada como ponto de partida para avançar.
```

**Retorno**

```returns
type: CalendarDate
description: Próxima `CalendarDate` após `day`.
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

Retorna a ocorrência mais recente antes de uma data de referência, usando [`today()`](/api/date-fn/#today) como padrão. Datas de calendário e instantes também aceitam um mês e dia diretamente em `previous()`. Também tem o alias `last()`.

**Parâmetros**

```params
- name: day
  type: CalendarDateInput
  default: today()
  description: Data de referência usada como ponto de partida para retroceder.
```

**Retorno**

```returns
type: CalendarDate
description: Instância de `CalendarDate` mais recente anterior a `day`.
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

Retorna a próxima ocorrência após uma data de referência obrigatória. Funciona como [`next()`](#next), sem usar hoje como padrão.

**Parâmetros**

```params
- name: day
  type: CalendarDateInput
  required: true
  description: Data de referência a partir da qual buscar a próxima ocorrência.
```

**Retorno**

```returns
type: CalendarDate
description: Primeira ocorrência de `CalendarDate` após `day`.
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

Retorna a ocorrência mais recente antes de uma data de referência obrigatória. Funciona como [`previous()`](#previous), sem usar hoje como padrão.

```js
monthDay(10, 17).before('2026-10-01').toString(); // '2025-10-17'
```
:::

## Correspondência e igualdade

Como um mês e dia se repete todos os anos em vez de apontar para uma data única, métodos de ordenação como `isBefore()` não se aplicam.

:::tip[Escolhendo entre equals e fallsOn]
Use [`fallsOn()`](#fallson) para verificar se uma data de calendário corresponde à ocorrência daquele ano, já que 29 de fevereiro recai em 28 de fevereiro nos anos comuns. Reserve [`equals()`](#equals) para conferir se dois valores têm exatamente os mesmos números de mês e dia.
:::

:::entry
### `fallsOn()` :kind[method]

```js signature
md.fallsOn(day): boolean
md.isOn(day): boolean
```

Retorna `true` quando a data informada corresponde à ocorrência deste mês e dia no ano dessa data. Em um ano comum, 29 de fevereiro cai em 28 de fevereiro; já em um ano bissexto, cai apenas em 29 de fevereiro. Também tem o alias `isOn()`.

**Parâmetros**

```params
- name: day
  type: CalendarDateInput
  required: true
  description: String de data, `CalendarDate`, `DateTime`, objeto de campos ou `Date`.
```

**Retorno**

```returns
type: boolean
description: "`true` quando `day` corresponde à data deste mês e dia naquele ano."
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

Retorna `true` quando ambos os valores têm exatamente os mesmos números de mês e dia, extraindo o mês e o dia ao receber uma data completa ou timestamp.

Strings ambíguas com barra ou ponto, como `'05/10'`, lançam `RangeError`. Interprete-as antes com as [funções que recebem mês primeiro ou dia primeiro](/api/month-day-fn/).

**Parâmetros**

```params
- name: other
  type: MonthDayInput
  required: true
  description: Outro `MonthDay`, string ISO `'10-17'`, objeto de campos ou valor de data.
```

**Retorno**

```returns
type: boolean
description: "`true` quando ambos os valores têm o mesmo mês e o mesmo dia."
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

Retorna `true` quando este mês e dia cai na data de hoje no fuso horário informado ou configurado.

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

Retorna `true` quando este mês e dia cai na data de amanhã no fuso horário informado ou configurado.

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

Retorna `true` quando este mês e dia cai na data de ontem no fuso horário informado ou configurado.

```js
import { yesterday } from 'native-dates';

yesterday('UTC').monthDay.isYesterday('UTC'); // true
```
:::

## Formatação e conversão

:::entry
### `format()` :kind[method]

```js signature
md.format(spec?, locale?): string
```

Formata o mês e o dia na ordem própria do locale, ou com um padrão de tokens nativo como `'MMM Do'`. Objetos de opções compartilhados ignoram automaticamente chaves de ano, relógio e fuso horário.

Formatos personalizados registrados em [`configure()`](/api/configure/) também funcionam aqui, e locales com calendários não gregorianos usam nomes de meses gregorianos para manter as datas anuais estáveis. Veja [Formatação](/guides/formatting/) para todas as opções de presets e tokens.

**Parâmetros**

```params
- name: spec
  type: FormatSpec
  default: "'medium'"
  description: Nome de preset como `'short'` ou `'long'`, objeto de opções de `Intl` ou padrão de tokens.
- name: locale
  type: Locale
  description: Tag de locale BCP 47 que sobrescreve, nesta chamada, o locale deste valor ou o configurado globalmente.
```

**Retorno**

```returns
type: string
description: String formatada de mês e dia.
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

Lê o locale associado a este mês e dia ou retorna uma cópia formatada em outro locale em saídas de texto, presets e em todas as datas derivadas dele. Passar uma tag vazia remove o locale associado, e [`lang()`](#lang) funciona como alias.

**Parâmetros**

```params
- name: tag
  type: Locale | null | undefined
  description: Tag de locale BCP 47 a propagar, ou `null` para limpar a tag atual.
```

**Retorno**

```returns
type: MonthDay | Locale | undefined
description: Tag ativa quando chamado sem argumentos, ou novo `MonthDay` associado a `tag`.
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

Alias abreviado de [`locale()`](#locale) para ler ou associar uma tag de locale BCP 47 neste mês e dia.
:::

:::entry
### `as()` :kind[method]

```js signature
md.as('monthDay'): MonthDay
```

Retorna esta mesma instância quando `'monthDay'` é solicitado em cadeias genéricas de conversão, lançando `RangeError` para outros tipos.
:::

:::entry
### `toString()` :kind[method]

```js signature
md.toString(): string
md.toJSON(): string
```

Retorna a string ISO de mês e dia com dois dígitos `'MM-DD'`, que pode ser interpretada novamente com o mês primeiro pelas duas [funções de criação de mês e dia](/api/month-day-fn/). `toJSON()` retorna a mesma string na serialização JSON.

**Retorno**

```returns
type: string
description: String ISO de mês e dia, como `'10-17'`.
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

Retorna a instância subjacente de `Temporal.PlainMonthDay`.
:::

:::entry
### `valueOf()` :kind[method]

```js signature
md.valueOf(): never
```

Lança `RangeError` para que operadores numéricos nunca convertam um mês e dia em número. Refine valores desconhecidos com [`isMonthDay()`](/api/kind-of/#ismonthday) ou [`kindOf()`](/api/kind-of/).
:::
