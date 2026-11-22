---
title: Spanish
lede: Handle regional formats, week starts, and clock changes across Spain and the Americas.
updated: 2026-11-21
---

Bare `'es'` uses Spain's Monday week start and 24-hour clock. Apps serving Latin America or the United States should pass a regional tag like `'es-MX'` through [Localization](/guides/localization/).

## Spain, Latin America, and the US

Spain formats times on a 24-hour clock, while Latin America and US Spanish use 12-hour clocks with regional AM/PM spacing, date separators, and Peruvian *setiembre*:

```js
import { datetime } from 'native-dates';

const cita = datetime('2026-09-16T17:30:00', 'UTC');

cita.format('medium', 'es-ES'); // '16 sept 2026, 17:30'
cita.format('medium', 'es-MX'); // '16 sep 2026, 5:30 p.m.'
cita.format('medium', 'es-AR'); // '16 sept 2026, 5:30 p. m.'
cita.format('medium', 'es-CO'); // '16/09/2026, 5:30 p. m.'
cita.format('long', 'es-PE'); // '16 de setiembre de 2026 a las 5:30 p. m.'
cita.date.format('short', 'es-PR'); // '09/16/26'
```

First day of the week also splits across the Spanish-speaking world, and the generic `'es-419'` Latin America tag starts on Monday unlike Mexico or Colombia:

| Tags | Start and time | Regional convention |
|---|---|---|
| `'es'`, `'es-ES'` | `1`, `17:30` | Monday week start, 24-hour clock, and September abbreviated as *sept*. |
| `'es-MX'`, `'es-US'` | `7`, `5:30 p.m.` | Sunday week start and unspaced 12-hour period. |
| `'es-AR'`, `'es-CL'` | `1`, `5:30 p. m.` | Monday week start and spaced period, with hyphenated short dates in Chile. |
| `'es-CO'`, `'es-PE'` | `7`, `5:30 p. m.` | Sunday week start, numeric medium dates in Colombia, and *setiembre* in Peru. |
| `'es-PR'` | `7`, `5:30 p. m.` | Sunday week start and US month/day/year numeric order. |

Pin Monday with `startOf('week', 'monday')` when keying weekly database reports so Madrid and Mexico City land in the same bucket:

```js
import { date } from 'native-dates';

const wed = date('2026-11-18');

wed.locale('es-ES').startOf('week').toString(); // '2026-11-16'
wed.locale('es-MX').startOf('week').toString(); // '2026-11-15'
wed.locale('es-MX').startOf('week', 'monday').toString(); // '2026-11-16'
```

## Prepositions, lowercase names, and weekdays

Long Spanish dates join parts with *de*, *del*, and *a las*. Wrap literal connectors in square brackets inside token patterns so bare letters do not throw `unknownFormat`:

```js
import { datetime } from 'native-dates';

const ev = datetime('2026-11-16T18:30:00', 'Europe/Madrid').locale('es-ES');

ev.format('D [de] MMMM [de] YYYY'); // '16 de noviembre de 2026'
ev.format('dddd, D [de] MMMM [a las] HH:mm');
// 'lunes, 16 de noviembre a las 18:30'
```

Months, weekdays, and AM/PM markers stay lowercase in Spanish. Capitalize only the first character when a formatted date starts a heading.

Single-letter narrow weekdays repeat *M* across *martes* and *miércoles*. Two-letter `'dd'` avoids that collision out of the box, and [`configure()`](/api/configure/) lets you customize Wednesday or *1.º* on the first of the month:

```js
import { configure, date, weekdayNames } from 'native-dates';

const s = date('2026-05-01').format('full', 'es'); // 'viernes, 1 de mayo de 2026'
s[0].toUpperCase() + s.slice(1); // 'Viernes, 1 de mayo de 2026'
weekdayNames('narrow', 1, 'es-MX'); // ['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do']

configure({
  weekdayNames: { es: { narrow: { tue: 'M', wed: 'X' } } },
  ordinals: { es: (day) => (day === 1 ? '1.º' : day) },
});
date('2026-05-06').format('dd', 'es-MX'); // 'X'
date('2026-05-01').format('Do [de] MMMM', 'es-AR'); // '1.º de mayo'
```

