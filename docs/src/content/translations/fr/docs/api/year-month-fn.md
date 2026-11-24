---
source: 91937c1bc2c8
title: yearMonth()
lede: Créer un YearMonth à partir d’une chaîne année-mois ISO, d’une date d’expiration de carte, de nombres ou d’une date.
---

## Lire des valeurs année-mois

:::entry
### `yearMonth()` :kind[function]

```js signature
yearMonth(input, options?): YearMonth
yearMonth(input, zone?): YearMonth
yearMonth(year, month): YearMonth
```

Crée un [`YearMonth`](/api/year-month/) à partir d’une chaîne année en premier, d’une année et d’un mois numéroté à partir de 1, d’un objet de champs ou de toute date ou tout horodatage dont le jour est écarté. Les entrées manquantes (`null`, `undefined` ou argument omis) lèvent une `TypeError` au lieu de prendre le mois courant par défaut.

```js title="billing.js"
import { datetime, yearMonth } from 'native-dates';

const fromIso = yearMonth('2026-11');
const fromNumbers = yearMonth(2026, 11);
const fromFields = yearMonth({ year: 2026, month: 11 });
const fromDate = yearMonth('2026-11-16');
const fromInstant = yearMonth(datetime('2026-11-01T02:00:00Z'), 'America/Los_Angeles');

fromNumbers.toString(); // '2026-11'
fromInstant.toString(); // '2026-10'
```

**Paramètres**

```params
- name: input
  type: YearMonthInput | number | string
  required: true
  description: Chaîne année-mois ISO, objet de champs, date, horodatage ou année calendaire (`year`).
- name: options
  type: Zone | ReadOptions | number | string
  description: Fuseau horaire ou objet d’options lors de la lecture d’un horodatage ou d’une chaîne en mode souple, ou mois (`month`) numéroté à partir de 1 (de 1 à 12).
  options:
    - name: zone
      type: Zone
      description: Fuseau horaire utilisé pour déterminer le mois calendaire d’une chaîne d’instant, d’un `DateTime` ou d’un objet `Date`.
    - name: locale
      type: Locale
      description: Étiquette de locale BCP 47 portée par le `YearMonth` renvoyé et par toute valeur qui en dérive.
    - name: loose
      type: boolean
      default: 'false'
      description: "Lecture des noms de mois en anglais ou localisés comme `'février 2026'` et renvoi de `null` en cas d’entrée illisible avec `@native-dates/plugins/loose`."
```

**Valeur de retour**

```returns
type: YearMonth
description: "Instance `YearMonth` sans numéro de jour, ou `null` lorsque le mode souple ne parvient pas à lire `input`."
```

Lorsque le [plugin loose](/plugins/loose/) est chargé, le mode souple analyse les noms de mois en anglais ou dans la `locale` active associés à une année sur quatre chiffres et renvoie `null` pour les chaînes illisibles :

```js
import { yearMonth } from 'native-dates';
import '@native-dates/plugins/loose';

yearMonth('Nov 2026', { loose: true })?.toString(); // '2026-11'
yearMonth('février 2026', { loose: true, locale: 'fr' })?.toString(); // '2026-02'
yearMonth('not-a-month', { loose: true }); // null
```
:::

:::entry
### `monthYear()` :kind[function]

```js signature
monthYear(input, options?): YearMonth
monthYear(month, year): YearMonth
```

Lit les chaînes et les nombres avec le mois en premier, dans l’ordre imprimé sur les cartes de paiement comme `'11/26'`. Les années sur deux chiffres de 0 à 99 sont ajoutées à [`YearMonth.century`](/api/year-month/#properties), qui vaut 2000 par défaut.

Les chaînes ISO écrites sous la forme `'2026-11'` continuent d’être lues année en premier par les deux fonctions, afin que les valeurs sérialisées effectuent toujours un aller-retour sans ambiguïté.

**Paramètres**

```params
- name: input
  type: YearMonthInput | number | string
  required: true
  description: Chaîne d’expiration de carte comme `'11/26'`, toute valeur `YearMonthInput` ou mois (`month`) numéroté à partir de 1 (de 1 à 12).
- name: options
  type: Zone | ReadOptions | number | string
  description: Fuseau horaire, options de lecture incluant `locale` ou année (`year`) sur deux ou quatre chiffres lors d’un appel avec deux nombres.
```

**Valeur de retour**

```returns
type: YearMonth
description: "Instance `YearMonth`, ou `null` lorsque le mode souple ne parvient pas à lire `input`."
```

```js
import { monthYear } from 'native-dates';

monthYear('11/26').toString(); // '2026-11'
monthYear('05/2028').toString(); // '2028-05'
monthYear(11, 26).toString(); // '2026-11'
monthYear('2026-11').toString(); // '2026-11'
```
:::

## Entrées acceptées

Les mois vont de 1 pour janvier à 12 pour décembre pour les nombres, les chaînes et les objets de champs.

| Entrée | Exemple | Lecture |
|---|---|---|
| Chaîne année en premier | `'2026-11'`, `'2026/11'`, `'2026年11月'` | Lit une année sur 4 chiffres et un mois sur 1 ou 2 chiffres avec tout séparateur autre qu’une lettre latine ou un deux-points. |
| Chaîne d’expiration de carte | `monthYear('11/26')`, `monthYear('11.2026')` | Lit le mois en premier avec `/`, `-` ou `.` et complète les années sur 2 chiffres via `YearMonth.century`. |
| Deux nombres | `yearMonth(2026, 11)`, `monthYear(11, 26)` | Prend deux entiers dans l’ordre année puis mois, ou mois puis année. |
| Objet de champs | `{ year: 2026, month: 11 }` | Lit des champs calendaires numérotés à partir de 1 et rejette les mois en dehors de 1 à 12. |
| Date ou horodatage | `'2026-11-16'`, `datetime(...)`, `new Date()` | Extrait le mois calendaire dans le fuseau horaire fourni ou le fuseau horaire configuré par défaut et écarte le jour. |
| Nom de mois en mode souple | `'Nov 2026'`, `'février 2026'` | Lit les noms de mois en anglais ou dans la locale active accompagnés d’une année sur 4 chiffres en mode souple. |
| Valeur Temporal | `Temporal.PlainYearMonth`, `Temporal.PlainDate` | Encapsule directement les valeurs Temporal ISO 8601. |

:::tip[Lire le mois courant]
Lisez le mois calendaire courant dans n’importe quel fuseau horaire via [`today()`](/api/date-fn/#today), par exemple `today('Asia/Tokyo').yearMonth`.
:::
