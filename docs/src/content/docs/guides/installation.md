---
title: Installation
lede: One package with no dependencies. It runs on the Temporal your runtime ships.
updated: 2026-11-10
---

## Install

```bash
npm i native-dates
```

Import the factories you call. Everything else is tree-shaken away.

```js title="app.js"
import { date, now, today } from 'native-dates';

today().plus(2, 'weeks');
now().in('Europe/Berlin');
date('2026-09-01').at('9am', 'America/New_York');
```

## Add plugins

Plugins come in their own package. Importing one adds its methods, with no setup call.

```bash
npm i @native-dates/plugins
```

```js title="app.js" {1}
import '@native-dates/plugins/ranges';
import { today } from 'native-dates';

const sprint = today().to(2, 'weeks');
```

[All plugins](/plugins/) lists each one with its size.

## Where it runs

Native Dates wraps the runtime’s own `Temporal`.

| Runtime | Ships Temporal from |
|---|---|
| Chrome | 144 |
| Edge | 144 |
| Firefox | 139 |
| Node | 26 |

:::note[A runtime without Temporal]
Install `@native-dates/polyfill` and `temporal-polyfill`, then import the polyfill once before anything else. It downloads `temporal-polyfill` only where `Temporal` is missing.

```js title="app.js"
import '@native-dates/polyfill';
```
:::

## Next

- [Time zones](/guides/time-zones/): a zone as a view of one moment.
- [`DateTime` reference](/api/date-time/): every property and method.
