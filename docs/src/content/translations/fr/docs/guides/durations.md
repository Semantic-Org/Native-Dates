---
source: d8be401b7194
title: Durées
lede: Créez des durées avec des fonctions d’unités ou des expressions en anglais, puis mesurez ou formatez des écarts.
---

Une [`Duration`](/api/duration/) représente un laps de temps, comme 90 minutes ou 2 semaines. Vous pouvez en créer une directement pour vos calculs de dates, ou en obtenir une en mesurant l’écart entre deux valeurs.

## Créer une durée

Créez une durée avec les fonctions par unité comme [`hours()`](/api/duration-fn/#hours), ou passez une expression de durée en anglais, une chaîne ISO 8601 ou un objet de champs à [`duration()`](/api/duration-fn/) :

```js
import { days, duration, hours } from 'native-dates';

const call = hours(1.5);
const trial = days(14);
const turnaround = duration('2 weeks, 3 days');
const iso = duration('PT1H30M');
const window = duration({ hours: 2, minutes: 45 });
```

Lisez directement les compteurs d’unités sur l’instance. Les valeurs fractionnaires se répartissent automatiquement dans l’unité inférieure, tandis que les entiers restent dans l’unité saisie :

```js
call.hours; // 1
call.minutes; // 30

const ninety = duration(90, 'minutes');
ninety.hours; // 0
ninety.minutes; // 90
```

## Mesurer entre deux valeurs

Appelez [`until()`](/api/date-time/#until) ou [`since()`](/api/date-time/#since) sur deux dates calendaires, deux heures du jour, deux [`YearMonth`](/api/year-month/) ou deux instants pour mesurer la durée qui les sépare :

```js
import { datetime } from 'native-dates';

const opened = datetime('2026-11-16T08:00', 'America/Los_Angeles');
const resolved = datetime('2026-11-16T10:30', 'America/Los_Angeles');

const elapsed = opened.until(resolved);
elapsed.hours; // 2
elapsed.minutes; // 30
```

Si vous n’avez besoin que d’un nombre unique pour un calcul ou une barre de progression, passez l’unité cible en second argument :

```js
opened.until(resolved, 'hours'); // 2.5
resolved.since(opened, 'minutes'); // 150
```

Chaque [plage](/api/ranges/) expose également directement `.duration` :

```js
import { dateRange, timeRange } from 'native-dates';

dateRange('2026-11-01', '2026-11-07').duration.days; // 7
timeRange('9:00am', '5:30pm').duration.hours; // 8
```

## Équilibrer et totaliser les unités

Les valeurs conservent les unités dans lesquelles vous les avez créées tant que vous ne demandez pas de conversion. Appelez [`balance()`](/api/duration/#balance) pour reporter l’excédent vers les unités supérieures :

```js
import { hours, minutes, months } from 'native-dates';

minutes(90).balance().toFields(); // { hours: 1, minutes: 30 }
months(18).balance().toFields(); // { years: 1, months: 6 }
hours(36).balance('day').toFields(); // { days: 1, hours: 12 }
```

Sans argument, une durée autonome reporte les mois vers les années et les unités horaires jusqu’aux heures, en laissant les jours intacts afin de ne jamais fausser les changements d’heure.

Passez `'day'` ou `'week'` lorsque vous souhaitez des journées fixes de 24 heures ou des semaines de 7 jours.

Appelez [`total()`](/api/duration/#total) ou son alias [`as()`](/api/duration/#as) pour convertir toute la durée en un seul nombre flottant dans l’unité voulue :

```js
import { duration } from 'native-dates';

const shift = duration('7h 30m');

shift.total('hours'); // 7.5
shift.as('minutes'); // 450
```

:::note[Totaux en mois et en années]
Les années et les mois se totalisent et s’équilibrent directement entre eux sur la base de 12 mois par an. Convertir entre jours et mois exige une date calendaire de référence, que les durées issues de `until()` et `since()` mémorisent automatiquement.
:::

```js
import { date, months } from 'native-dates';

months(18).total('years'); // 1.5

const span = date('2026-01-15').until('2026-04-15');
span.total('months'); // 3
span.total('days'); // 90
```

## Formater des durées

Chaque instance expose dans `.text` sa forme longue localisée. Appelez [`format()`](/api/duration/#format) avec un préréglage de style pour une sortie complète, abrégée, compacte ou numérique :

```js
import { duration } from 'native-dates';

const flight = duration({ hours: 2, minutes: 30 });

flight.text; // '2 hours, 30 minutes'
flight.format('long', 'en-US'); // '2 hours, 30 minutes'
flight.format('short', 'en-US'); // '2 hr, 30 min'
flight.format('narrow', 'en-US'); // '2h 30m'
flight.format('digital', 'en-US'); // '2:30:00'
```

Passez une étiquette de locale en second argument pour traduire les libellés d’unités, ou appelez [`toString()`](/api/duration/#tostring) lorsqu’une API attend une chaîne ISO 8601.
