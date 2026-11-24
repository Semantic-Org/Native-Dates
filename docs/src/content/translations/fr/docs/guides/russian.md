---
source: 621cb0fa9e99
title: Russe
lede: Formatez les mois déclinés et les pluriels en russe, et analysez les dates à points ainsi que les fuseaux horaires régionaux.
---

Définissez la locale `'ru'` (voir [Localisation](/guides/localization/)) pour formater les dates en russe. Les données `Intl` intégrées gèrent les déclinaisons grammaticales des mois et les pluriels à trois formes des durées sans aucun fichier de locale.

## Déclinaisons des mois et suffixe d’année « г. »

Les préréglages mettent le mois au génitif à côté d’un numéro de jour, conservent le nominatif pour un mois-année autonome et ajoutent le suffixe d’année *г.* :

```js
import { date, yearMonth } from 'native-dates';

const release = date('2026-11-16').locale('ru');

release.format('long'); // '16 ноября 2026 г.'
release.format('medium'); // '16 нояб. 2026 г.'
yearMonth('2026-11').format('long', 'ru'); // 'ноябрь 2026 г.'
```

Les motifs de jetons personnalisés omettent *г.* pour des libellés d’interface compacts. Juste après un jeton de jour, `MMMM` et `MMM` passent du nominatif *май* au génitif *мая* :

```js
const may = date('2026-05-06').locale('ru');

may.format('MMMM YYYY'); // 'май 2026'
may.format('D MMMM YYYY'); // '6 мая 2026'
may.format('D MMM'); // '6 мая'
date('2026-03-08').format('D MMM', 'ru'); // '8 мар.'
```

Une terminaison littérale comme `-го` entre le jour et le mois préserve le génitif sur `MMMM`, avec ou sans crochets :

```js
may.format('D-го MMMM'); // '6-го мая'
```

## Jours de la semaine, minuscules et numéros de jour

Le russe écrit les noms de mois et de jours en minuscules, et la semaine commence le lundi avec `weekStart` égal à `1`.

Comme les initiales d’une seule lettre entrent en collision sur plusieurs jours en russe, les styles étroit (`'narrow'`) et court (`'short'`) renvoient tous deux les formes sur deux lettres de *пн* à *вс* (lundi à dimanche) :

```js
import { date, weekdayNames } from 'native-dates';

weekdayNames('narrow', undefined, 'ru');
// ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']
date('2026-11-16').format('dddd, D MMMM', 'ru'); // 'понедельник, 16 ноября'
```

Les dates russes ne placent pas de point après le numéro de jour : `Do` produit donc un nombre simple. Personnalisez les ordinaux ou les jours avec majuscule avec [`configure()`](/api/configure/) :

```js
import { configure, date } from 'native-dates';

configure({
  weekdayNames: { ru: { short: { mon: 'Пн', fri: 'Пт' } } },
  ordinals: { ru: (day) => `${day}-е` },
});

date('2026-11-16').format('ddd, Do MMMM', 'ru'); // 'Пн, 16-е ноября'
```

## Pluriels des durées et dates relatives

Le russe décline les unités selon trois formes : pour 1 et 21, pour 2 à 4, et pour 5 à 20. Le formatage d’une [`Duration`](/api/duration/) sélectionne automatiquement chaque forme :

```js
import { days, duration } from 'native-dates';

days(1).format('long', 'ru'); // '1 день'
days(2).format('long', 'ru'); // '2 дня'
days(5).format('long', 'ru'); // '5 дней'
days(21).format('long', 'ru'); // '21 день'
duration({ days: 2, hours: 5, minutes: 21 }).format('long', 'ru');
// '2 дня 5 часов 21 минута'
```

