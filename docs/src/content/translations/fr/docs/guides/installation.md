---
source: f1aec8a13183
title: Installation
lede: Ajoutez Native Dates en une commande, avec un polyfill optionnel pour Safari et les anciennes versions de Node.
---

Native Dates est un paquet ES module livré avec ses définitions TypeScript et zéro dépendance d’exécution.

## Installer

Installez le paquet depuis npm, ou exécutez la commande de configuration si vous travaillez avec un agent de code :

```bash label="npm"
npm i native-dates
```

```bash label="Avec les skills"
npx native-dates@latest
```

Importez ensuite les fonctions depuis `native-dates` dans votre application :

```js title="app.js"
import { date, now, today } from 'native-dates';

const due = today().plus(2, 'weeks');
const current = now('Europe/Berlin');
const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
standup.format('YYYY-MM-DD HH:mm'); // '2026-11-16 09:30'
```

## Prendre en charge Safari et les anciennes versions de Node

Native Dates s’appuie directement sur les API natives `Temporal` et `Intl` de la plateforme. Les versions actuelles de Chrome, Edge, Firefox, Node 26+, Deno et Bun n’ont besoin de rien d’autre.

Pour Safari, les navigateurs plus anciens ou Node 24–25, installez le polyfill avec `temporal-polyfill` :

```bash
npm i @native-dates/polyfill temporal-polyfill
```

Importez-le une seule fois tout en haut de votre point d’entrée, avant tout code manipulant des dates :

```js title="main.js"
import '@native-dates/polyfill';
import { today } from 'native-dates';

const launch = today().plus(30, 'days');
```

:::tip[Coût nul sur les navigateurs modernes]
Les environnements dotés d’une implémentation native de `Temporal` ne téléchargent même pas `temporal-polyfill`.
:::

:::details[Notes de compatibilité pour les environnements plus anciens]
- **Chargement synchrone :** si un module importé évalue des dates dès son chargement avant la résolution du `await` de haut niveau, importez plutôt `@native-dates/polyfill/sync`.
- **Formatage des durées sous Node :** le code serveur appelant [`Duration.format()`](/api/duration/#format) requiert Node 24+ pour `Intl.DurationFormat`. Les bundles navigateur se compilent toujours sans problème sous des versions plus anciennes de Node.
:::

Poursuivez avec [Personnalisation](/guides/customization/) pour définir vos valeurs par défaut et ajouter des plugins optionnels.
