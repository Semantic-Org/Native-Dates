---
source: "be45ccc1b61a"
title: loose
lede: Interpretação opcional sensível ao locale com retorno null para textos não confiáveis de formulários, CSVs e feeds legados.
---

## Modo loose opcional

Por padrão, toda função fábrica interpreta apenas strings ISO 8601 estritas e lança erro em entradas malformadas. Importar este plugin habilita `{ loose: true }` para lidar com texto digitado pelo usuário, colunas de CSV e cabeçalhos legados.

```js title="loose.js"
import '@native-dates/plugins/loose';
import { date, datetime, duration, time } from 'native-dates';

date('September 6, 2026', { loose: true })?.toString(); // '2026-09-06'
datetime('Sat, 06 Sep 2026 14:30:00 GMT', { loose: true })?.toString();
// '2026-09-06T14:30:00.000Z'
time('September 6, 2026 5:30 PM', { loose: true })?.toString(); // '17:30:00'
duration('2h', { loose: true })?.toString(); // 'PT2H'
```

A interpretação estrita continua sendo o padrão sempre que o modo loose é omitido. Importar o plugin nunca altera chamadas existentes na sua base de código.

## Leitura no locale ativo

O modo loose reconhece as datas e horários que `Intl` gera para o locale ativo. Nomes de meses, marcadores AM/PM, expressões de período do dia e ordem numérica entre dia e mês vêm do próprio runtime, e algarismos de qualquer sistema de escrita são convertidos automaticamente.

O locale ativo segue a mesma precedência da formatação: primeiro a opção `locale`, depois [`configure()`](/api/configure/) e, por fim, o padrão do runtime.

```js locale="en-US" label="English"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'en-US' });

date('06/11/2026', { loose: true })?.toString(); // '2026-06-11'
date('September 6, 2026', { loose: true })?.toString(); // '2026-09-06'
time('9:10 in the evening', { loose: true })?.toString(); // '21:10:00'
datetime('Sep 6, 2026, 5:30 PM', {
  loose: true,
  zone: 'America/New_York',
})?.hour; // 17
```

```js locale="fr" label="Français"
import '@native-dates/plugins/loose';
import { configure, date, datetime, monthDay } from 'native-dates';

configure({ locale: 'fr' });

date('06/11/2026', { loose: true })?.toString(); // '2026-11-06'
date('1er mai 2026', { loose: true })?.toString(); // '2026-05-01'
monthDay('1er mai', { loose: true })?.toString(); // '05-01'
datetime('16 novembre 2026 à 14:30', {
  loose: true,
  zone: 'Europe/Paris',
})?.hour; // 14
```

```js locale="es" label="Español"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'es' });

date('06/11/2026', { loose: true })?.toString(); // '2026-11-06'
date('16 de noviembre de 2026', { loose: true })?.toString(); // '2026-11-16'
time('9:10 de la noche', { loose: true })?.toString(); // '21:10:00'
datetime('16 nov 2026, 14:30', {
  loose: true,
  zone: 'Europe/Madrid',
})?.hour; // 14
```

```js locale="pt-BR" label="Português"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'pt-BR' });

date('06/11/2026', { loose: true })?.toString(); // '2026-11-06'
date('16 de novembro de 2026', { loose: true })?.toString(); // '2026-11-16'
time('9:10 da noite', { loose: true })?.toString(); // '21:10:00'
datetime('16 de novembro de 2026 às 14:30', {
  loose: true,
  zone: 'America/Sao_Paulo',
})?.hour; // 14
```

```js locale="zh-CN" label="中文"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'zh-CN' });

date('2026/11/16', { loose: true })?.toString(); // '2026-11-16'
date('2026年11月16日', { loose: true })?.toString(); // '2026-11-16'
time('晚上9:10', { loose: true })?.toString(); // '21:10:00'
datetime('2026年11月16日 下午2:30', {
  loose: true,
  zone: 'Asia/Shanghai',
})?.hour; // 14
```

```js locale="ja" label="日本語"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'ja' });

date('2026/11/16', { loose: true })?.toString(); // '2026-11-16'
date('2026年11月16日', { loose: true })?.toString(); // '2026-11-16'
time('午後2:30', { loose: true })?.toString(); // '14:30:00'
datetime('2026年11月16日 14:30', {
  loose: true,
  zone: 'Asia/Tokyo',
})?.hour; // 14
```

```js locale="ko" label="한국어"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'ko' });

date('26. 5. 5.', { loose: true })?.toString(); // '2026-05-05'
date('2026년 11월 16일', { loose: true })?.toString(); // '2026-11-16'
time('오후 2:30', { loose: true })?.toString(); // '14:30:00'
datetime('2026년 11월 16일 오후 2:30', {
  loose: true,
  zone: 'Asia/Seoul',
})?.hour; // 14
```

```js locale="ru" label="Русский"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'ru' });

date('16.11.2026', { loose: true })?.toString(); // '2026-11-16'
date('16 ноября 2026 г.', { loose: true })?.toString(); // '2026-11-16'
time('9:10 вечера', { loose: true })?.toString(); // '21:10:00'
datetime('16 нояб. 2026 г., 14:30', {
  loose: true,
  zone: 'Europe/Moscow',
})?.hour; // 14
```

