---
source: "450f88efed26"
title: Migrando do Day.js
lede: Substitua objetos dayjs() e cadeias de plugins por tipos dedicados e fusos horários no núcleo.
---

O Day.js encapsula o `Date` do JavaScript em um único objeto `dayjs()` e adiciona fusos horários, UTC, intervalos e durações por meio de plugins. Ao migrar para o Native Dates, você mantém o estilo leve e imutável, mas ganha tipos dedicados no núcleo para datas de calendário, horários, instantes, datas parciais, intervalos e durações.

## Escolher entre date() e datetime()

No Day.js, tanto uma data de nascimento quanto um timestamp de API passam por `dayjs()`.

Aqui, datas de calendário usam [`date()`](/api/date-fn/) ou [`today()`](/api/date-fn/#today), enquanto [meses de cobrança](/api/year-month-fn/) e [datas recorrentes](/api/month-day-fn/) têm fábricas próprias para datas parciais no núcleo.

Instantes reais na linha do tempo usam [`datetime()`](/api/datetime-fn/) ou [`now()`](/api/datetime-fn/#now):

```js
import { date, datetime, monthDay, now, today, yearMonth } from 'native-dates';

const current = now(); // substitui dayjs() para um instante
const due = today().plus(2, 'weeks'); // substitui dayjs().add(2, 'week') para uma data
const created = datetime('2026-11-16T17:30:00Z');
const birthday = date('2026-05-10');
const billing = yearMonth('2026-11');
const recurring = monthDay('05-10');
```

Os nomes clássicos de soma e subtração (`add()` e `subtract()`) também funcionam como aliases se o seu código já os usa. Passar um valor vazio para uma fábrica lança erro em vez de retornar silenciosamente o instante atual, revelando campos ausentes de API logo na entrada.

## Meses começam em 1

O Day.js herda meses numerados a partir de zero, em que janeiro é 0 e `.date()` retorna o dia do mês. Aqui, os campos de calendário são propriedades diretas e os meses vão de 1 a 12.

```js
import { date } from 'native-dates';

const d = date('2026-11-16');

d.year; // 2026
d.month; // 11, novembro
d.day; // 16
d.dayOfWeek; // 1, segunda-feira
```

:::warning[Verifique a numeração de meses e dias da semana]
O Day.js numera meses de 0 a 11 e começa a semana no domingo em 0. Aqui, `month` vai de 1 a 12 e `dayOfWeek` vai de 1 (segunda-feira) a 7 (domingo). Em padrões de tokens, `'E'` imprime o padrão ISO de 1 a 7, enquanto `'d'` mantém a numeração de 0 a 6 do Day.js.
:::

## Fusos horários, durações e intervalos no núcleo

O Day.js exige plugins separados para converter datas e horas entre fusos, construir durações ou testar se uma data cai dentro de um período. O núcleo já traz fusos horários IANA, [durações](/api/duration/) e [intervalos](/api/ranges/) sem configuração extra.

```js
import { dateRange, datetime, duration, hours } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
const berlin = standup.in('Europe/Berlin'); // substitui .tz('Europe/Berlin')

const span = duration('1h 30m').plus(hours(0.5));
span.total('minutes'); // 120

const november = dateRange('2026-11-01', '2026-11-30');
november.contains('2026-11-16'); // true
dateRange('2026-11-01', '2026-11-15').overlaps(november); // true
```

Em vez de passar strings com colchetes para controlar a inclusão dos extremos em `isBetween()`, intervalos de datas incluem os dois dias das pontas e intervalos de instantes ou horários excluem automaticamente o limite final.

## Presets e padrões de tokens

O núcleo oferece presets de `Intl`, formatos localizados do Day.js e [padrões de tokens](/guides/formatting/#token-patterns) diretamente em [`format()`](/api/date-time/#format), sem arquivos de idioma nem plugins:

```js
import { datetime } from 'native-dates';

const dt = datetime('2026-11-16T17:30:00Z', 'America/New_York');

dt.format('medium', 'en-US'); // 'Nov 16, 2026, 12:30 PM'
dt.format('LLL', 'en-US'); // 'November 16, 2026 at 12:30 PM'
dt.format('YYYY-MM-DD HH:mm'); // '2026-11-16 12:30'
```

## Plugins sob demanda

Apenas a interpretação de textos fora do padrão ISO, a busca por cidades e siglas de fuso e os getters legados de `Date` ficam em [`@native-dates/plugins`](/plugins/). Importe cada subcaminho uma vez na inicialização:

```js
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { date, datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'Berlin').zone; // 'Europe/Berlin'
date('Nov 16, 2026', { loose: true }); // CalendarDate(2026-11-16)
```

## Referência comparativa

| Day.js | Native Dates | Notas |
|---|---|---|
| `dayjs()` | `now()` ou `today()` | Escolha entre um instante exato ou uma data de calendário |
| `d.month()`, `d.date()` | `d.month`, `d.day` | Propriedades diretas com meses de 1 a 12 |
| `d.day()`, `d.isoWeekday()` | `d.dayOfWeek` | Padrão ISO de 1 (segunda) a 7 (domingo), com tokens `'E'` para 1–7 e `'d'` para 0–6 |
| `d.unix()`, `d.valueOf()` | `dt.epochSeconds`, `dt.epochMilliseconds` | Cada contagem desde 1970 deixa explícita a unidade |
| `d.add(2, 'day')` | `d.plus(2, 'days')` | Os aliases `add()` e `subtract()` também funcionam |
| `dayjs.tz(x, zone)` | `datetime(x, zone)` | No núcleo, sem plugin `timezone` |
| `d.tz(zone)` | `dt.in(zone)` | Exibe o mesmo instante em outro fuso horário IANA |
| `dayjs.utc(x)` | `datetime(x, 'UTC')` | No núcleo, sem plugin `utc` |
| `b.diff(a, 'day', true)` | `a.until(b, 'days')` | Total fracionário na unidade solicitada |
| `dayjs.duration(90, 'm')` | `minutes(90)` ou `duration('90m')` | No núcleo, sem plugin `duration` |
| `d.format('LLL')` | `dt.format('LLL')` | Presets localizados de `'LT'` a `'llll'` |
| `d.format('YYYY-MM-DD HH:mm')` | `dt.format('YYYY-MM-DD HH:mm')` | [Padrões de tokens](/guides/formatting/#token-patterns) no núcleo |
| `d.isBetween(a, b)` | `dateRange(a, b).contains(d)` | [Intervalos](/api/ranges/) com `to()`, `for()` e `overlaps()` |
| `d.fromNow()`, `d.from(other)` | `d.fromNow()`, `d.from(other)` | No núcleo, sem plugin `relativeTime` |
| `customParseFormat` | `{ loose: true }` | Fornecido por [`@native-dates/plugins/loose`](/plugins/loose/) |
