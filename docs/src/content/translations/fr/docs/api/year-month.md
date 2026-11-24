---
source: 09d43cd55ced
title: YearMonth
lede: Une année et un mois calendaires sans jour, pour les périodes de facturation, les dates d’expiration de carte et les sélecteurs de mois.
---

## Créer un YearMonth

Créez une instance à partir d’une chaîne ISO, d’une année et d’un mois numériques ou d’une date existante avec [`yearMonth()`](/api/year-month-fn/), ou analysez les dates d’expiration de carte mois en premier avec [`monthYear()`](/api/year-month-fn/#monthyear). Les instances sont immuables : chaque méthode qui modifie une valeur en renvoie une nouvelle.

```js title="create.js"
import { monthYear, yearMonth } from 'native-dates';

const billing = yearMonth('2026-11');
const quarterEnd = yearMonth(2026, 12);
const expiry = monthYear('11/26');
```

Extrayez l’année et le mois de n’importe quelle [date calendaire](/api/calendar-date/) ou de n’importe quel [instant](/api/date-time/) grâce à sa propriété `yearMonth`, ou convertissez au fil d’une chaîne d’appels avec `as('yearMonth')` :

```js
import { date, datetime, today } from 'native-dates';

date('2026-11-16').yearMonth.toString(); // '2026-11'
datetime('2026-11-01T02:00:00Z', 'America/Los_Angeles').as('yearMonth').toString(); // '2026-10'
const currentMonth = today().yearMonth;
```

## Propriétés

Les propriétés donnent accès à l’année ISO, au mois et aux bornes calendaires du mois.

| Propriété | Type | Description |
|---|---|---|
| `text` | `string` | Mois et année formatés selon la locale, comme `'Nov 2026'`. |
| `year`, `month` | `number` | Année calendaire et mois numéroté à partir de 1, de 1 à 12. |
| `quarter` | `number` | Trimestre calendaire de 1 à 4. |
| `daysInMonth`, `daysInYear` | `number` | Nombre de jours dans ce mois (de 28 à 31) et dans cette année (365 ou 366). |
| `start`, `end` | [`CalendarDate`](/api/calendar-date/) | Premier et dernier jour calendaire de ce mois. |
| `YearMonth.century` | `number` | Siècle de base ajouté aux années sur deux chiffres dans [`monthYear()`](/api/year-month-fn/#monthyear), valant `2000` par défaut. |

## Arithmétique et champs

Avancez ou reculez par mois, trimestres ou années, remplacez des champs ou choisissez un jour précis du mois.

:::note[Unités de mois et d’année uniquement]
Les unités plus petites que le mois lèvent une `RangeError`, car un couple année-mois ne porte aucun jour. Appelez d’abord [`on()`](#on) pour fixer un jour si vous devez faire des calculs en semaines ou en jours.
:::

:::entry
### `plus()` :kind[method]

```js signature
ym.plus(amount, unit?): YearMonth
ym.add(amount, unit?): YearMonth
```

Avance d’un nombre d’années, de trimestres ou de mois et renvoie un nouveau `YearMonth`. `add()` sert d’alias.

**Paramètres**

```params
- name: amount
  type: DurationInput
  required: true
  description: Nombre associé à `unit`, instance de `Duration`, chaîne de durée (ISO 8601, abrégée ou en anglais) ou objet de champs.
- name: unit
  type: Unit
  description: Nom d’unité en anglais (mois, trimestre ou année) lorsque `amount` est un nombre.
```

**Valeur de retour**

```returns
type: YearMonth
description: Nouveau `YearMonth` décalé vers l’avant sur le calendrier.
```

```js
const billing = yearMonth('2026-11');

billing.plus(3, 'months').toString(); // '2027-02'
billing.plus('1 year').toString(); // '2027-11'
```
:::

:::entry
### `minus()` :kind[method]

```js signature
ym.minus(amount, unit?): YearMonth
ym.subtract(amount, unit?): YearMonth
```

Recule d’un nombre d’années, de trimestres ou de mois et renvoie une nouvelle instance. Accepte les mêmes entrées que [`plus()`](#plus), avec `subtract()` comme alias.

**Paramètres**

```params
- name: amount
  type: DurationInput
  required: true
  description: Nombre associé à `unit`, instance de `Duration`, chaîne de durée (ISO 8601, abrégée ou en anglais) ou objet de champs.
- name: unit
  type: Unit
  description: Nom d’unité en anglais (mois, trimestre ou année) lorsque `amount` est un nombre.
```

**Valeur de retour**

```returns
type: YearMonth
description: Nouveau `YearMonth` décalé vers l’arrière sur le calendrier.
```

```js
yearMonth('2026-11').minus(1, 'year').toString(); // '2025-11'
```
:::

:::entry
### `set()` :kind[method]

```js signature
ym.set(fields): YearMonth
ym.set(unit, value): YearMonth
```

Renvoie un nouveau `YearMonth` en remplaçant l’année, le mois ou les deux. Les mois hors bornes et les unités plus petites que le mois lèvent une `RangeError`.

**Paramètres**

```params
- name: fields
  type: Partial<YearMonthFields> | Unit
  required: true
  description: Objet contenant les champs `year` ou `month`, ou nom d’unité en anglais.
- name: value
  type: number
  description: Valeur entière associée au nom d’unité indiqué.
```

**Valeur de retour**

```returns
type: YearMonth
description: Nouveau `YearMonth` avec les champs calendaires mis à jour.
```

```js
const billing = yearMonth('2026-11');

billing.set('month', 2).toString(); // '2026-02'
billing.set({ year: 2028, month: 2 }).daysInMonth; // 29
```
:::

:::entry
### `on()` :kind[method]

```js signature
ym.on(day): CalendarDate
```

Place un numéro de jour entier de 1 à 31 dans ce mois et renvoie une [`CalendarDate`](/api/calendar-date/). Le jour 31 est ramené au dernier jour des mois plus courts comme février ou avril, tandis que les nombres en dehors de 1 à 31 lèvent une `RangeError`.

**Paramètres**

```params
- name: day
  type: number | string
  required: true
  description: Jour entier du mois, de 1 à 31.
```

**Valeur de retour**

```returns
type: CalendarDate
description: Instance de `CalendarDate` correspondant à ce jour du mois.
```

```js
yearMonth('2026-11').on(15).toString(); // '2026-11-15'
yearMonth('2026-02').on(31).toString(); // '2026-02-28'
yearMonth('2028-02').on(31).toString(); // '2028-02-29'
```
:::

## Comparaison et appartenance

Comparez des couples année-mois par ordre chronologique ou vérifiez si un jour calendaire tombe dans le mois. Les opérateurs relationnels comme `<` lèvent une erreur, tandis que les tableaux se trient directement avec [`compare()`](/api/compare/) et les [fonctions de bornes](/api/compare/#earliest).

:::entry
### `compare()` :kind[method]

```js signature
ym.compare(other): -1 | 0 | 1
```

Ordonne ce couple année-mois par rapport à un autre en renvoyant un nombre négatif, nul ou positif pour le tri. Si vous passez une date complète ou un horodatage, la comparaison porte sur le mois qui contient cette valeur.

**Paramètres**

```params
- name: other
  type: YearMonthInput
  required: true
  description: Autre `YearMonth` ou toute entrée acceptée par `yearMonth()`.
```

**Valeur de retour**

```returns
type: -1 | 0 | 1
description: "`-1` si ce couple année-mois est antérieur, `0` s’ils sont égaux et `1` s’il est postérieur."
```

```js
yearMonth('2026-05').compare('2026-11'); // -1
yearMonth('2026-11').compare('2026-11-16'); // 0
```
:::

:::entry
### `equals()` :kind[method]

```js signature
ym.equals(other): boolean
```

Renvoie `true` lorsque les deux valeurs représentent la même année et le même mois.

```js
yearMonth('2026-11').equals(yearMonth(2026, 11)); // true
```
:::

:::entry
### `isBefore()` :kind[method]

```js signature
ym.isBefore(other): boolean
```

Renvoie `true` lorsque ce couple année-mois est antérieur à l’autre.

```js
yearMonth('2026-10').isBefore('2026-11'); // true
```
:::

:::entry
### `isAfter()` :kind[method]

```js signature
ym.isAfter(other): boolean
```

Renvoie `true` lorsque ce couple année-mois est postérieur à l’autre.

```js
yearMonth('2026-12').isAfter('2026-11'); // true
```
:::

:::entry
### `contains()` :kind[method]

```js signature
ym.contains(day): boolean
ym.includes(day): boolean
```

Renvoie `true` lorsque la date calendaire ou l’horodatage donné tombe dans cette année et ce mois. `includes()` sert d’alias.

**Paramètres**

```params
- name: day
  type: CalendarDateInput
  required: true
  description: Chaîne de date, `CalendarDate`, `DateTime`, objet de champs ou `Date`.
```

**Valeur de retour**

```returns
type: boolean
description: "`true` si `day` tombe dans ce mois."
```

```js
const nov = yearMonth('2026-11');

nov.contains('2026-11-16'); // true
nov.contains('2026-12-01'); // false
```
:::

:::entry
### `isPast()` :kind[method]

```js signature
ym.isPast(zone?): boolean
```

Renvoie `true` dès que ce mois entier est antérieur au mois courant dans le fuseau horaire indiqué ou configuré.

```js
yearMonth('2020-01').isPast('UTC'); // true
```
:::

:::entry
### `isFuture()` :kind[method]

```js signature
ym.isFuture(zone?): boolean
```

Renvoie `true` tant que ce mois reste postérieur au mois courant dans le fuseau horaire indiqué ou configuré.

```js
yearMonth('2099-01').isFuture('UTC'); // true
```
:::

:::entry
### `isLeapYear()` :kind[method]

```js signature
ym.isLeapYear(): boolean
```

Renvoie `true` lorsque l’année calendaire de ce mois compte 366 jours.

```js
yearMonth('2028-02').isLeapYear(); // true
yearMonth('2026-02').isLeapYear(); // false
```
:::

## Mesurer des durées

:::entry
### `until()` :kind[method]

```js signature
ym.until(other): Duration
ym.until(other, unit): number
```

Mesure la durée de ce mois jusqu’à un autre, en renvoyant une durée négative lorsque la cible est antérieure. La [`Duration`](/api/duration/) renvoyée conserve le début de ce mois comme point d’ancrage afin que les mois et les années puissent être totalisés dans n’importe quelle unité.

**Paramètres**

```params
- name: other
  type: YearMonthInput
  required: true
  description: Couple année-mois cible jusqu’auquel mesurer.
- name: unit
  type: Unit
  description: Nom d’unité en anglais dans lequel obtenir la durée totale sous forme de nombre à virgule flottante.
```

**Valeur de retour**

```returns
type: Duration | number
description: Instance de `Duration` en années et mois, ou nombre lorsque `unit` est fourni.
```

```js
const start = yearMonth('2026-03');

start.until('2027-06').toString(); // 'P1Y3M'
start.until('2027-06', 'months'); // 15
```
:::

:::entry
### `since()` :kind[method]

```js signature
ym.since(other): Duration
ym.since(other, unit): number
```

Mesure la durée écoulée depuis un couple année-mois antérieur. Passez un nom d’unité en anglais pour obtenir le total sous forme de nombre.

```js
yearMonth('2026-11').since('2026-05', 'months'); // 6
```
:::

## Formatage et conversion

:::entry
### `format()` :kind[method]

```js signature
ym.format(spec?, locale?): string
```

Formate l’année et le mois à l’aide de préréglages nommés, d’objets d’options `Intl` ou de motifs de jetons intégrés comme `'MM/YY'`. Les objets d’options partagés ignorent automatiquement les clés de jour, d’horloge et de fuseau horaire.

Les préréglages standards et localisés n’affichent que l’année et le mois, et les formats personnalisés enregistrés dans [`configure()`](/api/configure/) fonctionnent aussi ici. Consultez [Formatage](/guides/formatting/) pour les tableaux complets des préréglages et des jetons.

**Paramètres**

```params
- name: spec
  type: FormatSpec
  default: "'medium'"
  description: Nom de préréglage comme `'medium'` ou `'long'`, objet d’options `Intl` ou motif de jetons.
- name: locale
  type: Locale
  description: Étiquette de locale BCP 47 remplaçant la locale de ce mois ou la locale configurée pour cet appel.
```

**Valeur de retour**

```returns
type: string
description: Mois et année formatés sous forme de chaîne.
```

```js
const nov = yearMonth('2026-11');

nov.format('short', 'en-US'); // '11/2026'
nov.format('medium', 'en-US'); // 'Nov 2026'
nov.format('long', 'en-US'); // 'November 2026'
nov.format('L', 'en-US'); // '11/2026'
nov.format('MM/YY'); // '11/26'
```
:::

:::entry
### `locale()` :kind[method]

```js signature
ym.locale(): Locale | undefined
ym.locale(tag): YearMonth
```

Lit la locale portée par ce mois, ou renvoie une copie formatée dans une autre locale pour les aperçus textuels, les préréglages et toutes les valeurs qui en dérivent. Passer une étiquette vide efface la locale portée, et [`lang()`](#lang) sert d’alias.

**Paramètres**

```params
- name: tag
  type: Locale | null | undefined
  description: Étiquette de locale BCP 47 à conserver, ou `null` pour effacer une étiquette existante.
```

**Valeur de retour**

```returns
type: YearMonth | Locale | undefined
description: Étiquette active en l’absence d’argument, ou nouveau `YearMonth` portant `tag`.
```

```js
const may = yearMonth('2026-05').locale('ru');

may.locale(); // 'ru'
may.format('long'); // 'май 2026 г.'
may.on(1).format('long'); // '1 мая 2026 г.'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
ym.lang(): Locale | undefined
ym.lang(tag): YearMonth
```

Alias court de [`locale()`](#locale) pour lire ou associer une étiquette de locale BCP 47 à ce mois.
:::

:::entry
### `as()` :kind[method]

```js signature
ym.as('yearMonth'): YearMonth
```

Renvoie cette instance lorsque `'yearMonth'` est demandé dans une chaîne de conversion générique, et lève une `RangeError` pour les autres types.
:::

:::entry
### `toString()` :kind[method]

```js signature
ym.toString(): string
ym.toJSON(): string
```

Renvoie la chaîne année-mois ISO 8601, compatible avec les champs de formulaire HTML de type `month`. `toJSON()` renvoie la même chaîne pour la sérialisation JSON.

**Valeur de retour**

```returns
type: string
description: Chaîne année-mois ISO 8601, comme `'2026-11'`.
```

```js
yearMonth(2026, 11).toString(); // '2026-11'
JSON.stringify({ billing: yearMonth(2026, 11) }); // '{"billing":"2026-11"}'
```
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
ym.toTemporal(): Temporal.PlainYearMonth
```

Renvoie l’instance `Temporal.PlainYearMonth` sous-jacente.
:::

:::entry
### `valueOf()` :kind[method]

```js signature
ym.valueOf(): never
```

Lève une `RangeError` afin que les opérateurs numériques ne convertissent jamais un couple année-mois en nombre. Affinez le type d’une valeur inconnue avec [`isYearMonth()`](/api/kind-of/#isyearmonth) ou [`kindOf()`](/api/kind-of/).
:::
