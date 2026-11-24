---
source: 6f9a2cfc4ed9
title: duration()
lede: Créer une Duration à partir d’une expression de durée en anglais, d’une chaîne ISO 8601, d’une quantité et d’une unité ou des fonctions d’unités.
---

## Créer des durées

:::entry
### `duration()` :kind[function]

```js signature
duration(input, unit?): Duration
duration(input, options?): Duration
```

Crée une [`Duration`](/api/duration/) à partir d’une quantité et d’une unité, d’une expression de durée en anglais, d’une chaîne de durée ISO 8601, d’un objet de champs ou de millisecondes. Les champs restent tels quels tant que vous n’appelez pas [`balance()`](/api/duration/#balance) : 90 minutes restent donc 90 minutes au lieu de se convertir en une heure et demie.

```js title="lengths.js"
import { duration } from 'native-dates';

const phrase = duration('1h 30m');
const words = duration('2 weeks and 3 days');
const iso = duration('PT1H30M');
const count = duration(90, 'minutes');
const spilled = duration(1.5, 'days');
const fields = duration({ hours: 1, minutes: 30 });
const ms = duration(1500);

spilled.days; // 1
spilled.hours; // 12
ms.seconds; // 0
ms.milliseconds; // 1500
```

**Paramètres**

```params
- name: input
  type: DurationInput
  required: true
  description: Nombre associé à `unit`, expression de durée en anglais ou abrégée, chaîne ISO 8601, objet de champs, instance `Duration` ou millisecondes.
- name: unitOrOptions
  type: "Unit | { locale?: Locale, loose?: boolean }"
  description: Nom d’unité en anglais lorsque `input` est un nombre, ou objet d’options.
  options:
    - name: locale
      type: Locale
      description: Étiquette de locale BCP 47 portée par la `Duration` renvoyée et par toute valeur qui en dérive.
    - name: loose
      type: boolean
      default: 'false'
      description: "Renvoi de `null` en cas d’entrée illisible avec `@native-dates/plugins/loose`."
```

**Valeur de retour**

```returns
type: Duration
description: "Instance `Duration` conservant les champs tels qu’écrits, ou `null` lorsque le mode souple ne parvient pas à lire `input`."
```

Avec [`@native-dates/plugins/loose`](/plugins/loose/) importé, le mode souple renvoie `null` au lieu de lever une erreur lorsqu’un texte saisi par l’utilisateur ne peut pas être analysé comme une durée :

```js
import { duration } from 'native-dates';
import '@native-dates/plugins/loose';

duration('45 mins', { loose: true })?.minutes; // 45
duration('soon', { loose: true }); // null
```
:::

### Entrées acceptées

| Entrée | Exemple | Lecture |
|---|---|---|
| Quantité et unité | `duration(90, 'minutes')`, `duration(1.5, 'days')` | Associe un nombre ou une chaîne numérique à une unité en anglais, en reportant les fractions sur l’unité immédiatement inférieure. |
| Expression de durée en anglais | `'1h 30m'`, `'2 weeks and 3 days'`, `'-15m'` | Lit des quantités séparées par des espaces, des virgules ou `and`, avec noms d’unités complets en anglais ou abréviations. |
| Chaîne ISO 8601 | `'PT1H30M'`, `'P2W3D'` | Analyse les chaînes de durée ISO 8601 standard. |
| Objet de champs | `{ hours: 1, minutes: 30 }` | Lit des clés d’unités en anglais au singulier ou au pluriel dont tous les champs non nuls partagent le même signe. |
| Millisecondes | `duration(1500)`, `duration(0)` | Traite un nombre seul ou une chaîne numérique sans unité comme des millisecondes. |
| Duration ou Temporal | `hours(2)`, `Temporal.Duration` | Renvoie une instance `Duration` existante telle quelle ou encapsule un `Temporal.Duration`. |

:::note[Unités fractionnaires et signe unique]
Les quantités fractionnaires se reportent sur des unités exactes plus petites : ainsi, `duration(1.5, 'days')` devient 1 jour et 12 heures. Comme les mois n’ont pas un nombre fixe de jours, les fractions de mois lèvent une `RangeError`, tout comme les expressions mêlant des signes opposés telles que `'1h -30m'`.
:::

## Fonctions d’unités

Les fonctions d’unités construisent des durées à une seule unité qui se lisent naturellement dans les appels de calcul et les expressions. Chacune accepte un nombre positif ou négatif, ou une chaîne numérique.

```js
import { days, hours, minutes, today } from 'native-dates';

const reminder = today().plus(days(3)).at('9:00am');
const block = hours(1).plus(minutes(30));

block.format('short', 'en-US'); // '1 hr, 30 min'
```

:::entry
### `years()` :kind[function]

```js signature
years(count): Duration
```

Crée une durée correspondant au nombre d’années indiqué, en reportant les fractions d’années sur les mois.
:::

:::entry
### `months()` :kind[function]

```js signature
months(count): Duration
```

Crée une durée correspondant à un nombre entier de mois calendaires.
:::

:::entry
### `weeks()` :kind[function]

```js signature
weeks(count): Duration
```

Crée une durée correspondant au nombre de semaines indiqué, en reportant les fractions sur les jours.
:::

:::entry
### `days()` :kind[function]

```js signature
days(count): Duration
```

Crée une durée correspondant au nombre de jours calendaires indiqué, en reportant les fractions sur les heures.
:::

:::entry
### `hours()` :kind[function]

```js signature
hours(count): Duration
```

Crée une durée correspondant au nombre d’heures indiqué, en reportant les fractions sur les minutes.
:::

:::entry
### `minutes()` :kind[function]

```js signature
minutes(count): Duration
```

Crée une durée correspondant au nombre de minutes indiqué, en reportant les fractions sur les secondes.
:::

:::entry
### `seconds()` :kind[function]

```js signature
seconds(count): Duration
```

Crée une durée correspondant au nombre de secondes indiqué, en reportant les fractions sur les millisecondes.
:::

:::entry
### `milliseconds()` :kind[function]

```js signature
milliseconds(count): Duration
```

Crée une durée correspondant au nombre de millisecondes indiqué, en reportant les fractions jusqu’aux microsecondes et nanosecondes.
:::
