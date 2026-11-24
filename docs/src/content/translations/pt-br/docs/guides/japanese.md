---
source: "e095c0bff2bd"
title: Japonês
lede: Formate eras imperiais e dias da semana entre parênteses em japonês, com suporte a datas com barras e semanas iniciadas no domingo.
---

Use `'ja-JP'` ao configurar a [Localização](/guides/localization/) para formatar datas em japonês. Os anos gregorianos permanecem como padrão, enquanto `'ja-u-ca-japanese'` alterna os presets para eras imperiais sob demanda.

## Eras imperiais e primeiros anos

Passe `'ja-u-ca-japanese'` para formatar datas imperiais oficiais, como Heisei 31 em 30 de abril de 2019 e o primeiro ano de Reiwa (*元年*) no dia seguinte:

```js
import { date } from 'native-dates';

date('2019-04-30').format('long', 'ja-u-ca-japanese'); // '平成31年4月30日'
date('2019-05-01').format('long', 'ja-u-ca-japanese'); // '令和元年5月1日'
date('2026-11-16').format('short', 'ja-u-ca-japanese'); // 'R8/11/16'
date('2026-11-16').format('llll', 'ja-u-ca-japanese'); // '令和8年11月16日(月)'
```

Padrões de tokens como `'YYYY年M月D日'` e a propriedade `year` sempre leem anos gregorianos, mesmo com uma tag de calendário imperial definida. Use presets ou objetos de opções quando quiser nomes de eras:

```js
const reiwa = date('2026-11-16').locale('ja-u-ca-japanese');

reiwa.year; // 2026
reiwa.format('long'); // '令和8年11月16日'
reiwa.format('YYYY年M月D日'); // '2026年11月16日'
```

