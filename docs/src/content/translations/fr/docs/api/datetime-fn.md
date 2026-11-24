---
source: 50f6c5cb4f97
title: datetime()
lede: Créer un DateTime à partir d’un horodatage, d’une chaîne, d’un objet Date ou d’un objet de champs, ou lire l’instant actuel.
---

## Lire des instants

:::entry
### `datetime()` :kind[function]

```js signature
datetime(input, zone?): DateTime
datetime(input, options?): DateTime
```

Lit une chaîne, un horodatage, un objet de champs ou une date calendaire pour produire un [`DateTime`](/api/date-time/) affiché dans un fuseau horaire. Omettez le fuseau horaire pour utiliser votre [configuration par défaut](/api/configure/) ou le fuseau horaire local de l’environnement.

```js title="read.js"
import { date, datetime } from 'native-dates';

const fromUtc = datetime('2026-11-16T17:30:00Z', 'America/Los_Angeles');
const fromWall = datetime('2026-11-16 09:30', 'Europe/Berlin');
const fromZone = datetime('2026-11-16T09:30[America/New_York]');
const fromEpoch = datetime(1794850200000, 'UTC');
const fromDate = datetime(date('2026-11-16'), 'America/New_York');
```

**Paramètres**

```params
- name: input
  type: DateTimeInput
  required: true
  description: Chaîne ISO, millisecondes depuis l’époque Unix, objet `Date`, objet de champs, date calendaire ou valeur Temporal.
- name: zoneOrOptions
  type: Zone | ReadOptions
  description: Chaîne de fuseau horaire comme `'Europe/Berlin'` ou `'UTC'`, ou objet d’options.
  options:
    - name: zone
      type: Zone
      description: Fuseau horaire dans lequel afficher l’instant, prioritaire sur un éventuel fuseau horaire entre crochets dans `input`.
    - name: locale
      type: Locale
      description: Étiquette de locale BCP 47 portée par le `DateTime` renvoyé et par toute valeur qui en dérive.
    - name: loose
      type: boolean
      default: 'false'
      description: "Analyse de chaînes de dates informelles et renvoi de `null` en cas d’entrée illisible avec `@native-dates/plugins/loose`."
    - name: dayFirst
      type: boolean
      description: "Ordre numérique des dates remplaçant celui de la locale active pour les chaînes comme `'07/09/2026'` en mode souple."
```

**Valeur de retour**

```returns
type: DateTime
description: "Instance `DateTime` dans le fuseau horaire résolu, ou `null` lorsque le mode souple ne parvient pas à lire `input`."
```

Lorsque [`@native-dates/plugins/loose`](/plugins/loose/) est importé, le mode souple lit les dates et heures informelles dans la locale active, se replie sur l’analyse du moteur pour les formats machine et renvoie `null` en cas d’entrée illisible :

```js
import { datetime } from 'native-dates';
import '@native-dates/plugins/loose';

datetime('Mon, 16 Nov 2026 17:30:00 GMT', { zone: 'America/New_York', loose: true });
datetime('not a timestamp', { loose: true }); // null
```
:::

### Entrées acceptées

Chaque entrée produit une instance immuable affichée dans le fuseau horaire cible :

| Entrée | Exemple | Lecture |
|---|---|---|
| Chaîne ISO avec décalage | `'2026-11-16T17:30:00Z'`, `'2026-11-16 12:30-05:00'` | Fixe l’instant exact et l’affiche dans le fuseau horaire cible. |
| Chaîne avec fuseau horaire entre crochets | `'2026-11-16T09:30[America/New_York]'` | Conserve le fuseau horaire entre crochets, sauf si un second argument de fuseau horaire le remplace. |
| Date et heure locales | `'2026-11-16T09:30'`, `'2026年11月16日 14:30'` | Lit une date année en premier et une heure du jour directement dans le fuseau horaire cible. |
| Chaîne de date ou [CalendarDate](/api/calendar-date/) | `'2026-11-16'`, `date(2026, 11, 16)` | Se place au début de ce jour calendaire dans le fuseau horaire cible. |
| Millisecondes ou Date | `1794850200000`, `new Date()` | Convertit l’horodatage Unix vers le fuseau horaire cible en tronquant les fractions de milliseconde comme `Date`. |
| Objet de champs | `{ year: 2026, month: 11, day: 16, hour: 9 }` | Lit des champs calendaires numérotés à partir de 1 et des champs horaires numérotés à partir de 0 dans le fuseau horaire cible, et rejette les dates impossibles. |
| DateTime ou Temporal | `dt`, `Temporal.Instant`, `Temporal.ZonedDateTime` | Conserve le fuseau horaire existant sauf si un fuseau horaire explicite est passé en argument. |

:::note[Les valeurs manquantes ne deviennent jamais l’instant actuel]
Les valeurs manquantes comme `undefined` ou `null` lèvent une erreur afin qu’une colonne vide en base de données ne se transforme jamais par accident en l’instant actuel. Appelez [`now()`](#now) lorsque vous souhaitez lire l’horloge en direct.
:::

## Instant actuel et journée en cours

Lisez l’horloge en direct ou construisez les bornes de requête de la journée en cours dans n’importe quel fuseau horaire.

:::entry
### `now()` :kind[function]

```js signature
now(zone?): DateTime
```

Renvoie l’instant actuel à la milliseconde près dans le fuseau horaire indiqué ou votre fuseau horaire configuré par défaut. Cette précision à la milliseconde correspond à `Date.now()`, ce qui garantit un aller-retour fidèle des horodatages dans les données JSON.

**Paramètres**

```params
- name: zone
  type: Zone
  description: Fuseau horaire dans lequel afficher l’instant actuel, comme `'Asia/Tokyo'` ou `'UTC'`.
```

**Valeur de retour**

```returns
type: DateTime
description: Instance `DateTime` correspondant à la milliseconde actuelle dans `zone`.
```

```js
import { now } from 'native-dates';

const local = now();
const tokyo = now('Asia/Tokyo');
const utc = now('UTC');
```
:::

:::entry
### `startOfToday()` :kind[function]

```js signature
startOfToday(zone?): DateTime
```

Renvoie le début de la journée en cours dans le fuseau horaire indiqué, correspondant au commencement du jour calendaire local. Pratique comme borne inférieure pour interroger les événements ou enregistrements créés aujourd’hui.

**Paramètres**

```params
- name: zone
  type: Zone
  description: Fuseau horaire dans lequel mesurer la journée en cours.
```

**Valeur de retour**

```returns
type: DateTime
description: Instance `DateTime` au début de la journée en cours dans `zone`.
```

```js
import { startOfToday } from 'native-dates';

const opens = startOfToday('America/New_York');
opens.hour; // 0
opens.minute; // 0
```
:::

:::entry
### `endOfToday()` :kind[function]

```js signature
endOfToday(zone?): DateTime
```

Renvoie la dernière milliseconde de la journée en cours dans le fuseau horaire indiqué.

**Paramètres**

```params
- name: zone
  type: Zone
  description: Fuseau horaire dans lequel mesurer la journée en cours.
```

**Valeur de retour**

```returns
type: DateTime
description: Instance `DateTime` à `23:59:59.999` à la date du jour dans `zone`.
```

```js
import { endOfToday } from 'native-dates';

const cutoff = endOfToday('America/New_York');
cutoff.hour; // 23
cutoff.millisecond; // 999
```
:::
