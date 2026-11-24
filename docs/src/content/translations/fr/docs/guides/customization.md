---
source: 97915c43145b
title: Personnalisation
lede: Définissez des réglages globaux et étendez Native Dates avec des formats nommés ou des plugins optionnels.
---

Par défaut, Native Dates suit le fuseau horaire local et la locale de l’environnement. Utilisez [`configure()`](/api/configure/) et les plugins optionnels lorsque votre application a besoin de valeurs par défaut fixes, de formats nommés ou de capacités supplémentaires d’analyse et de gestion des fuseaux horaires.

## Valeurs par défaut globales

Appelez [`configure()`](/api/configure/) au démarrage pour définir un fuseau horaire, une locale ou un début de semaine par défaut dans toute l’application (`weekStart` attend un nom de jour en anglais). Les clés omises conservent leur valeur actuelle, et passer `null` rétablit le réglage de l’environnement :

```js title="main.js"
import { configure, date, now } from 'native-dates';

configure({
  zone: 'America/New_York',
  locale: 'en-US',
  weekStart: 'monday',
});

now().zone; // 'America/New_York'
date('2026-11-18').startOf('week').toString(); // '2026-11-16'
```

Chaque appel peut toujours préciser son propre fuseau horaire, sa [`locale()`](/api/date-time/#locale) ou son début de semaine pour surcharger ce réglage.

:::warning[Configurez une seule fois au démarrage sur serveur]
Les valeurs par défaut globales sont partagées par tout le processus JavaScript. Sur un serveur multi-utilisateurs, attachez directement le fuseau horaire et la locale de chaque requête à la valeur au lieu de modifier `configure()` à chaque requête.
:::

## Formats nommés

Déclarez vos formats réutilisables sous la clé `formats`, puis passez leur nom à [`format()`](/guides/formatting/). Chaque entrée accepte un motif de jetons ou un objet d’options `Intl` :

```js title="main.js"
import { configure, date, datetime } from 'native-dates';

configure({
  formats: {
    invoice: 'YYYY-MM-DD',
    receipt: { weekday: 'long', month: 'long', day: 'numeric' },
  },
});

date('2026-11-06').format('invoice'); // '2026-11-06'
const placed = datetime('2026-11-06T09:05', 'Europe/Berlin');
placed.format('receipt'); // 'Friday, November 6'
```

Les formats nommés s’appliquent aux dates, aux heures du jour, aux instants, aux dates partielles et aux plages, tandis que les durées n’utilisent que leurs styles intégrés. Les noms personnalisés ont priorité sur les préréglages intégrés : enregistrer `'short'` le remplace dans toute l’application.

## Ajouter des plugins

Les plugins optionnels pour la recherche de villes, l’analyse en mode souple et les accesseurs hérités de `Date` sont disponibles dans [`@native-dates/plugins`](/plugins/) :

```bash
npm i @native-dates/plugins
```

Importez chaque sous-module une seule fois au démarrage pour l’activer :

```js title="main.js"
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { date, datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'Berlin').zone; // 'Europe/Berlin'
date('Nov 16, 2026', { loose: true }); // CalendarDate(2026-11-16)
```

Une fois chargés, les plugins peuvent également déclarer leurs propres options dans [`configure()`](/api/configure/). Le plugin `zones` ajoute `zoneAliases` pour vos alias personnalisés, et le plugin `loose` ajoute `dayFirst` pour l’ordre des dates numériques :

```js title="main.js"
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { configure, date, now } from 'native-dates';

configure({
  zoneAliases: { hq: 'Europe/Berlin' },
  dayFirst: true,
});

now('hq').zone; // 'Europe/Berlin'
date('07.09.2026', { loose: true }).toString(); // '2026-09-07'
```

Consultez la [présentation des plugins](/plugins/) pour comparer le poids de chaque sous-module, ou lisez [Écrire un plugin](/guides/writing-a-plugin/) pour créer le vôtre.

## Noms de jours et ordinaux personnalisés

Les noms de mois et de jours proviennent des données `Intl` de l’environnement. Lorsqu’une maquette exige des abréviations particulières ou des ordinaux de jour, surchargez-les avec `weekdayNames` (dont les clés sont les abréviations anglaises des jours) et `ordinals` :

```js title="main.js"
import { configure, date } from 'native-dates';

configure({
  weekdayNames: {
    en: { short: { tue: 'Tues', thu: 'Thurs' } },
  },
  ordinals: {
    fr: (day) => (day === 1 ? '1er' : day),
  },
});

date('2026-11-03').format('ddd', 'en-US'); // 'Tues'
date('2026-11-01').format('Do MMMM', 'fr'); // '1er novembre'
```

Passez `null` à l’une ou l’autre clé pour revenir aux valeurs de l’environnement et aux règles par défaut. Poursuivez avec [Localisation](/guides/localization/) pour gérer les locales par utilisateur, le début de semaine et les systèmes calendaires.
