---
source: "1ff5dd8e887b"
title: Coreano
lede: Interprete datas coreanas com pontos e formate dias da semana e feriados lunares.
---

Use `'ko-KR'` ao configurar a [Localização](/guides/localization/) para formatar datas em coreano. Os presets coreanos imprimem pontos espaçados com ponto final, como `'2026. 11. 16.'`, e posicionam *오전* ou *오후* antes da hora.

## Datas com pontos e strings em coreano

Datas coreanas com pontos espaçados e ponto final, bem como strings com unidades em hangul, são interpretadas diretamente no núcleo sem plugins:

```js
import { date, datetime, yearMonth } from 'native-dates';

date('2026. 11. 16.').toString(); // '2026-11-16'
date('2026년 11월 16일').toString(); // '2026-11-16'
datetime('2026. 11. 16. 14:30', 'Asia/Seoul').toString(); // '2026-11-16T05:30:00.000Z'
yearMonth('2026년 11월').toString(); // '2026-11'
```

Importe [o plugin loose](/plugins/loose/) com idioma coreano para interpretar datas curtas com ano de dois dígitos no início, horários com *오전* / *오후* e pares mês-dia em hangul:

```js
import '@native-dates/plugins/loose';
import { date, monthDay, time } from 'native-dates';

date('26. 5. 5.', { loose: true, locale: 'ko' })?.toString(); // '2026-05-05'
date('12.11.26', { loose: true, locale: 'ko' })?.toString(); // '2012-11-26'
time('오후 2:30', { loose: true, locale: 'ko' })?.toString(); // '14:30:00'
monthDay('11월 16일', { loose: true })?.toString(); // '11-16'
```

Passe sempre `locale: 'ko'` ao ler anos de dois dígitos, já que `'12.11.26'` é interpretado como 11 de dezembro de 2026 em um ambiente configurado em inglês dos EUA:

| Entrada | Resultado | Tratamento |
|---|---|---|
| `'2026. 11. 16.'`, `'2026년 11월 16일'` | Interpretado no núcleo | Passe diretamente sem plugin. |
| `'26. 5. 5.'`, `'12.11.26'`, `'오후 2:30'` | Interpretado no modo loose | Importe o plugin loose e passe `{ loose: true, locale: 'ko' }`. |

## Dias da semana entre parênteses e posição de AM/PM

O preset `'full'` imprime o nome completo do dia da semana, como *화요일* para terça-feira. O preset `'llll'` e opções com dia da semana curto colocam o caractere único entre parênteses e ligam intervalos com um til:

```js
import { date, dateRange } from 'native-dates';

const holiday = date('2026-05-05').locale('ko-KR');

holiday.format('llll'); // '2026년 5월 5일 (화)'
holiday.format({ month: 'long', day: 'numeric', weekday: 'short' });
// '5월 5일 (화)'

const week = dateRange('2026-11-16', '2026-11-20');
week.format({ month: 'long', day: 'numeric', weekday: 'short' }, 'ko-KR');
// '11월 16일 (월)~20일 (금)'
```

Caracteres hangul passam direto nos padrões de tokens sem colchetes. Os tokens de mês curto e dia ordinal já incluem *월* e *일*, e `'ddd'` formata o dia da semana em um caractere:

```js
import { datetime } from 'native-dates';

const slot = datetime('2026-05-05T14:05:00', 'Asia/Seoul').locale('ko-KR');

slot.format('YYYY. MM. DD. (ddd)'); // '2026. 05. 05. (화)'
slot.format('YYYY년 M월 D일 A h시 m분'); // '2026년 5월 5일 오후 2시 5분'
slot.format('MMM Do (dd)'); // '5월 5일 (화)'
```

O coreano coloca *오전* (AM) e *오후* (PM) antes da hora. Passe `'ko-KR-u-hc-h23'` para alternar presets de 12 horas para o relógio de 24 horas:

```js
slot.format('medium'); // '2026. 5. 5. 오후 2:05'
slot.format('medium', 'ko-KR-u-hc-h23'); // '2026. 5. 5. 14:05'
```

## Horário padrão da Coreia e aliases de fuso

