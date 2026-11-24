# @native-dates/polyfill

Installs `temporal-polyfill` onto `globalThis.Temporal` and an `Intl.DurationFormat` fallback onto `Intl` only on runtimes without native support (Safari, older browsers, and Node 22–25; Node 26+ ships both natively).

```js
import '@native-dates/polyfill';
import { now } from 'native-dates';
```

The default entry uses `await import()`, so runtimes with native `Temporal` and `Intl.DurationFormat` never download either polyfill.

If another module evaluates dates at module load time or your bundler does not support top-level `await`, import the synchronous entry instead:

```js
import '@native-dates/polyfill/sync';
```
