---
title: Japanese eras, dates, and shifts
description: Format Japanese imperial eras with gannen on year one, unpadded kanji dates, and overnight shifts across midnight.
tabs: [app.js, index.html]
try:
  - 'Click **平成最後の日** and **令和初日** to watch May 1, 2019 step from `平成31年4月30日` to `令和元年5月1日`.'
  - 'Pick **2026-05-01** to see the imperial calendar advance to `令和8年` while keeping unpadded month and day numbers.'
  - 'Edit the shift times across midnight and notice `timeRange()` keeps a pure clock span with Japan''s `～` wave-dash.'
related:
  - { title: Formatting, href: /guides/formatting/ }
  - { title: Ranges, href: /api/ranges/ }
  - { title: YearMonth, href: /api/year-month/ }
---

Passing `'ja-u-ca-japanese'` formats dates on the Japanese imperial calendar. The first year of an era prints `元年` instead of a numeral, turning May 1, 2019 into Reiwa gannen.

Standard Japanese presets pair unpadded numbers with kanji counters and append the full weekday without spaces. Reading `day.yearMonth` drops the day counter cleanly for monthly calendar headings.

Date ranges switch to slash-separated numbers joined by the Japanese wave-dash. Overnight clock shifts built with `timeRange()` cross midnight using that same wave-dash without injecting artificial calendar dates.
