---
source: "8e9d9ff9bd0c"
title: Intervalos
lede: Trabalhe com períodos entre duas datas, horários ou instantes, de verificações de sobreposição a intervalos formatados.
---

Um [intervalo](/api/ranges/) representa um período com início e fim, como uma reserva de hotel, o horário de funcionamento de uma loja ou uma reunião agendada. Cada tipo de tempo tem sua própria classe de intervalo para que dias de calendário continuem sendo dias de calendário e intervalos de horários nunca ganhem uma data fictícia.

## Criação de intervalos

Crie um intervalo diretamente com [`dateRange()`](/api/range-fn/), [`timeRange()`](/api/range-fn/#timerange) ou [`datetimeRange()`](/api/range-fn/#datetimerange). Cada função aceita dois extremos, um início e uma duração (com unidades em inglês, como `'2 weeks'` ou `'90m'`), ou uma única string de intervalo:

```js
import { dateRange, datetimeRange, timeRange } from 'native-dates';

const sprint = dateRange('2026-05-01', '2 weeks');
const trip = dateRange('2026-09-01', '2026-09-07');
const hours = timeRange('9am - 5pm');
const meeting = datetimeRange('2026-09-01T09:00', '90m', 'America/New_York');
```

Quando você já tem uma data, um horário ou um instante tipado, encadeie [`for()`](/api/ranges/#to), [`to()`](/api/ranges/#to) ou [`range()`](/api/ranges/#range) diretamente nele:

```js
import { today } from 'native-dates';

const upcoming = today().for(2, 'weeks');
const thisMonth = today().range('month');
```

## Datas inclusivas e horários semiabertos

Intervalos de datas incluem o dia final, pois de 1º a 7 de setembro compreende todos os sete dias. Já intervalos de horários e de datas e horas excluem o limite final para que blocos consecutivos nunca colidam:

```js
import { dateRange, timeRange } from 'native-dates';

dateRange('2026-09-01', '2026-09-07').duration.days; // 7

const first = timeRange('9:00am', '10:00am');
const second = timeRange('10:00am', '11:00am');
first.overlaps(second); // false
```

Quando um intervalo de horários termina mais cedo do que começa, ele atravessa a meia-noite para cobrir turnos noturnos ou estabelecimentos abertos de madrugada:

```js
const nightShift = timeRange('22:00', '06:00');

nightShift.contains('02:30'); // true
nightShift.duration.hours; // 8
```

## Inclusão e sobreposição

Verifique se um ponto ou subintervalo está contido em um período com [`contains()`](/api/ranges/#contains), ou teste dois intervalos entre si com [`overlaps()`](/api/ranges/#overlaps) e [`intersection()`](/api/ranges/#intersection):

```js
import { dateRange } from 'native-dates';

const booking = dateRange('2026-11-10', '2026-11-18');
const holiday = dateRange('2026-11-15', '2026-11-22');

booking.contains('2026-11-14'); // true
booking.overlaps(holiday); // true
booking.intersection(holiday).toString(); // '2026-11-15/2026-11-18'
```

`intersection()` retorna `null` quando os dois intervalos não se sobrepõem.

## Percurso, contagem e divisão de intervalos

Chame [`every()`](/api/ranges/#every) para percorrer um intervalo e coletar cada data, horário ou instante ao longo do período. Em um intervalo de datas, chame [`count()`](/api/ranges/#count) para contar dias, dias úteis, fins de semana ou um dia específico da semana (usando filtros em inglês, como `'weekdays'`, `'weekends'` ou `'mondays'`):

```js
import { dateRange } from 'native-dates';

const sprint = dateRange('2026-05-01', '2 weeks');

sprint.every('week').map(String); // ['2026-05-01', '2026-05-08']
sprint.count(); // 14
sprint.count('weekdays'); // 10
sprint.count('mondays'); // 2
```

Chame [`split()`](/api/ranges/#split) quando quiser subintervalos em vez de pontos isolados, como dividir um turno em horários de agendamento ou uma sprint em blocos semanais:

```js
import { timeRange } from 'native-dates';

const morning = timeRange('9:00am', '12:00pm');
const slots = morning.split(30, 'minutes');

slots.length; // 6
slots[0].toString(); // '09:00:00/09:30:00'
```

## Formatação e serialização

Formatar um intervalo com um preset condensa meses e anos em comum segundo as regras do locale do runtime. Passe um padrão de tokens para formatar ambos os extremos explicitamente:

```js
import { dateRange, timeRange } from 'native-dates';

const week = dateRange('2026-09-01', '2026-09-07');

week.format('medium', 'en-US'); // 'Sep 1 – 7, 2026'
week.format('YYYY-MM-DD'); // '2026-09-01 – 2026-09-07'
timeRange('9:00am', '5:00pm').format('short', 'en-US'); // '9:00 AM – 5:00 PM'
```

Todo intervalo expõe sua duração em `.duration` e gera uma string de intervalo ISO 8601 com [`toString()`](/api/ranges/#tostring). Passar essa string de volta para a mesma função restaura o intervalo original:

```js
const raw = week.toString(); // '2026-09-01/2026-09-07'
dateRange(raw).equals(week); // true
```
