# `@native-dates/polyfill`

Installs `temporal-polyfill` onto `globalThis.Temporal` only on runtimes that do not ship native `Temporal`.

```js
import '@native-dates/polyfill';
import { now } from '@native-dates/core';
```
