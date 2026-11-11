---
title: A meeting across zones
description: One moment, read in six cities. The meeting is set where you are, and `in()` shows it everywhere else.
tabs: [app.js, cities.js, index.html]
try:
  - 'Set the time to **23:00**. Tokyo and Kolkata move to the next day, and say so.'
  - 'Pick another zone in the preview’s bar. The meeting is now set there, and every row follows.'
  - 'Add `''Australia/Sydney''` to `CITIES` in `cities.js`. The preview rebuilds with a seventh row.'
related:
  - { title: Time zones, href: /guides/time-zones/ }
  - { title: DateTime, href: /api/date-time/ }
---

`tomorrow().at(time)` is the meeting: a calendar date, given a time of day, in the zone the app runs
in. That one value is the whole model. Each row calls `in()` on it to read the same moment somewhere
else, and `format('time')` prints it the way that row's reader expects.

No offsets are stored and none are computed here. The zone names are the only data, and the platform
knows what each one's clock says tomorrow.
