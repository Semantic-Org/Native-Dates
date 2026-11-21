---
title: Dates and times in Spanish
lede: Handle regional differences across Spain and the Americas without tripping over prepositions in patterns or local clock changes.
updated: 2026-11-21
---

Because bare `'es'` applies Spain's Monday weeks and 24-hour clock, apps serving Latin America or the US should pair [Internationalization](/guides/internationalization/) with explicit regional tags.

## Spain, Latin America, and the US

Spain uses a 24-hour clock, while Latin America and US Spanish use 12-hour times with regional punctuation, separators, and Peruvian "setiembre" for September:

```js
import { datetime } from 'native-dates';

const cita = datetime('2026-09-16T17:30:00', 'UTC');
cita.format('medium', 'es-ES'); // '16 sept 2026, 17:30'
cita.format('medium', 'es-MX'); // '16 sep 2026, 5:30 p.m.'
cita.format('medium', 'es-AR'); // '16 sept 2026, 5:30 p. m.'
cita.format('medium', 'es-CO'); // '16/09/2026, 5:30 p. m.'
cita.format('medium', 'es-CL'); // '16-09-2026, 5:30 p. m.'
cita.format('long', 'es-PE');
// '16 de setiembre de 2026 a las 5:30 p. m.', Peruvian September
cita.date.format('short', 'es-PR'); // '09/16/26', US month/day/year
```

Start of week also divides Spanish locales, and even the `'es-419'` Latin America tag starts on Monday unlike Mexico or Colombia:

| Tags | Start and time | Regional convention |
|---|---|---|
| `'es'`, `'es-ES'` | `1`, `17:30` | Monday week start, 24-hour clock, and September abbreviated as *sept*. |
| `'es-MX'`, `'es-US'` | `7`, `5:30 p.m.` | Sunday week start and unspaced 12-hour period. |
| `'es-AR'`, `'es-CL'` | `1`, `5:30 p. m.` | Monday week start and spaced period, with hyphenated short dates in Chile. |
| `'es-CO'`, `'es-PE'` | `7`, `5:30 p. m.` | Sunday week start, numeric medium dates in Colombia, and *setiembre* for September in Peru. |
| `'es-PR'` | `7`, `5:30 p. m.` | Sunday week start and US month/day/year numeric order. |

Pin Monday with `startOf('week', 'monday')` when keying weekly database reports so Madrid and Mexico City match:

```js
import { date } from 'native-dates';

const wed = date('2026-11-18');
wed.locale('es-ES').startOf('week').toString(); // '2026-11-16'
wed.locale('es-MX').startOf('week').toString(); // '2026-11-15'
wed.locale('es-MX').startOf('week', 'monday').toString(); // '2026-11-16'
```

## Prepositions, lowercase names, and abbreviations

Long Spanish dates connect parts with *de*, *del*, and *a las*. Wrap those connectors in square brackets or bare letters throw `unknownFormat`:

```js
import { datetime } from 'native-dates';

const event = datetime('2026-11-16T18:30:00', 'Europe/Madrid').locale('es-ES');
// event.format('D de MMMM de YYYY') throws RangeError [unknownFormat]
event.format('D [de] MMMM [de] YYYY'); // '16 de noviembre de 2026', Nov 16, 2026
event.format('dddd, D [de] MMMM [a las] HH:mm');
// 'lunes, 16 de noviembre a las 18:30'
```

Months, weekdays, and meridiem tokens like `a` stay lowercase in Spanish, returning *a. m.* and *p. m.*, so capitalize only the first letter in headings.

Platform narrow weekdays repeat "M" for *martes* and *miércoles*. Two-letter `'dd'` avoids that Tuesday-Wednesday collision, and [`configure()`](/api/configure/) sets classic "X" or first-day ordinals:

```js
import { configure, date, weekdayNames } from 'native-dates';

const full = date('2026-05-01').format('full', 'es-ES');
// 'viernes, 1 de mayo de 2026'
full[0].toUpperCase() + full.slice(1); // 'Viernes, 1 de mayo de 2026'
weekdayNames('narrow', 1, 'es-MX');
// ['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do'], Mon to Sun
configure({
  weekdayNames: {
    es: {
      narrow: {
        mon: 'L',
        tue: 'M',
        wed: 'X',
        thu: 'J',
        fri: 'V',
        sat: 'S',
        sun: 'D',
      },
    },
  },
  ordinals: { es: (day) => (day === 1 ? '1.º' : day) },
});
weekdayNames('narrow', 1, 'es-MX'); // ['L', 'M', 'X', 'J', 'V', 'S', 'D']
date('2026-05-01').format('Do [de] MMMM', 'es-AR'); // '1.º de mayo', "1st of May"
```

