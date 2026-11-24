---
source: 5365132bf9e2
title: Migrer depuis Moment
lede: Quittez Moment et moment-timezone pour des valeurs immuables, des jetons intégrés et aucune donnée de fuseaux horaires embarquée.
---

Moment et `moment-timezone` ont assuré la gestion des dates en JavaScript pendant des années, au prix d’objets mutables, de mois numérotés à partir de 0 et de lourds bundles de fuseaux horaires.

La migration supprime les clones défensifs et la lourdeur du bundle, tout en vous laissant convertir les grands dépôts un module à la fois.

## Chaque valeur est immuable

Dans Moment, ajouter des jours ou reculer au début du mois modifie l’instance sur place. Passer une date partagée à une fonction utilitaire peut corrompre silencieusement l’état du code appelant si l’on oublie de cloner au préalable.

Ici, chaque valeur est immuable. Les méthodes comme [`plus()`](/api/date-time/#plus) et [`in()`](/api/date-time/#in) renvoient toujours une nouvelle instance et laissent l’originale intacte.

```js
import { date } from 'native-dates';

const start = date('2026-11-16');
const deadline = start.plus(7, 'days');

start.toString(); // '2026-11-16'
deadline.toString(); // '2026-11-23'
```

:::tip[Supprimez les appels défensifs à clone()]
Vous pouvez retirer tous les appels `.clone()` pendant la migration. Les alias immuables d’addition et de soustraction (`add()` et `subtract()`) sont aussi inclus afin que les appels arithmétiques existants continuent de fonctionner.
:::

## Types dédiés et mois numérotés à partir de 1

Moment regroupe tous les concepts dans une seule classe et numérote les mois de 0 à 11, où le mois 10 désigne novembre. Ici, `month` est une propriété directe qui va de 1 à 12.

Choisissez [`date()`](/api/date-fn/) pour les dates calendaires, [`datetime()`](/api/datetime-fn/) pour les instants dans un fuseau horaire, et les fonctions fabriques du noyau pour les [heures du jour](/api/time-fn/), les [mois de facturation](/api/year-month-fn/) et les [anniversaires récurrents](/api/month-day-fn/) :

```js
import { date, datetime, monthDay, yearMonth } from 'native-dates';

const invoiceDate = date(2026, 11, 16);
invoiceDate.month; // 11, novembre

const sentAt = datetime('2026-11-16T17:30:00Z', 'America/New_York');
sentAt.hour; // 12

const billing = yearMonth('2026-11');
const birthday = monthDay('10/17');
```

## Aucune donnée de fuseaux horaires embarquée

`moment-timezone` livre sa propre copie de la base IANA dans le navigateur.

Le noyau lit directement les règles de fuseaux horaires dans les moteurs Temporal et Intl de l’environnement d’exécution. Chaque identifiant IANA fonctionne immédiatement, et [`@native-dates/plugins/zones`](/plugins/zones/) ajoute la résolution de noms de villes IANA en anglais (comme `'Berlin'`), d’alias natifs intégrés et d’abréviations ou désignations courantes (comme `'Pacific Time'`).

```js
import { datetime } from 'native-dates';

const kickoff = datetime('2026-11-16T09:30', 'America/Los_Angeles');

kickoff.in('Europe/London').format('short', 'en-GB'); // '16/11/2026, 17:30'
kickoff.in('Asia/Tokyo').format('short', 'en-US'); // '11/17/26, 2:30 AM'
```

## Jetons, préréglages et plages dans le noyau

Les [motifs de jetons](/guides/formatting/#token-patterns) de Moment, les préréglages localisés de `'LT'` à `'llll'`, les expressions relatives et les [plages](/api/ranges/) fonctionnent tous dans le noyau sans aucun plugin :

```js
import { dateRange, datetime } from 'native-dates';

const kickoff = datetime('2026-11-16T09:30', 'America/Los_Angeles');
kickoff.format('YYYY-MM-DD HH:mm'); // '2026-11-16 09:30'
kickoff.format('LLL', 'en-US'); // 'November 16, 2026 at 9:30 AM'
kickoff.from('2026-11-16T07:30-08:00', 'en-US'); // 'in 2 hours'

const quarter = dateRange('2026-10-01', '2026-12-31');
quarter.contains('2026-11-16'); // true
quarter.overlaps(dateRange('2026-12-15', '2027-01-15')); // true
```

## Correspondance directe

| Moment | Native Dates | Notes |
|---|---|---|
| `moment()` | `now()` ou `today()` | Instant explicite ou date calendaire |
| `moment.tz(str, zone)` | `datetime(str, zone)` | Intégré au noyau sans base tzdata embarquée |
| `m.clone().add(7, 'days')` | `d.plus(7, 'days')` | Toujours immuable ; l’alias `add()` fonctionne aussi |
| `m.tz('Europe/Berlin')` | `dt.in('Europe/Berlin')` | Affiche le même instant dans un autre fuseau horaire |
| `m.month()`, `m.date()` | `d.month`, `d.day` | Propriétés directes avec les mois de 1 à 12 |
| `m.day()`, `m.isoWeekday()` | `d.dayOfWeek` | Numérotation ISO de 1 (lundi) à 7 (dimanche), jetons `'E'` (1–7) et `'d'` (0–6) |
| `m.unix()`, `m.valueOf()` | `dt.epochSeconds`, `dt.epochMilliseconds` | Chaque compteur depuis 1970 nomme explicitement son unité |
| `b.diff(a, 'hours', true)` | `a.until(b, 'hours')` | Total fractionnaire dans l’unité demandée |
| `moment.duration(2, 'h')` | `hours(2)` ou `duration('2h')` | Utilitaires de durée intégrés au noyau |
| `m.format('LLL')` | `dt.format('LLL')` | Préréglages localisés de `'LT'` à `'llll'` sans fichier de locale |
| `m.format('YYYY-MM-DD HH:mm')` | `dt.format('YYYY-MM-DD HH:mm')` | [Motifs de jetons](/guides/formatting/#token-patterns) |
| `m.isBetween(a, b)` | `dateRange(a, b).contains(d)` | [Plages](/api/ranges/) avec `to()`, `for()` et `overlaps()` |
| `m.fromNow()`, `m.from(other)` | `dt.fromNow()`, `dt.from(other)` | [Expressions relatives](/guides/formatting/#relative-phrases) |
| Analyse de chaînes non ISO | `{ loose: true }` | Chargez [`@native-dates/plugins/loose`](/plugins/loose/) pour l’analyse sensible à la locale et aux formats informels |

## Migrer progressivement

Les grandes bases de code basculent rarement en une seule pull request. Appelez [`toJSDate()`](/api/date-time/#tojsdate) aux frontières qui attendent encore un objet `Date` JavaScript natif, et repassez les dates dans [`datetime()`](/api/datetime-fn/) à l’entrée.

```js
import { datetime } from 'native-dates';

const sentAt = datetime('2026-11-16T17:30:00Z', 'America/New_York');
const legacy = sentAt.toJSDate();
const restored = datetime(legacy, 'America/New_York');
```

Lorsque des utilitaires en aval appellent encore directement d’anciens accesseurs comme `getFullYear()` sur vos valeurs, importez le plugin [`legacy-date`](/plugins/legacy-date/).

Les accesseurs lisent les champs dans le fuseau horaire propre à la valeur tout en conservant les mois numérotés à partir de 0 pour une compatibilité immédiate. Les setters mutateurs lèvent immédiatement une erreur afin que toute modification sur place masquée apparaisse dès les tests.

```js
import '@native-dates/plugins/legacy-date';
import { datetime } from 'native-dates';

const dt = datetime('2026-11-16T09:30', 'America/Los_Angeles');

dt.getFullYear(); // 2026
dt.getMonth(); // 10, identique à Date.prototype.getMonth()
dt.getHours(); // 9, dans America/Los_Angeles
```
