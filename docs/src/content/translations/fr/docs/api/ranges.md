---
source: 9606dd7fa967
title: Plages
lede: Des plages entre deux dates, deux instants ou deux heures du jour, avec inclusion, chevauchement et itération par pas.
---

## Classes de plages

Créez des plages directement avec les [fonctions fabriques de plages](/api/range-fn/) (`dateRange()`, `datetimeRange()`, `timeRange()`), ou enchaînez [`to()`](#to), [`for()`](#to) et [`range()`](#range) sur un point existant. Chaque instance de plage est immuable.

:::note[Plages de dates inclusives, plages d’instants et plages horaires semi-ouvertes]
Les plages de dates calendaires incluent leur dernier jour : du 1er au 7 septembre représente les sept jours complets. Les plages d’instants et les plages horaires excluent leur borne de fin afin que des créneaux consécutifs se succèdent sans chevauchement.
:::

:::entry
### `DateRange` :kind[class]

```js signature
new DateRange(start, end, options?)
new DateRange(interval, options?)
```

S’étend entre deux [dates calendaires](/api/calendar-date/), bornes incluses. Passer une date de fin antérieure à la date de début lève une `RangeError`.

Une `DateRange` se parcourt paresseusement jour par jour avec `for...of` ou la syntaxe de décomposition, en produisant chaque date calendaire du début à la fin.

```js title="ranges.js"
import { dateRange } from 'native-dates';

const trip = dateRange('2026-09-01', '2026-09-07');
const week = dateRange('2026-09-01', '7 days');

trip.duration.days; // 7
week.toString(); // '2026-09-01/2026-09-07'
for (const day of trip) {
  day.toString(); // '2026-09-01', '2026-09-02', ...
}
[...dateRange('2026-09-01', '2026-09-03')].map(String); // ['2026-09-01', '2026-09-02', '2026-09-03']
```
:::

:::entry
### `DateTimeRange` :kind[class]

```js signature
new DateTimeRange(start, end, options?)
new DateTimeRange(interval, options?)
```

S’étend entre deux [instants](/api/date-time/) en incluant le début et en excluant la fin. Lorsque la fin ne précise aucun fuseau horaire, elle est interprétée dans celui de l’instant de début. Des bornes inversées lèvent une `RangeError`.

```js
import { datetimeRange } from 'native-dates';

const block = datetimeRange('2026-09-01T09:00', '2026-09-01T10:30', 'America/New_York');
const standup = datetimeRange('2026-09-01T09:00', '30m', 'America/New_York');

standup.duration.minutes; // 30
block.end.hour; // 10
```
:::

:::entry
### `TimeRange` :kind[class]

```js signature
new TimeRange(start, end, options?)
new TimeRange(interval, options?)
```

S’étend entre deux [heures du jour](/api/time/) en incluant le début et en excluant la fin. Lorsque l’heure de fin précède l’heure de début sur l’horloge, la plage franchit minuit pour représenter un créneau nocturne.

```js
import { timeRange } from 'native-dates';

const dayShift = timeRange('9:00am', '5:00pm');
const nightShift = timeRange('22:00', '06:00');

dayShift.duration.hours; // 8
nightShift.duration.hours; // 8
```
:::

## Propriétés

Chaque plage expose son libellé formaté, ses bornes typées, son type et sa durée mesurée.

| Propriété | Type | Description |
|---|---|---|
| `text` | `string` | Plage formatée selon la locale, comme `'Sep 1 – 7, 2026'`. |
| `start`, `end` | `CalendarDate \| DateTime \| Time` | Bornes de début et de fin correspondant à la classe de plage. |
| `kind` | `'date' \| 'datetime' \| 'time'` | Étiquette indiquant le type de points portés par la plage. |
| `duration` | [`Duration`](/api/duration/) | Durée complète ancrée sur `start`, comptant le dernier jour sur les plages de dates et franchissant minuit sur les plages horaires nocturnes. |

## Construire à partir d’un point

:::entry
### `to()` :kind[method]

```js signature
d.to(end, unit?): DateRange
d.through(end, unit?): DateRange
d.for(length, unit?): DateRange
dt.to(end, unit?): DateTimeRange
dt.for(length, unit?): DateTimeRange
t.to(end, unit?): TimeRange
t.for(length, unit?): TimeRange
```

Construit une plage depuis ce point jusqu’à une borne de fin ou sur une durée donnée. Sur une [date calendaire](/api/calendar-date/), une durée de 7 jours s’arrête six jours après le jour de départ, car les deux bornes sont incluses.

Utilisez `for()` pour construire une plage à partir d’une durée explicite (les bornes de fin et les nombres sans unité sont refusés). Une date calendaire propose aussi `through()` comme alias de `to()`, puisque sa plage inclut le dernier jour.

**Paramètres**

```params
- name: end
  type: Point | DurationInput | number
  required: true
  description: Borne de fin du même type, durée (instance de `Duration`, chaîne ISO 8601, abrégée ou en anglais, objet de champs) ou quantité numérique `count` associée à `unit`.
- name: unit
  type: Unit
  description: Nom d’unité en anglais lorsque le premier argument est une quantité numérique.
```

**Valeur de retour**

```returns
type: DateRange | DateTimeRange | TimeRange
description: Plage correspondant au type du récepteur.
```

```js
import { date, datetime, time } from 'native-dates';

date('2026-09-01').for(7, 'days').toString(); // '2026-09-01/2026-09-07'
datetime('2026-09-01T09:00Z', 'UTC').for(90, 'minutes').toString(); // '2026-09-01T09:00:00.000Z/2026-09-01T10:30:00.000Z'
time('9:00am').to('5:00pm').toString(); // '09:00:00/17:00:00'
```
:::

:::entry
### `range()` :kind[method]

```js signature
d.range(unit, firstDay?): DateRange
dt.range(unit, firstDay?): DateTimeRange
```

Renvoie l’unité calendaire ou horaire complète qui englobe une date ou un instant. Les plages de dates vont du premier au dernier jour de l’unité (bornes incluses), tandis que les plages d’instants forment un intervalle semi-ouvert du début de l’unité jusqu’au début de l’unité suivante.

**Paramètres**

```params
- name: unit
  type: Unit
  required: true
  description: Unité englobante en anglais, comme `'week'`, `'month'` ou `'day'`.
- name: firstDay
  type: DayOfWeek
  description: Premier jour de la semaine en anglais lorsque `unit` vaut `'week'`, remplaçant `configure()` et la locale active.
```

**Valeur de retour**

```returns
type: DateRange | DateTimeRange
description: Plage englobant l’unité `unit`.
```

```js
import { date, datetime } from 'native-dates';

date('2026-11-18', { locale: 'en-US' }).range('week').toString(); // '2026-11-15/2026-11-21'
date('2026-11-18').range('week', 'monday').toString(); // '2026-11-16/2026-11-22'
date('2026-02-10').range('month').toString(); // '2026-02-01/2026-02-28'
datetime('2026-11-16T14:20Z', 'UTC').range('hour').toString(); // '2026-11-16T14:00:00.000Z/2026-11-16T15:00:00.000Z'
```
:::

## Inclusion et chevauchement

:::entry
### `contains()` :kind[method]

```js signature
range.contains(value): boolean
range.includes(value): boolean
```

Vérifie si un point ou une autre plage du même type se trouve à l’intérieur de cette plage. Les plages de dates incluent `end`, les plages d’instants et les plages horaires l’excluent, et les plages horaires nocturnes reconnaissent les heures situées de part et d’autre de minuit. `includes()` sert d’alias.

**Paramètres**

```params
- name: value
  type: Point | Range
  required: true
  description: Point ou plage du même type.
```

**Valeur de retour**

```returns
type: boolean
description: "`true` si `value` se situe dans cette plage."
```

```js
const stay = dateRange('2026-09-01', '2026-09-07');
stay.contains('2026-09-07'); // true

const night = timeRange('22:00', '06:00');
night.contains('23:30'); // true
night.contains('02:15'); // true
night.contains('06:00'); // false
```
:::

:::entry
### `overlaps()` :kind[method]

```js signature
range.overlaps(other): boolean
```

Renvoie `true` lorsque deux plages du même type partagent au moins un jour ou un instant. Deux créneaux consécutifs (plages d’instants ou plages horaires), où la fin du premier coïncide avec le début du second, ne se chevauchent pas.

**Paramètres**

```params
- name: other
  type: Range | string
  required: true
  description: Instance de plage ou chaîne ISO 8601 `'start/end'` du même type.
```

**Valeur de retour**

```returns
type: boolean
description: "`true` si les deux plages ont une partie commune."
```

```js
const firstSlot = timeRange('09:00', '10:00');
const nextSlot = timeRange('10:00', '11:00');

firstSlot.overlaps(nextSlot); // false
dateRange('2026-09-01', '2026-09-05').overlaps('2026-09-05/2026-09-10'); // true
```
:::

:::entry
### `intersection()` :kind[method]

```js signature
range.intersection(other): Range | null
```

Renvoie une nouvelle plage couvrant uniquement la partie commune aux deux plages, ou `null` si elles sont disjointes. Deux plages horaires nocturnes qui se croisent en deux segments distincts lèvent une `RangeError`.

**Paramètres**

```params
- name: other
  type: Range | string
  required: true
  description: Instance de plage ou chaîne ISO 8601 `'start/end'` du même type.
```

**Valeur de retour**

```returns
type: DateRange | DateTimeRange | TimeRange | null
description: Plage de chevauchement du même type, ou `null` si les plages sont disjointes.
```

```js
const a = dateRange('2026-09-01', '2026-09-10');
const b = dateRange('2026-09-05', '2026-09-15');

a.intersection(b)?.toString(); // '2026-09-05/2026-09-10'
a.intersection('2026-09-20/2026-09-25'); // null
```
:::

:::entry
### `equals()` :kind[method]

```js signature
range.equals(other): boolean
```

Renvoie `true` lorsque les deux plages ont les mêmes bornes de début et de fin. Les tableaux de plages se trient aussi par ordre chronologique avec [`compare()`](/api/compare/).

```js
dateRange('2026-09-01', '2026-09-07').equals('2026-09-01/2026-09-07'); // true
```
:::

:::entry
### `isEmpty()` :kind[method]

```js signature
range.isEmpty(): boolean
```

Renvoie `true` lorsqu’une plage d’instants ou une plage horaire a des bornes de début et de fin identiques. Renvoie toujours `false` sur une [`DateRange`](#daterange), car une seule date calendaire couvre une journée complète.

```js
timeRange('09:00', '09:00').isEmpty(); // true
dateRange('2026-09-01', '2026-09-01').isEmpty(); // false
```
:::

## Itération, découpage et fuseaux horaires

:::entry
### `every()` :kind[method]

```js signature
range.every(step): Point[]
range.every(count, unit): Point[]
```

Avance depuis `start` par pas positifs (unité ou durée) et renvoie tous les points compris dans la plage. Chaque pas est compté à partir du point de départ plutôt qu’en enchaînant des additions successives : ainsi, avancer de mois en mois depuis le 31 janvier retombe sur le dernier jour de chaque mois.

Pour parcourir paresseusement une [`DateRange`](#daterange) jour après jour sans allouer de tableau, itérez directement dessus avec `for...of` ou la syntaxe de décomposition.

**Paramètres**

```params
- name: step
  type: Unit | DurationInput | number
  required: true
  description: Nom d’unité en anglais comme `'day'`, durée (instance de `Duration`, chaîne ISO 8601, abrégée ou en anglais, objet de champs) ou quantité numérique `count` associée à `unit`.
- name: unit
  type: Unit
  description: Nom d’unité en anglais lorsque `step` est un nombre.
```

**Valeur de retour**

```returns
type: Array<CalendarDate | DateTime | Time>
description: Tableau ordonné des points compris dans la plage.
```

```js
dateRange('2026-01-31', '2026-04-30').every('month').map(String);
// ['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30']

timeRange('22:00', '02:00').every(1, 'hour').map(String);
// ['22:00:00', '23:00:00', '00:00:00', '01:00:00']
```
:::

:::entry
### `count()` :kind[method]

```js signature
dateRange.count(kind?): number
```

Compte les jours calendaires à l’intérieur d’une [`DateRange`](#daterange) sans allouer d’instances de dates intermédiaires. Passez un mot-clé ou un nom de jour de la semaine en anglais : `'days'` (par défaut), `'weekdays'`, `'weekends'`, ou un jour au singulier, en abrégé ou au pluriel (comme `'monday'`, `'mon'` ou `'mondays'`). `'weekdays'` et `'weekends'` suivent les jours de week-end de la locale active.

**Paramètres**

```params
- name: kind
  type: string
  default: "'days'"
  description: "Mot-clé en anglais (`'days'`, `'weekdays'`, `'weekends'`) ou nom de jour de la semaine en anglais au singulier, en abrégé ou au pluriel (comme `'monday'`, `'mon'` ou `'mondays'`)."
```

**Valeur de retour**

```returns
type: number
description: Nombre de jours calendaires correspondants dans la plage.
```

```js
const sprint = dateRange('2026-05-01', '2 weeks');

sprint.count(); // 14
sprint.count('weekdays'); // 10
sprint.count('weekends'); // 4
sprint.count('mondays'); // 2
```
:::

:::entry
### `split()` :kind[method]

```js signature
range.split(step): Range[]
range.split(count, unit): Range[]
range.splitBy(step): Range[]
range.splitBy(count, unit): Range[]
```

Découpe la plage en sous-plages contiguës de la taille du pas indiqué, en bornant le dernier segment à la fin de la plage. Accepte les mêmes arguments de pas que [`every()`](#every), avec `splitBy()` comme alias.

```js
dateRange('2026-09-01', '2026-09-10').split(4, 'days').map(String);
// ['2026-09-01/2026-09-04', '2026-09-05/2026-09-08', '2026-09-09/2026-09-10']
```
:::

:::entry
### `in()` :kind[method]

```js signature
dateRange.in(zone?): DateTimeRange
dtRange.in(zone): DateTimeRange
```

Convertit une [`DateRange`](#daterange) inclusive en [`DateTimeRange`](#datetimerange) semi-ouverte allant de minuit le jour de `start` jusqu’à minuit le lendemain de `end` (borne supérieure exclue), ce qui correspond aux bornes des requêtes sur horodatages. Sur une plage d’instants, déplace les deux bornes dans le fuseau horaire cible.

Appeler `in()` sur une plage horaire lève une `RangeError`, car les heures du jour n’ont pas de date calendaire.

**Paramètres**

```params
- name: zone
  type: Zone
  description: Fuseau horaire IANA cible, décalage UTC fixe ou `'UTC'`. Fuseau horaire configuré par défaut sur `DateRange`.
```

**Valeur de retour**

```returns
type: DateTimeRange
description: Plage d’instants semi-ouverte dans `zone`.
```

```js
dateRange('2026-09-01', '2026-09-03').in('UTC').toString();
// '2026-09-01T00:00:00.000Z/2026-09-04T00:00:00.000Z'
```
:::

## Formatage et conversion

:::entry
### `format()` :kind[method]

```js signature
range.format(spec?, locale?): string
```

Formate la plage via `Intl` pour les préréglages et les objets d’options, en condensant automatiquement les dates ou les mois communs. Les motifs de jetons formatent chaque borne séparément et les joignent par `' – '`.

Les formats personnalisés enregistrés dans [`configure()`](/api/configure/) fonctionnent aussi ici. Consultez [Formatage](/guides/formatting/) pour le détail des préréglages et des jetons.

**Paramètres**

```params
- name: spec
  type: FormatSpec
  description: Nom de préréglage, objet `Intl.DateTimeFormatOptions` ou motif de jetons.
- name: locale
  type: Locale
  description: Étiquette de locale BCP 47 remplaçant la locale de cette plage ou la locale configurée pour cet appel.
```

**Valeur de retour**

```returns
type: string
description: Plage formatée sous forme de chaîne.
```

```js
const trip = dateRange('2026-09-01', '2026-09-07');

trip.format('medium', 'en-US'); // 'Sep 1 – 7, 2026'
trip.format('YYYY-MM-DD'); // '2026-09-01 – 2026-09-07'
timeRange('22:00', '06:00').format('HH:mm'); // '22:00 – 06:00'
```
:::

:::entry
### `locale()` :kind[method]

```js signature
range.locale(): Locale | undefined
range.locale(tag): Range
```

Lit la locale portée par cette plage, ou renvoie une copie formatée dans une autre locale pour les aperçus textuels, les préréglages, les bornes et les sous-plages. Passer une étiquette vide efface la locale portée, et [`lang()`](#lang) sert d’alias.

**Paramètres**

```params
- name: tag
  type: Locale | null | undefined
  description: Étiquette de locale BCP 47 à conserver, ou `null` pour effacer une étiquette existante.
```

**Valeur de retour**

```returns
type: Range | Locale | undefined
description: Étiquette active en l’absence d’argument, ou nouvelle plage du même type portant `tag`.
```

```js
const stay = dateRange('2026-09-01', '2026-09-07').locale('de-DE');

stay.locale(); // 'de-DE'
stay.format('medium'); // '01.–07.09.2026'
stay.duration.text; // '7 Tage'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
range.lang(): Locale | undefined
range.lang(tag): Range
```

Alias court de [`locale()`](#locale) pour lire ou associer une étiquette de locale BCP 47 à cette plage.
:::

:::entry
### `as()` :kind[method]

```js signature
range.as('duration'): Duration
```

Renvoie la durée de la plage lorsque `'duration'` est demandé dans une chaîne d’appels, et lève une `RangeError` pour les autres types.

```js
dateRange('2026-09-01', '2026-09-07').as('duration').days; // 7
```
:::

:::entry
### `toString()` :kind[method]

```js signature
range.toString(): string
range.toJSON(): string
```

Renvoie la chaîne ISO 8601 `'start/end'`, que les [fonctions fabriques de plages](/api/range-fn/) analysent directement. `toJSON()` renvoie la même chaîne pour la sérialisation JSON.

```js
dateRange('2026-09-01', '2026-09-07').toString(); // '2026-09-01/2026-09-07'
timeRange('9am', '5pm').toJSON(); // '09:00:00/17:00:00'
```
:::

:::entry
### `valueOf()` :kind[method]

```js signature
range.valueOf(): never
```

Lève une `RangeError` afin que les opérateurs numériques ne convertissent jamais une plage en nombre.

Affinez le type d’une valeur inconnue à l’exécution avec [`kindOf()`](/api/kind-of/) ou les [gardes de type pour les plages](/api/kind-of/#type-guards) exportés :

```js
import { dateRange, isDateRange, isDateTimeRange, isTimeRange } from 'native-dates';

const stay = dateRange('2026-09-01', '2026-09-07');
isDateRange(stay); // true
isDateTimeRange(stay); // false
isTimeRange(stay); // false
```
:::
