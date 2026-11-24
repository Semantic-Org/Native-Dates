---
source: a214ff99444f
title: Français
lede: Formatez et analysez les dates en français selon les horloges et débuts de semaine régionaux.
---

Le code nu `'fr'` applique les usages de France métropolitaine. Définissez une étiquette régionale comme `'fr-CA'` (voir [Localisation](/guides/localization/)) dès que vos utilisateurs attendent l’ordre des dates, le séparateur d’heure et le début de semaine propres à leur pays.

## Variantes régionales

L’ordre des dates courtes, le séparateur d’heure et le premier jour de la semaine changent selon les régions francophones :

| Locale | Format court | Début de semaine | Particularités régionales |
|---|---|---|---|
| `fr-FR`, `fr-SN`, `fr-MA` | `'01/11/2026 14:30'` | `1` — lundi | Barres obliques, horloge sur 24 heures et juillet abrégé en `'juil.'`. |
| `fr-CA` | `'2026-11-01 14 h 30'` | `7` — dimanche | Ordre ISO au Canada, heure espacée avec `'h'` et juillet en `'juill.'`. |
| `fr-CH` | `'01.11.26 14:30'` | `1` — lundi | Séparateur par points et année sur deux chiffres avec `'short'`, quatre avec `'L'`. |
| `fr-BE` | `'1/11/26 14:30'` | `1` — lundi | Jour sans zéro initial et année sur deux chiffres avec `'short'`, quatre avec `'L'`. |
| `fr-DZ` | `'01/11/2026 2:30 PM'` | `6` — samedi | Semaine commençant le samedi et horloge sur 12 heures par défaut. |

Passez l’étiquette régionale complète pour obtenir la ponctuation locale avec les préréglages :

```js
import { datetime } from 'native-dates';

const rdv = datetime('2026-11-01T14:30:00', 'Europe/Paris');

rdv.format('short', 'fr-FR'); // '01/11/2026 14:30'
rdv.format('short', 'fr-CA'); // '2026-11-01 14 h 30'
rdv.format('short', 'fr-CH'); // '01.11.26 14:30'
rdv.format('L', 'fr-CH'); // '01.11.2026'
```

