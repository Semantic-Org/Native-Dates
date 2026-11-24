---
source: "af294e4ed659"
title: date()
lede: Crie uma CalendarDate a partir de uma string no formato ano-mês-dia, números de ano, mês e dia, campos ou do dia atual.
---

## Ler datas de calendário

:::entry
### `date()` :kind[function]

```js signature
date(input, options?): CalendarDate
date(input, zone?): CalendarDate
date(year, month, day): CalendarDate
```

Cria uma [`CalendarDate`](/api/calendar-date/) a partir de uma string no formato ano-mês-dia, três números inteiros (mês de 1 a 12), um objeto de campos ou uma data ou timestamp existente. Datas impossíveis como 30 de fevereiro lançam `RangeError` em vez de avançar para março.

```js title="create.js"
import { date, datetime } from 'native-dates';

const fromIso = date('2026-11-16');
const fromSlashes = date('2026/11/6');
const fromNumbers = date(2026, 11, 16);
const fromFields = date({ year: 2026, month: 11, day: 16 });
const fromMoment = date(datetime('2026-11-17T02:00:00Z', 'America/Los_Angeles'));

fromSlashes.toString(); // '2026-11-06'
fromMoment.toString(); // '2026-11-16'
```

**Parâmetros**

```params
- name: input
  type: CalendarDateInput | number
  required: true
  description: String de data ISO, objeto de campos, data ou timestamp existente, ou `year` de 4 dígitos.
- name: options
  type: Zone | ReadOptions | number
  description: Fuso horário ou objeto de opções ao ler um timestamp ou string no modo loose, ou `month` de 1 a 12.
  options:
    - name: zone
      type: Zone
      description: Fuso horário usado para determinar o dia de calendário de uma string de instante, `DateTime` ou `Date`.
    - name: locale
      type: Locale
      description: Tag de locale BCP 47 mantida na `CalendarDate` retornada e em todos os valores derivados dela.
    - name: loose
      type: boolean
      default: 'false'
      description: "Interpretação de strings de data informais com retorno `null` em entradas ilegíveis usando `@native-dates/plugins/loose`."
    - name: dayFirst
      type: boolean
      description: "Substituição da ordem numérica de data do locale ativo para strings como `'07.09.2026'` no modo loose."
- name: day
  type: number
  description: Dia do mês de 1 a 31 ao passar `year`, `month` e `day`.
```

**Retorno**

```returns
type: CalendarDate
description: "Uma `CalendarDate` sem relógio nem fuso horário, ou `null` quando o modo loose não consegue interpretar `input`."
```

Ao ler um timestamp ISO ou um `Date` nativo do JavaScript, passe um fuso horário para escolher de qual localidade extrair o dia de calendário:

```js
date('2026-11-17T02:00:00Z', 'America/Los_Angeles').toString(); // '2026-11-16'
date('2026-11-17T02:00:00Z', 'Asia/Tokyo').toString(); // '2026-11-17'
```
:::

### Entradas aceitas

Os meses sempre vão de 1 para janeiro até 12 para dezembro, ao contrário do construtor `Date` do JavaScript, que começa em zero. Entradas com ano e mês, mas sem dia, lançam `RangeError` em vez de assumir o primeiro dia do mês; para valores mensais, use [`yearMonth()`](/api/year-month-fn/).

| Entrada | Exemplo | Como é lida |
|---|---|---|
| String no formato ano-mês-dia | `'2026-11-16'`, `'2026/11/6'`, `'2026年11月16日'` | Lê um ano de 4 dígitos, mês e dia com qualquer separador que não seja letra latina nem dois-pontos. |
| String local de data e hora | `'2026-11-16T09:30'` | Mantém a data de calendário e descarta o horário. |
| String ISO de instante | `'2026-11-17T02:00:00Z'` | Extrai o dia de calendário daquele instante no fuso informado ou no padrão configurado. |
| Ano, mês e dia | `date(2026, 11, 16)` | Aceita três números inteiros com `1` para janeiro até `12` para dezembro. |
| Objeto de campos | `{ year: 2026, month: 11, day: 16 }` | Lê campos de calendário (mês de 1 a 12) e rejeita datas impossíveis. |
| [DateTime](/api/date-time/) | `date(dt, 'Asia/Tokyo')` | Extrai a data de calendário no fuso informado, ou em `dt.zone` quando omitido. |
| Date do JavaScript | `date(jsDate, 'America/Los_Angeles')` | Extrai o dia de calendário daquele timestamp no fuso informado ou no padrão configurado. |
| Valor Temporal | `Temporal.PlainDate`, `Temporal.Instant` | Lê datas simples de qualquer calendário como o mesmo dia ISO e converte instantes para o fuso de destino. |

:::note[Timestamps dependem do fuso horário]
Uma string ISO terminada em `Z` ou com deslocamento UTC identifica um instante que pode cair em dois dias de calendário diferentes ao redor do mundo. Passe um fuso explícito ao extrair a data de calendário de um usuário no servidor.
:::

## Dias relativos do calendário

A data de hoje depende de onde você está no mundo. Cada função auxiliar abaixo aceita um fuso horário opcional e usa o [padrão configurado](/api/configure/) quando nenhum fuso é informado.

:::entry
### `today()` :kind[function]

```js signature
today(zone?): CalendarDate
```

Retorna a data de calendário de hoje no fuso horário informado ou no padrão configurado. No fim da noite nas Américas, a Ásia e a Oceania já viraram a meia-noite e estão no dia seguinte.

**Parâmetros**

```params
- name: zone
  type: Zone
  description: Fuso horário de referência para ler a data atual, como `'Asia/Tokyo'` ou `'America/Los_Angeles'`.
```

**Retorno**

```returns
type: CalendarDate
description: A `CalendarDate` de hoje em `zone`.
```

```js
import { datetime, today } from 'native-dates';

const inLosAngeles = today('America/Los_Angeles');
const inTokyo = today('Asia/Tokyo');

// Às 02:00 UTC de 17 de novembro, ainda é 16 de novembro em Los Angeles, enquanto já é 17 de novembro em Tóquio
const moment = '2026-11-17T02:00:00Z';
datetime(moment, 'America/Los_Angeles').date.toString(); // '2026-11-16'
datetime(moment, 'Asia/Tokyo').date.toString(); // '2026-11-17'
```
:::

:::entry
### `tomorrow()` :kind[function]

```js signature
tomorrow(zone?): CalendarDate
```

Retorna a data de calendário de amanhã no fuso horário informado, um dia após [`today(zone)`](#today).

**Parâmetros**

```params
- name: zone
  type: Zone
  description: Fuso horário usado para avançar um dia a partir de hoje.
```

**Retorno**

```returns
type: CalendarDate
description: A `CalendarDate` de amanhã em `zone`.
```

```js
import { tomorrow } from 'native-dates';

const nextDay = tomorrow();
const londonTomorrow = tomorrow('Europe/London');
```
:::

:::entry
### `yesterday()` :kind[function]

```js signature
yesterday(zone?): CalendarDate
```

Retorna a data de calendário de ontem no fuso horário informado, um dia antes de [`today(zone)`](#today).

**Parâmetros**

```params
- name: zone
  type: Zone
  description: Fuso horário usado para recuar um dia a partir de hoje.
```

**Retorno**

```returns
type: CalendarDate
description: A `CalendarDate` de ontem em `zone`.
```

```js
import { yesterday } from 'native-dates';

const priorDay = yesterday();
const londonYesterday = yesterday('Europe/London');
```
:::
