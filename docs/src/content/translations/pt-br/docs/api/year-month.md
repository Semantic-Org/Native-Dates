---
source: "09d43cd55ced"
title: YearMonth
lede: Ano e mês de calendário sem dia, para ciclos de cobrança, validade de cartões e seletores de mês.
---

## Criar um YearMonth

Crie uma instância a partir de uma string ISO, de números de ano e mês ou de uma data existente com [`yearMonth()`](/api/year-month-fn/), ou interprete datas de validade de cartão no formato mês/ano com [`monthYear()`](/api/year-month-fn/#monthyear). As instâncias são imutáveis, portanto todo método que altera um valor retorna uma nova instância.

```js title="create.js"
import { monthYear, yearMonth } from 'native-dates';

const billing = yearMonth('2026-11');
const quarterEnd = yearMonth(2026, 12);
const expiry = monthYear('11/26');
```

Obtenha o ano e mês de qualquer [data de calendário](/api/calendar-date/) ou [instante](/api/date-time/) pela propriedade `yearMonth`, ou faça a conversão dentro de um encadeamento com `as('yearMonth')`:

```js
import { date, datetime, today } from 'native-dates';

date('2026-11-16').yearMonth.toString(); // '2026-11'
datetime('2026-11-01T02:00:00Z', 'America/Los_Angeles').as('yearMonth').toString(); // '2026-10'
const currentMonth = today().yearMonth;
```

## Propriedades

As propriedades expõem o ano e o mês ISO, além dos limites do calendário correspondentes.

| Propriedade | Tipo | Descrição |
|---|---|---|
| `text` | `string` | Mês e ano formatados no locale ativo, como `'Nov 2026'`. |
| `year`, `month` | `number` | Ano de calendário e mês numerado de 1 a 12. |
| `quarter` | `number` | Trimestre do ano, de 1 a 4. |
| `daysInMonth`, `daysInYear` | `number` | Quantidade de dias neste mês (de 28 a 31) e neste ano (365 ou 366). |
| `start`, `end` | [`CalendarDate`](/api/calendar-date/) | Primeiro e último dia de calendário deste mês. |
| `YearMonth.century` | `number` | Século-base somado a anos de dois dígitos em [`monthYear()`](/api/year-month-fn/#monthyear), com padrão `2000`. |

## Aritmética e campos

Avance ou retroceda por meses, trimestres ou anos, substitua campos ou escolha um dia específico do mês.

:::note[Apenas unidades de mês e ano]
Unidades menores que um mês lançam `RangeError`, pois um `YearMonth` não tem dia. Chame [`on()`](#on) para escolher um dia primeiro quando precisar fazer cálculos com semanas ou dias.
:::

:::entry
### `plus()` :kind[method]

```js signature
ym.plus(amount, unit?): YearMonth
ym.add(amount, unit?): YearMonth
```

Avança por anos, trimestres ou meses e retorna um novo `YearMonth`. Também tem o alias `add()`.

**Parâmetros**

```params
- name: amount
  type: DurationInput
  required: true
  description: Quantidade acompanhada de `unit`, instância de `Duration`, string de duração em inglês ou ISO 8601, ou objeto de campos.
- name: unit
  type: Unit
  description: Nome da unidade de mês, trimestre ou ano em inglês quando `amount` é um número.
```

**Retorno**

```returns
type: YearMonth
description: Novo `YearMonth` avançado no calendário.
```

```js
const billing = yearMonth('2026-11');

billing.plus(3, 'months').toString(); // '2027-02'
billing.plus('1 year').toString(); // '2027-11'
```
:::

:::entry
### `minus()` :kind[method]

```js signature
ym.minus(amount, unit?): YearMonth
ym.subtract(amount, unit?): YearMonth
```

Retrocede por anos, trimestres ou meses e retorna uma nova instância. Aceita as mesmas entradas que [`plus()`](#plus), com `subtract()` como alias.

**Parâmetros**

```params
- name: amount
  type: DurationInput
  required: true
  description: Quantidade acompanhada de `unit`, instância de `Duration`, string de duração em inglês ou ISO 8601, ou objeto de campos.
- name: unit
  type: Unit
  description: Nome da unidade de mês, trimestre ou ano em inglês quando `amount` é um número.
```

**Retorno**

```returns
type: YearMonth
description: Novo `YearMonth` retrocedido no calendário.
```

```js
yearMonth('2026-11').minus(1, 'year').toString(); // '2025-11'
```
:::

:::entry
### `set()` :kind[method]

```js signature
ym.set(fields): YearMonth
ym.set(unit, value): YearMonth
```

Retorna um novo `YearMonth` substituindo o ano, o mês ou ambos. Meses fora do intervalo válido e unidades menores que um mês lançam `RangeError`.

**Parâmetros**

```params
- name: fields
  type: Partial<YearMonthFields> | Unit
  required: true
  description: Objeto com os campos `year` ou `month`, ou o nome de uma única unidade em inglês.
- name: value
  type: number
  description: Número inteiro atribuído quando o primeiro argumento é o nome de uma unidade.
```

**Retorno**

```returns
type: YearMonth
description: Novo `YearMonth` com os campos de calendário atualizados.
```

```js
const billing = yearMonth('2026-11');

billing.set('month', 2).toString(); // '2026-02'
billing.set({ year: 2028, month: 2 }).daysInMonth; // 29
```
:::

:::entry
### `on()` :kind[method]

```js signature
ym.on(day): CalendarDate
```

Combina este mês com um número inteiro de dia (de 1 a 31) e retorna uma [`CalendarDate`](/api/calendar-date/). O dia 31 é limitado ao fim do mês em meses mais curtos, como fevereiro ou abril, enquanto números fora de 1 a 31 lançam `RangeError`.

**Parâmetros**

```params
- name: day
  type: number | string
  required: true
  description: Dia do mês (número inteiro de 1 a 31).
```

**Retorno**

```returns
type: CalendarDate
description: Instância de `CalendarDate` para esse dia do mês.
```

```js
yearMonth('2026-11').on(15).toString(); // '2026-11-15'
yearMonth('2026-02').on(31).toString(); // '2026-02-28'
yearMonth('2028-02').on(31).toString(); // '2028-02-29'
```
:::

## Comparação e inclusão

Compare valores de ano e mês em ordem cronológica ou verifique se uma data de calendário cai dentro do mês. Operadores relacionais como `<` lançam erro, enquanto arrays são ordenados diretamente com [`compare()`](/api/compare/) e as [funções auxiliares de extremos](/api/compare/#earliest).

:::entry
### `compare()` :kind[method]

```js signature
ym.compare(other): -1 | 0 | 1
```

Compara este ano e mês com outro, retornando um número negativo, zero ou positivo para ordenação. Ao passar uma data completa ou timestamp, a comparação usa o mês em que esse valor cai.

**Parâmetros**

```params
- name: other
  type: YearMonthInput
  required: true
  description: Outro `YearMonth` ou qualquer entrada aceita por `yearMonth()`.
```

**Retorno**

```returns
type: -1 | 0 | 1
description: "`-1` quando anterior, `0` quando igual ou `1` quando posterior."
```

```js
yearMonth('2026-05').compare('2026-11'); // -1
yearMonth('2026-11').compare('2026-11-16'); // 0
```
:::

:::entry
### `equals()` :kind[method]

```js signature
ym.equals(other): boolean
```

Retorna `true` quando ambos os valores representam o mesmo ano e o mesmo mês.

```js
yearMonth('2026-11').equals(yearMonth(2026, 11)); // true
```
:::

:::entry
### `isBefore()` :kind[method]

```js signature
ym.isBefore(other): boolean
```

Retorna `true` quando este ano e mês é anterior ao outro.

```js
yearMonth('2026-10').isBefore('2026-11'); // true
```
:::

:::entry
### `isAfter()` :kind[method]

```js signature
ym.isAfter(other): boolean
```

Retorna `true` quando este ano e mês é posterior ao outro.

```js
yearMonth('2026-12').isAfter('2026-11'); // true
```
:::

:::entry
### `contains()` :kind[method]

```js signature
ym.contains(day): boolean
ym.includes(day): boolean
```

Retorna `true` quando a data de calendário ou o timestamp informado cai dentro deste ano e mês. Também tem o alias `includes()`.

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
description: "`true` quando `day` cai dentro deste mês."
```

```js
const nov = yearMonth('2026-11');

nov.contains('2026-11-16'); // true
nov.contains('2026-12-01'); // false
```
:::

:::entry
### `isPast()` :kind[method]

```js signature
ym.isPast(zone?): boolean
```

Retorna `true` quando este mês inteiro já é anterior ao mês atual no fuso horário informado ou configurado.

```js
yearMonth('2020-01').isPast('UTC'); // true
```
:::

:::entry
### `isFuture()` :kind[method]

```js signature
ym.isFuture(zone?): boolean
```

Retorna `true` enquanto este mês ainda está à frente do mês atual no fuso horário informado ou configurado.

```js
yearMonth('2099-01').isFuture('UTC'); // true
```
:::

:::entry
### `isLeapYear()` :kind[method]

```js signature
ym.isLeapYear(): boolean
```

Retorna `true` quando o ano de calendário deste mês tem 366 dias.

```js
yearMonth('2028-02').isLeapYear(); // true
yearMonth('2026-02').isLeapYear(); // false
```
:::

## Medição de durações

:::entry
### `until()` :kind[method]

```js signature
ym.until(other): Duration
ym.until(other, unit): number
```

Mede o tempo deste mês até outro, retornando uma duração negativa quando o destino é anterior. A [`Duration`](/api/duration/) retornada guarda o início deste mês como âncora, permitindo totalizar meses e anos em qualquer unidade.

**Parâmetros**

```params
- name: other
  type: YearMonthInput
  required: true
  description: Ano e mês de destino para a medição.
- name: unit
  type: Unit
  description: Nome da unidade em inglês para retornar o total como número de ponto flutuante.
```

**Retorno**

```returns
type: Duration | number
description: Instância de `Duration` em anos e meses, ou número quando `unit` é informado.
```

```js
const start = yearMonth('2026-03');

start.until('2027-06').toString(); // 'P1Y3M'
start.until('2027-06', 'months'); // 15
```
:::

:::entry
### `since()` :kind[method]

```js signature
ym.since(other): Duration
ym.since(other, unit): number
```

Mede o tempo decorrido desde um ano e mês anterior. Passe o nome de uma unidade em inglês para receber o total como número.

```js
yearMonth('2026-11').since('2026-05', 'months'); // 6
```
:::

## Formatação e conversão

:::entry
### `format()` :kind[method]

```js signature
ym.format(spec?, locale?): string
```

Formata o ano e o mês usando presets nomeados, objetos de opções de `Intl` ou padrões de tokens nativos, como `'MM/YY'`. Objetos de opções compartilhados descartam automaticamente chaves de dia, relógio e fuso horário.

Presets padrão e localizados exibem apenas ano e mês, e formatos personalizados registrados em [`configure()`](/api/configure/) também funcionam aqui. Veja [Formatação](/guides/formatting/) para a lista completa de presets e tokens.

**Parâmetros**

```params
- name: spec
  type: FormatSpec
  default: "'medium'"
  description: Nome de preset como `'medium'` ou `'long'`, objeto de opções de `Intl` ou padrão de tokens.
- name: locale
  type: Locale
  description: Tag de locale BCP 47 que sobrescreve, nesta chamada, o locale deste mês ou o configurado globalmente.
```

**Retorno**

```returns
type: string
description: String formatada de mês e ano.
```

```js
const nov = yearMonth('2026-11');

nov.format('short', 'en-US'); // '11/2026'
nov.format('medium', 'en-US'); // 'Nov 2026'
nov.format('long', 'en-US'); // 'November 2026'
nov.format('L', 'en-US'); // '11/2026'
nov.format('MM/YY'); // '11/26'
```
:::

:::entry
### `locale()` :kind[method]

```js signature
ym.locale(): Locale | undefined
ym.locale(tag): YearMonth
```

Lê o locale associado a este mês ou retorna uma cópia formatada em outro locale em saídas de texto, presets e em qualquer valor derivado dele. Passar uma tag vazia remove o locale associado, e [`lang()`](#lang) funciona como alias.

**Parâmetros**

```params
- name: tag
  type: Locale | null | undefined
  description: Tag de locale BCP 47 a propagar, ou `null` para limpar a tag atual.
```

**Retorno**

```returns
type: YearMonth | Locale | undefined
description: Tag ativa quando chamado sem argumentos, ou novo `YearMonth` associado a `tag`.
```

```js
const may = yearMonth('2026-05').locale('ru');

may.locale(); // 'ru'
may.format('long'); // 'май 2026 г.'
may.on(1).format('long'); // '1 мая 2026 г.'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
ym.lang(): Locale | undefined
ym.lang(tag): YearMonth
```

Alias abreviado de [`locale()`](#locale) para ler ou associar uma tag de locale BCP 47 neste mês.
:::

:::entry
### `as()` :kind[method]

```js signature
ym.as('yearMonth'): YearMonth
```

Retorna esta mesma instância quando `'yearMonth'` é solicitado em cadeias genéricas de conversão, lançando `RangeError` para outros tipos.
:::

:::entry
### `toString()` :kind[method]

```js signature
ym.toString(): string
ym.toJSON(): string
```

Retorna a string de ano e mês no formato ISO 8601, no mesmo padrão dos campos de mês em formulários HTML. `toJSON()` retorna a mesma string na serialização JSON.

**Retorno**

```returns
type: string
description: String ISO 8601 de ano e mês, como `'2026-11'`.
```

```js
yearMonth(2026, 11).toString(); // '2026-11'
JSON.stringify({ billing: yearMonth(2026, 11) }); // '{"billing":"2026-11"}'
```
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
ym.toTemporal(): Temporal.PlainYearMonth
```

Retorna a instância subjacente de `Temporal.PlainYearMonth`.
:::

:::entry
### `valueOf()` :kind[method]

```js signature
ym.valueOf(): never
```

Lança `RangeError` para que operadores numéricos nunca convertam um ano e mês em número. Refine valores desconhecidos com [`isYearMonth()`](/api/kind-of/#isyearmonth) ou [`kindOf()`](/api/kind-of/).
:::
