# <img alt="" src="https://nativedates.dev/logo.svg" height="47" align="absmiddle"> Native Dates

> A fast and small date library built on the browser's Temporal and Intl APIs

[Documentation](https://nativedates.dev) · [Guides](https://nativedates.dev/guides/overview/) · [Plugins](https://nativedates.dev/plugins/) · [Examples](https://nativedates.dev/examples/)

- **Obvious Time Types** - Makes Temporal's canon of irregular words a simple `DateTime`, `CalendarDate`, `Time`, and `Duration` so things read like English at callsites
- **Callsite Legibility** - Plain-language APIs (`today().plus(2, 'days').at('9am')`, `'1h 30m'`) make human and agentic file diffs read like English sentences rather than web specification treatise
- **Browser-Native I18N** - Time zones, daylight transitions, and calendar math handled as the browser specifies, not the library
- **Immutability** - Prevents JS pitfalls of accidental date mutations when working with copies
- **Small Core** - Under 15kb brotli for everything you'd expect in a date library, with plugins for anything truly arbitrary or rare (day.js style)

## Install

```bash
npm install native-dates
```

## Usage

This library is built on top of the browser's [Temporal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal) and [Intl](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) APIs so correctness is, for the most part, a standards-committee problem rather than a GitHub issue.

It also makes it easy to ju-jitsu between `CalendarDate`, `DateTime`, `Time`, `Duration`, and ranges by chaining:

```js
import { today, datetimeRange } from 'native-dates';

const standup = today().plus(2, 'days').at('9am', 'America/New_York');
const standupTime = standup.in('Asia/Tokyo').as('time'); // was a datetime, now a time!
const meeting = datetimeRange(standup, standup.plus('1h 30m'));

standup.format('medium');        // 'Nov 26, 2026, 9:00 AM'
standupTime.format('short');     // '11:00 PM'
meeting.duration.format('long'); // '1 hour, 30 minutes'
```

## Browser Compatibility

Works natively in latest Chrome, Edge, Firefox, Safari Technology Preview, and Node 26+.

For Safari/iOS before Spring 2027 (when Temporal lands in Baseline) or Node 20–25, use `@native-dates/polyfill` — it loads `temporal-polyfill` and `Intl.DurationFormat` only when absent.

## Packages

| Package | Description |
| --- | --- |
| [native-dates](src) | The core date library |
| [@native-dates/plugins](packages/plugins) | Plugins (`zones`, `loose`, `legacy-date`, `parse`, `ranges`, etc.) |
| [@native-dates/polyfill](packages/polyfill) | Required for Safari/iOS until Spring 2027 and Node 20–25. Loads `temporal-polyfill` and `Intl.DurationFormat` only when absent |
| [@native-dates/core](packages/core) | Alias of `native-dates` |
| [@native-dates/setup](packages/setup) | Standalone `npx @native-dates/setup` CLI for agent skills and project setup |

## About This Library

Hi, I'm Jack. 15 years ago I built a project called Semantic UI. Between then and now I helped build a company from 0 to 600 employees in a highly time-sensitive field, a system of record for home closings. There I dealt with pretty much every kind of date problem under the sun, so I'm excited today to release something to make time simpler for some people.

For the last three years I've been working full-time on a new full-stack JavaScript framework, not Semantic UI 2, but a web dev platform built on web standards like web components with a db agnostic data-sync layer using WebTransport and datagrams. We were the largest MeteorJS company in the world, so I'm excited to share with people what a fully integrated real time sync framework can mean if designed correctly and to scale... and was db agnostic... and handled file buckets and accounts and every hard problem faced repeatedly.

This date library is one of the pieces used in that framework that was extracted to be truly standalone and released separately from that framework, so anyone can use it. 

Expect more small, plain libraries in the coming months held to the same principles:

- **Byte Budget** - Ship the smallest thing that covers the feature set you need, and spend every byte cautiously.
- **Performance** - Measure with rigorous tools like [Tachometer](https://github.com/google/tachometer), benchmarking every changeset against the prior version and its cohort.
- **Web Standards** - Use the best parts of the platform as they ship, help people adopt the ones that are difficult to notice and make them easier to use.
- **Agent Collaboration** - Keep clear, public processes for adjudicating design decisions that both humans and agents can participate in.
- **Legibility** - Let code explain itself simply, so reading it feels obvious and unadorned, so that it disappears so you can think about intent.

## License

[ISC](LICENSE)
