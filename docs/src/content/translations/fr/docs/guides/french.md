---
source: '796790dab62e'
reviewed: false
title: Dates et heures en français
lede: Adaptez le formatage et la lecture des dates aux conventions régionales francophones et à la typographie française.
---

Consultez [Internationalisation](/guides/internationalization/) pour régler la locale globalement ou par valeur, puis surveillez les variantes régionales francophones et les règles typographiques du français.

## Variantes régionales francophones

Le code `'fr'` applique les usages de France métropolitaine, tandis que le Québec, la Suisse, la Belgique et le Maghreb varient l’ordre et l’horloge :

| Locale | Format court | Début de semaine | Particularités régionales |
|---|---|---|---|
| `fr-FR`, `fr-SN`, `fr-MA` | `'01/11/2026 14:30'` | `1` — lundi | Barres obliques, horloge sur 24 heures et juillet abrégé en `'juil.'`. |
| `fr-CA` | `'2026-11-01 14 h 30'` | `7` — dimanche | Ordre ISO officiel au Canada, heure espacée avec `'h'` et juillet en `'juill.'`. |
| `fr-CH` | `'01.11.26 14:30'` | `1` — lundi | Séparateur par points et année sur deux chiffres avec `'short'`, quatre avec `'L'`. |
| `fr-BE` | `'1/11/26 14:30'` | `1` — lundi | Jour sans zéro initial et année sur deux chiffres avec `'short'`, quatre avec `'L'`. |
| `fr-DZ` | `'01/11/2026 2:30 PM'` | `6` — samedi | Semaine commençant le samedi et horloge sur 12 heures dans CLDR. |

Passez la sous-étiquette régionale complète pour afficher un format familier à chaque lecteur :

```js
import { datetime } from 'native-dates';

const rdv = datetime('2026-11-01T14:30:00', 'Europe/Paris');
rdv.format('short', 'fr-FR'); // '01/11/2026 14:30'
rdv.format('short', 'fr-CA'); // '2026-11-01 14 h 30'
rdv.format('short', 'fr-CH'); // '01.11.26 14:30'
rdv.format('L', 'fr-CH'); // '01.11.2026'
```

Le français canadien débute la semaine le dimanche, suivi automatiquement par `startOf('week')` et `weekdayNames()`. Fixez le lundi pour vos rapports ou clés SQL :

```js
import { date, weekdayNames } from 'native-dates';

const mercredi = date('2026-11-18');
mercredi.locale('fr-FR').startOf('week').toString(); // '2026-11-16'
mercredi.locale('fr-CA').startOf('week').toString(); // '2026-11-15'
weekdayNames('short', undefined, 'fr-FR')[0]; // 'lun.'
weekdayNames('short', undefined, 'fr-CA')[0]; // 'dim.'
mercredi.locale('fr-CA').startOf('week', 'monday').toString(); // '2026-11-16'
```

## Typographie française et jetons de formatage

Échappez les lettres littérales comme dans `'HH[h]mm'` : un *h* nu lit l’heure sur 12 heures sans erreur, et *a* sans accent insère AM ou PM :

```js
import { datetime } from 'native-dates';

const depart = datetime('2026-11-01T14:30:00', 'Europe/Paris').locale('fr-FR');
depart.format('HHhmm'); // '14230'
depart.format('HH[h]mm'); // '14h30'
depart.format('[le] dddd D MMMM [à] HH[h]mm'); // 'le dimanche 1 novembre à 14h30'
```

Le français réserve *1er* au premier du mois, mais les préréglages affichent des chiffres cardinaux. Déclarez `ordinals` pour `Do`, dont héritent les variantes régionales :

```js
import { configure, date } from 'native-dates';

date('2026-11-01').format('long', 'fr-FR'); // '1 novembre 2026'
configure({ ordinals: { fr: (jour) => (jour === 1 ? '1er' : jour) } });
date('2026-11-01').format('Do MMMM YYYY', 'fr-FR'); // '1er novembre 2026'
date('2026-11-02').format('Do MMMM YYYY', 'fr-FR'); // '2 novembre 2026'
date('2026-11-01').format('Do MMMM YYYY', 'fr-CA'); // '1er novembre 2026'
```

Jours et mois s’écrivent en minuscules même avec `'full'`, et ne prennent une majuscule qu’en début de phrase ou d’en-tête.

N’ajoutez jamais de point après `MMM` : les mois tronqués portent déjà un point, tandis que *mars*, *mai*, *juin* et *août* restent entiers :

```js
import { monthNames } from 'native-dates';

const complet = date('2026-11-01').format('full', 'fr-FR');
// 'dimanche 1 novembre 2026'
complet[0].toUpperCase() + complet.slice(1); // 'Dimanche 1 novembre 2026'
monthNames('short', 'fr-FR').slice(4, 8); // ['mai', 'juin', 'juil.', 'août']
monthNames('short', 'fr-CA').slice(4, 8); // ['mai', 'juin', 'juill.', 'août']
```

