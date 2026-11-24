---
source: af294e4ed659
title: date()
lede: Créer un CalendarDate à partir d’une chaîne année en premier, de nombres année-mois-jour, d’un objet de champs ou du jour courant.
---

## Lire des dates calendaires

:::entry
### `date()` :kind[function]

```js signature
date(input, options?): CalendarDate
date(input, zone?): CalendarDate
date(year, month, day): CalendarDate
```

Crée un [`CalendarDate`](/api/calendar-date/) à partir d’une chaîne de date année en premier, de trois nombres numérotés à partir de 1, d’un objet de champs, d’une date existante ou d’un horodatage. Les dates impossibles comme le 30 février lèvent une `RangeError` au lieu de basculer sur le mois de mars.

```js title="create.js"
import { date, datetime } from 'native-dates';

const fromIso = date('2026-11-16');
const fromSlashes = date('2026/11/6');
const fromNumbers = date(2026, 11, 16);
const fromFields = date({ year: 2026, month: 11, day: 16 });
const fromMoment = date(datetime('2026-11-17T02:00:00Z', 'America/Los_Angeles'));

fromSlashes.toString(); // '2026-11-06'
fromMoment.toString(); // '2026-11-16'
```

**Paramètres**

```params
- name: input
  type: CalendarDateInput | number
  required: true
  description: Chaîne de date ISO, objet de champs, date existante, horodatage ou année (`year`) sur 4 chiffres.
- name: options
  type: Zone | ReadOptions | number
  description: Fuseau horaire ou objet d’options lors de la lecture d’un horodatage ou d’une chaîne en mode souple, ou mois (`month`) numéroté à partir de 1 (de 1 à 12).
  options:
    - name: zone
      type: Zone
      description: Fuseau horaire utilisé pour déterminer le jour calendaire d’une chaîne d’instant, d’un `DateTime` ou d’un objet `Date`.
    - name: locale
      type: Locale
      description: Étiquette de locale BCP 47 portée par le `CalendarDate` renvoyé et par toute valeur qui en dérive.
    - name: loose
      type: boolean
      default: 'false'
      description: "Analyse de chaînes de dates informelles et renvoi de `null` en cas d’entrée illisible avec `@native-dates/plugins/loose`."
    - name: dayFirst
      type: boolean
      description: "Ordre numérique des dates remplaçant celui de la locale active pour les chaînes comme `'07.09.2026'` en mode souple."
- name: day
  type: number
  description: Jour du mois de 1 à 31 lors d’un appel avec `year`, `month` et `day`.
```

**Valeur de retour**

```returns
type: CalendarDate
description: "Instance `CalendarDate` sans horloge ni fuseau horaire, ou `null` lorsque le mode souple ne parvient pas à lire `input`."
```

Lors de la lecture d’un horodatage ISO ou d’un objet `Date` JavaScript natif, passez un fuseau horaire pour choisir le jour calendaire de l’endroit souhaité :

```js
date('2026-11-17T02:00:00Z', 'America/Los_Angeles').toString(); // '2026-11-16'
date('2026-11-17T02:00:00Z', 'Asia/Tokyo').toString(); // '2026-11-17'
```
:::

### Entrées acceptées

Les mois vont toujours de 1 pour janvier à 12 pour décembre, contrairement au constructeur `Date` de JavaScript dont les mois sont numérotés à partir de 0. Les entrées comportant une année et un mois sans jour lèvent une `RangeError` au lieu d’inventer le premier du mois ; utilisez [`yearMonth()`](/api/year-month-fn/) pour manipuler un mois seul.

