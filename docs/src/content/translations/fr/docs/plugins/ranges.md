---
source: c784c44bf2d7
title: ranges
lede: Soustrayez des segments qui se chevauchent et fusionnez les plages adjacentes sur chaque type de plage.
---

## Opérations ensemblistes sur les plages

Les [plages](/api/ranges/) du noyau incluent déjà l’appartenance, la détection de chevauchement et l’intersection. Importer ce plugin ajoute `subtract()` et `union()` sur `DateRange`, `DateTimeRange` et `TimeRange`, et exporte `mergeRanges()` pour fusionner des listes de plages.

```js title="ranges.js"
import { mergeRanges } from '@native-dates/plugins/ranges';
import { dateRange, timeRange } from 'native-dates';

const trip = dateRange('2026-11-01', '2026-11-10');
trip.subtract('2026-11-04/2026-11-06').map(String);
// ['2026-11-01/2026-11-03', '2026-11-07/2026-11-10']

dateRange('2026-11-01', '2026-11-05').union('2026-11-06/2026-11-10')?.toString();
// '2026-11-01/2026-11-10'

mergeRanges([
  timeRange('22:00', '02:00'),
  timeRange('01:00', '06:00'),
  timeRange('10:00', '12:00'),
]).map(String);
// ['10:00:00/12:00:00', '22:00:00/06:00:00']
```

Chaque classe de plage conserve sa convention de bornes. Les plages de dates calendaires incluent leurs deux bornes, tandis que les plages d’instants et les plages horaires excluent leur borne de fin.

## Méthodes d’instance

:::entry
### `subtract()` :kind[method]

```js signature
range.subtract(other): Range[]
```

Retire de cette plage le segment couvert par `other` et renvoie zéro, une ou deux plages restantes du même type. Les plages renvoyées conservent la locale et le fuseau horaire du récepteur.

Soustraire une plage disjointe ou vide renvoie la plage d’origine dans un tableau à un élément. Appeler `subtract()` sur une plage d’instants ou une plage horaire vide renvoie un tableau vide.

**Paramètres**

```params
- name: other
  type: Range | string
  required: true
  description: Instance de plage ou chaîne de plage du même type à retirer.
```

**Valeur de retour**

```returns
type: Array<DateRange | DateTimeRange | TimeRange>
description: Tableau ordonné des plages restantes du même type.
```

```js
import '@native-dates/plugins/ranges';
import { dateRange, datetimeRange, timeRange } from 'native-dates';

dateRange('2026-11-01', '2026-11-10').subtract('2026-11-01/2026-11-03').map(String);
// ['2026-11-04/2026-11-10']

const day = datetimeRange('2026-11-02T09:00', '2026-11-02T17:00', 'America/New_York');
day.subtract('2026-11-02T12:00/2026-11-02T13:00').map((part) => `${part.start.hour}-${part.end.hour}`);
// ['9-12', '13-17']

timeRange('22:00', '06:00').subtract('23:00 - 02:00').map(String);
// ['22:00:00/23:00:00', '02:00:00/06:00:00']
```
:::

:::entry
### `union()` :kind[method]

```js signature
range.union(other): Range | null
```

Fusionne cette plage avec une plage du même type qui la chevauche ou lui est directement adjacente, et renvoie `null` lorsqu’un écart les sépare. Les plages renvoyées conservent la locale et le fuseau horaire du récepteur.

Deux valeurs `DateRange` sont adjacentes lorsque la seconde commence le lendemain de la fin de la première. Deux valeurs `DateTimeRange` ou `TimeRange` sont adjacentes lorsque l’une se termine exactement au début de l’autre, et les plages vides sont sans effet.

**Paramètres**

```params
- name: other
  type: Range | string
  required: true
  description: Instance de plage ou chaîne de plage du même type à fusionner.
```

**Valeur de retour**

```returns
type: DateRange | DateTimeRange | TimeRange | null
description: "Plage fusionnée du même type, ou `null` lorsqu’un écart les sépare."
```

```js
import '@native-dates/plugins/ranges';
import { dateRange, timeRange } from 'native-dates';

dateRange('2026-11-01', '2026-11-05').union('2026-11-06/2026-11-10')?.toString();
// '2026-11-01/2026-11-10'

dateRange('2026-11-01', '2026-11-05').union('2026-11-07/2026-11-10');
// null

timeRange('22:00', '06:00').union('06:00 - 08:00')?.toString();
// '22:00:00/08:00:00'
```
:::

## Fusionner des collections

:::entry
### `mergeRanges()` :kind[function]

```js signature
mergeRanges(ranges): Range[]
```

Trie un itérable de plages de même type et fusionne tous les segments qui se chevauchent ou se touchent en un ensemble minimal de plages disjointes. Les plages d’instants et les plages horaires vides sont écartées du résultat.

Passer des plages de types différents lève une `TypeError` avec le code `conflictingRanges`, et passer un élément qui n’est pas une plage lève une `TypeError` avec le code `invalidRange`.

**Paramètres**

```params
- name: ranges
  type: Iterable<DateRange> | Iterable<DateTimeRange> | Iterable<TimeRange>
  required: true
  description: Tableau, Set ou autre itérable de plages partageant un même type.
```

**Valeur de retour**

```returns
type: Array<DateRange | DateTimeRange | TimeRange>
description: Tableau minimal et trié de plages disjointes du même type.
```

```js
import { mergeRanges } from '@native-dates/plugins/ranges';
import { dateRange, datetimeRange } from 'native-dates';

mergeRanges([
  dateRange('2026-11-12', '2026-11-15'),
  dateRange('2026-11-01', '2026-11-05'),
  dateRange('2026-11-06', '2026-11-08'),
]).map(String);
// ['2026-11-01/2026-11-08', '2026-11-12/2026-11-15']

mergeRanges([
  datetimeRange('2026-11-02T11:00', '2026-11-02T12:00', 'UTC'),
  datetimeRange('2026-11-02T09:00', '2026-11-02T11:00', 'UTC'),
]).map((part) => part.duration.hours);
// [3]
```
:::

## Plages horaires nocturnes

Les valeurs `TimeRange` nocturnes franchissent minuit sans rupture dans `subtract()`, `union()` et `mergeRanges()`. Les segments adjacents qui se rejoignent à minuit se ressoudent en une seule plage nocturne.

```js
import '@native-dates/plugins/ranges';
import { timeRange } from 'native-dates';

timeRange('22:00', '06:00').subtract('01:00 - 03:00').map(String);
// ['22:00:00/01:00:00', '03:00:00/06:00:00']

timeRange('22:00', '00:00').union('00:00 - 06:00')?.toString();
// '22:00:00/06:00:00'
```

:::note[Couverture complète de 24 heures]
Une `TimeRange` dont l’heure de début et l’heure de fin sont identiques est vide : aucune `TimeRange` unique ne peut donc représenter les 24 heures complètes. Appeler `union()` ou `mergeRanges()` sur des plages horaires qui couvrent toute la journée lève une `RangeError` avec le code `unsupportedUnion`.
:::
