---
source: 2eb400c31ff1
title: Stockage et échange
lede: Sérialisez proprement vos dates, heures du jour, instants et plages dans les API JSON, bases de données et champs HTML.
---

Chaque type se sérialise en chaîne ISO 8601 standard lorsqu’il est converti en texte ou passé à `JSON.stringify()`. À la réception, ces chaînes se relisent directement avec la fonction fabrique correspondante.

## JSON et formats d’échange

Passez vos valeurs directement à `JSON.stringify()`, sans fonction de remplacement ni objet enveloppe :

```js
import { date, duration, time } from 'native-dates';

const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');

JSON.stringify({
  startsAt: standup,
  dueOn: date('2026-11-16'),
  opensAt: time('9:30am'),
  length: duration('1h 30m'),
});
// '{"startsAt":"2026-11-16T17:30:00.000Z","dueOn":"2026-11-16","opensAt":"09:30:00","length":"PT1H30M"}'
```

| Type | Format d’échange | Usage courant |
|---|---|---|
| [`DateTime`](/api/date-time/) | `'2026-11-16T17:30:00.000Z'` | Horodatages d’audit, départs de vol et instants de réunion |
| [`CalendarDate`](/api/calendar-date/) | `'2026-11-16'` | Dates d’échéance, jours fériés et nuits d’hôtel |
| [`Time`](/api/time/) | `'09:30:00'` | Horaires d’ouverture et rappels quotidiens |
| [`Duration`](/api/duration/) | `'PT1H30M'` | Délais d’expiration, SLA, durées facturées et minuteurs |
| [`YearMonth`](/api/year-month/) | `'2026-11'` | Périodes de facturation, expirations de carte et champs mois |
| [`MonthDay`](/api/month-day/) | `'10-17'` | Anniversaires récurrents et fêtes annuelles sans année de naissance |
| [Plages](/api/ranges/) | `'2026-11-01/2026-11-07'` | Fenêtres de réservation, sprints et plages ISO 8601 avec barre oblique |

Lorsqu’une API externe, une clé de cache ou une colonne de type entier attend un nombre, lisez le compteur depuis l’époque Unix (1970) dans l’unité attendue. Chaque propriété indique explicitement son unité, car certains systèmes comptent en secondes et d’autres en millisecondes :

```js
standup.toString(); // '2026-11-16T17:30:00.000Z'
standup.epochSeconds; // 1794850200
standup.epochMilliseconds; // 1794850200000
duration('1h 30m').toMilliseconds(); // 5400000
```

## Relire les chaînes dans votre code

Repassez chaque chaîne d’échange à sa fonction fabrique correspondante lors de la lecture de réponses JSON, de lignes de base de données ou de paramètres d’URL :

```js
import { date, dateRange, datetime, duration, time, yearMonth } from 'native-dates';

const startsAt = datetime('2026-11-16T17:30:00.000Z', 'America/Los_Angeles');
const dueOn = date('2026-11-16');
const opensAt = time('09:30:00');
const length = duration('PT1H30M');
const billing = yearMonth('2026-11');
const window = dateRange('2026-11-01/2026-11-07');
```

Chaque `DateTime` se sérialise en UTC afin que deux clients enregistrant le même événement produisent des chaînes identiques. Passer un fuseau horaire à la relecture affiche cet instant UTC exact dans le fuseau demandé sans modifier le moment où il a eu lieu.

## Événements futurs et récurrents

Pour les événements passés comme un reçu de commande ou un journal serveur, un horodatage UTC seul suffit. Pour un événement futur planifié par une personne, stockez le fuseau horaire IANA (`zone`) aux côtés de l’horodatage.

```js
import { date, datetime } from 'native-dates';

const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
const row = {
  startsAt: standup.toString(),
  zone: standup.zone, // 'America/Los_Angeles'
};

const nextWeek = datetime(row.startsAt, row.zone).plus(1, 'week');
nextWeek.hour; // 9
```

En conservant le fuseau horaire, ajouter des semaines ou des mois maintient l’heure locale de 9 h 30 à travers les changements d’heure. L’application intègre aussi automatiquement toute évolution future des règles légales d’heure locale.

:::tip[Stockez les noms IANA, pas les décalages]
Un décalage comme `'-08:00'` ne décrit que l’hiver à Los Angeles. Stockez `zone` dès que de futurs calculs calendaires doivent suivre les changements d’heure locaux.
:::

## Colonnes de base de données

Faites correspondre le type de colonne SQL à votre valeur afin que la base de données impose les mêmes garanties que votre code applicatif.

| Type | Colonne SQL | Pourquoi ce choix |
|---|---|---|
| `DateTime` | `timestamptz` ou `bigint` | Stocke un instant UTC exact sans ambiguïté |
| `CalendarDate` | `date` | Stocke `YYYY-MM-DD` sans décalage de fuseau horaire à minuit |
| `Time` | `time` | Stocke `HH:MM:SS` sans inventer de date fictive |
| `Duration` | `interval` ou `text` | Stocke une durée SQL structurée ou une chaîne ISO 8601 `PT` |

Évitez les colonnes SQL `timestamp` sans fuseau horaire pour représenter de vrais instants : les pilotes de base de données réinterprètent souvent ces valeurs dans le fuseau horaire local du serveur.

## Champs HTML et URL

Les champs HTML natifs de type date, mois et heure lisent et écrivent exactement les mêmes chaînes ISO que les types du noyau. Les paramètres d’URL emploient le même format compact.

```js
import { date, time, yearMonth } from 'native-dates';

// <input type="date" value="2026-11-16">
const due = date('2026-11-16');
due.toString(); // '2026-11-16'

// <input type="month" value="2026-11">
const billing = yearMonth('2026-11');
billing.toString(); // '2026-11'

// <input type="time" value="09:30">
const opens = time('09:30');
opens.toString().slice(0, 5); // '09:30'

const params = new URLSearchParams({ from: due.toString() });
params.toString(); // 'from=2026-11-16'
```

Lire un champ de date avec [`date()`](/api/date-fn/) évite également le bug classique de `new Date('2026-11-16')`, où minuit UTC recule d’un jour dans les fuseaux horaires situés à l’ouest de Greenwich.
