---
source: fbe00d55cb93
title: kindOf()
lede: Identifier et affiner les valeurs native-dates entre contextes d’exécution et copies du bundle.
---

## Lire le type d’une valeur

:::entry
### `kindOf()` :kind[function]

```js signature
kindOf(value):
  | 'datetime' | 'date' | 'time' | 'duration'
  | 'yearMonth' | 'monthDay'
  | 'dateRange' | 'datetimeRange' | 'timeRange'
  | undefined
```

Renvoie une étiquette textuelle indiquant à quel type appartient une valeur, ou `undefined` pour les valeurs JavaScript ordinaires telles que les objets `Date` natifs, les chaînes, les nombres et les objets. Identifie les instants, les dates calendaires, les heures du jour, les durées, les valeurs [année-mois](/api/year-month/) et [mois-jour](/api/month-day/), ainsi que les [plages](/api/ranges/).

```js title="inspect.js"
import { date, dateRange, hours, kindOf, monthDay, now, time, yearMonth } from 'native-dates';

kindOf(now()); // 'datetime'
kindOf(date('2026-11-16')); // 'date'
kindOf(time('9:30am')); // 'time'
kindOf(hours(2)); // 'duration'
kindOf(yearMonth('2026-11')); // 'yearMonth'
kindOf(monthDay('10/17')); // 'monthDay'
kindOf(dateRange('2026-11-01', '2026-11-07')); // 'dateRange'
kindOf(new Date()); // undefined
```

**Paramètres**

```params
- name: value
  type: unknown
  required: true
  description: Valeur quelconque à inspecter.
```

**Valeur de retour**

```returns
type: "'datetime' | 'date' | 'time' | 'duration' | 'yearMonth' | 'monthDay' | 'dateRange' | 'datetimeRange' | 'timeRange' | undefined"
description: Étiquette textuelle correspondant au type de la valeur, ou `undefined` si `value` ne provient pas de cette bibliothèque.
```
:::

## Gardes de type

Les gardes de type vérifient des marques portées par des symboles globaux plutôt que l’identité de prototype ; ils fonctionnent donc de manière fiable entre contextes d’exécution et copies dupliquées du bundle.

:::entry
### `isDateTime()` :kind[guard]

```js signature
isDateTime(value): value is DateTime
```

Renvoie `true` lorsque la valeur est une instance de [`DateTime`](/api/date-time/) et affine son type dans TypeScript.

```js
import { datetime, isDateTime } from 'native-dates';

const stamp = datetime('2026-11-16T17:30:00Z');
isDateTime(stamp); // true
isDateTime('2026-11-16T17:30:00Z'); // false
```
:::

:::entry
### `isCalendarDate()` :kind[guard]

```js signature
isCalendarDate(value): value is CalendarDate
```

Renvoie `true` lorsque la valeur est une instance de [`CalendarDate`](/api/calendar-date/) et affine son type dans TypeScript.

```js
import { date, isCalendarDate } from 'native-dates';

isCalendarDate(date('2026-11-16')); // true
isCalendarDate(new Date()); // false
```
:::

:::entry
### `isTime()` :kind[guard]

```js signature
isTime(value): value is Time
```

Renvoie `true` lorsque la valeur est une instance de [`Time`](/api/time/) et affine son type dans TypeScript.

```js
import { isTime, time } from 'native-dates';

isTime(time('9:30am')); // true
```
:::

:::entry
### `isDuration()` :kind[guard]

```js signature
isDuration(value): value is Duration
```

Renvoie `true` lorsque la valeur est une instance de [`Duration`](/api/duration/) et affine son type dans TypeScript.

```js
import { hours, isDuration } from 'native-dates';

isDuration(hours(2)); // true
```
:::

:::entry
### `isYearMonth()` :kind[guard]

```js signature
isYearMonth(value): value is YearMonth
```

Renvoie `true` lorsque la valeur est une instance de [`YearMonth`](/api/year-month/) et affine son type dans TypeScript.

```js
import { isYearMonth, yearMonth } from 'native-dates';

isYearMonth(yearMonth('2026-11')); // true
```
:::

