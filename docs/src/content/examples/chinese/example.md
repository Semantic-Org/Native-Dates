---
title: Chinese calendars and day periods
description: Format Chinese Gregorian dates, pre-clock day periods, traditional lunar months, and Minguo era years from one input.
tabs: [app.js, index.html]
try:
  - 'Click **Lunar New Year** to see February 17, 2026 format as `2026丙午年正月初一` with `正月` for the first lunar month.'
  - 'Change the clock from **09:30** to **14:30** to watch the day period switch from `上午9:30` to `下午2:30` before the digits.'
  - 'Compare the `zh-TW-u-ca-roc` row, which counts the same date as year 115 of the Minguo calendar.'
related:
  - { title: Configure, href: /api/configure/ }
  - { title: Formatting, href: /guides/formatting/ }
  - { title: MonthDay, href: /api/month-day/ }
---

Calling `configure({ locale: 'zh-CN' })` once sets Chinese counters and spacing across every date, clock, and anniversary call. Twelve-hour clocks place the morning or afternoon marker directly before the hour digits.

For recurring civil holidays and birthdays, `day.monthDay` strips the year and formats concise month-day labels using that configured locale.

Pass an explicit tag only when converting calendars. Passing `'zh-CN-u-ca-chinese'` formats stem-branch lunar years with `正月` for the first month, and `'zh-TW-u-ca-roc'` counts years on the Minguo calendar while your stored date stays ISO 8601.
