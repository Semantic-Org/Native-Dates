---
source: "c784c44bf2d7"
title: ranges
lede: Subtraia trechos sobrepostos e una intervalos adjacentes em todos os tipos de intervalo.
---

## Operações de conjunto em intervalos

Os [intervalos](/api/ranges/) do núcleo já oferecem inclusão, verificação de sobreposição e interseção. Importar este plugin adiciona `subtract()` e `union()` em `DateRange`, `DateTimeRange` e `TimeRange`, além de exportar `mergeRanges()` para unificar listas de intervalos.

```js title="ranges.js"
import { mergeRanges } from '@native-dates/plugins/ranges';
import { dateRange, timeRange } from 'native-dates';

const trip = dateRange('2026-11-01', '2026-11-10');
trip.subtract('2026-11-04/2026-11-06').map(String);
// ['2026-11-01/2026-11-03', '2026-11-07/2026-11-10']

dateRange('2026-11-01', '2026-11-05').union('2026-11-06/2026-11-10')?.toString();
// '2026-11-01/2026-11-10'

mergeRanges([
  timeRange('22:00', '02:00'),
  timeRange('01:00', '06:00'),
  timeRange('10:00', '12:00'),
]).map(String);
// ['10:00:00/12:00:00', '22:00:00/06:00:00']
```

Cada classe de intervalo mantém sua própria convenção de extremidades. Intervalos de datas de calendário incluem ambas as pontas, enquanto intervalos de instantes e de horários excluem o ponto final.

## Métodos de instância

:::entry
### `subtract()` :kind[method]

```js signature
range.subtract(other): Range[]
```

Remove deste intervalo o trecho coberto por `other` e retorna zero, um ou dois intervalos restantes do mesmo tipo. Os intervalos retornados preservam o locale e o fuso horário do intervalo original.

Subtrair um intervalo disjunto ou vazio retorna o intervalo original em um array de um elemento. Chamar `subtract()` em um intervalo vazio de instantes ou de horários retorna um array vazio.

**Parâmetros**

```params
- name: other
  type: Range | string
  required: true
  description: Instância de intervalo ou string de intervalo do mesmo tipo a remover.
```

**Retorno**

```returns
type: Array<DateRange | DateTimeRange | TimeRange>
description: Array ordenado com os intervalos restantes do mesmo tipo.
```

```js
import '@native-dates/plugins/ranges';
import { dateRange, datetimeRange, timeRange } from 'native-dates';

dateRange('2026-11-01', '2026-11-10').subtract('2026-11-01/2026-11-03').map(String);
// ['2026-11-04/2026-11-10']

const day = datetimeRange('2026-11-02T09:00', '2026-11-02T17:00', 'America/New_York');
day.subtract('2026-11-02T12:00/2026-11-02T13:00').map((part) => `${part.start.hour}-${part.end.hour}`);
// ['9-12', '13-17']

timeRange('22:00', '06:00').subtract('23:00 - 02:00').map(String);
// ['22:00:00/23:00:00', '02:00:00/06:00:00']
```
:::

:::entry
### `union()` :kind[method]

```js signature
range.union(other): Range | null
```

Combina este intervalo com outro intervalo do mesmo tipo que se sobreponha ou seja diretamente adjacente, retornando `null` quando houver uma lacuna entre eles. Os intervalos retornados preservam o locale e o fuso horário do intervalo original.

Dois valores `DateRange` são adjacentes quando o segundo começa no dia seguinte ao término do primeiro. Dois valores `DateTimeRange` ou `TimeRange` são adjacentes quando um termina exatamente no início do outro, e intervalos vazios não alteram o resultado.

**Parâmetros**

```params
- name: other
  type: Range | string
  required: true
  description: Instância de intervalo ou string de intervalo do mesmo tipo a combinar.
```

**Retorno**

```returns
type: DateRange | DateTimeRange | TimeRange | null
description: "Intervalo combinado do mesmo tipo, ou `null` quando houver uma lacuna entre eles."
```

```js
import '@native-dates/plugins/ranges';
import { dateRange, timeRange } from 'native-dates';

dateRange('2026-11-01', '2026-11-05').union('2026-11-06/2026-11-10')?.toString();
// '2026-11-01/2026-11-10'

dateRange('2026-11-01', '2026-11-05').union('2026-11-07/2026-11-10');
// null

timeRange('22:00', '06:00').union('06:00 - 08:00')?.toString();
// '22:00:00/08:00:00'
```
:::

## Unificação de coleções

:::entry
### `mergeRanges()` :kind[function]

```js signature
mergeRanges(ranges): Range[]
```

Ordena um iterável de intervalos do mesmo tipo e funde todos os trechos sobrepostos ou adjacentes no menor conjunto de intervalos disjuntos. Intervalos vazios de instantes ou de horários são omitidos da saída.

Misturar tipos diferentes de intervalo lança `TypeError` com o código `conflictingRanges`, e passar itens que não sejam intervalos lança `TypeError` com o código `invalidRange`.

**Parâmetros**

```params
- name: ranges
  type: Iterable<DateRange> | Iterable<DateTimeRange> | Iterable<TimeRange>
  required: true
  description: Array, Set ou outro iterável de intervalos do mesmo tipo.
```

**Retorno**

```returns
type: Array<DateRange | DateTimeRange | TimeRange>
description: Array mínimo e ordenado de intervalos não sobrepostos do mesmo tipo.
```

```js
import { mergeRanges } from '@native-dates/plugins/ranges';
import { dateRange, datetimeRange } from 'native-dates';

mergeRanges([
  dateRange('2026-11-12', '2026-11-15'),
  dateRange('2026-11-01', '2026-11-05'),
  dateRange('2026-11-06', '2026-11-08'),
]).map(String);
// ['2026-11-01/2026-11-08', '2026-11-12/2026-11-15']

mergeRanges([
  datetimeRange('2026-11-02T11:00', '2026-11-02T12:00', 'UTC'),
  datetimeRange('2026-11-02T09:00', '2026-11-02T11:00', 'UTC'),
]).map((part) => part.duration.hours);
// [3]
```
:::

## Intervalos noturnos de horário

Valores `TimeRange` noturnos cruzam a meia-noite sem atrito em `subtract()`, `union()` e `mergeRanges()`. Trechos adjacentes que se encontram na meia-noite voltam a formar um único intervalo noturno.

```js
import '@native-dates/plugins/ranges';
import { timeRange } from 'native-dates';

timeRange('22:00', '06:00').subtract('01:00 - 03:00').map(String);
// ['22:00:00/01:00:00', '03:00:00/06:00:00']

timeRange('22:00', '00:00').union('00:00 - 06:00')?.toString();
// '22:00:00/06:00:00'
```

:::note[Cobertura completa de 24 horas]
Um `TimeRange` com início e fim iguais é vazio, portanto nenhum `TimeRange` único consegue representar todas as 24 horas. Chamar `union()` ou `mergeRanges()` em intervalos de horário que cobrem o dia inteiro lança `RangeError` com o código `unsupportedUnion`.
:::
