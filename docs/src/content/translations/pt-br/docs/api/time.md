---
source: "3e14665094ab"
title: Time
lede: Uma hora do dia sem data de calendário e sem fuso horário.
---

## Criar um Time

Interprete strings de relógio de 12 ou 24 horas, passe números de hora e minuto ou converta um valor existente com [`time()`](/api/time-fn/). As instâncias são imutáveis, portanto todo método que altera um valor retorna uma nova instância.

```js title="create.js"
import { time } from 'native-dates';

const morning = time('9:30am');
const evening = time('17:30');
const alarm = time(6, 45);
```

Extraia a hora local do dia de qualquer [`DateTime`](/api/date-time/) pela propriedade `time`:

```js
import { datetime, now } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
standup.time.toString(); // '09:30:00'
const currentClock = now().time;
```

## Propriedades

As propriedades leem os campos do relógio de 24 horas, de horas até nanossegundos.

| Propriedade | Tipo | Descrição |
|---|---|---|
| `text` | `string` | Hora do dia formatada no locale ativo, como `'9:30 AM'`. |
| `hour`, `minute`, `second` | `number` | Campos de relógio no formato de 24 horas (0–23, 0–59, 0–59). |
| `millisecond`, `microsecond`, `nanosecond` | `number` | Campos subsegundo do relógio (0–999). |

## Combinação e campos

Associe uma hora do dia a uma data de calendário ou substitua campos individuais do relógio.

:::entry
### `on()` :kind[method]

```js signature
t.on(date, zone?): DateTime
```