## Analyser les dates et heures saisies

Le noyau lit les dates ISO et refuse barres ou points. Activez `dayFirst` avec [le plugin souple](/plugins/loose/), sinon 06/11 lit mois-jour et 14/07 renvoie null :

```js
import '@native-dates/plugins/loose';
import { date } from 'native-dates';

date('06/11/2026', { loose: true }); // CalendarDate(2026-06-11)
date('14/07/2026', { loose: true }); // null
date('06/11/2026', { loose: true, dayFirst: true }); // CalendarDate(2026-11-06)
date('14.07.2026', { loose: true, dayFirst: true }); // CalendarDate(2026-07-14)
date('2026-07-14', { loose: true, dayFirst: true }); // CalendarDate(2026-07-14)
```

:::warning[Faux positifs sur les mois en toutes lettres]
Dans `date()` et `datetime()`, le mode souple ne reconnaît que les mois anglais. *Mars*, *septembre*, *octobre* et *novembre* passent par ressemblance orthographique, mais *février*, *mai*, *août* et *décembre* renvoient `null`.
:::

Les dates partielles `monthDay()` et `yearMonth()` reconnaissent les mois français, tandis qu’une heure saisie comme 14h30 demande de remplacer *h* par deux-points :

```js
import { dayMonth, duration, monthDay, time, yearMonth } from 'native-dates';

date('10 nov. 2026', { loose: true, locale: 'fr' }); // CalendarDate(2026-11-10)
date('10 déc. 2026', { loose: true, locale: 'fr' }); // null
monthDay('15 août', { loose: true, locale: 'fr' }); // MonthDay(08-15)
yearMonth('févr. 2026', { loose: true, locale: 'fr' }); // YearMonth(2026-02)
dayMonth('14/07'); // MonthDay(07-14)
time('14h30', { loose: true }); // null
time('14h30'.replace(/(\d)\s*h\s*(\d)/i, '$1:$2')); // Time(14:30:00)
duration('2h 30m'); // Duration(PT2H30M)
```

## Fuseaux horaires dans la francophonie

L’Amérique du Nord change d’heure deux à trois semaines avant l’Europe au printemps et une semaine après à l’automne, réduisant l’écart Paris-Montréal à cinq heures.

Le Maroc revient aussi à UTC+0 pendant le ramadan, donc convertissez chaque instant avec `in()` plutôt qu’un décalage fixe :

```js
import { date } from 'native-dates';

const hiver = date('2026-01-15').at('15:00', 'Europe/Paris');
const mars = date('2026-03-16').at('15:00', 'Europe/Paris');
hiver.in('America/Montreal').format('short', 'fr-CA'); // '2026-01-15 09 h 00'
mars.in('America/Montreal').format('short', 'fr-CA'); // '2026-03-16 10 h 00'
```

Avec [le plugin zones](/plugins/zones/), Montréal et Nouméa fonctionnent directement. Déclarez Bruxelles, Genève ou le sigle canadien `'HNE'` pour l’heure normale de l’Est dans `zoneAliases` :

```js
import '@native-dates/plugins/zones';
import { configure, datetime } from 'native-dates';

configure({
  zoneAliases: {
    bruxelles: 'Europe/Brussels',
    geneve: 'Europe/Zurich',
    hne: 'America/Montreal',
  },
});
datetime('2026-11-16T09:30', 'Montréal').zone; // 'America/Montreal'
datetime('2026-11-16T09:30', 'Genève').zone; // 'Europe/Zurich'
datetime('2026-11-16T09:30', 'HNE').zone; // 'America/Montreal'
```

## Dates relatives et espaces insécables

Sur une date calendaire, le calcul relatif emploie `'avant-hier'` et `'après-demain'` à deux jours d’écart, alors qu’un instant reste chiffré pour éviter un hier trompeur la nuit.

Dans vos tests unitaires, prévoyez l’apostrophe courbe d’*aujourd’hui* et les espaces insécables `U+202F` ou `U+00A0` des durées courtes :

```js
import { date, datetime, duration } from 'native-dates';

const ref = date('2026-11-10');
ref.minus(2, 'days').from(ref, 'fr-FR'); // 'avant-hier'
ref.from(ref, 'fr-FR'); // 'aujourd’hui'
ref.plus(2, 'days').from(ref, 'fr-FR'); // 'après-demain'
const instant = datetime('2026-11-10T14:00', 'Europe/Paris');
instant.minus(24, 'hours').from(instant, 'fr-FR'); // 'il y a 1 jour'
duration({ hours: 3, minutes: 15 }).format('short', 'fr-FR');
// '3\u202fh et 15\u00a0min'
duration({ hours: 3, minutes: 15 }).format('short', 'fr-CA');
// '3\u00a0h et 15\u00a0min'
```
