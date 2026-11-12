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
import { date, now, today } from 'native-dates';

const due = today().plus(2, 'weeks');
const current = now('Europe/Berlin');
const standup = date('2026-11-16').at('9:30am', 'America/New_York');
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

Optional features like date ranges, custom format tokens, relative phrases, city lookup, and loose parsing live in [`@native-dates/plugins`](/plugins/):

```bash
npm i @native-dates/plugins
```

Import each subpath once in your entry file. Loading a subpath attaches its methods immediately with no extra setup call:

```js title="main.js"
import '@native-dates/plugins/ranges';
import '@native-dates/plugins/tokens';
import { today } from 'native-dates';

const sprint = today().to(2, 'weeks');
today().format('YYYY-MM-DD');
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
