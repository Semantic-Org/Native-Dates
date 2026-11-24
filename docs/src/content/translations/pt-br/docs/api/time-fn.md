---
source: "bb49ea92ac08"
title: time()
lede: Crie um Time a partir de uma string de horário de 12 ou 24 horas, números, campos ou um timestamp.
---

## Ler horários

:::entry
### `time()` :kind[function]

```js signature
time(input, options?): Time
time(input, zone?): Time
time(hour, minute?, second?): Time
```

Cria um [`Time`](/api/time/) a partir de uma string de horário, números inteiros de relógio, um objeto de campos ou um timestamp. Entradas ausentes lançam `TypeError` em vez de assumir o horário atual.

```js title="clock.js"
import { datetime, time } from 'native-dates';

const morning = time('9am');
const closing = time('5:30pm');
const iso = time('17:30:00');
const fromNumbers = time(9, 30);
const fromFields = time({ hour: 17, minute: 30, millisecond: 250 });
const fromInstant = time('2026-11-16T17:30:00Z', 'America/New_York');
const fromMoment = time(datetime('2026-11-16T17:30:00Z'), 'Europe/Berlin');
const fromTemporal = time(Temporal.PlainTime.from('08:15'));

closing.toString(); // '17:30:00'
fromInstant.toString(); // '12:30:00'
fromMoment.toString(); // '18:30:00'
```

**Parâmetros**

```params
- name: input
  type: TimeInput | number
  required: true
  description: String de horário, objeto de campos, horário ou timestamp existente, ou `hour` no formato 24 horas (0 a 23).
- name: options
  type: Zone | ReadOptions | number
  description: Fuso horário ou objeto de opções ao ler um timestamp ou string no modo loose, ou `minute` de 0 a 59.
  options:
    - name: zone
      type: Zone
      description: Fuso horário usado para extrair a hora do dia de uma string de instante, `DateTime` ou `Date`.
    - name: locale
      type: Locale
      description: Tag de locale BCP 47 mantida no `Time` retornado e em todos os valores derivados dele.
    - name: loose
      type: boolean
      default: 'false'
      description: "Interpretação de strings informais de data e hora com retorno `null` em entradas ilegíveis usando `@native-dates/plugins/loose`."
    - name: dayFirst
      type: boolean
      description: "Substituição da ordem numérica de data do locale ativo quando o modo loose interpreta uma string de data e hora."
- name: second
  type: number
  description: Número inteiro `second` de 0 a 59 ao passar números. Frações de segundo exigem string ou objeto de campos.
```

**Retorno**

```returns
type: Time
description: "Um `Time` representando uma hora do dia, ou `null` quando o modo loose não consegue interpretar `input`."
```

Com o [plugin `loose`](/plugins/loose/) carregado, o modo loose interpreta horários com períodos do dia localizados, horários com ponto em locales que usam esse formato e strings informais de timestamp, retornando `null` em entradas ilegíveis:

```js
import { time } from 'native-dates';
import '@native-dates/plugins/loose';

time('오후 2:30', { loose: true, locale: 'ko' })?.toString(); // '14:30:00'
time('14.30', { loose: true, locale: 'fi' })?.toString(); // '14:30:00'
time('Mon, 16 Nov 2026 17:30:00 GMT', {
  zone: 'America/New_York',
  loose: true,
})?.toString(); // '12:30:00'
time('whenever', { loose: true }); // null
```
:::

## Entradas aceitas

Strings no formato de 12 horas aceitam horas de 1 a 12 seguidas por AM ou PM. Meia-noite é 12 AM e meio-dia é 12 PM.

| Entrada | Exemplo | Como é lida |
|---|---|---|
| String de 12 horas | `'9am'`, `'5:30pm'`, `'12:15 a.m.'` | Lê horas de 1 a 12 com `am` ou `pm` e minutos, segundos e frações opcionais. |
| String de 24 horas | `'09:00'`, `'14h30'`, `'17:30:15.250'` | Lê horários de 24 horas separados por dois-pontos ou `h` entre hora e minuto, com precisão até nanossegundos. |
| String ISO de instante | `'2026-11-16T17:30:00Z'` | Extrai o horário local daquele instante no fuso horário informado ou no padrão configurado. |
| Números de relógio | `time(9)`, `time(9, 30)`, `time(17, 30, 15)` | Recebe inteiros para hora, minuto opcional e segundo opcional. |
| Objeto de campos | `{ hour: 9, minute: 30, millisecond: 250 }` | Lê campos de relógio no singular ou no plural e rejeita números fora do intervalo válido. |
| [DateTime](/api/date-time/) ou Temporal | `time(dt, 'Asia/Tokyo')`, `Temporal.PlainTime` | Extrai a hora do dia, convertendo instantes para o fuso horário informado. |
| Date do JavaScript | `time(jsDate, 'America/New_York')` | Extrai o horário daquele instante no fuso informado ou no padrão configurado. |

:::tip[Ler a hora do dia atual]
Consulte o relógio atual em qualquer fuso horário com [`now()`](/api/datetime-fn/#now), como em `now('Europe/Berlin').time`.
:::
