---
source: "a03fe5ee9f3b"
title: compare()
lede: Ordene e selecione extremos entre datas, instantes, horários, durações e intervalos.
---

## Ordenação e comparação

:::entry
### `compare()` :kind[function]

```js signature
compare(a, b): -1 | 0 | 1
```

Ordena dois valores do mesmo tipo para `Array.prototype.sort()`, retornando um número negativo, zero ou positivo. Funciona com instantes, timestamps Unix, datas de calendário, horários, durações, [valores de ano e mês](/api/year-month/) e [intervalos](/api/ranges/).

Qualquer um dos argumentos também pode ser uma string ISO bruta, um `Date` nativo do JavaScript ou um timestamp em milissegundos. Quando comparado a um horário, um número é interpretado como hora; comparar tipos diferentes lança `TypeError`.

```js title="sort.js"
import { compare, date, datetime, hours, minutes } from 'native-dates';

const dates = [date('2026-12-01'), date('2026-05-10'), date('2026-08-20')];
dates.sort(compare).map(String); // ['2026-05-10', '2026-08-20', '2026-12-01']

const moments = [
  datetime('2026-11-16T18:00', 'Europe/Berlin'),
  datetime('2026-11-16T08:00', 'America/Los_Angeles'),
];
moments.sort(compare)[0].zone; // 'America/Los_Angeles'

compare(1794840000000, datetime('2026-11-16T18:00Z')); // -1

const spans = [hours(2), minutes(45), minutes(90)].sort(compare);
spans[0].minutes; // 45
```

**Parâmetros**

```params
- name: a
  type: Point | Duration | YearMonth | Range
  required: true
  description: Primeiro valor tipado, string ISO, `Date` ou timestamp em milissegundos a comparar.
- name: b
  type: Point | Duration | YearMonth | Range
  required: true
  description: Segundo valor do mesmo tipo, ou entrada bruta compatível com `a`.
```

**Retorno**

```returns
type: -1 | 0 | 1
description: "`-1` quando o primeiro valor vem antes, `0` quando são iguais e `1` quando vem depois."
```

Intervalos do mesmo tipo são ordenados primeiro pelo ponto inicial e desempatados pelo ponto final:

```js
import { compare, dateRange } from 'native-dates';

const windows = [
  dateRange('2026-11-10', '2026-11-20'),
  dateRange('2026-11-10', '2026-11-14'),
  dateRange('2026-11-01', '2026-11-05'),
];

windows.sort(compare).map(String);
// ['2026-11-01/2026-11-05', '2026-11-10/2026-11-14', '2026-11-10/2026-11-20']
```
:::

:::note[Comparar instantes entre fusos horários]
`compare()` ordena valores de [`DateTime`](/api/date-time/) pelo instante exato na linha do tempo, e não pelos dígitos do relógio local. Uma reunião às 9h em Nova York vem antes de uma reunião às 8h do mesmo dia em Los Angeles.
:::

## Selecionar extremos

Encontre o menor ou o maior valor em um conjunto de datas, instantes, horários ou valores de [`YearMonth`](/api/year-month/). As duas funções aceitam argumentos individuais ou um único array não vazio.

:::entry
### `earliest()` :kind[function]

```js signature
earliest(...points): DateTime | CalendarDate | Time | YearMonth
earliest(points): DateTime | CalendarDate | Time | YearMonth
```

Retorna o primeiro valor em ordem cronológica entre um ou mais argumentos ou um array não vazio do mesmo tipo, convertendo `Date` nativos ou milissegundos Unix em [`DateTime`](/api/date-time/). Passar um array vazio lança `RangeError`.

**Parâmetros**

```params
- name: points
  type: Point[] | YearMonth[]
  required: true
  description: Uma ou mais datas, instantes, timestamps Unix, horários ou valores de ano e mês do mesmo tipo.
```

**Retorno**

```returns
type: DateTime | CalendarDate | Time | YearMonth
description: Valor que ocorre primeiro, mantendo o item anterior da lista em caso de empate.
```

```js
import { date, earliest, time } from 'native-dates';

earliest(date('2026-11-20'), date('2026-11-04'), date('2026-11-16')).toString(); // '2026-11-04'
earliest([time('5:30pm'), time('9:00am'), time('12:15pm')]).toString(); // '09:00:00'
earliest(1794850200000, 1794840000000).epochMilliseconds; // 1794840000000
```
:::

:::entry
### `latest()` :kind[function]

```js signature
latest(...points): DateTime | CalendarDate | Time | YearMonth
latest(points): DateTime | CalendarDate | Time | YearMonth
```

Retorna o último valor em ordem cronológica entre um ou mais argumentos ou um array não vazio do mesmo tipo. Passar um array vazio lança `RangeError`.

**Parâmetros**

```params
- name: points
  type: Point[] | YearMonth[]
  required: true
  description: Uma ou mais datas, instantes, horários ou valores de ano e mês do mesmo tipo.
```

**Retorno**

```returns
type: DateTime | CalendarDate | Time | YearMonth
description: Valor que ocorre por último, mantendo o item anterior da lista em caso de empate.
```

Combine [`earliest()`](#earliest) e `latest()` para limitar um valor entre dois extremos:

```js
import { date, earliest, latest } from 'native-dates';

const minDate = date('2026-11-01');
const maxDate = date('2026-11-30');
const picked = date('2026-12-12');

const clamped = earliest(maxDate, latest(minDate, picked));
clamped.toString(); // '2026-11-30'
```
:::
