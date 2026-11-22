---
title: Portuguese
lede: Format and parse dates across Brazil, Portugal, and Portuguese-speaking Africa.
updated: 2026-11-21
---

Pass `'pt-BR'` or `'pt-PT'` through [Internationalization](/guides/internationalization/) to format dates in Portuguese. Brazil and Portugal share day-first numeric dates and lowercase months, while differing on medium presets and first-day ordinals.

## Parsing day/month/year dates

Year-first ISO strings never swap month and day. For slash or dot input from forms, load [the loose plugin](/plugins/loose/) and enable `dayFirst` so `'06/11/2026'` reads as November 6 rather than June 11:

```js
import '@native-dates/plugins/loose';
import { configure, date } from 'native-dates';

date('06/11/2026', { loose: true })?.toString(); // '2026-06-11'

configure({ dayFirst: true });
date('06/11/2026', { loose: true })?.toString(); // '2026-11-06'
date('16.11.2026', { loose: true })?.toString(); // '2026-11-16'
date('29/02/2026', { loose: true }); // null
```

For partial dates, numeric day-month and month-year pairs parse in core without plugins, and loose mode matches Portuguese month names:

```js
import { dayMonth, monthDay, monthYear, yearMonth } from 'native-dates';

dayMonth('16/11').toString(); // '11-16'
monthYear('11/26').toString(); // '2026-11'
monthDay('16 de fev.', { loose: true, locale: 'pt-BR' })?.toString(); // '02-16'
yearMonth('novembro de 2026', { loose: true, locale: 'pt-BR' })?.toString();
// '2026-11'
```

## Presets, prepositions, and ordinals

Built-in presets output lowercase month names and natural prepositions. The medium preset spells out the abbreviated month in Brazil while printing slash-separated numbers in Portugal:

```js
import { date, datetime } from 'native-dates';

const consulta = datetime('2026-11-16T14:30', 'America/Sao_Paulo').locale('pt-BR');

consulta.format('short'); // '16/11/2026, 14:30'
consulta.format('medium'); // '16 de nov. de 2026, 14:30'
consulta.format('long'); // '16 de novembro de 2026 às 14:30'
date('2026-11-16').format('medium', 'pt-PT'); // '16/11/2026'
```

Wrap literal words in square brackets inside custom token patterns, including `'[de]'` and `'[às]'` before the hour:

```js
consulta.format('DD/MM/YYYY [às] HH:mm'); // '16/11/2026 às 14:30'
consulta.format('D [de] MMMM [de] YYYY'); // '16 de novembro de 2026'
```

Brazilian short months and weekdays are lowercase with a period, and `dd` uses single-letter initials because *segunda* and *sexta* start with the same two letters.

Brazil also writes the first of the month as *1º* in *1º de maio*, while Portugal uses plain numbers. Scope `ordinals` and weekday overrides to `'pt-BR'` so Portugal keeps its own defaults:

```js
import { configure, weekdayNames } from 'native-dates';

weekdayNames('narrow', undefined, 'pt-BR'); // ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

configure({
  ordinals: { 'pt-BR': (d) => (d === 1 ? '1º' : d) },
  weekdayNames: { 'pt-BR': { short: { fri: 'Sex', sat: 'Sáb' } } },
});
date('2026-05-01').format('ddd, Do [de] MMMM', 'pt-BR'); // 'Sex, 1º de maio'
date('2026-05-01').format('ddd, Do [de] MMMM', 'pt-PT'); // 'sexta, 1 de maio'
```

## Start of the week

Weekday names from *segunda-feira* to *sexta-feira* count from Sunday, while `dayOfWeek` follows ISO numbering from 1 on Monday to 7 on Sunday.

Week boundaries follow each region's `weekStart`, starting on Sunday in Brazil and Portugal and on Monday in Angola, Mozambique, and Cape Verde:

```js
import { date } from 'native-dates';

const quarta = date('2026-11-18').locale('pt-BR');

quarta.weekStart; // 7
quarta.startOf('week').toString(); // '2026-11-15'
quarta.locale('pt-PT').startOf('week').toString(); // '2026-11-15'
quarta.locale('pt-AO').startOf('week').toString(); // '2026-11-16'
```

Pass `'monday'` when business reports group Monday through Sunday. ISO `weekOfYear` numbers always count Monday-based weeks:

```js
quarta.startOf('week', 'monday').toString(); // '2026-11-16'
quarta.range('week', 'monday').toString(); // '2026-11-16/2026-11-22'
```

## Time zones and relative dates

Brazil spans four time zones and ended daylight saving time in 2019, keeping `'America/Sao_Paulo'` on UTC-3 year-round while preserving historical summer offsets:

| Zone in Brazil | Primary IANA zone | Regional zones and aliases |
|---|---|---|
| Fernando de Noronha | `America/Noronha` | UTC-2. Resolves `'Noronha'`; alias `'FNT'` via `zoneAliases`. |
| Brasília Time | `America/Sao_Paulo` | UTC-3, shared with Bahia, Recife, Fortaleza, and Belém; resolves `'BRT'`. |
| Amazonas and Mato Grosso | `America/Manaus` | UTC-4, shared with Cuiabá, Campo Grande, and Porto Velho; alias `'AMT'`. |
| Acre | `America/Rio_Branco` | UTC-5, shared with Eirunepé; alias `'ACT'`, which defaults to Adelaide. |

With [the zones plugin](/plugins/zones/), accented IANA cities and `'BRT'` resolve directly, and `zoneAliases` maps regional abbreviations or cities outside IANA:

```js
import '@native-dates/plugins/zones';
import { configure, datetime } from 'native-dates';

configure({
  zoneAliases: { brasilia: 'America/Sao_Paulo', act: 'America/Rio_Branco' },
});

datetime('2026-11-16T14:00', 'BRT').zone; // 'America/Sao_Paulo'
datetime('2026-11-16T14:00', 'São Paulo').in('ACT').format('HH:mm Z');
// '12:00 -05:00'
```

Calendar dates return natural words out to *anteontem* for two days ago and *depois de amanhã* for two days ahead, while `DateTime` counts elapsed hours and phrases future spans differently in Brazil and Portugal.

Because UTC midnight happens at 21:00 Brasília Time, pass `today('America/Sao_Paulo')` on UTC servers instead of calling `fromNow()`:

```js
import { date, today } from 'native-dates';

const ref = date('2026-11-16');

date('2026-11-14').from(ref, 'pt-BR'); // 'anteontem'
date('2026-11-18').from(ref, 'pt-BR'); // 'depois de amanhã'
datetime('2026-11-18T12:00Z').from('2026-11-16T12:00Z', 'pt-BR'); // 'em 2 dias'
datetime('2026-11-18T12:00Z').from('2026-11-16T12:00Z', 'pt-PT');
// 'dentro de 2 dias'
ref.from(today('America/Sao_Paulo'), 'pt-BR');
```
