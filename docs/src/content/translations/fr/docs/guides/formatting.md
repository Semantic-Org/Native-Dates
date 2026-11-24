---
source: 2716034cf571
title: Formatage
lede: Formatez des dates, des heures du jour, des instants et des durées avec des préréglages localisés, des motifs de jetons ou des expressions relatives.
---

Native Dates utilise les formateurs `Intl` natifs de la plateforme et les met en cache automatiquement. Vous obtenez une sortie localisée dans chaque langue et région sans ajouter de fichiers de locale à votre bundle.

## Sortie rapide avec text et les préréglages

Chaque instance expose une propriété `.text` formatée dans votre locale active. Appeler [`format()`](/api/date-time/#format) sans argument applique le préréglage par défaut de chaque type :

```js
import { date, datetime, duration, time } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
standup.text; // 'Nov 16, 2026, 9:30 AM PST'
standup.format(); // 'Nov 16, 2026, 9:30 AM'

date('2026-11-16').text; // 'Nov 16, 2026'
time('9:30am').text; // '9:30 AM'
duration('1h 30m').text; // '1 hour, 30 minutes'
```

Passez un nom de préréglage à `format()` pour choisir le niveau de détail à afficher :

| Préréglage | Exemple | Types pris en charge et sortie |
|---|---|---|
| `'short'` | `'5/4/26, 9:30 AM'` | Date numérique ou heure courte pour les dates, heures du jour, instants, dates partielles et durées. |
| `'medium'` | `'May 4, 2026, 9:30 AM'` | Mois abrégé sur les dates et instants, ou heure avec secondes sur [`Time`](/api/time/). |
| `'long'` | `'May 4, 2026 at 9:30 AM'` | Nom complet du mois, heure avec secondes sur `Time` ou unités en toutes lettres sur [`Duration`](/api/duration/). |
| `'full'` | `'Monday, May 4, 2026 at 9:30 AM'` | Jour de la semaine et mois complets sur les dates et instants, ou mois complet sur les dates partielles. |
| `'date'` | `'May 4, 2026'` | Partie date sur [`DateTime`](/api/date-time/) et [`CalendarDate`](/api/calendar-date/). |
| `'time'` | `'9:30 AM'` | Heure courte sur `DateTime` et `Time`. |
| `'month'` | `'May 2026'` | Nom complet du mois et année sur `DateTime`, `CalendarDate` et [`YearMonth`](/api/year-month/). |
| `'text'` | `'May 4, 2026, 9:30 AM PDT'` | Date, heure et nom court du fuseau horaire sur `DateTime`, ou champs propres à chaque type ailleurs. |

:::details[Noms de préréglages Moment et Day.js]
Le noyau accepte également les noms de préréglages localisés de Moment et Day.js :

| Préréglage | Exemple | Champs localisés |
|---|---|---|
| `'LT'`, `'LTS'` | `'9:30 AM'`, `'9:30:00 AM'` | Heure courte, ou heure avec secondes. |
| `'L'`, `'l'` | `'05/04/2026'`, `'5/4/2026'` | Année, mois et jour numériques, avec ou sans zéros initiaux. |
| `'LL'`, `'ll'` | `'May 4, 2026'` | Nom de mois long ou abrégé avec le jour et l’année. |
| `'LLL'`, `'lll'` | `'May 4, 2026 at 9:30 AM'` | Date longue ou abrégée accompagnée de l’heure courte. |
| `'LLLL'`, `'llll'` | `'Monday, May 4, 2026 at 9:30 AM'` | Jour de la semaine complet ou abrégé, date et heure courte. |
:::

Les dates, heures du jour, [années-mois](/api/year-month/) et [mois-jours](/api/month-day/) acceptent tous les préréglages ci-dessus et ne conservent que les champs qui leur sont propres. Les [durées](/api/duration/) prennent aussi en charge les styles compact et numérique :

```js
import { date, duration, time, yearMonth } from 'native-dates';

date('2026-11-16').format('full', 'en-US'); // 'Monday, November 16, 2026'
yearMonth('2026-11').format('LL', 'en-US'); // 'November 2026'
time('9:30:15am').format('LTS', 'en-US'); // '9:30:15 AM'

const span = duration({ hours: 2, minutes: 15 });
span.format('narrow', 'en-US'); // '2h 15m'
span.format('digital', 'en-US'); // '2:15:00'
```

## Locales et options Intl

Fixez une valeur par défaut globale avec [`configure()`](/api/configure/), attachez une locale à une valeur avec [`locale()`](/api/date-time/#locale) ou passez une étiquette à un appel ponctuel de formatage. Consultez [Localisation](/guides/localization/) pour choisir la bonne approche entre application cliente et serveur multi-utilisateurs :

```js
import { configure, datetime } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'Europe/Berlin');
standup.locale('de-DE').plus(1, 'week').format('long'); // '23. November 2026 um 09:30'
standup.format('long', 'ja-JP'); // '2026年11月16日 9:30'

configure({ locale: 'en-GB' });
configure({ locale: null });
```

Lorsqu’aucun préréglage ne convient à votre affichage, passez directement un objet d’options au formateur `Intl` sous-jacent :

```js
import { date } from 'native-dates';

const day = date('2026-11-16');

day.format({ weekday: 'long' }, 'en-US'); // 'Monday'
day.format({ month: 'short', day: 'numeric' }, 'en-US'); // 'Nov 16'
```

Comme chaque type ne contient que ses propres champs, les préréglages s’adaptent à la grammaire, aux pluriels, aux systèmes d’écriture et aux calendriers locaux sans fichiers de locale. Parcourez les [exemples par langue](/examples/) pour vérifier les cas particuliers de votre langue cible :

```js
import { date, days, yearMonth } from 'native-dates';

date('2019-05-01').format('long', 'ja-u-ca-japanese'); // '令和元年5月1日'
yearMonth('2026-05').format('long', 'ru'); // 'май 2026 г.'
date('2026-05-01').format('long', 'ru'); // '1 мая 2026 г.'
days(2).format('long', 'ar'); // 'يومان'
```

:::tip[Affichage utilisateur ou chaînes d’échange]
Réservez `format()` au texte destiné aux utilisateurs. Pour stocker des valeurs ou les envoyer sur le réseau, appelez [`toString()`](/api/date-time/#tostring) ou sérialisez en JSON afin de conserver un format ISO 8601 stable. Voir [Stockage et échange](/guides/storing-and-sending/).
:::

## Motifs de jetons

Lorsque vous avez besoin d’une mise en forme fixe, passez un motif de jetons à `format()`. Entourez les mots littéraux de crochets pour les recopier tels quels :

```js
import { datetime, monthDay, yearMonth } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.format('YYYY-MM-DD HH:mm'); // '2026-11-16 09:30'
standup.format('YYYY-MM-DDTHH:mmZ'); // '2026-11-16T09:30-08:00'
standup.format('dddd, MMM D [at] h:mm A', 'en-US'); // 'Monday, Nov 16 at 9:30 AM'
yearMonth('2026-11').format('MMM YYYY', 'en-US'); // 'Nov 2026'
monthDay('11-16').format('MMMM Do', 'en-US'); // 'November 16th'
```

Les noms de mois et de jours dans un motif de jetons proviennent d’`Intl` pour la locale active. Les chiffres et les années restent au format occidental ISO afin que des motifs comme `'YYYY-MM-DD'` restent exploitables partout.

:::details[Tous les jetons de formatage]
| Jeton | Exemple | Sortie |
|---|---|---|
| `YYYY` | `'2026'` | Année sur quatre chiffres, précédée d’un signe pour les années négatives. |
| `YY` | `'26'` | Année sur deux chiffres. |
| `Q` | `'4'` | Trimestre calendaire de 1 à 4. |
| `M`, `MM` | `'11'`, `'05'` | Numéro du mois, sans zéro initial ou sur deux chiffres. |
| `MMM`, `MMMM` | `'Nov'`, `'November'` | Nom localisé du mois grégorien, automatiquement décliné après un jeton de jour même avec du texte littéral entre les deux. |
| `D`, `DD` | `'5'`, `'05'` | Jour du mois, sans zéro initial ou sur deux chiffres. |
| `Do` | `'16th'` | Jour du mois avec ordinal anglais, marqueur local de jour comme `'6.'` ou `'6日'`, ou règle [`ordinals`](/api/configure/) personnalisée. |
| `DDD`, `DDDD` | `'320'`, `'045'` | Jour de l’année, sans zéro initial ou sur trois chiffres. |
| `E` | `'7'` | Jour ISO de la semaine, numéroté de 1 (lundi) à 7 (dimanche), identique à `dayOfWeek`. |
| `d` | `'0'` | Jour de la semaine, numéroté de 0 (dimanche) à 6 (samedi), comme dans Moment et Day.js. |
| `dd`, `ddd`, `dddd` | `'Mo'`, `'Mon'`, `'Monday'` | Nom localisé le plus court (1 ou 2 caractères selon le système d’écriture), abrégé ou complet du jour de la semaine, personnalisable via [`weekdayNames`](/api/configure/). |
| `W`, `WW` | `'47'`, `'05'` | Semaine ISO de l’année, sans zéro initial ou sur deux chiffres. |
| `H`, `HH` | `'9'`, `'09'` | Heure sur 24 heures, sans zéro initial ou sur deux chiffres. |
| `h`, `hh` | `'9'`, `'09'` | Heure sur 12 heures de 1 à 12. |
| `m`, `mm` | `'5'`, `'05'` | Minute, sans zéro initial ou sur deux chiffres. |
| `s`, `ss` | `'8'`, `'08'` | Seconde, sans zéro initial ou sur deux chiffres. |
| `S`, `SS`, `SSS` | `'4'`, `'42'`, `'420'` | Dixièmes, centièmes ou millisecondes. |
| `A`, `a` | `'AM'`, `'am'` | `'AM'` et `'PM'` en majuscules ou minuscules en anglais, ou période du jour de la locale comme `'午後'` ou `'م'`. |
| `Z`, `ZZ` | `'-08:00'`, `'-0800'` | Décalage UTC avec ou sans deux-points. |
| `z`, `zz` | `'PST'` | Nom court localisé du fuseau horaire. |
| `zzz`, `zzzz` | `'Pacific Standard Time'` | Nom complet localisé du fuseau horaire. |
| `X` | `'1794850200'` | Horodatage Unix en secondes entières. |
| `x` | `'1794850200000'` | Horodatage Unix en millisecondes. |
| `[text]` | `'[at]'` | Texte littéral échappé, recopié tel quel dans la sortie. |
:::

Les lettres non reconnues hors crochets lèvent une erreur [`unknownFormat`](/api/errors/#units-zones-and-formats) au lieu d’afficher des lettres brutes. Les jetons collés à des lettres accentuées comme `'às'` ou les lettres horaires mélangées comme `'HHhmm'` lèvent également une erreur. Un `T` isolé passe sans échappement pour les horodatages ISO.

Demander un champ absent d’un type lève une erreur [`unsupportedToken`](/api/errors/#units-zones-and-formats) au lieu d’inventer minuit. Formater des jetons horaires comme `'HH:mm'` sur une date calendaire échoue immédiatement.

Le noyau exporte aussi [`monthNames()`](/api/month-names/) et `weekdayNames()` (dont le second argument `weekStart` prend un nom de jour en anglais) pour construire des en-têtes de calendrier et des listes déroulantes localisées :

```js
import { monthNames, weekdayNames } from 'native-dates';

monthNames('short', 'en-US'); // ['Jan', 'Feb', 'Mar', ...]
weekdayNames('short', undefined, 'en-US'); // ['Sun', 'Mon', 'Tue', ...]
weekdayNames('narrow', 'monday', 'en-US'); // ['Mo', 'Tu', 'We', ...]
```

## Nommer vos propres formats

Déclarez des noms de formats réutilisables dans [`configure()`](/api/configure/) lorsque votre application utilise un même motif de jetons ou objet d’options `Intl` dans plusieurs vues. Les noms personnalisés fonctionnent sur les dates, heures du jour, instants, dates partielles et plages, et ont priorité sur les préréglages intégrés. Voir [Formats nommés](/guides/customization/#named-formats).

## Formater des plages

Chaque [plage](/api/ranges/) formate les préréglages et options via `Intl`, en condensant automatiquement les mois ou années communs. Passer un motif de jetons formate les deux bornes séparées par `' – '` :

```js
import { dateRange, timeRange } from 'native-dates';

const week = dateRange('2026-09-01', '2026-09-07');
const shift = timeRange('9:00am', '5:00pm');

week.format('medium', 'en-US'); // 'Sep 1 – 7, 2026'
week.format('YYYY-MM-DD'); // '2026-09-01 – 2026-09-07'
shift.format('short', 'en-US'); // '9:00 AM – 5:00 PM'
```

## Expressions relatives

Appelez [`from()`](/api/date-time/#from) ou [`fromNow()`](/api/date-time/#fromnow) sur les instants et les dates calendaires pour obtenir des expressions localisées via le formateur relatif de la plateforme. [`formatRelative()`](/api/date-time/#formatrelative) sert d’alias :

```js
import { date, datetime, now, today } from 'native-dates';

now().minus(5, 'minutes').fromNow('en-US'); // '5 minutes ago'
today().plus(1, 'day').fromNow('en-US'); // 'tomorrow'

const anchor = datetime('2026-11-16T12:00', 'UTC');
anchor.minus(3, 'hours').from(anchor, 'en-US'); // '3 hours ago'
anchor.minus(23, 'hours').from(anchor, 'en-US'); // '1 day ago'

const currentDay = date('2026-11-16');
currentDay.minus(1, 'day').from(currentDay, 'en-US'); // 'yesterday'
currentDay.plus(14, 'days').from(currentDay, 'en-US'); // 'in 2 weeks'
```

Les dates calendaires comptent des jours entiers : `from()` et `fromNow()` renvoient donc des expressions comme « hier », « aujourd’hui » ou « demain » dans un rayon de sept jours. Les instants mesurent le temps écoulé à l’horloge et s’en tiennent à des compteurs numériques au-delà de « maintenant », puisqu’un événement survenu il y a 23 heures peut encore tomber le même jour calendaire.

Lisez ensuite [Analyse](/guides/parsing/) pour convertir des chaînes entrantes et des valeurs externes en objets typés.
