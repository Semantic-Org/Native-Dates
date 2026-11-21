---
title: Dates and times in Chinese
lede: Handle regional format differences and lunar calendar boundaries in Chinese apps without tripping over ambiguous CST time zones.
updated: 2026-11-21
---

Beyond general [Internationalization](/guides/internationalization/), Chinese apps navigate ambiguous CST abbreviations alongside Greater China clock rules and lunar calendar boundaries.

## China Standard Time and the CST abbreviation trap

Pass `'Asia/Shanghai'` for Beijing time. Unlike a fixed UTC+8 offset, it prints localized zone names and preserves China's 1986–1991 daylight saving offsets:

```js
import { datetime } from 'native-dates';

const release = datetime('2026-11-16T09:30:00Z', 'Asia/Shanghai').locale('zh-CN');
release.format('YYYY-MM-DD HH:mm zzzz');
// '2026-11-16 17:30 中国标准时间' (China Standard Time)
datetime('1988-07-15T00:00:00Z', 'Asia/Shanghai').offset; // '+09:00'
```

The [zones plugin](/plugins/zones/) maps CST to Chicago time, 13 to 14 hours off Beijing, and Urumqi to UTC+6 Xinjiang Time. Unlisted cities like Beijing and Shenzhen throw `unknownZone` unless aliased at startup:

```js
import '@native-dates/plugins/zones';
import { configure, datetime } from 'native-dates';

datetime('2026-11-16T09:30:00Z', 'CST').zone; // 'America/Chicago'
datetime('2026-11-16T09:30:00Z', 'Urumqi').offset; // '+06:00'

configure({
  zoneAliases: {
    CST: 'Asia/Shanghai',
    beijing: 'Asia/Shanghai',
    shenzhen: 'Asia/Shanghai',
  },
});
datetime('2026-11-16T09:30:00Z', 'Beijing').format('HH:mm', 'zh-CN'); // '17:30'
datetime('2026-11-16T09:30:00Z', 'CST').zone; // 'Asia/Shanghai'
```

:::warning[Do not parse CST logs in loose mode]
Inside a `{ loose: true }` string, the engine's native parser bypasses aliases and reads CST as North American Central Time, shifting timestamps by 14 hours. Strip the trailing abbreviation first, then pass `'Asia/Shanghai'`.
:::

## Regional differences across Greater China and Singapore

Mainland China, Hong Kong, Macau, Taiwan, and Singapore differ in default clocks, short date order, weekday characters, and start of the week:

| Locale tag | Short date | Week start | Default clock and weekday conventions |
|---|---|---|---|
| `zh-CN` | `2026/11/16` | Monday | 24-hour clock by default, with Simplified `周一` to `周日` for Mon to Sun. |
| `zh-TW` | `2026/11/16` | Sunday | 12-hour clock with `上午` and `下午` for AM/PM, and Traditional `週一` weekdays. |
| `zh-HK` | `16/11/2026` | Sunday | 12-hour clock and British day-month-year short dates, shared with Macau. |
| `zh-SG` | `16/11/26` | Sunday | 12-hour clock, Simplified `周` weekdays, and two-digit day-month-year dates. |

The same moment renders in each region's local preset:

```js
import { datetime } from 'native-dates';

const meeting = datetime('2026-11-16T17:05:00+08:00', 'Asia/Shanghai');
meeting.format('medium', 'zh-CN'); // '2026年11月16日 17:05' (Nov 16, 2026)
meeting.format('medium', 'zh-TW'); // '2026年11月16日 下午5:05' (5:05 PM)
meeting.date.format('short', 'zh-HK'); // '16/11/2026'
meeting.date.format('short', 'zh-SG'); // '16/11/26'
```

On Sundays, Mainland China closes the current week while Taiwan, Hong Kong, and Singapore start a new one. Pass `'monday'` to `startOf()` to lock shared weekly report keys:

```js
import { date } from 'native-dates';

const sunday = date('2026-11-15');
sunday.locale('zh-CN').range('week').toString(); // '2026-11-09/2026-11-15'
sunday.locale('zh-HK').range('week').toString(); // '2026-11-15/2026-11-21'
sunday.locale('zh-HK').startOf('week', 'monday').toString(); // '2026-11-09'
```

