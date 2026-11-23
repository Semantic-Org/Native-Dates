---
title: French
lede: Format and parse French dates across regional clocks and week starts.
updated: 2026-11-22
---

Bare `'fr'` uses metropolitan French conventions. Pass a regional tag like `'fr-CA'` through [Localization](/guides/localization/) when your readers expect local date order, clock separators, and week starts.

## Regional variants

Short date order, clock separators, and first day of the week shift across French-speaking regions:

| Locale | Short format | Week start | Regional differences |
|---|---|---|---|
| `fr-FR`, `fr-SN`, `fr-MA` | `'01/11/2026 14:30'` | `1` — Monday | Slash separators, 24-hour clock, and July abbreviated as `'juil.'`. |
| `fr-CA` | `'2026-11-01 14 h 30'` | `7` — Sunday | ISO date order in Canada, spaced `'h'` clock notation, and July as `'juill.'`. |
| `fr-CH` | `'01.11.26 14:30'` | `1` — Monday | Dot separators and two-digit year in `'short'`, four digits with `'L'`. |
| `fr-BE` | `'1/11/26 14:30'` | `1` — Monday | Unpadded day and two-digit year in `'short'`, four digits with `'L'`. |
| `fr-DZ` | `'01/11/2026 2:30 PM'` | `6` — Saturday | Saturday week start and 12-hour clock by default. |

Pass the full regional tag so presets print local punctuation:

```js
import { datetime } from 'native-dates';

const rdv = datetime('2026-11-01T14:30:00', 'Europe/Paris');

rdv.format('short', 'fr-FR'); // '01/11/2026 14:30'
rdv.format('short', 'fr-CA'); // '2026-11-01 14 h 30'
rdv.format('short', 'fr-CH'); // '01.11.26 14:30'
rdv.format('L', 'fr-CH'); // '01.11.2026'
```

Canadian French starts weeks on Sunday, and `startOf('week')` and `weekdayNames()` follow that rule automatically. Pin Monday when database reports require ISO weeks:

```js
import { date, weekdayNames } from 'native-dates';

const mercredi = date('2026-11-18');

mercredi.locale('fr-FR').startOf('week').toString(); // '2026-11-16'
mercredi.locale('fr-CA').startOf('week').toString(); // '2026-11-15'
weekdayNames('short', undefined, 'fr-CA')[0]; // 'dim.'
mercredi.locale('fr-CA').startOf('week', 'monday').toString(); // '2026-11-16'
```

## French typography and format tokens

Wrap literal letters in brackets inside patterns like `'HH[h]mm'`. Writing `'HHhmm'` without brackets throws `unknownFormat`, while a standalone accented *à* passes through unescaped:

```js
import { datetime } from 'native-dates';

const depart = datetime('2026-11-01T14:30:00', 'Europe/Paris').locale('fr-FR');

depart.format('HH[h]mm'); // '14h30'
depart.format('[le] dddd D MMMM à HH[h]mm'); // 'le dimanche 1 novembre à 14h30'
```

French writes *1er* on the first of the month and plain numbers on every other day. Register an `ordinals` rule on `'fr'`, and regional tags inherit it automatically:

```js
import { configure, date } from 'native-dates';

date('2026-11-01').format('long', 'fr-FR'); // '1 novembre 2026'

configure({ ordinals: { fr: (jour) => (jour === 1 ? '1er' : jour) } });
date('2026-11-01').format('Do MMMM YYYY', 'fr-FR'); // '1er novembre 2026'
date('2026-11-02').format('Do MMMM YYYY', 'fr-FR'); // '2 novembre 2026'
date('2026-11-01').format('Do MMMM YYYY', 'fr-CA'); // '1er novembre 2026'
```

Weekdays and months stay lowercase in French prose. Capitalize only the leading character when a date opens a heading.

Avoid typing a period after `MMM`: abbreviated months already include their own dot, while short names like *mars*, *mai*, *juin*, and *août* take none:

