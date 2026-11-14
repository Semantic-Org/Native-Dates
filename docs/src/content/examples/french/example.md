---
title: French casing, ranges, and regional clocks
description: Format French dates without weekday commas, compare Paris and Québec 24-hour clock separators, and collapse multi-day spans.
tabs: [app.js, index.html]
try:
  - 'Change **Time** to **14:45** to compare `14:45` in `fr` against `14 h 45` in `fr-CA`.'
  - 'Set **Days** to **35** so the collapsed span crosses into June and expands from `1–5 mai 2026` to both month names.'
  - 'Pick another day in **Date** to watch lowercase weekdays flow directly into the day number with no comma.'
related:
  - { title: Formatting, href: /guides/formatting/ }
  - { title: DateTime, href: /api/date-time/ }
  - { title: Ranges, href: /api/ranges/ }
---

French writes weekdays and months in lowercase and omits any comma after the weekday. Calling `format('full', 'fr')` outputs "vendredi 1 mai 2026" with spaces alone linking the day, month, and year.

Pairing the date with a clock time in `Europe/Paris` inserts the accented preposition "à" before the 24-hour time. In France, `format('long', 'fr')` separates hours and minutes with a colon as "09:30".

Switching the locale tag to `fr-CA` follows Québec typography without changing format presets. Canadian French writes "09 h 30" with a spaced "h" marker instead of a colon.

Formatting a date span with `range.format('long', 'fr')` keeps shared month and year names once. A four-day May trip renders "1–5 mai 2026" and expands both months only when crossing a month boundary.
