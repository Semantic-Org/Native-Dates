---
title: today()
kind: function
lede: The calendar date it is right now, with no clock attached. Where you stand decides the answer, so it takes a zone.
import: import { today } from 'native-dates'
updated: 2026-11-10
---

## Signature

```js signature
today(zone?): CalendarDate
```

<p class="entry-label">Parameters</p>

```params
- name: zone
  type: string
  description: The zone to judge the day from. Leave it out for the default zone.
```

<p class="entry-label">Returns</p>

```returns
type: CalendarDate
description: Today’s date in `zone`. It has no time of day, so it never shifts when read somewhere else.
```

## Two zones, two todays

At 9 PM on November 10 in Los Angeles it is already November 11 in Berlin.

:::truth
| Call | Returns |
|---|---|
| `today('America/Los_Angeles')` | `2026-11-10` |
| `today('Europe/Berlin')` | `2026-11-11` |
| `today('America/Los_Angeles').equals(today('Europe/Berlin'))` | false |
:::

## Start a chain from today

Most date math starts here. `tomorrow()` and `yesterday()` are the same call one day either side.

```js title="due.js"
import { today } from 'native-dates';

const due = today().plus(30, 'days');
const review = today().next('friday');
const kickoff = today().startOf('month').plus(1, 'month');
```

:::note[A date is not a number]
`today() < due` throws. Compare dates with `isBefore()` and `isAfter()`, which say what they mean.
:::
