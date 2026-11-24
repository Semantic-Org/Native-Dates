---
title: Installation
lede: Add Native Dates in one command, with an optional polyfill for Safari and older Node releases.
updated: 2026-11-23
---

Native Dates is an ES module package with bundled TypeScript types and zero runtime dependencies.

## Install

Install from npm, or use the setup command if you work with a coding agent:

```bash label="npm"
npm i native-dates
```

```bash label="With skills"
npx native-dates@latest
```

Then import from `native-dates` in your app:

```js title="app.js"
import { date, now, today } from 'native-dates';

const due = today().plus(2, 'weeks');
const current = now('Europe/Berlin');
const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
standup.format('YYYY-MM-DD HH:mm'); // '2026-11-16 09:30'
```

## Supporting Safari and older Node

Native Dates runs directly on the platform's built-in `Temporal` and `Intl` APIs. Current releases of Chrome, Edge, Firefox, Node 26+, Deno, and Bun need nothing else.

For Safari, older browsers, or Node 24–25, install the polyfill alongside `temporal-polyfill`:

```bash
npm i @native-dates/polyfill temporal-polyfill
```

Import it once at the top of your entry file before loading date code:

```js title="main.js"
import '@native-dates/polyfill';
import { today } from 'native-dates';

const launch = today().plus(30, 'days');
```

:::tip[Zero cost on modern browsers]
Runtimes with native `Temporal` skip downloading `temporal-polyfill` altogether.
:::

:::details[Compatibility notes for older runtimes]
- **Synchronous loading:** If an imported module evaluates dates at load time before top-level `await` settles, import `@native-dates/polyfill/sync` instead.
- **Formatting durations on Node:** Server code calling [`Duration.format()`](/api/duration/#format) requires Node 24+ for `Intl.DurationFormat`. Browser bundles still build fine on older Node versions.
:::

Next, read [Customization](/guides/customization/) to tailor defaults and add optional plugins.
