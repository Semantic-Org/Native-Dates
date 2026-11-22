---
title: Russian
lede: Format inflected months and plural units in Russian, and parse dotted dates and regional time zones.
updated: 2026-11-21
---

Pass `'ru'` through [Localization](/guides/localization/) to format dates in Russian. Built-in `Intl` data handles grammatical month cases and three-way duration plurals with zero locale files.

## Month cases and the "г." year suffix

Presets put the month in the genitive case beside a day number, keep the nominative case for standalone month-years, and append the *г.* year suffix:

```js
import { date, yearMonth } from 'native-dates';

const release = date('2026-11-16').locale('ru');

release.format('long'); // '16 ноября 2026 г.'
release.format('medium'); // '16 нояб. 2026 г.'
yearMonth('2026-11').format('long', 'ru'); // 'ноябрь 2026 г.'
```

Custom token patterns omit *г.* for compact UI labels, switching `MMMM` and `MMM` from nominative *май* to genitive *мая* for May right after a day token:

```js
const may = date('2026-05-06').locale('ru');

may.format('MMMM YYYY'); // 'май 2026'
may.format('D MMMM YYYY'); // '6 мая 2026'
may.format('D MMM'); // '6 мая'
date('2026-03-08').format('D MMM', 'ru'); // '8 мар.'
```

Wrap literal case endings like `[-го]` in brackets between the day and month so genitive inflection still applies to `MMMM`:

```js
may.format('D[-го] MMMM'); // '6-го мая'
```

## Weekdays, lowercase names, and day numbers

Russian writes month and weekday names in lowercase, and weeks start on Monday with `weekStart` equal to `1`.

Single-letter weekday initials collide across several days in Russian, so both narrow and short styles return two-letter *пн* through *вс* from Monday to Sunday:

```js
import { date, weekdayNames } from 'native-dates';

weekdayNames('narrow', undefined, 'ru');
// ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']
date('2026-11-16').format('dddd, D MMMM', 'ru'); // 'понедельник, 16 ноября'
```

Russian dates place no period after the day number, so `Do` outputs a plain number unless customized alongside capitalized weekdays in [`configure()`](/api/configure/):

```js
import { configure, date } from 'native-dates';

configure({
  weekdayNames: { ru: { short: { mon: 'Пн', fri: 'Пт' } } },
  ordinals: { ru: (day) => `${day}-е` },
});

date('2026-11-16').format('ddd, Do MMMM', 'ru'); // 'Пн, 16-е ноября'
```

## Duration plurals and relative dates

Russian counts units with three forms across 1 and 21, 2 to 4, and 5 to 20. Formatting a `Duration` selects each form automatically:

```js
import { days, duration } from 'native-dates';

days(1).format('long', 'ru'); // '1 день'
days(2).format('long', 'ru'); // '2 дня'
days(5).format('long', 'ru'); // '5 дней'
days(21).format('long', 'ru'); // '21 день'
duration({ days: 2, hours: 5, minutes: 21 }).format('long', 'ru');
// '2 дня 5 часов 21 минута'
```

On `DateTime`, `from()` counts elapsed hours and minutes so 22 hours before midnight still stays numeric.

On `CalendarDate`, it compares calendar days and returns natural Russian words out to *позавчера* for two days ago and *послезавтра* for two days ahead:

```js
import { date, datetime } from 'native-dates';

const day = date('2026-11-16').locale('ru');
day.minus(2, 'days').from(day); // 'позавчера'
day.minus(1, 'day').from(day); // 'вчера'
day.plus(2, 'days').from(day); // 'послезавтра'

const moment = datetime('2026-11-16T12:00:00Z', 'Europe/Moscow').locale('ru');
moment.minus(1, 'minute').from(moment); // '1 минуту назад'
moment.plus(2, 'days').from(moment); // 'через 2 дня'
```

## Parsing dotted dates and Russian month names

Core accepts year-first `'2026.11.16'` strings and rejects day-first dots. Load [the loose plugin](/plugins/loose/) and enable `dayFirst` to read dotted day-first dates:

```js
import '@native-dates/plugins/loose';
import { configure, date, datetime } from 'native-dates';

configure({ dayFirst: true });

date('16.11.2026', { loose: true }); // CalendarDate(2026-11-16)
date('06.11.2026', { loose: true }); // CalendarDate(2026-11-06)
datetime('16.11.2026, 14:30', { zone: 'Europe/Moscow', loose: true });
```

:::warning[Swapped day and month values]
Without `dayFirst`, loose mode defaults to month-first order. Input `'16.11.2026'` returns `null`, while `'06.11.2026'` becomes June 11 instead of November 6.
:::

Core reads dotted day-month and month-year pairs directly, and loose mode matches both nominative and genitive Russian month names on partial dates:

```js
import { dayMonth, monthDay, monthYear, yearMonth } from 'native-dates';

dayMonth('06.11').toString(); // '11-06'
monthYear('11.2026').toString(); // '2026-11'
monthDay('16 ноября', { loose: true, locale: 'ru' })?.toString(); // '11-16'
yearMonth('ноябрь 2026', { loose: true, locale: 'ru' })?.toString(); // '2026-11'
```

## Time zones across Russia and neighboring countries

Russia spans eleven time zones without seasonal clock changes, and Kazakhstan unified on UTC+5 in 2024. Full IANA identifiers preserve historical offset transitions across every zone.

With [the zones plugin](/plugins/zones/), IANA city names match in any letter case, and `zoneAliases` maps abbreviations, alternate spellings, and Cyrillic names:

| Input | Default status | Resolution |
|---|---|---|
| `'Europe/Moscow'`, `'Asia/Almaty'` | Works in core | Full IANA identifiers work out of the box and keep historical offset rules. |
| `'Moscow'`, `'Yekaterinburg'`, `'Minsk'` | Works with plugin | Cities present in IANA identifiers match in any letter case with the zones plugin. |
| `'MSK'`, `'SPB'`, `'Kazan'`, `'Astana'`, `'мск'` | Needs alias | Map local abbreviations, unlisted cities, and Cyrillic names in `zoneAliases`. |

Register project aliases once in [`configure()`](/api/configure/):

```js
import '@native-dates/plugins/zones';
import { configure, datetime } from 'native-dates';

configure({
  zoneAliases: {
    MSK: 'Europe/Moscow',
    мск: 'Europe/Moscow',
    Astana: 'Asia/Almaty',
  },
});
datetime('2026-11-16T12:00:00Z', 'MSK').format('HH:mm', 'ru'); // '15:00'
datetime('2026-11-16T12:00:00Z', 'мск').zone; // 'Europe/Moscow'
datetime('2026-11-16T12:00:00Z', 'Astana').offset; // '+05:00'
```
