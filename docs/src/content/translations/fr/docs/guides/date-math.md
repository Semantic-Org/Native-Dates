---
source: ec38498f1427
title: Calculs de dates
lede: Additionnez des durées, alignez vos valeurs sur des bornes calendaires et avancez par jour de la semaine ou par plage sans jamais modifier la valeur d’origine.
---

Dans Native Dates, chaque date, heure du jour et instant est immuable. Les méthodes qui décalent ou arrondissent une valeur renvoient toujours une nouvelle instance et laissent l’originale intacte.

## Additionner et soustraire

Appelez [`plus()`](/api/date-time/#plus) ou [`minus()`](/api/date-time/#minus) pour avancer ou reculer dans le temps :

```js
import { date } from 'native-dates';

const created = date('2026-11-16');
const due = created.plus(2, 'weeks');

created.toString(); // '2026-11-16'
due.toString(); // '2026-11-30'
```

Les deux méthodes acceptent un nombre et une unité, une expression de durée compacte ou en anglais, un objet de champs ou une instance de [`Duration`](/api/duration/). Les noms classiques [`add()`](/api/date-time/#plus) et [`subtract()`](/api/date-time/#minus) fonctionnent aussi comme alias :

```js
import { datetime, hours } from 'native-dates';

const kickoff = datetime('2026-11-16T09:00', 'America/New_York');

kickoff.plus(2, 'weeks');
kickoff.plus('1h 30m');
kickoff.plus({ days: 2, hours: 4 });
kickoff.minus(hours(3));
```

:::tip[Les unités doivent correspondre au type]
Une date calendaire refuse les unités horaires comme les heures, car elle n’a pas d’heure du jour. Une heure du jour refuse les unités calendaires comme les jours, car elle boucle à minuit. Combinez-les d’abord avec [`at()`](/api/calendar-date/#at) lorsque votre calcul porte sur les deux.
:::

## Fins de mois et changement d’heure

Ajouter des mois ou des années ramène le résultat au dernier jour valide du mois cible au lieu de basculer sur le mois suivant. Ajouter un mois au 31 janvier donne le 28 février, ou le 29 février une année bissextile :

```js
import { date } from 'native-dates';

date('2026-01-31').plus(1, 'month').toString(); // '2026-02-28'
date('2028-01-31').plus(1, 'month').toString(); // '2028-02-29'
```

Sur un [`DateTime`](/api/date-time/), les unités calendaires conservent l’heure locale malgré les changements d’heure. Les unités horaires comptent à l’inverse des heures et minutes exactes écoulées :

```js
import { datetime } from 'native-dates';

const saturday = datetime('2026-03-07T09:00', 'America/New_York');

saturday.plus(1, 'day').text; // 'Mar 8, 2026, 9:00 AM EDT'
saturday.plus(24, 'hours').text; // 'Mar 8, 2026, 10:00 AM EDT'
```

Consultez [Fuseaux horaires](/guides/time-zones/) pour examiner en détail les passages à l’heure d’été et à l’heure d’hiver.

## Aligner sur les bornes d’une unité

Appelez [`startOf()`](/api/date-time/#startof) et [`endOf()`](/api/date-time/#endof) pour caler une valeur sur le début ou la fin d’une année, d’un trimestre, d’un mois, d’une semaine, d’un jour ou d’une unité horaire.

Sur une date calendaire, la fin d’un mois correspond à son dernier jour. Sur un instant, la fin d’une unité correspond à sa dernière milliseconde :

```js
import { date, datetime } from 'native-dates';

const midMonth = date('2026-11-18');
midMonth.startOf('month').toString(); // '2026-11-01'
midMonth.endOf('month').toString(); // '2026-11-30'

const stamp = datetime('2026-11-18T14:20', 'UTC');
stamp.endOf('day').toString(); // '2026-11-18T23:59:59.999Z'
```

Les semaines commencent le premier jour défini par la locale active, comme le dimanche en `'en-US'` ou le lundi en `'de-DE'`. Passez un nom de jour en anglais comme second argument pour un appel précis, ou fixez une surcharge globale avec [`configure()`](/api/configure/) :

```js
const wednesday = date('2026-11-18');

wednesday.locale('en-US').startOf('week').toString(); // '2026-11-15'
wednesday.locale('de-DE').startOf('week').toString(); // '2026-11-16'
wednesday.startOf('week', 'monday').toString(); // '2026-11-16'
```

Appelez [`startOfNext()`](/api/date-time/#startofnext) ou [`startOfPrevious()`](/api/date-time/#startofprevious) pour atteindre le début de l’unité suivante ou précédente. Les deux méthodes passent toujours à l’unité adjacente ; appeler `startOfNext('month')` sur le 1er décembre renvoie ainsi le 1er janvier :

```js
const invoiced = date('2026-11-16');

invoiced.startOfNext('month').toString(); // '2026-12-01'
invoiced.startOfNext('quarter').toString(); // '2027-01-01'
invoiced.startOfPrevious('month').toString(); // '2026-10-01'
```

## Arrondir les heures

Appelez [`round()`](/api/date-time/#round) sur un instant ou une heure du jour pour arrondir à l’unité ou au pas le plus proche, ou arrondissez dans un seul sens avec `floor()` et `ceil()` :

```js
import { time } from 'native-dates';

const logged = time('9:23am');

logged.round('hour').format('short', 'en-US'); // '9:00 AM'
logged.round(15, 'minutes').format('short', 'en-US'); // '9:30 AM'
logged.floor(15, 'minutes').format('short', 'en-US'); // '9:15 AM'
logged.ceil(15, 'minutes').format('short', 'en-US'); // '9:30 AM'
```

Un pas comme 5, 10, 15 ou 30 minutes doit diviser exactement l’unité supérieure.

## Avancer par jour de la semaine ou date récurrente

Appelez [`next()`](/api/calendar-date/#next) ou [`previous()`](/api/calendar-date/#previous) sur une date ou un instant avec un nom de jour en anglais pour passer au jour de la semaine suivant ou précédent. Si la valeur tombe déjà sur ce jour de la semaine, elle avance ou recule de sept jours complets :

```js
import { date } from 'native-dates';

const monday = date('2026-11-16');

monday.next('friday').toString(); // '2026-11-20'
monday.next('monday').toString(); // '2026-11-23'
monday.previous('friday').toString(); // '2026-11-13'
```

Passez un [`MonthDay`](/api/month-day/) pour atteindre directement la prochaine ou la précédente occurrence d’un anniversaire ou d’un jour férié annuel :

```js
import { monthDay } from 'native-dates';

const birthday = monthDay('10/17');
monday.next(birthday).toString(); // '2027-10-17'
```

Sur un instant, `next()` conserve l’heure du jour. Passez un nom de jour en anglais à `startOfNext()` si vous voulez plutôt le début de cette journée :

```js
import { datetime } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'America/New_York');

standup.next('wednesday').text; // 'Nov 18, 2026, 9:30 AM EST'
standup.startOfNext('wednesday').text; // 'Nov 18, 2026, 12:00 AM EST'
```

## Construire et parcourir des plages

Créez une [plage](/guides/ranges/) avec [`dateRange()`](/api/range-fn/#daterange), ou chaînez [`for()`](/api/ranges/#to) et [`to()`](/api/ranges/#to) depuis une valeur existante. Parcourez ses étapes ou découpez-la en sous-plages plus fines :

```js
import { dateRange } from 'native-dates';

const sprint = dateRange('2026-11-02', '2 weeks');

sprint.end.toString(); // '2026-11-15'
sprint.every('week').map(String); // ['2026-11-02', '2026-11-09']
sprint.split(1, 'week').length; // 2
```
