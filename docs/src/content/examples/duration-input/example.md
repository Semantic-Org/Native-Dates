---
title: Typed durations
description: Parse human duration phrases and ISO 8601 strings from a text input into words, total hours, and wire format.
tabs: [app.js, index.html]
try:
  - 'Type `90 minutes` to see it format in words, total `1.5` hours, and serialize to `PT90M`.'
  - 'Try `2 weeks and 3 days` or `PT45M` to mix natural phrases with ISO 8601 strings.'
  - 'Type `soon` to see the refusal message explain what went wrong and suggest valid examples.'
related:
  - { title: Durations, href: /guides/durations/ }
  - { title: Parsing, href: /guides/parsing/ }
  - { title: Duration, href: /api/duration/ }
---

Passing user text to `duration()` reads everyday unit phrases and ISO 8601 strings into one structured value.

From there, `format()` spells the length out in words and `total('hours')` converts the span into a single decimal number. String interpolation outputs the standard ISO 8601 form for a database or API payload.

Unreadable input throws an error whose `error.message` names what was refused and shows valid examples right in the page.
