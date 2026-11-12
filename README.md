# <img alt="" src=".github/logo.svg" height="47" align="absmiddle"> Native Dates

> A thin date library built on the browser's Temporal and Intl APIs

- Four nouns for what code actually means: `DateTime`, `CalendarDate`, `Time` and `Duration`
- Time zones, daylight transitions and calendar math handled by the platform
- Frozen values that lead in the console with their human-readable `text`
- Natural phrases (`'1h 30m'`, `today().plus(2, 'days').at('9am')`) and `Intl` presets
- Plugins you import only if you use them
- About 6 KB brotli, with zero dependencies

Native Dates leaves calendar math and formatting to the platform. The browser's [Temporal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal) and [Intl](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) APIs know every time zone, daylight transition and locale, and this library speaks them in plain English: four nouns instead of nine, one word per thought, and values that cannot be mutated in place.

```js
import { date, duration, now, today } from 'native-dates';
import '@native-dates/plugins/ranges';
import '@native-dates/plugins/tokens';

const standup = today().next('monday').at('9:30am', 'America/Los_Angeles');
standup.in('Europe/Berlin').format('dddd, MMM D [at] HH:mm z');

const sprint = date('2026-09-01').to(2, 'weeks');
sprint.contains(today());
sprint.points('day');

const remaining = now().until(standup);
remaining.total('hours');
duration('1h 30m').plus(15, 'minutes').format('short');
```

## Packages

| Package | Description |
| --- | --- |
| [native-dates](src) | The four nouns (`DateTime`, `CalendarDate`, `Time`, `Duration`), presets, comparisons and `configure()` |
| [@native-dates/plugins](packages/plugins) | The plugins (`ranges`, `month-day`, `tokens`, `relative`, `zones`, `loose`, `legacy-date`), each installed by importing it |
| [@native-dates/polyfill](packages/polyfill) | Loads `temporal-polyfill` only when `globalThis.Temporal` is absent |
| [@native-dates/core](packages/core) | Native Dates under its scoped name, a thin re-export |

## License

[ISC](LICENSE)
