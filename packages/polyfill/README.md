# `@native-dates/polyfill`

Installs `temporal-polyfill` onto `globalThis.Temporal` only on runtimes that do not ship native `Temporal`.

```js
import '@native-dates/polyfill';
import { now } from '@native-dates/core';
```

The polyfill downloads only where it is needed, and is in place before the code of the file that imports it runs. A file that works out a date as it loads, `export const start = today()`, can run before then. For that, import the entry that loads the polyfill outright:

```js
import '@native-dates/polyfill/sync';
```
