---
title: A meeting across zones
description: Pick a meeting time tomorrow in your local zone and view that exact moment across cities around the world.
tabs: [app.js, cities.js, index.html]
try:
  - 'Set the start time to **23:00** to watch Tokyo and Kolkata cross into the next weekday.'
  - 'Switch the preview bar to another time zone so the meeting is scheduled from that city instead.'
  - 'Add `''Australia/Sydney''` to `CITIES` in `cities.js` to append another city to the schedule.'
related:
  - { title: Time zones, href: /guides/time-zones/ }
  - { title: DateTime, href: /api/date-time/ }
---

Scheduling starts with `tomorrow().at(input.value)`, pairing tomorrow's calendar day with the chosen clock time. That single moment drives the whole list without manual UTC offsets.

For every city, `meeting.in(zone)` views the same instant in that IANA time zone and `format('time')` prints its local clock.

Comparing `there.date` against the host's date detects when a city has crossed midnight. The row shows a weekday label only when the day differs.