| Entrée | Exemple | Lecture |
|---|---|---|
| Chaîne de date année en premier | `'2026-11-16'`, `'2026/11/6'`, `'2026年11月16日'` | Lit une année sur 4 chiffres, un mois et un jour avec tout séparateur autre qu’une lettre latine ou un deux-points. |
| Chaîne date-heure locale | `'2026-11-16T09:30'` | Conserve la date calendaire et ignore l’heure du jour. |
| Chaîne d’instant ISO | `'2026-11-17T02:00:00Z'` | Lit le jour calendaire de cet instant dans le fuseau horaire fourni ou le fuseau horaire configuré par défaut. |
| Année, mois et jour | `date(2026, 11, 16)` | Prend trois entiers, de `1` pour janvier à `12` pour décembre. |
| Objet de champs | `{ year: 2026, month: 11, day: 16 }` | Lit des champs calendaires numérotés à partir de 1 et rejette les dates impossibles. |
| [DateTime](/api/date-time/) | `date(dt, 'Asia/Tokyo')` | Extrait la date calendaire dans le fuseau horaire fourni, ou dans `dt.zone` s’il est omis. |
| Date JavaScript | `date(jsDate, 'America/Los_Angeles')` | Lit le jour calendaire de cet horodatage dans le fuseau horaire fourni ou le fuseau horaire configuré par défaut. |
| Valeur Temporal | `Temporal.PlainDate`, `Temporal.Instant` | Lit les dates simples de tout calendrier comme le même jour ISO et convertit les instants dans le fuseau horaire cible. |

:::note[Les horodatages dépendent du fuseau horaire]
Une chaîne ISO terminée par `Z` ou un décalage UTC désigne un instant qui peut correspondre à deux jours calendaires distincts selon l’endroit du globe. Passez un fuseau horaire explicite lorsque vous extrayez le jour calendaire d’un utilisateur côté serveur.
:::

## Jours calendaires relatifs

La date du jour dépend de l’endroit où vous vous trouvez sur Terre. Chaque fonction ci-dessous accepte un fuseau horaire optionnel et utilise par défaut votre [configuration globale](/api/configure/).

:::entry
### `today()` :kind[function]

```js signature
today(zone?): CalendarDate
```

Renvoie la date calendaire du jour dans le fuseau horaire indiqué ou votre fuseau horaire configuré par défaut. Tard le soir sur le continent américain, l’Asie et l’Océanie ont déjà passé minuit et changé de jour calendaire.

**Paramètres**

```params
- name: zone
  type: Zone
  description: Fuseau horaire utilisé pour lire la date calendaire courante, comme `'Asia/Tokyo'` ou `'America/Los_Angeles'`.
```

**Valeur de retour**

```returns
type: CalendarDate
description: Instance `CalendarDate` du jour courant dans `zone`.
```

```js
import { datetime, today } from 'native-dates';

const inLosAngeles = today('America/Los_Angeles');
const inTokyo = today('Asia/Tokyo');

// À 02:00 UTC le 17 novembre, Los Angeles est encore au 16 novembre alors que Tokyo est déjà au 17 novembre
const moment = '2026-11-17T02:00:00Z';
datetime(moment, 'America/Los_Angeles').date.toString(); // '2026-11-16'
datetime(moment, 'Asia/Tokyo').date.toString(); // '2026-11-17'
```
:::

:::entry
### `tomorrow()` :kind[function]

```js signature
tomorrow(zone?): CalendarDate
```

Renvoie la date calendaire de demain dans le fuseau horaire indiqué, un jour calendaire après [`today(zone)`](#today).

**Paramètres**

```params
- name: zone
  type: Zone
  description: Fuseau horaire dont le calendrier sert à avancer d’un jour depuis aujourd’hui.
```

**Valeur de retour**

```returns
type: CalendarDate
description: Instance `CalendarDate` de demain dans `zone`.
```

```js
import { tomorrow } from 'native-dates';

const nextDay = tomorrow();
const londonTomorrow = tomorrow('Europe/London');
```
:::

:::entry
### `yesterday()` :kind[function]

```js signature
yesterday(zone?): CalendarDate
```

Renvoie la date calendaire d’hier dans le fuseau horaire indiqué, un jour calendaire avant [`today(zone)`](#today).

**Paramètres**

```params
- name: zone
  type: Zone
  description: Fuseau horaire dont le calendrier sert à reculer d’un jour depuis aujourd’hui.
```

**Valeur de retour**

```returns
type: CalendarDate
description: Instance `CalendarDate` d’hier dans `zone`.
```

```js
import { yesterday } from 'native-dates';

const priorDay = yesterday();
const londonYesterday = yesterday('Europe/London');
```
:::
