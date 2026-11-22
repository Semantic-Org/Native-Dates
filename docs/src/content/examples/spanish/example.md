---
title: Spanish connectors, casing, and day-first dates
description: Format Spanish dates, collapsed ranges, and month headings, and parse day-first slash strings without month-first mixups.
tabs: [app.js, index.html]
try:
  - 'Set **Days** to **35** so the range crosses into June and repeats `de mayo` and `de junio` on each side.'
  - 'Type `15/08/2026` into **Typed date** to read the day before the month and format **15 de agosto de 2026**.'
  - 'Type `32/05/2026` or `pendiente` into **Typed date** to see loose mode return `null` and show **Unreadable**.'
related:
  - { title: Internationalization, href: /guides/internationalization/ }
  - { title: Ranges, href: /api/ranges/ }
  - { title: loose, href: /plugins/loose/ }
---

Setting `'es'` once in `configure()` applies Spanish formatting and day-first loose parsing across your whole app. Full dates keep weekday and month names lowercase and link day, month, and year with "de".

Date ranges collapse shared parts through `range.format('long')` without repeating the locale. A span inside May keeps "de mayo de 2026" once, while crossing into June prints each month name around the dash.

Calendar headers read `start.yearMonth` to format "mayo de 2026" with its "de" connector intact.

Because `'es'` writes dates day-first, `date(typed.value, { loose: true })` reads "01/05/2026" as May 1 and returns `null` on invalid text.
