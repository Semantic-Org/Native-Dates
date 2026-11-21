---
title: Dates and times in Russian
lede: Inflect Russian months and time units without locale dictionaries, and parse dotted dates and regional time zones without silent shifts.
updated: 2026-11-21
---

Beyond general [Internationalization](/guides/internationalization/), Russian dates center on grammatical month cases, three-way plural counts, dotted day-first inputs, and eleven regional time zones.

## Month cases and the "г." year suffix

Built-in presets put the month in the genitive case beside a day, keep nominative without one, and append the "г." year suffix:

```js
import { date, yearMonth } from 'native-dates';

const release = date('2026-11-16').locale('ru');
release.format('long'); // '16 ноября 2026 г.', genitive "Nov 16, 2026"
release.format('medium'); // '16 нояб. 2026 г.'
yearMonth('2026-11').format('long', 'ru');
// 'ноябрь 2026 г.', nominative "November 2026"
```

Token patterns omit "г." for compact labels, switching `MMMM` and `MMM` from nominative "май" to genitive "6 мая" for May right after a day token:

```js
const may = date('2026-05-06').locale('ru');
may.format('MMMM YYYY'); // 'май 2026', nominative "May 2026"
may.format('D MMMM YYYY'); // '6 мая 2026', genitive "May 6, 2026"
may.format('D MMM'); // '6 мая'
date('2026-03-08').format('D MMM', 'ru'); // '8 мар.', "Mar 8"
```

Genitive inflection stops when the month precedes the day or unescaped text separates them, so wrap literal suffixes between day and month in square brackets:

```js
may.format('D-го MMMM'); // '6-го май', unescaped suffix stays nominative
may.format('D[-го] MMMM'); // '6-го мая', bracketed "6th of May"
```

## Weekdays, lowercase names, and day numbers

Russian writes month and weekday names in lowercase, and weeks always begin on Monday with `weekStart` set to `1`.

Platform single-letter weekdays collide across Monday and Friday, Tuesday and Sunday, and Wednesday and Saturday, so narrow and short styles both return "пн" through "вс":

```js
import { date, weekdayNames } from 'native-dates';

weekdayNames('narrow', undefined, 'ru');
// ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'], Mon to Sun
date('2026-11-16').format('dddd, D MMMM', 'ru');
// 'понедельник, 16 ноября', Monday, Nov 16
```

Russian dates place no period after the day number, so `Do` outputs a bare number unless overridden alongside uppercase weekdays via [`configure()`](/api/configure/):

```js
import { configure, date, weekdayNames } from 'native-dates';

configure({
  weekdayNames: {
    ru: {
      short: {
        mon: 'Пн',
        tue: 'Вт',
        wed: 'Ср',
        thu: 'Чт',
        fri: 'Пт',
        sat: 'Сб',
        sun: 'Вс',
      },
    },
  },
  ordinals: { ru: (day) => `${day}-е` },
});
weekdayNames('short', undefined, 'ru');
// ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
date('2026-11-16').format('Do', 'ru'); // '16-е', ordinal "16th"
```

## Duration plurals and relative dates

Russian integers take three plural forms and shift case after prepositions. Formatting `Duration` values selects each form automatically and joins compound units with spaces:

```js
import { days, duration } from 'native-dates';

days(1).format('long', 'ru'); // '1 день', singular "1 day"
days(2).format('long', 'ru'); // '2 дня', paucal "2 days"
days(5).format('long', 'ru'); // '5 дней', plural "5 days"
days(21).format('long', 'ru'); // '21 день', singular after 21
duration({ days: 2, hours: 5, minutes: 21 }).format('long', 'ru');
// '2 дня 5 часов 21 минута', 2d 5h 21m
```

On `DateTime`, `from()` measures elapsed time numerically because 22 hours before midnight still falls on the same day.

On `CalendarDate`, it compares calendar days and returns all five Russian day words, including "позавчера" and "послезавтра" for two days back or ahead:

