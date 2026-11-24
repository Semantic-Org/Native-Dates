---
source: "d8be401b7194"
title: Durações
lede: Crie durações a partir de funções de unidade ou frases em inglês, e meça ou formate períodos de tempo.
---

Uma [`Duration`](/api/duration/) representa um período de tempo decorrido, como 90 minutos ou 2 semanas. Você pode criar uma diretamente para cálculos com datas ou recebê-la de volta ao medir a diferença entre dois valores.

## Como criar uma Duration

Crie uma duração com auxiliares de unidade como [`hours()`](/api/duration-fn/#hours), ou passe uma frase com unidades em inglês (como `'2 weeks, 3 days'`), uma string ISO 8601 ou um objeto de campos para [`duration()`](/api/duration-fn/):

```js
import { days, duration, hours } from 'native-dates';

const call = hours(1.5);
const trial = days(14);
const turnaround = duration('2 weeks, 3 days');
const iso = duration('PT1H30M');
const window = duration({ hours: 2, minutes: 45 });
```

Acesse os valores de cada unidade diretamente na instância. Entradas fracionárias se distribuem automaticamente na unidade menor seguinte, enquanto números inteiros permanecem na unidade informada:

```js
call.hours; // 1
call.minutes; // 30

const ninety = duration(90, 'minutes');
ninety.hours; // 0
ninety.minutes; // 90
```

## Medição entre dois valores

Chame [`until()`](/api/date-time/#until) ou [`since()`](/api/date-time/#since) entre duas datas, horários, valores [`YearMonth`](/api/year-month/) ou instantes para medir o tempo entre eles:

```js
import { datetime } from 'native-dates';

const opened = datetime('2026-11-16T08:00', 'America/Los_Angeles');
const resolved = datetime('2026-11-16T10:30', 'America/Los_Angeles');

const elapsed = opened.until(resolved);
elapsed.hours; // 2
elapsed.minutes; // 30
```

Quando você precisa apenas de um único número para cálculos ou barras de progresso, passe a unidade de destino (em inglês) como segundo argumento:

```js
opened.until(resolved, 'hours'); // 2.5
resolved.since(opened, 'minutes'); // 150
```

Todo [intervalo](/api/ranges/) também expõe `.duration` diretamente:

```js
import { dateRange, timeRange } from 'native-dates';

dateRange('2026-11-01', '2026-11-07').duration.days; // 7
timeRange('9:00am', '5:30pm').duration.hours; // 8
```

## Balanceamento e totalização de unidades

Os valores permanecem nas unidades informadas até que você peça o contrário. Chame [`balance()`](/api/duration/#balance) quando quiser converter o excedente para unidades maiores:

```js
import { hours, minutes, months } from 'native-dates';

minutes(90).balance().toFields(); // { hours: 1, minutes: 30 }
months(18).balance().toFields(); // { years: 1, months: 6 }
hours(36).balance('day').toFields(); // { days: 1, hours: 12 }
```

Sem argumento, durações avulsas convertem meses em anos e unidades de relógio até horas, deixando os dias intactos para não distorcer fronteiras de horário de verão.

Passe `'day'` ou `'week'` quando quiser dias fixos de 24 horas ou semanas fixas de 7 dias.

Chame [`total()`](/api/duration/#total) ou seu alias [`as()`](/api/duration/#as) para converter toda a duração em um único número de ponto flutuante na unidade escolhida:

```js
import { duration } from 'native-dates';

const shift = duration('7h 30m');

shift.total('hours'); // 7.5
shift.as('minutes'); // 450
```

:::note[Totais em meses e anos]
Anos e meses se totalizam e se balanceiam diretamente entre si na proporção de 12 meses por ano. Converter entre dias e meses exige uma data de calendário de referência, que as durações retornadas por `until()` e `since()` guardam automaticamente.
:::

```js
import { date, months } from 'native-dates';

months(18).total('years'); // 1.5

const span = date('2026-01-15').until('2026-04-15');
span.total('months'); // 3
span.total('days'); // 90
```

## Formatação de durações

Toda instância define `.text` com sua forma extensa no locale ativo. Chame [`format()`](/api/duration/#format) com o nome de um preset para obter saída por extenso, abreviada, compacta ou digital:

```js
import { duration } from 'native-dates';

const flight = duration({ hours: 2, minutes: 30 });

flight.text; // '2 hours, 30 minutes'
flight.format('long', 'en-US'); // '2 hours, 30 minutes'
flight.format('short', 'en-US'); // '2 hr, 30 min'
flight.format('narrow', 'en-US'); // '2h 30m'
flight.format('digital', 'en-US'); // '2:30:00'
```

Passe uma tag de locale como segundo argumento para traduzir os rótulos das unidades, ou chame [`toString()`](/api/duration/#tostring) quando precisar de uma string ISO 8601 para um payload de API.
