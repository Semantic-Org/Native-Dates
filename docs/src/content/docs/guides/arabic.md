---
title: Arabic
lede: Format Arabic dates across regional calendars and Eastern or Western numeral scripts.
updated: 2026-11-22
---

Pass a country tag like `'ar-EG'` or `'ar-SA'` through [Localization](/guides/localization/) rather than bare `'ar'`. Numeral scripts, Gregorian month names, and week starts vary across Arabic-speaking countries.

## Eastern and Western numerals

The UAE, Maghreb countries, and bare `'ar'` output Western digits, while Egypt, Saudi Arabia, the Levant, and Iraq output Eastern Arabic digits.

Append `-u-nu-latn` or `-u-nu-arab` when you want one numeral script across every user:

```js
import { date } from 'native-dates';

const invoice = date('2026-11-16');

invoice.format('long', 'ar-EG'); // '١٦ نوفمبر ٢٠٢٦'
invoice.format('long', 'ar-AE'); // '16 نوفمبر 2026'
invoice.format('long', 'ar-EG-u-nu-latn'); // '16 نوفمبر 2026'
invoice.format('long', 'ar-MA-u-nu-arab'); // '١٦ نونبر ٢٠٢٦'
```

Token patterns always emit ASCII digits while localizing month and weekday words. Numeric presets insert right-to-left marks `\u200F` before slashes, so prefer `'YYYY-MM-DD'` in assertions, CSVs, and URLs:

```js
invoice.format('YYYY-MM-DD', 'ar-EG'); // '2026-11-16'
invoice.format('dddd، D MMMM YYYY', 'ar-SA'); // 'الاثنين، 16 نوفمبر 2026'
invoice.format('short', 'ar-EG'); // '١٦\u200F/١١\u200F/٢٠٢٦'
```

## Hijri dates and regional months

Modern engines default `'ar-SA'` to Gregorian. Pass `'-u-ca-islamic-umalqura'` with a preset to format official Umm al-Qura Hijri dates, such as 1 Shawwal 1447 AH:

```js
import { date } from 'native-dates';

const eid = date('2026-03-20');

eid.format('long', 'ar-SA'); // '٢٠ مارس ٢٠٢٦'
eid.format('long', 'ar-SA-u-ca-islamic-umalqura'); // '١ شوال ١٤٤٧ هـ'
eid.format('D MMMM YYYY', 'ar-SA-u-ca-islamic-umalqura'); // '20 مارس 2026'
```

