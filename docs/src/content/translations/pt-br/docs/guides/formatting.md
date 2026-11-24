---
source: "fb90df20f99e"
title: Formatação
lede: Formate datas, horários e durações com presets localizados, padrões de tokens ou frases de tempo relativo.
---

O Native Dates usa os formatadores `Intl` nativos da plataforma e faz cache deles automaticamente. Você obtém saídas localizadas para qualquer idioma ou região sem adicionar arquivos de locale ao bundle.

## Saída rápida com text e presets

Toda instância tem uma propriedade `.text` formatada no locale ativo. Chamar [`format()`](/api/date-time/#format) sem argumentos usa o preset padrão de cada tipo:

```js
import { date, datetime, duration, time } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
standup.text; // 'Nov 16, 2026, 9:30 AM PST'
standup.format(); // 'Nov 16, 2026, 9:30 AM'

date('2026-11-16').text; // 'Nov 16, 2026'
time('9:30am').text; // '9:30 AM'
duration('1h 30m').text; // '1 hour, 30 minutes'
```

Passe o nome de um preset para `format()` para controlar o nível de detalhe exibido:

| Preset | Exemplo | Tipos suportados e saída |
|---|---|---|
| `'short'` | `'5/4/26, 9:30 AM'` | Data numérica ou horário curto em datas, horários, datas parciais e durações. |
| `'medium'` | `'May 4, 2026, 9:30 AM'` | Mês abreviado em datas e instantes, ou horário com segundos em [`Time`](/api/time/). |
| `'long'` | `'May 4, 2026 at 9:30 AM'` | Nome completo do mês, horário com segundos em `Time` ou unidades por extenso em [`Duration`](/api/duration/). |
| `'full'` | `'Monday, May 4, 2026 at 9:30 AM'` | Dia da semana e mês por extenso em datas e instantes, ou mês por extenso em datas parciais. |
| `'date'` | `'May 4, 2026'` | Parte de data em [`DateTime`](/api/date-time/) e [`CalendarDate`](/api/calendar-date/). |
| `'time'` | `'9:30 AM'` | Horário curto em `DateTime` e `Time`. |
| `'month'` | `'May 2026'` | Nome completo do mês e ano em `DateTime`, `CalendarDate` e [`YearMonth`](/api/year-month/). |
| `'text'` | `'May 4, 2026, 9:30 AM PDT'` | Data, horário e nome curto do fuso horário em `DateTime`, ou os campos próprios de cada tipo nos demais. |

:::details[Nomes de presets do Moment e do Day.js]
O núcleo também aceita os nomes de presets localizados usados no Moment e no Day.js:

| Preset | Exemplo | Campos localizados |
|---|---|---|
| `'LT'`, `'LTS'` | `'9:30 AM'`, `'9:30:00 AM'` | Horário curto ou horário com segundos. |
| `'L'`, `'l'` | `'05/04/2026'`, `'5/4/2026'` | Ano, mês e dia numéricos, com ou sem zero à esquerda. |
| `'LL'`, `'ll'` | `'May 4, 2026'` | Nome do mês por extenso ou abreviado com dia e ano. |
| `'LLL'`, `'lll'` | `'May 4, 2026 at 9:30 AM'` | Data longa ou abreviada combinada com horário curto. |
| `'LLLL'`, `'llll'` | `'Monday, May 4, 2026 at 9:30 AM'` | Dia da semana por extenso ou abreviado, data e horário curto. |
:::

Datas, horários, [anos e meses](/api/year-month/) e [meses e dias](/api/month-day/) aceitam todos os presets acima e mantêm apenas os campos que possuem. [Durações](/api/duration/) também aceitam estilos compacto e digital:

```js
import { date, duration, time, yearMonth } from 'native-dates';

date('2026-11-16').format('full', 'en-US'); // 'Monday, November 16, 2026'
yearMonth('2026-11').format('LL', 'en-US'); // 'November 2026'
time('9:30:15am').format('LTS', 'en-US'); // '9:30:15 AM'

const span = duration({ hours: 2, minutes: 15 });
span.format('narrow', 'en-US'); // '2h 15m'
span.format('digital', 'en-US'); // '2:15:00'
```

## Locales e opções de Intl

Defina um padrão global uma única vez com [`configure()`](/api/configure/), associe um idioma a um valor com [`locale()`](/api/date-time/#locale) ou passe uma tag para uma única chamada de formatação. Leia [Localização](/guides/localization/) para orientações sobre aplicações cliente versus servidores multiusuário:

```js
import { configure, datetime } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'Europe/Berlin');
standup.locale('de-DE').plus(1, 'week').format('long'); // '23. November 2026 um 09:30'
standup.format('long', 'ja-JP'); // '2026年11月16日 9:30'

configure({ locale: 'en-GB' });
configure({ locale: null });
```

Quando nenhum preset atender ao layout desejado, passe um objeto de opções diretamente ao formatador subjacente:

```js
import { date } from 'native-dates';

const day = date('2026-11-16');

day.format({ weekday: 'long' }, 'en-US'); // 'Monday'
day.format({ month: 'short', day: 'numeric' }, 'en-US'); // 'Nov 16'
```

Como cada tipo carrega apenas seus próprios campos, os presets se adaptam à gramática, aos plurais, aos sistemas de escrita e aos calendários locais sem arquivos de idioma. Veja os [exemplos por idioma](/examples/) para conferir casos específicos no idioma de destino:

```js
import { date, days, yearMonth } from 'native-dates';

date('2019-05-01').format('long', 'ja-u-ca-japanese'); // '令和元年5月1日'
yearMonth('2026-05').format('long', 'ru'); // 'май 2026 г.'
date('2026-05-01').format('long', 'ru'); // '1 мая 2026 г.'
days(2).format('long', 'ar'); // 'يومان'
```

:::tip[Exibição para pessoas vs. strings de transporte]
Reserve `format()` para texto exibido a usuários. Ao salvar valores ou enviá-los pela rede, chame [`toString()`](/api/date-time/#tostring) ou serialize em JSON para manter os payloads no formato estável ISO 8601. Veja [Armazenamento e envio](/guides/storing-and-sending/).
:::

## Padrões de tokens

Quando precisar de um layout fixo, passe um padrão de tokens para `format()`. Envolva palavras literais entre colchetes para que sejam copiadas exatamente como escritas:

```js
import { datetime, monthDay, yearMonth } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.format('YYYY-MM-DD HH:mm'); // '2026-11-16 09:30'
standup.format('YYYY-MM-DDTHH:mmZ'); // '2026-11-16T09:30-08:00'
standup.format('dddd, MMM D [at] h:mm A', 'en-US'); // 'Monday, Nov 16 at 9:30 AM'
yearMonth('2026-11').format('MMM YYYY', 'en-US'); // 'Nov 2026'
monthDay('11-16').format('MMMM Do', 'en-US'); // 'November 16th'
```

Os nomes de meses e dias da semana dentro de padrões de tokens vêm do `Intl` no locale ativo. Já os dígitos e anos permanecem em algarismos ocidentais ISO para que padrões como `'YYYY-MM-DD'` continuem legíveis por máquina em qualquer lugar. Os tokens seguem o padrão de maiúsculas e minúsculas do Moment e do Day.js (`YYYY` e `DD` são maiúsculos, diferentemente do `yyyy` e `dd` minúsculos de LDML/date-fns, pois aqui `dd` representa o dia da semana com duas letras).

:::details[Todos os tokens de formatação]
| Token | Exemplo | Saída |
|---|---|---|
| `YYYY` | `'2026'` | Ano com quatro dígitos, com sinal em anos negativos. |
| `YY` | `'26'` | Ano com dois dígitos. |
| `Q` | `'4'` | Trimestre do calendário, de 1 a 4. |
| `M`, `MM` | `'11'`, `'05'` | Número do mês, sem zero ou com dois dígitos. |
| `MMM`, `MMMM` | `'Nov'`, `'November'` | Nome localizado do mês gregoriano, flexionado automaticamente após um token de dia mesmo com texto literal entre eles. |
| `D`, `DD` | `'5'`, `'05'` | Dia do mês, sem zero ou com dois dígitos. |
| `Do` | `'16th'` | Dia do mês com ordinais em inglês, o marcador de dia do locale como `'6.'` ou `'6日'`, ou [`ordinals`](/api/configure/) personalizado. |
| `DDD`, `DDDD` | `'320'`, `'045'` | Dia do ano, sem zero ou com três dígitos. |
| `E` | `'7'` | Dia da semana ISO, de 1 na segunda-feira a 7 no domingo, igual a `dayOfWeek`. |
| `d` | `'0'` | Dia da semana de 0 no domingo a 6 no sábado, compatível com Moment e Day.js. |
| `dd`, `ddd`, `dddd` | `'Mo'`, `'Mon'`, `'Monday'` | Nome localizado do dia da semana (mais curto, abreviado ou completo), personalizável via [`weekdayNames`](/api/configure/). |
| `W`, `WW` | `'47'`, `'05'` | Semana ISO do ano, sem zero ou com dois dígitos. |
| `H`, `HH` | `'9'`, `'09'` | Hora no relógio de 24 horas, sem zero ou com dois dígitos. |
| `h`, `hh` | `'9'`, `'09'` | Hora no relógio de 12 horas, de 1 a 12. |
| `m`, `mm` | `'5'`, `'05'` | Minuto, sem zero ou com dois dígitos. |
| `s`, `ss` | `'8'`, `'08'` | Segundo, sem zero ou com dois dígitos. |
| `S`, `SS`, `SSS` | `'4'`, `'42'`, `'420'` | Décimos, centésimos ou milissegundos. |
| `A`, `a` | `'AM'`, `'am'` | `'AM'` e `'PM'` em maiúsculas ou minúsculas em inglês, ou o período do dia do locale, como `'午後'` ou `'م'`. |
| `Z`, `ZZ` | `'-08:00'`, `'-0800'` | Deslocamento UTC com ou sem dois-pontos. |
| `z`, `zz` | `'PST'` | Nome curto localizado do fuso horário. |
| `zzz`, `zzzz` | `'Pacific Standard Time'` | Nome completo localizado do fuso horário. |
| `X` | `'1794850200'` | Timestamp Unix em segundos inteiros. |
| `x` | `'1794850200000'` | Timestamp Unix em milissegundos. |
| `[text]` | `'[at]'` | Texto literal escapado, copiado diretamente para a saída. |
:::

Letras não reconhecidas fora de colchetes lançam um erro [`unknownFormat`](/api/errors/#units-zones-and-formats) em vez de imprimir letras soltas. Tokens colados a letras acentuadas, como `'às'`, ou letras de relógio misturadas, como `'HHhmm'`, também lançam erro. Um `T` isolado passa sem escape para timestamps ISO.

Pedir um campo que o tipo não possui lança [`unsupportedToken`](/api/errors/#units-zones-and-formats) em vez de inventar meia-noite. Formatar tokens de relógio como `'HH:mm'` em uma data de calendário falha na hora.

O núcleo também exporta [`monthNames()`](/api/month-names/) e seu equivalente para dias da semana, úteis para montar cabeçalhos de calendário e seletores de mês localizados (o dia inicial da semana opcional em `weekdayNames()` é informado em inglês, como `'monday'`):

```js
import { monthNames, weekdayNames } from 'native-dates';

monthNames('short', 'en-US'); // ['Jan', 'Feb', 'Mar', ...]
weekdayNames('short', undefined, 'en-US'); // ['Sun', 'Mon', 'Tue', ...]
weekdayNames('narrow', 'monday', 'en-US'); // ['Mo', 'Tu', 'We', ...]
```

## Seus próprios formatos nomeados

Registre nomes reutilizáveis em [`configure()`](/api/configure/) quando sua aplicação repetir um padrão de tokens ou objeto de opções do `Intl` em várias telas. Nomes personalizados funcionam em datas, horários, datas parciais e intervalos, e têm precedência sobre os presets integrados. Veja [Formatos nomeados](/guides/customization/#named-formats).

## Formatação de intervalos

Todo [intervalo](/api/ranges/) formata presets e opções via `Intl`, condensando automaticamente meses ou anos em comum. Passar um padrão de tokens formata os dois extremos separados por `' – '`:

```js
import { dateRange, timeRange } from 'native-dates';

const week = dateRange('2026-09-01', '2026-09-07');
const shift = timeRange('9:00am', '5:00pm');

week.format('medium', 'en-US'); // 'Sep 1 – 7, 2026'
week.format('YYYY-MM-DD'); // '2026-09-01 – 2026-09-07'
shift.format('short', 'en-US'); // '9:00 AM – 5:00 PM'
```

## Frases de tempo relativo

Chame [`from()`](/api/date-time/#from) ou [`fromNow()`](/api/date-time/#fromnow) em instantes e datas de calendário para gerar frases localizadas pelo formatador de tempo relativo do runtime. [`formatRelative()`](/api/date-time/#formatrelative) funciona como alias:

```js
import { date, datetime, now, today } from 'native-dates';

now().minus(5, 'minutes').fromNow('en-US'); // '5 minutes ago'
today().plus(1, 'day').fromNow('en-US'); // 'tomorrow'

const anchor = datetime('2026-11-16T12:00', 'UTC');
anchor.minus(3, 'hours').from(anchor, 'en-US'); // '3 hours ago'
anchor.minus(23, 'hours').from(anchor, 'en-US'); // '1 day ago'

const currentDay = date('2026-11-16');
currentDay.minus(1, 'day').from(currentDay, 'en-US'); // 'yesterday'
currentDay.plus(14, 'days').from(currentDay, 'en-US'); // 'in 2 weeks'
```

Datas de calendário medem dias inteiros, então `from()` e `fromNow()` retornam expressões como ontem, hoje e amanhã dentro de uma janela de sete dias. Instantes medem tempo decorrido no relógio e mantêm contagens numéricas além de “agora”, já que 23 horas atrás ainda podem cair no mesmo dia do calendário.

Veja [Interpretação](/guides/parsing/) a seguir para ler strings recebidas e valores externos de volta para o código.
