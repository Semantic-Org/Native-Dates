---
source: "6291509fd7f2"
title: Meses e dias
lede: Armazene um mês sem dia ou um aniversário recorrente sem ano.
---

Em JavaScript puro, guardar a validade de um cartão significa colar um dia 1º fictício no final. Guardar um aniversário sem o ano de nascimento obriga você a escolher um ano bissexto de mentira, como 2000. [`YearMonth`](/api/year-month/) e [`MonthDay`](/api/month-day/) armazenam apenas as partes que realmente existem.

## Meses de cobrança e validades de cartão

Use [`yearMonth()`](/api/year-month-fn/) para strings ISO ou números de ano e mês, e [`monthYear()`](/api/year-month-fn/#monthyear) para validades de cartão no formato 11/28:

```js
import { monthYear, yearMonth } from 'native-dates';

const billing = yearMonth('2026-11');
const expiry = monthYear('11/28');

billing.daysInMonth; // 30
billing.quarter; // 4
expiry.isPast('UTC'); // false
```

Verifique se uma data cai dentro de um mês com [`contains()`](/api/year-month/#contains), avance meses ou trimestres com [`plus()`](/api/year-month/#plus) e selecione um dia específico com [`on()`](/api/year-month/#on):

```js
billing.contains('2026-11-16'); // true
billing.plus(3, 'months').toString(); // '2027-02'
yearMonth('2026-02').on(31).toString(); // '2026-02-28'
yearMonth('2028-02').on(31).toString(); // '2028-02-29'
```

O dia 31 se ajusta automaticamente ao último dia de meses mais curtos, incluindo 29 de fevereiro em anos bissextos.

## Aniversários e feriados anuais

Use [`monthDay()`](/api/month-day-fn/) para strings no formato mês/dia e [`dayMonth()`](/api/month-day-fn/#daymonth) para strings no formato dia/mês. Como o nome da função define a ordem, `05/10` significa a mesma coisa em qualquer ambiente:

```js
import { dayMonth, monthDay } from 'native-dates';

const birthday = monthDay('10/17');
const european = dayMonth('17/10');

birthday.equals(european); // true
birthday.in(2027).toString(); // '2027-10-17'
```

Encontre a próxima ocorrência ou a mais recente a partir de hoje ou de qualquer data de referência com [`next()`](/api/month-day/#next) e [`previous()`](/api/month-day/#previous):

```js
birthday.next('2026-05-01').toString(); // '2026-10-17'
birthday.next('2026-10-17').toString(); // '2027-10-17'
birthday.previous('2026-10-17').toString(); // '2025-10-17'
```

Em anos não bissextos, 29 de fevereiro passa para 28 de fevereiro. Chame [`fallsOn()`](/api/month-day/#fallson) para verificar se uma data corresponde:

```js
const leapDay = monthDay(2, 29);

leapDay.in(2027).toString(); // '2027-02-28'
leapDay.fallsOn('2027-02-28'); // true
leapDay.fallsOn('2028-02-28'); // false
leapDay.fallsOn('2028-02-29'); // true
```

## Conversão entre meses, dias e datas completas

Acesse `.yearMonth` ou `.monthDay` diretamente em qualquer data ou instante, ou chame [`as()`](/api/date-time/#as) no meio de um encadeamento:

```js
import { date, datetime } from 'native-dates';

const invoice = date('2026-11-16');
invoice.yearMonth.toString(); // '2026-11'
invoice.monthDay.toString(); // '11-16'

datetime('2026-11-01T02:00:00Z', 'America/Los_Angeles').as('yearMonth').toString();
// '2026-10'
```

No sentido inverso, chame `on()` com um dia em um `YearMonth`, ou [`in()`](/api/month-day/#in) com um ano em um `MonthDay`, para obter uma data de calendário completa.

## Formatação e armazenamento

Os dois tipos formatam via `.text` e [`format()`](/api/year-month/#format), e geram strings ISO com [`toString()`](/api/year-month/#tostring):

```js
import { monthDay, yearMonth } from 'native-dates';

yearMonth('2026-11').format('long', 'en-US'); // 'November 2026'
yearMonth('2026-05').format('long', 'ru'); // 'май 2026 г.'
monthDay('10-17').format('long', 'en-US'); // 'October 17'

yearMonth('2026-11').toString(); // '2026-11'
monthDay('10/17').toString(); // '10-17'
```

Strings como `2026-11` e `10-17` podem ser salvas diretamente no banco de dados ou na URL e interpretadas de volta por `yearMonth()` e `monthDay()`.
