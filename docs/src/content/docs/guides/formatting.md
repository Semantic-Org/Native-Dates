---
title: Formatting
lede: Format dates, times, and durations with built-in Intl presets, locale tags, custom token strings, and relative phrases.
updated: 2026-11-12
---

Native Dates uses the platform's built-in `Intl` formatters and caches them automatically. You get localized output across languages and regions without adding locale files to your bundle.

## Quick output with text and presets

Every instance has a `.text` property formatted in your active locale, which is handy for templates, logs, and console debugging. Calling `format()` with no arguments uses each type's default preset:

```js
import { date, datetime, duration, time } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
standup.text; // 'Nov 16, 2026, 9:30 AM PST'
standup.format(); // 'Nov 16, 2026, 9:30 AM'

date('2026-11-16').text; // 'Nov 16, 2026'
time('9:30am').text; // '9:30 AM'
duration('1h 30m').text; // '1 hour, 30 minutes'
```

Pass a preset name to `format()` to choose how much detail to display:

| Preset | Example | Supported types and output |
|---|---|---|
| `'short'` | `'11/16/26, 9:30 AM'` | Numeric date or short clock across `DateTime`, `CalendarDate`, `Time`, and `Duration`. |
| `'medium'` | `'Nov 16, 2026, 9:30 AM'` | Abbreviated month on dates and moments, or clock with seconds on `Time`. |
| `'long'` | `'November 16, 2026 at 9:30 AM'` | Full month name, clock with seconds on `Time`, or spelled-out units on `Duration`. |
| `'full'` | `'Monday, November 16, 2026 at 9:30 AM'` | Full weekday and month on dates and moments, or clock with seconds on `Time`. |
| `'date'` | `'Nov 16, 2026'` | Date portion on `DateTime` and `CalendarDate`. |
| `'time'` | `'9:30 AM'` | Short clock time on `DateTime` and `Time`. |
| `'month'` | `'November 2026'` | Full month name and year on `DateTime` and `CalendarDate`. |
| `'text'` | `'Nov 16, 2026, 9:30 AM PST'` | Date, time, and short zone name on `DateTime`, or each type's own fields on `CalendarDate` and `Time`. |

Every preset name is accepted across dates, times, and moments, printing only the parts each type carries. [`Duration`](/api/duration/) also supports compact and digital styles:

```js
const day = date('2026-11-16');
day.format('full', 'en-US'); // 'Monday, November 16, 2026'
day.format('month', 'en-US'); // 'November 2026'

const opens = time('9:30:15am');
opens.format('short', 'en-US'); // '9:30 AM'
opens.format('medium', 'en-US'); // '9:30:15 AM'

const span = duration({ hours: 2, minutes: 15 });
span.format('narrow', 'en-US'); // '2h 15m'
span.format('digital', 'en-US'); // '2:15:00'
```

## Locales and Intl options

Pass a BCP 47 locale tag as the second argument to format a single call in another language. To change the default across your app, call [`configure()`](/api/configure/) at startup:

```js
import { configure, datetime } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'Europe/Berlin');
standup.format('long', 'de-DE'); // '16. November 2026 um 09:30'
standup.format('long', 'ja-JP'); // '2026年11月16日 9:30'

configure({ locale: 'en-GB' });
```

When none of the presets fit your layout, pass an options object directly to the underlying formatter:

```js
import { date } from 'native-dates';

const day = date('2026-11-16');

day.format({ weekday: 'long' }, 'en-US'); // 'Monday'
day.format({ month: 'short', day: 'numeric' }, 'en-US'); // 'Nov 16'
```

:::tip[Human display vs wire strings]
Reserve `format()` for text shown to people. When storing values or sending them over the network, call `toString()` or `JSON.stringify()` so payloads stay in stable ISO 8601 format. See [Storing and sending](/guides/storing-and-sending/).
:::

## Custom token strings

When you need a fixed layout, import [`@native-dates/plugins/tokens`](/plugins/tokens/) to pass token patterns to `format()`. Wrap any literal words in square brackets so they are copied as-is:

```js
import '@native-dates/plugins/tokens';
import { datetime } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.format('YYYY-MM-DD HH:mm'); // '2026-11-16 09:30'
standup.format('dddd, MMM D [at] h:mm A', 'en-US'); // 'Monday, Nov 16 at 9:30 AM'
```

The same plugin exports `monthNames()` and `weekdayNames()` for building localized calendar headers and dropdown menus:

```js
import { monthNames, weekdayNames } from '@native-dates/plugins/tokens';

monthNames('short', 'en-US'); // ['Jan', 'Feb', 'Mar', ...]
weekdayNames('short', 'monday', 'en-US'); // ['Mon', 'Tue', 'Wed', ...]
```

## Relative phrases

Import [`@native-dates/plugins/relative`](/plugins/relative/) to add `formatRelative()` to dates and moments. It turns elapsed distances into natural phrases such as "3 hours ago" or "yesterday":

```js
import '@native-dates/plugins/relative';
import { date, datetime } from 'native-dates';

const anchor = datetime('2026-11-16T12:00', 'UTC');
anchor.minus(3, 'hours').formatRelative(anchor, 'en-US'); // '3 hours ago'
anchor.plus(45, 'minutes').formatRelative(anchor, 'en-US'); // 'in 1 hour'

const currentDay = date('2026-11-16');
currentDay.minus(1, 'day').formatRelative(currentDay, 'en-US'); // 'yesterday'
currentDay.plus(2, 'days').formatRelative(currentDay, 'en-US'); // 'in 2 days'
```

Omit the first argument to compare against the current moment or today's date automatically.

See [Parsing](/guides/parsing/) next for turning incoming strings and external values back into dates, times, and moments.
