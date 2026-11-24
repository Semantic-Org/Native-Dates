---
source: e681c4b680b0
title: monthDay()
lede: Créer un MonthDay à partir d’une chaîne mois-jour, de nombres, d’un objet de champs ou d’une date.
---

## Lire des valeurs mois-jour

:::entry
### `monthDay()` :kind[function]

```js signature
monthDay(input, options?): MonthDay
monthDay(input, zone?): MonthDay
monthDay(month, day): MonthDay
```

Crée un [`MonthDay`](/api/month-day/) à partir d’une chaîne mois en premier, de nombres numérotés à partir de 1, d’un objet de champs ou d’une date existante. Le 29 février est accepté afin de préserver les anniversaires tombant un jour bissextile.

```js title="birthday.js"
import { datetime, monthDay } from 'native-dates';

const fromIso = monthDay('10-17');
const fromSlash = monthDay('10/17');
const fromNumbers = monthDay(2, 29);
const fromFields = monthDay({ month: 10, day: 17 });
const fromInstant = monthDay(datetime('2026-10-18T02:00:00Z'), 'America/Los_Angeles');

fromNumbers.toString(); // '02-29'
fromInstant.toString(); // '10-17'
```

**Paramètres**

```params
- name: input
  type: MonthDayInput | number | string
  required: true
  description: Chaîne mois en premier, objet de champs, date, horodatage ou mois (`month`) numéroté à partir de 1 (de 1 à 12).
- name: options
  type: Zone | MonthDayOptions | number | string
  description: Fuseau horaire ou objet d’options, ou numéro de jour entier (`day`) de 1 à 31 lors d’un appel avec deux nombres.
  options:
    - name: zone
      type: Zone
      description: Fuseau horaire utilisé pour lire le mois et le jour d’une chaîne d’instant, d’un `DateTime` ou d’un objet `Date`.
    - name: locale
      type: Locale
      description: Étiquette de locale BCP 47 portée par le `MonthDay` renvoyé et par toute valeur qui en dérive.
    - name: dayFirst
      type: boolean
      default: 'false'
      description: "Lecture jour en premier des chaînes séparées par une barre oblique ou un point, ainsi que des chaînes séparées par un tiret comportant un nombre à un chiffre, comme `dayMonth()`."
    - name: loose
      type: boolean
      default: 'false'
      description: "Lecture des noms de mois en anglais ou localisés comme `'17 février'` et renvoi de `null` en cas d’entrée illisible avec `@native-dates/plugins/loose`."
```

**Valeur de retour**

```returns
type: MonthDay
description: "Instance `MonthDay` sans année, ou `null` lorsque le mode souple ne parvient pas à lire `input`."
```

Lorsque le [plugin loose](/plugins/loose/) est chargé, le mode souple analyse les noms de mois en anglais ou dans la `locale` active et renvoie `null` en cas d’entrée illisible :

```js
import { monthDay } from 'native-dates';
import '@native-dates/plugins/loose';

monthDay('Oct 17', { loose: true })?.toString(); // '10-17'
monthDay('17 février', { loose: true, locale: 'fr' })?.toString(); // '02-17'
monthDay('whenever', { loose: true }); // null
```
:::

:::entry
### `dayMonth()` :kind[function]

```js signature
dayMonth(input, options?): MonthDay
dayMonth(day, month): MonthDay
```

Lit les chaînes et les nombres jour en premier, dans l’ordre employé dans la majeure partie du monde, comme `'17/10'`. Appeler cette fonction fabrique lit toujours le jour en premier, indépendamment de la configuration globale.

Les chaînes ISO sur deux chiffres séparées par un tiret, comme `'10-17'`, restent lues mois en premier par les deux fonctions. Les sorties JSON effectuent ainsi partout un aller-retour vers la même date.

**Paramètres**

```params
- name: input
  type: MonthDayInput | number | string
  required: true
  description: Chaîne jour en premier comme `'17/10'`, toute valeur `MonthDayInput` ou numéro de jour entier (`day`) de 1 à 31.
- name: options
  type: Zone | MonthDayOptions | number | string
  description: Fuseau horaire, options de lecture incluant `locale` ou mois (`month`) numéroté à partir de 1 (de 1 à 12) lors d’un appel avec deux nombres.
```

**Valeur de retour**

```returns
type: MonthDay
description: "Instance `MonthDay`, ou `null` lorsque le mode souple ne parvient pas à lire `input`."
```

```js
import { dayMonth } from 'native-dates';

dayMonth('17/10').toString(); // '10-17'
dayMonth('06.05').toString(); // '05-06'
dayMonth(17, 10).toString(); // '10-17'
dayMonth('10-17').toString(); // '10-17'
```
:::

## Entrées acceptées

Les chaînes numériques sans année ne sont jamais confiées à l’analyseur `Date` natif. On évite ainsi qu’il n’invente une année par défaut non bissextile ou qu’un jour invalide ne bascule sur le mois suivant.

| Entrée | Exemple | Lecture |
|---|---|---|
| Chaîne mois-jour ISO | `'10-17'`, `'--10-17'` | Lit le mois et le jour sur deux chiffres mois en premier avec [`monthDay()`](#monthday) comme avec [`dayMonth()`](#daymonth). |
| Paire numérique sous forme de chaîne | `'10/17'`, `'17.10'`, `'5-6'` | Lit les nombres séparés par `/`, `.` ou `-`, mois en premier avec `monthDay()` et jour en premier avec `dayMonth()`. |
| Deux nombres | `monthDay(10, 17)`, `dayMonth(17, 10)` | Prend deux entiers dans l’ordre mois puis jour, ou jour puis mois. |
| Objet de champs | `{ month: 10, day: 17 }` | Lit des champs numérotés à partir de 1 et rejette les paires impossibles comme le 31 avril. |
| Date ou horodatage | `'1990-10-17'`, `datetime(...)`, `new Date()` | Extrait le mois et le jour calendaires dans le fuseau horaire fourni ou configuré et écarte l’année. |
| Nom de mois en mode souple | `'Oct 17'`, `'17 février'` | Lit les noms de mois et ordinaux en anglais ou dans la locale active, dans un ordre ou dans l’autre, en mode souple. |
| Valeur Temporal | `Temporal.PlainMonthDay`, `Temporal.PlainDate` | Encapsule directement les valeurs Temporal ISO 8601. |

:::tip[Lire le mois et le jour actuels]
Lisez le mois et le jour courants dans n’importe quel fuseau horaire via [`today()`](/api/date-fn/#today), par exemple `today('Europe/Berlin').monthDay`.
:::
