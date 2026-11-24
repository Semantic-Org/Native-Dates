---
title: Customization
lede: Set app-wide defaults and extend Native Dates with custom formats or opt-in plugins.
updated: 2026-11-23
---

By default, Native Dates follows the runtime's local time zone and locale. Use [`configure()`](/api/configure/) and opt-in plugins when your app needs fixed defaults, named formats, or extra parsing and zone features.

## App-wide defaults

Call [`configure()`](/api/configure/) at startup to set a default time zone, locale, or start of the week across your app. Omitted keys keep their current value, and passing `null` restores the runtime default:

```js title="main.js"
import { configure, date, now } from 'native-dates';

configure({
  zone: 'America/New_York',
  locale: 'en-US',
  weekStart: 'monday',
});

now().zone; // 'America/New_York'
date('2026-11-18').startOf('week').toString(); // '2026-11-16'
```

Individual calls can still pass their own time zone, [`locale()`](/api/date-time/#locale), or week start to override the default.

:::warning[Configure once at startup on servers]
Global defaults are shared across the JavaScript process. On a multi-user server, attach each request's zone and locale directly to the value instead of mutating `configure()` per request.
:::

## Named formats

Register named formats under `formats` and pass their names to [`format()`](/guides/formatting/). Each entry accepts a token pattern or an `Intl` options object:

```js title="main.js"
import { configure, date, datetime } from 'native-dates';

configure({
  formats: {
    invoice: 'YYYY-MM-DD',
    receipt: { weekday: 'long', month: 'long', day: 'numeric' },
  },
});

date('2026-11-06').format('invoice'); // '2026-11-06'
const placed = datetime('2026-11-06T09:05', 'Europe/Berlin');
placed.format('receipt'); // 'Friday, November 6'
```

Named formats work on every type that supports [`format()`](/guides/formatting/), and custom names take precedence over built-in presets.

## Adding plugins

Optional plugins for city lookups, lenient parsing, and legacy `Date` getters live in [`@native-dates/plugins`](/plugins/):

```bash
npm i @native-dates/plugins
```

Import each subpath once at startup to enable it:

```js title="main.js"
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { date, datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'Berlin').zone; // 'Europe/Berlin'
date('Nov 16, 2026', { loose: true }); // CalendarDate(2026-11-16)
```

Plugins can also register their own [`configure()`](/api/configure/) options once loaded. The zones plugin adds `zoneAliases` for custom names, and the loose plugin adds `dayFirst` for numeric date order:

```js title="main.js"
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { configure, date, now } from 'native-dates';

configure({
  zoneAliases: { hq: 'Europe/Berlin' },
  dayFirst: true,
});

now('hq').zone; // 'Europe/Berlin'
date('07.09.2026', { loose: true }).toString(); // '2026-09-07'
```

Browse the [Plugins overview](/plugins/) to measure each subpath's size, or read [Writing a plugin](/guides/writing-a-plugin/) to package your own.

## Custom weekday names and ordinals

Month and weekday names come from the runtime's `Intl` data. When a design calls for custom abbreviations or day ordinals, override them with `weekdayNames` and `ordinals`:

```js title="main.js"
import { configure, date } from 'native-dates';

configure({
  weekdayNames: {
    en: { short: { tue: 'Tues', thu: 'Thurs' } },
  },
  ordinals: {
    fr: (day) => (day === 1 ? '1er' : day),
  },
});

date('2026-11-03').format('ddd', 'en-US'); // 'Tues'
date('2026-11-01').format('Do MMMM', 'fr'); // '1er novembre'
```

Pass `null` for either key to return to the runtime and built-in defaults. Next, read [Localization](/guides/localization/) to handle per-user languages, week boundaries, and calendar systems.
