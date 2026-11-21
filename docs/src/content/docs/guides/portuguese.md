---
title: Dates and times in Portuguese
lede: Parse day/month/year dates safely and adapt formatting and time zones for Portuguese apps.
updated: 2026-11-21
---

See [Internationalization](/guides/internationalization/) to set a locale app-wide or per value, then watch for day-first slash dates and regional differences across the Lusophone world.

## Parsing day/month/year dates

Year-first ISO strings never swap month and day. Load [`@native-dates/plugins/loose`](/plugins/loose/) and enable `dayFirst` for loose slash or dot dates, or 06/11/2026 reads as June 11:

```js
import '@native-dates/plugins/loose';
import { configure, date } from 'native-dates';

date('06/11/2026', { loose: true })?.toString(); // '2026-06-11'
configure({ dayFirst: true });
date('06/11/2026', { loose: true })?.toString(); // '2026-11-06'
date('16.11.2026', { loose: true })?.toString(); // '2026-11-16'
date('29/02/2026', { loose: true }); // null
date('2026-11-06', { loose: true })?.toString(); // '2026-11-06'
```

Full dates match English month names only. Cognate abbreviations like *nov* or *mar* pass by coincidence, while *fev*, *mai*, and *de* phrases return `null`.

For partial dates, `dayMonth()` and `monthYear()` parse Brazilian numeric pairs without plugins, while loose mode recognizes all twelve Portuguese months:

```js
import { dayMonth, monthDay, monthYear, yearMonth } from 'native-dates';

date('16 de novembro de 2026', { loose: true, locale: 'pt-BR' }); // null
date('16 fev 2026', { loose: true, locale: 'pt-BR' }); // null
dayMonth('16/11').toString(); // '11-16'
monthYear('11/26').toString(); // '2026-11'
monthDay('16 de fev.', { loose: true, locale: 'pt-BR' })?.toString(); // '02-16'
yearMonth('novembro de 2026', { loose: true, locale: 'pt-BR' })?.toString();
// '2026-11'
```

## Formatting, prepositions, and abbreviations

Built-in presets output lowercase names and natural prepositions in Brazilian Portuguese. The `'medium'` preset abbreviates the month in Brazil, whereas Portugal prints slash-separated numbers:

```js
import { date, datetime } from 'native-dates';

const consulta = datetime('2026-11-16T14:30', 'America/Sao_Paulo').locale('pt-BR');
consulta.format('short'); // '16/11/2026, 14:30'
consulta.format('medium'); // '16 de nov. de 2026, 14:30'
consulta.format('long'); // '16 de novembro de 2026 às 14:30'
date('2026-11-16').format('medium', 'pt-PT'); // '16/11/2026'
```

Wrap literal prepositions in brackets, including `'[de]'` and the Portuguese crasis `'[às]'` meaning "at". Without brackets, *à* passes through while *s* prints seconds:

```js
consulta.format('DD/MM/YYYY às HH:mm'); // '16/11/2026 à0 14:30'
consulta.format('DD/MM/YYYY [às] HH:mm'); // '16/11/2026 às 14:30'
consulta.format('D [de] MMMM [de] YYYY'); // '16 de novembro de 2026'
```

Brazilian short months and weekdays are lowercase with a period, and `dd` uses one-letter initials because *segunda* and *sexta* share two leading letters.

Brazil also writes the first of the month as *1º* in *1º de maio*, while Portugal keeps 1. Set `ordinals` and `weekdayNames` for Brazil alone:

```js
import { configure, weekdayNames } from 'native-dates';

weekdayNames('narrow', undefined, 'pt-BR'); // ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
configure({
  ordinals: { 'pt-BR': (d) => (d === 1 ? '1º' : d) },
  weekdayNames: {
    'pt-BR': {
      short: {
        sun: 'Dom',
        mon: 'Seg',
        tue: 'Ter',
        wed: 'Qua',
        thu: 'Qui',
        fri: 'Sex',
        sat: 'Sáb',
      },
    },
  },
});
date('2026-05-01').format('ddd, Do [de] MMMM', 'pt-BR'); // 'Sex, 1º de maio'
date('2026-05-02').format('ddd, Do [de] MMMM', 'pt-BR'); // 'Sáb, 2 de maio'
date('2026-05-01').format('ddd, Do [de] MMMM', 'pt-PT'); // 'sexta, 1 de maio'
```

