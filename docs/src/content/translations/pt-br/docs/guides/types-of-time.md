---
source: "8bfe5a8d41c8"
title: Tipos de tempo
lede: Escolha o tipo certo para uma data de calendário, uma hora do dia, um instante com fuso, uma data parcial, um intervalo ou uma duração.
---

O `Date` nativo do JavaScript usa o mesmo objeto para tudo, seja o aniversário de alguém, um alarme às 09:30 ou o segundo exato em que um pedido foi concluído.

Aqui, cada conceito tem seu próprio tipo, para que você trabalhe apenas com as partes que realmente existem:

- **[`CalendarDate`](/api/calendar-date/)** para um dia no calendário, como 10 de maio de 2026
- **[`Time`](/api/time/)** para uma hora do dia, como 09:30
- **[`DateTime`](/api/date-time/)** para um instante específico em um fuso horário
- **[`Duration`](/api/duration/)** para uma duração, como 2 horas ou 3 semanas
- **[`YearMonth`](/api/year-month/)** e **[`MonthDay`](/api/month-day/)** para um mês sem dia ou um dia recorrente sem ano
- **[Intervalos](/api/ranges/)** para um período entre duas datas, horários ou instantes

## CalendarDate

Use [`CalendarDate`](/api/calendar-date/) quando algo acontece em um dia, e não em um segundo específico: aniversários, datas de vencimento, feriados ou valores vindos de um seletor de data.

Crie uma instância com [`today()`](/api/date-fn/#today) ou [`date()`](/api/date-fn/):

```js
import { date, today } from 'native-dates';

const birthday = date('2026-05-10');
const due = today().plus(2, 'weeks');

birthday.month; // 5
birthday.day; // 10
```

Como uma data de calendário não tem relógio nem fuso horário, 10 de maio continua sendo 10 de maio para qualquer usuário, onde quer que ele esteja.

## Time

Use [`Time`](/api/time/) para uma hora do dia desvinculada de uma data específica, como o horário de funcionamento de uma loja ou um lembrete diário.

```js
import { time } from 'native-dates';

const opens = time('9:00am');
const closes = opens.plus(8, 'hours');

closes.hour; // 17
closes.format('short', 'en-US'); // '5:00 PM'
```

Somar horas além da meia-noite dá a volta normalmente no relógio de 24 horas, já que não há uma data associada para mudar de dia.

## DateTime

Use [`DateTime`](/api/date-time/) quando algo ocorre em um ponto real da linha do tempo: uma reunião, a decolagem de um voo ou um timestamp salvo no banco de dados.

Crie um instante com [`now()`](/api/datetime-fn/#now) ou [`datetime()`](/api/datetime-fn/), ou combine uma data de calendário com um horário:

```js
import { date, datetime, now } from 'native-dates';

const current = now();
const created = datetime('2026-11-16T17:30:00Z');
const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
```

Cada instante sabe exatamente quando algo acontece e em qual fuso horário você o está visualizando. Chame [`in()`](/api/date-time/#in) para ver o mesmo instante em outra cidade:

```js
standup.in('Europe/Berlin').format('time', 'en-US'); // '6:30 PM'
```

## Duration

Use [`Duration`](/api/duration/) para representar quanto tempo algo dura. Crie uma duração com auxiliares de unidade como [`hours()`](/api/duration-fn/#hours) ou passe uma frase com unidades em inglês para [`duration()`](/api/duration-fn/):

```js
import { days, duration, hours } from 'native-dates';

const call = hours(1.5);
const trial = days(14);
const turnaround = duration('2 weeks, 3 days');
```

Medir a distância entre dois valores também retorna uma duração:

```js
const opens = time('9:00am');
const lunch = time('12:30pm');

opens.until(lunch).format('long', 'en-US'); // '3 hours, 30 minutes'
```

## YearMonth

Use [`YearMonth`](/guides/months-and-days/#billing-months-and-card-expiries) quando um valor tem ano e mês sem dia, como um ciclo de cobrança, a validade de um cartão ou um campo de mês.

```js
import { monthYear, yearMonth } from 'native-dates';

const billing = yearMonth('2026-11');
const expiry = monthYear('11/28');

billing.daysInMonth; // 30
billing.on(15); // CalendarDate de 2026-11-15
```

Ele conta em meses e anos, e [`on()`](/api/year-month/#on) seleciona qualquer dia desse mês como uma data de calendário.

## MonthDay

Use [`MonthDay`](/guides/months-and-days/#birthdays-and-annual-holidays) para uma data recorrente sem ano, como um aniversário ou um feriado anual.

```js
import { monthDay } from 'native-dates';

const birthday = monthDay('10/17');

birthday.in(2026); // CalendarDate de 2026-10-17
birthday.fallsOn('2026-10-17'); // true
```

Em anos não bissextos, 29 de fevereiro cai automaticamente em 28 de fevereiro quando você chama [`fallsOn()`](/api/month-day/#fallson) ou [`in()`](/api/month-day/#in).

## Intervalos

Use [Intervalos](/guides/ranges/) para representar o período entre duas datas, horários ou instantes. Crie um diretamente com [`dateRange()`](/api/range-fn/#daterange), [`timeRange()`](/api/range-fn/#timerange) ou [`datetimeRange()`](/api/range-fn/#datetimerange):

```js
import { dateRange, timeRange } from 'native-dates';

const sprint = dateRange('2026-11-02', '2026-11-15');
const shift = timeRange('9:00am', '5:00pm');

sprint.contains('2026-11-10'); // true
shift.duration.hours; // 8
```

Intervalos de datas incluem o dia final, enquanto intervalos de horários e de datas e horas excluem o limite final para que blocos consecutivos nunca se sobreponham.

## Conversão entre tipos

Os tipos se conectam diretamente quando você adiciona ou descarta partes. Associe um horário a uma data de calendário com [`at()`](/api/calendar-date/#at) para obter um instante, ou crie um intervalo a partir de um valor existente com [`for()`](/api/ranges/#to) ou [`to()`](/api/ranges/#to):

```js
const reminder = today().plus(1, 'day').at('9:00am');
const upcoming = today().for(2, 'weeks');
```

No sentido inverso, acesse as propriedades de cada parte diretamente em qualquer instante ou data, ou chame [`as()`](/api/date-time/#as) no meio de um encadeamento:

```js
reminder.date; // CalendarDate de amanhã
reminder.time; // Time de 09:00:00
reminder.yearMonth; // YearMonth
reminder.monthDay; // MonthDay
reminder.in('Asia/Tokyo').as('time'); // Time em Tóquio
```

:::tip[DateTime ou CalendarDate?]
Pergunte-se se mudar de fuso horário deve alterar o que o usuário vê. Uma reunião às 09:30 em Los Angeles acontece às 18:30 em Berlim, então o tipo certo é `DateTime`. Um aniversário em 10 de maio continua sendo 10 de maio em qualquer lugar, então o tipo certo é `CalendarDate`.
:::
