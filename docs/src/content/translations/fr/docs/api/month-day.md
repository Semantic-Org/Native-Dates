---
source: 436c0292465a
title: MonthDay
lede: Un mois et un jour calendaires sans année, pour les anniversaires et les jours fériés annuels.
---

## Créer un MonthDay

Créez une instance mois en premier avec [`monthDay()`](/api/month-day-fn/) ou jour en premier avec [`dayMonth()`](/api/month-day-fn/#daymonth). Les instances sont immuables : chaque méthode renvoie une nouvelle valeur.

```js title="create.js"
import { dayMonth, monthDay } from 'native-dates';

const birthday = monthDay(10, 17);
const fromIso = monthDay('10-17');
const european = dayMonth('17/10');
```

Extrayez le mois et le jour de n’importe quelle [date calendaire](/api/calendar-date/) ou de n’importe quel [instant](/api/date-time/) grâce à sa propriété `monthDay`, ou convertissez au fil d’une chaîne d’appels avec `as('monthDay')` :

```js
import { date, datetime, today } from 'native-dates';

date('1990-10-17').monthDay.toString(); // '10-17'
datetime('2026-10-18T02:00:00Z', 'America/Los_Angeles').as('monthDay').toString(); // '10-17'
const currentMonthDay = today().monthDay;
```

## Propriétés

Les propriétés lisent le mois et le jour du mois, tous deux numérotés à partir de 1.

| Propriété | Type | Description |
|---|---|---|
| `text` | `string` | Mois et jour formatés selon la locale, comme `'Oct 17'`. |
| `month`, `day` | `number` | Mois calendaire de 1 à 12 et jour du mois de 1 à 31. |

## Placer dans une année et naviguer vers l’avant ou l’arrière

Associez un mois et un jour récurrents à une année pour obtenir une date concrète, ou avancez et reculez vers les occurrences voisines.

:::entry
### `in()` :kind[method]

```js signature
md.in(year): CalendarDate
```

Place ce mois et ce jour dans une année calendaire et renvoie une [`CalendarDate`](/api/calendar-date/). Le 29 février tombe le 28 février lors des années communes dépourvues de jour bissextile.

**Paramètres**

```params
- name: year
  type: number | string
  required: true
  description: Année calendaire entière, comme `2027`.
```

**Valeur de retour**

```returns
type: CalendarDate
description: Instance de `CalendarDate` correspondant à ce mois-jour dans `year`.
```

```js
const birthday = monthDay(10, 17);
const leapDay = monthDay(2, 29);

birthday.in(2027).toString(); // '2027-10-17'
leapDay.in(2027).toString(); // '2027-02-28'
leapDay.in(2028).toString(); // '2028-02-29'
```
:::

:::entry
### `next()` :kind[method]

```js signature
md.next(day?): CalendarDate
```

Renvoie la prochaine occurrence après une date de référence, qui vaut [`today()`](/api/date-fn/#today) par défaut. Lorsque la date de référence tombe déjà sur ce mois et ce jour, la méthode passe à l’année suivante.

Les dates calendaires et les instants acceptent aussi un mois-jour directement dans [`d.next(md)`](/api/calendar-date/#next) et [`dt.next(md)`](/api/date-time/#next).

**Paramètres**

```params
- name: day
  type: CalendarDateInput
  default: today()
  description: Date de départ à partir de laquelle compter vers l’avant.
```

**Valeur de retour**

```returns
type: CalendarDate
description: Prochaine `CalendarDate` après `day`.
```

```js
import { date, monthDay } from 'native-dates';

const birthday = monthDay(10, 17);

birthday.next('2026-05-01').toString(); // '2026-10-17'
birthday.next('2026-10-17').toString(); // '2027-10-17'
date('2026-11-16').next(birthday).toString(); // '2027-10-17'
```
:::

:::entry
### `previous()` :kind[method]

```js signature
md.previous(day?): CalendarDate
md.last(day?): CalendarDate
```

Renvoie l’occurrence la plus récente avant une date de référence, qui vaut [`today()`](/api/date-fn/#today) par défaut. Les dates calendaires et les instants acceptent aussi un mois-jour directement dans `previous()`. `last()` sert d’alias.

**Paramètres**

```params
- name: day
  type: CalendarDateInput
  default: today()
  description: Date de référence à partir de laquelle compter vers l’arrière.
```

**Valeur de retour**

```returns
type: CalendarDate
description: "`CalendarDate` la plus récente avant `day`."
```

```js
import { date, monthDay } from 'native-dates';

const birthday = monthDay(10, 17);

birthday.previous('2026-10-17').toString(); // '2025-10-17'
date('2026-11-16').previous(birthday).toString(); // '2026-10-17'
```
:::

:::entry
### `after()` :kind[method]

```js signature
md.after(day): CalendarDate
```

Renvoie la prochaine occurrence après une date de référence obligatoire. Se comporte comme [`next()`](#next), sans utiliser la date du jour par défaut.

**Paramètres**

```params
- name: day
  type: CalendarDateInput
  required: true
  description: Date de référence au-delà de laquelle avancer.
```

**Valeur de retour**

```returns
type: CalendarDate
description: Première occurrence de `CalendarDate` après `day`.
```

```js
monthDay(2, 29).after('2026-03-01').toString(); // '2027-02-28'
```
:::

:::entry
### `before()` :kind[method]

```js signature
md.before(day): CalendarDate
```

Renvoie l’occurrence la plus récente avant une date de référence obligatoire. Se comporte comme [`previous()`](#previous), sans utiliser la date du jour par défaut.

```js
monthDay(10, 17).before('2026-10-01').toString(); // '2025-10-17'
```
:::

## Correspondance et égalité

Comme un mois-jour se répète chaque année au lieu de désigner une date unique, les méthodes d’ordre comme `isBefore()` ne s’y appliquent pas.

:::tip[Choisir entre equals et fallsOn]
Utilisez [`fallsOn()`](#fallson) pour vérifier si une date calendaire correspond à l’occurrence de cette année-là, puisque le 29 février tombe le 28 février les années communes. Réservez [`equals()`](#equals) pour vérifier si deux valeurs portent exactement les mêmes numéros de mois et de jour.
:::

:::entry
### `fallsOn()` :kind[method]

```js signature
md.fallsOn(day): boolean
md.isOn(day): boolean
```

Renvoie `true` lorsque la date indiquée correspond à l’occurrence de ce mois-jour dans l’année de cette date. Lors d’une année commune, le 29 février tombe le 28 février, tandis que lors d’une année bissextile il ne tombe que le 29 février. `isOn()` sert d’alias.

**Paramètres**

```params
- name: day
  type: CalendarDateInput
  required: true
  description: Chaîne de date, `CalendarDate`, `DateTime`, objet de champs ou `Date`.
```

**Valeur de retour**

```returns
type: boolean
description: "`true` si `day` correspond à la date de ce mois-jour pour cette année-là."
```

```js
const leapDay = monthDay(2, 29);

leapDay.fallsOn('2027-02-28'); // true
leapDay.fallsOn('2028-02-28'); // false
leapDay.fallsOn('2028-02-29'); // true
```
:::

:::entry
### `equals()` :kind[method]

```js signature
md.equals(other): boolean
```

Renvoie `true` lorsque les deux valeurs portent exactement les mêmes numéros de mois et de jour, en extrayant le mois et le jour si vous passez une date complète ou un horodatage.

Les chaînes ambiguës avec barre oblique ou point, comme `'05/10'`, lèvent une `RangeError`. Analysez-les d’abord avec les [fonctions fabriques mois en premier ou jour en premier](/api/month-day-fn/) avant de comparer.

**Paramètres**

```params
- name: other
  type: MonthDayInput
  required: true
  description: Autre `MonthDay`, chaîne ISO `'10-17'`, objet de champs ou valeur de date.
```

**Valeur de retour**

```returns
type: boolean
description: "`true` si les deux valeurs ont le même mois et le même jour."
```

```js
const birthday = monthDay(10, 17);

birthday.equals('10-17'); // true
birthday.equals('1990-10-17'); // true
monthDay(2, 29).equals('2027-02-28'); // false
```
:::

:::entry
### `isToday()` :kind[method]

```js signature
md.isToday(zone?): boolean
```

Renvoie `true` lorsque ce mois-jour tombe à la date d’aujourd’hui dans le fuseau horaire indiqué ou configuré.

```js
import { today } from 'native-dates';

today('UTC').monthDay.isToday('UTC'); // true
```
:::

:::entry
### `isTomorrow()` :kind[method]

```js signature
md.isTomorrow(zone?): boolean
```

Renvoie `true` lorsque ce mois-jour tombe à la date de demain dans le fuseau horaire indiqué ou configuré.

```js
import { tomorrow } from 'native-dates';

tomorrow('UTC').monthDay.isTomorrow('UTC'); // true
```
:::

:::entry
### `isYesterday()` :kind[method]

```js signature
md.isYesterday(zone?): boolean
```

Renvoie `true` lorsque ce mois-jour tombe à la date d’hier dans le fuseau horaire indiqué ou configuré.

```js
import { yesterday } from 'native-dates';

yesterday('UTC').monthDay.isYesterday('UTC'); // true
```
:::

## Formatage et conversion

:::entry
### `format()` :kind[method]

```js signature
md.format(spec?, locale?): string
```

Formate le mois et le jour dans l’ordre propre à la locale, ou selon un motif de jetons intégré comme `'MMM Do'`. Les objets d’options partagés ignorent automatiquement les clés d’année, d’horloge et de fuseau horaire.

Les formats personnalisés enregistrés dans [`configure()`](/api/configure/) fonctionnent aussi ici, et les locales non grégoriennes formatent les noms de mois grégoriens afin que les dates annuelles restent stables. Consultez [Formatage](/guides/formatting/) pour toutes les options de préréglages et de jetons.

**Paramètres**

```params
- name: spec
  type: FormatSpec
  default: "'medium'"
  description: Nom de préréglage comme `'short'` ou `'long'`, objet d’options `Intl` ou motif de jetons.
- name: locale
  type: Locale
  description: Étiquette de locale BCP 47 remplaçant la locale de cette valeur ou la locale configurée pour cet appel.
```

**Valeur de retour**

```returns
type: string
description: Mois et jour formatés sous forme de chaîne.
```

```js
const oct17 = monthDay(10, 17);

oct17.format('short', 'en-US'); // '10/17'
oct17.format('short', 'en-GB'); // '17/10'
oct17.format('medium', 'en-US'); // 'Oct 17'
oct17.format('long', 'en-US'); // 'October 17'
oct17.format('MMM Do', 'en-US'); // 'Oct 17th'
```
:::

:::entry
### `locale()` :kind[method]

```js signature
md.locale(): Locale | undefined
md.locale(tag): MonthDay
```

Lit la locale portée par ce mois-jour, ou renvoie une copie formatée dans une autre locale pour les aperçus textuels, les préréglages et toutes les dates qui en dérivent. Passer une étiquette vide efface la locale portée, et [`lang()`](#lang) sert d’alias.

**Paramètres**

```params
- name: tag
  type: Locale | null | undefined
  description: Étiquette de locale BCP 47 à conserver, ou `null` pour effacer une étiquette existante.
```

**Valeur de retour**

```returns
type: MonthDay | Locale | undefined
description: Étiquette active en l’absence d’argument, ou nouveau `MonthDay` portant `tag`.
```

```js
const labourDay = monthDay(5, 1).locale('ru');

labourDay.locale(); // 'ru'
labourDay.format('long'); // '1 мая'
labourDay.in(2026).format('long'); // '1 мая 2026 г.'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
md.lang(): Locale | undefined
md.lang(tag): MonthDay
```

Alias court de [`locale()`](#locale) pour lire ou associer une étiquette de locale BCP 47 à ce mois-jour.
:::

:::entry
### `as()` :kind[method]

```js signature
md.as('monthDay'): MonthDay
```

Renvoie cette instance lorsque `'monthDay'` est demandé dans une chaîne de conversion générique, et lève une `RangeError` pour les autres types.
:::

:::entry
### `toString()` :kind[method]

```js signature
md.toString(): string
md.toJSON(): string
```

Renvoie la chaîne mois-jour ISO `'MM-DD'` (deux chiffres par champ), qui s’analyse à nouveau sans perte mois en premier dans les deux [fonctions fabriques mois-jour](/api/month-day-fn/). `toJSON()` renvoie la même chaîne pour la sérialisation JSON.

**Valeur de retour**

```returns
type: string
description: Chaîne mois-jour ISO, comme `'10-17'`.
```

```js
monthDay(5, 6).toString(); // '05-06'
JSON.stringify({ birthday: monthDay(10, 17) }); // '{"birthday":"10-17"}'
```
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
md.toTemporal(): Temporal.PlainMonthDay
```

Renvoie l’instance `Temporal.PlainMonthDay` sous-jacente.
:::

:::entry
### `valueOf()` :kind[method]

```js signature
md.valueOf(): never
```

Lève une `RangeError` afin que les opérateurs numériques ne convertissent jamais un mois-jour en nombre. Affinez le type d’une valeur inconnue avec [`isMonthDay()`](/api/kind-of/#ismonthday) ou [`kindOf()`](/api/kind-of/).
:::
