---
source: 05899a15dfff
title: Duration
lede: Une durée exprimée en unités calendaires et horaires.
---

## Créer une Duration

Analysez des expressions de durée en anglais, des formes abrégées ou des chaînes ISO 8601 avec [`duration()`](/api/duration-fn/), appelez des fonctions d’unités comme [`hours()`](/api/duration-fn/#hours), ou mesurez l’écart entre deux dates ou deux heures. Les instances sont immuables : chaque méthode renvoie une nouvelle valeur.

```js title="create.js"
import { date, days, duration, hours } from 'native-dates';

const breakTime = duration('1h 30m');
const trial = days(14);
const timeout = hours(1.5);
const quarter = date('2026-01-01').until('2026-04-01');
```

:::note[Les champs restent tels quels]
Créer une durée à partir de 90 minutes laisse `minutes` à `90` au lieu de convertir en 1 heure et 30 minutes. De même, les jours calendaires restent séparés des heures lors des changements d’heure tant que vous n’appelez pas [`balance()`](#balance).
:::

## Propriétés

Les propriétés reflètent les quantités d’unités stockées sur la durée.

| Propriété | Type | Description |
|---|---|---|
| `text` | `string` | Durée formatée selon la locale en style long, comme `'1 hour, 30 minutes'`. |
| `years`, `months`, `weeks`, `days` | `number` | Quantités signées d’unités calendaires stockées sur cette durée. |
| `hours`, `minutes`, `seconds` | `number` | Quantités signées d’unités horaires. |
| `milliseconds`, `microseconds`, `nanoseconds` | `number` | Quantités signées d’unités inférieures à la seconde. |
| `sign` | `number` | Sens global de la durée : `1`, `0` ou `-1`. |
| `anchor` | `TemporalValue` | Point de départ enregistré par [`until()`](/api/date-time/#until) ou [`since()`](/api/date-time/#since), ou `undefined` sur les durées autonomes. |

## Arithmétique et signe

Combinez des durées, multipliez-les par un facteur ou inversez leur signe. Tous les champs non nuls d’une durée doivent avoir le même signe.

:::entry
### `plus()` :kind[method]

```js signature
dur.plus(other, unit?): Duration
dur.add(other, unit?): Duration
```

Ajoute une autre durée et renvoie une nouvelle `Duration`. Les unités calendaires s’additionnent champ par champ tandis que les unités horaires se combinent directement. `add()` sert d’alias.

**Paramètres**

```params
- name: other
  type: DurationInput
  required: true
  description: Nombre associé à `unit`, instance de `Duration`, chaîne de durée (ISO 8601, abrégée ou en anglais), objet de champs ou millisecondes.
- name: unit
  type: Unit
  description: Nom d’unité en anglais lorsque `other` est un nombre, comme `'minutes'` ou `'days'`.
```

**Valeur de retour**

```returns
type: Duration
description: Nouvelle `Duration` combinée.
```

```js
hours(2).plus(30, 'minutes').toString(); // 'PT2H30M'
days(1).plus('6h').toString(); // 'P1DT6H'
```
:::

:::entry
### `minus()` :kind[method]

```js signature
dur.minus(other, unit?): Duration
dur.subtract(other, unit?): Duration
```

Soustrait une autre durée, en empruntant entre années et mois ou entre semaines et jours si nécessaire. Les paires de signes opposés incompatibles, comme des jours moins des heures, lèvent une `RangeError`. `subtract()` sert d’alias.

**Paramètres**

```params
- name: other
  type: DurationInput
  required: true
  description: Nombre associé à `unit`, instance de `Duration`, chaîne de durée (ISO 8601, abrégée ou en anglais), objet de champs ou millisecondes.
- name: unit
  type: Unit
  description: Nom d’unité en anglais lorsque `other` est un nombre.
```

**Valeur de retour**

```returns
type: Duration
description: Nouvelle `Duration` diminuée de `other`.
```

```js
import { months, weeks, years } from 'native-dates';

hours(2).minus('30m').toString(); // 'PT1H30M'
years(1).minus(months(1)).toString(); // 'P11M'
weeks(1).minus(days(1)).toString(); // 'P6D'
```
:::

:::entry
### `times()` :kind[method]

```js signature
dur.times(factor): Duration
```

Multiplie chaque champ par un nombre, en reportant les parties fractionnaires vers les unités inférieures.

**Paramètres**

```params
- name: factor
  type: number
  required: true
  description: Multiplicateur appliqué à la durée, y compris un nombre décimal ou négatif.
```

**Valeur de retour**

```returns
type: Duration
description: Nouvelle `Duration` multipliée par `factor`.
```

```js
hours(1).times(1.5).toString(); // 'PT1H30M'
days(1).times(3).toString(); // 'P3D'
```
:::

:::entry
### `abs()` :kind[method]

```js signature
dur.abs(): Duration
```

Renvoie une copie dont tous les champs sont positifs.

```js
duration('-1h 30m').abs().toString(); // 'PT1H30M'
```
:::

:::entry
### `negated()` :kind[method]

```js signature
dur.negated(): Duration
```

Inverse le signe de chaque champ de la durée.

```js
hours(2).negated().toString(); // '-PT2H'
```
:::

## Équilibrage, arrondi et totaux

Reportez les petites unités vers les plus grandes, arrondissez à une précision cible ou exprimez la durée complète sous forme d’un seul nombre.

:::warning[Convertir les mois et les années en jours]
Les durées composées uniquement de mois et d’années s’équilibrent, se totalisent et se comparent entre elles sur la base de 12 mois par an. Les convertir en semaines, en jours ou en unités horaires exige une date de départ issue de [`until()`](/api/calendar-date/#until) ou [`since()`](/api/calendar-date/#since), car le nombre de jours d’un mois calendaire varie.
:::

:::entry
### `balance()` :kind[method]

```js signature
dur.balance(largestUnit?): Duration
```

Reporte les dépassements des petites unités vers les plus grandes. Par défaut, les durées autonomes regroupent les unités horaires jusqu’aux heures et les mois en années, tandis que les durées mesurées s’équilibrent jusqu’aux jours sauf si vous passez une unité cible plus grande.

**Paramètres**

```params
- name: largestUnit
  type: Unit
  description: Plus grande unité en anglais vers laquelle reporter les valeurs, comme `'hour'`, `'day'` ou `'week'`.
```

**Valeur de retour**

```returns
type: Duration
description: Nouvelle `Duration` équilibrée.
```

```js
import { minutes, months } from 'native-dates';

minutes(150).balance().toString(); // 'PT2H30M'
months(18).balance().toString(); // 'P1Y6M'
duration('36h').balance('day').toString(); // 'P1DT12H'
duration('10d').balance('week').toString(); // 'P1W3D'
```
:::

:::entry
### `total()` :kind[method]

```js signature
dur.total(unit): number
dur.as(unit): number
```

Renvoie la durée totale sous forme d’un seul nombre à virgule flottante dans l’unité demandée. Également disponible sous l’alias [`as()`](#as) pour les chaînes d’appels.

**Paramètres**

```params
- name: unit
  type: Unit
  required: true
  description: Unité cible en anglais dans laquelle exprimer la durée totale, comme `'hours'` ou `'days'`.
```

**Valeur de retour**

```returns
type: number
description: Durée totale exprimée dans `unit`, partie décimale comprise.
```

```js
import { months } from 'native-dates';

minutes(90).total('hours'); // 1.5
months(18).total('years'); // 1.5
date('2026-01-01').until('2026-04-01').total('days'); // 90
```
:::

:::entry
### `as()` :kind[method]

```js signature
dur.as(unit): number
```

Alias de [`total()`](#total) conçu pour les chaînes d’appels, qui convertit la durée en valeur numérique dans l’unité en anglais indiquée.

```js
hours(36).as('days'); // 1.5
date('2026-11-01').until('2026-11-16').as('days'); // 15
```
:::

:::entry
### `round()` :kind[method]

```js signature
dur.round(smallestUnit): Duration
```

Arrondit la durée à l’unité entière la plus proche ; les valeurs exactement à mi-chemin sont arrondies en s’éloignant de zéro.

**Paramètres**

```params
- name: smallestUnit
  type: Unit
  required: true
  description: Plus petite unité en anglais à conserver après arrondi, comme `'minute'` ou `'hour'`.
```

**Valeur de retour**

```returns
type: Duration
description: Nouvelle `Duration` arrondie.
```

```js
minutes(90).round('hour').toString(); // 'PT2H'
duration('1h 20m').round('hour').toString(); // 'PT1H'
```
:::

## Comparer des durées

Comparez des durées selon leur durée totale plutôt que selon la façon dont leurs champs ont été saisis : ainsi, 60 minutes égalent 1 heure.

:::entry
### `equals()` :kind[method]

```js signature
dur.equals(other): boolean
```

Renvoie `true` lorsque les deux durées représentent la même durée totale.

**Paramètres**

```params
- name: other
  type: DurationInput
  required: true
  description: Autre `Duration` ou toute entrée acceptée par `duration()` (ISO 8601, forme abrégée ou expression en anglais).
```

**Valeur de retour**

```returns
type: boolean
description: "`true` si les deux durées représentent la même durée totale."
```

```js
import { months, years } from 'native-dates';

hours(1).equals(minutes(60)); // true
years(1).equals(months(12)); // true
```
:::

:::entry
### `compare()` :kind[method]

```js signature
dur.compare(other): number
```

Ordonne cette durée par rapport à une autre selon sa durée totale, pour le tri.

**Paramètres**

```params
- name: other
  type: DurationInput
  required: true
  description: "Durée de comparaison (instance de `Duration` ou entrée acceptée par `duration()` : ISO 8601, forme abrégée ou expression en anglais)."
```

**Valeur de retour**

```returns
type: number
description: "`-1` si cette durée est plus courte, `0` si elles sont égales, ou `1` si elle est plus longue."
```

```js
hours(1).compare(minutes(90)); // -1
date('2026-01-01').until('2026-02-01').compare(days(31)); // 0
```
:::

### Prédicats de signe

Vérifications sans argument pour les durées nulles ou négatives :

| Méthode | Type | Description |
|---|---|---|
| `isZero()` | `boolean` | Indique si toutes les unités de la durée valent zéro. |
| `isNegative()` | `boolean` | Indique si la durée est négative. |

## Formatage et conversion

:::entry
### `format()` :kind[method]

```js signature
dur.format(style?, locale?): string
```

Formate la durée dans la locale active avec `Intl.DurationFormat`. Les dépassements horaires s’équilibrent automatiquement jusqu’aux heures, et les champs inférieurs à la seconde restent masqués dès que des unités plus grandes sont présentes.

**Paramètres**

```params
- name: style
  type: "'long' | 'short' | 'narrow' | 'digital'"
  default: "'long'"
  description: Style d’affichage des libellés d’unités, ou `'digital'` pour un compteur séparé par des deux-points.
- name: locale
  type: string
  description: Étiquette de locale BCP 47 remplaçant la locale de cette durée ou la locale configurée pour cet appel.
```

**Valeur de retour**

```returns
type: string
description: Durée formatée selon la locale.
```

```js
const span = duration('2h 30m');

span.format('long', 'en-US'); // '2 hours, 30 minutes'
span.format('short', 'en-US'); // '2 hr, 30 min'
span.format('narrow', 'en-US'); // '2h 30m'
span.format('digital', 'en-US'); // '2:30:00'
```
:::

:::entry
### `locale()` :kind[method]

```js signature
dur.locale(): Locale | undefined
dur.locale(tag): Duration
```

Lit la locale portée par cette durée, ou renvoie une copie formatée dans une autre locale pour les aperçus textuels, les préréglages et les chaînes d’opérations arithmétiques. Passer une étiquette vide efface la locale portée, et [`lang()`](#lang) sert d’alias.

**Paramètres**

```params
- name: tag
  type: Locale | null | undefined
  description: Étiquette de locale BCP 47 à conserver, ou `null` pour effacer une étiquette existante.
```

**Valeur de retour**

```returns
type: Duration | Locale | undefined
description: Étiquette active en l’absence d’argument, ou nouvelle `Duration` portant `tag`.
```

```js
import { days } from 'native-dates';

const wait = days(2).locale('ar');

wait.locale(); // 'ar'
wait.text; // 'يومان'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
dur.lang(): Locale | undefined
dur.lang(tag): Duration
```

Alias court de [`locale()`](#locale) pour lire ou associer une étiquette de locale BCP 47 à cette durée.
:::

:::entry
### `toFields()` :kind[method]

```js signature
dur.toFields(): DurationFields
```

Renvoie un objet simple contenant uniquement les champs d’unités non nuls de cette durée, nommés au pluriel en anglais.

```js
duration('1h 30m').toFields(); // { hours: 1, minutes: 30 }
```
:::

:::entry
### `toString()` :kind[method]

```js signature
dur.toString(): string
dur.toJSON(): string
```

Renvoie la durée au format ISO 8601. `toJSON()` renvoie la même chaîne pour `JSON.stringify()`.

**Valeur de retour**

```returns
type: string
description: Chaîne de durée ISO 8601, comme `'PT1H30M'`.
```

```js
const ttl = duration('1h 30m');

ttl.toString(); // 'PT1H30M'
JSON.stringify({ ttl }); // '{"ttl":"PT1H30M"}'
```
:::

:::entry
### `toMilliseconds()` :kind[method]

```js signature
dur.toMilliseconds(): number
```

Renvoie la durée totale en millisecondes. Les durées en mois ou en années sans point d’ancrage lèvent une `RangeError`.

```js
hours(2).toMilliseconds(); // 7200000
```
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
dur.toTemporal(): Temporal.Duration
```

Renvoie l’instance `Temporal.Duration` sous-jacente.
:::

:::entry
### `valueOf()` :kind[method]

```js signature
dur.valueOf(): number
```

Renvoie le total en millisecondes afin que les durées fixes ou ancrées fonctionnent directement avec les minuteurs et les opérateurs de comparaison numériques.
:::
