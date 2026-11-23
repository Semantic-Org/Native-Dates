---
title: Open right now
description: Check whether venues across time zones are open at any clock time, including overnight hours that cross midnight.
tabs: [app.js, index.html]
try:
  - 'Pick `Asia/Tokyo` in the preview bar and set the time to **01:00** to see the ramen bar stay open past midnight.'
  - 'Switch the preview bar to `Europe/London` or `America/Los_Angeles` to watch the same clock shift around the world.'
  - 'Add a venue with overnight hours like `22:00` to `04:00` in `PLACES` inside `app.js`.'
related:
  - { title: Ranges, href: /guides/ranges/ }
  - { title: Time zones, href: /guides/time-zones/ }
  - { title: TimeRange, href: /api/ranges/#timerange }
---

Each venue defines its schedule as a `timeRange(open, close)` in its own local clock. When closing falls earlier than opening, the range wraps across midnight automatically.

For any chosen time, `today().at(input.value)` builds the moment and `in(place.zone)` converts it to the venue's local clock.

Checking `hours.contains(local.time)` then answers whether the venue is open, without special-casing overnight spans or manual UTC math.
