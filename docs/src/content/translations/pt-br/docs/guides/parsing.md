---
source: "326d94af83a9"
title: Interpretação
lede: Interprete strings ISO, durações, intervalos e entradas livres de usuários sem suposições silenciosas.
---

O núcleo interpreta entradas padrão e inequívocas diretamente para o tipo que você pediu:

- [`datetime()`](/api/datetime-fn/) para instantes no tempo, milissegundos epoch e timestamps
- [`date()`](/api/date-fn/) para datas de calendário sem relógio nem fuso horário
- [`time()`](/api/time-fn/) para horários de 24 horas e de 12 horas
- [`duration()`](/api/duration-fn/) para frases de unidades em inglês e durações ISO 8601
- [`yearMonth()`](/api/year-month-fn/) e [`monthDay()`](/api/month-day-fn/) para meses de cobrança, validades de cartão e aniversários recorrentes
- [`dateRange()`](/api/range-fn/#daterange), [`datetimeRange()`](/api/range-fn/#datetimerange) e [`timeRange()`](/api/range-fn/#timerange) para intervalos e pares de extremos

## Datas ISO e timestamps

Passe para `date()` uma string começando pelo ano (ano-mês-dia), três números de ano, mês e dia, ou um objeto de campos. Strings começando pelo ano aceitam meses e dias com um ou dois dígitos e qualquer separador exceto letras latinas ou dois-pontos. Datas em chinês, japonês, coreano e separadas por pontos com espaços são lidas diretamente no núcleo.

Os meses vão de 1 a 12. Datas impossíveis no calendário, como 30 de fevereiro, e strings ISO de semana ou trimestre, como `'2026-W05-1'`, lançam erro em vez de chutar um valor.

```js
import { date } from 'native-dates';

date('2026-11-16');
date('2026/11/6');
date('2026年11月16日');
date('2026. 11. 16.');
date(2026, 11, 16);
date({ year: 2026, month: 11, day: 16 });
```

Passe strings ISO 8601 ou objetos de campos para `datetime()`. Um `Z` ou deslocamento UTC numérico no final fixa o instante exato, enquanto uma string sem deslocamento é interpretada como data e hora locais no fuso horário de destino.

```js
import { datetime } from 'native-dates';

datetime('2026-11-16T17:30:00Z', 'America/Los_Angeles'); // 9:30 AM PST
datetime('2026-11-16T09:30', 'America/Los_Angeles'); // 9:30 AM PST
datetime('2026-11-16T09:30[Europe/Berlin]'); // 9:30 AM CET
datetime({ year: 2026, month: 11, day: 16, hour: 9, minute: 30 }, 'Europe/Berlin');
```

Passar um timestamp com deslocamento para `date()` ou `time()` extrai a data de calendário ou o horário local no fuso horário que você pediu:

```js
import { time } from 'native-dates';

date('2026-11-17T01:30:00Z', 'America/Los_Angeles'); // 2026-11-16
date('2026-11-17T01:30:00Z', 'Asia/Tokyo'); // 2026-11-17
time('2026-11-17T01:30:00Z', 'America/Los_Angeles'); // 17:30:00
```

## Horários e durações

Passe para `time()` horários ISO de 24 horas, strings no formato hora-minuto como `'14h30'`, horários de 12 horas, argumentos numéricos ou um objeto de campos. Uma hora isolada como `'14h'` continua lançando erro para não se confundir com durações.

```js
import { time } from 'native-dates';

time('09:30');
time('14h30');
time('9:30am');
time('5:15 PM');
time(17, 15, 30);
time({ hour: 9, minute: 30 });
```

Passe para `duration()` frases com unidades em inglês (como `'1h 30m'` ou `'2 weeks and 3 days'`), strings de duração ISO 8601, uma quantidade e unidade em inglês ou um objeto de campos.

```js
import { duration } from 'native-dates';

duration('1h 30m');
duration('2 weeks and 3 days');
duration('PT90M');
duration(90, 'minutes');
duration({ hours: 1, minutes: 30 });
```

## Datas parciais e intervalos

Passe strings ISO de ano e mês para [`yearMonth()`](/api/year-month-fn/), ou interprete validades de cartão começando pelo mês com [`monthYear()`](/api/year-month-fn/#monthyear):

```js
import { dayMonth, monthDay, monthYear, yearMonth } from 'native-dates';

yearMonth('2026-11');
monthYear('11/28'); // YearMonth(2028-11)

monthDay('10/17');
dayMonth('17/10'); // MonthDay(10-17)
```

Datas recorrentes sem ano funcionam da mesma maneira com [`monthDay()`](/api/month-day-fn/) e [`dayMonth()`](/api/month-day-fn/#daymonth). Para períodos, as [funções de intervalo](/api/range-fn/) interpretam dois extremos ou uma única string de intervalo:

```js
import { dateRange, timeRange } from 'native-dates';

dateRange('2026-11-01/2026-11-07');
timeRange('9am - 5pm');
```

## Timestamps epoch, Date e Temporal

Milissegundos epoch, instâncias nativas de `Date` do JavaScript e objetos [Temporal](/guides/temporal/) entram diretamente em `datetime()`.

Passar um número solto para uma função de data lança erro por ambiguidade. Converta milissegundos epoch para um instante em um fuso horário primeiro e depois acesse a data de calendário.

```js
import { date, datetime } from 'native-dates';

const fromEpoch = datetime(1794850200000, 'UTC');
const fromJSDate = datetime(new Date('2026-11-16T17:30:00Z'));
const localDay = date(new Date('2026-11-16T17:30:00Z'), 'America/Los_Angeles');
```

## Por que strings ambíguas lançam erro

Enquanto um ano com quatro dígitos no início tem uma única leitura, `'03/05/2026'` significa 5 de março nos Estados Unidos e 3 de maio na Europa e na América Latina. O núcleo recusa strings numéricas ambíguas em vez de escolher o mês errado em produção.

:::warning[Valores ausentes nunca assumem o instante atual]
Passar um valor vazio para qualquer função de criação lança erro em vez de retornar a data atual, evitando que um campo ausente da API se passe por hoje. Chame [`now()`](/api/datetime-fn/#now) ou [`today()`](/api/date-fn/#today) quando quiser o relógio atual.
:::

## Entrada do usuário com o plugin loose

Para interpretar texto livre digitado por usuários, exportações CSV ou cabeçalhos RFC 2822, importe [`@native-dates/plugins/loose`](/plugins/loose/) e passe `{ loose: true }`. O modo loose interpreta datas e horários do jeito que o locale ativo escreve, incluindo nomes de meses localizados, períodos do dia, horários com ponto e algarismos não ASCII.

```js
import '@native-dates/plugins/loose';
import { date, datetime, monthDay, time, yearMonth } from 'native-dates';

date('Nov 16, 2026', { loose: true }); // 2026-11-16
date('16 de noviembre de 2026', { loose: true, locale: 'es' }); // 2026-11-16
datetime('Mon, 16 Nov 2026 17:30:00 GMT', { loose: true });
time('오후 2:30', { loose: true, locale: 'ko' }); // 14:30:00
yearMonth('Nov 2026', { loose: true }); // 2026-11
monthDay('17 février', { loose: true, locale: 'fr' }); // 02-17
```

Datas numéricas com barra ou ponto seguem a ordem do locale ativo. Passe `dayFirst` por chamada ou defina-o na [configuração da aplicação](/api/configure/) quando a entrada usar uma ordem diferente do locale ativo.

```js
date('03/05/2026', { loose: true, locale: 'en-US' }); // 2026-03-05
date('03/05/2026', { loose: true, locale: 'fr' }); // 2026-05-03
date('03/05/2026', { loose: true, locale: 'en-US', dayFirst: true }); // 2026-05-03
```

Na interpretação em modo loose, entradas ilegíveis retornam `null` em vez de lançar erro em todas as funções de criação e intervalos. Valores inválidos de opção, como um nome de fuso horário desconhecido, continuam lançando erro.

```js
import { duration } from 'native-dates';

date('not a date', { loose: true }); // null
duration('soon', { loose: true }); // null
```

Quando as entradas seguem um layout conhecido fora do padrão ISO, como exportações CSV (`'24112026'`), logs de servidor ou datas por semana e ordinais, importe [`@native-dates/plugins/parse`](/plugins/parse/) e passe `{ format }` para fazer correspondência determinística por tokens em vez de interpretação heurística.

```js
import '@native-dates/plugins/parse';
import { date, datetime } from 'native-dates';

date('24112026', { format: 'DDMMYYYY' }); // 2026-11-24
datetime('24/Nov/2026:12:40:01 -0500', { format: 'DD/MMM/YYYY:HH:mm:ss ZZ' });
```