:::entry
### `isMonthDay()` :kind[guard]

```js signature
isMonthDay(value): value is MonthDay
```

Renvoie `true` lorsque la valeur est une instance de [`MonthDay`](/api/month-day/) et affine son type dans TypeScript.

```js
import { isMonthDay, monthDay } from 'native-dates';

isMonthDay(monthDay('10-17')); // true
```
:::

:::entry
### `isDateRange()` :kind[guard]

```js signature
isDateRange(value): value is DateRange
```

Renvoie `true` lorsque la valeur est une instance de [`DateRange`](/api/ranges/#daterange) et affine son type dans TypeScript.

```js
import { dateRange, isDateRange } from 'native-dates';

isDateRange(dateRange('2026-11-01', '2026-11-07')); // true
```
:::

:::entry
### `isDateTimeRange()` :kind[guard]

```js signature
isDateTimeRange(value): value is DateTimeRange
```

Renvoie `true` lorsque la valeur est une instance de [`DateTimeRange`](/api/ranges/#datetimerange) et affine son type dans TypeScript.

```js
import { datetimeRange, isDateTimeRange } from 'native-dates';

isDateTimeRange(datetimeRange('2026-11-16T09:00Z', '2026-11-16T10:00Z')); // true
```
:::

:::entry
### `isTimeRange()` :kind[guard]

```js signature
isTimeRange(value): value is TimeRange
```

Renvoie `true` lorsque la valeur est une instance de [`TimeRange`](/api/ranges/#timerange) et affine son type dans TypeScript.

```js
import { isTimeRange, timeRange } from 'native-dates';

isTimeRange(timeRange('9:00am', '5:00pm')); // true
```
:::

## instanceof inter-contextes et symboles de marque

Les vérifications `instanceof` standard de JavaScript échouent d’une iframe à une autre ou entre deux copies dupliquées du bundle. Chaque classe de cette bibliothèque implémente `[Symbol.hasInstance]` au moyen d’un symbole du registre global : `instanceof` et les gardes de type fonctionnent ainsi entre tous les contextes d’exécution.

Vous pouvez également lire directement les symboles de marque exportés lorsque vous écrivez des sérialiseurs personnalisés, des assertions de test ou des utilitaires génériques qui reconnaissent n’importe quel type de plage via `IS_RANGE` :

```js
import { DateTime, IS_DATE_TIME, IS_RANGE, now, timeRange } from 'native-dates';

const current = now();
current instanceof DateTime; // true
Boolean(current[IS_DATE_TIME]); // true

const shift = timeRange('9am', '5pm');
Boolean(shift[IS_RANGE]); // true
```

| Constante | Clé de symbole global | Correspond à |
|---|---|---|
| `IS_DATE_TIME` | `Symbol.for('native-dates/DateTime')` | Toute instance de `DateTime`. |
| `IS_CALENDAR_DATE` | `Symbol.for('native-dates/CalendarDate')` | Toute instance de `CalendarDate`. |
| `IS_TIME` | `Symbol.for('native-dates/Time')` | Toute instance de `Time`. |
| `IS_DURATION` | `Symbol.for('native-dates/Duration')` | Toute instance de `Duration`. |
| `IS_YEAR_MONTH` | `Symbol.for('native-dates/YearMonth')` | Toute instance de `YearMonth`. |
| `IS_MONTH_DAY` | `Symbol.for('native-dates/MonthDay')` | Toute instance de `MonthDay`. |
| `IS_RANGE` | `Symbol.for('native-dates/Range')` | Les instances de `DateRange`, `DateTimeRange` et `TimeRange`. |
| `IS_DATE_RANGE` | `Symbol.for('native-dates/DateRange')` | Toute instance de `DateRange`. |
| `IS_DATE_TIME_RANGE` | `Symbol.for('native-dates/DateTimeRange')` | Toute instance de `DateTimeRange`. |
| `IS_TIME_RANGE` | `Symbol.for('native-dates/TimeRange')` | Toute instance de `TimeRange`. |
