---
source: "68d49ce6b3ea"
title: monthNames()
lede: 返回用于日历表头与下拉菜单的本地化月份和星期标签数组。
---

## 日历标签

两个辅助函数均直接读取核心内置的 `Intl` 缓存表，且每次调用都返回全新的数组。调用方可以放心地对返回的列表执行 `map`、`slice` 或 `reverse`，不会污染共享状态。

:::entry
### `monthNames()` :kind[function]

```js signature
monthNames(style?, locale?): string[]
```

返回包含 12 个本地化公历月份名称的数组（从一月到十二月）。默认返回[全局配置区域](/api/configure/)下的完整名称。

**参数**

```params
- name: style
  type: "'long' | 'short'"
  default: "'long'"
  description: 完整月份名称（如 `'January'`）或缩写名称（如 `'Jan'`）。
- name: locale
  type: Locale
  description: 覆盖全局默认配置的 BCP 47 区域标签。
```

**返回值**

```returns
type: string[]
description: 按索引 `0`（一月）到 `11`（十二月）排列的 12 个月份标签。
```

```js title="months.js"
import { monthNames } from 'native-dates';

monthNames('short', 'en-US');
// ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

monthNames('long', 'fr-FR').slice(0, 3);
// ['janvier', 'février', 'mars']
```
:::

:::entry
### `weekdayNames()` :kind[function]

```js signature
weekdayNames(style?, firstDay?, locale?): string[]
```

返回包含 7 个本地化星期标签的数组，并按起始日轮转排列；起始日依次优先取 `firstDay`、[应用全局配置](/api/configure/)中的 `weekStart`，或当前区域的每周第一天。

[`startOf('week')`](/api/calendar-date/#startof) 的周边界与周范围遵循同一套周起始日规则，保证日历表头始终与周网格对齐。在 [`configure()`](/api/configure/) 中设置的自定义星期标签同样在此生效。

**参数**

```params
- name: style
  type: "'short' | 'long' | 'narrow'"
  default: "'short'"
  description: "缩写标签（如 `'Mon'`）、完整名称（如 `'Monday'`），或紧凑的单双字母表头（如 `'Mo'`）。"
- name: firstDay
  type: DayOfWeek
  description: 起始英文星期名称，或从 1（周一）到 7（周日）的 ISO 星期编号。
- name: locale
  type: Locale
  description: 覆盖全局默认配置的 BCP 47 区域标签。
```

**返回值**

```returns
type: string[]
description: 按 `firstDay`、全局配置的 `weekStart` 或区域默认起始日排列的 7 个星期标签。
```

```js
import { date, weekdayNames } from 'native-dates';

weekdayNames('short', undefined, 'en-US');
// ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

weekdayNames('narrow', undefined, 'en-US');
// ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

weekdayNames('narrow', undefined, 'pt-BR');
// ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

weekdayNames('short', 'monday', 'en-US');
// ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const daysInGrid = date('2026-11-18', { locale: 'en-US' }).range('week').every('day');
daysInGrid[0].format({ weekday: 'short' }); // 'Sun'
```
:::
