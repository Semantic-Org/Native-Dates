---
source: "50f6c5cb4f97"
title: datetime()
lede: Crie um DateTime a partir de um timestamp, string, Date ou objeto de campos, ou leia o instante atual.
---

## Ler instantes

:::entry
### `datetime()` :kind[function]

```js signature
datetime(input, zone?): DateTime
datetime(input, options?): DateTime
```

Interpreta uma string, timestamp, objeto de campos ou data de calendário como um [`DateTime`](/api/date-time/) em um fuso horário. Omita o fuso horário para usar o [padrão configurado](/api/configure/) ou o fuso local do runtime.

```js title="read.js"
import { date, datetime } from 'native-dates';

const fromUtc = datetime('2026-11-16T17:30:00Z', 'America/Los_Angeles');
const fromWall = datetime('2026-11-16 09:30', 'Europe/Berlin');
const fromZone = datetime('2026-11-16T09:30[America/New_York]');
const fromEpoch = datetime(1794850200000, 'UTC');
const fromDate = datetime(date('2026-11-16'), 'America/New_York');
```

**Parâmetros**

```params
- name: input
  type: DateTimeInput
  required: true
  description: String ISO, timestamp Unix em milissegundos, `Date`, objeto de campos, data de calendário ou valor Temporal.
- name: zoneOrOptions
  type: Zone | ReadOptions
  description: String de fuso horário como `'Europe/Berlin'` ou `'UTC'`, ou um objeto de opções.
  options:
    - name: zone
      type: Zone
      description: Fuso horário de visualização do instante, sobrescrevendo qualquer fuso entre colchetes em `input`.
    - name: locale
      type: Locale
      description: Tag de locale BCP 47 mantida no `DateTime` retornado e em todos os valores derivados dele.
    - name: loose
      type: boolean
      default: 'false'
      description: "Interpretação de strings de data informais com retorno `null` em entradas ilegíveis usando `@native-dates/plugins/loose`."
    - name: dayFirst
      type: boolean
      description: "Substituição da ordem numérica de data do locale ativo para strings como `'07/09/2026'` no modo loose."
```

**Retorno**

```returns
type: DateTime
description: "Um `DateTime` no fuso horário resolvido, ou `null` quando o modo loose não consegue interpretar `input`."
```

Com [`@native-dates/plugins/loose`](/plugins/loose/) importado, o modo loose interpreta datas e horários informais no locale ativo, recorre ao parser do motor JS para formatos de máquina e retorna `null` diante de entradas ilegíveis:

```js
import { datetime } from 'native-dates';
import '@native-dates/plugins/loose';

datetime('Mon, 16 Nov 2026 17:30:00 GMT', { zone: 'America/New_York', loose: true });
datetime('not a timestamp', { loose: true }); // null
```
:::

### Entradas aceitas

Toda entrada gera uma instância imutável exibida no fuso horário de destino:

| Entrada | Exemplo | Como é lida |
|---|---|---|
| String ISO com deslocamento UTC | `'2026-11-16T17:30:00Z'`, `'2026-11-16 12:30-05:00'` | Fixa o instante exato e o exibe no fuso horário de destino. |
| String com fuso entre colchetes | `'2026-11-16T09:30[America/New_York]'` | Mantém o fuso entre colchetes, a menos que um segundo argumento de fuso o substitua. |
| Data e hora local | `'2026-11-16T09:30'`, `'2026年11月16日 14:30'` | Lê uma data no formato ano-mês-dia com horário diretamente no fuso de destino. |
| String de data ou [CalendarDate](/api/calendar-date/) | `'2026-11-16'`, `date(2026, 11, 16)` | Assume o início daquele dia de calendário no fuso de destino. |
| Milissegundos ou Date | `1794850200000`, `new Date()` | Converte o timestamp Unix para o fuso de destino, truncando frações de milissegundo como `Date`. |
| Objeto de campos | `{ year: 2026, month: 11, day: 16, hour: 9 }` | Lê campos de calendário (mês de 1 a 12) e de relógio no fuso de destino e rejeita datas impossíveis. |
| DateTime ou Temporal | `dt`, `Temporal.Instant`, `Temporal.ZonedDateTime` | Preserva o fuso existente, salvo quando um fuso explícito é passado. |

:::note[Valores ausentes nunca viram o instante atual]
Valores ausentes como `undefined` ou `null` lançam um erro para que uma coluna vazia do banco de dados nunca vire o instante atual por acidente. Chame [`now()`](#now) quando quiser o relógio em tempo real.
:::

## Instante atual e hoje

Leia o relógio atual ou monte limites de consulta para o dia de hoje em qualquer fuso horário.

:::entry
### `now()` :kind[function]

```js signature
now(zone?): DateTime
```

Retorna o instante atual com precisão de milissegundos no fuso horário informado ou no padrão configurado. Essa precisão coincide com `Date.now()`, garantindo que timestamps passem por JSON sem perda de dados.

**Parâmetros**

```params
- name: zone
  type: Zone
  description: Fuso horário de referência para o instante atual, como `'Asia/Tokyo'` ou `'UTC'`.
```

**Retorno**

```returns
type: DateTime
description: Um `DateTime` para o milissegundo atual em `zone`.
```

```js
import { now } from 'native-dates';

const local = now();
const tokyo = now('Asia/Tokyo');
const utc = now('UTC');
```
:::

:::entry
### `startOfToday()` :kind[function]

```js signature
startOfToday(zone?): DateTime
```

Retorna o início do dia de hoje no fuso horário informado, correspondendo ao começo do dia de calendário local. Útil como limite inferior ao consultar eventos ou registros criados hoje.

**Parâmetros**

```params
- name: zone
  type: Zone
  description: Fuso horário de referência para o dia atual.
```

**Retorno**

```returns
type: DateTime
description: Um `DateTime` no início do dia de hoje em `zone`.
```

```js
import { startOfToday } from 'native-dates';

const opens = startOfToday('America/New_York');
opens.hour; // 0
opens.minute; // 0
```
:::

:::entry
### `endOfToday()` :kind[function]

```js signature
endOfToday(zone?): DateTime
```

Retorna o último milissegundo do dia de hoje no fuso horário informado.

**Parâmetros**

```params
- name: zone
  type: Zone
  description: Fuso horário de referência para o dia atual.
```

**Retorno**

```returns
type: DateTime
description: Um `DateTime` às `23:59:59.999` na data de hoje em `zone`.
```

```js
import { endOfToday } from 'native-dates';

const cutoff = endOfToday('America/New_York');
cutoff.hour; // 23
cutoff.millisecond; // 999
```
:::
