# @native-dates/polyfill

Installs `temporal-polyfill` onto `globalThis.Temporal` only on runtimes without native `Temporal` support.

```js
import '@native-dates/polyfill';
import { now } from 'native-dates';
```

The default entry uses `await import()`, so runtimes with native `Temporal` never download the polyfill.

If another module evaluates dates at module load time or your bundler does not support top-level `await`, import the synchronous entry instead:

```js
import '@native-dates/polyfill/sync';
```
