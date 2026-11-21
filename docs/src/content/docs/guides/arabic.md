---
title: Dates and times in Arabic
lede: Handle Eastern and Western numerals, regional month names, Umm al-Qura Hijri dates, six-form plurals, and Ramadan clock shifts across Arabic locales.
updated: 2026-11-21
---

Once a locale is set via [Internationalization](/guides/internationalization/), Arabic apps span two numeral scripts, four regional month vocabularies, Hijri dates, and six-form plurals.

## Eastern and Western numerals

The UAE, Maghreb countries, and bare `'ar'` output Western digits, whereas Egypt, Saudi Arabia, the Levant, and Iraq output Eastern Arabic digits.

Append `-u-nu-latn` or `-u-nu-arab` to keep one numeral script across every user:

```js
import { date } from 'native-dates';

const invoice = date('2026-11-16');
invoice.format('long', 'ar-EG'); // '١٦ نوفمبر ٢٠٢٦' — 16 Nov 2026
invoice.format('long', 'ar-AE'); // '16 نوفمبر 2026'
invoice.format('long', 'ar-EG-u-nu-latn'); // '16 نوفمبر 2026'
invoice.format('long', 'ar-MA-u-nu-arab'); // '١٦ نونبر ٢٠٢٦' — Moroccan Nov
```

Token patterns always emit ASCII digits while localizing words, whereas numeric presets insert right-to-left marks `\u200F` before slashes. Prefer `'YYYY-MM-DD'` in assertions, CSVs, and URLs:

```js
invoice.format('YYYY-MM-DD', 'ar-EG'); // '2026-11-16'
invoice.format('dddd، D MMMM YYYY', 'ar-SA');
// 'الاثنين، 16 نوفمبر 2026' — Mon, 16 Nov 2026
invoice.format('short', 'ar-EG'); // '١٦\u200F/١١\u200F/٢٠٢٦' — RLM before slashes
```

## Hijri dates and regional months

Modern engines default `'ar-SA'` to Gregorian. Pass `-u-ca-islamic-umalqura` with a preset to format official Umm al-Qura Hijri dates:

```js
import { date } from 'native-dates';

const eid = date('2026-03-20');
eid.format('long', 'ar-SA'); // '٢٠ مارس ٢٠٢٦' — 20 Mar 2026
eid.format('long', 'ar-SA-u-ca-islamic-umalqura');
// '١ شوال ١٤٤٧ هـ' — 1 Shawwal 1447 AH
eid.format('D MMMM YYYY', 'ar-SA-u-ca-islamic-umalqura');
// '20 مارس 2026' — tokens stay Gregorian
```

Token patterns and partial dates stay Gregorian because one solar month spans two Hijri months, so anchor a specific day with `on()` first:

```js
import { yearMonth } from 'native-dates';

const march = yearMonth('2026-03');
march.format('long', 'ar-SA-u-ca-islamic-umalqura'); // 'مارس ٢٠٢٦' — Mar 2026
march.on(1).format('long', 'ar-SA-u-ca-islamic-umalqura');
// '١٢ رمضان ١٤٤٧ هـ' — 12 Ramadan 1447 AH
march.on(20).format('long', 'ar-SA-u-ca-islamic-umalqura');
// '١ شوال ١٤٤٧ هـ' — 1 Shawwal 1447 AH
```

Gregorian month names and clock cycles divide into four regional families, so pass a country subtag rather than bare `'ar'`:

| Region | Sample tags | Output behavior |
|---|---|---|
| Egypt, Gulf, Sudan | `'ar-EG'`, `'ar-SA'`, `'ar-AE'` | Egyptian/Gulf months like يناير, يوليو, نوفمبر (Jan, Jul, Nov) with 12-hour ص / م (AM / PM). |
| Levant and Iraq | `'ar-LB'`, `'ar-JO'`, `'ar-IQ'`, `'ar-SY'` | Syriac months like كانون الثاني, تموز, تشرين الثاني (Jan, Jul, Nov) with a 12-hour clock. |
| Morocco | `'ar-MA'` | Moroccan months like ماي, يوليوز, غشت, شتنبر, نونبر, دجنبر (May, Jul–Sep, Nov–Dec) with a 24-hour clock. |
| Algeria and Tunisia | `'ar-DZ'`, `'ar-TN'` | Maghreb months like جانفي, فيفري, جوان, جويلية, أوت (Jan, Feb, Jun–Aug) with a 12-hour clock. |

```js
import { datetime } from 'native-dates';

const july = datetime('2026-07-16T14:30', 'UTC');
july.format('long', 'ar-EG'); // '١٦ يوليو ٢٠٢٦ في ٢:٣٠ م' — Jul 16, 2:30 PM
july.format('long', 'ar-LB'); // '١٦ تموز ٢٠٢٦ في ٢:٣٠ م' — Syriac July
july.format('long', 'ar-MA'); // '16 يوليوز 2026 في 14:30' — Moroccan July, 24h
july.format('long', 'ar-DZ'); // '16 جويلية 2026 في 2:30 م' — Maghreb July
```

## Week starts and weekends

