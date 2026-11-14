---
title: French casing, ranges, and regional clocks
description: Format French dates without weekday commas, compare Paris and Québec 24-hour clock separators, and collapse multi-day spans.
tabs: [app.js, index.html]
try:
  - 'Change **Time** to **14:45** to compare `14:45` in `fr` against `14 h 45` in `fr-CA`.'
  - 'Set **Days** to **35** so the collapsed span crosses into June and expands from `1–5 mai 2026` to both month names.'
  - 'Pick another day in **Date** to watch lowercase weekdays flow directly into the day number with no comma.'
related:
  - { title: Internationalization, href: /guides/internationalization/ }
  - { title: DateTime, href: /api/date-time/ }
  - { title: Ranges, href: /api/ranges/ }
---

Calling `configure({ locale: 'fr' })` once applies French casing and punctuation across every value. Calling `start.format('full')` outputs "vendredi 1 mai 2026" in lowercase with no comma after the weekday.

Pairing the date with a clock time in `Europe/Paris` inserts the accented preposition "à" before the 24-hour time. With French configured, `paris.format('long')` separates hours and minutes with a colon as "09:30".

Attach `.locale('fr-CA')` to a Montréal moment when comparing regional conventions. Québec typography writes "09 h 30" with a spaced "h" marker instead of a colon.

Reading `range.text` keeps shared month and year names once, rendering "1–5 mai 2026" and expanding both months when crossing a month boundary.
