---
source: "8dc73060ce55"
title: parse
lede: Interpretação estrita de strings de data e horário em layout fixo usando padrões de tokens com a opção format.
---

## Interpretação com padrão de formato

O núcleo interpreta strings ISO 8601 estritas por padrão, enquanto [`@native-dates/plugins/loose`](/plugins/loose/) lê textos livres no locale ativo. Importar este plugin adiciona a opção `{ format }` para strings de layout fixo, como exportações bancárias e logs de servidor.

```js title="parse.js"
import '@native-dates/plugins/parse';
import { date, datetime, monthDay, time, yearMonth } from 'native-dates';

date('24112026', { format: 'DDMMYYYY' }).toString(); // '2026-11-24'
datetime('24/Nov/2026:12:40:01 -0500', {
  format: 'DD/MMM/YYYY:HH:mm:ss ZZ',
  zone: 'America/New_York',
  locale: 'en-US',
}).toString(); // '2026-11-24T17:40:01.000Z'
time('1430', { format: 'HHmm' }).toString(); // '14:30:00'
yearMonth('11/2026', { format: 'MM/YYYY' }).toString(); // '2026-11'
monthDay('29/02', { format: 'DD/MM' }).toString(); // '02-29'
```

A interpretação ISO estrita continua sendo o padrão sempre que você omite a opção de formato. Chamar qualquer função fábrica com `{ format }` antes de importar este plugin lança o erro [`missingPlugin`](/api/errors/#plugins).

## Correspondência estrita e formatos nomeados

Os padrões usam o [vocabulário de tokens](/guides/formatting/#token-patterns) do núcleo. Tokens de largura fixa exigem a quantidade exata de dígitos, e o padrão precisa cobrir a string inteira, com textos literais diferenciando maiúsculas e minúsculas.

Datas impossíveis, como 30 de fevereiro, e dias da semana incompatíveis lançam erro em vez de avançar para a data seguinte. Tokens repetidos ou campos conflitantes de relógio de 12 e 24 horas são rejeitados da mesma forma.

```js
import { configure, date, dateRange } from 'native-dates';

date('Tue 2026-11-24', { format: 'ddd YYYY-MM-DD', locale: 'en-US' }).toString();
// '2026-11-24'
date('6/9/26', { format: 'D/M/YY' }).toString(); // '2026-09-06'

configure({ formats: { bank: 'DDMMYYYY' } });
date('24112026', { format: 'bank' }).toString(); // '2026-11-24'
dateRange('24112026', '30112026', { format: 'bank' }).toString();
// '2026-11-24/2026-11-30'
configure({ formats: null });
```

Padrões nomeados registrados em [`configure()`](/api/configure/) funcionam tanto na interpretação quanto na formatação. As fábricas de intervalo repassam a opção de formato para ambas as extremidades, inclusive quando o segundo argumento é uma duração.

## Nomes localizados e ordinais

Nomes de meses, dias da semana, períodos do dia e ordinais seguem o locale ativo. Tanto as formas isoladas quanto as formas flexionadas dos meses são reconhecidas sem diferenciar maiúsculas e minúsculas, permitindo interpretar datas em russo e grego sem regras extras.

O locale ativo segue a mesma precedência da formatação: primeiro a opção passada na chamada, depois [`configure()`](/api/configure/) e, por fim, o padrão do runtime. Informe o locale explicitamente sempre que o texto de entrada vier de um idioma fixo, como logs de servidor em inglês.

```js
import { date, time, yearMonth } from 'native-dates';

date('November 24th, 2026', { format: 'MMMM Do, YYYY', locale: 'en-US' }).toString();
// '2026-11-24'
date('6 ноября 2026', { format: 'D MMMM YYYY', locale: 'ru' }).toString();
// '2026-11-06'
date('6. November 2026', { format: 'Do MMMM YYYY', locale: 'de' }).toString();
// '2026-11-06'
date('2026年11月6日', { format: 'YYYY[年]M[月]Do', locale: 'ja' }).toString();
// '2026-11-06'
yearMonth('février 2026', { format: 'MMMM YYYY', locale: 'fr' }).toString();
// '2026-02'
time('9:05:12.5 pm', { format: 'h:mm:ss.S a', locale: 'en-US' }).toString();
// '21:05:12.500'
```

Tokens ordinais em inglês validam o sufixo exato, então `'24st'` é rejeitado, enquanto [nomes personalizados de dias da semana](/api/configure/) registrados nas configurações da aplicação valem automaticamente.

## Semanas ISO e datas ordinais

Padrões de dia ordinal do ano e de semana ISO produzem diretamente datas de calendário ou instantes. Ao lado de um token de semana, `YYYY` lê o ano da semana ISO em vez do ano de calendário escrito por `format()`; por isso, `'2026-W01-1'` corresponde a 29 de dezembro de 2025.

Anos bissextos e anos de 52 ou 53 semanas são validados com rigor, e omitir o dia da semana em uma semana ISO assume segunda-feira.

```js
import { date } from 'native-dates';

date('2026-328', { format: 'YYYY-DDDD' }).toString(); // '2026-11-24'
date('2026-W48-2', { format: 'YYYY-[W]WW-E' }).toString(); // '2026-11-24'
date('2026-W48', { format: 'YYYY-[W]WW' }).toString(); // '2026-11-23'
date('2026-W01-1', { format: 'YYYY-[W]WW-E' }).toString(); // '2025-12-29'
```

## Fusos horários e timestamps

Padrões com um token de deslocamento UTC fixam um instante exato e o convertem para o fuso horário de destino. Tokens `z` na string reconhecem identificadores IANA e, com [`@native-dates/plugins/zones`](/plugins/zones/), nomes de cidades em inglês ou siglas como JST, sem aceitar rótulos arbitrários de deslocamento como GMT+2.

Um fuso presente na string permanece no resultado, salvo se você informar um fuso de destino para fazer a conversão. Se a string trouxer um deslocamento UTC e um nome de fuso que discordam para aquele instante, a interpretação lança erro.

```js
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('24 Nov 2026 15:45 JST', {
  format: 'DD MMM YYYY HH:mm z',
  locale: 'en-US',
}).zone; // 'Asia/Tokyo'

datetime('24 Nov 2026 15:45 JST', {
  format: 'DD MMM YYYY HH:mm z',
  zone: 'UTC',
  locale: 'en-US',
}).toString(); // '2026-11-24T06:45:00.000Z'

datetime('1795542001', { format: 'X', zone: 'UTC' }).toString();
// '2026-11-24T17:40:01.000Z'
datetime('24112026', { format: 'DDMMYYYY', zone: 'America/New_York' }).toString();
// '2026-11-24T05:00:00.000Z'
```

Timestamps Unix são interpretados com `X` para segundos inteiros e `x` para milissegundos. Passar um padrão apenas de data para a [fábrica `datetime()`](/api/datetime-fn/) cria o instante no início daquele dia no fuso horário de destino.

## Combinação com o modo loose

Carregue [`@native-dates/plugins/loose`](/plugins/loose/) junto com este plugin para retornar `null` em vez de lançar erro quando o texto de entrada não corresponder ao formato. Valores ausentes, números, datas impossíveis e transições rejeitadas de horário de verão retornam `null` nas funções fábrica, enquanto instâncias já existentes de data e horário passam sem alteração.

```js
import '@native-dates/plugins/loose';
import { date, datetime } from 'native-dates';

date('not-a-date', { format: 'DDMMYYYY', loose: true }); // null
date('30022026', { format: 'DDMMYYYY', loose: true }); // null
datetime('08/03/2026 02:30', {
  format: 'DD/MM/YYYY HH:mm',
  zone: 'America/New_York',
  disambiguation: 'reject',
  loose: true,
}); // null
```

:::note[Dados inválidos retornam null; padrões inválidos continuam lançando erro]
O modo loose transforma em `null` apenas strings de entrada que não correspondem ao padrão. Um padrão vazio ou incompleto lança [`unknownFormat`](/api/errors/#units-zones-and-formats), e um token que o tipo de destino não possui lança [`unsupportedToken`](/api/errors/#units-zones-and-formats).
:::

## Tokens suportados

Os tokens seguem o vocabulário de formatação, com espaços em branco no início e no fim removidos automaticamente, a menos que o próprio padrão comece ou termine com espaço.

| Token | Exemplo | Corresponde a |
|---|---|---|
| `YYYY` | `'2026'` | Ano de calendário com quatro dígitos, ou ano da semana ISO quando combinado com `W` ou `WW`. |
| `YY` | `'26'` | Ano com dois dígitos, lendo 69 a 99 como 1969–1999 e 00 a 68 como 2000–2068. |
| `M`, `MM` | `'9'`, `'09'` | Número do mês de 1 a 12, sem zero à esquerda ou com dois dígitos. |
| `MMM`, `MMMM` | `'Nov'`, `'November'` | Nome localizado abreviado ou completo do mês gregoriano, incluindo formas flexionadas. |
| `D`, `DD` | `'6'`, `'06'` | Dia do mês de 1 a 31, sem zero à esquerda ou com dois dígitos. |
| `Do` | `'24th'`, `'6.'` | Dia do mês com ordinais em inglês ou o marcador de dia do locale ativo. |
| `DDD`, `DDDD` | `'1'`, `'328'` | Dia ordinal ISO do ano de 1 a 366, sem zero à esquerda ou com três dígitos. |
| `W`, `WW` | `'5'`, `'48'` | Semana ISO do ano de 1 a 53, sem zero à esquerda ou com dois dígitos. |
| `E` | `'2'` | Dia da semana ISO de 1 para segunda-feira a 7 para domingo. |
| `d` | `'0'` | Dia da semana de 0 para domingo a 6 para sábado. |
| `dd`, `ddd`, `dddd` | `'Tu'`, `'Tue'`, `'Tuesday'` | Nome localizado do dia da semana (mais curto, abreviado ou completo). |
| `H`, `HH` | `'9'`, `'09'` | Hora no relógio de 24 horas de 0 a 23, sem zero à esquerda ou com dois dígitos. |
| `h`, `hh` | `'9'`, `'09'` | Hora no relógio de 12 horas de 1 a 12, sem zero à esquerda ou com dois dígitos. |
| `m`, `mm` | `'5'`, `'05'` | Minuto de 0 a 59, sem zero à esquerda ou com dois dígitos. |
| `s`, `ss` | `'8'`, `'08'` | Segundo de 0 a 59, sem zero à esquerda ou com dois dígitos. |
| `S`, `SS`, `SSS` | `'5'`, `'25'`, `'250'` | Frações de segundo em décimos, centésimos ou milissegundos. |
| `A`, `a` | `'PM'`, `'pm'` | AM ou PM em inglês (sem diferenciar maiúsculas e minúsculas), ou o período do dia do locale ativo. |
| `Z`, `ZZ` | `'-05:00'`, `'-0500'` | Deslocamento UTC com ou sem dois-pontos, ou `Z` para UTC. |
| `z`, `zz` | `'UTC'`, `'JST'` | ID de fuso horário IANA sem espaços, ou cidade em inglês ou sigla quando `@native-dates/plugins/zones` está carregado. Não interpreta rótulos de deslocamento como `'GMT+2'`. |
| `X`, `x` | `'1795542001'` | Timestamp Unix em segundos inteiros ou milissegundos, incluindo valores negativos. |
| `[text]` | `'[W]'` | Texto literal escapado, comparado diferenciando maiúsculas e minúsculas. Um `T` isolado também passa sem escape. |

Tokens exclusivos de formatação, como trimestres e nomes longos de fuso horário, não podem ser interpretados e lançam [`unknownFormat`](/api/errors/#units-zones-and-formats). Padrões sem campos obrigatórios para o tipo de destino lançam o mesmo erro, enquanto tokens que o tipo de destino não carrega lançam [`unsupportedToken`](/api/errors/#units-zones-and-formats).

## Opções das funções fábrica

:::entry
### `datetime()` :kind[function]

```js signature
datetime(input, { format, zone?, locale?, disambiguation?, loose? }): DateTime
date(input, { format, locale?, loose? }): CalendarDate
time(input, { format, locale?, loose? }): Time
yearMonth(input, { format, locale?, loose? }): YearMonth
monthYear(input, { format, locale?, loose? }): YearMonth
monthDay(input, { format, locale?, loose? }): MonthDay
dayMonth(input, { format, locale?, loose? }): MonthDay
dateRange(start, end, { format, locale?, loose? }): DateRange
datetimeRange(start, end, { format, zone?, locale?, disambiguation?, loose? }): DateTimeRange
timeRange(start, end, { format, locale?, loose? }): TimeRange
```

Interpreta strings de entrada conforme um padrão de tokens ou formato nomeado em todas as fábricas de data, horário, data parcial e intervalo. Valores já interpretados de data, horário, `Date` e `Temporal` passam direto após a validação do padrão, enquanto números são rejeitados.

**Parâmetros**

```params
- name: format
  type: string
  required: true
  description: "Padrão de tokens como `'DDMMYYYY'` ou formato nomeado registrado em `configure({ formats })`."
- name: zone
  type: Zone
  description: Fuso horário usado para interpretar strings locais de data e hora ou converter deslocamentos UTC e timestamps Unix.
- name: locale
  type: Locale
  description: Tag de locale BCP 47 mantida no valor e usada para nomes de meses, dias da semana, períodos do dia e ordinais.
- name: disambiguation
  type: Disambiguation
  default: "'compatible'"
  description: "Estratégia para resolver lacunas e repetições do horário de verão em strings locais de data e hora. Com `'reject'`, lança `invalidDateTime` ou retorna `null` no modo loose."
- name: loose
  type: boolean
  default: "false"
  description: "Retorno de `null` em vez de lançar erro quando a entrada não corresponde ao formato (exige `@native-dates/plugins/loose`)."
```

**Retorno**

```returns
type: DateTime | CalendarDate | Time | YearMonth | MonthDay | Range
description: "Instância interpretada, ou `null` quando `{ loose: true }` está ativo em uma função fábrica e a entrada não corresponde ao padrão."
```

```js
date('24112026', { format: 'DDMMYYYY' }).toString(); // '2026-11-24'
yearMonth('202611', { format: 'YYYYMM' }).toString(); // '2026-11'
timeRange('0930', '1700', { format: 'HHmm' }).toString(); // '09:30:00/17:00:00'
```
:::