## Parsing Spanish dates and months

Core rejects slash dates, and [`@native-dates/plugins/loose`](/plugins/loose/) defaults to month-first order. Pass `dayFirst: true` for slashes, dots, or Chilean hyphens, except on month-first Puerto Rico forms:

```js
import '@native-dates/plugins/loose';
import { date, dayMonth, monthDay, yearMonth } from 'native-dates';

date('06/11/2026', { loose: true }).toString(); // '2026-06-11', June 11
date('06/11/2026', { loose: true, dayFirst: true }).toString();
// '2026-11-06', Nov 6
date('16-09-2026', { loose: true, dayFirst: true }).toString();
// '2026-09-16', Chile
```

:::warning[Spanish months inside full dates]
Under `{ loose: true }`, full dates delegate month names to the JavaScript engine's English parser. Eight Spanish abbreviations match English by coincidence, while *enero*, *abril*, *agosto*, *diciembre*, and phrases with *de* return `null`.
:::

Partial month-day and year-month calls recognize all twelve Spanish months and Peruvian *setiembre*, though not *del*, while numeric `dayMonth()` works in core:

```js
date('15 nov 2026', { loose: true, locale: 'es' })?.toString(); // '2026-11-15'
date('15 ene 2026', { loose: true, locale: 'es' }); // null, "ene" is January
date('16 de noviembre de 2026', { loose: true, locale: 'es' }); // null
monthDay('15 de enero', { loose: true, locale: 'es' }).toString(); // '01-15'
monthDay('16 set.', { loose: true, locale: 'es-PE' }).toString();
// '09-16', Peruvian Sept
yearMonth('enero de 2026', { loose: true, locale: 'es' }).toString(); // '2026-01'
dayMonth('16/11').toString(); // '11-16'
```

## Time zones and clock changes

Since 2022 most of Mexico stays on UTC-6 year-round outside border zones and Quintana Roo, while CST and EST add summer hours unlike Mexico City, Bogotá, or Lima:

```js
import '@native-dates/plugins/zones';
import { configure, datetime } from 'native-dates';

datetime('2026-07-15T12:00', 'Mexico City').format('HH:mm Z'); // '12:00 -06:00'
datetime('2026-07-15T12:00', 'CST').format('HH:mm Z');
// '12:00 -05:00', Chicago CDT
datetime('2026-07-15T12:00', 'Tijuana').format('HH:mm Z');
// '12:00 -07:00', border DST
```

The [zones plugin](/plugins/zones/) matches Bogotá, Cancún, Córdoba, and Canary, whereas `'San Juan'` resolves to Argentina and non-IANA names like CDMX, La Habana, or Quito need `zoneAliases`:

```js
datetime('2026-07-15T12:00', 'San Juan').zone;
// 'America/Argentina/San_Juan', UTC-3, not PR
configure({
  zoneAliases: {
    cdmx: 'America/Mexico_City',
    habana: 'America/Havana',
    art: 'America/Argentina/Buenos_Aires',
    cot: 'America/Bogota',
    clt: 'America/Santiago',
  },
});
datetime('2026-07-15T12:00', 'CDMX').zone; // 'America/Mexico_City'
datetime('2026-07-15T12:00', 'COT').zone; // 'America/Bogota'
```

Chile and Cuba start daylight saving at midnight, jumping to 01:00. Calling `at('00:00', zone)` or `startOf('day')` lands on 01:00 without falling into the previous day:

```js
import { date } from 'native-dates';

const spring = date('2026-09-06').at('00:00', 'America/Santiago');
spring.format('YYYY-MM-DD HH:mm Z'); // '2026-09-06 01:00 -03:00'
spring.hoursInDay; // 23
```

## Relative time by day or by moment

Spanish names five consecutive days from *anteayer* to *pasado mañana* for two days back or ahead, which `CalendarDate` returns while `DateTime` counts hours:

```js
import { date, datetime, today } from 'native-dates';

const ref = date('2026-11-16');
ref.minus(2, 'days').from(ref, 'es'); // 'anteayer', day before yesterday
ref.minus(1, 'day').from(ref, 'es'); // 'ayer', yesterday
ref.plus(2, 'days').from(ref, 'es'); // 'pasado mañana', day after tomorrow
const instant = datetime('2026-11-16T12:00:00Z', 'UTC');
instant.minus(2, 'days').from(instant, 'es'); // 'hace 2 días', "2 days ago"
date('2026-11-18').from(today('America/Bogota'), 'es-CO');
```

On shared servers, pass `today(zone)` instead of `fromNow()` so the midnight rollover from *hoy* to *mañana* for today and tomorrow follows each user's zone.
