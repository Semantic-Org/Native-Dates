---
source: "ed93e959dec0"
title: Trabalhando com Temporal
lede: Como o Native Dates mapeia a API Temporal do JavaScript e interopera diretamente com valores Temporal.
---

O Native Dates envolve as APIs nativas `Temporal` e `Intl` do JavaScript.

O `Temporal` oferece primitivas exatas de calendário e fuso horário com objetos de opções explícitos. O Native Dates encapsula o uso do dia a dia em métodos enxutos, mantendo interoperabilidade total com instâncias `Temporal` puras.

## Como os tipos mapeiam para o Temporal

Cada classe principal envolve um tipo `Temporal` subjacente e devolve essa instância sempre que você precisar de controle de baixo nível:

| Tipo | Envolve | O que o Native Dates adiciona |
|---|---|---|
| [`DateTime`](/api/date-time/) | `Temporal.ZonedDateTime` | Interpreta instantes ISO, deslocamentos UTC, `Date` e timestamps numéricos em um único tipo com fuso horário e serializa em UTC |
| [`CalendarDate`](/api/calendar-date/) | `Temporal.PlainDate` | Combina com `at(time, zone)` e formata presets e padrões de tokens diretamente |
| [`Time`](/api/time/) | `Temporal.PlainTime` | Interpreta horários de 12 horas como `'9:30am'` além de horários ISO de 24 horas |
| [`Duration`](/api/duration/) | `Temporal.Duration` | Interpreta expressões em inglês como `'1h 30m'`, propaga unidades fracionárias e guarda as âncoras de `until()` |
| [`YearMonth`](/api/year-month/) | `Temporal.PlainYearMonth` | Classe dedicada para competências de cobrança e validade de cartões com [`monthYear()`](/api/year-month-fn/#monthyear) e `on()` |
| [`MonthDay`](/api/month-day/) | `Temporal.PlainMonthDay` | Classe dedicada para aniversários e datas recorrentes com [`dayMonth()`](/api/month-day-fn/#daymonth), `fallsOn()` e `next()` |

A especificação do `Temporal` não inclui intervalos. O núcleo adiciona [`DateRange`, `DateTimeRange` e `TimeRange`](/api/ranges/) sobre pares de limites para verificar se um valor está contido, detectar sobreposições e iterar passo a passo.

## Objetos Temporal como entrada

Todas as fábricas, métodos aritméticos e comparações aceitam valores `Temporal` diretamente.

```js
import { date, datetime, time, yearMonth } from 'native-dates';

const instant = Temporal.Instant.from('2026-11-16T17:30:00Z');
const standup = datetime(instant, 'America/Los_Angeles');

const plainDate = Temporal.PlainDate.from('2026-11-16');
date(plainDate).plus(Temporal.Duration.from({ weeks: 2 }));

const plainTime = Temporal.PlainTime.from('09:30');
time(plainTime).format('short', 'en-US'); // '9:30 AM'

const ym = yearMonth(Temporal.PlainYearMonth.from('2026-11'));
ym.daysInMonth; // 30
```

Passar um `Temporal.ZonedDateTime` para [`datetime()`](/api/datetime-fn/) preserva seu fuso horário, a menos que você informe outro. Ao passar um `Temporal.Instant` ou uma data e hora sem fuso, o valor é posicionado no fuso horário especificado ou no padrão configurado.

Valores e strings `Temporal` em calendários não ISO, como o japonês ou o persa, são convertidos para o mesmo dia ISO sem exigir uma chamada prévia a `withCalendar()`.

Comparações e medições de diferença também aceitam entradas `Temporal` diretamente:

```js
const berlin = Temporal.ZonedDateTime.from('2026-11-16T18:30:00+01:00[Europe/Berlin]');
standup.equals(berlin); // true
```

## Extrair o valor com toTemporal()

Chame [`toTemporal()`](/api/date-time/#totemporal) em qualquer valor para acessar sua instância `Temporal` subjacente.

Use esse método ao integrar bibliotecas de terceiros que esperam objetos `Temporal` ou ao trabalhar com sistemas de calendário não ISO.

```js
import { date } from 'native-dates';

const d = date('2026-11-16');
const plain = d.toTemporal(); // Temporal.PlainDate

const japanese = plain.withCalendar('japanese');
japanese.era; // 'reiwa'
japanese.eraYear; // 8
```

:::note[Extração sem cópia]
Cada instância guarda internamente um objeto `Temporal` real, portanto `toTemporal()` retorna essa referência diretamente, sem reinterpretar nem alocar uma cópia.
:::

## Polyfill para ambientes antigos

Versões atuais de Chrome, Edge, Firefox, Node 26+, Deno e Bun já trazem `Temporal` nativamente, por isso o núcleo não embute nenhum polyfill.

Para Safari, navegadores antigos ou Node 22–25, carregue `@native-dates/polyfill` junto com `temporal-polyfill` na inicialização (ele também fornece um fallback para `Intl.DurationFormat` no Node 22–23). Veja [Suporte ao Safari e a versões mais antigas do Node](/guides/installation/#supporting-safari-and-older-node) para a configuração e opções de carregamento síncrono.
