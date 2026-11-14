---
title: Portuguese crasis, ranges, and day-first input
description: 'Format Brazilian Portuguese moments with hyphenated weekdays and `às` crasis before the hour, collapse date ranges, and read day-first input.'
tabs: [app.js, index.html]
try:
  - 'Pick **2026-05-03** in **Date** to switch from hyphenated **sexta-feira** to single-word **domingo** while keeping `às` before the hour.'
  - 'Set **Days** to **35** so the range crosses from May into June and prints both `de maio` and `de junho`.'
  - 'Edit **Typed date** to `25/12/2026` or `em breve` to compare day-first parsing against **Unreadable** input.'
related:
  - { title: Formatting, href: /guides/formatting/ }
  - { title: DateTime, href: /api/date-time/ }
  - { title: loose, href: /plugins/loose/ }
---

Portuguese weekdays from Monday through Friday carry hyphens such as "sexta-feira", while month names stay lowercase. Formatting a zoned moment with `format('full', 'pt-BR')` joins the date and clock with the crasis "às" before the hour.

Multi-day spans collapse shared month and year fields when calling `format('long', 'pt-BR')` on a range. Staying within May prints "de maio de 2026" once at the end instead of repeating it on both days.

Reading `start.yearMonth` isolates the billing or calendar month without inventing a day number. Formatting it in Brazilian Portuguese keeps the "de" preposition in "maio de 2026".

Numeric dates in Brazil and Portugal place the day before the month. Passing `dayFirst: true` in loose mode reads "01/05/2026" as May 1 and returns `null` when the text is invalid.