```js
import { monthNames } from 'native-dates';

const s = date('2026-11-01').format('full', 'fr'); // 'dimanche 1 novembre 2026'
s[0].toUpperCase() + s.slice(1); // 'Dimanche 1 novembre 2026'
monthNames('short', 'fr-FR').slice(4, 8); // ['mai', 'juin', 'juil.', 'août']
monthNames('short', 'fr-CA').slice(4, 8); // ['mai', 'juin', 'juill.', 'août']
```

## Parsing French date and time input

Core reads Canadian ISO strings and French hour-minute times like `'14h30'` directly. With [the loose plugin](/plugins/loose/), French locales read day-first slash dates, dot dates, ordinals, and full worded dates automatically:

```js
import '@native-dates/plugins/loose';
import { date, datetime, time } from 'native-dates';

time('14h30').toString(); // '14:30:00'
time('14 h 30').toString(); // '14:30:00'
date('06/11/2026', { loose: true, locale: 'fr' })?.toString(); // '2026-11-06'
date('14.07.2026', { loose: true, locale: 'fr' })?.toString(); // '2026-07-14'
date('1er mai 2026', { loose: true, locale: 'fr' })?.toString(); // '2026-05-01'
datetime('lundi 16 novembre 2026 à 14h30', {
  loose: true,
  locale: 'fr',
  zone: 'Europe/Paris',
})?.hour; // 14
```

Partial dates match French month names and accented abbreviations in loose mode. `dayMonth()` and `duration()` work in core without plugins:

```js
import { dayMonth, duration, monthDay, yearMonth } from 'native-dates';

dayMonth('14/07').toString(); // '07-14'
monthDay('1er mai', { loose: true, locale: 'fr' })?.toString(); // '05-01'
yearMonth('févr. 2026', { loose: true, locale: 'fr' })?.toString(); // '2026-02'
duration('2h 30m').toString(); // 'PT2H30M'
```

## Time zones

North America shifts clocks two to three weeks before Europe in spring and a week later in autumn, narrowing the Paris-to-Montreal gap from six hours to five.

Morocco also returns to UTC+0 during Ramadan, so convert moments with `in()` rather than subtracting fixed hours:

```js
import { date } from 'native-dates';

const hiver = date('2026-01-15').at('15:00', 'Europe/Paris');
const mars = date('2026-03-16').at('15:00', 'Europe/Paris');

hiver.in('America/Montreal').format('short', 'fr-CA'); // '2026-01-15 09 h 00'
mars.in('America/Montreal').format('short', 'fr-CA'); // '2026-03-16 10 h 00'
```

With [the zones plugin](/plugins/zones/), major French-speaking cities and Canadian abbreviations resolve directly with no aliases:

```js
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'Montréal').zone; // 'America/Montreal'
datetime('2026-11-16T09:30', 'Bruxelles').zone; // 'Europe/Brussels'
datetime('2026-11-16T09:30', 'Genève').zone; // 'Europe/Zurich'
datetime('2026-11-16T09:30', 'HNE').zone; // 'America/Toronto'
```

## Relative dates and non-breaking spaces

Calendar dates use *avant-hier* for two days ago and *après-demain* for two days ahead, while `DateTime` counts exact units so late-night hours never read as yesterday.

In test assertions, expect the curly apostrophe in *aujourd’hui* and narrow or standard non-breaking spaces inside short durations:

```js
import { date, datetime, duration } from 'native-dates';

const ref = date('2026-11-10');

ref.minus(2, 'days').from(ref, 'fr-FR'); // 'avant-hier'
ref.from(ref, 'fr-FR'); // 'aujourd’hui'
ref.plus(2, 'days').from(ref, 'fr-FR'); // 'après-demain'
datetime('2026-11-09T14:00Z').from('2026-11-10T14:00Z', 'fr-FR'); // 'il y a 1 jour'
duration({ hours: 3, minutes: 15 }).format('short', 'fr-FR');
// '3\u202fh et 15\u00a0min'
```
