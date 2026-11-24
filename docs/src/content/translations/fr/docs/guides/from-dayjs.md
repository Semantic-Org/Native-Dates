---
source: 3f7711941af9
title: Migrer depuis Day.js
lede: Remplacez les enveloppes dayjs() et les chaînes de plugins par des types dédiés et des fuseaux horaires intégrés.
---

Day.js enveloppe une date JavaScript dans un unique objet `dayjs()` et ajoute les fuseaux horaires, UTC, les plages et les durées par des plugins. Migrer vers Native Dates conserve cette approche légère et immuable tout en offrant dans le noyau des types dédiés aux dates calendaires, heures du jour, instants, dates partielles, plages et durées.

## Choisir date() ou datetime()

Dans Day.js, un anniversaire comme un horodatage d’API passent tous deux par `dayjs()`.

Ici, les dates calendaires utilisent [`date()`](/api/date-fn/) ou [`today()`](/api/date-fn/#today), tandis que les [mois de facturation](/api/year-month-fn/) et les [anniversaires récurrents](/api/month-day-fn/) disposent de fonctions fabriques dédiées aux dates partielles dans le noyau.

Les instants précis utilisent [`datetime()`](/api/datetime-fn/) ou [`now()`](/api/datetime-fn/#now) :

```js
import { date, datetime, monthDay, now, today, yearMonth } from 'native-dates';

const current = now(); // remplace dayjs() pour un horodatage
const due = today().plus(2, 'weeks'); // remplace dayjs().add(2, 'week') pour une date calendaire
const created = datetime('2026-11-16T17:30:00Z');
const birthday = date('2026-05-10');
const billing = yearMonth('2026-11');
const recurring = monthDay('05-10');
```

Les alias classiques d’addition et de soustraction (`add()` et `subtract()`) fonctionnent si votre base de code les utilise déjà. Passer une valeur vide à une fonction fabrique lève une erreur au lieu de renvoyer silencieusement la date et l’heure actuelles, ce qui détecte tôt les champs d’API manquants.

## Les mois commencent à 1

Day.js hérite des mois numérotés à partir de 0 où janvier vaut 0, et `.date()` lit le jour du mois. Ici, les champs calendaires sont de simples propriétés et les mois vont de 1 à 12.

```js
import { date } from 'native-dates';

const d = date('2026-11-16');

d.year; // 2026
d.month; // 11, novembre
d.day; // 16
d.dayOfWeek; // 1, lundi
```

:::warning[Vérifiez les numéros de mois et de jours de la semaine]
Day.js numérote les mois de 0 à 11 et fait commencer la semaine le dimanche à 0. Ici, `month` va de 1 à 12 et `dayOfWeek` va de 1 (lundi) à 7 (dimanche). Dans les motifs de jetons, `'E'` affiche la numérotation ISO de 1 à 7 tandis que `'d'` conserve la convention de Day.js de 0 à 6.
:::

## Fuseaux horaires, durées et plages intégrés

Day.js exige des plugins distincts pour convertir des dates et heures entre villes, construire des durées ou vérifier si une date appartient à une fenêtre. Le noyau inclut les fuseaux horaires IANA, les [durées](/api/duration/) et les [plages](/api/ranges/) sans aucune configuration.

```js
import { dateRange, datetime, duration, hours } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
const berlin = standup.in('Europe/Berlin'); // remplace .tz('Europe/Berlin')

const span = duration('1h 30m').plus(hours(0.5));
span.total('minutes'); // 120

const november = dateRange('2026-11-01', '2026-11-30');
november.contains('2026-11-16'); // true
dateRange('2026-11-01', '2026-11-15').overlaps(november); // true
```

Plutôt que de passer des crochets d’inclusivité à `isBetween()`, les plages de dates incluent les deux bornes calendaires tandis que les plages d’instants et les plages horaires excluent automatiquement leur borne de fin.

## Préréglages et motifs de jetons

Le noyau prend en charge les préréglages `Intl`, les formats localisés de Day.js et les [motifs de jetons](/guides/formatting/#token-patterns) personnalisés directement dans [`format()`](/api/date-time/#format), sans fichier de locale ni plugin :

```js
import { datetime } from 'native-dates';

const dt = datetime('2026-11-16T17:30:00Z', 'America/New_York');

dt.format('medium', 'en-US'); // 'Nov 16, 2026, 12:30 PM'
dt.format('LLL', 'en-US'); // 'November 16, 2026 at 12:30 PM'
dt.format('YYYY-MM-DD HH:mm'); // '2026-11-16 12:30'
```

## Plugins optionnels

Seuls l’analyse de texte non ISO, la résolution de noms de villes (noms de villes IANA en anglais comme `'Berlin'` et alias natifs intégrés) ou d’abréviations de fuseaux horaires, ainsi que les accesseurs historiques de `Date` se trouvent dans [`@native-dates/plugins`](/plugins/). Importez chaque sous-chemin une seule fois au démarrage :

```js
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { date, datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'Berlin').zone; // 'Europe/Berlin'
date('Nov 16, 2026', { loose: true }); // CalendarDate(2026-11-16)
```

## Correspondance directe

| Day.js | Native Dates | Notes |
|---|---|---|
| `dayjs()` | `now()` ou `today()` | Choisissez un instant précis ou une date calendaire |
| `d.month()`, `d.date()` | `d.month`, `d.day` | Propriétés directes avec les mois de 1 à 12 |
| `d.day()`, `d.isoWeekday()` | `d.dayOfWeek` | Numérotation ISO de 1 (lundi) à 7 (dimanche), jetons `'E'` (1–7) et `'d'` (0–6) |
| `d.unix()`, `d.valueOf()` | `dt.epochSeconds`, `dt.epochMilliseconds` | Chaque compteur depuis 1970 nomme explicitement son unité |
| `d.add(2, 'day')` | `d.plus(2, 'days')` | Les alias `add()` et `subtract()` fonctionnent aussi |
| `dayjs.tz(x, zone)` | `datetime(x, zone)` | Intégré au noyau, sans plugin `timezone` |
| `d.tz(zone)` | `dt.in(zone)` | Affiche le même instant dans un autre fuseau horaire IANA |
| `dayjs.utc(x)` | `datetime(x, 'UTC')` | Intégré au noyau, sans plugin `utc` |
| `b.diff(a, 'day', true)` | `a.until(b, 'days')` | Total fractionnaire dans l’unité demandée |
| `dayjs.duration(90, 'm')` | `minutes(90)` ou `duration('90m')` | Intégré au noyau, sans plugin `duration` |
| `d.format('LLL')` | `dt.format('LLL')` | Préréglages localisés de `'LT'` à `'llll'` |
| `d.format('YYYY-MM-DD HH:mm')` | `dt.format('YYYY-MM-DD HH:mm')` | [Motifs de jetons](/guides/formatting/#token-patterns) dans le noyau |
| `d.isBetween(a, b)` | `dateRange(a, b).contains(d)` | [Plages](/api/ranges/) avec `to()`, `for()` et `overlaps()` |
| `d.fromNow()`, `d.from(other)` | `d.fromNow()`, `d.from(other)` | Intégré au noyau, sans plugin `relativeTime` |
| `customParseFormat` | `{ format }` ou `{ loose: true }` | Motifs fixes via [`@native-dates/plugins/parse`](/plugins/parse/), saisie libre via [`@native-dates/plugins/loose`](/plugins/loose/) |
