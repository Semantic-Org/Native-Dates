---
title: Installation
lede: Install the core package, add a Temporal polyfill for Safari or older runtimes, and set app-wide defaults.
updated: 2026-11-16
---

Native Dates ships as a small ES module package with TypeScript types included and zero bundled time zone or locale data.

## Install the core package

Install `native-dates` from npm:

```bash
npm i native-dates
```

Import only the functions you call. Bundlers tree-shake everything else automatically:

```js title="app.js"
import { date, monthDay, now, today, yearMonth } from 'native-dates';

const sprint = today().to(2, 'weeks');
const current = now('Europe/Berlin');
const standup = date('2026-11-16').at('9:30am', 'America/New_York');
standup.format('YYYY-MM-DD HH:mm'); // '2026-11-16 09:30'

const billing = yearMonth('2026-11');
const birthday = monthDay('10/17');
```

## Runtime support and polyfilling

Native Dates runs directly on the platform's built-in `Temporal` and `Intl` APIs. Current releases of Chrome, Edge, Firefox, Node 26+, Deno, and Bun ship both natively.

Safari, older browser versions, and Node releases before 26 do not ship native `Temporal` yet. When targeting those runtimes, install `@native-dates/polyfill` alongside `temporal-polyfill`:

```bash
npm i @native-dates/polyfill temporal-polyfill
```

Import `@native-dates/polyfill` once at your application entry point before anything else:

```js title="main.js"
import '@native-dates/polyfill';
import { today } from 'native-dates';

const launch = today().plus(30, 'days');
```

If another imported module evaluates dates at module load time before top-level `await` finishes, import `'@native-dates/polyfill/sync'` instead to load the polyfill synchronously.

:::tip[Zero cost on modern browsers]
The entry import checks `globalThis.Temporal` first and dynamically loads `temporal-polyfill` only when it is missing. Browsers with native support skip downloading the polyfill chunk altogether.
:::

## Adding plugins

Optional additions like city and abbreviation lookups, loose parsing, and legacy `Date` getters live in [`@native-dates/plugins`](/plugins/):

```bash
npm i @native-dates/plugins
```

Import each subpath once in your entry file. Loading a subpath attaches its behavior immediately with no extra setup call:

```js title="main.js"
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { date, datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'Berlin').zone; // 'Europe/Berlin'
date('Nov 16, 2026', { loose: true }); // CalendarDate(2026-11-16)
```

Browse the [Plugins overview](/plugins/) to see every subpath and its size.

## App-wide defaults

By default, Native Dates uses the runtime's local time zone and locale, including that locale's first day of the week. Call [`configure()`](/api/configure/) once at startup to set defaults across your app, or pass `weekStart` when you want a fixed first day regardless of locale:

```js title="main.js"
import { configure } from 'native-dates';

configure({
  zone: 'America/New_York',
  locale: 'en-US',
  weekStart: 'monday',
});
```

Any individual value or call can still carry its own time zone, [`locale()`](/api/date-time/#locale), or week start when needed. Next, read [Internationalization](/guides/internationalization/) to choose how your app localizes dates across browsers and servers.
