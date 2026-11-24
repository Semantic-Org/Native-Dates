---
title: Localization
lede: Choose between the browser's default locale, a one-time app setting, a locale carried on a value, or a single-call override.
updated: 2026-11-23
---

Native Dates formats through the JavaScript engine's built-in `Intl` data. Every language, script, plural rule, and calendar system works without downloading locale files.

Where you set the locale depends on your runtime. Choose the scope that matches how your app runs:

- **Runtime default** when a browser app follows the reader's system settings
- **App-wide [`configure()`](/api/configure/)** when a client app has its own language switcher or fixed locale
- **Value-level [`locale()`](/api/date-time/#locale)** when a server formats per request or a chain carries its own language
- **One-off [`format()`](/api/date-time/#format)** when a single label needs another calendar or regional dialect

## Zero setup in the browser

When no locale is configured or passed, every `.text` property, `format()` call, range, duration, and name helper uses the runtime's active locale.

Single-user browser apps that follow the reader's system language need no setup:

```js
import { dateRange, hours, today } from 'native-dates';

today().text;
dateRange('2026-09-01', '2026-09-07').format('medium');
hours(2).format('long');
```

## App-wide default for client apps

Call [`configure()`](/api/configure/) once at startup when your app has its own language picker or targets a fixed locale. Update it again whenever the reader switches languages.

Every value, range, duration, partial date, and name helper formats in that locale:

```js title="main.js"
import { configure, date, days, monthNames, yearMonth } from 'native-dates';

configure({ locale: 'es-ES' });

date('2026-05-15').format('long'); // '15 de mayo de 2026'
yearMonth('2026-05').format('long'); // 'mayo de 2026'
days(2).text; // '2 días'
monthNames('short').slice(0, 3); // ['ene', 'feb', 'mar']

configure({ locale: null });
```

Pass `locale: null` to restore the runtime's default locale.

## Carrying a locale on a value

Call [`locale()`](/api/date-time/#locale) on any value to return a copy written in that language, or pass `{ locale }` to a factory. [`lang()`](/api/date-time/#lang) works as an alias when you prefer the shorter word.

Everything derived from that value keeps the same locale. Arithmetic, time zone shifts, date and time extracts, ranges, and measured durations all inherit it:

```js
import { date, datetime } from 'native-dates';

const arrival = datetime('2026-05-15T14:30:00Z', 'Europe/Paris').locale('fr-FR');

arrival.text; // '15 mai 2026, 16:30 UTC+2'
arrival.plus(3, 'days').date.format('long'); // '18 mai 2026'

const stay = date('2026-09-01', { locale: 'de-DE' }).to('2026-09-07');
stay.format('medium'); // '01.–07.09.2026'
```

On a multi-user server, attach each request's locale when reading a value instead of mutating process-wide settings:

```js title="orders.js"
import { datetime } from 'native-dates';

function formatOrder(order, user) {
  const placed = datetime(order.placedAt, user.zone).locale(user.locale);
  return {
    placed: placed.format('long'),
    shipBy: placed.plus(2, 'days').date.format('medium'),
  };
}

formatOrder({ placedAt: '2026-05-15T14:30:00Z' }, { zone: 'Asia/Tokyo', locale: 'ja-JP' });
```

:::warning[Avoid per-request configure on servers]
Global configuration updates shared state across the entire JavaScript process. On a multi-user server, another request can overwrite a `configure()` call across an async boundary. Attach `locale()` to the value instead.
:::

Calling `locale()` with no arguments reads back the active tag, or returns `undefined` when none was set. Passing an empty value clears it so `locale(user.locale)` chains safely even on an empty database column.

Raw locale strings and HTTP Accept-Language headers work directly without preprocessing. Underscore tags like `'en_US'` normalize automatically, and header tags sort by quality weight while dropping zero-weighted entries. Invalid locale strings throw [`unknownLocale`](/api/errors/#units-zones-and-formats):

```js
datetime('2026-05-15T14:30:00Z').locale('en_US').locale(); // 'en-US'
datetime('2026-05-15T14:30:00Z').locale('fr-CH;q=0.8, de;q=0.9, es;q=0').locale(); // ['de', 'fr-CH']
```

An instance locale controls localized text, week boundaries, and weekend days. Exact comparisons, sorting, [`equals()`](/api/date-time/#equals), and ISO serialization with [`toString()`](/api/date-time/#tostring) ignore it:

```js
import { date } from 'native-dates';

const french = date('2026-05-15').locale('fr');
const japanese = date('2026-05-15').locale('ja');

french.equals(japanese); // true
french.toString(); // '2026-05-15'
french.to(japanese).locale(); // 'fr'
```

When a method combines two values with different locales, the value the method was called on keeps its own locale.

## One-off calendar and dialect overrides

Pass a BCP 47 tag to `format()` when a single label needs another calendar, numbering system, or dialect. The value itself keeps its existing locale:

```js
import { date } from 'native-dates';

const reiwa = date('2019-05-01').locale('ja-JP');
reiwa.format('long'); // '2019年5月1日'
reiwa.format('long', 'ja-u-ca-japanese'); // '令和元年5月1日'

const eid = date('2026-03-20').locale('ar-SA');
eid.format('long', 'ar-SA-u-ca-islamic-umalqura'); // '١ شوال ١٤٤٧ هـ'
```

## How locales resolve

When formatting any value, range, duration, or relative phrase, Native Dates checks each source in order and uses the first locale it finds:

| Priority | Source | Use when |
|---|---|---|
| 1 | `value.format(spec, locale)` | One call needs another calendar, script, or regional dialect. |
| 2 | `value.locale(tag)` or `{ locale }` | Server requests, reusable chains, or localized UI sections. |
| 3 | `configure({ locale })` | Client apps have a global language setting or switcher. |
| 4 | Runtime `Intl` default | Browser apps follow the reader's system language. |

## Weeks and weekends

Week boundaries and weekday headers follow the active locale automatically. The runtime reports Sunday in the United States, Japan, Korea, and Brazil, Saturday in Egypt, and Monday across most of Europe and China.

Because [`startOf('week')`](/api/calendar-date/#startof), [`range('week')`](/api/calendar-date/#range), and [`weekdayNames()`](/api/month-names/#weekdaynames) share the same first-day rule, calendar headers always line up with week grids:

```js
import { date, weekdayNames } from 'native-dates';

const wed = date('2026-11-18');

wed.locale('en-US').startOf('week').toString(); // '2026-11-15'
wed.locale('de-DE').startOf('week').toString(); // '2026-11-16'
wed.locale('ar-EG').startOf('week').toString(); // '2026-11-14'

weekdayNames('short', undefined, 'en-US')[0]; // 'Sun'
weekdayNames('short', undefined, 'de-DE')[0]; // 'Mo'
```

Pass an explicit weekday to override one call, or set `weekStart` in [`configure()`](/api/configure/) to pin a start day across every locale. Passing an empty value returns to following the locale, and runtimes without week data fall back to Monday.

:::details[Guarding fixed-week reports]
An instance keeps the locale of the value it was derived from. Pin `weekStart` or check `day.weekStart`, from 1 for Monday through 7 for Sunday, whenever weeks key stored data like reports or billing periods:

```js title="reports.js"
function weekKey(day) {
  if (day.weekStart !== 1) {
    throw new Error('weekly reports are keyed by Monday weeks');
  }
  return day.startOf('week').toString();
}
```

ISO week numbers from `weekOfYear` always count weeks from Monday, and `dayOfWeek` follows the same Monday-first numbering.
:::

Weekend checks follow the active locale too. [`isWeekend()`](/api/calendar-date/#calendar-predicates) and [`isWeekday()`](/api/calendar-date/#calendar-predicates) treat Friday and Saturday as the weekend in Saudi Arabia and Egypt, and Friday alone in Iran. India uses Sunday alone, while most other locales use Saturday and Sunday:

```js
const friday = date('2026-11-20');

friday.locale('en-US').isWeekend(); // false
friday.locale('ar-SA').isWeekend(); // true
```

## Custom weekday names and ordinals

Month and weekday names come from the runtime, matching what the reader's device prints. Two format tokens have no standard platform field: two-letter weekdays with `dd`, and day ordinals with `Do`.

By default, `dd` truncates the short weekday to two letters where scripts abbreviate that way, and otherwise uses the runtime's narrow weekday. `Do` formats English ordinal suffixes in English and the locale's day marker elsewhere, such as `'6.'` in German.

Override either globally through `weekdayNames` and `ordinals` in [`configure()`](/api/configure/). Regional tags like `'fr-CA'` inherit their base language's entries and layer overrides on top, while presets and `Intl` options remain untouched. See [Customization](/guides/customization/#custom-weekday-names-and-ordinals) for examples.

Browse the [language examples](/examples/#localization) and the per-language guides under **Handling time in** in the sidebar for regional, script, and calendar edge cases. Next, read [Types of time](/guides/types-of-time/) to pick the right type for each value in your app.