## Parsing Spanish dates and months

Core rejects slash dates, and [the loose plugin](/plugins/loose/) defaults to month-first order. Pass `dayFirst: true` for slashes, dots, or Chilean hyphens, except on month-first Puerto Rico inputs:

```js
import '@native-dates/plugins/loose';
import { date, dayMonth, monthDay, yearMonth } from 'native-dates';

date('06/11/2026', { loose: true }).toString(); // '2026-06-11'
date('06/11/2026', { loose: true, dayFirst: true }).toString(); // '2026-11-06'
date('16-09-2026', { loose: true, dayFirst: true }).toString(); // '2026-09-16'
```

Numeric `dayMonth()` works in core without plugins, and partial dates in loose mode match Spanish month names including Peruvian *setiembre*:

```js
dayMonth('16/11').toString(); // '11-16'
monthDay('15 de enero', { loose: true, locale: 'es' }).toString(); // '01-15'
monthDay('16 set.', { loose: true, locale: 'es-PE' }).toString(); // '09-16'
yearMonth('enero de 2026', { loose: true, locale: 'es' }).toString(); // '2026-01'
```

## Time zones and midnight DST jumps

Most of Mexico stays on UTC-6 year-round outside northern border cities and Quintana Roo, whereas `'CST'` maps to Chicago and observes US daylight saving:

```js
import '@native-dates/plugins/zones';
import { configure, datetime } from 'native-dates';

datetime('2026-07-15T12:00', 'Mexico City').format('HH:mm Z'); // '12:00 -06:00'
datetime('2026-07-15T12:00', 'CST').format('HH:mm Z'); // '12:00 -05:00'
datetime('2026-07-15T12:00', 'Tijuana').format('HH:mm Z'); // '12:00 -07:00'
```

The [zones plugin](/plugins/zones/) matches Bogotá, Cancún, and Córdoba directly, while `'San Juan'` resolves to Argentina rather than Puerto Rico. Register local shorthand in `zoneAliases`:

```js
datetime('2026-07-15T12:00', 'San Juan').zone; // 'America/Argentina/San_Juan'

configure({
  zoneAliases: { cdmx: 'America/Mexico_City', cot: 'America/Bogota' },
});
datetime('2026-07-15T12:00', 'CDMX').zone; // 'America/Mexico_City'
datetime('2026-07-15T12:00', 'COT').zone; // 'America/Bogota'
```

Chile and Cuba start daylight saving at midnight, jumping straight from 00:00 to 01:00. Calling `at('00:00', zone)` or `startOf('day')` lands cleanly on 01:00 of that same date:

```js
import { date } from 'native-dates';

const spring = date('2026-09-06').at('00:00', 'America/Santiago');

spring.format('YYYY-MM-DD HH:mm Z'); // '2026-09-06 01:00 -03:00'
spring.hoursInDay; // 23
```

## Relative time

Spanish names five consecutive days from *anteayer* for two days ago through *pasado mañana* for two days ahead. `CalendarDate` returns those day words, while `DateTime` counts elapsed hours:

```js
import { date, datetime, today } from 'native-dates';

const ref = date('2026-11-16');

ref.minus(2, 'days').from(ref, 'es'); // 'anteayer'
ref.plus(2, 'days').from(ref, 'es'); // 'pasado mañana'
datetime('2026-11-14T12:00Z').from('2026-11-16T12:00Z', 'es'); // 'hace 2 días'
date('2026-11-18').from(today('America/Bogota'), 'es-CO');
```

On shared servers, pass `today(zone)` instead of `fromNow()` so midnight rollovers between *hoy* and *mañana* follow the user's local zone.
