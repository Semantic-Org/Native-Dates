---
source: "5365132bf9e2"
title: Migrando do Moment
lede: Saia do Moment e do moment-timezone para valores imutáveis com tokens nativos e sem base de fusos no bundle.
---

O Moment e o `moment-timezone` sustentaram o trabalho com datas em JavaScript por anos, mas cobraram o preço em objetos mutáveis, meses numerados a partir de zero e pacotes pesados de fusos horários.

Migrar para o Native Dates elimina clones defensivos e o excesso de peso no bundle, permitindo atualizar repositórios grandes um módulo por vez.

## Todo valor é imutável

No Moment, somar dias ou ir para o início do mês muta a instância original. Passar uma data compartilhada para uma função auxiliar pode corromper silenciosamente o estado de quem chamou, a menos que todo mundo se lembre de chamar `.clone()`.

Aqui, todo valor é imutável. Métodos como [`plus()`](/api/date-time/#plus) e [`in()`](/api/date-time/#in) sempre retornam uma nova instância e preservam a original intacta.

```js
import { date } from 'native-dates';

const start = date('2026-11-16');
const deadline = start.plus(7, 'days');

start.toString(); // '2026-11-16'
deadline.toString(); // '2026-11-23'
```

:::tip[Remova chamadas defensivas de clone]
Você pode apagar toda chamada a `.clone()` durante a migração. Os aliases imutáveis `add()` e `subtract()` também existem, então chamadas aritméticas já existentes continuam funcionando.
:::

## Tipos dedicados e meses de 1 a 12

O Moment coloca todos os conceitos em uma única classe e numera meses de 0 a 11, em que o mês 10 significa novembro. Aqui, `month` é uma propriedade direta que vai de 1 a 12.

Escolha [`date()`](/api/date-fn/) para datas de calendário, [`datetime()`](/api/datetime-fn/) para instantes em um fuso horário e as fábricas do núcleo para [horários](/api/time-fn/), [meses de cobrança](/api/year-month-fn/) e [datas recorrentes](/api/month-day-fn/):

```js
import { date, datetime, monthDay, yearMonth } from 'native-dates';

const invoiceDate = date(2026, 11, 16);
invoiceDate.month; // 11, novembro

const sentAt = datetime('2026-11-16T17:30:00Z', 'America/New_York');
sentAt.hour; // 12

const billing = yearMonth('2026-11');
const birthday = monthDay('10/17');
```

## Sem dados de fuso horário no bundle

O `moment-timezone` envia a própria cópia da base IANA para o navegador.

O núcleo lê as regras de fuso horário diretamente dos motores `Temporal` e `Intl` do ambiente. Qualquer fuso IANA funciona de imediato, e [`@native-dates/plugins/zones`](/plugins/zones/) acrescenta busca por cidades e siglas em inglês quando o código passa nomes como `Berlin` ou `Pacific Time`.

```js
import { datetime } from 'native-dates';

const kickoff = datetime('2026-11-16T09:30', 'America/Los_Angeles');

kickoff.in('Europe/London').format('short', 'en-GB'); // '16/11/2026, 17:30'
kickoff.in('Asia/Tokyo').format('short', 'en-US'); // '11/17/26, 2:30 AM'
```

## Tokens, presets e intervalos no núcleo

[Padrões de tokens](/guides/formatting/#token-patterns) do Moment, presets localizados de `'LT'` a `'llll'`, expressões relativas e [intervalos](/api/ranges/) funcionam todos no núcleo, sem nenhum plugin:

```js
import { dateRange, datetime } from 'native-dates';

const kickoff = datetime('2026-11-16T09:30', 'America/Los_Angeles');
kickoff.format('YYYY-MM-DD HH:mm'); // '2026-11-16 09:30'
kickoff.format('LLL', 'en-US'); // 'November 16, 2026 at 9:30 AM'
kickoff.from('2026-11-16T07:30-08:00', 'en-US'); // 'in 2 hours'

const quarter = dateRange('2026-10-01', '2026-12-31');
quarter.contains('2026-11-16'); // true
quarter.overlaps(dateRange('2026-12-15', '2027-01-15')); // true
```

## Referência comparativa

| Moment | Native Dates | Notas |
|---|---|---|
| `moment()` | `now()` ou `today()` | Distinção explícita entre instante e data de calendário |
| `moment.tz(str, zone)` | `datetime(str, zone)` | Integrado no núcleo, sem base de fusos no bundle |
| `m.clone().add(7, 'days')` | `d.plus(7, 'days')` | Sempre imutável, e o alias `add()` também funciona |
| `m.tz('Europe/Berlin')` | `dt.in('Europe/Berlin')` | Exibe o mesmo instante em outro fuso horário |
| `m.month()`, `m.date()` | `d.month`, `d.day` | Propriedades diretas com meses de 1 a 12 |
| `m.day()`, `m.isoWeekday()` | `d.dayOfWeek` | Padrão ISO de 1 (segunda) a 7 (domingo), com tokens `'E'` para 1–7 e `'d'` para 0–6 |
| `m.unix()`, `m.valueOf()` | `dt.epochSeconds`, `dt.epochMilliseconds` | Cada contagem desde 1970 deixa explícita a unidade |
| `b.diff(a, 'hours', true)` | `a.until(b, 'hours')` | Total fracionário na unidade solicitada |
| `moment.duration(2, 'h')` | `hours(2)` ou `duration('2h')` | Helpers de duração no núcleo |
| `m.format('LLL')` | `dt.format('LLL')` | Presets localizados de `'LT'` a `'llll'` sem arquivos de idioma |
| `m.format('YYYY-MM-DD HH:mm')` | `dt.format('YYYY-MM-DD HH:mm')` | [Padrões de tokens](/guides/formatting/#token-patterns) |
| `m.isBetween(a, b)` | `dateRange(a, b).contains(d)` | [Intervalos](/api/ranges/) com `to()`, `for()` e `overlaps()` |
| `m.fromNow()`, `m.from(other)` | `dt.fromNow()`, `dt.from(other)` | [Expressões relativas](/guides/formatting/#relative-phrases) |
| Interpretação de strings não ISO | `{ loose: true }` | Carregue [`@native-dates/plugins/loose`](/plugins/loose/) para interpretar strings informais e dependentes de idioma |

## Migração incremental

Bases de código grandes raramente migram em um único pull request. Chame [`toJSDate()`](/api/date-time/#tojsdate) nas fronteiras que ainda esperam um `Date` nativo do JavaScript e passe essas datas de volta para [`datetime()`](/api/datetime-fn/) na entrada.

```js
import { datetime } from 'native-dates';

const sentAt = datetime('2026-11-16T17:30:00Z', 'America/New_York');
const legacy = sentAt.toJSDate();
const restored = datetime(legacy, 'America/New_York');
```

Quando funções que consomem esses valores ainda chamam getters legados como `getFullYear()` diretamente, importe o plugin [`legacy-date`](/plugins/legacy-date/).

Os getters leem os campos no fuso horário da própria instância e mantêm meses numerados a partir de zero para compatibilidade imediata. Setters que mutam a instância lançam erro na hora, expondo mutações ocultas logo nos testes.

```js
import '@native-dates/plugins/legacy-date';
import { datetime } from 'native-dates';

const dt = datetime('2026-11-16T09:30', 'America/Los_Angeles');

dt.getFullYear(); // 2026
dt.getMonth(); // 10, igual a Date.prototype.getMonth()
dt.getHours(); // 9, em America/Los_Angeles
```
