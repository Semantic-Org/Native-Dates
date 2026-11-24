---
source: 3e14665094ab
title: Time
lede: Une heure du jour sans date calendaire ni fuseau horaire.
---

## Créer un Time

Analysez des chaînes horaires sur 12 ou 24 heures, passez des nombres d’heures et de minutes ou convertissez une valeur existante avec [`time()`](/api/time-fn/). Les instances sont immuables : chaque méthode qui modifie une valeur en renvoie une nouvelle.

```js title="create.js"
import { time } from 'native-dates';

const morning = time('9:30am');
const evening = time('17:30');
const alarm = time(6, 45);
```

Lisez directement l’heure locale du jour depuis n’importe quel [`DateTime`](/api/date-time/) grâce à sa propriété `time` :

```js
import { datetime, now } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
standup.time.toString(); // '09:30:00'
const currentClock = now().time;
```

## Propriétés

Les propriétés lisent les champs d’horloge sur 24 heures, de l’heure jusqu’à la nanoseconde.

| Propriété | Type | Description |
|---|---|---|
| `text` | `string` | Heure du jour formatée selon la locale, comme `'9:30 AM'`. |
| `hour`, `minute`, `second` | `number` | Champs d’horloge sur 24 heures (0–23, 0–59, 0–59). |
| `millisecond`, `microsecond`, `nanosecond` | `number` | Champs d’horloge inférieurs à la seconde (0–999). |

## Combinaison et champs

Placez une heure du jour sur une date calendaire, ou remplacez des champs horaires précis.

:::entry
### `on()` :kind[method]

```js signature
t.on(date, zone?): DateTime
```

