---
title: A month grid
description: Build a navigable calendar month grid from a YearMonth using locale-aware week boundaries and DateRange iteration.
tabs: [app.js, index.html]
try:
  - 'Step backward and forward through months, then click **Today** to jump back to the current month.'
  - 'Call `configure({ locale: ''de-DE'' })` in `app.js` to shift the grid to Monday-first weeks.'
  - 'Style weekdays with `day.isWeekday()` or step a full year with `current.plus(1, ''year'')`.'
related:
  - { title: YearMonth, href: /api/year-month/ }
  - { title: CalendarDate, href: /api/calendar-date/ }
  - { title: Ranges, href: /guides/ranges/ }
---

The calendar state is a single `yearMonth(today())` value. Stepping between months takes one call to `minus()` or `plus()`.

To fill leading and trailing week cells, `startOf('week')` and `endOf('week')` expand the month's bounds to match the active locale's first day of the week.

Calling `every('day')` on that range returns every day cell in order, where `day.isToday()` and `day.isWeekend()` drive the cell classes directly.