Combina esta hora do dia com uma data de calendário em um fuso horário e retorna um [`DateTime`](/api/date-time/). Espelha a chamada a [`at()`](/api/calendar-date/#at) em uma [`CalendarDate`](/api/calendar-date/).

**Parâmetros**

```params
- name: date
  type: CalendarDateInput
  required: true
  description: String de data ISO, `CalendarDate`, `DateTime`, objeto de campos ou `Date`.
- name: zone
  type: Zone
  description: Nome de fuso horário IANA, deslocamento UTC fixo ou `'UTC'`. Por padrão, o fuso horário configurado.
```

**Retorno**

```returns
type: DateTime
description: Novo `DateTime` na data `date`, neste horário, em `zone`.
```

```js
const opens = time('9:30am');

opens.on('2026-11-16', 'America/New_York').toString(); // '2026-11-16T14:30:00.000Z'
```
:::

:::entry
### `set()` :kind[method]

```js signature
t.set(fields): Time
t.set(unit, value): Time
```

Retorna um novo `Time` com um ou mais campos de relógio substituídos. Valores fora do intervalo válido, como minuto 75, lançam um `RangeError`.

**Parâmetros**

```params
- name: fields
  type: DateTimeFields | Unit
  required: true
  description: Objeto de campos de relógio ou o nome de uma única unidade ao passar `value`.
- name: value
  type: number
  description: Valor inteiro para a unidade `unit` informada.
```

**Retorno**

```returns
type: Time
description: Novo `Time` com os campos de relógio atualizados.
```

```js
const reminder = time('9:30am');

reminder.set('minute', 45).toString(); // '09:45:00'
reminder.set({ hour: 17, minute: 0 }).toString(); // '17:00:00'
```
:::

## Aritmética e arredondamento

Some ou subtraia unidades de relógio, alinhe a limites de unidade ou arredonde para um incremento. Unidades de calendário como dias e semanas lançam um `RangeError`, pois uma hora do dia não tem data.

:::note[Passagem pela meia-noite]
A aritmética de relógio dá a volta no ciclo de 24 horas como o mostrador de um relógio: somar 2 horas a 23:00 retorna 01:00. Combine o horário com uma data usando [`on()`](#on) primeiro quando cruzar a meia-noite precisar avançar o dia no calendário.
:::

:::entry
### `plus()` :kind[method]

```js signature
t.plus(amount, unit?): Time
t.add(amount, unit?): Time
```

Avança no relógio de 24 horas e retorna um novo `Time`, dando a volta após a meia-noite quando necessário. Também disponível pelo alias `add()`.

**Parâmetros**

```params
- name: amount
  type: DurationInput
  required: true
  description: Contagem combinada com `unit`, instância de `Duration`, string de duração em inglês ou ISO, objeto de campos ou milissegundos.
- name: unit
  type: Unit
  description: Nome da unidade de relógio em inglês quando `amount` é numérico, como `'hours'` ou `'minutes'`.
```

**Retorno**

```returns
type: Time
description: Novo `Time` no ciclo circular de 24 horas.
```

```js
time('9:00am').plus(90, 'minutes').toString(); // '10:30:00'
time('23:00').plus('2h').toString(); // '01:00:00'
```
:::

:::entry
### `minus()` :kind[method]

```js signature
t.minus(amount, unit?): Time
t.subtract(amount, unit?): Time
```

Recua no relógio de 24 horas, dando a volta antes da meia-noite quando necessário. Aceita as mesmas entradas que [`plus()`](#plus) e também está disponível pelo alias `subtract()`.

**Parâmetros**

```params
- name: amount
  type: DurationInput
  required: true
  description: Contagem combinada com `unit`, instância de `Duration`, string de duração em inglês ou ISO, objeto de campos ou milissegundos.
- name: unit
  type: Unit
  description: Nome da unidade de relógio em inglês quando `amount` é numérico.
```

**Retorno**

```returns
type: Time
description: Novo `Time` no ciclo circular de 24 horas.
```

```js
time('00:30').minus(45, 'minutes').toString(); // '23:45:00'
```
:::

:::entry
### `startOf()` :kind[method]

```js signature
t.startOf(unit): Time
```

Zera todos os campos de relógio menores que a unidade informada.

**Parâmetros**

```params
- name: unit
  type: Unit
  required: true
  description: Unidade de relógio, de `'hour'` até `'nanosecond'`.
```

**Retorno**

```returns
type: Time
description: Novo `Time` no início de `unit`.
```

```js
time('14:37:22').startOf('hour').toString(); // '14:00:00'
```
:::

:::entry
### `endOf()` :kind[method]

```js signature
t.endOf(unit): Time
```

Avança até o último milissegundo da unidade de relógio informada.

**Parâmetros**

```params
- name: unit
  type: Unit
  required: true
  description: Unidade de relógio, de `'hour'` até `'nanosecond'`.
```

**Retorno**

```returns
type: Time
description: Novo `Time` no último milissegundo de `unit`.
```

```js
time('14:37:22').endOf('hour').toString(); // '14:59:59.999'
```
:::

:::entry
### `startOfNext()` :kind[method]

```js signature
t.startOfNext(unit): Time
```

Avança para o início da unidade de relógio seguinte à que contém este horário, dando a volta na meia-noite. Sempre avança para a próxima unidade: chamar `startOfNext('hour')` em `14:00:00` retorna `15:00:00`.

**Parâmetros**

```params
- name: unit
  type: Unit
  required: true
  description: Unidade de relógio, de `'hour'` até `'nanosecond'`.
```

**Retorno**

```returns
type: Time
description: Novo `Time` no início da próxima unidade `unit`.
```

```js
time('14:37:22').startOfNext('hour').toString(); // '15:00:00'
time('23:37:22').startOfNext('hour').toString(); // '00:00:00'
```
:::

:::entry
### `startOfPrevious()` :kind[method]

```js signature
t.startOfPrevious(unit): Time
```

Recua para o início da unidade de relógio anterior à que contém este horário, dando a volta na meia-noite.

**Parâmetros**

```params
- name: unit
  type: Unit
  required: true
  description: Unidade de relógio, de `'hour'` até `'nanosecond'`.
```

**Retorno**

```returns
type: Time
description: Novo `Time` no início da unidade `unit` anterior.
```

```js
time('14:37:22').startOfPrevious('hour').toString(); // '13:00:00'
time('00:15:00').startOfPrevious('hour').toString(); // '23:00:00'
```
:::

:::entry
### `round()` :kind[method]

```js signature
t.round(unit): Time
t.round(increment, unit): Time
```

Arredonda para a unidade de relógio ou o incremento mais próximo, desempatando valores exatamente no meio para cima.

**Parâmetros**

```params
- name: increment
  type: number | Unit
  required: true
  description: Tamanho do passo que divide exatamente a unidade superior, ou a própria `unit` ao arredondar para `1`.
- name: unit
  type: Unit
  description: Unidade de relógio a arredondar, de `'hour'` até `'nanosecond'`.
```

**Retorno**

```returns
type: Time
description: Novo `Time` arredondado.
```

```js
const checkin = time('14:36:00');

checkin.round('hour').toString(); // '15:00:00'
checkin.round(15, 'minutes').toString(); // '14:30:00'
```
:::

:::entry
### `floor()` :kind[method]

```js signature
t.floor(unit): Time
t.floor(increment, unit): Time
```

Arredonda para baixo até o início de uma unidade de relógio ou incremento. Aceita os mesmos argumentos que [`round()`](#round).

```js
time('14:29').floor(15, 'minutes').toString(); // '14:15:00'
```
:::

:::entry
### `ceil()` :kind[method]

```js signature
t.ceil(unit): Time
t.ceil(increment, unit): Time
```

Arredonda para cima até a próxima unidade de relógio ou incremento. Aceita os mesmos argumentos que [`round()`](#round).

```js
time('14:01').ceil(15, 'minutes').toString(); // '14:15:00'
```
:::

## Comparação de horários

As comparações ordenam horários dentro de um único dia, da meia-noite até o final do dia. Operadores relacionais como `<` lançam um `RangeError`; compare valores usando métodos ou [`compare()`](/api/compare/).

:::entry
### `equals()` :kind[method]

```js signature
t.equals(other): boolean
```

Retorna `true` quando ambos os valores representam exatamente a mesma hora do dia.

**Parâmetros**

```params
- name: other
  type: TimeInput
  required: true
  description: Outro `Time` ou qualquer entrada aceita por `time()`.
```

**Retorno**

```returns
type: boolean
description: "`true` quando ambos os valores coincidem até o nanossegundo."
```

```js
time('5:30pm').equals('17:30'); // true
```
:::

:::entry
### `isBefore()` :kind[method]

```js signature
t.isBefore(other): boolean
```

Retorna `true` se este horário for mais cedo no dia do que o outro.

```js
time('9:00am').isBefore('5:00pm'); // true
```
:::

:::entry
### `isAfter()` :kind[method]

```js signature
t.isAfter(other): boolean
```

Retorna `true` se este horário for mais tarde no dia do que o outro.

```js
time('5:00pm').isAfter('9:00am'); // true
```
:::

:::entry
### `isSame()` :kind[method]

```js signature
t.isSame(other, unit?): boolean
```

Verifica se outro horário cai dentro da mesma unidade de relógio, como a mesma hora ou o mesmo minuto. Chamar `isSame()` sem unidade verifica igualdade exata.

**Parâmetros**

```params
- name: other
  type: TimeInput
  required: true
  description: Horário de comparação.
- name: unit
  type: Unit
  description: Unidade de relógio a comparar, como `'hour'` ou `'minute'`.
```

**Retorno**

```returns
type: boolean
description: "`true` quando ambos os horários compartilham a mesma unidade `unit`."
```

```js
time('9:05am').isSame('9:45am', 'hour'); // true
time('9:05am').isSame('10:05am', 'hour'); // false
```
:::

## Medição de períodos

:::entry
### `until()` :kind[method]

```js signature
t.until(other): Duration
t.until(other, unit): number
```

Mede o tempo com sinal deste horário até outro dentro do mesmo dia, retornando uma duração negativa quando o destino for mais cedo no dia. Passe o nome de uma unidade para obter o total como número.

**Parâmetros**

```params
- name: other
  type: TimeInput
  required: true
  description: Horário de destino até o qual medir.
- name: unit
  type: Unit
  description: Unidade de relógio usada para retornar o total como número de ponto flutuante.
```

**Retorno**

```returns
type: Duration | number
description: Uma `Duration` balanceada até horas, ou um número quando `unit` é informada.
```

```js
const opens = time('9:00am');
const closes = time('5:30pm');

opens.until(closes).format('long', 'en-US'); // '8 hours, 30 minutes'
opens.until(closes, 'hours'); // 8.5
time('22:00').until('02:00', 'hours'); // -20
```
:::

:::entry
### `since()` :kind[method]

```js signature
t.since(other): Duration
t.since(other, unit): number
```

Mede o tempo decorrido desde um horário mais cedo no mesmo dia. Passe o nome de uma unidade para obter o total como número.

```js
time('5:00pm').since('9:00am', 'hours'); // 8
```
:::

:::entry
### `to()` :kind[method]

```js signature
t.to(end): TimeRange
t.to(count, unit): TimeRange
t.for(length): TimeRange
t.for(count, unit): TimeRange
```

Cria um [`TimeRange`](/api/ranges/#timerange) semiaberto a partir deste horário até o horário final ou a duração decorrida (limite final exclusivo). Um horário final mais cedo do que o início cruza a meia-noite no ciclo de 24 horas. Use `for()` para informar uma duração explícita (horários finais e números sem unidade são recusados).

**Parâmetros**

```params
- name: end
  type: TimeInput | DurationInput | number
  required: true
  description: Horário de encerramento (exclusivo), duração de relógio ou contagem numérica `count` combinada com `unit`.
- name: unit
  type: Unit
  description: Nome da unidade de relógio em inglês quando o primeiro argumento é uma contagem numérica, como `'hours'` ou `'minutes'`.
```

**Retorno**

```returns
type: TimeRange
description: Um `TimeRange` semiaberto começando neste horário.
```

```js
time('9:00am').to('5:00pm').duration.hours; // 8
time('9:00am').for(90, 'minutes').end.toString(); // '10:30:00'
time('22:00').to('06:00').duration.hours; // 8
```
:::

## Formatação e conversão

:::entry
### `format()` :kind[method]

```js signature
t.format(spec?, locale?): string
```

Formata a hora do dia usando presets integrados, nomes personalizados de [`configure()`](/api/configure/), objetos de opções `Intl` ou padrões de tokens.

Os presets localizados `'LT'` e `'LTS'` já vêm integrados, e objetos de opções ignoram chaves de data e de fuso horário automaticamente. Consulte [Formatação](/guides/formatting/) para a referência completa de presets e tokens.

**Parâmetros**

```params
- name: spec
  type: FormatSpec
  default: "'short'"
  description: Nome de formato integrado ou configurado, objeto de opções `Intl` ou padrão de tokens.
- name: locale
  type: string
  description: Tag de locale BCP 47 que sobrescreve o locale deste horário ou o padrão configurado apenas nesta chamada.
```

**Retorno**

```returns
type: string
description: String do horário formatado.
```

```js
const afternoon = time('17:30:15');

afternoon.format('short', 'en-US'); // '5:30 PM'
afternoon.format('LTS', 'en-US'); // '5:30:15 PM'
afternoon.format('HH:mm:ss'); // '17:30:15'
afternoon.format('h:mm a'); // '5:30 pm'
afternoon.format({ hour12: false }, 'en-US'); // '17:30'
```
:::

:::entry
### `locale()` :kind[method]

```js signature
t.locale(): Locale | undefined
t.locale(tag): Time
```

Lê o locale associado a este horário ou retorna uma cópia formatada em outro locale nos textos formatados, nos presets e em todos os valores derivados dele. Passar uma tag vazia remove o locale associado, e [`lang()`](#lang) funciona como alias.

**Parâmetros**

```params
- name: tag
  type: Locale | null | undefined
  description: Tag de locale BCP 47 a propagar, ou `null` para limpar uma tag existente.
```

**Retorno**

```returns
type: Time | Locale | undefined
description: Tag ativa ao chamar sem argumentos, ou um novo `Time` com `tag`.
```

```js
const closing = time('17:30').locale('ko-KR');

closing.locale(); // 'ko-KR'
closing.text; // '오후 5:30'
closing.on('2026-05-01', 'Asia/Seoul').locale(); // 'ko-KR'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
t.lang(): Locale | undefined
t.lang(tag): Time
```

Alias curto de [`locale()`](#locale) que lê ou associa uma tag de locale BCP 47 a este horário.
:::

:::entry
### `toString()` :kind[method]

```js signature
t.toString(): string
t.toJSON(): string
```

Retorna a string de horário ISO 8601 no formato de 24 horas, incluindo dígitos subsegundo em grupos de três apenas quando diferentes de zero. `toJSON()` retorna a mesma string para `JSON.stringify()`.

**Retorno**

```returns
type: string
description: String de horário ISO 8601, como `'17:30:00'` ou `'17:30:15.250'`.
```

```js
time('5:30pm').toString(); // '17:30:00'
time('17:30:15.25').toString(); // '17:30:15.250'
JSON.stringify({ opens: time('9am') }); // '{"opens":"09:00:00"}'
```
:::

:::entry
### `as()` :kind[method]

```js signature
t.as('time'): Time
```

Retorna este `Time` quando `'time'` é solicitado em encadeamentos genéricos de conversão, lançando um `RangeError` para outros tipos.
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
t.toTemporal(): Temporal.PlainTime
```

Retorna a instância subjacente de `Temporal.PlainTime`.
:::

:::entry
### `valueOf()` :kind[method]

```js signature
t.valueOf(): never
```

Lança um `RangeError` para que operadores numéricos nunca convertam silenciosamente uma hora do dia em número.
:::
