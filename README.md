# <img alt="" src="https://nativedates.dev/logo.svg" height="47" align="absmiddle"> Native Dates

> A fast and small date library built on the browser's Temporal and Intl APIs

- **Obvious Time Types** - Makes Temporal's canon of irregular words a simple `DateTime`, `CalendarDate`, `Time` and `Duration` so things read like English at callsites
- **Callsite Legibility** - Plain-language APIs make agentic file diffs read more like reading English sentences and not web specification treatise. 
- **Browser-Native I18N** - Time zones, daylight transitions and calendar math handled exactly as the browser specifies not the library
- **Immutability**  - Prevents js pitfalls of accidental date mutations when working with copies
- **Small Core** -  under 15kb brotli for everything you'd expect in a date library, plugins for anything truly arbitrary or rare (day.js style)

## Usage

This library is fully built on top of [Temporal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal) and [Intl](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) API so correctness is, for the most part, a standard-committee's problem not a GitHub Issue. 


The library also makes it incredibly easy to ju-jitsu between `DateTime`, `Time`, `Duration` etc by chaining 
```js
const standupTime = standup.in('Asia/Tokyo').as('time'); // was a date now I'm a time!
```

## About This Library

Hi, I'm Jack. 15 years ago I built a project called Semantic UI. Between then and now I helped build a company from 0-600 employees in a highly time-sensitive field, a system of record for home closings. There I dealt with pretty much every kind of date problem under the sun, so I'm excited today to release something to make time simpler for some people.

This is the first of many libraries I will be releasing in anticipation of my new top level Javascript framework next year. Expect to see in the coming months more simple, plain libraries that hold the values that i care about foremost in their authorship. 

* File Size -- Ship the smallest thing that you can for the feature set you need. Have a byte budget, and spend it cautiously.
* Performance -- Use rigorous benchmarking like Google's tachometer, bench every changeset against your prior version and your cohort
* Web Standards - Use the best parts of the platform as they ship, build on it and make it easier to use.
* Agent Collaboration - Build durable processes for adjudicating project issues that humans or agents can participate it. Make them clear and public.
* Legibility - The same values that drove semantic ui. Let the code explain itself simply. Make reading your code obvious, beautiful and unadorned.

## Browser Compatibility

This library is compatible with latest Chrome, Edge, Firefox, and Safari Technical Preview.

For those needing Safari support before Spring 2027 (when this lands in baseline) or for Node 22-25 use the included polyfill in `@native-dates/polyfill`

## Packages

| Package | Description |
| --- | --- |
| [native-dates](src) | The core date library |
| [@native-dates/plugins](packages/plugins) | Plugins like (`zones`, `loose`, `legacy-date`, `parse`, `ranges` etc.) |
| [@native-dates/polyfill](packages/polyfill) | Required for Safari/iOS until Spring 2027 and Node 22–25. Loads `temporal-polyfill` and `Intl.DurationFormat` only when absent |
| [@native-dates/core](packages/core) | Alias of `native-dates` |
| [@native-dates/setup](packages/setup) | Standalone `npx @native-dates/setup` CLI for agent skills and project setup |

## License

[ISC](LICENSE)
