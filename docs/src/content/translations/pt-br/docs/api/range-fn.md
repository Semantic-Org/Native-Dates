---
source: "7f0f623e1e92"
title: dateRange()
lede: Crie um DateRange, DateTimeRange ou TimeRange a partir de extremos, durações ou strings de intervalo.
---

## Criar intervalos

As funções independentes constroem [intervalos](/api/ranges/) a partir de entradas brutas, pares de extremos ou uma única string de intervalo. Quando você já tem uma instância tipada, chame [`to()`](/api/ranges/#to) ou [`range()`](/api/ranges/#range) diretamente nela.

:::entry
### `dateRange()` :kind[function]

```js signature
dateRange(start, end, options?): DateRange
dateRange(interval, options?): DateRange
```

Cria um [`DateRange`](/api/ranges/#daterange) inclusivo entre duas datas de calendário. Quando o segundo argumento é uma duração (como `'7 days'` em inglês ou `days(7)`), o último dia fica seis dias após a data inicial para que o período cubra sete dias no total.

```js title="dates.js"
import { dateRange, days } from 'native-dates';

const fromEnds = dateRange('2026-09-01', '2026-09-07');
const fromLength = dateRange('2026-09-01', days(7));
const fromInterval = dateRange('2026-09-01/2026-09-07');

fromEnds.duration.days; // 7
fromLength.toString(); // '2026-09-01/2026-09-07'
fromInterval.equals(fromEnds); // true
```

**Parâmetros**

```params
- name: start
  type: CalendarDateInput | string
  required: true
  description: Data inicial, ou uma string de intervalo completa quando `end` é omitido.
- name: end
  type: CalendarDateInput | DurationInput | ReadOptions
  description: Data final inclusiva, duração do período ou objeto de opções quando `start` é uma string de intervalo.
- name: options
  type: Zone | ReadOptions
  description: Fuso horário ou opções de leitura aplicadas ao interpretar os extremos.
  options:
    - name: zone
      type: Zone
      description: Fuso horário usado para extrair dias de calendário de strings de instante ou objetos `Date`.
    - name: locale
      type: Locale
      description: Tag de locale BCP 47 mantida no intervalo retornado e em seus extremos.
    - name: loose
      type: boolean
      default: 'false'
      description: "Interpretação de strings de data informais com retorno `null` em entradas ilegíveis usando `@native-dates/plugins/loose`."
    - name: dayFirst
      type: boolean
      description: "Substituição da ordem numérica de data do locale ativo no modo loose."
```

**Retorno**

```returns
type: DateRange
description: "Um `DateRange` inclusivo, ou `null` quando o modo loose não consegue interpretar um extremo."
```
:::

:::entry
### `datetimeRange()` :kind[function]

```js signature
datetimeRange(start, end, options?): DateTimeRange
datetimeRange(interval, options?): DateTimeRange
```

Cria um [`DateTimeRange`](/api/ranges/#datetimerange) semiaberto que inclui o instante inicial e exclui o instante final. Quando a entrada final não traz um fuso horário explícito, ela é lida no fuso do instante inicial.

**Parâmetros**

```params
- name: start
  type: DateTimeInput | string
  required: true
  description: Instante inicial, ou uma string de intervalo quando `end` é omitido.
- name: end
  type: DateTimeInput | DurationInput | ReadOptions
  description: Instante final exclusivo, duração do período ou objeto de opções para uma string de intervalo.
- name: options
  type: Zone | ReadOptions
  description: Fuso horário ou opções de leitura como `zone`, `locale` ou `loose` aplicadas a ambos os extremos.
```

**Retorno**

```returns
type: DateTimeRange
description: "Um `DateTimeRange` semiaberto, ou `null` quando o modo loose não consegue interpretar um extremo."
```

```js
import { datetimeRange } from 'native-dates';

const meeting = datetimeRange('2026-09-01T09:00', '90m', 'America/New_York');
meeting.end.format('short', 'en-US'); // '9/1/26, 10:30 AM'

const zoned = datetimeRange('2026-09-01T09:00[America/New_York]/2026-09-01T10:30[America/New_York]');
zoned.start.zone; // 'America/New_York'
```
:::

:::entry
### `timeRange()` :kind[function]

```js signature
timeRange(start, end, options?): TimeRange
timeRange(interval, options?): TimeRange
```

Cria um [`TimeRange`](/api/ranges/#timerange) semiaberto entre duas horas do dia, excluindo o horário final. Quando o horário final é anterior ao inicial no relógio, o intervalo atravessa a meia-noite.

**Parâmetros**

```params
- name: start
  type: TimeInput | string
  required: true
  description: Horário inicial, ou uma string de intervalo quando `end` é omitido.
- name: end
  type: TimeInput | DurationInput | ReadOptions
  description: Horário final exclusivo, duração de relógio ou objeto de opções para uma string de intervalo.
- name: options
  type: Zone | ReadOptions
  description: Fuso horário ou opções de leitura como `zone`, `locale` ou `loose` ao extrair horários de timestamps.
```

**Retorno**

```returns
type: TimeRange
description: "Um `TimeRange` semiaberto, ou `null` quando o modo loose não consegue interpretar um extremo."
```

```js
import { timeRange } from 'native-dates';

const office = timeRange('9am - 5pm');
const overnight = timeRange('22:00', '8h');

office.toString(); // '09:00:00/17:00:00'
overnight.toString(); // '22:00:00/06:00:00'
```
:::

## Strings de intervalo e modo loose

Strings de intervalo são divididas por uma barra ISO ou por separadores cercados por espaços. Barras dentro de nomes de fusos horários IANA entre colchetes permanecem intactas.

| Formato | Exemplo | Como é lido |
|---|---|---|
| Intervalo ISO com barra | `'2026-09-01/2026-09-07'`, `'09:00/17:00'` | Divide na `/` fora de nomes de fuso horário entre colchetes, correspondendo à saída de [`toString()`](/api/ranges/#tostring). |
| Hífen ou meia-risca com espaços | `'9am - 5pm'`, `'2026/09/01 - 2026/09/07'` | Divide primeiro em `-` ou `–` cercado por espaços, preservando hífens e barras internos das datas. |
| Separador `to` em inglês | `'2026-09-01 to 2026-09-07'` | Divide na palavra inglesa ` to ` cercada por espaços. |
| Início e duração | `dateRange('2026-09-01', '7d')`, `timeRange('9am', '90m')` | Lê o segundo argumento como duração quando é uma [`Duration`](/api/duration/), objeto de campos ou expressão de duração em inglês. |

Com o [plugin `loose`](/plugins/loose/) carregado, o modo loose interpreta extremos informais e retorna `null` quando algum extremo não pode ser lido:

```js
import { dateRange } from 'native-dates';
import '@native-dates/plugins/loose';

dateRange('Sep 1, 2026 to Sep 7, 2026', { loose: true })?.toString();
// '2026-09-01/2026-09-07'

dateRange('not a range', { loose: true }); // null
```
