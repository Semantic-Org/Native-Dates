---
title: Chinese calendars and day periods
description: Format Chinese Gregorian dates, pre-clock day periods, traditional lunar months, and Minguo era years from one input.
tabs: [app.js, index.html]
try:
  - 'Click **Lunar New Year** to see February 17, 2026 format as `2026丙午年正月初一` with `正月` for the first lunar month.'
  - 'Change the clock from **09:30** to **14:30** to watch the day period switch from `上午9:30` to `下午2:30` before the digits.'
  - 'Compare the `zh-TW-u-ca-roc` row, which counts the same date as year 115 of the Minguo calendar.'
related:
  - { title: Formatting, href: /guides/formatting/ }
  - { title: CalendarDate, href: /api/calendar-date/ }
  - { title: MonthDay, href: /api/month-day/ }
---

Formatting with `'zh-CN'` writes year, month, day, and weekday continuously with Chinese counters and no spaces. Twelve-hour clocks place the morning or afternoon marker directly before the hour digits.

Switching the locale tag to `'zh-CN-u-ca-chinese'` converts any civil date into the traditional lunisolar calendar. It pairs the stem-branch cycle year with lunar day names and prints `正月` for the first month.

Passing `'zh-TW-u-ca-roc'` formats the same date in Taiwan's Minguo era, counting years forward from 1912. Every calendar conversion happens during formatting while your stored date stays ISO 8601.

For recurring civil holidays and birthdays, `day.monthDay` strips the year and formats concise month-day labels without era prefixes.
