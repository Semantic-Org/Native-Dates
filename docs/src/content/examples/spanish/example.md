---
title: Spanish connectors, casing, and day-first dates
description: Format Spanish dates, collapsed ranges, and month headings, and parse day-first slash strings without month-first mixups.
tabs: [app.js, index.html]
try:
  - 'Set **Days** to **35** so the range crosses into June and repeats `de mayo` and `de junio` on each side.'
  - 'Type `15/08/2026` into **Typed date** to read the day before the month and format **15 de agosto de 2026**.'
  - 'Type `32/05/2026` or `pendiente` into **Typed date** to see loose mode return `null` and show **Unreadable**.'
related:
  - { title: Formatting, href: /guides/formatting/ }
  - { title: Ranges, href: /api/ranges/ }
  - { title: loose, href: /plugins/loose/ }
---

Spanish keeps weekday and month names lowercase in running text and links day, month, and year with "de". Calling `format('full', 'es')` produces "viernes, 1 de mayo de 2026" without custom token templates.

Date ranges collapse shared parts through `range.format('long', 'es')`. A span inside May keeps "de mayo de 2026" once, while crossing into June prints each month name around the dash.

Calendar headers read `start.yearMonth` to format the month and year on their own. Spanish retains the "de" connector in "mayo de 2026" instead of placing the month beside a bare year.

Most Spanish speakers write numeric dates with the day first. Passing `dayFirst: true` reads "01/05/2026" as May 1, and returns `null` on invalid text.