## Start of the week and weekday numbering

Weekday names from *segunda-feira* to *sexta-feira* reflect a Sunday-first week, yet `dayOfWeek` follows ISO 8601 with Monday as 1 and Sunday as 7.

Week boundaries follow regional `weekStart` data, starting on Sunday in Brazil and Portugal and on Monday in Angola and Cape Verde:

```js
import { date } from 'native-dates';

const quarta = date('2026-11-18').locale('pt-BR');
date('2026-11-16').dayOfWeek; // 1
quarta.weekStart; // 7
quarta.startOf('week').toString(); // '2026-11-15'
quarta.locale('pt-PT').startOf('week').toString(); // '2026-11-15'
quarta.locale('pt-AO').startOf('week').toString(); // '2026-11-16'
```

Pass Monday when business reports or timesheets group Monday through Sunday. Annual `weekOfYear` numbers always count Monday-based ISO weeks:

```js
quarta.startOf('week', 'monday').toString(); // '2026-11-16'
quarta.range('week', 'monday').toString(); // '2026-11-16/2026-11-22'
```

## Brazilian time zones and relative dates

Brazil spans four civil zones and ended daylight saving in 2019, keeping `'America/Sao_Paulo'` on UTC-3 today while preserving historical summer offsets. IANA has no America/Brasilia entry, so Brasília, Rio de Janeiro, Belo Horizonte, and Salvador throw `unknownZone`:

| Zone in Brazil | IANA identifier | Resolution in zones plugin |
|---|---|---|
| Fernando de Noronha | `America/Noronha` | Resolves `'Noronha'`, while `'FNT'` requires a `zoneAliases` entry. |
| Brasília Time | `America/Sao_Paulo`, `America/Bahia`, `America/Recife`, `America/Fortaleza`, `America/Belem` | Resolves `'BRT'`, `'São Paulo'`, `'Bahia'`, `'Belém'`, and `'Maceió'`, while Brasília, Rio de Janeiro, and Salvador need aliases. |
| Amazonas and Mato Grosso | `America/Manaus`, `America/Cuiaba`, `America/Campo_Grande`, `America/Porto_Velho`, `America/Boa_Vista` | Resolves `'Manaus'`, `'Cuiabá'`, and `'Campo Grande'`, while `'AMT'` requires a `zoneAliases` entry. |
| Acre | `America/Rio_Branco`, `America/Eirunepe` | Resolves `'Rio Branco'` and `'Eirunepé'`, whereas `'ACT'` defaults to `Australia/Adelaide`. |

With [`@native-dates/plugins/zones`](/plugins/zones/), accented IANA cities and BRT resolve directly. Register state capitals and regional abbreviations in `zoneAliases`:

```js
import '@native-dates/plugins/zones';
import { configure, datetime } from 'native-dates';

configure({
  zoneAliases: {
    brasilia: 'America/Sao_Paulo',
    amt: 'America/Manaus',
    act: 'America/Rio_Branco',
    fnt: 'America/Noronha',
  },
});
datetime('2026-11-16T14:00', 'Brasília').zone; // 'America/Sao_Paulo'
datetime('2026-11-16T14:00', 'São Paulo').in('ACT').format('HH:mm Z');
// '12:00 -05:00'
```

:::warning[Time zone abbreviations inside strings]
The zones plugin resolves only the zone parameter, not abbreviations like BRT appended to an informal input string. Strip the abbreviation from the text and pass `{ zone: 'BRT' }` in the call options.
:::

`CalendarDate` uses adverbs out to *anteontem* and *depois de amanhã*, while `DateTime` counts elapsed hours and phrases future dates differently in Brazil and Portugal.

UTC midnight hits at 21:00 Brasília Time, shifting `fromNow()` to tomorrow on UTC servers, so compare against the user's local date instead:

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
