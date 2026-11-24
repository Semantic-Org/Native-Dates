---
source: c85157f664b2
title: Vue d’ensemble
lede: Des dates et heures lisibles et immuables, appuyées sur les API Temporal et Intl du navigateur.
---

Les moteurs JavaScript modernes intègrent `Temporal` pour les calculs calendaires et de fuseaux horaires, ainsi que `Intl` pour le formatage localisé. Native Dates enveloppe ces API natives sous une forme lisible et naturelle, avec zéro dépendance d’exécution.

```js
import { date, now, today } from 'native-dates';

const due = today().plus(2, 'weeks');
const standup = date('2026-11-16')
  .at('9:30am', 'America/Los_Angeles')
  .in('Europe/Berlin');
```

Comme l’environnement embarque déjà la base IANA des fuseaux horaires et les règles de localisation, chaque région et chaque langue fonctionnent sans alourdir votre bundle avec des tables de fuseaux ou de locales.

## Un type distinct pour chaque usage

L’objet `Date` natif de JavaScript impose un type unique, qu’il s’agisse d’un jour férié, d’une heure d’ouverture ou d’un horodatage en base de données. Native Dates attribue un type dédié à chaque concept afin que chaque valeur ne porte que les champs pertinents :

- [`CalendarDate`](/api/calendar-date/) pour une date calendaire comme le 10 mai 2026, indépendante des fuseaux horaires
- [`Time`](/api/time/) pour une heure du jour comme 9 h 30, qui boucle proprement à minuit
- [`DateTime`](/api/date-time/) pour un instant précis associé à un fuseau horaire
- [`Duration`](/api/duration/) pour une durée comme 90 minutes ou 2 semaines
- [`YearMonth`](/api/year-month/) et [`MonthDay`](/api/month-day/) pour les périodes de facturation, les dates d’expiration de carte et les anniversaires annuels
- [Plages](/api/ranges/) pour les étendues comprises entre deux dates, deux heures du jour ou deux instants

La mesure d’écarts, la création de plages et le formatage avec des préréglages localisés ou des motifs de jetons fonctionnent sans configuration :

```js
import { dateRange, datetime, monthDay, now, timeRange, yearMonth } from 'native-dates';

const deadline = datetime('2027-01-01T00:00:00Z');
now().until(deadline).format('long');

const sprint = dateRange('2026-11-02', '2026-11-15');
const shift = timeRange('9:00am', '5:00pm');
sprint.contains('2026-11-10'); // true
shift.duration.hours; // 8

const billing = yearMonth('2026-11');
const birthday = monthDay('10/17');
```

Lisez ensuite [Types de temps](/guides/types-of-time/) pour savoir quel type choisir et comment passer de l’un à l’autre.

## Valeurs immuables

Chaque instance est immuable. Appeler des méthodes comme [`plus()`](/api/date-time/#plus) ou [`in()`](/api/date-time/#in) renvoie toujours une nouvelle valeur et laisse l’originale intacte.

Passer une date à une fonction utilitaire ou à un composant d’interface ne risque jamais de modifier l’état de l’appelant à votre insu :

```js
const original = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
const moved = original.plus(1, 'hour');

original.text; // 'Nov 16, 2026, 9:30 AM PST'
moved.text; // 'Nov 16, 2026, 10:30 AM PST'
```

Chaque valeur expose aussi une propriété `.text` formatée dans sa locale active, ainsi qu’une sortie `util.inspect` dédiée afin que `console.log()` sous Node affiche un aperçu concis sur une ligne :

```js
import { time } from 'native-dates';

date('2026-05-10').text; // 'May 10, 2026'
time('9:30am').text; // '9:30 AM'
```

:::tip[Comparer des valeurs]
Comme les méthodes renvoient de nouvelles instances, `===` compare les références d’objets et non l’égalité de valeur. Appelez [`equals()`](/api/date-time/#equals) pour vérifier si deux instances représentent la même date, la même heure du jour ou le même instant.
:::

## Noyau et plugins

Le paquet principal [`native-dates`](/guides/installation/) couvre la création de valeurs, les fuseaux horaires, les calculs calendaires, les dates partielles, les plages, les durées, les expressions relatives, les préréglages localisés et les motifs de jetons.

Les plugins optionnels pour la recherche de villes et d’abréviations, l’analyse en mode souple et les méthodes héritées de `Date` sont publiés dans [`@native-dates/plugins`](/plugins/) sous forme de sous-modules importables séparément. Consultez [Personnalisation](/guides/customization/#adding-plugins) pour ajouter des plugins ou définir des réglages globaux.

Rendez-vous sur [Installation](/guides/installation/) pour ajouter le paquet à votre projet et configurer le polyfill si vous prenez en charge Safari.
