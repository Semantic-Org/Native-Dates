---
source: 21708b5b4a6f
title: Fuseaux horaires
lede: Affichez un instant dans n’importe quel fuseau horaire IANA et traversez proprement les changements d’heure.
---

Un [`DateTime`](/api/date-time/) associe deux informations : l’instant exact auquel un événement se produit et le fuseau horaire dans lequel vous le lisez. Changer de fuseau horaire offre une autre vue du même instant, pendant que la plateforme gère chaque décalage UTC et chaque changement d’heure.

## Associer un instant à un fuseau horaire

Passez un identifiant de fuseau horaire IANA comme `'America/New_York'`, `'UTC'` ou un décalage fixe lors de la création d’un instant :

```js
import { date, datetime } from 'native-dates';

const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
const eastCoast = datetime('2026-11-16T12:30', 'America/New_York');
const audit = datetime('2026-11-16T17:30:00Z', 'UTC');

standup.zone; // 'America/Los_Angeles'
standup.offset; // '-08:00'
```

Lorsque vous omettez le fuseau horaire, l’instant utilise la valeur par défaut configurée ou, à défaut, le fuseau horaire local de l’environnement.

Définissez un fuseau horaire par défaut une fois au démarrage avec [`configure()`](/api/configure/) :

```js
import { configure, now } from 'native-dates';

configure({ zone: 'Europe/Berlin' });
now().zone; // 'Europe/Berlin'
```

## Afficher le même instant ailleurs

Appelez [`in()`](/api/date-time/#in) pour voir le même instant dans une autre ville. Les propriétés calendaires et horaires locales s’ajustent au fuseau horaire cible, tandis que l’horodatage sous-jacent reste identique :

```js
import { date } from 'native-dates';

const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
const berlin = standup.in('Europe/Berlin');
const tokyo = standup.in('Asia/Tokyo');

berlin.format('time', 'en-US'); // '6:30 PM'
tokyo.day; // 17
berlin.equals(standup); // true
```

## Le décalage fixe l’instant, pas le fuseau horaire

Les chaînes issues de bases de données ou d’API se terminent souvent par `Z` ou par un décalage numérique. Ce suffixe fixe l’instant exact, tandis que le nouveau `DateTime` utilise bien le fuseau horaire que vous demandez :

```js
import { datetime } from 'native-dates';

const created = datetime('2026-03-07T14:00:00Z', 'America/New_York');
const berlin = datetime('2026-03-07T16:00:00+02:00', 'Europe/Berlin');

created.zone; // 'America/New_York'
created.hour; // 9
berlin.hour; // 15
```

Conserver le véritable fuseau horaire IANA devient indispensable dès que vous ajoutez des jours ou des mois à travers un changement d’heure.

Un décalage fixe ne bouge jamais au fil des saisons, alors qu’un fuseau horaire IANA connaît chaque règle locale de changement d’heure.

:::note[Travailler en UTC]
Passez `'UTC'` comme fuseau horaire lorsque vous souhaitez évaluer les propriétés et les calculs calendaires en UTC. Les méthodes de sérialisation comme [`toString()`](/api/date-time/#tostring) écrivent toujours en UTC, quel que soit le fuseau horaire d’affichage. Voir [Stockage et échange](/guides/storing-and-sending/).
:::

## Changements d’heure

Les unités calendaires et les unités horaires réagissent différemment lors d’un changement d’heure. Le 8 mars 2026, New York passe à l’heure d’été en sautant de 2 h 00 à 3 h 00, ce qui réduit ce dimanche à 23 heures.

Ajouter 1 jour conserve le rendez-vous à 9 h 00 locales. Ajouter 24 heures compte en revanche 24 heures exactes écoulées :

```js
import { datetime } from 'native-dates';

const saturday = datetime('2026-03-07T09:00', 'America/New_York');

saturday.plus(1, 'day').text; // 'Mar 8, 2026, 9:00 AM EDT'
saturday.plus(24, 'hours').text; // 'Mar 8, 2026, 10:00 AM EDT'
saturday.plus(1, 'day').hoursInDay; // 23
```

:::warning[Heures sautées au passage à l’heure d’été]
Lorsque les horloges passent directement de 2 h 00 à 3 h 00, une heure locale comme 2 h 30 n’existe pas dans ce fuseau horaire. Demander cette heure inexistante avance de la durée du saut au lieu de lever une erreur.
:::

```js
const skipped = datetime('2026-03-08T02:30', 'America/New_York');
skipped.text; // 'Mar 8, 2026, 3:30 AM EDT'
```

:::details[Contrôler les heures sautées et les heures doublées]
Passez l’option `disambiguation` à [`datetime()`](/api/datetime-fn/) ou `at()` lorsque la planification ou l’audit exige une règle de levée d’ambiguïté spécifique lors des passages à l’heure d’été ou d’hiver. Elle vaut `'compatible'` par défaut et accepte aussi `'earlier'`, `'later'` ou `'reject'` :

```js
const fallBack = datetime('2026-11-01T01:30', {
  zone: 'America/New_York',
  disambiguation: 'later',
});
fallBack.offset; // '-05:00'

datetime('2026-03-08T02:30', {
  zone: 'America/New_York',
  disambiguation: 'reject',
}); // lève une RangeError [invalidDateTime]
```
:::

## Noms de villes et abréviations

Le noyau accepte les identifiants IANA canoniques, `'UTC'` et les décalages fixes. Importez [`@native-dates/plugins/zones`](/plugins/zones/) pour résoudre des noms de villes IANA en anglais, des abréviations régionales, des alias natifs intégrés (comme `'Montréal'`, `'Bruxelles'`, `'Genève'`, `'HNE'` ou `'東京'`) ainsi que vos propres alias personnalisés.

```js
import '@native-dates/plugins/zones';
import { configure, datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'los angeles').zone; // 'America/Los_Angeles'
datetime('2026-11-16T09:30', 'Beijing').zone; // 'Asia/Shanghai'
datetime('2026-11-16T09:30', 'PT').zone; // 'America/Los_Angeles'
datetime('2026-11-16T09:30', { zone: 'CST', locale: 'zh-CN' }).zone; // 'Asia/Shanghai'

configure({ zoneAliases: { hq: 'Europe/Berlin' } });
datetime('2026-11-16T09:30', 'hq').zone; // 'Europe/Berlin'
```

Les abréviations partagées comme `CST` et `IST` suivent la région de la locale active, et de grandes villes comme `'Beijing'`, `'Mumbai'` ou `'Osaka'` sont résolues sans alias manuel.
