---
source: "e681c4b680b0"
title: monthDay()
lede: Leia uma string de mês e dia, números, campos ou uma data como MonthDay.
---

## Ler meses e dias

:::entry
### `monthDay()` :kind[function]

```js signature
monthDay(input, options?): MonthDay
monthDay(input, zone?): MonthDay
monthDay(month, day): MonthDay
```

Cria um [`MonthDay`](/api/month-day/) a partir de uma string no formato mês-dia, números de mês (1 a 12) e dia, um objeto de campos ou uma data existente. O dia 29 de fevereiro é aceito para que aniversários e datas comemorativas em anos bissextos sejam preservados.

```js title="birthday.js"
import { datetime, monthDay } from 'native-dates';

const fromIso = monthDay('10-17');
const fromSlash = monthDay('10/17');
const fromNumbers = monthDay(2, 29);
const fromFields = monthDay({ month: 10, day: 17 });
const fromInstant = monthDay(datetime('2026-10-18T02:00:00Z'), 'America/Los_Angeles');

fromNumbers.toString(); // '02-29'
fromInstant.toString(); // '10-17'
```

**Parâmetros**

```params
- name: input
  type: MonthDayInput | number | string
  required: true
  description: String com o mês primeiro, objeto de campos, data ou timestamp, ou `month` de 1 a 12.
- name: options
  type: Zone | MonthDayOptions | number | string
  description: Fuso horário ou objeto de opções, ou `day` inteiro de 1 a 31 ao passar dois números.
  options:
    - name: zone
      type: Zone
      description: Fuso horário usado para ler o mês e o dia de uma string de instante, `DateTime` ou `Date`.
    - name: locale
      type: Locale
      description: Tag de locale BCP 47 mantida no `MonthDay` retornado e em todos os valores derivados dele.
    - name: dayFirst
      type: boolean
      default: 'false'
      description: "Leitura com o dia primeiro para strings com barra, ponto ou hífen com números de um dígito, equivalente a `dayMonth()`."
    - name: loose
      type: boolean
      default: 'false'
      description: "Interpretação de nomes de meses em inglês ou no locale ativo como `'17 février'` com retorno `null` em entradas ilegíveis usando `@native-dates/plugins/loose`."
```

**Retorno**

```returns
type: MonthDay
description: "Um `MonthDay` sem ano, ou `null` quando o modo loose não consegue interpretar `input`."
```

Com o [plugin `loose`](/plugins/loose/) carregado, o modo loose interpreta nomes de meses em inglês ou no `locale` ativo e retorna `null` diante de entradas ilegíveis:

```js
import { monthDay } from 'native-dates';
import '@native-dates/plugins/loose';

monthDay('Oct 17', { loose: true })?.toString(); // '10-17'
monthDay('17 février', { loose: true, locale: 'fr' })?.toString(); // '02-17'
monthDay('whenever', { loose: true }); // null
```
:::

:::entry
### `dayMonth()` :kind[function]

```js signature
dayMonth(input, options?): MonthDay
dayMonth(day, month): MonthDay
```

Lê strings e números no formato dia-mês, na ordem usada no Brasil e na maior parte do mundo, como `'17/10'`. Chamar essa função sempre lê o dia antes do mês, independentemente das configurações globais.

Strings ISO de dois dígitos separadas por hífen, como `'10-17'`, continuam sendo lidas com o mês primeiro em ambas as funções. Isso garante que dados em JSON sempre sejam lidos de volta como a mesma data em qualquer lugar.

**Parâmetros**

```params
- name: input
  type: MonthDayInput | number | string
  required: true
  description: String com o dia primeiro como `'17/10'`, qualquer `MonthDayInput`, ou `day` inteiro de 1 a 31.
- name: options
  type: Zone | MonthDayOptions | number | string
  description: Fuso horário, opções de leitura incluindo `locale`, ou `month` de 1 a 12 ao passar dois números.
```

**Retorno**

```returns
type: MonthDay
description: "Um `MonthDay`, ou `null` quando o modo loose não consegue interpretar `input`."
```

```js
import { dayMonth } from 'native-dates';

dayMonth('17/10').toString(); // '10-17'
dayMonth('06.05').toString(); // '05-06'
dayMonth(17, 10).toString(); // '10-17'
dayMonth('10-17').toString(); // '10-17'
```
:::

## Entradas aceitas

Strings numéricas sem ano nunca são enviadas ao parser nativo de `Date`. Isso evita inventar um ano padrão não bissexto ou avançar dias inválidos para o mês seguinte.

| Entrada | Exemplo | Como é lida |
|---|---|---|
| String ISO de mês e dia | `'10-17'`, `'--10-17'` | Lê mês e dia de dois dígitos com o mês primeiro tanto em [`monthDay()`](#monthday) quanto em [`dayMonth()`](#daymonth). |
| String com par numérico | `'10/17'`, `'17.10'`, `'5-6'` | Lê valores separados por `/`, `.` ou `-`, com o mês primeiro em `monthDay()` e o dia primeiro em `dayMonth()`. |
| Dois números | `monthDay(10, 17)`, `dayMonth(17, 10)` | Recebe inteiros na ordem mês-e-dia ou dia-e-mês. |
| Objeto de campos | `{ month: 10, day: 17 }` | Lê campos de mês (1 a 12) e dia e rejeita pares impossíveis como 31 de abril. |
| Data ou timestamp | `'1990-10-17'`, `datetime(...)`, `new Date()` | Extrai o mês e o dia de calendário no fuso horário informado ou configurado e descarta o ano. |
| Nome de mês no modo loose | `'Oct 17'`, `'17 février'` | Lê nomes de meses em inglês ou no locale ativo e ordinais em qualquer ordem no modo loose. |
| Valor Temporal | `Temporal.PlainMonthDay`, `Temporal.PlainDate` | Encapsula diretamente valores Temporal ISO 8601. |

:::tip[Ler o mês e o dia de hoje]
Consulte o mês e o dia atuais em qualquer fuso horário com [`today()`](/api/date-fn/#today), como em `today('Europe/Berlin').monthDay`.
:::
