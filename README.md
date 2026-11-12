# <img alt="" src=".github/logo.svg" height="47" align="absmiddle"> Native Dates

> A thin date library built on the browser's Temporal and Intl APIs

- **Obvious Time Types** - Makes Temporals canon of irregular words a simple `DateTime`, `CalendarDate`, `Time` and `Duration` so things read like English at callsites
- **Browser-Native I18N** - Time zones, daylight transitions and calendar math handled by the platform not the library
- **Immutability**  - Prevents pitfalls from JS date math that modifies antecedents 
- **Legibility** - Natural phrases (`'1h 30m'`, `today().plus(2, 'days').at('9am')`) and `Intl` presets
- **Fully Tree Shakeable** -  ~7kb bt for core, everything arbitary is a plugin (day.js style)

### Usage

This library is fully built ontop of [Temporal](https://developer.mozilla.org/en-US/docs/Web/Javacript/Reference/Global_Objects/Temporal) and [Intl](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) API so correctness is a standard-committees problem not a GitHub Issue. 

The library also makes it incredibly easy to ju-jitsu between `DateTime`, `Time`, `Duration` etc by chaining 

```js
standup.in('Asia/Tokyo').as('time');
```

### Browser Compatibility

This library is compatible with latest Chrome, Internet Explorer, Firefox, and Safari Technical Preview.

For those needing Safari support before Spring 2027 (when this lands in baseline) or for other reasons use the included polyfill in @native-dates/polyfill

## Packages

| Package | Description |
| --- | --- |
| [native-dates](src) | The core date library |
| [@native-dates/plugins](packages/plugins) | Plugins like (`ranges`, `month-day`, `tokens`, `relative`, `zones`, `loose`, `legacy-date`) |
| [@native-dates/polyfill](packages/polyfill) | Required for Safari/iOS until Spring 2027.  `temporal-polyfill` only when `globalThis.Temporal` is absent |
| [@native-dates/core](packages/core) | Alias of `native-dates` |

## License

[ISC](LICENSE)
