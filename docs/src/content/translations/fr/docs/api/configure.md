---
source: e011cab2c85c
title: configure()
lede: Lire ou mettre à jour les valeurs par défaut globales du processus pour le fuseau horaire, la locale, le début de semaine, les formats, les libellés de jetons et les plugins.
---

## Valeurs par défaut globales

:::entry
### `configure()` :kind[function]

```js signature
configure(settings?): ActiveSettings
```

Met à jour une ou plusieurs valeurs par défaut globales au processus et renvoie un instantané de la configuration active. L’appeler sans argument lit les réglages courants sans les modifier.

Les propriétés omises conservent leur valeur actuelle. Passez `null` pour un réglage afin de rétablir les valeurs par défaut de l’environnement ou intégrées.

```js title="setup.js"
import { configure, date, datetime } from 'native-dates';

configure({
  zone: 'Europe/Berlin',
  locale: 'de-DE',
});

datetime('2026-11-16T17:30:00Z').zone; // 'Europe/Berlin'
date('2026-11-18').startOf('week').toString(); // '2026-11-16'
configure().weekStart; // undefined

configure({ weekStart: 'sunday' });
date('2026-11-18').startOf('week').toString(); // '2026-11-15'
configure().weekStart; // 7

// réinitialise vers le fuseau horaire et la locale de l’environnement, et le début de semaine de la locale
configure({ zone: null, locale: null, weekStart: null });
```

**Paramètres**

```params
- name: settings
  type: Settings
  description: Valeurs par défaut globales du processus à mettre à jour, les clés omises restant inchangées.
  options:
    - name: zone
      type: Zone | null
      description: Fuseau horaire par défaut des fonctions fabriques et de `now()`, ou `null` pour rétablir le fuseau horaire local de l’environnement.
    - name: locale
      type: Locale | null
      description: Étiquette de locale, liste d’étiquettes ou en-tête `Accept-Language` par défaut pour le formatage, les bornes de semaine, les week-ends et les plugins, ou `null` / `''` pour rétablir la locale de l’environnement.
    - name: weekStart
      type: DayOfWeek | null
      description: Premier jour de la semaine pour les bornes de semaine et `weekdayNames()`, en nom de jour en anglais ou entier de 1 pour lundi à 7 pour dimanche, ou `null` pour suivre la locale active.
    - name: weekdayNames
      type: "Record<Locale, { narrow?, short?, long? }> | null"
      description: "Libellés de jours personnalisés indexés par étiquette de locale, largeur (`narrow`, `short` ou `long`) et nom de jour en anglais, les étiquettes régionales se superposant à leur locale de base et une valeur vide rétablissant les noms de l’environnement."
    - name: ordinals
      type: "Record<Locale, (day: number) => string | number> | null"
      description: "Formateur personnalisé du jeton `Do` (jour du mois) indexé par étiquette de locale, ou `null` pour rétablir les suffixes anglais intégrés et les marqueurs de jour propres à chaque locale."
    - name: formats
      type: "Record<string, string | Intl.DateTimeFormatOptions> | null"
      description: "Formats nommés réutilisables passés à `format(name)`, chaque valeur étant un motif de jetons ou un objet d’options `Intl`, prioritaires sur les préréglages intégrés, ou `null` pour les effacer."
    - name: dayFirst
      type: boolean | null
      description: "Ordre numérique des dates par défaut pour les appels en mode souple omettant `dayFirst` et `locale`, ou `null` pour suivre la locale active."
    - name: zoneAliases
      type: Record<string, Zone | null> | null
      description: "Noms personnalisés associés à des fuseaux horaires avec `@native-dates/plugins/zones`, ou `null` pour une clé ou l’ensemble de la table afin d’effacer les alias."
```

**Valeur de retour**

```returns
type: "{ zone, locale, weekStart, dayFirst, zoneAliases, weekdayNames, ordinals, formats }"
description: Copie superficielle des réglages actifs après application des mises à jour, avec `undefined` pour les clés non définies.
```

Les réglages `weekdayNames` et `ordinals` modifient ce que produisent les motifs de jetons et [`weekdayNames()`](/api/month-names/#weekdaynames), sans aucun plugin :

```js
import { configure, date, weekdayNames } from 'native-dates';

configure({
  weekdayNames: { lv: { narrow: { fri: 'Pk', sun: 'Sv' } } },
  ordinals: { fr: (day) => (day === 1 ? '1er' : day) },
});

date('2026-11-01').format('Do MMMM', 'fr'); // '1er novembre'
weekdayNames('narrow', 'monday', 'lv'); // ['P', 'O', 'T', 'C', 'Pk', 'S', 'Sv']

configure({ weekdayNames: null, ordinals: null });
```

Les formats nommés dotent une application de ses propres préréglages sur tous les types qui formatent une date ou une heure :

```js
import { configure, date, datetime } from 'native-dates';

configure({
  formats: {
    invoice: 'YYYY-MM-DD',
    receipt: { weekday: 'long', month: 'long', day: 'numeric' },
  },
});

date('2026-11-06').format('invoice'); // '2026-11-06'
datetime('2026-11-06T09:05', 'Europe/Berlin').format('receipt'); // 'Friday, November 6'

configure({ formats: null });
```

Les plugins étendent `configure()` avec leurs propres options dès leur importation. Définir une option de plugin avant d’importer le plugin correspondant lève une `RangeError` :

```js
import { configure, date, now } from 'native-dates';
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';

configure({
  dayFirst: true,
  zoneAliases: { hq: 'Europe/Berlin' },
});

date('07.09.2026', { loose: true })?.toString(); // '2026-09-07'
now('hq').zone; // 'Europe/Berlin'

configure({ dayFirst: null });
```
:::

:::warning[Configurez une seule fois au démarrage côté serveur]
La configuration globale modifie un état partagé par tout le processus JavaScript. Définissez les valeurs par défaut une seule fois au démarrage du serveur, puis attachez le fuseau horaire et la [`locale()`](/api/date-time/#locale) de chaque utilisateur aux valeurs dans les gestionnaires de requêtes. Voir [Localisation](/guides/localization/).
:::

## Utilitaire de jour de la semaine

Convertissez le nom d’un jour en anglais en son numéro, selon la même numérotation ISO que le reste de la bibliothèque.

:::entry
### `dayOfWeek()` :kind[function]

```js signature
dayOfWeek(day): number
```

Convertit un nom de jour de la semaine en anglais, un préfixe anglais sur trois lettres ou un numéro ISO en un entier de 1 pour lundi à 7 pour dimanche. Les noms non reconnus ou les nombres en dehors de 1 à 7 lèvent une `RangeError`.

**Paramètres**

```params
- name: day
  type: DayOfWeek
  required: true
  description: Nom de jour de la semaine en anglais comme `'monday'`, préfixe anglais insensible à la casse comme `'Fri'` ou entier de 1 à 7.
```

**Valeur de retour**

```returns
type: number
description: Numéro du jour de la semaine, de 1 pour lundi à 7 pour dimanche.
```

```js
import { dayOfWeek } from 'native-dates';

dayOfWeek('monday'); // 1
dayOfWeek('Fri'); // 5
dayOfWeek('sunday'); // 7
dayOfWeek(3); // 3
```
:::