In Simplified Chinese, `'Ah:mm'` prints standard AM/PM markers, while `dayPeriod: 'short'` subdivides the day into natural periods like pre-dawn 凌晨, morning 早上, noon 中午, and evening 晚上:

```js
import { time } from 'native-dates';

const night = time('20:30').locale('zh-CN');
night.format('short'); // '20:30'
night.format('Ah:mm'); // '下午8:30' (8:30 PM)
night.format({
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  dayPeriod: 'short',
}); // '晚上8:30' (8:30 at night)
```

## Chinese format templates and input parsing

Templates treat only Latin letters as tokens, so year 年, month 月, day 日, and Chinese punctuation need no brackets. Short months print digits while `'MMMM'` spells Han months, ordinal days append 日, and padded days stay uppercase so `'dd'` stays a weekday:

```js
import { datetime } from 'native-dates';

const slot = datetime('2026-11-06T14:05:00+08:00', 'Asia/Shanghai').locale('zh-CN');
slot.format('YYYY年M月D日 ddd HH:mm'); // '2026年11月6日 周五 14:05' (Fri, Nov 6)
slot.format('MMMDo / MMMMDo'); // '11月6日 / 十一月6日' (numeric vs Han month)
slot.format('dd / ddd / dddd'); // '五 / 周五 / 星期五' (narrow / short / full Fri)
slot.format('ddd', 'zh-TW'); // '週五' (Traditional Fri)
```

Core factories parse slash, dot, and unpadded year-first strings directly. By contrast, the [loose plugin](/plugins/loose/) returns `null` on 年月日 characters or fullwidth colons, while `dayFirst: true` handles Hong Kong and Singapore slash dates:

```js
import '@native-dates/plugins/loose';
import { date, datetime } from 'native-dates';

date('2026/1/5').toString(); // '2026-01-05'
datetime('2026.11.6 9:30', 'Asia/Shanghai').format('YYYY-MM-DD HH:mm');
// '2026-11-06 09:30'
date('2026年11月16日', { loose: true }); // null (Han date units)
date('16/11/2026', { loose: true, dayFirst: true }).toString(); // '2026-11-16'
```

For pasted 年月日 text, replace the Han separators with hyphens before calling `date()` to keep core leap-year and month-length validation.

## Chinese lunar and Minguo calendar display

Pass `'zh-CN-u-ca-chinese'` when formatting a full date or moment so presets print lunar stem-branch years, first-month 正月 labels, and leap months.

Format tokens still read Gregorian fields. Because `YearMonth` and `MonthDay` lack a day, lunar tags fall back to Gregorian, whereas Minguo years align with Gregorian months:

```js
import { date, yearMonth } from 'native-dates';

date('2026-02-17').format('long', 'zh-CN-u-ca-chinese');
// '2026丙午年正月初一' (stem-branch month 1, day 1)
date('2025-07-25').format('medium', 'zh-CN-u-ca-chinese');
// '2025年闰六月初一' (leap 6th month, day 1)
date('2026-02-17').format('YYYY-MM-DD', 'zh-CN-u-ca-chinese'); // '2026-02-17'
yearMonth('2026-02').format('long', 'zh-CN-u-ca-chinese');
// '2026年2月' (Gregorian fallback)
yearMonth('2026-11').format('long', 'zh-TW-u-ca-roc');
// '民國115年11月' (Minguo year 115)
```

## Relative time for two days back and ahead

`CalendarDate` counts calendar days, returning 前天 and 后天 for two days back or ahead. `DateTime` measures exact seconds so 23 hours ago never reads as yesterday or 46 hours as 前天:

```js
import { date, datetime, today } from 'native-dates';

const base = date('2026-11-16');
date('2026-11-14').from(base, 'zh-CN'); // '前天' (day before yesterday)
date('2026-11-18').from(base, 'zh-CN'); // '后天' (day after tomorrow)

const anchor = datetime('2026-11-16T12:00:00+08:00', 'Asia/Shanghai');
anchor.minus(2, 'days').from(anchor, 'zh-CN'); // '2天前' (2 days ago)
date('2026-11-18').from(today('Asia/Shanghai'), 'zh-CN');
```

On UTC servers, zero-argument `fromNow()` between midnight and 8:00 AM Beijing time lands on the prior UTC day, so pass `today('Asia/Shanghai')` explicitly.
