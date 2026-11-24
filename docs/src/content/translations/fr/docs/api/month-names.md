---
source: 68d49ce6b3ea
title: monthNames()
lede: Renvoyer des tableaux localisés de noms de mois et de jours de la semaine pour les en-têtes de calendriers et les menus.
---

## Libellés de calendrier

Les deux fonctions lisent les tables `Intl` mises en cache dans le cœur de la bibliothèque et renvoient un nouveau tableau à chaque appel. Vous pouvez donc transformer, découper ou inverser librement la liste renvoyée sans modifier d’état partagé.

:::entry
### `monthNames()` :kind[function]

```js signature
monthNames(style?, locale?): string[]
```

Renvoie un tableau de 12 noms de mois grégoriens localisés, de janvier à décembre. Utilise par défaut les noms complets dans la [locale configurée](/api/configure/).

**Paramètres**

```params
- name: style
  type: "'long' | 'short'"
  default: "'long'"
  description: Noms de mois complets comme `'January'` ou abrégés comme `'Jan'`.
- name: locale
  type: Locale
  description: Étiquette de locale BCP 47 remplaçant la valeur configurée par défaut.
```

**Valeur de retour**

```returns
type: string[]
description: Tableau de douze libellés de mois ordonnés de l’indice `0` pour janvier à l’indice `11` pour décembre.
```

```js title="months.js"
import { monthNames } from 'native-dates';

monthNames('short', 'en-US');
// ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

monthNames('long', 'fr-FR').slice(0, 3);
// ['janvier', 'février', 'mars']
```
:::

:::entry
### `weekdayNames()` :kind[function]

```js signature
weekdayNames(style?, firstDay?, locale?): string[]
```

Renvoie un tableau de 7 libellés localisés des jours de la semaine, décalés pour commencer à `firstDay`, au `weekStart` défini dans les [réglages globaux](/api/configure/) ou au premier jour de la semaine de la locale active.

Les bornes de semaine de [`startOf('week')`](/api/calendar-date/#startof) et les plages hebdomadaires suivent la même règle de premier jour, de sorte que les en-têtes de calendrier correspondent toujours aux grilles de semaines. Les libellés de jours personnalisés définis via [`configure()`](/api/configure/) s’appliquent également ici.

**Paramètres**

```params
- name: style
  type: "'short' | 'long' | 'narrow'"
  default: "'short'"
  description: "Libellés abrégés comme `'Mon'`, noms complets comme `'Monday'` ou en-têtes compacts sur une ou deux lettres comme `'Mo'`."
- name: firstDay
  type: DayOfWeek
  description: Nom de jour de la semaine en anglais ou numéro ISO de 1 pour lundi à 7 pour dimanche.
- name: locale
  type: Locale
  description: Étiquette de locale BCP 47 remplaçant la valeur configurée par défaut.
```

**Valeur de retour**

```returns
type: string[]
description: Tableau de sept libellés de jours de la semaine commençant à `firstDay`, au `weekStart` configuré ou au premier jour de la locale.
```

```js
import { date, weekdayNames } from 'native-dates';

weekdayNames('short', undefined, 'en-US');
// ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

weekdayNames('narrow', undefined, 'en-US');
// ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

weekdayNames('narrow', undefined, 'pt-BR');
// ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

weekdayNames('short', 'monday', 'en-US');
// ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const daysInGrid = date('2026-11-18', { locale: 'en-US' }).range('week').every('day');
daysInGrid[0].format({ weekday: 'short' }); // 'Sun'
```
:::
