---
source: a8aba5e485f9
title: legacy-date
lede: Accesseurs en lecture seule et méthodes de formatage de Date.prototype sur DateTime pour migrer progressivement.
---

## Migrer progressivement le code utilisant Date

Importez le plugin une seule fois pour ajouter les accesseurs en lecture seule de `Date.prototype` sur [`DateTime`](/api/date-time/). Les fonctions utilitaires, formateurs et composants qui attendent des méthodes natives peuvent ainsi recevoir directement une instance `DateTime` pendant que vous migrez fichier par fichier.

```js title="legacy-date.js"
import '@native-dates/plugins/legacy-date';
import { datetime } from 'native-dates';

const moment = datetime('2026-09-06T14:30:15.250', 'America/New_York');

moment.getFullYear(); // 2026
moment.getMonth(); // 8 (septembre, numéroté à partir de 0 comme Date)
moment.getDate(); // 6
moment.getHours(); // 14 (dans America/New_York, pas le fuseau du système hôte)
moment.getUTCHours(); // 18
```

Un objet `Date` natif lit toujours les champs locaux dans le fuseau horaire du système d’exploitation. Une instance `DateTime`, au contraire, évalue chaque accesseur local et chaque formateur de locale dans son propre fuseau horaire (`zone`).

:::warning[Mois numérotés à partir de 0 et dimanche = 0]
Les accesseurs hérités conservent la numérotation native pour ne pas casser silencieusement le code existant. `getMonth()` va de 0 à 11 et `getDay()` renvoie 0 pour le dimanche, alors que les propriétés du noyau comptent les mois à partir de 1 et les jours de la semaine à partir du lundi.
:::

## Accesseurs sensibles au fuseau et en UTC

Tous les accesseurs de lecture standard sont disponibles sur chaque instance `DateTime`.

| Méthode | Retour | Comportement sur DateTime |
|---|---|---|
| `getTime()` | `number` | Millisecondes depuis l’époque Unix, identique à `dt.epochMilliseconds`. |
| `getFullYear()` | `number` | Année calendaire sur quatre chiffres dans `dt.zone`. |
| `getMonth()` | `number` | Mois numéroté à partir de 0, de 0 pour janvier à 11 pour décembre, dans `dt.zone`. |
| `getDate()` | `number` | Jour du mois de 1 à 31 dans `dt.zone`. |
| `getDay()` | `number` | Jour de la semaine de 0 pour dimanche à 6 pour samedi dans `dt.zone`. |
| `getHours()`, `getMinutes()`, `getSeconds()`, `getMilliseconds()` | `number` | Champs horaires évalués dans `dt.zone`. |
| `getTimezoneOffset()` | `number` | Décalage en minutes à l’ouest d’UTC pour `dt.zone`, par exemple `240` pour `-04:00` ou `-330` pour `+05:30`. |
| `getUTCFullYear()`, `getUTCMonth()`, `getUTCDate()`, `getUTCDay()` | `number` | Champs calendaires en UTC avec des mois numérotés à partir de 0 et le dimanche à 0. |
| `getUTCHours()`, `getUTCMinutes()`, `getUTCSeconds()`, `getUTCMilliseconds()` | `number` | Champs horaires en UTC. |

```js
const kolkata = datetime('2026-01-06T09:00', 'Asia/Kolkata');

kolkata.getTimezoneOffset(); // -330
kolkata.getHours(); // 9
kolkata.getUTCHours(); // 3
```

## Méthodes de conversion en chaîne et de locale

Les méthodes de formatage héritées reproduisent la sortie native tout en utilisant par défaut le fuseau horaire propre à l’instance.

| Méthode | Retour | Comportement sur DateTime |
|---|---|---|
| `toISOString()` | `string` | Horodatage UTC à la milliseconde près, même lorsque l’instance porte une précision inférieure à la milliseconde. |
| `toLocaleString(locales?, options?)` | `string` | Date et heure formatées dans `dt.zone` et [`dt.locale()`](/api/date-time/#locale) sauf surcharge explicite. |
| `toLocaleDateString(locales?, options?)` | `string` | Partie date formatée dans `dt.zone` et `dt.locale()` sauf surcharge explicite. |
| `toLocaleTimeString(locales?, options?)` | `string` | Partie heure formatée dans `dt.zone` et `dt.locale()` sauf surcharge explicite. |

```js
const flight = datetime('2026-09-06T14:30:15.250', 'America/New_York');

flight.toISOString(); // '2026-09-06T18:30:15.250Z'
flight.toLocaleDateString('en-US'); // '9/6/2026'
flight.toLocaleTimeString('en-US'); // '2:30:15 PM'
flight.toLocaleTimeString('en-US', { timeZone: 'UTC' }); // '6:30:15 PM'
```

## Les setters lèvent une erreur en cas de mutation

Les instances sont immuables : chaque setter mutateur lève une erreur et oriente l’appelant vers [`set()`](/api/date-time/#set) ou [`plus()`](/api/date-time/#plus).

| Groupe | Méthodes bloquées | Équivalent immuable |
|---|---|---|
| Époque Unix | `setTime()` | Passez les millisecondes depuis l’époque Unix à [`datetime()`](/api/datetime-fn/). |
| Champs locaux | `setFullYear()`, `setMonth()`, `setDate()`, `setHours()`, `setMinutes()`, `setSeconds()`, `setMilliseconds()` | Modifiez les champs dans `dt.zone` avec [`dt.set()`](/api/date-time/#set). |
| Champs UTC | `setUTCFullYear()`, `setUTCMonth()`, `setUTCDate()`, `setUTCHours()`, `setUTCMinutes()`, `setUTCSeconds()`, `setUTCMilliseconds()` | Passez d’abord en UTC avec [`dt.in('UTC').set()`](/api/date-time/#in). |

```js
const reminder = datetime('2026-09-06T14:30Z');

try {
  reminder.setHours(9);
} catch (err) {
  err.code; // 'immutable'
}

const updated = reminder.set('hour', 9);
updated.hour; // 9
```

## Quand utiliser toJSDate à la place

Une instance `DateTime` ne simule jamais `instanceof Date` ni l’étiquette d’objet native. Si vous transmettez un horodatage à une bibliothèque de graphiques, un pilote de base de données ou un validateur qui vérifie l’identité de l’objet ou modifie sa copie sur place, appelez plutôt [`toJSDate()`](/api/date-time/#tojsdate) depuis le noyau :

```js
const nativeDate = datetime('2026-09-06T14:30Z').toJSDate();
nativeDate instanceof Date; // true
```
