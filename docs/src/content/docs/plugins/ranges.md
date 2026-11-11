---
title: ranges
kind: plugin
lede: Spans between two points, a sprint, a booking, opening hours, with `to()` on every date, datetime and time.
import: import '@native-dates/plugins/ranges'
size: ranges
updated: 2026-11-10
---

## Install

Import the plugin once. It adds `to()` to dates, datetimes and times, and nothing else changes.

```js title="app.js"
import '@native-dates/plugins/ranges';
import { date, today } from 'native-dates';

const sprint = date('2026-09-01').to(2, 'weeks');

sprint.text; // 'Sep 1 – 14, 2026'
sprint.contains(today());
```

## What a range is

| Made from | Class | The end is |
|---|---|---|
| Two dates | `DateRange` | Included. The 1st through the 7th is seven days. |
| Two datetimes | `DateTimeRange` | Excluded. Nine until ten and ten until eleven don’t overlap. |
| Two times | `TimeRange` | Excluded. The door closes at the stroke of five. |

## Methods

| Method | Returns | Description |
|---|---|---|
| `contains(value)` | `boolean` | Whether a point or another range falls inside. |
| `overlaps(other)` | `boolean` | Whether two ranges share any time. |
| `intersection(other)` | `Range` | The part two ranges share, or `null`. |
| `points(step)` | `Array` | Every point in the range, a step apart. |
| `split(step)` | `Array` | The range cut into smaller ranges. |

### Every day in a week

```js
date('2026-09-01').to(1, 'week').points('day');
// 2026-09-01, 2026-09-02 … 2026-09-07
```

:::note[A range has a length]
`range.duration` is the whole length, counted from the start, so a month-long range knows which month it measured.
:::
