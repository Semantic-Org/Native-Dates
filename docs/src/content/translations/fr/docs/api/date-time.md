---
source: 62b87452c7ee
title: DateTime
lede: Un instant précis, observé dans un fuseau horaire.
---

## Créer un DateTime

Créez une instance à partir d’une valeur existante avec [`datetime()`](/api/datetime-fn/), lisez l’instant courant avec [`now()`](/api/datetime-fn/#now) ou associez une date calendaire à une heure du jour avec [`at()`](/api/calendar-date/#at). Les instances sont immuables : chaque méthode qui modifie une valeur en renvoie une nouvelle.

```js title="create.js"
import { date, datetime, now } from 'native-dates';

const fromUtc = datetime('2026-11-16T17:30:00Z', 'America/Los_Angeles');
const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
const current = now();
```

Passez un fuseau horaire pour observer l’instant dans ce fuseau, ou omettez-le pour utiliser celui défini par défaut dans [`configure()`](/api/configure/) :

```js
const event = datetime('2026-11-16T17:30:00Z', 'America/New_York');
event.zone; // 'America/New_York'
event.hour; // 12
```

:::note[Les décalages fixent l’instant, pas le fuseau horaire]
Un `Z` final ou un décalage numérique dans une chaîne en entrée identifie l’instant exact où l’événement s’est produit, tandis que l’instance utilise le fuseau horaire fourni ou celui configuré par défaut. Passez `'UTC'` comme fuseau horaire lorsque vous souhaitez obtenir des champs et des calculs en UTC.
:::

## Propriétés

Les propriétés lisent la date et l’heure dans le fuseau horaire de l’instance.

| Propriété | Type | Description |
|---|---|---|
| `text` | `string` | Date, heure et nom court du fuseau horaire formatés selon la locale, comme `'Nov 16, 2026, 9:30 AM PST'`. |
| `year`, `month`, `day` | `number` | Année calendaire, mois (1–12) et jour du mois (1–31). |
| `hour`, `minute`, `second` | `number` | Champs d’horloge sur 24 heures (0–23, 0–59, 0–59). |
| `millisecond`, `microsecond`, `nanosecond` | `number` | Champs d’horloge inférieurs à la seconde (0–999). |
| `zone` | `string` | Identifiant de fuseau horaire IANA canonique ou décalage fixe, comme `'America/Los_Angeles'` ou `'UTC'`. |
| `offset` | `string` | Décalage UTC actif à cet instant, comme `'-08:00'`. |
| `epochSeconds` | `number` | Nombre entier de secondes écoulées depuis l’époque Unix, arrondi à l’entier inférieur. |
| `epochMilliseconds` | `number` | Millisecondes écoulées depuis l’époque Unix. |
| `epochNanoseconds` | `bigint` | Nanosecondes exactes écoulées depuis l’époque Unix. |
| `date` | [`CalendarDate`](/api/calendar-date/) | Date calendaire dans ce fuseau horaire. |
| `time` | [`Time`](/api/time/) | Heure du jour dans ce fuseau horaire. |
| `yearMonth` | [`YearMonth`](/api/year-month/) | Année et mois calendaires dans ce fuseau horaire. |
| `monthDay` | [`MonthDay`](/api/month-day/) | Mois et jour calendaires dans ce fuseau horaire. |
| `dayOfWeek` | `number` | Jour ISO de la semaine, de 1 pour lundi à 7 pour dimanche. |
| `weekStart` | `number` | Premier jour de la semaine pour cet instant (de 1 à 7), selon [`configure()`](/api/configure/) ou sa locale. |
| `quarter` | `number` | Trimestre calendaire (1–4). |
| `weekOfYear`, `dayOfYear` | `number` | Numéro de semaine ISO (1–53) et jour de l’année (1–366). |
| `daysInMonth`, `daysInYear`, `hoursInDay` | `number` | Nombre de jours du mois et de l’année en cours, et nombre d’heures de la journée calendaire locale. |

## Fuseau horaire et champs

Observez le même instant dans un autre fuseau horaire ou remplacez des champs calendaires et horaires précis.

:::entry
### `in()` :kind[method]

```js signature
dt.in(zone): DateTime
```

Renvoie un nouveau `DateTime` représentant le même instant dans un autre fuseau horaire. Les propriétés calendaires et horaires locales s’adaptent au fuseau cible, tandis que l’horodatage sous-jacent reste identique.

**Paramètres**

```params
- name: zone
  type: Zone
  required: true
  description: Nom de fuseau horaire IANA comme `'Europe/Berlin'`, décalage UTC fixe ou `'UTC'`.
```

**Valeur de retour**

```returns
type: DateTime
description: Nouveau `DateTime` représentant le même instant, observé dans `zone`.
```

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
const berlin = standup.in('Europe/Berlin');

berlin.hour; // 18
berlin.equals(standup); // true
```
:::

:::entry
### `at()` :kind[method]

```js signature
dt.at(time): DateTime
```

Renvoie un nouveau `DateTime` à la même date et dans le même fuseau horaire, avec l’heure du jour remplacée.

**Paramètres**

```params
- name: time
  type: TimeInput
  required: true
  description: Chaîne horaire comme `'9:30am'`, instance de `Time`, objet de champs ou `Date`.
```

**Valeur de retour**

```returns
type: DateTime
description: Nouveau `DateTime` à la même date et à l’heure `time`.
```

```js
const morning = datetime('2026-11-16T09:30', 'America/Los_Angeles');
const wrapUp = morning.at('5:00pm');

wrapUp.hour; // 17
```
:::

:::entry
### `set()` :kind[method]

```js signature
dt.set(fields): DateTime
dt.set(unit, value): DateTime
```

Renvoie un nouveau `DateTime` avec un ou plusieurs champs calendaires ou horaires remplacés dans le fuseau horaire courant. Les dates hors plage comme le 30 février lèvent une `RangeError` au lieu de basculer sur le mois suivant. Modifier `month` ou `year` sans préciser `day` ramène un jour qui déborde au dernier jour du mois cible.

**Paramètres**

```params
- name: fields
  type: DateTimeFields | Unit
  required: true
  description: Objet de champs calendaires ou horaires, ou nom d’unité en anglais accompagné de `value`.
- name: value
  type: number
  description: Valeur entière pour l’unité `unit` indiquée.
```

**Valeur de retour**

```returns
type: DateTime
description: Nouveau `DateTime` dans le même fuseau horaire avec les champs mis à jour.
```

```js
const cutoff = datetime('2026-11-16T09:30', 'America/New_York');

cutoff.set('hour', 17);
cutoff.set({ month: 12, day: 1, hour: 0, minute: 0 });
```
:::

## Arithmétique et arrondis

Ajouter des jours, des semaines, des mois ou des années conserve la même heure du jour lors des changements d’heure. Ajouter des heures, des minutes ou des secondes mesure le temps exact écoulé.

:::entry
### `plus()` :kind[method]

```js signature
dt.plus(amount, unit?): DateTime
dt.add(amount, unit?): DateTime
```

Avance d’une durée et renvoie un nouveau `DateTime` dans le même fuseau horaire. Également accessible sous l’alias `add()`.

**Paramètres**

```params
- name: amount
  type: DurationInput
  required: true
  description: Quantité numérique associée à `unit`, instance de `Duration`, chaîne de durée (expression en anglais, format compact ou ISO), objet de champs ou millisecondes.
- name: unit
  type: Unit
  description: Nom d’unité en anglais lorsque `amount` est un nombre, comme `'days'` ou `'hours'`.
```

**Valeur de retour**

```returns
type: DateTime
description: Nouveau `DateTime` dans le même fuseau horaire.
```

```js
// Week-end du passage à l’heure d’été à New York (le 8 mars compte 23 heures)
const sat = datetime('2026-03-07T09:00', 'America/New_York');

sat.plus(1, 'day').hour; // 9
sat.plus(24, 'hours').hour; // 10
sat.plus('1h 30m').format('time', 'en-US'); // '10:30 AM'
```
:::

:::entry
### `minus()` :kind[method]

```js signature
dt.minus(amount, unit?): DateTime
dt.subtract(amount, unit?): DateTime
```

Recule d’une durée dans le même fuseau horaire. Accepte les mêmes entrées que [`plus()`](#plus) et dispose aussi de l’alias `subtract()`.

**Paramètres**

```params
- name: amount
  type: DurationInput
  required: true
  description: Quantité numérique associée à `unit`, instance de `Duration`, expression de durée en anglais, durée ISO ou objet de champs.
- name: unit
  type: Unit
  description: Nom d’unité en anglais lorsque `amount` est un nombre.
```

**Valeur de retour**

```returns
type: DateTime
description: Nouveau `DateTime` dans le même fuseau horaire.
```

```js
const deadline = datetime('2026-11-16T17:00', 'America/New_York');

deadline.minus(48, 'hours');
deadline.minus({ weeks: 1, days: 2 });
```
:::

:::entry
### `startOf()` :kind[method]

```js signature
dt.startOf(unit, firstDay?): DateTime
```

Revient au début d’une unité calendaire ou horaire dans ce fuseau horaire. Les limites de semaine commencent le jour `firstDay`, selon `weekStart` configuré via [`configure()`](/api/configure/) ou selon la locale active de cet instant.

**Paramètres**

```params
- name: unit
  type: Unit
  required: true
  description: Unité calendaire ou horaire en anglais, de `'year'` à `'millisecond'`.
- name: firstDay
  type: DayOfWeek
  description: Premier jour de la semaine lors d’un alignement sur la semaine, en anglais comme `'sunday'` ou sous forme de numéro ISO comme `7`.
```

**Valeur de retour**

```returns
type: DateTime
description: Nouveau `DateTime` au début de l’unité `unit`.
```

```js
const wed = datetime('2026-11-18T14:45:12', 'America/New_York').locale('en-US');

wed.startOf('day').format('time'); // '12:00 AM'
wed.startOf('week').day; // 15
wed.startOf('week', 'monday').day; // 16
```
:::

:::entry
### `endOf()` :kind[method]

```js signature
dt.endOf(unit, firstDay?): DateTime
```

Se place à la dernière milliseconde d’une unité calendaire ou horaire dans ce fuseau horaire.

**Paramètres**

```params
- name: unit
  type: Unit
  required: true
  description: Unité calendaire ou horaire en anglais, de `'year'` à `'nanosecond'`.
- name: firstDay
  type: DayOfWeek
  description: Premier jour de la semaine lorsque `unit` vaut `'week'`.
```

**Valeur de retour**

```returns
type: DateTime
description: Nouveau `DateTime` à la dernière milliseconde de l’unité `unit`.
```

```js
const nov = datetime('2026-11-18T14:45', 'UTC');

nov.endOf('month').toString(); // '2026-11-30T23:59:59.999Z'
```
:::

:::entry
### `startOfNext()` :kind[method]

```js signature
dt.startOfNext(unit, firstDay?): DateTime
```

Avance au début de l’unité calendaire ou horaire suivant celle qui contient cet instant, dans ce fuseau horaire. Le résultat est toujours un instant ultérieur : à partir de minuit, le jour suivant commence au minuit suivant.

Passez un nom de jour de la semaine en anglais à la place d’une unité pour obtenir le début du prochain jour portant ce nom. Appeler [`next()`](#next) trouve le même jour tout en conservant l’heure du jour.

**Paramètres**

```params
- name: unit
  type: Unit | Exclude<DayOfWeek, number>
  required: true
  description: Unité calendaire ou horaire en anglais de `'year'` à `'nanosecond'`, ou nom de jour en anglais comme `'wednesday'`.
- name: firstDay
  type: DayOfWeek
  description: Premier jour de la semaine lorsque `unit` vaut `'week'`.
```

**Valeur de retour**

```returns
type: DateTime
description: Nouveau `DateTime` au début de l’unité `unit` suivante, ou du prochain jour de la semaine indiqué.
```

```js
const standup = datetime('2026-11-16T09:30', 'America/New_York');

standup.startOfNext('month').text; // 'Dec 1, 2026, 12:00 AM EST'
standup.startOfNext('hour').text; // 'Nov 16, 2026, 10:00 AM EST'
standup.startOfNext('wednesday').text; // 'Nov 18, 2026, 12:00 AM EST'
standup.next('wednesday').text; // 'Nov 18, 2026, 9:30 AM EST'
```
:::

:::entry
### `startOfPrevious()` :kind[method]

```js signature
dt.startOfPrevious(unit, firstDay?): DateTime
```

Recule au début de l’unité calendaire ou horaire précédant celle qui contient cet instant, dans ce fuseau horaire. Un nom de jour de la semaine en anglais à la place d’une unité donne le début du jour précédent portant ce nom, tandis que [`previous()`](#previous) conserve l’heure du jour.

**Paramètres**

```params
- name: unit
  type: Unit | Exclude<DayOfWeek, number>
  required: true
  description: Unité calendaire ou horaire en anglais de `'year'` à `'nanosecond'`, ou nom de jour en anglais comme `'wednesday'`.
- name: firstDay
  type: DayOfWeek
  description: Premier jour de la semaine lorsque `unit` vaut `'week'`.
```

**Valeur de retour**

```returns
type: DateTime
description: Nouveau `DateTime` au début de l’unité `unit` précédente, ou du précédent jour de la semaine indiqué.
```

```js
const standup = datetime('2026-11-16T09:30', 'America/New_York');

standup.startOfPrevious('day').text; // 'Nov 15, 2026, 12:00 AM EST'
standup.startOfPrevious('month').text; // 'Oct 1, 2026, 12:00 AM EDT'
standup.startOfPrevious('wednesday').text; // 'Nov 11, 2026, 12:00 AM EST'
```
:::

:::entry
### `next()` :kind[method]

```js signature
dt.next(target): DateTime
```

Avance jusqu’au prochain jour de la semaine ou [`MonthDay`](/api/month-day/) indiqué, à la même heure du jour. Si l’instant tombe déjà ce jour de la semaine ou à cette date annuelle, il avance jusqu’à l’occurrence suivante.

**Paramètres**

```params
- name: target
  type: DayOfWeek | MonthDay
  required: true
  description: Nom de jour de la semaine en anglais comme `'friday'`, numéro ISO de 1 à 7 ou `MonthDay` récurrent.
```

**Valeur de retour**

```returns
type: DateTime
description: Nouveau `DateTime` à la prochaine date correspondante, à la même heure locale.
```

```js
import { datetime, monthDay } from 'native-dates';

const mon = datetime('2026-11-16T09:30', 'America/Los_Angeles');

mon.next('friday').day; // 20
mon.next('monday').day; // 23
mon.next(monthDay('12-25')).month; // 12
```
:::

:::entry
### `previous()` :kind[method]

```js signature
dt.previous(target): DateTime
```

Recule jusqu’au dernier jour de la semaine ou [`MonthDay`](/api/month-day/) indiqué avant cette date, en conservant la même heure du jour.

**Paramètres**

```params
- name: target
  type: DayOfWeek | MonthDay
  required: true
  description: Nom de jour de la semaine en anglais, préfixe de trois lettres en anglais, numéro ISO de 1 à 7 ou `MonthDay` récurrent.
```

**Valeur de retour**

```returns
type: DateTime
description: Nouveau `DateTime` à la date correspondante précédente, à la même heure locale.
```

```js
const mon = datetime('2026-11-16T09:30', 'America/Los_Angeles');

mon.previous('friday').day; // 13
mon.previous(monthDay('10-31')).month; // 10
```
:::

:::entry
### `round()` :kind[method]

```js signature
dt.round(unit): DateTime
dt.round(increment, unit): DateTime
```

Arrondit à l’unité ou au pas le plus proche, en arrondissant au supérieur en cas d’égalité à mi-chemin.

**Paramètres**

```params
- name: increment
  type: number | Unit
  required: true
  description: Pas qui divise exactement l’unité immédiatement supérieure, ou unité cible `unit` pour un arrondi à `1`.
- name: unit
  type: Unit
  description: Unité en anglais à arrondir, de `'day'` à `'nanosecond'`.
```

**Valeur de retour**

```returns
type: DateTime
description: Nouveau `DateTime` arrondi dans le même fuseau horaire.
```

```js
const stamp = datetime('2026-11-16T09:23:40', 'UTC');

stamp.round('hour').toString(); // '2026-11-16T09:00:00.000Z'
stamp.round(15, 'minutes').toString(); // '2026-11-16T09:30:00.000Z'
```
:::

:::entry
### `floor()` :kind[method]

```js signature
dt.floor(unit): DateTime
dt.floor(increment, unit): DateTime
```

Arrondit à l’inférieur vers le début d’une unité ou d’un pas. Accepte les mêmes arguments que [`round()`](#round).

```js
datetime('2026-11-16T09:29:00Z').floor(15, 'minutes').toString(); // '2026-11-16T09:15:00.000Z'
```
:::

:::entry
### `ceil()` :kind[method]

```js signature
dt.ceil(unit): DateTime
dt.ceil(increment, unit): DateTime
```

Arrondit au supérieur vers l’unité ou le pas suivant. Accepte les mêmes arguments que [`round()`](#round).

```js
datetime('2026-11-16T09:01:00Z').ceil(15, 'minutes').toString(); // '2026-11-16T09:15:00.000Z'
```
:::

## Comparer des instants

Les comparaisons portent sur l’instant exact représenté par chaque valeur, même lorsque les deux valeurs utilisent des fuseaux horaires différents.

:::warning[Comparer avec ===]
En JavaScript, l’opérateur `===` vérifie si deux variables pointent vers le même objet en mémoire. Appelez [`equals()`](#equals) pour vérifier si deux instances de `DateTime` représentent le même instant.
:::

:::entry
### `equals()` :kind[method]

```js signature
dt.equals(other): boolean
```

Renvoie `true` lorsque les deux valeurs représentent exactement le même instant, quel que soit leur fuseau horaire.

**Paramètres**

```params
- name: other
  type: DateTimeInput
  required: true
  description: Autre `DateTime` ou toute entrée acceptée par `datetime()`.
```

**Valeur de retour**

```returns
type: boolean
description: '`true` si les deux valeurs désignent le même instant.'
```

```js
const ny = datetime('2026-11-16T12:00', 'America/New_York');
const utc = datetime('2026-11-16T17:00Z', 'UTC');

ny.equals(utc); // true
```
:::

:::entry
### `isBefore()` :kind[method]

```js signature
dt.isBefore(other): boolean
```

Renvoie `true` si cet instant est antérieur à l’autre.

```js
datetime('2026-11-16T16:59Z').isBefore('2026-11-16T17:00Z'); // true
```
:::

:::entry
### `isAfter()` :kind[method]

```js signature
dt.isAfter(other): boolean
```

Renvoie `true` si cet instant est postérieur à l’autre.

```js
datetime('2026-11-16T17:01Z').isAfter('2026-11-16T17:00Z'); // true
```
:::

:::entry
### `isSame()` :kind[method]

```js signature
dt.isSame(other, unit?, firstDay?): boolean
```

Vérifie si un autre instant tombe dans la même unité calendaire ou horaire lorsque les deux sont observés dans le fuseau horaire de cette instance. Appeler `isSame()` sans unité vérifie l’égalité exacte des instants.

**Paramètres**

```params
- name: other
  type: DateTimeInput
  required: true
  description: Instant auquel comparer, observé dans le fuseau horaire de cette instance.
- name: unit
  type: Unit
  description: Unité calendaire ou horaire en anglais à comparer, comme `'day'` ou `'month'`.
- name: firstDay
  type: DayOfWeek
  description: Premier jour de la semaine lorsque `unit` vaut `'week'`.
```

**Valeur de retour**

```returns
type: boolean
description: '`true` lorsque les deux instants tombent dans la même unité `unit` dans ce fuseau horaire.'
```

```js
const la = datetime('2026-11-16T09:30', 'America/Los_Angeles');
const lateUtc = datetime('2026-11-17T02:00Z', 'UTC');

la.isSame(lateUtc, 'day'); // true (18 h 00 le 16 nov. à Los Angeles)
lateUtc.isSame(la, 'day'); // false (17 nov. contre 16 nov. en UTC)
```
:::

### Prédicats calendaires

Vérifications sans argument évaluées dans le fuseau horaire de l’instance :

| Méthode | Type | Description |
|---|---|---|
| `isPast()`, `isFuture()` | `boolean` | Indique si cet instant est antérieur ou postérieur à l’instant courant. |
| `isToday()`, `isTomorrow()`, `isYesterday()` | `boolean` | Indique si la date calendaire locale correspond à aujourd’hui, demain ou hier dans ce fuseau horaire. |
| `isWeekday()`, `isWeekend()` | `boolean` | Jour ouvré ou jour de week-end selon la locale active, comme samedi et dimanche en `en-US` ou vendredi et samedi en `ar-SA`. |
| `isLeapYear()` | `boolean` | Indique si l’année locale est bissextile. |

## Mesurer le temps

:::entry
### `until()` :kind[method]

```js signature
dt.until(other): Duration
dt.until(other, unit): number
```

Mesure le temps qui sépare cet instant d’un autre, en renvoyant une durée négative lorsque la cible est antérieure. Passez un nom d’unité en anglais pour obtenir la durée totale sous forme de nombre plutôt qu’une [`Duration`](/api/duration/).

**Paramètres**

```params
- name: other
  type: DateTimeInput
  required: true
  description: Instant cible jusqu’auquel mesurer.
- name: unit
  type: Unit
  description: Unité en anglais dans laquelle obtenir la durée totale sous forme de nombre à virgule flottante.
```

**Valeur de retour**

```returns
type: Duration | number
description: Instance de `Duration` exprimée en jours et unités horaires, ou nombre lorsque `unit` est fourni.
```

```js
const doors = datetime('2026-11-16T08:00', 'America/Los_Angeles');
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

doors.until(standup).format('long', 'en-US'); // '1 hour, 30 minutes'
doors.until(standup, 'hours'); // 1.5
```
:::

:::entry
### `since()` :kind[method]

```js signature
dt.since(other): Duration
dt.since(other, unit): number
```

Mesure le temps écoulé depuis un instant antérieur. Passez un nom d’unité en anglais pour obtenir la durée totale sous forme de nombre.

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.since('2026-11-16T08:00', 'minutes'); // 90
```
:::

:::entry
### `to()` :kind[method]

```js signature
dt.to(end): DateTimeRange
dt.to(count, unit): DateTimeRange
dt.for(length): DateTimeRange
dt.for(count, unit): DateTimeRange
```

Crée une [`DateTimeRange`](/api/ranges/#datetimerange) semi-ouverte qui commence à cet instant et s’étend jusqu’à l’instant final ou jusqu’au terme de la durée indiquée (borne supérieure exclue). Lève une `RangeError` si la fin précède le début. Utilisez `for()` pour passer explicitement une durée (les bornes de fin et les nombres sans unité sont refusés).

**Paramètres**

```params
- name: end
  type: DateTimeInput | DurationInput | number
  required: true
  description: Instant final, durée ou quantité numérique `count` associée à `unit`.
- name: unit
  type: Unit
  description: Nom d’unité en anglais lorsque le premier argument est une quantité numérique, comme `'hours'` ou `'days'`.
```

**Valeur de retour**

```returns
type: DateTimeRange
description: Plage `DateTimeRange` semi-ouverte dans le fuseau horaire de cette instance.
```

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.to('2026-11-16T10:00').duration.minutes; // 30
standup.for(2, 'hours').end.hour; // 11
```
:::

:::entry
### `range()` :kind[method]

```js signature
dt.range(unit, firstDay?): DateTimeRange
```

Renvoie la [`DateTimeRange`](/api/ranges/#datetimerange) semi-ouverte correspondant à l’unité calendaire ou horaire contenant cet instant, de son début jusqu’au début de l’unité suivante (borne supérieure exclue).

**Paramètres**

```params
- name: unit
  type: Unit
  required: true
  description: Unité calendaire ou horaire en anglais, de `'year'` à `'nanosecond'`.
- name: firstDay
  type: DayOfWeek
  description: Premier jour de la semaine lorsque `unit` vaut `'week'`.
```

**Valeur de retour**

```returns
type: DateTimeRange
description: Plage `DateTimeRange` semi-ouverte couvrant l’unité `unit` dans ce fuseau horaire.
```

```js
const event = datetime('2026-11-16T14:45', 'UTC');

event.range('day').toString();
// '2026-11-16T00:00:00.000Z/2026-11-17T00:00:00.000Z'
```
:::

## Formatage et conversion

:::entry
### `format()` :kind[method]

```js signature
dt.format(spec?, locale?): string
```

Formate la date et l’heure dans son fuseau horaire actif à l’aide de préréglages intégrés, de noms personnalisés définis dans [`configure()`](/api/configure/), d’objets d’options `Intl` ou de motifs de jetons.

Les préréglages localisés de `'LT'` à `'llll'` sont intégrés, ainsi que les `[crochets]` pour insérer des mots littéraux. Consultez [Formatage](/guides/formatting/) pour la référence complète des préréglages et des jetons.

**Paramètres**

```params
- name: spec
  type: FormatSpec
  default: "'medium'"
  description: Nom de préréglage intégré ou configuré, objet d’options `Intl` ou motif de jetons.
- name: locale
  type: string
  description: Étiquette de locale BCP 47 remplaçant la locale de cet instant ou la locale configurée pour cet appel.
```

**Valeur de retour**

```returns
type: string
description: Chaîne formatée dans le fuseau horaire de l’instance.
```

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.format('medium', 'en-US'); // 'Nov 16, 2026, 9:30 AM'
standup.format('full', 'en-US'); // 'Monday, November 16, 2026 at 9:30 AM'
standup.format('LLL', 'en-US'); // 'November 16, 2026 at 9:30 AM'
standup.format('text', 'en-US'); // 'Nov 16, 2026, 9:30 AM PST'
standup.format('YYYY-MM-DD HH:mm'); // '2026-11-16 09:30'
standup.format('MMM D [at] h:mm a', 'en-US'); // 'Nov 16 at 9:30 am'
standup.format(
  { weekday: 'short', hour: '2-digit', minute: '2-digit' },
  'de-DE',
); // 'Mo., 09:30'
```
:::

:::entry
### `from()` :kind[method]

```js signature
dt.from(other?, locale?): string
dt.formatRelative(other?, locale?): string
```

Formate le temps écoulé entre un autre instant et celui-ci sous forme d’expression localisée via `Intl.RelativeTimeFormat`, comme « il y a 3 heures » ou « dans 2 jours ».

Sans premier argument, la comparaison s’effectue par rapport à l’instant courant ; [`formatRelative()`](#formatrelative) sert d’alias. Zéro seconde affiche « maintenant », tandis que les jours, les mois et les années utilisent des valeurs numériques plutôt que des mots calendaires comme « hier ».

**Paramètres**

```params
- name: other
  type: DateTimeInput
  description: Instant de référence à partir duquel mesurer, interprété dans le fuseau horaire de cette instance s’il n’a pas de fuseau. Instant courant par défaut.
- name: locale
  type: Locale
  description: Étiquette de locale BCP 47 remplaçant la locale de cet instant ou la locale configurée pour cet appel.
```

**Valeur de retour**

```returns
type: string
description: Expression relative localisée.
```

```js
const anchor = datetime('2026-11-16T12:00', 'UTC');

anchor.from(anchor, 'en-US'); // 'now'
anchor.minus(3, 'hours').from(anchor, 'en-US'); // '3 hours ago'
anchor.minus(23, 'hours').from(anchor, 'en-US'); // '1 day ago'
anchor.plus(45, 'minutes').from(anchor, 'en-US'); // 'in 1 hour'
anchor.minus(3, 'hours').from(anchor, 'es'); // 'hace 3 horas'
```
:::

:::entry
### `fromNow()` :kind[method]

```js signature
dt.fromNow(locale?): string
```

Formate l’écart entre cet instant et maintenant sous forme d’expression localisée, ce qui équivaut à appeler [`from()`](#from) sans instant de référence.

**Paramètres**

```params
- name: locale
  type: Locale
  description: Étiquette de locale BCP 47 remplaçant la locale de cet instant ou la locale configurée pour cet appel.
```

**Valeur de retour**

```returns
type: string
description: Expression relative localisée mesurée depuis l’instant courant.
```

```js
now().minus(5, 'minutes').fromNow('en-US'); // '5 minutes ago'
now().plus(2, 'hours').fromNow('en-US'); // 'in 2 hours'
```
:::

:::entry
### `formatRelative()` :kind[method]

```js signature
dt.formatRelative(other?, locale?): string
```

Alias de [`from()`](#from) qui formate le temps écoulé depuis `other`, ou depuis l’instant courant si `other` est omis, sous forme d’expression localisée.
:::

:::entry
### `locale()` :kind[method]

```js signature
dt.locale(): Locale | undefined
dt.locale(tag): DateTime
```

Lit la locale portée par cet instant, ou renvoie une copie qui utilise une autre locale pour le formatage, les préréglages, les limites de semaine et les valeurs dérivées. Les étiquettes avec tiret bas et les en-têtes `Accept-Language` sont normalisés automatiquement, une étiquette vide efface la locale, et [`lang()`](#lang) sert d’alias.

**Paramètres**

```params
- name: tag
  type: Locale | null | undefined
  description: Étiquette de locale, tableau d’étiquettes ou en-tête `Accept-Language` à conserver, ou `null` pour l’effacer.
```

**Valeur de retour**

```returns
type: DateTime | Locale | undefined
description: Étiquette active en l’absence d’argument, ou nouveau `DateTime` portant `tag`.
```

```js
const standup = datetime('2026-11-16T09:30', 'Europe/Berlin').locale('es-ES');

standup.locale(); // 'es-ES'
standup.plus(1, 'week').date.format('long'); // '23 de noviembre de 2026'
standup.locale(null).locale(); // undefined
```
:::

:::entry
### `lang()` :kind[method]

```js signature
dt.lang(): Locale | undefined
dt.lang(tag): DateTime
```

Alias court de [`locale()`](#locale) pour lire ou associer une étiquette de locale BCP 47 à cet instant.
:::

:::entry
### `as()` :kind[method]

```js signature
dt.as('datetime'): DateTime
dt.as('date'): CalendarDate
dt.as('time'): Time
dt.as('yearMonth'): YearMonth
dt.as('monthDay'): MonthDay
```

Convertit cet instant vers un autre type au fil d’une chaîne d’appels sans passer par une propriété, y compris vers [`YearMonth`](/api/year-month/) et [`MonthDay`](/api/month-day/) dans son fuseau horaire actif.

**Paramètres**

```params
- name: kind
  type: "'datetime' | 'date' | 'time' | 'yearMonth' | 'monthDay'"
  required: true
  description: Type cible sous lequel lire cet instant dans son fuseau horaire actif.
```

**Valeur de retour**

```returns
type: DateTime | CalendarDate | Time | YearMonth | MonthDay
description: Valeur convertie dans le fuseau horaire de cette instance.
```

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.in('Asia/Tokyo').as('date').toString(); // '2026-11-17'
standup.in('Asia/Tokyo').as('time').toString(); // '02:30:00'
standup.as('yearMonth').toString(); // '2026-11'
standup.as('monthDay').toString(); // '11-16'
```
:::

:::entry
### `toString()` :kind[method]

```js signature
dt.toString(): string
dt.toJSON(): string
```

Renvoie l’instant sous forme de chaîne ISO 8601 en UTC, adaptée aux bases de données, aux URL et aux échanges réseau. `toJSON()` renvoie la même chaîne pour `JSON.stringify()`.

**Valeur de retour**

```returns
type: string
description: Horodatage ISO 8601 en UTC, comme `'2026-11-16T17:30:00.000Z'`.
```

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.toString(); // '2026-11-16T17:30:00.000Z'
JSON.stringify({ standup }); // '{"standup":"2026-11-16T17:30:00.000Z"}'
```
:::

:::entry
### `toJSDate()` :kind[method]

```js signature
dt.toJSDate(): Date
```

Renvoie un objet JavaScript `Date` natif correspondant au même instant.
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
dt.toTemporal(): Temporal.ZonedDateTime
```

Renvoie l’instance `Temporal.ZonedDateTime` sous-jacente.
:::

:::entry
### `valueOf()` :kind[method]

```js signature
dt.valueOf(): number
```

Renvoie le nombre de millisecondes depuis l’époque Unix afin que deux valeurs `DateTime` puissent être soustraites ou comparées avec des opérateurs numériques.
:::