O núcleo aceita `'Asia/Seoul'` e deslocamentos fixos. Importe [o plugin zones](/plugins/zones/) para resolver `KST`, cidades coreanas como `Busan` e nomes em hangul diretamente, inclusive siglas embutidas em strings no modo loose:

```js
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T14:30', 'KST').zone; // 'Asia/Seoul'
datetime('2026-11-16T14:30', '서울').zone; // 'Asia/Seoul'
datetime('2026-11-16T14:30', 'Busan').zone; // 'Asia/Seoul'
datetime('2026. 11. 16. 14:30 KST', { loose: true, zone: 'UTC' })?.toString();
// '2026-11-16T05:30:00.000Z'
```

Nomes curtos de fuso em coreano exibem `GMT+9`, enquanto `'zzz'` imprime o nome completo *한국 표준시*. Como servidores em UTC continuam no dia anterior até 8h59 na Coreia, passe Seul para [`today()`](/api/date-fn/#today):

```js
import { datetime, today } from 'native-dates';

const meeting = datetime('2026-11-16T05:30:00Z', 'Asia/Seoul').locale('ko-KR');

meeting.text; // '2026년 11월 16일 오후 2:30 GMT+9'
meeting.format('A h:mm zzz'); // '오후 2:30 한국 표준시'
today('Asia/Seoul');
```

## Calendários iniciados no domingo e semana útil na segunda

A tag `'ko-KR'` inicia a semana no domingo, como nos calendários de parede. Já semanas úteis, fechamentos financeiros e `weekOfYear` ISO contam a partir de segunda-feira:

```js
import { date, weekdayNames } from 'native-dates';

const sun = date('2026-11-15').locale('ko-KR');

sun.weekStart; // 7
sun.startOf('week').toString(); // '2026-11-15'
sun.weekOfYear; // 46
weekdayNames('short', undefined, 'ko-KR');
// ['일', '월', '화', '수', '목', '금', '토']
weekdayNames('short', 'monday', 'ko-KR');
// ['월', '화', '수', '목', '금', '토', '일']
```

Passe `'monday'` em cada chamada, fixe o primeiro dia na [configuração](/api/configure/) ou use `'ko-KR-u-fw-mon'` para manter textos em coreano com semanas começando na segunda:

```js
const wed = date('2026-11-18').locale('ko-KR-u-fw-mon');

wed.weekStart; // 1
wed.startOf('week').toString(); // '2026-11-16'
```

## Datas relativas e feriados lunares

Datas de calendário em coreano retornam *그저께* para anteontem e *모레* para depois de amanhã. [`DateTime`](/api/date-time/) retorna *지금* (“agora”) para diferença zero e unidades contadas nos demais casos:

```js
import { date, datetime } from 'native-dates';

const day = date('2026-11-16').locale('ko-KR');
day.minus(2, 'days').from(day); // '그저께'
day.plus(2, 'days').from(day); // '모레'

const moment = datetime('2026-11-16T12:00', 'Asia/Seoul').locale('ko-KR');
moment.minus(2, 'days').from(moment); // '2일 전'
```

Passe `'ko-KR-u-ca-dangi'` para Seollal, Chuseok e aniversários lunares, incluindo meses intercalares como *윤6월*. Presets curtos imprimem o número de 1 a 60 do ciclo em vez do ano, então prefira `'long'` ou opções de mês e dia:

```js
const chuseok = date('2026-09-25');
const leapDay = date('2025-07-25');

chuseok.format('long', 'ko-KR-u-ca-dangi'); // '병오년 8월 15일'
chuseok.format({ month: 'long', day: 'numeric' }, 'ko-KR-u-ca-dangi'); // '8월 15일'
leapDay.format('long', 'ko-KR-u-ca-dangi'); // '을사년 윤6월 1일'
```

:::tip[Formatação de datas lunares recorrentes]
[`MonthDay`](/api/month-day/) e [`YearMonth`](/api/year-month/) permanecem no calendário gregoriano mesmo quando recebem uma tag lunar. Formate aniversários e feriados lunares a partir do [`CalendarDate`](/api/calendar-date/) gregoriano daquele ano.
:::