Sur [`DateTime`](/api/date-time/), [`from()`](/api/date-time/#from) compte les heures et minutes écoulées afin qu’un écart de 22 heures avant minuit reste chiffré.

Sur [`CalendarDate`](/api/calendar-date/), la méthode compare les jours calendaires et renvoie les expressions relatives de jour en russe jusqu’à *позавчера* (avant-hier) et *послезавтра* (après-demain) :

```js
import { date, datetime } from 'native-dates';

const day = date('2026-11-16').locale('ru');
day.minus(2, 'days').from(day); // 'позавчера'
day.minus(1, 'day').from(day); // 'вчера'
day.plus(2, 'days').from(day); // 'послезавтра'

const moment = datetime('2026-11-16T12:00:00Z', 'Europe/Moscow').locale('ru');
moment.minus(1, 'minute').from(moment); // '1 минуту назад'
moment.plus(2, 'days').from(moment); // 'через 2 дня'
```

## Analyser les dates à points et les noms de mois russes

Le noyau accepte les chaînes année en premier comme `'2026.11.16'`. Avec [le plugin `loose`](/plugins/loose/), les locales russes lisent automatiquement les dates à points jour en premier, les noms de mois déclinés et le suffixe d’année *г.* :

```js
import '@native-dates/plugins/loose';
import { date, datetime } from 'native-dates';

date('16.11.2026', { loose: true, locale: 'ru' })?.toString(); // '2026-11-16'
date('06.11.2026', { loose: true, locale: 'ru' })?.toString(); // '2026-11-06'
date('16 ноября 2026 г.', { loose: true, locale: 'ru' })?.toString(); // '2026-11-16'
datetime('16.11.2026, 14:30', {
  zone: 'Europe/Moscow',
  locale: 'ru',
  loose: true,
})?.hour; // 14
```

Le noyau lit directement les paires à points jour-mois et mois-année. Le mode souple reconnaît les mois russes au nominatif comme au génitif sur les dates partielles :

```js
import { dayMonth, monthDay, monthYear, yearMonth } from 'native-dates';

dayMonth('06.11').toString(); // '11-06'
monthYear('11.2026').toString(); // '2026-11'
monthDay('16 ноября', { loose: true, locale: 'ru' })?.toString(); // '11-16'
yearMonth('ноябрь 2026 г.', { loose: true, locale: 'ru' })?.toString(); // '2026-11'
```

## Fuseaux horaires en Russie et dans les pays voisins

La Russie couvre onze fuseaux horaires sans changement d’heure saisonnier, et le Kazakhstan s’est unifié sur UTC+5 en 2024. Les identifiants IANA complets conservent les transitions historiques de décalage sur chaque fuseau horaire.

Avec [le plugin `zones`](/plugins/zones/), les noms de villes IANA en anglais, les grands pôles russes et kazakhs ainsi que les abréviations de Moscou (y compris leurs alias cyrilliques intégrés) se résolvent directement sans configuration :

| Entrée | Prise en charge par défaut | Résolution |
|---|---|---|
| `'Europe/Moscow'`, `'Asia/Almaty'` | Fonctionne dans le noyau | Les identifiants IANA complets fonctionnent directement et conservent les règles historiques de décalage. |
| `'Moscow'`, `'Yekaterinburg'`, `'Minsk'` | Fonctionne avec le plugin | Les noms de villes IANA en anglais correspondent quelle que soit la casse avec le plugin `zones`. |
| `'MSK'`, `'мск'`, `'SPB'`, `'Kazan'`, `'Astana'` | Fonctionne avec le plugin | Les abréviations régionales intégrées, les variantes orthographiques et les alias cyrilliques se résolvent directement. |

```js
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T12:00:00Z', 'MSK').format('HH:mm', 'ru'); // '15:00'
datetime('2026-11-16T12:00:00Z', 'мск').zone; // 'Europe/Moscow'
datetime('2026-11-16T12:00:00Z', 'SPB').zone; // 'Europe/Moscow'
datetime('2026-11-16T12:00:00Z', 'Astana').offset; // '+05:00'
datetime('16 ноября 2026 14:30 мск', {
  loose: true,
  locale: 'ru',
  zone: 'UTC',
})?.toString(); // '2026-11-16T11:30:00.000Z'
```
