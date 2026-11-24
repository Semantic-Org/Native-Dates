---
source: a03fe5ee9f3b
title: compare()
lede: Trier et sélectionner les valeurs extrêmes parmi des dates calendaires, instants, heures du jour, durées et plages.
---

## Trier et ordonner

:::entry
### `compare()` :kind[function]

```js signature
compare(a, b): -1 | 0 | 1
```

Ordonne deux valeurs du même type pour `Array.prototype.sort()`, en renvoyant un nombre négatif, nul ou positif. Fonctionne avec les instants, les horodatages Unix, les dates calendaires, les heures du jour, les durées, les [valeurs année-mois](/api/year-month/) et les [plages](/api/ranges/).

Chaque argument peut aussi être une chaîne ISO brute, ainsi qu’un objet `Date` JavaScript natif ou un horodatage en millisecondes depuis l’époque Unix (convertis en `DateTime`). Comparé à une heure du jour, un nombre est interprété comme une heure, tandis que la comparaison de types différents lève une `TypeError`.

```js title="sort.js"
import { compare, date, datetime, hours, minutes } from 'native-dates';

const dates = [date('2026-12-01'), date('2026-05-10'), date('2026-08-20')];
dates.sort(compare).map(String); // ['2026-05-10', '2026-08-20', '2026-12-01']

const moments = [
  datetime('2026-11-16T18:00', 'Europe/Berlin'),
  datetime('2026-11-16T08:00', 'America/Los_Angeles'),
];
moments.sort(compare)[0].zone; // 'America/Los_Angeles'

compare(1794840000000, datetime('2026-11-16T18:00Z')); // -1

const spans = [hours(2), minutes(45), minutes(90)].sort(compare);
spans[0].minutes; // 45
```

**Paramètres**

```params
- name: a
  type: Point | Duration | YearMonth | Range
  required: true
  description: Première valeur typée, chaîne ISO, objet `Date` JavaScript natif ou horodatage en millisecondes depuis l’époque Unix à comparer.
- name: b
  type: Point | Duration | YearMonth | Range
  required: true
  description: Seconde valeur du même type, ou entrée brute compatible avec `a`.
```

**Valeur de retour**

```returns
type: -1 | 0 | 1
description: "Valeur `-1` si la première valeur est antérieure, `0` si elles sont égales et `1` si elle est postérieure."
```

Les plages du même type sont triées d’abord selon leur borne de début, puis départagées par leur borne de fin :

```js
import { compare, dateRange } from 'native-dates';

const windows = [
  dateRange('2026-11-10', '2026-11-20'),
  dateRange('2026-11-10', '2026-11-14'),
  dateRange('2026-11-01', '2026-11-05'),
];

windows.sort(compare).map(String);
// ['2026-11-01/2026-11-05', '2026-11-10/2026-11-14', '2026-11-10/2026-11-20']
```
:::

:::note[Comparer des instants entre fuseaux horaires]
`compare()` ordonne les valeurs [`DateTime`](/api/date-time/) selon leur instant exact plutôt que selon les chiffres de leur horloge locale. Une réunion à 9 h 00 à New York se place avant une réunion à 8 h 00 le même jour à Los Angeles.
:::

## Choisir les valeurs extrêmes

Trouvez la valeur minimale ou maximale parmi un ensemble de dates calendaires, d’instants, d’heures du jour ou de valeurs [`YearMonth`](/api/year-month/). Les deux fonctions acceptent des arguments variadiques ou un unique tableau non vide.

:::entry
### `earliest()` :kind[function]

```js signature
earliest(...points): DateTime | CalendarDate | Time | YearMonth
earliest(points): DateTime | CalendarDate | Time | YearMonth
```

Renvoie la première valeur dans l’ordre chronologique parmi un ou plusieurs arguments ou un tableau non vide du même type, en convertissant les objets `Date` JavaScript natifs ou les horodatages en millisecondes depuis l’époque Unix en [`DateTime`](/api/date-time/). Passer un tableau vide lève une `RangeError`.

**Paramètres**

```params
- name: points
  type: Point[] | YearMonth[]
  required: true
  description: Ensemble d’une ou plusieurs dates calendaires, instants, horodatages Unix, heures du jour ou valeurs année-mois du même type.
```

**Valeur de retour**

```returns
type: DateTime | CalendarDate | Time | YearMonth
description: Valeur placée en premier dans l’ordre chronologique, en conservant le premier élément de la liste en cas d’instants égaux.
```

```js
import { date, earliest, time } from 'native-dates';

earliest(date('2026-11-20'), date('2026-11-04'), date('2026-11-16')).toString(); // '2026-11-04'
earliest([time('5:30pm'), time('9:00am'), time('12:15pm')]).toString(); // '09:00:00'
earliest(1794850200000, 1794840000000).epochMilliseconds; // 1794840000000
```
:::

:::entry
### `latest()` :kind[function]

```js signature
latest(...points): DateTime | CalendarDate | Time | YearMonth
latest(points): DateTime | CalendarDate | Time | YearMonth
```

Renvoie la dernière valeur dans l’ordre chronologique parmi un ou plusieurs arguments ou un tableau non vide du même type, en convertissant également les objets `Date` JavaScript natifs ou les horodatages en millisecondes depuis l’époque Unix en `DateTime`. Passer un tableau vide lève une `RangeError`.

**Paramètres**

```params
- name: points
  type: Point[] | YearMonth[]
  required: true
  description: Ensemble d’une ou plusieurs dates calendaires, instants, horodatages Unix, heures du jour ou valeurs année-mois du même type.
```

**Valeur de retour**

```returns
type: DateTime | CalendarDate | Time | YearMonth
description: Valeur placée en dernier dans l’ordre chronologique, en conservant le premier élément de la liste en cas d’instants égaux.
```

Combinez [`earliest()`](#earliest) et `latest()` pour borner une valeur entre deux limites :

```js
import { date, earliest, latest } from 'native-dates';

const minDate = date('2026-11-01');
const maxDate = date('2026-11-30');
const picked = date('2026-12-12');

const clamped = earliest(maxDate, latest(minDate, picked));
clamped.toString(); // '2026-11-30'
```
:::