Combine cette heure du jour avec une date calendaire dans un fuseau horaire et renvoie un [`DateTime`](/api/date-time/). C’est le pendant de [`at()`](/api/calendar-date/#at) sur un [`CalendarDate`](/api/calendar-date/).

**Paramètres**

```params
- name: date
  type: CalendarDateInput
  required: true
  description: Chaîne de date ISO, `CalendarDate`, `DateTime`, objet de champs ou `Date`.
- name: zone
  type: Zone
  description: Nom de fuseau horaire IANA, décalage UTC fixe ou `'UTC'`. Fuseau horaire configuré par défaut.
```

**Valeur de retour**

```returns
type: DateTime
description: Nouveau `DateTime` à la date `date`, à cette heure du jour, dans `zone`.
```

```js
const opens = time('9:30am');

opens.on('2026-11-16', 'America/New_York').toString(); // '2026-11-16T14:30:00.000Z'
```
:::

:::entry
### `set()` :kind[method]

```js signature
t.set(fields): Time
t.set(unit, value): Time
```

Renvoie un nouveau `Time` avec un ou plusieurs champs horaires remplacés. Les valeurs hors plage, comme 75 minutes, lèvent une `RangeError`.

**Paramètres**

```params
- name: fields
  type: DateTimeFields | Unit
  required: true
  description: Objet de champs horaires, ou nom d’unité horaire en anglais accompagné de `value`.
- name: value
  type: number
  description: Valeur entière pour l’unité `unit` indiquée.
```

**Valeur de retour**

```returns
type: Time
description: Nouveau `Time` avec les champs horaires mis à jour.
```

```js
const reminder = time('9:30am');

reminder.set('minute', 45).toString(); // '09:45:00'
reminder.set({ hour: 17, minute: 0 }).toString(); // '17:00:00'
```
:::

## Arithmétique et arrondis

Ajoutez ou soustrayez des unités horaires, alignez sur les limites d’une unité ou arrondissez à un pas précis. Les unités calendaires comme les jours et les semaines lèvent une `RangeError`, car une heure du jour n’a pas de date associée.

:::note[Passage à minuit]
L’arithmétique horaire boucle sur le cycle de 24 heures comme le cadran d’une horloge : ajouter 2 heures à `23:00` renvoie `01:00`. Associez d’abord l’heure à une date avec [`on()`](#on) lorsque le franchissement de minuit doit faire avancer le jour calendaire.
:::

:::entry
### `plus()` :kind[method]

```js signature
t.plus(amount, unit?): Time
t.add(amount, unit?): Time
```

Avance sur l’horloge de 24 heures et renvoie un nouveau `Time`, en rebouclant après minuit si nécessaire. Également accessible sous l’alias `add()`.

**Paramètres**

```params
- name: amount
  type: DurationInput
  required: true
  description: Quantité numérique associée à `unit`, instance de `Duration`, chaîne de durée (expression en anglais, format compact ou ISO), objet de champs ou millisecondes.
- name: unit
  type: Unit
  description: Nom d’unité horaire en anglais lorsque `amount` est un nombre, comme `'hours'` ou `'minutes'`.
```

**Valeur de retour**

```returns
type: Time
description: Nouveau `Time` ramené sur le cycle de 24 heures.
```

```js
time('9:00am').plus(90, 'minutes').toString(); // '10:30:00'
time('23:00').plus('2h').toString(); // '01:00:00'
```
:::

:::entry
### `minus()` :kind[method]

```js signature
t.minus(amount, unit?): Time
t.subtract(amount, unit?): Time
```

Recule sur l’horloge de 24 heures, en rebouclant avant minuit si nécessaire. Accepte les mêmes entrées que [`plus()`](#plus) et dispose aussi de l’alias `subtract()`.

**Paramètres**

```params
- name: amount
  type: DurationInput
  required: true
  description: Quantité numérique associée à `unit`, instance de `Duration`, chaîne de durée (expression en anglais, format compact ou ISO), objet de champs ou millisecondes.
- name: unit
  type: Unit
  description: Nom d’unité horaire en anglais lorsque `amount` est un nombre.
```

**Valeur de retour**

```returns
type: Time
description: Nouveau `Time` ramené sur le cycle de 24 heures.
```

```js
time('00:30').minus(45, 'minutes').toString(); // '23:45:00'
```
:::

:::entry
### `startOf()` :kind[method]

```js signature
t.startOf(unit): Time
```

Met à zéro tous les champs horaires inférieurs à l’unité indiquée.

**Paramètres**

```params
- name: unit
  type: Unit
  required: true
  description: Unité horaire en anglais, de `'hour'` à `'nanosecond'`.
```

**Valeur de retour**

```returns
type: Time
description: Nouveau `Time` au début de l’unité `unit`.
```

```js
time('14:37:22').startOf('hour').toString(); // '14:00:00'
```
:::

:::entry
### `endOf()` :kind[method]

```js signature
t.endOf(unit): Time
```

Se place à la dernière milliseconde de l’unité horaire indiquée.

**Paramètres**

```params
- name: unit
  type: Unit
  required: true
  description: Unité horaire en anglais, de `'hour'` à `'nanosecond'`.
```

**Valeur de retour**

```returns
type: Time
description: Nouveau `Time` à la dernière milliseconde de l’unité `unit`.
```

```js
time('14:37:22').endOf('hour').toString(); // '14:59:59.999'
```
:::

:::entry
### `startOfNext()` :kind[method]

```js signature
t.startOfNext(unit): Time
```

Avance au début de l’unité horaire suivant celle qui contient cette heure, en rebouclant à minuit. Avance systématiquement vers l’unité suivante : appeler `startOfNext('hour')` sur `14:00:00` renvoie `15:00:00`.

**Paramètres**

```params
- name: unit
  type: Unit
  required: true
  description: Unité horaire en anglais, de `'hour'` à `'nanosecond'`.
```

**Valeur de retour**

```returns
type: Time
description: Nouveau `Time` au début de l’unité `unit` suivante.
```

```js
time('14:37:22').startOfNext('hour').toString(); // '15:00:00'
time('23:37:22').startOfNext('hour').toString(); // '00:00:00'
```
:::

:::entry
### `startOfPrevious()` :kind[method]

```js signature
t.startOfPrevious(unit): Time
```

Recule au début de l’unité horaire précédant celle qui contient cette heure, en rebouclant à minuit.

**Paramètres**

```params
- name: unit
  type: Unit
  required: true
  description: Unité horaire en anglais, de `'hour'` à `'nanosecond'`.
```

**Valeur de retour**

```returns
type: Time
description: Nouveau `Time` au début de l’unité `unit` précédente.
```

```js
time('14:37:22').startOfPrevious('hour').toString(); // '13:00:00'
time('00:15:00').startOfPrevious('hour').toString(); // '23:00:00'
```
:::

:::entry
### `round()` :kind[method]

```js signature
t.round(unit): Time
t.round(increment, unit): Time
```

Arrondit à l’unité horaire ou au pas le plus proche, en arrondissant au supérieur en cas d’égalité à mi-chemin.

**Paramètres**

```params
- name: increment
  type: number | Unit
  required: true
  description: Pas qui divise exactement l’unité immédiatement supérieure, ou unité cible `unit` pour un arrondi à `1`.
- name: unit
  type: Unit
  description: Unité horaire en anglais à arrondir, de `'hour'` à `'nanosecond'`.
```

**Valeur de retour**

```returns
type: Time
description: Nouveau `Time` arrondi.
```

```js
const checkin = time('14:36:00');

checkin.round('hour').toString(); // '15:00:00'
checkin.round(15, 'minutes').toString(); // '14:30:00'
```
:::

:::entry
### `floor()` :kind[method]

```js signature
t.floor(unit): Time
t.floor(increment, unit): Time
```

Arrondit à l’inférieur vers le début d’une unité horaire ou d’un pas. Accepte les mêmes arguments que [`round()`](#round).

```js
time('14:29').floor(15, 'minutes').toString(); // '14:15:00'
```
:::

:::entry
### `ceil()` :kind[method]

```js signature
t.ceil(unit): Time
t.ceil(increment, unit): Time
```

Arrondit au supérieur vers l’unité horaire ou le pas suivant. Accepte les mêmes arguments que [`round()`](#round).

```js
time('14:01').ceil(15, 'minutes').toString(); // '14:15:00'
```
:::

## Comparer des heures

Les comparaisons ordonnent les heures au sein d’une même journée, de minuit jusqu’à la fin de la journée. Les opérateurs relationnels comme `<` lèvent une `RangeError` : comparez donc les valeurs avec des méthodes dédiées ou avec [`compare()`](/api/compare/).

:::entry
### `equals()` :kind[method]

```js signature
t.equals(other): boolean
```

Renvoie `true` lorsque les deux valeurs représentent exactement la même heure du jour.

**Paramètres**

```params
- name: other
  type: TimeInput
  required: true
  description: Autre `Time` ou toute entrée acceptée par `time()`.
```

**Valeur de retour**

```returns
type: boolean
description: '`true` si les deux valeurs correspondent à la nanoseconde près.'
```

```js
time('5:30pm').equals('17:30'); // true
```
:::

:::entry
### `isBefore()` :kind[method]

```js signature
t.isBefore(other): boolean
```

Renvoie `true` si cette heure précède l’autre dans la journée.

```js
time('9:00am').isBefore('5:00pm'); // true
```
:::

:::entry
### `isAfter()` :kind[method]

```js signature
t.isAfter(other): boolean
```

Renvoie `true` si cette heure suit l’autre dans la journée.

```js
time('5:00pm').isAfter('9:00am'); // true
```
:::

:::entry
### `isSame()` :kind[method]

```js signature
t.isSame(other, unit?): boolean
```

Vérifie si une autre heure tombe dans la même unité horaire, comme la même heure ou la même minute. Appeler `isSame()` sans unité vérifie l’égalité exacte.

**Paramètres**

```params
- name: other
  type: TimeInput
  required: true
  description: Heure du jour à laquelle comparer.
- name: unit
  type: Unit
  description: Unité horaire en anglais à comparer, comme `'hour'` ou `'minute'`.
```

**Valeur de retour**

```returns
type: boolean
description: '`true` lorsque les deux heures partagent la même unité `unit`.'
```

```js
time('9:05am').isSame('9:45am', 'hour'); // true
time('9:05am').isSame('10:05am', 'hour'); // false
```
:::

## Mesurer des écarts

:::entry
### `until()` :kind[method]

```js signature
t.until(other): Duration
t.until(other, unit): number
```

Mesure l’écart signé entre cette heure et une autre au sein de la même journée, en renvoyant une durée négative lorsque la cible est antérieure. Passez un nom d’unité en anglais pour obtenir la durée totale sous forme de nombre.

**Paramètres**

```params
- name: other
  type: TimeInput
  required: true
  description: Heure cible jusqu’à laquelle mesurer.
- name: unit
  type: Unit
  description: Unité horaire en anglais dans laquelle obtenir la durée totale sous forme de nombre à virgule flottante.
```

**Valeur de retour**

```returns
type: Duration | number
description: Instance de `Duration` équilibrée jusqu’aux heures, ou nombre lorsque `unit` est fourni.
```

```js
const opens = time('9:00am');
const closes = time('5:30pm');

opens.until(closes).format('long', 'en-US'); // '8 hours, 30 minutes'
opens.until(closes, 'hours'); // 8.5
time('22:00').until('02:00', 'hours'); // -20
```
:::

:::entry
### `since()` :kind[method]

```js signature
t.since(other): Duration
t.since(other, unit): number
```

Mesure le temps écoulé depuis une heure antérieure de la même journée. Passez un nom d’unité en anglais pour obtenir la durée totale sous forme de nombre.

```js
time('5:00pm').since('9:00am', 'hours'); // 8
```
:::

:::entry
### `to()` :kind[method]

```js signature
t.to(end): TimeRange
t.to(count, unit): TimeRange
t.for(length): TimeRange
t.for(count, unit): TimeRange
```

Crée une [`TimeRange`](/api/ranges/#timerange) semi-ouverte qui commence à cette heure et s’étend jusqu’à l’heure finale ou jusqu’au terme de la durée indiquée (borne supérieure exclue). Si la fin est antérieure au début, la plage franchit minuit sur le cycle de 24 heures. Utilisez `for()` pour passer explicitement une durée (les bornes de fin et les nombres sans unité sont refusés).

**Paramètres**

```params
- name: end
  type: TimeInput | DurationInput | number
  required: true
  description: Heure de fin, durée horaire ou quantité numérique `count` associée à `unit`.
- name: unit
  type: Unit
  description: Nom d’unité horaire en anglais lorsque le premier argument est une quantité numérique, comme `'hours'` ou `'minutes'`.
```

**Valeur de retour**

```returns
type: TimeRange
description: Plage `TimeRange` semi-ouverte commençant à cette heure.
```

```js
time('9:00am').to('5:00pm').duration.hours; // 8
time('9:00am').for(90, 'minutes').end.toString(); // '10:30:00'
time('22:00').to('06:00').duration.hours; // 8
```
:::

## Formatage et conversion

:::entry
### `format()` :kind[method]

```js signature
t.format(spec?, locale?): string
```

Formate l’heure du jour à l’aide de préréglages intégrés, de noms personnalisés définis dans [`configure()`](/api/configure/), d’objets d’options ou de motifs de jetons.

Les préréglages localisés `'LT'` et `'LTS'` sont intégrés, et les objets d’options ignorent automatiquement les clés de date et de fuseau horaire. Consultez [Formatage](/guides/formatting/) pour la référence complète des préréglages et des jetons.

**Paramètres**

```params
- name: spec
  type: FormatSpec
  default: "'short'"
  description: Nom de préréglage intégré ou configuré, objet d’options `Intl` ou motif de jetons.
- name: locale
  type: string
  description: Étiquette de locale BCP 47 remplaçant la locale de cette heure ou la locale configurée pour cet appel.
```

**Valeur de retour**

```returns
type: string
description: Heure formatée sous forme de chaîne.
```

```js
const afternoon = time('17:30:15');

afternoon.format('short', 'en-US'); // '5:30 PM'
afternoon.format('LTS', 'en-US'); // '5:30:15 PM'
afternoon.format('HH:mm:ss'); // '17:30:15'
afternoon.format('h:mm a'); // '5:30 pm'
afternoon.format({ hour12: false }, 'en-US'); // '17:30'
```
:::

:::entry
### `locale()` :kind[method]

```js signature
t.locale(): Locale | undefined
t.locale(tag): Time
```

Lit la locale portée par cette heure, ou renvoie une copie formatée dans une autre locale pour les aperçus textuels, les préréglages et toutes les valeurs qui en dérivent. Passer une étiquette vide efface la locale portée, et [`lang()`](#lang) sert d’alias.

**Paramètres**

```params
- name: tag
  type: Locale | null | undefined
  description: Étiquette de locale BCP 47 à conserver, ou `null` pour effacer une étiquette existante.
```

**Valeur de retour**

```returns
type: Time | Locale | undefined
description: Étiquette active en l’absence d’argument, ou nouveau `Time` portant `tag`.
```

```js
const closing = time('17:30').locale('ko-KR');

closing.locale(); // 'ko-KR'
closing.text; // '오후 5:30'
closing.on('2026-05-01', 'Asia/Seoul').locale(); // 'ko-KR'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
t.lang(): Locale | undefined
t.lang(tag): Time
```

Alias court de [`locale()`](#locale) pour lire ou associer une étiquette de locale BCP 47 à cette heure.
:::

:::entry
### `toString()` :kind[method]

```js signature
t.toString(): string
t.toJSON(): string
```

Renvoie l’heure au format ISO 8601 sur 24 heures, en n’incluant les fractions de seconde (par groupes de trois chiffres) que lorsqu’elles ne sont pas nulles. `toJSON()` renvoie la même chaîne pour `JSON.stringify()`.

**Valeur de retour**

```returns
type: string
description: Chaîne horaire ISO 8601, comme `'17:30:00'` ou `'17:30:15.250'`.
```

```js
time('5:30pm').toString(); // '17:30:00'
time('17:30:15.25').toString(); // '17:30:15.250'
JSON.stringify({ opens: time('9am') }); // '{"opens":"09:00:00"}'
```
:::

:::entry
### `as()` :kind[method]

```js signature
t.as('time'): Time
```

Renvoie ce `Time` lorsque `'time'` est demandé dans une chaîne de conversion générique, et lève une `RangeError` pour les autres types.
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
t.toTemporal(): Temporal.PlainTime
```

Renvoie l’instance `Temporal.PlainTime` sous-jacente.
:::

:::entry
### `valueOf()` :kind[method]

```js signature
t.valueOf(): never
```

Lève une `RangeError` afin que les opérateurs numériques ne convertissent jamais silencieusement une heure du jour en nombre.
:::