[`YearMonth`](/api/year-month/) não possui dia e formata com a era vigente no dia 1º. Em transições no meio do mês, como janeiro de 1989 (de Showa 64 para Heisei 1), escolha um dia com [`on()`](/api/year-month/#on) primeiro:

```js
import { yearMonth } from 'native-dates';

const jan1989 = yearMonth('1989-01');

jan1989.format('long', 'ja-u-ca-japanese'); // '昭和64年1月'
jan1989.on(8).format('long', 'ja-u-ca-japanese'); // '平成元年1月8日'
```

## Dias da semana entre parênteses e relógio de 12 horas

Os presets padrão do japonês variam nos separadores e no estilo dos dias da semana:

| Preset | Saída | Estilo e uso típico |
|---|---|---|
| `'medium'` | `'2026/11/16'` | Notação compacta com barras para tabelas e campos de formulário. |
| `'long'` | `'2026年11月16日'` | Data padrão ano-mês-dia em kanji, sem dia da semana. |
| `'full'` | `'2026年11月16日月曜日'` | Anexa o dia da semana completo, como segunda-feira (*月曜日*), sem espaços nem parênteses. |
| `'llll'` | `'2026年11月16日(月)'` | Estilo comum em interfaces, com um único kanji (*月*) em parênteses de meia largura. |

O token `'ddd'` retorna o kanji isolado do dia da semana (como *月*) para que você possa envolvê-lo em parênteses de largura total. Os tokens de mês longo e dia ordinal já acrescentam *月* e *日*, então combine tokens numéricos com os kanjis literais quando quiser controle exato:

```js
import { date } from 'native-dates';

const day = date('2026-11-16').locale('ja-JP');

day.format('YYYY年M月D日（ddd）'); // '2026年11月16日（月）'
day.format('MMMMDo(ddd)'); // '11月16日(月)'
day.format({ month: 'long', day: 'numeric', weekday: 'short' }); // '11月16日(月)'
```

O relógio padrão usa 24 horas. Passe `hour12: true` para a convenção japonesa baseada em 0 (*午前0:30* e *午後0:30*), ou use `'Ah:mm'` para contar de 1 a 12:

```js
import { datetime } from 'native-dates';

const midnight = datetime('2026-11-16T00:30', 'Asia/Tokyo').locale('ja-JP');

midnight.format('time'); // '0:30'
midnight.format({ hour: 'numeric', minute: '2-digit', hour12: true }); // '午前0:30'
midnight.format('Ah:mm'); // '午前12:30'
```

## Notação com barras e entradas em japonês

Datas começando pelo ano em kanji, com barras ou com pontos, comuns em CSVs e formulários japoneses, são interpretadas diretamente no núcleo sem plugins:

```js
import { date, datetime, yearMonth } from 'native-dates';

date('2026年11月16日').toString(); // '2026-11-16'
date('2026/1/5').toString(); // '2026-01-05'
datetime('2026年11月16日 9:30', 'Asia/Tokyo').toString(); // '2026-11-16T00:30:00.000Z'
yearMonth('2026年11月').toString(); // '2026-11'
```

Com [o plugin loose](/plugins/loose/), dígitos e pontuação de largura total, horários com *午前* / *午後* e pares mês-dia em kanji são interpretados sem normalização manual:

```js
import '@native-dates/plugins/loose';
import { date, monthDay, time } from 'native-dates';

date('２０２６／１１／１６', { loose: true })?.toString(); // '2026-11-16'
time('午後2:30', { loose: true, locale: 'ja' })?.toString(); // '14:30:00'
monthDay('11月16日', { loose: true })?.toString(); // '11-16'
```

Strings com eras como `'令和8年11月16日'` ainda exigem entrada estruturada. Quando um formulário coleta era e ano separadamente, passe um `Temporal.PlainDate` com calendário japonês direto para [`date()`](/api/date-fn/) sem converter o calendário antes:

```js
const reiwaInput = Temporal.PlainDate.from({
  calendar: 'japanese',
  era: 'reiwa',
  eraYear: 8,
  month: 11,
  day: 16,
});

date(reiwaInput).toString(); // '2026-11-16'
```

## Fusos horários e início da semana

O núcleo aceita `'Asia/Tokyo'` e deslocamentos fixos. Com [o plugin zones](/plugins/zones/), `JST` e as principais cidades japonesas são resolvidos diretamente:

```js
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'JST').zone; // 'Asia/Tokyo'
datetime('2026-11-16T09:30', 'Osaka').zone; // 'Asia/Tokyo'
datetime('2026-11-16T09:30', '東京').zone; // 'Asia/Tokyo'
```

As tags em japonês iniciam a semana no domingo, como nos calendários de parede. Passe `'monday'` ou fixe `weekStart` ao montar agendas comerciais que começam na segunda-feira:

```js
import { date, weekdayNames } from 'native-dates';

const wed = date('2026-11-18').locale('ja-JP');

wed.weekStart; // 7
wed.startOf('week').toString(); // '2026-11-15'
wed.startOf('week', 'monday').toString(); // '2026-11-16'
weekdayNames('short', undefined, 'ja-JP');
// ['日', '月', '火', '水', '木', '金', '土']
weekdayNames('short', 'monday', 'ja-JP');
// ['月', '火', '水', '木', '金', '土', '日']
```

## Intervalos e expressões relativas

Presets de intervalo unem datas com barras ou horários em kanji usando um til de largura total. Passe um padrão de tokens para [`format()`](/api/ranges/#format) quando os dois extremos precisarem de datas em kanji e dias da semana:

```js
import { dateRange, timeRange } from 'native-dates';

const span = dateRange('2026-11-16', '2026-11-20').locale('ja-JP');

span.format('long'); // '2026/11/16～2026/11/20'
span.format('M月D日(ddd)'); // '11月16日(月) – 11月20日(金)'
timeRange('09:00', '17:30').format('short', 'ja-JP'); // '9時00分～17時30分'
```

[`CalendarDate`](/api/calendar-date/) retorna palavras naturais até *一昨日* (anteontem) e *明後日* (depois de amanhã). [`DateTime`](/api/date-time/) sempre exibe unidades contadas para que diferenças em horas não sejam lidas erroneamente como dias de calendário:

```js
import { date, datetime, duration } from 'native-dates';

const baseDate = date('2026-11-16').locale('ja-JP');
baseDate.minus(2, 'days').from(baseDate); // '一昨日'
baseDate.plus(2, 'days').from(baseDate); // '明後日'

const baseTime = datetime('2026-11-16T12:00', 'Asia/Tokyo').locale('ja-JP');
baseTime.minus(1, 'day').from(baseTime); // '1 日前'
duration({ hours: 2, minutes: 30 }).format('long', 'ja-JP'); // '2 時間 30 分'
```

:::tip[Espaços e código Unicode do til de largura total]
Expressões relativas e durações em japonês inserem espaços de meia largura ao redor dos números conforme os dados padrão do motor. Presets de intervalo emitem o til de largura total `U+FF5E` em vez do travessão ondulado `U+301C`, portanto confira o código Unicode nas asserções de teste.
:::