```js
import { date, datetime } from 'native-dates';

const baseDay = date('2026-11-16').locale('ru');
baseDay.minus(2, 'days').from(baseDay); // 'позавчера', day before yesterday
baseDay.minus(1, 'day').from(baseDay); // 'вчера', yesterday
baseDay.plus(1, 'day').from(baseDay); // 'завтра', tomorrow
baseDay.plus(2, 'days').from(baseDay); // 'послезавтра', day after tomorrow

const baseMoment = datetime('2026-11-16T12:00:00Z', 'Europe/Moscow').locale('ru');
baseMoment.minus(1, 'minute').from(baseMoment); // '1 минуту назад', 1 minute ago
baseMoment.plus(2, 'days').from(baseMoment); // 'через 2 дня', in 2 days
```

## Parsing dotted dates and Russian month names

Core accepts year-first "2026.11.16" strings, while everyday "16.11.2026" throws `invalidDate`. Load [`@native-dates/plugins/loose`](/plugins/loose/) and enable `dayFirst` to read dotted day-first dates in loose mode:

```js
import '@native-dates/plugins/loose';
import { configure, date, datetime } from 'native-dates';

configure({ dayFirst: true });
date('16.11.2026', { loose: true }); // CalendarDate for 2026-11-16
date('06.11.2026', { loose: true }); // CalendarDate for 2026-11-06
datetime('16.11.2026, 14:30', { zone: 'Europe/Moscow', loose: true });
// 14:30 in Moscow
```

:::warning[Swapped day and month values]
Without `dayFirst`, loose mode defaults to US month-first order. Input "16.11.2026" returns `null`, while "06.11.2026" silently becomes June 11 instead of November 6.
:::

Core reads dotted day-month and month-year pairs directly. Loose mode parses nominative and genitive Russian months on partial dates, while full Cyrillic dates return `null`:

```js
import { dayMonth, monthDay, monthYear, yearMonth } from 'native-dates';

dayMonth('06.11').toString(); // '11-06'
monthYear('11.2026').toString(); // '2026-11'
monthDay('16 ноября', { loose: true, locale: 'ru' }).toString();
// '11-16', genitive "Nov 16"
yearMonth('ноябрь 2026', { loose: true, locale: 'ru' }).toString();
// '2026-11', nominative "Nov 2026"
date('16 ноября 2026', { loose: true, locale: 'ru' }); // null
```

## Time zones across Russia and the CIS

Russia and Belarus dropped seasonal shifts and Kazakhstan unified on UTC+5 in 2024, yet across all eleven Russian zones IANA names still preserve historical transitions.

Loading [`@native-dates/plugins/zones`](/plugins/zones/) matches IANA leaf cities in any case, while CIS abbreviations, alternate spellings, and Cyrillic names require `zoneAliases`:

| Input | Default status | Resolution |
|---|---|---|
| `'Europe/Moscow'`, `'Asia/Almaty'` | Works in core | Full IANA identifiers work out of the box and keep historical offset rules. |
| `'Moscow'`, `'Yekaterinburg'`, `'Minsk'` | Works with plugin | Cities present in IANA identifiers match case-insensitively with the zones plugin. |
| `'MSK'`, `'SPB'`, `'Kazan'`, `'Astana'`, `'мск'` | Throws `unknownZone` | Map CIS abbreviations, non-IANA cities, and Cyrillic names in `zoneAliases`. |

Register project aliases once in [`configure()`](/api/configure/) to match any letter case:

```js
import '@native-dates/plugins/zones';
import { configure, datetime } from 'native-dates';

configure({
  zoneAliases: {
    MSK: 'Europe/Moscow',
    мск: 'Europe/Moscow',
    SPB: 'Europe/Moscow',
    'Saint Petersburg': 'Europe/Moscow',
    Ekaterinburg: 'Asia/Yekaterinburg',
    Astana: 'Asia/Almaty',
  },
});
datetime('2026-11-16T12:00:00Z', 'MSK').format('HH:mm', 'ru'); // '15:00'
datetime('2026-11-16T12:00:00Z', 'мск').zone; // 'Europe/Moscow', Cyrillic "MSK"
datetime('2026-11-16T12:00:00Z', 'Astana').offset; // '+05:00'
```
