---
title: Writing a plugin
lede: Extend Native Dates with opt-in prototype methods, cross-bundle type checks, and TypeScript module augmentation.
updated: 2026-11-12
---

Plugins install by importing a module, with no registration ceremony or wrapper calls.

You can publish reusable packages or add domain helpers inside your own app using the same pattern as [`@native-dates/plugins`](/plugins/).

## Attaching prototype methods

Import the class you want to extend and attach your method onto its `prototype`.

Every instance is frozen on construction. Plugin methods must stay pure and return a new value or computed result rather than mutating `this`.

```js
import { CalendarDate, date } from 'native-dates';

CalendarDate.prototype.nextBusinessDay = function nextBusinessDay() {
  const step = this.weekday === 5 ? 3 : this.weekday === 6 ? 2 : 1;
  return this.plus(step, 'days');
};

date('2026-11-13').nextBusinessDay().toString(); // '2026-11-16'
```

Read public properties on the instance or call `this.toTemporal()`, and build return values through methods like `this.plus()`.

When extending an existing method like `format()`, capture the original method first and delegate back to it for inputs your plugin does not handle:

```js
const baseFormat = CalendarDate.prototype.format;

CalendarDate.prototype.format = function format(spec, locale) {
  if (spec === 'compact') {
    return this.toString().replaceAll('-', '');
  }
  return baseFormat.call(this, spec, locale);
};

date('2026-11-16').format('compact'); // '20261116'
date('2026-11-16').format('short', 'en-US'); // '11/16/26'
```

## Checking types across bundles

Avoid checking `value.constructor.name` in plugin helpers. In monorepos, micro-frontends, or iframes, two copies of a package can load in memory at once.

Every class carries a global symbol brand. Type guards, [`kindOf()`](/api/kind-of/), and brand symbols like `IS_DATE_TIME` recognize values across realms and duplicate bundles.

```js
import { date, IS_CALENDAR_DATE, IS_DATE_TIME, kindOf, now } from 'native-dates';

export function isDateOrMoment(value) {
  return Boolean(value?.[IS_CALENDAR_DATE] || value?.[IS_DATE_TIME]);
}

isDateOrMoment(date('2026-11-16')); // true
kindOf(now()); // 'datetime'
```

## Declaring sideEffects in package.json

Callers activate a plugin with a bare import. List your entry files in `"sideEffects"` and place `"native-dates"` in peer dependencies so bundlers keep the import and share the host app's classes:

```json title="package.json"
{
  "name": "my-dates-plugin",
  "type": "module",
  "exports": {
    ".": {
      "types": "./index.d.ts",
      "import": "./index.js"
    }
  },
  "sideEffects": ["./index.js"],
  "peerDependencies": {
    "native-dates": "^0.0.6"
  }
}
```

:::warning[Do not mark side-effect plugins sideEffects false]
Setting `"sideEffects": false` tells bundlers to strip bare plugin imports from production builds, even when unit tests pass in Node.
:::

## Augmenting TypeScript types

Declare `module 'native-dates'` in your declaration file to merge new method signatures onto existing classes or configuration settings:

```ts title="index.d.ts"
import 'native-dates';

declare module 'native-dates' {
  interface CalendarDate {
    nextBusinessDay(): CalendarDate;
  }
}
```

Once imported, TypeScript surfaces your method alongside built-in methods at every callsite.
