---
source: 8e9d9ff9bd0c
title: Plages
lede: Manipulez des plages entre deux dates, deux heures du jour ou deux instants, des tests de chevauchement jusqu’au formatage.
---

Une [plage](/api/ranges/) modélise une étendue définie par un début et une fin, comme une réservation d’hôtel, des horaires d’ouverture ou une réunion planifiée. Chaque type temporel dispose de sa propre classe de plage afin que les jours calendaires restent des jours calendaires et que les plages horaires n’inventent jamais de fausse date.

## Créer des plages

Créez directement une plage avec [`dateRange()`](/api/range-fn/), [`timeRange()`](/api/range-fn/#timerange) ou [`datetimeRange()`](/api/range-fn/#datetimerange). Chaque fonction fabrique accepte deux bornes, un point de départ accompagné d’une durée, ou une chaîne de plage unique :

```js
import { dateRange, datetimeRange, timeRange } from 'native-dates';

const sprint = dateRange('2026-05-01', '2 weeks');
const trip = dateRange('2026-09-01', '2026-09-07');
const hours = timeRange('9am - 5pm');
const meeting = datetimeRange('2026-09-01T09:00', '90m', 'America/New_York');
```

Si vous disposez déjà d’une date, d’une heure du jour ou d’un instant typé, chaînez directement [`for()`](/api/ranges/#to), [`to()`](/api/ranges/#to) ou [`range()`](/api/ranges/#range) dessus :

```js
import { today } from 'native-dates';

const upcoming = today().for(2, 'weeks');
const thisMonth = today().range('month');
```

## Dates inclusives et intervalles semi-ouverts

Les plages de dates incluent leur dernier jour, car du 1er au 7 septembre désigne bien sept jours complets. Les plages d’instants et les plages horaires fonctionnent en intervalle semi-ouvert et excluent leur borne de fin afin que deux créneaux consécutifs ne se chevauchent jamais :

```js
import { dateRange, timeRange } from 'native-dates';

dateRange('2026-09-01', '2026-09-07').duration.days; // 7

const first = timeRange('9:00am', '10:00am');
const second = timeRange('10:00am', '11:00am');
first.overlaps(second); // false
```

Lorsqu’une plage horaire se termine plus tôt qu’elle ne commence, elle enjambe minuit pour couvrir une équipe de nuit ou un établissement ouvert tard :

```js
const nightShift = timeRange('22:00', '06:00');

nightShift.contains('02:30'); // true
nightShift.duration.hours; // 8
```

## Inclusion et chevauchement

Vérifiez qu’un point ou une sous-plage se trouve dans une plage avec [`contains()`](/api/ranges/#contains), ou comparez deux plages entre elles avec [`overlaps()`](/api/ranges/#overlaps) et [`intersection()`](/api/ranges/#intersection) :

```js
import { dateRange } from 'native-dates';

const booking = dateRange('2026-11-10', '2026-11-18');
const holiday = dateRange('2026-11-15', '2026-11-22');

booking.contains('2026-11-14'); // true
booking.overlaps(holiday); // true
booking.intersection(holiday).toString(); // '2026-11-15/2026-11-18'
```

`intersection()` renvoie `null` lorsque les deux plages ne se chevauchent pas.

## Parcourir, compter et découper des plages

Appelez [`every()`](/api/ranges/#every) pour parcourir une plage et collecter chaque date, heure du jour ou instant au fil du pas choisi. Sur une plage de dates, appelez [`count()`](/api/ranges/#count) pour compter directement les jours, ou passez un mot-clé ou nom de jour en anglais (`'weekdays'`, `'weekends'`, `'mondays'`) :

```js
import { dateRange } from 'native-dates';

const sprint = dateRange('2026-05-01', '2 weeks');

sprint.every('week').map(String); // ['2026-05-01', '2026-05-08']
sprint.count(); // 14
sprint.count('weekdays'); // 10
sprint.count('mondays'); // 2
```

Appelez [`split()`](/api/ranges/#split) pour obtenir des sous-plages plutôt que des points isolés, par exemple pour découper une plage horaire en créneaux de réservation ou un sprint en semaines :

```js
import { timeRange } from 'native-dates';

const morning = timeRange('9:00am', '12:00pm');
const slots = morning.split(30, 'minutes');

slots.length; // 6
slots[0].toString(); // '09:00:00/09:30:00'
```

## Formater et sérialiser

Formater une plage avec un préréglage condense automatiquement les mois et années communs selon les règles de la locale active. Passez un motif de jetons pour formater explicitement les deux bornes :

```js
import { dateRange, timeRange } from 'native-dates';

const week = dateRange('2026-09-01', '2026-09-07');

week.format('medium', 'en-US'); // 'Sep 1 – 7, 2026'
week.format('YYYY-MM-DD'); // '2026-09-01 – 2026-09-07'
timeRange('9:00am', '5:00pm').format('short', 'en-US'); // '9:00 AM – 5:00 PM'
```

Chaque plage expose sa durée sur `.duration` et produit une chaîne de plage ISO 8601 avec [`toString()`](/api/ranges/#tostring). Repasser cette chaîne à la même fonction fabrique reconstitue la plage à l’identique :

```js
const raw = week.toString(); // '2026-09-01/2026-09-07'
dateRange(raw).equals(week); // true
```
