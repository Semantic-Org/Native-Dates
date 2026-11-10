# Native Dates

> Temporal, spoken plainly. Datetimes, dates, times, durations, and ranges built directly on the browser's `Temporal` and `Intl` APIs with zero runtime dependencies.

```js
import { today } from 'native-dates';
import '@native-dates/plugins/ranges';
import '@native-dates/plugins/tokens';

const call = today().plus(2, 'days').at('9:30am', 'America/Los_Angeles');
call.in('Europe/Berlin').format('dddd h:mm a');
```

## Packages

| Package | Description |
| --- | --- |
| [native-dates](src) | Lean core (`DateTime`, `CalendarDate`, `Time`, `Duration`), presets, comparisons, and `configure()` |
| [@native-dates/plugins](packages/plugins) | The plugins (`ranges`, `tokens`, `relative`, `zones`, `loose`, `legacy-date`), each installed by importing it |
| [@native-dates/polyfill](packages/polyfill) | Loads `temporal-polyfill` only when `globalThis.Temporal` is absent |
| [@native-dates/core](packages/core) | Native Dates under its scoped name, a thin re-export |

## Commands

```bash
npm test      # run node:test suite
npm run size  # measure min + brotli-11 sizes
npm run format
```

## License

[ISC](LICENSE)
