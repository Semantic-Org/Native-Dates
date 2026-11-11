---
title: Typed durations
description: A field that reads lengths of time the way people type them. `duration()` takes `1h 30m`, `90 minutes` or `2 weeks and 3 days`, and says what’s wrong with anything else.
tabs: [app.js, index.html]
try:
  - 'Type `90 minutes`. It reads as 1 hour, 30 minutes, and 1.5 hours in total.'
  - 'Type `2 weeks and 3 days`, then `PT45M`. Phrases and ISO 8601 both read.'
  - 'Type `soon`. The error names the problem and shows what to write instead.'
related:
  - { title: DateTime, href: /api/date-time/ }
---

`duration()` reads a phrase into a `Duration`. `format()` prints it back in words, `total('hours')`
is the whole length as one number, and `toString()` is the ISO 8601 form a database or an API takes.

Input it can't read throws, and the message is written for the person fixing it: what was refused,
and the forms that work. The app shows that message as it is.
