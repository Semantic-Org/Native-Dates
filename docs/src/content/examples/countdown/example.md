---
title: Countdown to a launch
description: The time left until Friday at 5 PM, as a duration you can print three ways. `until()` does the subtraction and keeps the units.
tabs: [app.js, index.html]
try:
  - 'Watch the seconds. Each tick asks `now().until(launch)` again and prints what comes back.'
  - 'Change `''friday''` to `''monday''` in `app.js`. The launch moves, and so does the count.'
  - 'Pick `Asia/Tokyo` in the preview’s bar. Friday at 5 PM comes sooner there, so less time is left.'
related:
  - { title: DateTime, href: /api/date-time/ }
---

`today().next('friday').at('5pm')` reads as the sentence it is: the next Friday after today, at five
in the afternoon, here. `until()` returns a `Duration` whose parts are already balanced into days,
hours, minutes and seconds, so there is no dividing by 86,400,000.

`format()` prints a duration in the reader's language. `'narrow'` and `'digital'` are the same
duration in tighter forms.
