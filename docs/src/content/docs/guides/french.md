---
title: Dates and times in French
lede: Adapt date formatting and input parsing to Francophone regional conventions and French typography.
updated: 2026-11-21
---

See [Internationalization](/guides/internationalization/) to set a locale app-wide or per value, then watch for regional differences across the Francophone world and French typographic rules.

## Francophone regional variants

Bare `'fr'` applies metropolitan French conventions, whereas locales across Quebec, Switzerland, Belgium, and North Africa differ in date order and clock notation:

| Locale | Short format | Week start | Regional differences |
|---|---|---|---|
| `fr-FR`, `fr-SN`, `fr-MA` | `'01/11/2026 14:30'` | `1` — Monday | Slash separators, 24-hour clock, and July abbreviated as `'juil.'`. |
| `fr-CA` | `'2026-11-01 14 h 30'` | `7` — Sunday | Official ISO date order in Canada, spaced `'h'` clock notation, and July as `'juill.'`. |
| `fr-CH` | `'01.11.26 14:30'` | `1` — Monday | Dot separators and two-digit year in `'short'`, four digits with `'L'`. |
| `fr-BE` | `'1/11/26 14:30'` | `1` — Monday | Unpadded day and two-digit year in `'short'`, four digits with `'L'`. |
| `fr-DZ` | `'01/11/2026 2:30 PM'` | `6` — Saturday | Saturday week start and 12-hour clock in CLDR data. |

Pass the full regional tag so each reader sees familiar local formatting:

```js
import { datetime } from 'native-dates';

const rdv = datetime('2026-11-01T14:30:00', 'Europe/Paris');
rdv.format('short', 'fr-FR'); // '01/11/2026 14:30'
rdv.format('short', 'fr-CA'); // '2026-11-01 14 h 30'
rdv.format('short', 'fr-CH'); // '01.11.26 14:30'
rdv.format('L', 'fr-CH'); // '01.11.2026'
```

Canadian French starts weeks on Sunday, and `startOf('week')` and `weekdayNames()` follow that rule automatically. Pin Monday when reports or SQL keys require ISO weeks:

```js
import { date, weekdayNames } from 'native-dates';

const mercredi = date('2026-11-18');
mercredi.locale('fr-FR').startOf('week').toString(); // '2026-11-16'
mercredi.locale('fr-CA').startOf('week').toString(); // '2026-11-15'
weekdayNames('short', undefined, 'fr-FR')[0]; // 'lun.'
weekdayNames('short', undefined, 'fr-CA')[0]; // 'dim.'
mercredi.locale('fr-CA').startOf('week', 'monday').toString(); // '2026-11-16'
```

## French typography and format tokens

Escape literal letters in patterns like `'HH[h]mm'`: bare *h* prints the 12-hour hour without throwing, and unaccented *a* instead of *à* inserts the AM/PM marker:

```js
import { datetime } from 'native-dates';

const depart = datetime('2026-11-01T14:30:00', 'Europe/Paris').locale('fr-FR');
depart.format('HHhmm'); // '14230'
depart.format('HH[h]mm'); // '14h30'
depart.format('[le] dddd D MMMM [à] HH[h]mm'); // 'le dimanche 1 novembre à 14h30'
```

French writes *1er* only on day one, whereas presets print cardinal digits. Register an `ordinals` rule for `Do`, and regional tags inherit it automatically:

```js
import { configure, date } from 'native-dates';

date('2026-11-01').format('long', 'fr-FR'); // '1 novembre 2026'
configure({ ordinals: { fr: (jour) => (jour === 1 ? '1er' : jour) } });
date('2026-11-01').format('Do MMMM YYYY', 'fr-FR'); // '1er novembre 2026'
date('2026-11-02').format('Do MMMM YYYY', 'fr-FR'); // '2 novembre 2026'
date('2026-11-01').format('Do MMMM YYYY', 'fr-CA'); // '1er novembre 2026'
```

French weekdays and months stay lowercase even in `'full'`, capitalizing only when a date opens a sentence or standalone heading.

Never append a period after `MMM`: truncated months already include a dot, while *mars*, *mai*, *juin*, and *août* stay unpunctuated:

```js
import { monthNames } from 'native-dates';

const complet = date('2026-11-01').format('full', 'fr-FR');
// 'dimanche 1 novembre 2026'
complet[0].toUpperCase() + complet.slice(1); // 'Dimanche 1 novembre 2026'
monthNames('short', 'fr-FR').slice(4, 8); // ['mai', 'juin', 'juil.', 'août']
monthNames('short', 'fr-CA').slice(4, 8); // ['mai', 'juin', 'juill.', 'août']
```

