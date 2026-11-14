---
title: Korean spacing and collapsed ranges
description: Format Korean dates with Hangul counter spacing, collapsed date ranges, and pre-clock day periods.
tabs: [app.js, index.html]
try:
  - 'Click **+35 days** or type `35` into the span input to watch `6월` appear on the end date once the range crosses into June.'
  - 'Click **+4 days** to see `format()` collapse the shared year and month into `2026년 5월 1일~5일`.'
  - 'Switch the clock to **09:30** so the Korean day period flips from `오후` to `오전` ahead of the hour.'
related:
  - { title: Configure, href: /api/configure/ }
  - { title: Formatting, href: /guides/formatting/ }
  - { title: Ranges, href: /api/ranges/ }
---

Unlike Chinese and Japanese, Korean orthography requires a space after each year, month, and day counter. Calling `configure({ locale: 'ko' })` once applies that spacing across every `.text` property and `format()` call.

Calling `range.format('long')` collapses the shared year and month across a tilde while keeping `일` on both day numbers. Crossing into a new month brings the end month counter back automatically.

Twelve-hour clocks place Korea's morning or afternoon marker before the hour. Reading `day.yearMonth.text` formats clean monthly headings without a trailing day counter.