Avec `'fr-CA'`, la semaine commence le dimanche : [`startOf('week')`](/api/calendar-date/#startof) et [`weekdayNames()`](/api/month-names/#weekdaynames) suivent automatiquement cette règle. Passez le mot-clé anglais `'monday'` lorsque vos requêtes exigent des semaines ISO :

```js
import { date, weekdayNames } from 'native-dates';

const mercredi = date('2026-11-18');

mercredi.locale('fr-FR').startOf('week').toString(); // '2026-11-16'
mercredi.locale('fr-CA').startOf('week').toString(); // '2026-11-15'
weekdayNames('short', undefined, 'fr-CA')[0]; // 'dim.'
mercredi.locale('fr-CA').startOf('week', 'monday').toString(); // '2026-11-16'
```

## Typographie française et jetons de formatage

Entourez les lettres littérales de crochets dans un motif de jetons comme `'HH[h]mm'`. Écrire `'HHhmm'` sans crochets lève [`unknownFormat`](/api/errors/#units-zones-and-formats), alors qu’un *à* accentué isolé passe tel quel sans échappement :

```js
import { datetime } from 'native-dates';

const depart = datetime('2026-11-01T14:30:00', 'Europe/Paris').locale('fr-FR');

depart.format('HH[h]mm'); // '14h30'
depart.format('[le] dddd D MMMM à HH[h]mm'); // 'le dimanche 1 novembre à 14h30'
```

Par défaut, les préréglages affichent `'1 novembre 2026'`. Pour obtenir *1er* avec le jeton `Do`, déclarez une règle [`ordinals`](/api/configure/) sur `'fr'` ; les variantes régionales en héritent automatiquement :

```js
import { configure, date } from 'native-dates';

date('2026-11-01').format('long', 'fr-FR'); // '1 novembre 2026'

configure({ ordinals: { fr: (jour) => (jour === 1 ? '1er' : jour) } });
date('2026-11-01').format('Do MMMM YYYY', 'fr-FR'); // '1er novembre 2026'
date('2026-11-02').format('Do MMMM YYYY', 'fr-FR'); // '2 novembre 2026'
date('2026-11-01').format('Do MMMM YYYY', 'fr-CA'); // '1er novembre 2026'
```

Les jours et mois sortent en minuscules ; appliquez une majuscule initiale sur le premier caractère uniquement lorsqu’une date ouvre un titre.

N’ajoutez pas de point après `MMM` ; le jeton inclut déjà le point des mois abrégés (`'juil.'` en `'fr-FR'`, `'juill.'` en `'fr-CA'`) et n’en ajoute pas sur *mars*, *mai*, *juin* ni *août* :

```js
import { monthNames } from 'native-dates';

const s = date('2026-11-01').format('full', 'fr'); // 'dimanche 1 novembre 2026'
s[0].toUpperCase() + s.slice(1); // 'Dimanche 1 novembre 2026'
monthNames('short', 'fr-FR').slice(4, 8); // ['mai', 'juin', 'juil.', 'août']
monthNames('short', 'fr-CA').slice(4, 8); // ['mai', 'juin', 'juill.', 'août']
```

## Analyser les dates et heures saisies

Le noyau lit directement les chaînes ISO canadiennes et les heures au format `'14h30'` ou `'14 h 30'`. Avec [le plugin `loose`](/plugins/loose/), les locales françaises analysent automatiquement les dates à barres obliques jour en premier, les dates à points, les ordinaux et les dates rédigées en toutes lettres :

```js
import '@native-dates/plugins/loose';
import { date, datetime, time } from 'native-dates';

time('14h30').toString(); // '14:30:00'
time('14 h 30').toString(); // '14:30:00'
date('06/11/2026', { loose: true, locale: 'fr' })?.toString(); // '2026-11-06'
date('14.07.2026', { loose: true, locale: 'fr' })?.toString(); // '2026-07-14'
date('1er mai 2026', { loose: true, locale: 'fr' })?.toString(); // '2026-05-01'
date('6 juil 2026', { loose: true, locale: 'fr' })?.toString(); // '2026-07-06'
date('6 jui 2026', { loose: true, locale: 'fr' }); // null
datetime('lundi 16 novembre 2026 à 14h30', {
  loose: true,
  locale: 'fr',
  zone: 'Europe/Paris',
})?.hour; // 14
```

En mode souple, une abréviation de mois doit désigner un seul mois sans ambiguïté : `'juil'` correspond à juillet, tandis que `'jui'` renvoie `null` car il correspond à la fois à *juin* et à *juillet*.

Les dates partielles reconnaissent les mois français et leurs abréviations accentuées en mode souple. [`dayMonth()`](/api/month-day-fn/#daymonth) et [`duration()`](/api/duration-fn/) fonctionnent directement dans le noyau sans plugin :

```js
import { dayMonth, duration, monthDay, yearMonth } from 'native-dates';

dayMonth('14/07').toString(); // '07-14'
monthDay('1er mai', { loose: true, locale: 'fr' })?.toString(); // '05-01'
yearMonth('févr. 2026', { loose: true, locale: 'fr' })?.toString(); // '2026-02'
duration('2h 30m').toString(); // 'PT2H30M'
```

## Fuseaux horaires

L’Amérique du Nord change d’heure deux à trois semaines avant l’Europe au printemps et une semaine après à l’automne, ce qui ramène temporairement l’écart Paris–Montréal de six à cinq heures.

Le Maroc revient aussi à UTC+0 pendant le ramadan ; convertissez toujours vos instants avec [`in()`](/api/date-time/#in) plutôt que de soustraire un décalage fixe :

```js
import { date } from 'native-dates';

const hiver = date('2026-01-15').at('15:00', 'Europe/Paris');
const mars = date('2026-03-16').at('15:00', 'Europe/Paris');

hiver.in('America/Montreal').format('short', 'fr-CA'); // '2026-01-15 09 h 00'
mars.in('America/Montreal').format('short', 'fr-CA'); // '2026-03-16 10 h 00'
```

Avec [le plugin `zones`](/plugins/zones/), les grandes villes francophones (y compris sous leur forme native `'Montréal'`, `'Bruxelles'` ou `'Genève'`) et les abréviations canadiennes comme `'HNE'` se résolvent directement sans alias personnalisé :

```js
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'Montréal').zone; // 'America/Montreal'
datetime('2026-11-16T09:30', 'Bruxelles').zone; // 'Europe/Brussels'
datetime('2026-11-16T09:30', 'Genève').zone; // 'Europe/Zurich'
datetime('2026-11-16T09:30', 'HNE').zone; // 'America/Toronto'
```

## Dates relatives et espaces insécables

Les dates calendaires renvoient *avant-hier* et *après-demain* à deux jours d’écart, tandis que [`DateTime`](/api/date-time/) compte les unités exactes pour éviter qu’un écart de quelques heures tard le soir ne s’affiche comme « hier ».

Dans vos assertions de test, tenez compte de l’apostrophe courbe `’` dans `'aujourd’hui'` et des espaces insécables fines (`\u202f`) ou standard (`\u00a0`) émises dans les durées courtes :

```js
import { date, datetime, duration } from 'native-dates';

const ref = date('2026-11-10');

ref.minus(2, 'days').from(ref, 'fr-FR'); // 'avant-hier'
ref.from(ref, 'fr-FR'); // 'aujourd’hui'
ref.plus(2, 'days').from(ref, 'fr-FR'); // 'après-demain'
datetime('2026-11-09T14:00Z').from('2026-11-10T14:00Z', 'fr-FR'); // 'il y a 1 jour'
duration({ hours: 3, minutes: 15 }).format('short', 'fr-FR');
// '3\u202fh et 15\u00a0min'
```
