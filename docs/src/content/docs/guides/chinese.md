---
title: Chinese
lede: Handle regional date formats and lunar calendars across Chinese-speaking markets.
updated: 2026-11-23
---

Pass a regional tag like `'zh-CN'` or `'zh-TW'` through [Localization](/guides/localization/). Each region sets its own script, date order, clock cycle, and week start.

## China Standard Time and CST

Pass `'Asia/Shanghai'` for Beijing time. Unlike a fixed UTC+8 offset, it formats localized zone names like *中国标准时间* and preserves China's 1986–1991 daylight saving offsets:

```js
import { datetime } from 'native-dates';

const release = datetime('2026-11-16T09:30:00Z', 'Asia/Shanghai').locale('zh-CN');

release.format('YYYY-MM-DD HH:mm zzzz'); // '2026-11-16 17:30 中国标准时间'
datetime('1988-07-15T00:00:00Z', 'Asia/Shanghai').offset; // '+09:00'
```

With [the zones plugin](/plugins/zones/), CST follows the active locale, resolving to Shanghai in Mainland China and Taipei in Taiwan. Major Mainland cities resolve out of the box, while Urumqi stays on UTC+6 Xinjiang Time:

```js
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T09:30:00Z', { zone: 'CST', locale: 'zh-CN' }).zone; // 'Asia/Shanghai'
datetime('2026-11-16T09:30:00Z', { zone: 'CST', locale: 'zh-TW' }).zone; // 'Asia/Taipei'
datetime('2026-11-16T09:30:00Z', 'Beijing').zone; // 'Asia/Shanghai'
datetime('2026-11-16T09:30:00Z', 'Shenzhen').format('HH:mm', 'zh-CN'); // '17:30'
datetime('2026-11-16T09:30:00Z', 'Urumqi').offset; // '+06:00'
```

## Regional differences

Mainland China, Taiwan, Hong Kong, Macau, and Singapore differ in default clocks, short date order, weekday characters, and first day of the week:

| Locale tag | Short date | Week start | Default clock and weekday conventions |
|---|---|---|---|
| `zh-CN` | `2026/11/16` | Monday | 24-hour clock by default, with Simplified `周一` to `周日` for Mon to Sun. |
| `zh-TW` | `2026/11/16` | Sunday | 12-hour clock with `上午` and `下午` for AM/PM, and Traditional `週一` weekdays. |
| `zh-HK` | `16/11/2026` | Sunday | 12-hour clock and day-month-year short dates, shared with Macau. |
| `zh-SG` | `16/11/26` | Sunday | 12-hour clock, Simplified `周` weekdays, and two-digit day-month-year dates. |

The same moment renders in each region's local preset:

```js
import { datetime } from 'native-dates';

const meeting = datetime('2026-11-16T17:05:00+08:00', 'Asia/Shanghai');

meeting.format('medium', 'zh-CN'); // '2026年11月16日 17:05'
meeting.format('medium', 'zh-TW'); // '2026年11月16日 下午5:05'
meeting.date.format('short', 'zh-HK'); // '16/11/2026'
meeting.date.format('short', 'zh-SG'); // '16/11/26'
```