```js locale="ar-EG" label="العربية"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'ar-EG' });

date('١٦‏/١١‏/٢٠٢٦', { loose: true })?.toString(); // '2026-11-16'
date('١٦ نوفمبر ٢٠٢٦', { loose: true })?.toString(); // '2026-11-16'
time('٢:٣٠ م', { loose: true })?.toString(); // '14:30:00'
datetime('١٦ نوفمبر ٢٠٢٦، ٢:٣٠ م', {
  loose: true,
  zone: 'Africa/Cairo',
})?.hour; // 14
```

Locales que colocam o ano primeiro, como o coreano, leem anos de dois dígitos no início, então `'26. 5. 5.'` equivale a 5 de maio de 2026 em coreano. Preposições, ordinais e dias da semana no início são ignorados tanto em datas completas quanto em datas parciais.

## Retorno de null em dados inválidos

Com o modo loose ativo, strings ilegíveis, campos vazios, valores ausentes e datas inexistentes como 30 de fevereiro retornam `null` em vez de lançar erro. Assim, handlers de formulário e scripts de importação validam o resultado direto sem envolver cada campo em um bloco `try`.

```js
const submitted = date('TBD', { loose: true }); // null
const rolled = date('2026-02-30', { loose: true }); // null
const missing = datetime(undefined, { loose: true }); // null
```

As funções fábrica de [intervalos](/api/ranges/), [`YearMonth`](/api/year-month/) e [`MonthDay`](/api/month-day/) aceitam a mesma opção:

```js
import { dateRange, monthDay, yearMonth } from 'native-dates';

dateRange('Sep 1 2026', 'Sep 7 2026', { loose: true })?.toString(); // '2026-09-01/2026-09-07'
yearMonth('ноябрь 2026 г.', { loose: true, locale: 'ru' })?.toString(); // '2026-11'
monthDay('1er mai', { loose: true, locale: 'fr' })?.toString(); // '05-01'
dateRange('TBD', '2026-09-07', { loose: true }); // null
```

Datas incompletas sem ano ou sem dia retornam `null` nas fábricas de data e de data e hora, sem inventar valores padrão. Use uma fábrica de data parcial quando houver apenas mês e ano ou mês e dia.

Anos com dois dígitos ao lado de um nome de mês fora do inglês, abreviações ambíguas de mês, horas acima de 12 acompanhadas de AM ou PM e horários isolados passados para [`datetime()`](/api/datetime-fn/) são rejeitados. Siglas desconhecidas de fuso em maiúsculas e horas abreviadas como `'14h'` também retornam `null`.

:::note[Dados inválidos retornam null; opções inválidas continuam lançando erro]
O modo loose trata apenas entradas ilegíveis. Passar um fuso horário inexistente como `'Mars/Olympus'` é um erro no código da aplicação, não no dado do usuário, e por isso continua lançando erro imediatamente.
:::

## Fusos horários em strings do modo loose

Strings que trazem indicador UTC ou deslocamento UTC numérico identificam um instante exato e o convertem para o fuso horário de destino ou configurado. Strings sem deslocamento mantêm a data e a hora escritas no texto e as posicionam diretamente no fuso de destino.

```js
datetime('Sat, 06 Sep 2026 14:30:00 GMT', {
  loose: true,
  zone: 'America/New_York',
})?.hour; // 10

datetime('September 6, 2026 5:30 PM', {
  loose: true,
  zone: 'America/Los_Angeles',
})?.hour; // 17
```

Abreviações de fuso após um horário seguem as mesmas regras da opção `zone`. Carregue [`@native-dates/plugins/zones`](/plugins/zones/) para reconhecer abreviações além de UTC, GMT e identificadores IANA padrão, incluindo siglas sensíveis ao locale como `CST` em locales chineses.

## Datas numéricas com dia primeiro

Datas numéricas com barras, pontos ou hifens seguem automaticamente a ordem do locale ativo. Passe `dayFirst` por chamada ou defina a opção em [`configure()`](/api/configure/) quando a entrada usar uma ordem diferente da configurada.

```js
import { configure } from 'native-dates';

date('07.09.2026', { loose: true, locale: 'en-US' })?.toString(); // '2026-07-09'
date('07.09.2026', { loose: true, locale: 'de-DE' })?.toString(); // '2026-09-07'
date('07.09.2026', { loose: true, locale: 'en-US', dayFirst: true })?.toString(); // '2026-09-07'

configure({ dayFirst: true });
date('7/9/26', { loose: true })?.toString(); // '2026-09-07'
date('07.09.2026', { loose: true, dayFirst: false })?.toString(); // '2026-07-09'
configure({ dayFirst: null });
```

Passe `dayFirst: null` para `configure()` quando quiser voltar a seguir o locale ativo. Fábricas de data parcial como [`monthDay()`](/api/month-day-fn/) sempre interpretam pares numéricos na ordem indicada pelo próprio nome, independentemente do locale.

## Regras regionais de relógio e mês