Weeks start on Saturday in Egypt, Jordan, Qatar, and Algeria, Sunday in Saudi Arabia and Yemen, and Monday in the UAE, Morocco, Tunisia, and Lebanon.

Local `weekStart`, week boundaries, and weekday names follow each tag automatically, while cross-country server rollups should pass `startOf('week', 'monday')` explicitly:

```js
import { date, weekdayNames } from 'native-dates';

const wed = date('2026-11-18');
wed.locale('ar-EG').startOf('week').toString(); // '2026-11-14' — Saturday
wed.locale('ar-SA').startOf('week').toString(); // '2026-11-15' — Sunday
wed.locale('ar-AE').startOf('week').toString(); // '2026-11-16' — Monday
weekdayNames('narrow', undefined, 'ar-EG')[0]; // 'س' — Saturday
```

:::warning[Friday and Saturday weekends]
`isWeekend()` always checks ISO Saturday and Sunday regardless of locale. In Friday–Saturday markets such as Saudi Arabia, Egypt, Qatar, and Jordan, check `dayOfWeek` directly because Sunday is a workday.
:::

```js
const fri = date('2026-11-20').locale('ar-SA');
const sun = date('2026-11-22').locale('ar-SA');
fri.isWeekend(); // false
sun.isWeekend(); // true

const isLocalWeekend = (d) => d.dayOfWeek === 5 || d.dayOfWeek === 6;
isLocalWeekend(fri); // true
isLocalWeekend(sun); // false
```

## Six-form plurals and RTL text

Arabic inflects six plural categories from zero and singular through the dual `'يومان'` for two days, paucal 3–10, 11–99, and hundreds across durations and `from()`:

```js
import { datetime, days } from 'native-dates';

days(1).format('long', 'ar-EG'); // 'يوم' — 1 day
days(2).format('long', 'ar-EG'); // 'يومان' — 2 days (dual)
days(5).format('long', 'ar-EG'); // '٥ أيام' — 5 days (3–10)
days(15).format('long', 'ar-EG'); // '١٥ يومًا' — 15 days (11–99)
days(100).format('long', 'ar-EG'); // '١٠٠ يوم' — 100 days
const anchor = datetime('2026-11-16T09:00', 'Asia/Riyadh');
anchor.plus(2, 'days').from(anchor, 'ar-SA');
// 'خلال يومين' — in 2 days (oblique dual)
anchor.date.plus(2, 'days').from(anchor.date, 'ar-SA');
// 'بعد الغد' — day after tomorrow
```

Browsers can visually reorder signs in ISO dates or UTC offsets inside right-to-left paragraphs, so isolate technical strings inside `<bdi>`:

```html
<!-- Maintenance window: 10–16 Nov 2026 at 09:00 +03:00 -->
<p dir="rtl">
  موعد الصيانة: ١٠–١٦ نوفمبر ٢٠٢٦ عند الساعة <bdi>09:00 +03:00</bdi>
</p>
```

## Parsing inputs and time zones

Both parsers reject Eastern digits, so normalize them to ASCII first and pass `dayFirst: true` for slashes. Loose full dates require English months, while `yearMonth()` matches single-word Arabic months:

```js
import '@native-dates/plugins/loose';
import { date, yearMonth } from 'native-dates';

const toAscii = (s) =>
  s.replace(/[٠-٩۰-۹]/g, (d) => d.codePointAt(0) - (d <= '٩' ? 0x0660 : 0x06f0));
date('٢٠٢٦-١١-١٦', { loose: true }); // null
date(toAscii('٢٠٢٦-١١-١٦')).toString(); // '2026-11-16'
date('06/11/2026', { loose: true, dayFirst: true }).toString(); // '2026-11-06'
yearMonth('نوفمبر 2026', { loose: true, locale: 'ar-EG' }).toString();
// '2026-11' — Nov 2026
yearMonth('تشرين الثاني 2026', { loose: true, locale: 'ar-LB' });
// null — two-word Syriac Nov
```

[The zones plugin](/plugins/zones/) resolves Riyadh, Cairo, Dubai, Qatar, and Casablanca directly, while Makkah, Jeddah, Abu Dhabi, Doha, Manama, and Rabat register via `zoneAliases`:

```js
import '@native-dates/plugins/zones';
import { configure, date, datetime } from 'native-dates';

configure({
  zoneAliases: {
    makkah: 'Asia/Riyadh',
    doha: 'Asia/Qatar',
    'abu dhabi': 'Asia/Dubai',
    rabat: 'Africa/Casablanca',
  },
});
datetime('2026-11-16T09:00', 'Doha').zone; // 'Asia/Qatar'
```

Schedule with IANA zones rather than fixed offsets: `'Africa/Casablanca'` shifts back one hour during Ramadan, and Cairo springs forward at midnight to 01:00:

```js
datetime('2026-02-14T12:00', 'Africa/Casablanca').offset; // '+01:00'
datetime('2026-03-01T12:00', 'Africa/Casablanca').offset; // '+00:00' — Ramadan
datetime('2026-03-25T12:00', 'Africa/Casablanca').offset; // '+01:00'

const cairoSpring = date('2026-04-24').at('00:00', 'Africa/Cairo');
cairoSpring.hour; // 1
cairoSpring.hoursInDay; // 23
```
