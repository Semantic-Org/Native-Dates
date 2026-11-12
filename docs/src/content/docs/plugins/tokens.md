---
title: tokens
kind: plugin
lede: Token patterns like `'YYYY-MM-DD'` in `format()`, plus localized month and weekday name lists.
import: import '@native-dates/plugins/tokens'
size: tokens
updated: 2026-11-12
---

## Formatting with patterns

Import the plugin once to teach [`format()`](#format) token patterns on core dates, datetimes, and times, as well as [year-month](/plugins/year-month/) and [month-day](/plugins/month-day/) values. All built-in preset names and `Intl` options objects continue working unchanged.

```js title="tokens.js"
import '@native-dates/plugins/tokens';
import { date, datetime, time } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.format('YYYY-MM-DD'); // '2026-11-16'
standup.format('ddd, MMM D [at] h:mm A', 'en-US'); // 'Mon, Nov 16 at 9:30 AM'
standup.format('date', 'en-US'); // 'Nov 16, 2026'
```

Wrap literal words in square brackets so letters inside `[at]` copy verbatim. Pass a locale tag second to localize month, weekday, and zone names.

```js
date('2026-09-06').format('dddd D MMMM', 'de'); // 'Sonntag 6 September'
time('17:30').format('[Closes at] h:mm a'); // 'Closes at 5:30 pm'
```

## Token reference

Longer tokens match first, so `MMMM` always reads as the full month name.

| Token | Sample | Description |
|---|---|---|
| `YYYY` | `'2026'` | Four-digit calendar year, zero-padded for years below 1000. |
| `YY` | `'26'` | Two-digit calendar year. |
| `Q` | `'4'` | Quarter of the year, from 1 through 4. |
| `M`, `MM` | `'9'`, `'09'` | Month number from 1 through 12, unpadded or zero-padded. |
| `MMM`, `MMMM` | `'Sep'`, `'September'` | Localized short or full month name from `Intl`. |
| `D`, `DD` | `'6'`, `'06'` | Day of the month from 1 through 31, unpadded or zero-padded. |
| `Do` | `'6th'` | Day of the month with an English ordinal suffix. |
| `dd`, `ddd`, `dddd` | `'Su'`, `'Sun'`, `'Sunday'` | Localized two-letter, short, or full weekday name. |
| `W` | `'36'` | ISO week number of the year, from 1 through 53. |
| `H`, `HH` | `'9'`, `'09'` | 24-hour clock hour from 0 through 23, unpadded or zero-padded. |
| `h`, `hh` | `'9'`, `'09'` | 12-hour clock hour from 1 through 12, unpadded or zero-padded. |
| `m`, `mm` | `'5'`, `'05'` | Minute from 0 through 59, unpadded or zero-padded. |
| `s`, `ss` | `'4'`, `'04'` | Second from 0 through 59, unpadded or zero-padded. |
| `SSS` | `'250'` | Three-digit millisecond, from 000 through 999. |
| `A`, `a` | `'AM'`, `'am'` | Uppercase or lowercase meridiem marker. |
| `Z`, `ZZ` | `'-08:00'`, `'-0800'` | Active UTC offset with a colon, or compact without a colon. |
| `z`, `zzzz` | `'PST'`, `'Pacific Standard Time'` | Localized short or full time zone name at this instant. |
| `X`, `x` | `'1794850200'`, `'1794850200000'` | Unix timestamp in whole seconds or milliseconds. |
| `[text]` | `'at'` | Escaped literal characters copied straight into the output. |

Each value type only formats fields it owns. A `DateTime` supports every token above, a calendar date supports calendar tokens from year through ISO week, and a time supports clock and meridiem tokens. Year-month values format year, quarter, and month tokens, while month-day values format month and day tokens.

:::note[Missing fields throw instead of printing zeros]
Formatting clock tokens on a `CalendarDate` or calendar tokens on a `Time` throws an error rather than inventing midnight or a dummy date. Combine them into a datetime first when a pattern needs both parts.
:::

## Methods and helpers

:::entry
### `format()` :kind[method]

```js signature
dt.format(pattern, locale?): string
d.format(pattern, locale?): string
t.format(pattern, locale?): string
ym.format(pattern, locale?): string
md.format(pattern, locale?): string
```

Extends core formatting so any string that is not a preset name is evaluated as a token pattern. Preset names and options objects pass straight through to `Intl.DateTimeFormat`.

**Parameters**

```params
- name: pattern
  type: string | FormatSpec
  default: "'medium'"
  description: Token pattern such as `'YYYY-MM-DD'`, core preset name, or `Intl` options object.
- name: locale
  type: string
  description: BCP 47 locale tag overriding the configured default for this call.
```

**Returns**

```returns
type: string
description: Formatted string using the receiver's fields and time zone.
```

```js
const launch = datetime('2026-09-06T14:30:00Z', 'America/New_York');

launch.format('YYYY-MM-DD HH:mm:ss z', 'en-US'); // '2026-09-06 10:30:00 EDT'
```
:::

:::entry
### `monthNames()` :kind[function]

```js signature
monthNames(style?, locale?): string[]
```

Returns all twelve month names from January through December in the given or configured locale, ready for dropdown menus and picker headers.

**Parameters**

```params
- name: style
  type: "'long' | 'short'"
  default: "'long'"
  description: Full month names such as `'January'` or abbreviated names such as `'Jan'`.
- name: locale
  type: string
  description: BCP 47 locale tag overriding the configured default.
```

**Returns**

```returns
type: string[]
description: Fresh array of twelve localized month names.
```

```js
import { monthNames } from '@native-dates/plugins/tokens';

monthNames('long', 'en-US').slice(0, 3); // ['January', 'February', 'March']
monthNames('short', 'fr').slice(0, 3); // ['janv.', 'févr.', 'mars']
```
:::

:::entry
### `weekdayNames()` :kind[function]

```js signature
weekdayNames(style?, firstDay?, locale?): string[]
```

Returns the seven weekday names rotated to begin on the given day or the configured week start, so a calendar header row matches `startOf('week')`.

**Parameters**

```params
- name: style
  type: "'short' | 'long'"
  default: "'short'"
  description: Short labels such as `'Mon'` or full weekday names such as `'Monday'`.
- name: firstDay
  type: Weekday
  description: Starting weekday name or ISO number, defaulting to the configured `weekStart`.
- name: locale
  type: string
  description: BCP 47 locale tag overriding the configured default.
```

**Returns**

```returns
type: string[]
description: Seven localized weekday names ordered from the start of the week.
```

```js
import { weekdayNames } from '@native-dates/plugins/tokens';

weekdayNames('short', 'monday', 'en-US');
// ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
weekdayNames('long', 'sunday', 'de-DE')[0]; // 'Sonntag'
```
:::
