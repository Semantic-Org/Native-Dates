---
source: ed93e959dec0
title: Travailler avec Temporal
lede: Comment Native Dates s’appuie sur l’API Temporal de JavaScript et interagit avec les valeurs Temporal natives.
---

Native Dates enveloppe les API natives `Temporal` et `Intl` de JavaScript.

Temporal fournit des primitives exactes pour les calendriers et les fuseaux horaires, au prix d’objets d’options explicites. Native Dates simplifie les appels du quotidien avec des méthodes concises, tout en interagissant librement avec les instances Temporal natives.

## Correspondance entre les types et Temporal

Chaque classe de valeur du noyau enveloppe un type `Temporal` sous-jacent et vous le restitue dès que vous avez besoin d’un contrôle fin :

| Type | Enveloppe | Ce que Native Dates ajoute |
|---|---|---|
| [`DateTime`](/api/date-time/) | `Temporal.ZonedDateTime` | Lit les instants ISO, décalages UTC, objets `Date` et horodatages numériques dans un unique type avec fuseau horaire, et sérialise en UTC |
| [`CalendarDate`](/api/calendar-date/) | `Temporal.PlainDate` | Se combine avec `at(time, zone)` et formate directement des préréglages et des motifs de jetons |
| [`Time`](/api/time/) | `Temporal.PlainTime` | Lit les heures au format 12 heures comme `'9:30am'` en plus des heures ISO sur 24 heures |
| [`Duration`](/api/duration/) | `Temporal.Duration` | Analyse les expressions comme `'1h 30m'`, répartit les unités fractionnaires et conserve les points d’ancrage issus de `until()` |
| [`YearMonth`](/api/year-month/) | `Temporal.PlainYearMonth` | Classe dédiée aux mois de facturation et dates d’expiration de carte, avec [`monthYear()`](/api/year-month-fn/#monthyear) et `on()` |
| [`MonthDay`](/api/month-day/) | `Temporal.PlainMonthDay` | Classe dédiée aux anniversaires et dates récurrentes, avec [`dayMonth()`](/api/month-day-fn/#daymonth), `fallsOn()` et `next()` |

Temporal laisse les plages en dehors de sa spécification. Le noyau ajoute [`DateRange`, `DateTimeRange` et `TimeRange`](/api/ranges/) à partir de paires de bornes pour tester l’appartenance, détecter les chevauchements et itérer par pas.

## Passer des objets Temporal en entrée

Chaque fonction fabrique, méthode de calcul et méthode de comparaison accepte directement les valeurs `Temporal` natives.

```js
import { date, datetime, time, yearMonth } from 'native-dates';

const instant = Temporal.Instant.from('2026-11-16T17:30:00Z');
const standup = datetime(instant, 'America/Los_Angeles');

const plainDate = Temporal.PlainDate.from('2026-11-16');
date(plainDate).plus(Temporal.Duration.from({ weeks: 2 }));

const plainTime = Temporal.PlainTime.from('09:30');
time(plainTime).format('short', 'en-US'); // '9:30 AM'

const ym = yearMonth(Temporal.PlainYearMonth.from('2026-11'));
ym.daysInMonth; // 30
```

Passer un `Temporal.ZonedDateTime` à [`datetime()`](/api/datetime-fn/) conserve son fuseau horaire, sauf si vous en indiquez un autre. Passer un instant ou une date et heure sans fuseau horaire place cette valeur dans le fuseau horaire demandé ou dans votre fuseau horaire par défaut.

Les valeurs et chaînes Temporal issues de calendriers non ISO, comme le calendrier japonais ou persan, se convertissent vers le même jour ISO sans avoir à appeler `withCalendar()` au préalable.

Les comparaisons et mesures d’écart acceptent elles aussi directement des valeurs Temporal :

```js
const berlin = Temporal.ZonedDateTime.from('2026-11-16T18:30:00+01:00[Europe/Berlin]');
standup.equals(berlin); // true
```

## Extraire l’instance avec toTemporal()

Appelez [`toTemporal()`](/api/date-time/#totemporal) sur n’importe quelle valeur pour accéder à son instance Temporal sous-jacente.

Utilisez-la lorsque vous appelez des bibliothèques tierces qui attendent des objets Temporal ou lorsque vous travaillez avec des calendriers non ISO.

```js
import { date } from 'native-dates';

const d = date('2026-11-16');
const plain = d.toTemporal(); // Temporal.PlainDate

const japanese = plain.withCalendar('japanese');
japanese.era; // 'reiwa'
japanese.eraYear; // 8
```

:::note[Accès direct sans copie]
Chaque instance conserve en interne un véritable objet Temporal ; `toTemporal()` renvoie donc directement cet objet sans réanalyse ni nouvelle allocation.
:::

## Utiliser un polyfill sur les anciens moteurs

Les versions actuelles de Chrome, Edge, Firefox, Node 26+, Deno et Bun embarquent `Temporal` nativement : le noyau n’inclut donc aucun code de polyfill.

Pour Safari, les anciens navigateurs ou Node 22–25, chargez `@native-dates/polyfill` avec `temporal-polyfill` au démarrage (il fournit aussi une implémentation de repli d’`Intl.DurationFormat` sous Node 22–23). Consultez [Prendre en charge Safari et les anciennes versions de Node](/guides/installation/#supporting-safari-and-older-node) pour la configuration et les options de chargement synchrone.
