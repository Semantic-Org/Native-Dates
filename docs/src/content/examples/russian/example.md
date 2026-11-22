---
title: Russian month cases and plural counts
description: Format Russian stand-alone nominative months, genitive full dates, collapsed date ranges, and three-way plural durations.
tabs: [app.js, index.html]
try:
  - 'Compare the first two rows to see `YearMonth` print nominative `май` while the full date inflects to genitive `1 мая`.'
  - 'Click **1**, **2**, **5**, **11**, and **21** to watch `days()` cycle through `день`, `дня`, and `дней`, including the teen exception at `11`.'
  - 'Pick a March or August date to watch other Russian month endings inflect between heading and date forms.'
related:
  - { title: Localization, href: /guides/localization/ }
  - { title: YearMonth, href: /api/year-month/ }
  - { title: Duration, href: /api/duration/ }
---

Calling `configure({ locale: 'ru' })` once applies Russian month cases and plural declensions everywhere. Reading `day.yearMonth.text` selects the nominative stand-alone month for headings, while full dates switch to the genitive case automatically.

Date ranges collapse the shared month and year across an en-dash. Reading `span.text` keeps the shared month in its genitive form, producing `1–5 мая 2026 г.` without manual templates.

Duration counts apply Russian's three-way plural rules directly on `days(total).text`. Counts ending in one like twenty-one return singular `день`, while teen numbers from eleven through fourteen take the plural genitive instead.
