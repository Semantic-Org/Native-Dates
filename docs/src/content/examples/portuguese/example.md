---
title: Portuguese crasis, ranges, and day-first input
description: 'Format Brazilian Portuguese moments with hyphenated weekdays and `às` crasis before the hour, collapse date ranges, and read day-first input.'
tabs: [app.js, index.html]
try:
  - 'Pick **2026-05-03** in **Date** to switch from hyphenated **sexta-feira** to single-word **domingo** while keeping `às` before the hour.'
  - 'Set **Days** to **35** so the range crosses from May into June and prints both `de maio` and `de junho`.'
  - 'Edit **Typed date** to `25/12/2026` or `em breve` to compare day-first parsing against **Unreadable** input.'
related:
  - { title: Internationalization, href: /guides/internationalization/ }
  - { title: DateTime, href: /api/date-time/ }
  - { title: loose, href: /plugins/loose/ }
---

Setting `'pt-BR'` and `dayFirst: true` once in `configure()` applies Brazilian Portuguese formatting and day-first parsing everywhere. Formatting a zoned moment preserves hyphenated weekdays like "sexta-feira", lowercase months, and the crasis "às" before the hour.

Multi-day spans collapse shared month and year fields through `range.format('long')`. Staying within May prints "de maio de 2026" once at the end instead of repeating it on both days.

Reading `start.yearMonth` isolates the billing or calendar month and keeps the "de" preposition in "maio de 2026".

With day-first order set in configuration, `date(typed.value, { loose: true })` reads "01/05/2026" as May 1 and returns `null` when the text is invalid.
