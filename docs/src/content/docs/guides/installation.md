---
title: Installation
lede: Install the core package, add a Temporal polyfill for older runtimes, and set app-wide defaults.
updated: 2026-11-12
---

Native Dates ships as a small ES module package with TypeScript types included and zero runtime dependencies.

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

Native Dates runs directly on the platform's built-in `Temporal` and `Intl` APIs. Modern releases of Chrome, Edge, Firefox, Node, Deno, and Bun ship `Temporal` natively.

If your app also targets browsers or server versions without native support, install `@native-dates/polyfill` alongside `temporal-polyfill`:

```bash
npm i @native-dates/polyfill temporal-polyfill
```

Import `@native-dates/polyfill` once at your application entry point before anything else:

```js title="main.js"
import '@native-dates/polyfill';
import { today } from 'native-dates';

const launch = today().plus(30, 'days');
```

:::tip[Zero cost on modern browsers]
The entry import checks `globalThis.Temporal` first and dynamically loads `temporal-polyfill` only when it is missing. Browsers with native support skip downloading the polyfill chunk altogether.
:::

## Adding plugins

Optional additions like relative phrases, city and abbreviation lookups, loose parsing, and legacy `Date` getters live in [`@native-dates/plugins`](/plugins/):

```bash
npm i @native-dates/plugins
```

Import each subpath once in your entry file. Loading a subpath attaches its behavior immediately with no extra setup call:

```js title="main.js"
import '@native-dates/plugins/loose';
import '@native-dates/plugins/relative';
import '@native-dates/plugins/zones';
import { date, datetime, today } from 'native-dates';

today().minus(2, 'days').formatRelative(); // '2 days ago'
datetime('2026-11-16T09:30', 'Berlin').zone; // 'Europe/Berlin'
date('Nov 16, 2026', { loose: true }); // CalendarDate(2026-11-16)
```

Browse the [Plugins overview](/plugins/) to see every subpath and its size.

## App-wide defaults

By default, Native Dates uses the runtime's local time zone and locale, and starts weeks on Monday. Call [`configure()`](/api/configure/) once at startup to set defaults across your app:

```js title="main.js"
import { configure } from 'native-dates';

configure({
  zone: 'Europe/Berlin',
  locale: 'en-GB',
  weekStart: 'monday',
});
```

Any individual call can still pass its own time zone, locale, or week start when needed. Next, read [Types of time](/guides/types-of-time/) to pick the right type for each value you work with.
