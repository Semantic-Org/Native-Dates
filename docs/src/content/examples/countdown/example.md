---
title: Countdown to a launch
description: Count down live to Friday at 5:00 PM and display the remaining duration in full, narrow, and digital styles.
tabs: [app.js, index.html]
try:
  - 'Watch each second tick as `now().until(launch)` recomputes the remaining span.'
  - 'Change `''friday''` to `''monday''` in `app.js` to move the target launch day.'
  - 'Pick `Asia/Tokyo` in the preview bar, where Friday at 5:00 PM arrives hours sooner.'
related:
  - { title: Durations, href: /guides/durations/ }
  - { title: DateTime, href: /api/date-time/ }
  - { title: Duration, href: /api/duration/ }
---

The target moment comes from `today().next('friday').at('5pm')`. That steps forward to the upcoming Friday and sets the local clock to five in the afternoon.

Every second, `now().until(launch)` measures the remaining span as a balanced duration. Calling `round('second')` trims milliseconds so the live readout steps cleanly.

Finally, `format()` renders that same duration in full words alongside its narrow and digital timer styles, without dividing by milliseconds.