On Sundays, Mainland China closes the current week while Taiwan, Hong Kong, and Singapore start a new one. Pass `'monday'` to [`startOf()`](/api/calendar-date/#startof) to keep shared weekly report keys aligned:

```js
import { date } from 'native-dates';

const sunday = date('2026-11-15');

sunday.locale('zh-CN').range('week').toString(); // '2026-11-09/2026-11-15'
sunday.locale('zh-HK').range('week').toString(); // '2026-11-15/2026-11-21'
sunday.locale('zh-HK').startOf('week', 'monday').toString(); // '2026-11-09'
```

In Simplified Chinese, `'Ah:mm'` prints *上午* or *下午*. Pass `dayPeriod: 'short'` for natural periods like pre-dawn *凌晨*, morning *早上*, noon *中午*, and evening *晚上*:

```js
import { time } from 'native-dates';

const night = time('20:30').locale('zh-CN');

night.format('short'); // '20:30'
night.format('Ah:mm'); // '下午8:30'
night.format({
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  dayPeriod: 'short',
}); // '晚上8:30'
```

## Format templates and input parsing

Templates treat only Latin letters as tokens, so *年*, *月*, *日*, and Chinese punctuation need no brackets. `'MMMM'` spells Han months like *十一月*, while `'dd'` prints narrow weekdays:

```js
import { datetime } from 'native-dates';

const slot = datetime('2026-11-06T14:05:00+08:00', 'Asia/Shanghai').locale('zh-CN');

slot.format('YYYY年M月D日 ddd HH:mm'); // '2026年11月6日 周五 14:05'
slot.format('MMMDo / MMMMDo'); // '11月6日 / 十一月6日'
slot.format('dd / ddd / dddd'); // '五 / 周五 / 星期五'
slot.format('ddd', 'zh-TW'); // '週五'
```

Core factories parse Han year-first dates, slashes, and dots directly, round-tripping the long preset with no plugins. For Hong Kong day-first slash dates, fullwidth digits, day-period clocks, or inline CST, load [the loose plugin](/plugins/loose/):

```js
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { date, datetime, monthDay, time, yearMonth } from 'native-dates';

date('2026年11月16日').toString(); // '2026-11-16'
yearMonth('2026年11月').toString(); // '2026-11'
date('16/11/2026', { loose: true, locale: 'zh-HK' })?.toString(); // '2026-11-16'
date('２０２６年１１月１６日', { loose: true })?.toString(); // '2026-11-16'
time('下午5:05', { loose: true, locale: 'zh-TW' })?.toString(); // '17:05:00'
time('晚上9:10', { loose: true, locale: 'zh-CN' })?.toString(); // '21:10:00'
time('凌晨12:00', { loose: true, locale: 'zh-TW' })?.toString(); // '00:00:00'
monthDay('11月16日', { loose: true })?.toString(); // '11-16'
datetime('2026年11月16日 14:30 CST', {
  loose: true,
  locale: 'zh-CN',
  zone: 'UTC',
})?.toString(); // '2026-11-16T06:30:00.000Z'
```

Loose mode reads both *上午* / *下午* and part-of-day words like *凌晨*, *中午*, and *晚上* across `'zh-CN'` and `'zh-TW'`.

## Chinese lunar and Minguo calendars

Pass `'zh-CN-u-ca-chinese'` when formatting a date or moment so presets print stem-branch years, first-month *正月*, and leap months like *闰六月*.

Token templates always read Gregorian fields. Partial dates fall back to Gregorian because they have no day, while Taiwan's Minguo tag `'zh-TW-u-ca-roc'` aligns with Gregorian months:

```js
import { date, yearMonth } from 'native-dates';

date('2026-02-17').format('long', 'zh-CN-u-ca-chinese'); // '2026丙午年正月初一'
date('2025-07-25').format('medium', 'zh-CN-u-ca-chinese'); // '2025年闰六月初一'
date('2026-02-17').format('YYYY-MM-DD', 'zh-CN-u-ca-chinese'); // '2026-02-17'
yearMonth('2026-02').format('long', 'zh-CN-u-ca-chinese'); // '2026年2月'
yearMonth('2026-11').format('long', 'zh-TW-u-ca-roc'); // '民國115年11月'
```

## Relative time

[`CalendarDate`](/api/calendar-date/) counts calendar days, returning *前天* for two days ago and *后天* for two days ahead. [`DateTime`](/api/date-time/) counts elapsed seconds so 23 hours ago never reads as yesterday:

```js
import { date, datetime, today } from 'native-dates';

const base = date('2026-11-16');
date('2026-11-14').from(base, 'zh-CN'); // '前天'
date('2026-11-18').from(base, 'zh-CN'); // '后天'

const anchor = datetime('2026-11-16T12:00:00+08:00', 'Asia/Shanghai');
anchor.minus(2, 'days').from(anchor, 'zh-CN'); // '2天前'
date('2026-11-18').from(today('Asia/Shanghai'), 'zh-CN');
```

On UTC servers, zero-argument [`fromNow()`](/api/calendar-date/#fromnow) between midnight and 8:00 AM Beijing time lands on the previous UTC day, so pass [`today('Asia/Shanghai')`](/api/date-fn/#today) explicitly.