Token patterns and partial dates stay Gregorian because one solar month spans two Hijri months. Anchor a specific day with [`on()`](/api/year-month/#on) first:

```js
import { yearMonth } from 'native-dates';

const march = yearMonth('2026-03');

march.format('long', 'ar-SA-u-ca-islamic-umalqura'); // 'مارس ٢٠٢٦'
march.on(1).format('long', 'ar-SA-u-ca-islamic-umalqura'); // '١٢ رمضان ١٤٤٧ هـ'
march.on(20).format('long', 'ar-SA-u-ca-islamic-umalqura'); // '١ شوال ١٤٤٧ هـ'
```

Gregorian month names and 12- vs. 24-hour clocks divide into four regional families:

| Region | Sample tags | Output behavior |
|---|---|---|
| Egypt, Gulf, Sudan | `ar-EG, ar-SA` | Egyptian and Gulf months like يناير, يوليو, نوفمبر with 12-hour ص / م for AM and PM. |
| Levant and Iraq | `ar-LB, ar-IQ` | Levantine months like كانون الثاني, تموز, تشرين الثاني with a 12-hour clock. |
| Morocco | `ar-MA` | Moroccan months like ماي, يوليوز, غشت, شتنبر, نونبر, دجنبر with a 24-hour clock. |
| Algeria and Tunisia | `ar-DZ, ar-TN` | Maghreb months like جانفي, فيفري, جوان, جويلية, أوت with a 12-hour clock. |

```js
import { datetime } from 'native-dates';

const july = datetime('2026-07-16T14:30', 'UTC');

july.format('long', 'ar-EG'); // '١٦ يوليو ٢٠٢٦ في ٢:٣٠ م'
july.format('long', 'ar-LB'); // '١٦ تموز ٢٠٢٦ في ٢:٣٠ م'
july.format('long', 'ar-MA'); // '16 يوليوز 2026 في 14:30'
july.format('long', 'ar-DZ'); // '16 جويلية 2026 في 2:30 م'
```

## Week starts and weekends

Weeks start on Saturday in Egypt, Jordan, Qatar, and Algeria, Sunday in Saudi Arabia and Yemen, and Monday in the UAE, Morocco, Tunisia, and Lebanon.

Local `weekStart`, week boundaries, and weekday headers follow each tag automatically, while cross-country rollups can pass `'monday'` explicitly:

```js
import { date, weekdayNames } from 'native-dates';

const wed = date('2026-11-18');

wed.locale('ar-EG').startOf('week').toString(); // '2026-11-14'
wed.locale('ar-SA').startOf('week').toString(); // '2026-11-15'
wed.locale('ar-AE').startOf('week').toString(); // '2026-11-16'
weekdayNames('narrow', undefined, 'ar-EG')[0]; // 'س'
```

[`isWeekend()`](/api/calendar-date/#calendar-predicates) and [`isWeekday()`](/api/calendar-date/#calendar-predicates) follow the active locale too. In Friday–Saturday markets such as Saudi Arabia and Egypt, Friday is a weekend and Sunday is a workday:

```js
const fri = date('2026-11-20').locale('ar-SA');
const sun = date('2026-11-22').locale('ar-SA');

fri.isWeekend(); // true
sun.isWeekend(); // false
sun.isWeekday(); // true
```

## Six-form plurals and RTL text

Arabic uses six plural forms across zero, one, two like *يومان*, 3–10, 11–99, and hundreds. [`Duration`](/api/duration/) and [`from()`](/api/date-time/#from) select each form automatically, alongside *بعد الغد* for two days ahead on calendar dates:

```js
import { datetime, days } from 'native-dates';

days(1).format('long', 'ar-EG'); // 'يوم'
days(2).format('long', 'ar-EG'); // 'يومان'
days(5).format('long', 'ar-EG'); // '٥ أيام'
days(15).format('long', 'ar-EG'); // '١٥ يومًا'
days(100).format('long', 'ar-EG'); // '١٠٠ يوم'

const anchor = datetime('2026-11-16T09:00', 'Asia/Riyadh');
anchor.plus(2, 'days').from(anchor, 'ar-SA'); // 'خلال يومين'
anchor.date.plus(2, 'days').from(anchor.date, 'ar-SA'); // 'بعد الغد'
```

Browsers can reorder signs in ISO dates or UTC offsets inside right-to-left paragraphs, so wrap technical timestamps inside `<bdi>`:

```html
<p dir="rtl">
  موعد الصيانة: ١٠–١٦ نوفمبر ٢٠٢٦ عند الساعة <bdi>09:00 +03:00</bdi>
</p>
```

## Parsing inputs and time zones

With [the loose plugin](/plugins/loose/), Arabic locales read day-first slash dates, Eastern Arabic digits with direction marks, *ص* / *م* clocks, and both standard and Levantine multi-word months automatically:

```js
import '@native-dates/plugins/loose';
import { date, time, yearMonth } from 'native-dates';

date('06/11/2026', { loose: true, locale: 'ar-EG' })?.toString(); // '2026-11-06'
date('١٦‏/١١‏/٢٠٢٦', { loose: true, locale: 'ar-EG' })?.toString(); // '2026-11-16'
date('16 تشرين الثاني 2026', { loose: true, locale: 'ar-LB' })?.toString(); // '2026-11-16'
time('٢:٣٠ م', { loose: true, locale: 'ar-EG' })?.toString(); // '14:30:00'
yearMonth('تشرين الثاني 2026', { loose: true, locale: 'ar-LB' })?.toString(); // '2026-11'
```

[The zones plugin](/plugins/zones/) resolves major Gulf and North African cities alongside regional codes like GST directly. Under `'ar-SA'`, AST resolves to Riyadh:

```js
import '@native-dates/plugins/zones';
import { date, datetime } from 'native-dates';

datetime('2026-11-16T09:00', 'Makkah').zone; // 'Asia/Riyadh'
datetime('2026-11-16T09:00', 'Doha').zone; // 'Asia/Qatar'
datetime('2026-11-16T09:00', { zone: 'AST', locale: 'ar-SA' }).zone; // 'Asia/Riyadh'
```

Schedule with full IANA zones rather than fixed offsets. `'Africa/Casablanca'` shifts back an hour during Ramadan, and Cairo springs forward at midnight to 01:00:

```js
datetime('2026-02-14T12:00', 'Africa/Casablanca').offset; // '+01:00'
datetime('2026-03-01T12:00', 'Africa/Casablanca').offset; // '+00:00'
datetime('2026-03-25T12:00', 'Africa/Casablanca').offset; // '+01:00'

const cairoSpring = date('2026-04-24').at('00:00', 'Africa/Cairo');
cairoSpring.hour; // 1
cairoSpring.hoursInDay; // 23
```