## Parsing French date and time input

Core reads ISO dates common in Canada and rejects slashes or dots. Enable `dayFirst` with [the loose plugin](/plugins/loose/), or 06/11 reads month-first and 14/07 returns null:

```js
import '@native-dates/plugins/loose';
import { date } from 'native-dates';

date('06/11/2026', { loose: true }); // CalendarDate(2026-06-11)
date('14/07/2026', { loose: true }); // null
date('06/11/2026', { loose: true, dayFirst: true }); // CalendarDate(2026-11-06)
date('14.07.2026', { loose: true, dayFirst: true }); // CalendarDate(2026-07-14)
date('2026-07-14', { loose: true, dayFirst: true }); // CalendarDate(2026-07-14)
```

:::warning[False positives on spelled-out months]
In `date()` and `datetime()`, loose mode matches only English month names. Cognates like *mars*, *septembre*, *octobre*, and *novembre* pass by spelling overlap, whereas *février*, *mai*, *août*, and *décembre* return `null`.
:::

Partial dates in `monthDay()` and `yearMonth()` do recognize French month names, while French clock inputs like 14h30 need *h* replaced with a colon before parsing:

```js
import { dayMonth, duration, monthDay, time, yearMonth } from 'native-dates';

date('10 nov. 2026', { loose: true, locale: 'fr' }); // CalendarDate(2026-11-10)
date('10 déc. 2026', { loose: true, locale: 'fr' }); // null
monthDay('15 août', { loose: true, locale: 'fr' }); // MonthDay(08-15)
yearMonth('févr. 2026', { loose: true, locale: 'fr' }); // YearMonth(2026-02)
dayMonth('14/07'); // MonthDay(07-14)
time('14h30', { loose: true }); // null
time('14h30'.replace(/(\d)\s*h\s*(\d)/i, '$1:$2')); // Time(14:30:00)
duration('2h 30m'); // Duration(PT2H30M)
```

## Time zones across the Francophone world

North America shifts clocks two to three weeks before Europe in spring and one week later in autumn, narrowing the Paris-to-Montreal gap to five hours.

Morocco also returns to UTC+0 during Ramadan, so convert moments with `in()` rather than subtracting fixed hours:

```js
import { date } from 'native-dates';

const hiver = date('2026-01-15').at('15:00', 'Europe/Paris');
const mars = date('2026-03-16').at('15:00', 'Europe/Paris');
hiver.in('America/Montreal').format('short', 'fr-CA'); // '2026-01-15 09 h 00'
mars.in('America/Montreal').format('short', 'fr-CA'); // '2026-03-16 10 h 00'
```

With [the zones plugin](/plugins/zones/), accented cities like Montréal and Nouméa resolve directly. Alias exonyms like Bruxelles and Genève or Canadian French `'HNE'` for Eastern Standard Time in `zoneAliases`:

```js
import '@native-dates/plugins/zones';
import { configure, datetime } from 'native-dates';

configure({
  zoneAliases: {
    bruxelles: 'Europe/Brussels',
    geneve: 'Europe/Zurich',
    hne: 'America/Montreal',
  },
});
datetime('2026-11-16T09:30', 'Montréal').zone; // 'America/Montreal'
datetime('2026-11-16T09:30', 'Genève').zone; // 'Europe/Zurich'
datetime('2026-11-16T09:30', 'HNE').zone; // 'America/Montreal'
```

## Relative dates and non-breaking spaces

On a calendar date, relative phrasing uses `'avant-hier'` and `'après-demain'` for two days back or ahead, while moments stay numeric so late-night hours never read as yesterday.

In unit tests, expect the curly apostrophe in *aujourd’hui* and non-breaking spaces `U+202F` or `U+00A0` in short durations:

```js
import { date, datetime, duration } from 'native-dates';

const ref = date('2026-11-10');
ref.minus(2, 'days').from(ref, 'fr-FR'); // 'avant-hier'
ref.from(ref, 'fr-FR'); // 'aujourd’hui'
ref.plus(2, 'days').from(ref, 'fr-FR'); // 'après-demain'
const instant = datetime('2026-11-10T14:00', 'Europe/Paris');
instant.minus(24, 'hours').from(instant, 'fr-FR'); // 'il y a 1 jour'
duration({ hours: 3, minutes: 15 }).format('short', 'fr-FR');
// '3\u202fh et 15\u00a0min'
duration({ hours: 3, minutes: 15 }).format('short', 'fr-CA');
// '3\u00a0h et 15\u00a0min'
```
