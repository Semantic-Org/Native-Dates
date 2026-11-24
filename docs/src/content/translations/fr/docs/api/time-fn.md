---
source: bb49ea92ac08
title: time()
lede: Créer un Time à partir d’une chaîne horaire 12 h ou 24 h, de nombres, d’un objet de champs ou d’un horodatage.
---

## Lire des heures du jour

:::entry
### `time()` :kind[function]

```js signature
time(input, options?): Time
time(input, zone?): Time
time(hour, minute?, second?): Time
```

Crée un [`Time`](/api/time/) à partir d’une chaîne horaire, de composantes horaires entières, d’un objet de champs ou d’un horodatage. Les entrées manquantes (`null`, `undefined` ou argument omis) lèvent une `TypeError` au lieu de prendre l’heure actuelle par défaut.

```js title="clock.js"
import { datetime, time } from 'native-dates';

const morning = time('9am');
const closing = time('5:30pm');
const iso = time('17:30:00');
const fromNumbers = time(9, 30);
const fromFields = time({ hour: 17, minute: 30, millisecond: 250 });
const fromInstant = time('2026-11-16T17:30:00Z', 'America/New_York');
const fromMoment = time(datetime('2026-11-16T17:30:00Z'), 'Europe/Berlin');
const fromTemporal = time(Temporal.PlainTime.from('08:15'));

closing.toString(); // '17:30:00'
fromInstant.toString(); // '12:30:00'
fromMoment.toString(); // '18:30:00'
```

**Paramètres**

```params
- name: input
  type: TimeInput | number
  required: true
  description: Chaîne horaire, objet de champs, valeur `Time`, horodatage ou heure (`hour`) au format 24 h de 0 à 23.
- name: options
  type: Zone | ReadOptions | number
  description: Fuseau horaire ou objet d’options lors de la lecture d’un horodatage ou d’une chaîne en mode souple, ou nombre entier de minutes (`minute`) de 0 à 59.
  options:
    - name: zone
      type: Zone
      description: Fuseau horaire utilisé pour extraire l’heure du jour d’une chaîne d’instant, d’un `DateTime` ou d’un objet `Date`.
    - name: locale
      type: Locale
      description: Étiquette de locale BCP 47 portée par le `Time` renvoyé et par toute valeur qui en dérive.
    - name: loose
      type: boolean
      default: 'false'
      description: "Lecture de chaînes date-heure informelles et renvoi de `null` en cas d’entrée illisible avec `@native-dates/plugins/loose`."
    - name: dayFirst
      type: boolean
      description: "Ordre numérique des dates remplaçant celui de la locale active lorsque le mode souple analyse une chaîne de date et heure."
- name: second
  type: number
  description: Nombre entier de secondes (`second`) de 0 à 59 lors d’un appel avec des nombres. Les fractions de seconde s’écrivent dans une chaîne ou un objet de champs.
```

**Valeur de retour**

```returns
type: Time
description: "Instance `Time` représentant une heure du jour, ou `null` lorsque le mode souple ne parvient pas à lire `input`."
```

Lorsque le [plugin loose](/plugins/loose/) est chargé, le mode souple analyse les heures accompagnées de périodes de la journée localisées, les heures séparées par un point dans les locales qui les emploient et les chaînes d’horodatage informelles, en renvoyant `null` en cas d’entrée illisible :

```js
import { time } from 'native-dates';
import '@native-dates/plugins/loose';

time('오후 2:30', { loose: true, locale: 'ko' })?.toString(); // '14:30:00'
time('14.30', { loose: true, locale: 'fi' })?.toString(); // '14:30:00'
time('Mon, 16 Nov 2026 17:30:00 GMT', {
  zone: 'America/New_York',
  loose: true,
})?.toString(); // '12:30:00'
time('whenever', { loose: true }); // null
```
:::

## Entrées acceptées

Les chaînes au format 12 heures acceptent des heures de 1 à 12 suivies de AM ou PM. Minuit correspond à 12 AM et midi à 12 PM.

| Entrée | Exemple | Lecture |
|---|---|---|
| Chaîne horaire 12 heures | `'9am'`, `'5:30pm'`, `'12:15 a.m.'` | Lit des heures de 1 à 12 suivies de `am` ou `pm`, avec minutes, secondes et fractions optionnelles. |
| Chaîne horaire 24 heures | `'09:00'`, `'14h30'`, `'17:30:15.250'` | Lit des chaînes horaires sur 24 heures avec deux-points ou `h` entre l’heure et les minutes, jusqu’aux nanosecondes. |
| Chaîne d’instant ISO | `'2026-11-16T17:30:00Z'` | Lit l’heure locale de cet instant dans le fuseau horaire fourni ou le fuseau horaire configuré par défaut. |
| Nombres horaires | `time(9)`, `time(9, 30)`, `time(17, 30, 15)` | Prend des entiers pour l’heure, ainsi que les minutes et les secondes en option. |
| Objet de champs | `{ hour: 9, minute: 30, millisecond: 250 }` | Lit des champs horaires au singulier ou au pluriel et rejette les nombres hors limites. |
| [DateTime](/api/date-time/) ou Temporal | `time(dt, 'Asia/Tokyo')`, `Temporal.PlainTime` | Extrait l’heure du jour en convertissant les instants vers le fuseau horaire fourni s’il est précisé. |
| Date JavaScript | `time(jsDate, 'America/New_York')` | Lit l’heure du jour de cet instant dans le fuseau horaire fourni ou le fuseau horaire configuré par défaut. |

:::tip[Lire l’heure du jour actuelle]
Lisez l’horloge en direct dans n’importe quel fuseau horaire via [`now()`](/api/datetime-fn/#now), par exemple `now('Europe/Berlin').time`.
:::
