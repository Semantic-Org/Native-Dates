---
title: Arabic plurals, numerals, and Hijri dates
description: Format Arabic six-way plural durations, Eastern and Western numeral systems, regional month names, and Umm al-Qura Hijri dates.
tabs: [app.js, index.html]
try:
  - 'Click **1**, **2**, **5**, **11**, and **100** to step through Arabic''s singular, dual `يومان`, plural, accusative, and hundredth noun forms.'
  - 'Compare `ar-EG` and `ar-MA` on the same date to see Eastern Arabic digits beside Western digits and Moroccan month names.'
  - 'Pick different dates to watch `ar-SA-u-ca-islamic-umalqura` convert ISO dates into the Umm al-Qura Hijri calendar.'
related:
  - { title: Formatting, href: /guides/formatting/ }
  - { title: Duration, href: /api/duration/ }
  - { title: Ranges, href: /api/ranges/ }
---

Arabic grammar distinguishes six plural categories across zero, one, two, three to ten, eleven to ninety-nine, and hundreds. Formatting `days(2)` in Arabic outputs a true dual noun with no digit at all.

Regional tags select both the numeral script and the local vocabulary. Egyptian `'ar-EG'` renders Eastern Arabic digits across dates and ranges, whereas Moroccan `'ar-MA'` uses Western digits and regional month names.

The locale tag `ar-SA-u-ca-islamic-umalqura` converts any civil date into Saudi Arabia's Umm al-Qura Hijri calendar. Reading the month-day alongside it keeps a short Gregorian reference on the same row.

When embedding Arabic text inside a left-to-right page, wrap each formatted value in `<bdi>` so digits and range dashes keep right-to-left order.
