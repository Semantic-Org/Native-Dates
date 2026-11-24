---
source: "91937c1bc2c8"
title: yearMonth()
lede: Leia uma string ISO de ano e mês, validade de cartão, números ou uma data como YearMonth.
---

## Ler anos e meses

:::entry
### `yearMonth()` :kind[function]

```js signature
yearMonth(input, options?): YearMonth
yearMonth(input, zone?): YearMonth
yearMonth(year, month): YearMonth
```

Cria um [`YearMonth`](/api/year-month/) a partir de uma string no formato ano-mês, números de ano e mês (de 1 a 12), um objeto de campos ou qualquer data ou timestamp descartando o dia. Entradas ausentes lançam `TypeError` em vez de assumir o mês atual.

```js title="billing.js"
import { datetime, yearMonth } from 'native-dates';

const fromIso = yearMonth('2026-11');
const fromNumbers = yearMonth(2026, 11);
const fromFields = yearMonth({ year: 2026, month: 11 });
const fromDate = yearMonth('2026-11-16');
const fromInstant = yearMonth(datetime('2026-11-01T02:00:00Z'), 'America/Los_Angeles');

fromNumbers.toString(); // '2026-11'
fromInstant.toString(); // '2026-10'
```

**Parâmetros**

```params
- name: input
  type: YearMonthInput | number | string
  required: true
  description: String ISO de ano e mês, objeto de campos, data ou timestamp, ou `year` do calendário.
- name: options
  type: Zone | ReadOptions | number | string
  description: Fuso horário ou objeto de opções ao ler um timestamp ou string no modo loose, ou `month` de 1 a 12.
  options:
    - name: zone
      type: Zone
      description: Fuso horário usado para determinar o mês de calendário de uma string de instante, `DateTime` ou `Date`.
    - name: locale
      type: Locale
      description: Tag de locale BCP 47 mantida no `YearMonth` retornado e em todos os valores derivados dele.
    - name: loose
      type: boolean
      default: 'false'
      description: "Interpretação de nomes de meses em inglês ou no locale ativo como `'février 2026'` com retorno `null` em entradas ilegíveis usando `@native-dates/plugins/loose`."
```

**Retorno**

```returns
type: YearMonth
description: "Um `YearMonth` sem dia, ou `null` quando o modo loose não consegue interpretar `input`."
```

Com o [plugin `loose`](/plugins/loose/) carregado, o modo loose interpreta nomes de meses em inglês ou no `locale` ativo acompanhados de um ano de quatro dígitos e retorna `null` diante de strings ilegíveis:

```js
import { yearMonth } from 'native-dates';
import '@native-dates/plugins/loose';

yearMonth('Nov 2026', { loose: true })?.toString(); // '2026-11'
yearMonth('février 2026', { loose: true, locale: 'fr' })?.toString(); // '2026-02'
yearMonth('not-a-month', { loose: true }); // null
```
:::

:::entry
### `monthYear()` :kind[function]

```js signature
monthYear(input, options?): YearMonth
monthYear(month, year): YearMonth
```

Lê strings e números no formato mês-ano, na ordem impressa em cartões de pagamento, como `'11/26'`. Anos de dois dígitos entre 0 e 99 são somados a [`YearMonth.century`](/api/year-month/#properties), cujo padrão é 2000.

Strings ISO escritas como `'2026-11'` continuam sendo lidas com o ano primeiro em ambas as funções, garantindo que valores serializados possam sempre ser lidos de volta sem ambiguidade.

**Parâmetros**

```params
- name: input
  type: YearMonthInput | number | string
  required: true
  description: String de validade de cartão como `'11/26'`, qualquer `YearMonthInput`, ou `month` de 1 a 12.
- name: options
  type: Zone | ReadOptions | number | string
  description: Fuso horário, opções de leitura incluindo `locale`, ou `year` de dois ou quatro dígitos ao passar dois números.
```

**Retorno**

```returns
type: YearMonth
description: "Um `YearMonth`, ou `null` quando o modo loose não consegue interpretar `input`."
```

```js
import { monthYear } from 'native-dates';

monthYear('11/26').toString(); // '2026-11'
monthYear('05/2028').toString(); // '2028-05'
monthYear(11, 26).toString(); // '2026-11'
monthYear('2026-11').toString(); // '2026-11'
```
:::

## Entradas aceitas

Os meses vão de 1 para janeiro até 12 para dezembro em números, strings e objetos de campos.

| Entrada | Exemplo | Como é lida |
|---|---|---|
| String no formato ano-mês | `'2026-11'`, `'2026/11'`, `'2026年11月'` | Lê um ano de 4 dígitos e um mês de 1 ou 2 dígitos com qualquer separador que não seja letra latina nem dois-pontos. |
| String de validade de cartão | `monthYear('11/26')`, `monthYear('11.2026')` | Lê o mês primeiro separado por `/`, `-` ou `.` e expande anos de 2 dígitos com `YearMonth.century`. |
| Dois números | `yearMonth(2026, 11)`, `monthYear(11, 26)` | Recebe inteiros na ordem ano-e-mês ou mês-e-ano. |
| Objeto de campos | `{ year: 2026, month: 11 }` | Lê campos de calendário (mês de 1 a 12) e rejeita meses fora desse intervalo. |
| Data ou timestamp | `'2026-11-16'`, `datetime(...)`, `new Date()` | Extrai o mês de calendário no fuso horário informado ou no padrão configurado e descarta o dia. |
| Nome de mês no modo loose | `'Nov 2026'`, `'février 2026'` | Lê nomes de meses em inglês ou no locale ativo acompanhados de um ano de 4 dígitos no modo loose. |
| Valor Temporal | `Temporal.PlainYearMonth`, `Temporal.PlainDate` | Encapsula diretamente valores Temporal ISO 8601. |

:::tip[Ler o mês atual]
Consulte o mês de calendário atual em qualquer fuso horário com [`today()`](/api/date-fn/#today), como em `today('Asia/Tokyo').yearMonth`.
:::
