---
source: "a8aba5e485f9"
title: legacy-date
lede: Getters e formatadores somente leitura de Date.prototype em DateTime para migração gradual.
---

## Migração gradual de código com Date

Importe o plugin uma vez para adicionar getters somente leitura ao protótipo de [`DateTime`](/api/date-time/). Helpers, formatadores e componentes existentes que esperam métodos nativos passam a aceitar uma instância de `DateTime` diretamente enquanto você migra arquivo por arquivo.

```js title="legacy-date.js"
import '@native-dates/plugins/legacy-date';
import { datetime } from 'native-dates';

const moment = datetime('2026-09-06T14:30:15.250', 'America/New_York');

moment.getFullYear(); // 2026
moment.getMonth(); // 8 (setembro, indexado a partir de zero como em Date)
moment.getDate(); // 6
moment.getHours(); // 14 (em America/New_York, não no fuso do sistema)
moment.getUTCHours(); // 18
```

O `Date` nativo do JavaScript lê sempre os campos locais no fuso horário do sistema operacional. Já o `DateTime` avalia cada getter local e cada formatador de locale no próprio `zone` da instância.

:::warning[Meses a partir de zero e domingo = 0]
Os getters legados mantêm a numeração nativa para que chamadas existentes não quebrem silenciosamente. `getMonth()` vai de 0 a 11 e `getDay()` retorna 0 para domingo, enquanto as propriedades do núcleo contam meses a partir de 1 e dias da semana a partir de segunda-feira.
:::

## Getters com fuso horário e em UTC

Todos os getters padrão de leitura ficam disponíveis em qualquer instância de `DateTime`.

| Método | Retorno | Comportamento em DateTime |
|---|---|---|
| `getTime()` | `number` | Milissegundos desde a época Unix, idêntico a `dt.epochMilliseconds`. |
| `getFullYear()` | `number` | Ano de calendário de quatro dígitos em `dt.zone`. |
| `getMonth()` | `number` | Mês a partir de zero, de 0 (janeiro) a 11 (dezembro), em `dt.zone`. |
| `getDate()` | `number` | Dia do mês, de 1 a 31, em `dt.zone`. |
| `getDay()` | `number` | Dia da semana, de 0 (domingo) a 6 (sábado), em `dt.zone`. |
| `getHours()`, `getMinutes()`, `getSeconds()`, `getMilliseconds()` | `number` | Campos de relógio avaliados em `dt.zone`. |
| `getTimezoneOffset()` | `number` | Deslocamento em minutos a oeste de UTC para `dt.zone`, como `240` para `-04:00` ou `-330` para `+05:30`. |
| `getUTCFullYear()`, `getUTCMonth()`, `getUTCDate()`, `getUTCDay()` | `number` | Campos de calendário em UTC, com meses a partir de zero e domingo como 0. |
| `getUTCHours()`, `getUTCMinutes()`, `getUTCSeconds()`, `getUTCMilliseconds()` | `number` | Campos de relógio em UTC. |

```js
const kolkata = datetime('2026-01-06T09:00', 'Asia/Kolkata');

kolkata.getTimezoneOffset(); // -330
kolkata.getHours(); // 9
kolkata.getUTCHours(); // 3
```

## Métodos de string e de locale

Os métodos legados de string reproduzem a saída nativa, mas usam o fuso horário da própria instância como padrão na formatação por locale.

| Método | Retorno | Comportamento em DateTime |
|---|---|---|
| `toISOString()` | `string` | Timestamp UTC com precisão de milissegundos, mesmo quando a instância tem frações menores. |
| `toLocaleString(locales?, options?)` | `string` | Data e hora formatadas em `dt.zone` e [`dt.locale()`](/api/date-time/#locale), salvo quando sobrescritos. |
| `toLocaleDateString(locales?, options?)` | `string` | Parte de data formatada em `dt.zone` e `dt.locale()`, salvo quando sobrescritos. |
| `toLocaleTimeString(locales?, options?)` | `string` | Parte de horário formatada em `dt.zone` e `dt.locale()`, salvo quando sobrescritos. |

```js
const flight = datetime('2026-09-06T14:30:15.250', 'America/New_York');

flight.toISOString(); // '2026-09-06T18:30:15.250Z'
flight.toLocaleDateString('en-US'); // '9/6/2026'
flight.toLocaleTimeString('en-US'); // '2:30:15 PM'
flight.toLocaleTimeString('en-US', { timeZone: 'UTC' }); // '6:30:15 PM'
```

## Setters lançam erro ao tentar alterar a instância

As instâncias são imutáveis, então todo setter que altera a instância lança erro e orienta o uso de [`set()`](/api/date-time/#set) ou [`plus()`](/api/date-time/#plus).

| Grupo | Métodos bloqueados | Substituto imutável |
|---|---|---|
| Época | `setTime()` | Passe milissegundos Unix para [`datetime()`](/api/datetime-fn/). |
| Campos locais | `setFullYear()`, `setMonth()`, `setDate()`, `setHours()`, `setMinutes()`, `setSeconds()`, `setMilliseconds()` | Substitua campos em `dt.zone` com [`dt.set()`](/api/date-time/#set). |
| Campos UTC | `setUTCFullYear()`, `setUTCMonth()`, `setUTCDate()`, `setUTCHours()`, `setUTCMinutes()`, `setUTCSeconds()`, `setUTCMilliseconds()` | Converta para UTC antes com [`dt.in('UTC').set()`](/api/date-time/#in). |

```js
const reminder = datetime('2026-09-06T14:30Z');

try {
  reminder.setHours(9);
} catch (err) {
  err.code; // 'immutable'
}

const updated = reminder.set('hour', 9);
updated.hour; // 9
```

## Quando usar toJSDate

Uma instância de `DateTime` nunca falsifica `instanceof Date` nem a tag interna do objeto nativo. Ao passar um timestamp para uma biblioteca de gráficos, driver de banco de dados ou validador que verifica o tipo do objeto ou altera a instância recebida, chame [`toJSDate()`](/api/date-time/#tojsdate) do núcleo:

```js
const nativeDate = datetime('2026-09-06T14:30Z').toJSDate();
nativeDate instanceof Date; // true
```
