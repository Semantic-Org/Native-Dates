---
source: "ec38498f1427"
title: Cálculos com datas
lede: Some durações, ajuste valores a limites do calendário e avance por dias da semana ou intervalos sem alterar os originais.
---

Toda data, todo horário e todo instante no Native Dates é imutável. Métodos que deslocam ou arredondam um valor sempre retornam uma nova instância e deixam a original intacta.

## Soma e subtração

Chame [`plus()`](/api/date-time/#plus) ou [`minus()`](/api/date-time/#minus) para avançar ou retroceder no tempo:

```js
import { date } from 'native-dates';

const created = date('2026-11-16');
const due = created.plus(2, 'weeks');

created.toString(); // '2026-11-16'
due.toString(); // '2026-11-30'
```

Ambos aceitam quantidade e unidade em inglês, uma frase curta com unidades em inglês, um objeto de campos ou uma instância de [`Duration`](/api/duration/). Os nomes [`add()`](/api/date-time/#plus) e [`subtract()`](/api/date-time/#minus) também funcionam como aliases:

```js
import { datetime, hours } from 'native-dates';

const kickoff = datetime('2026-11-16T09:00', 'America/New_York');

kickoff.plus(2, 'weeks');
kickoff.plus('1h 30m');
kickoff.plus({ days: 2, hours: 4 });
kickoff.minus(hours(3));
```

:::tip[As unidades precisam combinar com o tipo]
Uma data de calendário rejeita unidades de relógio como horas porque não tem hora do dia. Um horário rejeita unidades de calendário como dias porque reinicia à meia-noite. Quando o cálculo envolver os dois, combine-os antes com [`at()`](/api/calendar-date/#at).
:::

## Fins de mês e horário de verão

Somar meses ou anos limita o resultado ao último dia válido do mês de destino, em vez de avançar para o mês seguinte. Somar um mês a 31 de janeiro resulta em 28 de fevereiro, ou 29 de fevereiro em ano bissexto:

```js
import { date } from 'native-dates';

date('2026-01-31').plus(1, 'month').toString(); // '2026-02-28'
date('2028-01-31').plus(1, 'month').toString(); // '2028-02-29'
```

Em um [`DateTime`](/api/date-time/), unidades de calendário preservam a hora local ao atravessar mudanças de horário de verão. Já unidades de relógio contam horas e minutos exatos decorridos:

```js
import { datetime } from 'native-dates';

const saturday = datetime('2026-03-07T09:00', 'America/New_York');

saturday.plus(1, 'day').text; // 'Mar 8, 2026, 9:00 AM EDT'
saturday.plus(24, 'hours').text; // 'Mar 8, 2026, 10:00 AM EDT'
```

Veja [Fusos horários](/guides/time-zones/) para entender em detalhe as transições de avanço e recuo do relógio.

## Ajuste a limites de unidade

Chame [`startOf()`](/api/date-time/#startof) e [`endOf()`](/api/date-time/#endof) para ajustar o valor ao início ou ao fim de um ano, trimestre, mês, semana, dia ou unidade de relógio.

Em uma data de calendário, o fim de um mês é o seu último dia. Em um instante, o fim de uma unidade é o seu último milissegundo:

```js
import { date, datetime } from 'native-dates';

const midMonth = date('2026-11-18');
midMonth.startOf('month').toString(); // '2026-11-01'
midMonth.endOf('month').toString(); // '2026-11-30'

const stamp = datetime('2026-11-18T14:20', 'UTC');
stamp.endOf('day').toString(); // '2026-11-18T23:59:59.999Z'
```

As semanas começam no primeiro dia do locale ativo, como domingo em `'en-US'` ou segunda-feira em `'de-DE'`. Passe o nome de um dia da semana em inglês como segundo argumento em uma única chamada, ou defina um padrão global com [`configure()`](/api/configure/):

```js
const wednesday = date('2026-11-18');

wednesday.locale('en-US').startOf('week').toString(); // '2026-11-15'
wednesday.locale('de-DE').startOf('week').toString(); // '2026-11-16'
wednesday.startOf('week', 'monday').toString(); // '2026-11-16'
```

Chame [`startOfNext()`](/api/date-time/#startofnext) ou [`startOfPrevious()`](/api/date-time/#startofprevious) para ir ao início da unidade seguinte ou anterior. Ambos sempre avançam ou recuam para a unidade adjacente, então chamar `startOfNext('month')` em 1º de dezembro retorna 1º de janeiro:

```js
const invoiced = date('2026-11-16');

invoiced.startOfNext('month').toString(); // '2026-12-01'
invoiced.startOfNext('quarter').toString(); // '2027-01-01'
invoiced.startOfPrevious('month').toString(); // '2026-10-01'
```

## Arredondamento de horários

Chame [`round()`](/api/date-time/#round) em um instante ou horário para arredondar para a unidade ou incremento mais próximo, ou use `floor()` e `ceil()` para arredondar sempre em uma direção:

```js
import { time } from 'native-dates';

const logged = time('9:23am');

logged.round('hour').format('short', 'en-US'); // '9:00 AM'
logged.round(15, 'minutes').format('short', 'en-US'); // '9:30 AM'
logged.floor(15, 'minutes').format('short', 'en-US'); // '9:15 AM'
logged.ceil(15, 'minutes').format('short', 'en-US'); // '9:30 AM'
```

Incrementos como 5, 10, 15 ou 30 minutos precisam dividir exatamente a unidade imediatamente superior.

## Avanço por dia da semana ou data recorrente

Chame [`next()`](/api/calendar-date/#next) ou [`previous()`](/api/calendar-date/#previous) em uma data ou instante passando o nome de um dia da semana em inglês para ir à próxima ocorrência ou à mais recente. Se o valor já cair nesse dia da semana, ele avança ou recua sete dias inteiros:

```js
import { date } from 'native-dates';

const monday = date('2026-11-16');

monday.next('friday').toString(); // '2026-11-20'
monday.next('monday').toString(); // '2026-11-23'
monday.previous('friday').toString(); // '2026-11-13'
```

Passe um [`MonthDay`](/api/month-day/) para ir diretamente à próxima ocorrência ou à anterior de um aniversário ou feriado anual:

```js
import { monthDay } from 'native-dates';

const birthday = monthDay('10/17');
monday.next(birthday).toString(); // '2027-10-17'
```

Em um instante, `next()` mantém a hora do dia. Passe o nome do dia da semana em inglês para `startOfNext()` quando quiser ir para o início daquele dia:

```js
import { datetime } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'America/New_York');

standup.next('wednesday').text; // 'Nov 18, 2026, 9:30 AM EST'
standup.startOfNext('wednesday').text; // 'Nov 18, 2026, 12:00 AM EST'
```

## Criação e percurso de intervalos

Crie um [intervalo](/guides/ranges/) com [`dateRange()`](/api/range-fn/#daterange) ou encadeie [`for()`](/api/ranges/#to) e [`to()`](/api/ranges/#to) a partir de um valor existente. Percorra cada ponto ou divida o período em subintervalos menores:

```js
import { dateRange } from 'native-dates';

const sprint = dateRange('2026-11-02', '2 weeks');

sprint.end.toString(); // '2026-11-15'
sprint.every('week').map(String); // ['2026-11-02', '2026-11-09']
sprint.split(1, 'week').length; // 2
```
