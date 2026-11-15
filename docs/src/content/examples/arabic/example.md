---
title: Arabic plurals, numerals, and Hijri dates
description: Format Arabic six-way plural durations, Eastern and Western numeral systems, regional month names, and Umm al-Qura Hijri dates.
tabs: [app.js, index.html]
try:
  - 'Click **1**, **2**, **5**, **11**, and **100** to step through Arabic''s singular, dual `يومان`, plural, accusative, and hundredth noun forms.'
  - 'Compare `ar-EG` and `ar-MA` on the same date to see Eastern Arabic digits beside Western digits and Moroccan month names.'
  - 'Pick different dates to watch `ar-SA-u-ca-islamic-umalqura` convert ISO dates into the Umm al-Qura Hijri calendar.'
related:
  - { title: Internationalization, href: /guides/internationalization/ }
  - { title: Formatting, href: /guides/formatting/ }
  - { title: Duration, href: /api/duration/ }
---

Calling `configure({ locale: 'ar-EG' })` once enables Arabic plurals and Eastern Arabic digits across every value. Reading `days(2).text` outputs a true dual noun with no digit at all.

Attach `.locale('ar-MA')` when a value and its derived ranges should use Western digits and Moroccan month names while the rest of the app keeps the configured default.

Passing `'ar-SA-u-ca-islamic-umalqura'` converts any civil date into Saudi Arabia's Umm al-Qura Hijri calendar, while `day.monthDay` keeps a Gregorian reference beside it.

When embedding Arabic text inside a left-to-right page, wrap each formatted value in `<bdi>` so digits and range dashes keep right-to-left order.
