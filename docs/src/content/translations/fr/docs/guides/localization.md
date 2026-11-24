---
source: 7b49470321d3
title: Localisation
lede: Choisissez entre la locale par défaut du navigateur, un réglage global d’application, une locale portée par une valeur ou une surcharge ponctuelle.
---

Native Dates formate vos valeurs grâce aux données `Intl` intégrées au moteur JavaScript. Chaque langue, écriture, règle de pluriel et système calendaire fonctionne sans télécharger de fichiers de locale.

La manière de définir la locale dépend de votre environnement d’exécution. Choisissez la portée qui correspond à votre application :

- **Valeur par défaut de l’environnement** lorsqu’une application navigateur suit les réglages système de l’utilisateur
- **[`configure()`](/api/configure/) global** lorsqu’une application cliente dispose de son propre sélecteur de langue ou d’une locale fixe
- **[`locale()`](/api/date-time/#locale) sur la valeur** lorsqu’un serveur formate par requête ou qu’un chaînage porte sa propre locale
- **[`format()`](/api/date-time/#format) ponctuel** lorsqu’un libellé isolé nécessite un autre calendrier ou une autre variante régionale

## Zéro configuration dans le navigateur

Lorsqu’aucune locale n’est configurée ni passée, toutes les propriétés `.text`, tous les appels à `format()`, ainsi que les plages, les durées et les fonctions de noms de mois ou de jours utilisent la locale active de l’environnement.

Les applications navigateur mono-utilisateur qui suivent la locale système n’ont besoin d’aucun réglage :

```js
import { dateRange, hours, today } from 'native-dates';

today().text;
dateRange('2026-09-01', '2026-09-07').format('medium');
hours(2).format('long');
```

## Valeur par défaut globale pour les applications clientes

Appelez [`configure()`](/api/configure/) une fois au démarrage lorsque votre application possède son propre sélecteur de langue ou cible une locale fixe. Appelez-la de nouveau dès que l’utilisateur change de langue.

Chaque valeur, plage, durée, date partielle et fonction de noms se formate alors dans cette locale :

```js title="main.js"
import { configure, date, days, monthNames, yearMonth } from 'native-dates';

configure({ locale: 'es-ES' });

date('2026-05-15').format('long'); // '15 de mayo de 2026'
yearMonth('2026-05').format('long'); // 'mayo de 2026'
days(2).text; // '2 días'
monthNames('short').slice(0, 3); // ['ene', 'feb', 'mar']

configure({ locale: null });
```

Passez `locale: null` pour revenir à la locale par défaut de l’environnement.

## Attacher une locale à une valeur

Appelez [`locale()`](/api/date-time/#locale) sur n’importe quelle valeur pour obtenir une copie associée à cette locale, ou passez `{ locale }` à une fonction fabrique. [`lang()`](/api/date-time/#lang) sert d’alias si vous préférez un nom plus court.

Tout ce qui découle de cette valeur conserve la même locale. Les calculs, changements de fuseau horaire, extractions de date ou d’heure, plages et durées mesurées en héritent automatiquement :

```js
import { date, datetime } from 'native-dates';

const arrival = datetime('2026-05-15T14:30:00Z', 'Europe/Paris').locale('fr-FR');

arrival.text; // '15 mai 2026, 16:30 UTC+2'
arrival.plus(3, 'days').date.format('long'); // '18 mai 2026'

const stay = date('2026-09-01', { locale: 'de-DE' }).to('2026-09-07');
stay.format('medium'); // '01.–07.09.2026'
```

Sur un serveur multi-utilisateurs, attachez la locale de chaque requête dès la lecture de la valeur au lieu de modifier les réglages globaux du processus :

```js title="orders.js"
import { datetime } from 'native-dates';

function formatOrder(order, user) {
  const placed = datetime(order.placedAt, user.zone).locale(user.locale);
  return {
    placed: placed.format('long'),
    shipBy: placed.plus(2, 'days').date.format('medium'),
  };
}

formatOrder({ placedAt: '2026-05-15T14:30:00Z' }, { zone: 'Asia/Tokyo', locale: 'ja-JP' });
```

:::warning[Évitez configure par requête sur serveur]
La configuration globale modifie un état partagé par tout le processus JavaScript. Sur un serveur multi-utilisateurs, une autre requête peut écraser un appel à `configure()` entre deux opérations asynchrones. Attachez plutôt `locale()` directement à la valeur.
:::

Appeler `locale()` sans argument renvoie l’étiquette active, ou `undefined` si aucune n’a été définie. Passer une valeur vide la réinitialise, ce qui rend le chaînage `locale(user.locale)` sûr même si la colonne en base est vide.

Les chaînes de locale brutes et les en-têtes HTTP `Accept-Language` fonctionnent directement sans prétraitement. Les étiquettes avec tiret bas comme `'en_US'` sont normalisées automatiquement, et les entrées d’en-tête sont triées par poids de qualité en ignorant celles de poids zéro. Une chaîne de locale invalide lève [`unknownLocale`](/api/errors/#units-zones-and-formats) :

```js
datetime('2026-05-15T14:30:00Z').locale('en_US').locale(); // 'en-US'
datetime('2026-05-15T14:30:00Z').locale('fr-CH;q=0.8, de;q=0.9, es;q=0').locale(); // ['de', 'fr-CH']
```

La locale portée par une instance contrôle le texte formaté, les bornes de semaine et les jours de week-end. Les comparaisons exactes, le tri, [`equals()`](/api/date-time/#equals) et la sérialisation ISO via [`toString()`](/api/date-time/#tostring) n’en tiennent pas compte :

```js
import { date } from 'native-dates';

const french = date('2026-05-15').locale('fr');
const japanese = date('2026-05-15').locale('ja');

french.equals(japanese); // true
french.toString(); // '2026-05-15'
french.to(japanese).locale(); // 'fr'
```

Lorsqu’une méthode combine deux valeurs portant des locales différentes, le résultat conserve la locale de la valeur sur laquelle la méthode a été appelée.

## Surcharges ponctuelles de calendrier et de variante régionale

Passez une étiquette BCP 47 à `format()` lorsqu’un libellé isolé requiert un autre calendrier, un autre système numérique ou une autre variante régionale. La valeur d’origine conserve sa propre locale :

```js
import { date } from 'native-dates';

const reiwa = date('2019-05-01').locale('ja-JP');
reiwa.format('long'); // '2019年5月1日'
reiwa.format('long', 'ja-u-ca-japanese'); // '令和元年5月1日'

const eid = date('2026-03-20').locale('ar-SA');
eid.format('long', 'ar-SA-u-ca-islamic-umalqura'); // '١ شوال ١٤٤٧ هـ'
```

## Ordre de résolution des locales

Pour formater une valeur, une plage, une durée ou une expression relative, Native Dates consulte chaque source dans l’ordre et retient la première locale trouvée :

| Priorité | Source | Quand l’utiliser |
|---|---|---|
| 1 | `value.format(spec, locale)` | Un appel ponctuel demande un autre calendrier, une autre écriture ou une variante régionale. |
| 2 | `value.locale(tag)` ou `{ locale }` | Requêtes serveur, chaînages réutilisables ou sections localisées de l’interface. |
| 3 | `configure({ locale })` | Application cliente dotée d’un réglage ou d’un sélecteur de langue global. |
| 4 | Valeur `Intl` de l’environnement | Application navigateur suivant la locale système de l’utilisateur. |

## Semaines et week-ends

Les limites de semaine et les en-têtes de jours suivent automatiquement la locale active. L’environnement place le début de semaine le dimanche aux États-Unis, au Japon, en Corée et au Brésil, le samedi en Égypte, et le lundi dans la plupart des pays d’Europe et en Chine.

Comme [`startOf('week')`](/api/calendar-date/#startof), [`range('week')`](/api/calendar-date/#range) et [`weekdayNames()`](/api/month-names/#weekdaynames) partagent la même règle de premier jour, les en-têtes de calendrier s’alignent toujours sur vos grilles hebdomadaires :

```js
import { date, weekdayNames } from 'native-dates';

const wed = date('2026-11-18');

wed.locale('en-US').startOf('week').toString(); // '2026-11-15'
wed.locale('de-DE').startOf('week').toString(); // '2026-11-16'
wed.locale('ar-EG').startOf('week').toString(); // '2026-11-14'

weekdayNames('short', undefined, 'en-US')[0]; // 'Sun'
weekdayNames('short', undefined, 'de-DE')[0]; // 'Mo'
```

Passez un nom de jour en anglais pour surcharger un appel précis, ou définissez `weekStart` dans [`configure()`](/api/configure/) pour fixer un début de semaine identique pour toutes les locales. Passer une valeur vide rétablit le suivi de la locale, et les environnements dépourvus de données de semaine se replient sur le lundi.

:::details[Protéger les rapports à semaine fixe]
Une instance conserve la locale de la valeur dont elle est issue. Fixez `weekStart` ou vérifiez `day.weekStart`, numéroté de 1 (lundi) à 7 (dimanche), chaque fois que des données stockées comme des rapports ou des périodes de facturation sont indexées par semaine :

```js title="reports.js"
function weekKey(day) {
  if (day.weekStart !== 1) {
    throw new Error('weekly reports are keyed by Monday weeks');
  }
  return day.startOf('week').toString();
}
```

Les numéros de semaine ISO renvoyés par `weekOfYear` comptent toujours les semaines à partir du lundi, et `dayOfWeek` suit la même numérotation commençant le lundi.
:::

Les tests de week-end suivent eux aussi la locale active. [`isWeekend()`](/api/calendar-date/#calendar-predicates) et [`isWeekday()`](/api/calendar-date/#calendar-predicates) considèrent le vendredi et le samedi comme week-end en Arabie saoudite et en Égypte, et le vendredi seul en Iran. L’Inde n’inclut que le dimanche, tandis que la plupart des autres locales retiennent le samedi et le dimanche :

```js
const friday = date('2026-11-20');

friday.locale('en-US').isWeekend(); // false
friday.locale('ar-SA').isWeekend(); // true
```

## Noms de jours et ordinaux personnalisés

Les noms de mois et de jours proviennent de l’environnement afin de correspondre à l’affichage de l’appareil de l’utilisateur. Deux jetons de formatage ne disposent d’aucun champ standard sur la plateforme : le nom le plus court du jour avec `dd`, et l’ordinal du jour avec `Do`.

Par défaut, `dd` tronque le nom court du jour à deux lettres dans les écritures qui abrègent ainsi, et utilise sinon la forme étroite de l’environnement (qui peut ne compter qu’un seul caractère en CJK ou en arabe). `Do` ajoute les suffixes ordinaux en anglais et le marqueur de jour de la locale ailleurs, comme `'6.'` en allemand.

Surchargez l’un ou l’autre globalement avec `weekdayNames` et `ordinals` dans [`configure()`](/api/configure/). Les étiquettes régionales comme `'fr-CA'` héritent des entrées de leur langue de base et y superposent leurs propres surcharges, sans affecter les préréglages ni les options `Intl`. Voir [Personnalisation](/guides/customization/#custom-weekday-names-and-ordinals) pour des exemples.

Parcourez les [exemples par langue](/examples/#localization) et les guides dédiés sous **Guides par langue** dans la barre latérale pour les particularités régionales, d’écriture et de calendrier. Lisez ensuite [Types de temps](/guides/types-of-time/) pour choisir le bon type pour chaque valeur de votre application.