Horários separados por ponto como `'14.30'` só são aceitos em locales cujo relógio usa ponto, como finlandês e dinamarquês, retornando `null` nos demais. Segundos com ponto são aceitos depois de uma data, enquanto sequências isoladas de três números separados por ponto continuam sendo lidas como data.

Expressões de período do dia como *in the evening* em inglês e *밤* em coreano ajustam horários no formato 12 horas sem alterar horários de 24 horas. Conectores entre data e hora nunca são confundidos com AM ou PM: o galês *am* (que significa “às”) preserva `14:30`, enquanto `'AM 12:30'` em inglês é lido como meia-noite e meia.

Formas flexionadas e afixadas de nomes de meses em datas completas são reconhecidas automaticamente, incluindo hebraico e basco. Abreviações de mês precisam corresponder a um único mês sem ambiguidade, então *juil* em francês é lido como julho, mas *jui* retorna `null`.

```js label="Horários com ponto"
datetime('16.11.2026 klo 14.30.15', {
  loose: true,
  locale: 'fi',
  zone: 'UTC',
})?.toString(); // '2026-11-16T14:30:15.000Z'
time('14.30', { loose: true, locale: 'fi' })?.toString(); // '14:30:00'
time('14.30', { loose: true, locale: 'de' }); // null
time('14.30.15', { loose: true, locale: 'fi' }); // null
```

```js label="Períodos do dia"
time('밤 11:30', { loose: true, locale: 'ko' })?.toString(); // '23:30:00'
time('밤 1:30', { loose: true, locale: 'ko' })?.toString(); // '01:30:00'
time('14:30 nachmittags', { loose: true, locale: 'de' })?.toString(); // '14:30:00'
```

```js label="Conectores"
time('am 14:30', { loose: true, locale: 'cy' })?.toString(); // '14:30:00'
time('am 12:30', { loose: true, locale: 'cy' })?.toString(); // '12:30:00'
time('AM 12:30', { loose: true, locale: 'en-US' })?.toString(); // '00:30:00'
```

```js label="Formas dos meses"
date('2026(e)ko azaroaren 16(a)', {
  loose: true,
  locale: 'eu',
})?.toString(); // '2026-11-16'
date('6 juil 2026', { loose: true, locale: 'fr' })?.toString(); // '2026-07-06'
date('6 jui 2026', { loose: true, locale: 'fr' }); // null
```

## Opções das funções fábrica

:::entry
### `datetime()` :kind[function]

```js signature
datetime(input, { loose: true, zone?, locale?, dayFirst?, disambiguation? }): DateTime | null
date(input, { loose: true, zone?, locale?, dayFirst? }): CalendarDate | null
time(input, { loose: true, zone?, locale?, dayFirst? }): Time | null
duration(input, { loose: true, locale? }): Duration | null
yearMonth(input, { loose: true, zone?, locale? }): YearMonth | null
monthDay(input, { loose: true, zone?, locale?, dayFirst? }): MonthDay | null
dateRange(start, end, { loose: true, zone?, locale?, dayFirst? }): DateRange | null
```

Estende todas as funções fábrica com interpretação sensível ao locale e retorno `null` para entradas ilegíveis. Chamar construtores de classe como `new DateTime()` com `{ loose: true }` ativa a interpretação flexível, mas continua lançando erro quando a entrada não puder ser lida.

**Parâmetros**

```params
- name: loose
  type: boolean
  default: "false"
  description: "Interpretação de texto informal no locale ativo, com fallback para `Date` do runtime em formatos técnicos e retorno `null` em entradas ilegíveis."
- name: dayFirst
  type: boolean
  description: "Ordem numérica de datas que sobrescreve a do locale ativo para strings como `'07.09.2026'`."
- name: zone
  type: Zone
  description: Fuso horário usado para interpretar strings locais de data e hora ou exibir instantes.
- name: locale
  type: Locale
  description: Tag de locale BCP 47 mantida no valor e usada para nomes de meses, períodos do dia, estilo de relógio e ordem da data.
- name: disambiguation
  type: Disambiguation
  default: "'compatible'"
  description: "Estratégia para resolver lacunas e repetições do horário de verão em strings locais de data e hora. Com `'reject'`, o modo loose retorna `null`."
```

**Retorno**

```returns
type: DateTime | CalendarDate | Time | Duration | YearMonth | MonthDay | Range | null
description: Instância interpretada, ou `null` quando `input` não puder ser lido.
```

```js
date('Sept 6, 2026', { loose: true })?.toString(); // '2026-09-06'
date('2026-09', { loose: true }); // null
yearMonth('2026-09', { loose: true })?.toString(); // '2026-09'
```
:::

:::entry
### `configure()` :kind[function]

```js signature
configure({ dayFirst }): Settings
```

Sobrescreve a ordem numérica padrão de datas nas chamadas em modo loose que não informam `dayFirst` nem `locale` por chamada. Fica sem valor por padrão para que o modo loose siga o locale ativo.

**Parâmetros**

```params
- name: dayFirst
  type: boolean | null
  description: "Ordem fixa para datas numéricas no modo loose: dia primeiro (`true`), mês primeiro (`false`) ou `null` para seguir o locale ativo."
```
:::
