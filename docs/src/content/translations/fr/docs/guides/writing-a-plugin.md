---
source: 46b27cf4cf7e
title: Écrire un plugin
lede: Étendez Native Dates avec des méthodes de prototype optionnelles et l’augmentation de modules TypeScript.
---

Les plugins s’activent dès leur import.

Vous pouvez publier des paquets réutilisables ou ajouter des utilitaires métier dans votre propre application selon le même modèle que [`zones`](/plugins/zones/) et [`legacy-date`](/plugins/legacy-date/) dans [`@native-dates/plugins`](/plugins/).

## Attacher des méthodes au prototype

Importez la classe que vous souhaitez étendre et attachez votre méthode à son `prototype`.

Chaque instance est figée à la construction. Les méthodes de plugin doivent rester pures et renvoyer une nouvelle valeur ou un résultat calculé sans jamais modifier `this`.

```js
import { CalendarDate, date } from 'native-dates';

CalendarDate.prototype.nextBusinessDay = function nextBusinessDay() {
  const step = this.dayOfWeek === 5 ? 3 : this.dayOfWeek === 6 ? 2 : 1;
  return this.plus(step, 'days');
};

date('2026-11-13').nextBusinessDay().toString(); // '2026-11-16'
```

Lisez les propriétés publiques de l’instance ou appelez [`this.toTemporal()`](/api/calendar-date/#totemporal), et construisez vos valeurs de retour avec des méthodes comme [`this.plus()`](/api/calendar-date/#plus).

Lorsque vous étendez une méthode existante comme [`format()`](/api/calendar-date/#format), capturez d’abord la méthode d’origine et déléguez-lui les entrées que votre plugin ne gère pas :

```js
const baseFormat = CalendarDate.prototype.format;

CalendarDate.prototype.format = function format(spec, locale) {
  if (spec === 'compact') {
    return this.toString().replaceAll('-', '');
  }
  return baseFormat.call(this, spec, locale);
};

date('2026-11-16').format('compact'); // '20261116'
date('2026-11-16').format('short', 'en-US'); // '11/16/26'
```

## Vérifier les types entre plusieurs bundles

Évitez de tester `value.constructor.name` dans les utilitaires de plugin. Dans un monorepo, une architecture micro-frontend ou une iframe, deux copies d’un même paquet peuvent coexister en mémoire.

Chaque classe porte une marque par symbole global. Les gardes de type, [`kindOf()`](/api/kind-of/) et les symboles de marque comme [`IS_DATE_TIME`](/api/kind-of/#cross-realm-instanceof-and-brands) reconnaissent les valeurs entre contextes d’exécution et bundles dupliqués.

```js
import { date, IS_CALENDAR_DATE, IS_DATE_TIME, kindOf, now } from 'native-dates';

export function isDateOrMoment(value) {
  return Boolean(value?.[IS_CALENDAR_DATE] || value?.[IS_DATE_TIME]);
}

isDateOrMoment(date('2026-11-16')); // true
kindOf(now()); // 'datetime'
```

## Déclarer sideEffects dans package.json

Les utilisateurs activent un plugin par un import nu. Listez vos fichiers d’entrée dans `"sideEffects"` et placez `"native-dates"` dans `peerDependencies` afin que les bundlers conservent l’import et partagent les classes de l’application hôte :

```json title="package.json"
{
  "name": "my-dates-plugin",
  "type": "module",
  "exports": {
    ".": {
      "types": "./index.d.ts",
      "default": "./index.js"
    }
  },
  "sideEffects": ["./index.js"],
  "peerDependencies": {
    "native-dates": "^1.0.0"
  }
}
```

:::warning[Ne définissez pas sideEffects à false sur un plugin à effets de bord]
Indiquer `"sideEffects": false` autorise les bundlers à supprimer les imports nus du plugin lors du build de production, même si les tests unitaires passent sous Node.
:::

## Étendre les types TypeScript

Déclarez `module 'native-dates'` dans votre fichier de déclarations pour fusionner de nouvelles signatures de méthodes sur les classes existantes ou sur les options de configuration :

```ts title="index.d.ts"
import 'native-dates';

declare module 'native-dates' {
  interface CalendarDate {
    nextBusinessDay(): CalendarDate;
  }
}
```

Une fois le plugin importé, TypeScript propose votre méthode aux côtés des méthodes natives à chaque appel.
