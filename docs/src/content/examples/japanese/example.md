---
title: Japanese eras, dates, and shifts
description: Format Japanese imperial eras with gannen on year one, unpadded kanji dates, and overnight shifts across midnight.
tabs: [app.js, index.html]
try:
  - 'Click **平成最後の日** and **令和初日** to watch May 1, 2019 step from `平成31年4月30日` to `令和元年5月1日`.'
  - 'Pick **2026-05-01** to see the imperial calendar advance to `令和8年` while keeping unpadded month and day numbers.'
  - 'Edit the shift times across midnight and notice `timeRange()` keeps a pure clock span with Japan''s `～` wave-dash.'
related:
  - { title: Configure, href: /api/configure/ }
  - { title: Formatting, href: /guides/formatting/ }
  - { title: Ranges, href: /api/ranges/ }
---

Calling `configure({ locale: 'ja' })` once sets Japanese across every text preview and format preset. Standard presets pair unpadded numbers with kanji counters, and `day.yearMonth` drops the day counter for monthly headings.

Date spans and overnight `timeRange()` values read that same configured locale automatically. Both join their endpoints with the Japanese wave-dash without injecting artificial calendar dates across midnight.

Pass a locale tag only when opting into another calendar. Passing `'ja-u-ca-japanese'` formats on the Japanese imperial calendar and prints `元年` on the first year of each era.
