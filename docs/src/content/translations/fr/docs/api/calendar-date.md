---
source: df57e2243cc3
title: CalendarDate
lede: Une date calendaire sans heure du jour ni fuseau horaire.
---

## Créer un CalendarDate

Créez une instance à partir d’une chaîne ISO, de nombres année-mois-jour ou d’une valeur existante avec [`date()`](/api/date-fn/), ou lisez le jour courant avec [`today()`](/api/date-fn/#today). Les fonctions dédiées à [demain](/api/date-fn/#tomorrow) et [hier](/api/date-fn/#yesterday) fonctionnent de la même façon, et chaque méthode renvoie une nouvelle instance immuable.

```js title="create.js"
import { date, today, tomorrow } from 'native-dates';

const birthday = date('2026-05-10');
const launch = date(2026, 11, 16);
const current = today();
const nextDay = tomorrow('America/New_York');
```

Comme une date calendaire n’a ni horloge ni fuseau horaire, le 10 mai reste le 10 mai pour tous les utilisateurs, où qu’ils se trouvent. Vous pouvez aussi lire directement la date calendaire locale depuis n’importe quel [`DateTime`](/api/date-time/) :

```js
import { datetime } from 'native-dates';

const flight = datetime('2026-11-16T23:30:00Z', 'Asia/Tokyo');
flight.date.toString(); // '2026-11-17'
```

## Propriétés

Les propriétés lisent directement les champs du calendrier ISO.

| Propriété | Type | Description |
|---|---|---|
| `text` | `string` | Date calendaire formatée selon la locale, comme `'Nov 16, 2026'`. |
| `year`, `month`, `day` | `number` | Année calendaire, mois (1–12) et jour du mois (1–31). |
| `yearMonth` | [`YearMonth`](/api/year-month/) | Année et mois calendaires sans le jour. |
| `monthDay` | [`MonthDay`](/api/month-day/) | Mois et jour calendaires sans l’année. |
| `dayOfWeek` | `number` | Jour ISO de la semaine, de 1 pour lundi à 7 pour dimanche. |
| `weekStart` | `number` | Premier jour de la semaine pour cette date (de 1 à 7), selon [`configure()`](/api/configure/) ou sa locale. |
| `quarter` | `number` | Trimestre calendaire (1–4). |
| `weekOfYear`, `dayOfYear` | `number` | Numéro de semaine ISO (1–53) et jour de l’année (1–366). |
| `daysInMonth`, `daysInYear` | `number` | Nombre de jours du mois en cours (28–31) et de l’année en cours (365 ou 366). |

## Combinaison et champs

Associez une heure du jour dans un fuseau horaire pour obtenir un instant précis, ou remplacez des champs calendaires précis.

:::entry
### `at()` :kind[method]

```js signature
d.at(time?, zone?): DateTime
```

Combine cette date calendaire avec une heure du jour dans un fuseau horaire et renvoie un [`DateTime`](/api/date-time/). Si l’heure est omise, la valeur par défaut est minuit au début de la journée.

**Paramètres**

```params
- name: time
  type: TimeInput
  default: "'00:00'"
  description: Chaîne horaire comme `'9:30am'`, instance de `Time`, objet de champs ou `Date`.
- name: zone
  type: Zone
  description: Nom de fuseau horaire IANA, décalage UTC fixe ou `'UTC'`. Fuseau horaire configuré par défaut.
```

**Valeur de retour**

```returns
type: DateTime
description: Nouveau `DateTime` à cette date, à l’heure `time`, dans `zone`.
```

```js
const day = date('2026-11-16');

day.at('9:30am', 'America/Los_Angeles').toString(); // '2026-11-16T17:30:00.000Z'
day.at(undefined, 'UTC').toString(); // '2026-11-16T00:00:00.000Z'
```
:::

:::entry
### `set()` :kind[method]

```js signature
d.set(fields): CalendarDate
d.set(unit, value): CalendarDate
```

Renvoie un nouveau `CalendarDate` avec un ou plusieurs champs calendaires remplacés. Les dates hors plage comme le 30 février lèvent une `RangeError` au lieu de basculer sur le mois suivant. Modifier `month` ou `year` sans préciser `day` ramène un jour qui déborde au dernier jour du mois cible.

**Paramètres**

```params
- name: fields
  type: DateTimeFields | DateUnit
  required: true
  description: Objet contenant les champs `year`, `month` ou `day`, ou nom d’unité calendaire en anglais.
- name: value
  type: number
  description: Valeur entière pour l’unité `unit` indiquée.
```

**Valeur de retour**

```returns
type: CalendarDate
description: Nouveau `CalendarDate` avec les champs calendaires mis à jour.
```

```js
const due = date('2026-11-16');

due.set('day', 1).toString(); // '2026-11-01'
due.set({ month: 12, day: 31 }).toString(); // '2026-12-31'
```
:::

## Arithmétique et limites

Avancez ou reculez par unités calendaires, alignez sur les limites d’une période ou déplacez-vous vers un jour de la semaine voisin. Les unités horaires comme les heures et les minutes lèvent une `RangeError`, car une date calendaire n’a pas d’horloge.

:::note[Ajustement en fin de mois]
Ajouter des mois ou des années ramène au dernier jour valide du mois cible au lieu de déborder sur le mois suivant. Ajouter un mois au 31 janvier donne le 28 février, ou le 29 février une année bissextile.
:::

:::entry
### `plus()` :kind[method]

```js signature
d.plus(amount, unit?): CalendarDate
d.add(amount, unit?): CalendarDate
```

Avance d’un nombre d’années, de trimestres, de mois, de semaines ou de jours et renvoie un nouveau `CalendarDate`. Également accessible sous l’alias `add()`.

**Paramètres**

```params
- name: amount
  type: DurationInput
  required: true
  description: Quantité numérique associée à `unit`, instance de `Duration`, chaîne de durée (expression en anglais, format compact ou ISO) ou objet de champs.
- name: unit
  type: DateUnit
  description: Nom d’unité calendaire en anglais lorsque `amount` est un nombre, comme `'days'` ou `'months'`.
```

**Valeur de retour**

```returns
type: CalendarDate
description: Nouveau `CalendarDate` décalé vers l’avant sur le calendrier.
```

```js
const billing = date('2026-01-31');

billing.plus(1, 'month').toString(); // '2026-02-28'
billing.plus('2 weeks').toString(); // '2026-02-14'
```
:::

:::entry
### `minus()` :kind[method]

```js signature
d.minus(amount, unit?): CalendarDate
d.subtract(amount, unit?): CalendarDate
```

Recule d’une durée calendaire. Accepte les mêmes entrées que [`plus()`](#plus) et dispose aussi de l’alias `subtract()`.

**Paramètres**

```params
- name: amount
  type: DurationInput
  required: true
  description: Quantité numérique associée à `unit`, instance de `Duration`, chaîne de durée (expression en anglais, format compact ou ISO) ou objet de champs.
- name: unit
  type: DateUnit
  description: Nom d’unité calendaire en anglais lorsque `amount` est un nombre.
```

**Valeur de retour**

```returns
type: CalendarDate
description: Nouveau `CalendarDate` décalé vers l’arrière sur le calendrier.
```

```js
const launch = date('2026-03-01');

launch.minus(1, 'day').toString(); // '2026-02-28'
launch.minus({ weeks: 2, days: 1 }).toString(); // '2026-02-14'
```
:::

:::entry
### `startOf()` :kind[method]

```js signature
d.startOf(unit, firstDay?): CalendarDate
```

Renvoie le premier jour de l’unité calendaire contenant cette date. Les limites de semaine commencent le jour `firstDay`, selon `weekStart` configuré via [`configure()`](/api/configure/) ou selon la locale active de cette date.

**Paramètres**

```params
- name: unit
  type: DateUnit
  required: true
  description: Unité calendaire en anglais, de `'year'` à `'day'`.
- name: firstDay
  type: DayOfWeek
  description: Premier jour de la semaine lors d’un alignement sur la semaine, en anglais comme `'sunday'` ou sous forme de numéro ISO comme `7`.
```

**Valeur de retour**

```returns
type: CalendarDate
description: Premier jour calendaire de l’unité `unit`.
```

```js
const wed = date('2026-11-18', { locale: 'en-US' });

wed.startOf('month').toString(); // '2026-11-01'
wed.startOf('quarter').toString(); // '2026-10-01'
wed.startOf('week').toString(); // '2026-11-15'
wed.startOf('week', 'monday').toString(); // '2026-11-16'
```
:::

:::entry
### `endOf()` :kind[method]

```js signature
d.endOf(unit, firstDay?): CalendarDate
```

Renvoie le dernier jour de l’unité calendaire contenant cette date.

**Paramètres**

```params
- name: unit
  type: DateUnit
  required: true
  description: Unité calendaire en anglais, de `'year'` à `'day'`.
- name: firstDay
  type: DayOfWeek
  description: Premier jour de la semaine lorsque `unit` vaut `'week'`.
```

**Valeur de retour**

```returns
type: CalendarDate
description: Dernier jour calendaire de l’unité `unit`.
```

```js
date('2026-02-10').endOf('month').toString(); // '2026-02-28'
date('2028-02-10').endOf('month').toString(); // '2028-02-29'
```
:::

:::entry
### `startOfNext()` :kind[method]

```js signature
d.startOfNext(unit, firstDay?): CalendarDate
```

Renvoie le premier jour de l’unité calendaire suivant celle qui contient cette date. Le résultat est toujours une date ultérieure : à partir du 1er décembre, le mois suivant commence le 1er janvier.

Passez un nom de jour de la semaine en anglais à la place d’une unité pour obtenir le prochain jour portant ce nom, soit la même date que celle renvoyée par [`next()`](#next).

**Paramètres**

```params
- name: unit
  type: DateUnit | Exclude<DayOfWeek, number>
  required: true
  description: Unité calendaire en anglais de `'year'` à `'day'`, ou nom de jour en anglais comme `'wednesday'`.
- name: firstDay
  type: DayOfWeek
  description: Premier jour de la semaine lorsque `unit` vaut `'week'`.
```

**Valeur de retour**

```returns
type: CalendarDate
description: Premier jour calendaire de l’unité `unit` suivante, ou prochain jour de la semaine indiqué.
```

```js
const mon = date('2026-11-16', { locale: 'en-US' });

mon.startOfNext('month').toString(); // '2026-12-01'
mon.startOfNext('quarter').toString(); // '2027-01-01'
mon.startOfNext('week').toString(); // '2026-11-22'
mon.startOfNext('wednesday').toString(); // '2026-11-18'
```
:::

:::entry
### `startOfPrevious()` :kind[method]

```js signature
d.startOfPrevious(unit, firstDay?): CalendarDate
```

Renvoie le premier jour de l’unité calendaire précédant celle qui contient cette date. Un nom de jour de la semaine en anglais à la place d’une unité donne le dernier jour portant ce nom, comme [`previous()`](#previous).

**Paramètres**

```params
- name: unit
  type: DateUnit | Exclude<DayOfWeek, number>
  required: true
  description: Unité calendaire en anglais de `'year'` à `'day'`, ou nom de jour en anglais comme `'wednesday'`.
- name: firstDay
  type: DayOfWeek
  description: Premier jour de la semaine lorsque `unit` vaut `'week'`.
```

**Valeur de retour**

```returns
type: CalendarDate
description: Premier jour calendaire de l’unité `unit` précédente, ou précédent jour de la semaine indiqué.
```

```js
const mon = date('2026-11-16');

mon.startOfPrevious('month').toString(); // '2026-10-01'
mon.startOfPrevious('year').toString(); // '2025-01-01'
mon.startOfPrevious('wednesday').toString(); // '2026-11-11'
```
:::

:::entry
### `next()` :kind[method]

```js signature
d.next(target): CalendarDate
```

Avance jusqu’au prochain jour de la semaine ou [`MonthDay`](/api/month-day/) indiqué après cette date. Si la date tombe déjà ce jour de la semaine ou à cette date annuelle, elle avance jusqu’à l’occurrence suivante.

**Paramètres**

```params
- name: target
  type: DayOfWeek | MonthDay
  required: true
  description: Nom de jour de la semaine en anglais comme `'friday'`, numéro ISO de 1 à 7 ou `MonthDay` récurrent.
```

**Valeur de retour**

```returns
type: CalendarDate
description: Nouveau `CalendarDate` au prochain jour correspondant.
```

```js
import { date, monthDay } from 'native-dates';

const mon = date('2026-11-16');

mon.next('friday').toString(); // '2026-11-20'
mon.next('monday').toString(); // '2026-11-23'
mon.next(monthDay('12-25')).toString(); // '2026-12-25'
```
:::

:::entry
### `previous()` :kind[method]

```js signature
d.previous(target): CalendarDate
```

Recule jusqu’au dernier jour de la semaine ou [`MonthDay`](/api/month-day/) indiqué avant cette date. Si la date tombe déjà ce jour de la semaine ou à cette date annuelle, elle recule jusqu’à l’occurrence précédente.

**Paramètres**

```params
- name: target
  type: DayOfWeek | MonthDay
  required: true
  description: Nom de jour de la semaine en anglais, préfixe de trois lettres en anglais, numéro ISO de 1 à 7 ou `MonthDay` récurrent.
```

**Valeur de retour**

```returns
type: CalendarDate
description: Nouveau `CalendarDate` au jour correspondant précédent.
```

```js
date('2026-11-16').previous('friday').toString(); // '2026-11-13'
date('2026-11-16').previous(monthDay('10-31')).toString(); // '2026-10-31'
```
:::

## Comparer des dates

Comparez des dates calendaires directement ou passez toute entrée acceptée par [`date()`](/api/date-fn/).

:::warning[Évitez les opérateurs de comparaison numériques]
Une date calendaire n’est pas un horodatage : les opérateurs numériques lèvent une `RangeError` au lieu de convertir la date en millisecondes. Comparez les dates avec des méthodes comme [`isBefore()`](#isbefore), ou triez des tableaux avec [`compare()`](/api/compare/).
:::

:::entry
### `equals()` :kind[method]

```js signature
d.equals(other): boolean
```

Renvoie `true` lorsque les deux valeurs représentent la même année, le même mois et le même jour calendaires.

**Paramètres**

```params
- name: other
  type: CalendarDateInput
  required: true
  description: Autre `CalendarDate` ou toute entrée acceptée par `date()`.
```

**Valeur de retour**

```returns
type: boolean
description: '`true` si les deux valeurs représentent le même jour calendaire.'
```

```js
const due = date('2026-11-16');

due.equals('2026-11-16'); // true
due.equals(date(2026, 11, 16)); // true
```
:::

:::entry
### `isBefore()` :kind[method]

```js signature
d.isBefore(other): boolean
```

Renvoie `true` si cette date est antérieure à l’autre sur le calendrier.

```js
date('2026-11-15').isBefore('2026-11-16'); // true
```
:::

:::entry
### `isAfter()` :kind[method]

```js signature
d.isAfter(other): boolean
```

Renvoie `true` si cette date est postérieure à l’autre sur le calendrier.

```js
date('2026-11-17').isAfter('2026-11-16'); // true
```
:::

:::entry
### `isSame()` :kind[method]

```js signature
d.isSame(other, unit?, firstDay?): boolean
```

Vérifie si une autre date tombe dans la même unité calendaire, comme le même mois ou la même semaine. Appeler `isSame()` sans unité vérifie si les deux valeurs désignent exactement le même jour.

**Paramètres**

```params
- name: other
  type: CalendarDateInput
  required: true
  description: Date à laquelle comparer.
- name: unit
  type: DateUnit
  description: Unité calendaire en anglais à comparer, de `'year'` à `'day'`.
- name: firstDay
  type: DayOfWeek
  description: Premier jour de la semaine lorsque `unit` vaut `'week'`.
```

**Valeur de retour**

```returns
type: boolean
description: '`true` lorsque les deux dates tombent dans la même unité `unit`.'
```

```js
const wed = date('2026-09-09', { locale: 'en-US' });

wed.isSame('2026-09-30', 'month'); // true
wed.isSame('2026-09-06', 'week'); // true
wed.isSame('2026-09-06', 'week', 'monday'); // false
```
:::

### Prédicats calendaires

Les vérifications de jour relatif acceptent un fuseau horaire optionnel, car le jour qui correspond à aujourd’hui dépend de l’endroit où vous vous trouvez. Lorsqu’il est omis, le fuseau horaire par défaut défini dans [`configure()`](/api/configure/) est utilisé.

| Méthode | Type | Description |
|---|---|---|
| `isToday(zone?)`, `isTomorrow(zone?)`, `isYesterday(zone?)` | `boolean` | Indique si cette date correspond à aujourd’hui, demain ou hier dans le fuseau horaire indiqué ou configuré. |
| `isPast(zone?)`, `isFuture(zone?)` | `boolean` | Indique si cette date est antérieure ou postérieure à aujourd’hui dans le fuseau horaire indiqué ou configuré. |
| `isWeekday()`, `isWeekend()` | `boolean` | Jour ouvré ou jour de week-end selon la locale active, comme samedi et dimanche en `en-US` ou vendredi et samedi en `ar-SA`. |
| `isLeapYear()` | `boolean` | Indique si l’année de cette date compte 366 jours. |

## Mesurer des écarts

:::entry
### `until()` :kind[method]

```js signature
d.until(other): Duration
d.until(other, unit): number
```

Mesure l’écart calendaire entre cette date et une autre, en renvoyant une durée négative lorsque la cible est antérieure. La [`Duration`](/api/duration/) renvoyée garde cette date de départ en mémoire afin de totaliser exactement les mois et les années.

**Paramètres**

```params
- name: other
  type: CalendarDateInput
  required: true
  description: Date cible jusqu’à laquelle mesurer.
- name: unit
  type: Unit
  description: Unité en anglais dans laquelle obtenir la durée totale sous forme de nombre à virgule flottante.
```

**Valeur de retour**

```returns
type: Duration | number
description: Instance de `Duration` exprimée en jours, ou nombre lorsque `unit` est fourni.
```

```js
const start = date('2026-01-01');

start.until('2027-04-05').toString(); // 'P459D'
start.until('2027-04-05').balance('year').toString(); // 'P1Y3M4D'
start.until('2027-04-05', 'days'); // 459
start.until('2026-07-01').total('months'); // 6
```
:::

:::entry
### `since()` :kind[method]

```js signature
d.since(other): Duration
d.since(other, unit): number
```

Mesure l’écart calendaire écoulé depuis une date antérieure. Passez un nom d’unité en anglais pour obtenir la durée totale sous forme de nombre.

```js
date('2026-11-16').since('2026-11-02', 'weeks'); // 2
```
:::

:::entry
### `to()` :kind[method]

```js signature
d.to(end): DateRange
d.to(count, unit): DateRange
d.through(end): DateRange
d.through(count, unit): DateRange
d.for(length): DateRange
d.for(count, unit): DateRange
```

Crée une [`DateRange`](/api/ranges/#daterange) inclusive commençant à cette date et courant jusqu’à la date de fin ou sur la durée indiquée. Le premier jour comme le dernier jour sont inclus. Également accessible sous l’alias `through()` ; utilisez `for()` pour passer explicitement une durée (les bornes de fin et les nombres sans unité sont refusés).

**Paramètres**

```params
- name: end
  type: CalendarDateInput | DurationInput | number
  required: true
  description: Date finale à inclure, durée calendaire ou quantité numérique `count` associée à `unit`.
- name: unit
  type: DateUnit
  description: Nom d’unité calendaire en anglais lorsque le premier argument est une quantité numérique, comme `'days'` ou `'weeks'`.
```

**Valeur de retour**

```returns
type: DateRange
description: Plage `DateRange` inclusive commençant à cette date.
```

```js
date('2026-11-01').to('2026-11-07').duration.days; // 7
date('2026-11-01').for(7, 'days').toString(); // '2026-11-01/2026-11-07'
```
:::

:::entry
### `range()` :kind[method]

```js signature
d.range(unit, firstDay?): DateRange
```

Renvoie une [`DateRange`](/api/ranges/#daterange) inclusive couvrant tous les jours de l’unité calendaire contenant cette date, de son premier à son dernier jour.

**Paramètres**

```params
- name: unit
  type: DateUnit
  required: true
  description: Unité calendaire en anglais, de `'year'` à `'day'`.
- name: firstDay
  type: DayOfWeek
  description: Premier jour de la semaine lorsque `unit` vaut `'week'`.
```

**Valeur de retour**

```returns
type: DateRange
description: Plage `DateRange` inclusive du début à la fin de l’unité `unit`.
```

```js
date('2026-02-10').range('month').toString(); // '2026-02-01/2026-02-28'
date('2026-11-18', { locale: 'en-US' }).range('week').toString(); // '2026-11-15/2026-11-21'
date('2026-11-18').range('week', 'monday').toString(); // '2026-11-16/2026-11-22'
```
:::

:::entry
### `every()` :kind[method]

```js signature
d.every(step, zone?): DateTime[]
d.every(count, unit, zone?): DateTime[]
```

Parcourt cette journée calendaire selon un pas positif dans le fuseau horaire indiqué ou configuré, en renvoyant un tableau d’instants [`DateTime`](/api/date-time/) à partir de minuit. Les jours de changement d’heure produisent automatiquement 23 ou 25 points horaires.

**Paramètres**

```params
- name: step
  type: Unit | DurationInput | number
  required: true
  description: Nom d’unité en anglais comme `'hour'`, durée comme `'30m'` ou quantité numérique associée à `unit`.
- name: unit
  type: Unit
  description: Nom d’unité en anglais lorsque le premier argument est une quantité numérique.
- name: zone
  type: Zone
  description: Fuseau horaire déterminant les limites de la journée (fuseau horaire configuré par défaut).
```

**Valeur de retour**

```returns
type: DateTime[]
description: Instants répartis sur cette journée calendaire dans `zone`.
```

```js
const slots = date('2026-11-16').every(6, 'hours', 'UTC');

slots.length; // 4
slots[1].toString(); // '2026-11-16T06:00:00.000Z'
```
:::

:::entry
### `split()` :kind[method]

```js signature
d.split(step, zone?): DateTimeRange[]
d.split(count, unit, zone?): DateTimeRange[]
d.splitBy(step, zone?): DateTimeRange[]
d.splitBy(count, unit, zone?): DateTimeRange[]
```

Divise cette journée calendaire en intervalles semi-ouverts contigus de type [`DateTimeRange`](/api/ranges/#datetimerange) dans le fuseau horaire indiqué ou configuré. Également accessible sous l’alias `splitBy()`.

**Paramètres**

```params
- name: step
  type: Unit | DurationInput | number
  required: true
  description: Nom d’unité en anglais, durée ou quantité numérique associée à `unit`.
- name: unit
  type: Unit
  description: Nom d’unité en anglais lorsque le premier argument est une quantité numérique.
- name: zone
  type: Zone
  description: Fuseau horaire déterminant les limites de la journée (fuseau horaire configuré par défaut).
```

**Valeur de retour**

```returns
type: DateTimeRange[]
description: Plages `DateTimeRange` contiguës couvrant cette journée dans `zone`.
```

```js
const halves = date('2026-11-16').split(12, 'hours', 'UTC');

halves.map(String);
// ['2026-11-16T00:00:00.000Z/2026-11-16T12:00:00.000Z', '2026-11-16T12:00:00.000Z/2026-11-17T00:00:00.000Z']
```
:::

## Formatage et conversion

:::entry
### `format()` :kind[method]

```js signature
d.format(spec?, locale?): string
```

Formate la date à l’aide de préréglages intégrés, de noms personnalisés définis dans [`configure()`](/api/configure/), d’objets d’options ou de motifs de jetons.

Les préréglages localisés de `'L'` à `'LLLL'` sont intégrés, et les objets d’options ignorent automatiquement les clés d’horloge et de fuseau horaire. Consultez [Formatage](/guides/formatting/) pour la référence complète des préréglages et des jetons.

**Paramètres**

```params
- name: spec
  type: FormatSpec
  default: "'medium'"
  description: Nom de préréglage intégré ou configuré, objet d’options `Intl` ou motif de jetons.
- name: locale
  type: string
  description: Étiquette de locale BCP 47 remplaçant la locale de cette date ou la locale configurée pour cet appel.
```

**Valeur de retour**

```returns
type: string
description: Date formatée sous forme de chaîne.
```

```js
const day = date('2026-11-16');

day.format('short', 'en-US'); // '11/16/26'
day.format('medium', 'en-US'); // 'Nov 16, 2026'
day.format('long', 'en-US'); // 'November 16, 2026'
day.format('full', 'en-US'); // 'Monday, November 16, 2026'
day.format('L', 'en-US'); // '11/16/2026'
day.format('YYYY-MM-DD'); // '2026-11-16'
day.format('ddd, MMM D', 'en-US'); // 'Mon, Nov 16'
day.format({ weekday: 'long' }, 'en-US'); // 'Monday'
```
:::

:::entry
### `from()` :kind[method]

```js signature
d.from(other?, locale?): string
d.formatRelative(other?, locale?): string
```

Formate l’écart calendaire entre une autre date et celle-ci sous forme d’expression localisée via `Intl.RelativeTimeFormat`, comme « hier » ou « dans 3 semaines ».

Sans premier argument, la comparaison s’effectue par rapport à [`today()`](/api/date-fn/#today) ; [`formatRelative()`](#formatrelative) sert d’alias. En dessous de sept jours, les termes courants sont utilisés (« hier », « aujourd’hui », « demain », ainsi qu’« avant-hier » et « après-demain » en français via `Intl.RelativeTimeFormat('fr')`), tandis que les semaines, les mois et les années utilisent des valeurs numériques.

**Paramètres**

```params
- name: other
  type: CalendarDateInput
  description: Date calendaire de référence à partir de laquelle mesurer. Par défaut, `today()` dans le fuseau horaire actif.
- name: locale
  type: Locale
  description: Étiquette de locale BCP 47 remplaçant la locale de cette date ou la locale configurée pour cet appel.
```

**Valeur de retour**

```returns
type: string
description: Expression relative localisée.
```

```js
const anchor = date('2026-11-16');

date('2026-11-15').from(anchor, 'en-US'); // 'yesterday'
date('2026-11-16').from(anchor, 'en-US'); // 'today'
date('2026-11-17').from(anchor, 'en-US'); // 'tomorrow'
date('2026-11-30').from(anchor, 'en-US'); // 'in 2 weeks'
date('2026-11-15').from(anchor, 'de'); // 'gestern'
```
:::

:::entry
### `fromNow()` :kind[method]

```js signature
d.fromNow(locale?): string
```

Formate l’écart entre cette date et aujourd’hui sous forme d’expression localisée, ce qui équivaut à appeler [`from()`](#from) sans date de référence.

**Paramètres**

```params
- name: locale
  type: Locale
  description: Étiquette de locale BCP 47 remplaçant la locale de cette date ou la locale configurée pour cet appel.
```

**Valeur de retour**

```returns
type: string
description: Expression relative localisée mesurée depuis aujourd’hui.
```

```js
today().minus(1, 'day').fromNow('en-US'); // 'yesterday'
today().plus(3, 'days').fromNow('en-US'); // 'in 3 days'
```
:::

:::entry
### `formatRelative()` :kind[method]

```js signature
d.formatRelative(other?, locale?): string
```

Alias de [`from()`](#from) qui formate l’écart calendaire depuis `other`, ou depuis aujourd’hui si `other` est omis, sous forme d’expression localisée.
:::

:::entry
### `locale()` :kind[method]

```js signature
d.locale(): Locale | undefined
d.locale(tag): CalendarDate
```

Lit la locale portée par cette date, ou renvoie une copie qui utilise une autre locale pour le formatage, les préréglages, les limites de semaine et les valeurs dérivées. Les étiquettes avec tiret bas et les en-têtes `Accept-Language` sont normalisés automatiquement, une étiquette vide efface la locale, et [`lang()`](#lang) sert d’alias.

**Paramètres**

```params
- name: tag
  type: Locale | null | undefined
  description: Étiquette de locale, tableau d’étiquettes ou en-tête `Accept-Language` à conserver, ou `null` pour l’effacer.
```

**Valeur de retour**

```returns
type: CalendarDate | Locale | undefined
description: Étiquette active en l’absence d’argument, ou nouveau `CalendarDate` portant `tag`.
```

```js
const trip = date('2026-05-15').locale('fr-FR');

trip.locale(); // 'fr-FR'
trip.format('long'); // '15 mai 2026'
trip.to('2026-05-19').format('long'); // '15–19 mai 2026'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
d.lang(): Locale | undefined
d.lang(tag): CalendarDate
```

Alias court de [`locale()`](#locale) pour lire ou associer une étiquette de locale BCP 47 à cette date.
:::

:::entry
### `as()` :kind[method]

```js signature
d.as('date'): CalendarDate
d.as('datetime', zone?): DateTime
d.as('yearMonth'): YearMonth
d.as('monthDay'): MonthDay
```

Convertit cette date vers un autre type au fil d’une chaîne d’appels, y compris vers [`YearMonth`](/api/year-month/) et [`MonthDay`](/api/month-day/). La conversion vers un instant renvoie minuit au début de cette date dans le fuseau horaire indiqué ou configuré.

**Paramètres**

```params
- name: kind
  type: "'date' | 'datetime' | 'yearMonth' | 'monthDay'"
  required: true
  description: Type cible sous lequel lire cette date calendaire.
- name: zone
  type: Zone
  description: Fuseau horaire utilisé lors d’une conversion vers `'datetime'` (fuseau horaire configuré par défaut).
```

**Valeur de retour**

```returns
type: CalendarDate | DateTime | YearMonth | MonthDay
description: Valeur convertie.
```

```js
const due = date('2026-11-16');

due.as('datetime', 'UTC').toString(); // '2026-11-16T00:00:00.000Z'
due.as('yearMonth').toString(); // '2026-11'
due.as('monthDay').toString(); // '11-16'
```
:::

:::entry
### `toString()` :kind[method]

```js signature
d.toString(): string
d.toJSON(): string
```

Renvoie la date sous forme de chaîne ISO 8601 `YYYY-MM-DD`. `toJSON()` renvoie la même chaîne pour `JSON.stringify()`.

**Valeur de retour**

```returns
type: string
description: Chaîne de date ISO 8601, comme `'2026-11-16'`.
```

```js
const due = date('2026-11-16');

due.toString(); // '2026-11-16'
JSON.stringify({ due }); // '{"due":"2026-11-16"}'
```
:::

:::entry
### `toJSDate()` :kind[method]

```js signature
d.toJSDate(zone?): Date
```

Renvoie un objet JavaScript `Date` natif correspondant à minuit ce jour-là dans le fuseau horaire indiqué ou configuré.
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
d.toTemporal(): Temporal.PlainDate
```

Renvoie l’instance `Temporal.PlainDate` sous-jacente.
:::

:::entry
### `valueOf()` :kind[method]

```js signature
d.valueOf(): never
```

Lève une `RangeError` afin que les opérateurs numériques ne convertissent jamais silencieusement une date calendaire en nombre.
:::
