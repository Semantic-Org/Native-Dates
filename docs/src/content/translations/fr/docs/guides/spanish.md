---
source: 7c459605683f
title: Espagnol
lede: Adaptez les formats de date et les conventions horaires en espagnol entre l’Espagne et les Amériques.
---

Le code nu `'es'` applique les conventions d’Espagne : semaine commençant le lundi et horloge sur 24 heures. Les applications destinées à l’Amérique latine ou aux États-Unis doivent définir une étiquette régionale comme `'es-MX'` (voir [Localisation](/guides/localization/)).

## Espagne, Amérique latine et États-Unis

L’Espagne utilise une horloge sur 24 heures. L’Amérique latine et l’espagnol des États-Unis utilisent une horloge sur 12 heures, avec des variations régionales sur l’espacement AM/PM, les séparateurs de date et la variante péruvienne *setiembre* :

```js
import { datetime } from 'native-dates';

const cita = datetime('2026-09-16T17:30:00', 'UTC');

cita.format('medium', 'es-ES'); // '16 sept 2026, 17:30'
cita.format('medium', 'es-MX'); // '16 sep 2026, 5:30 p.m.'
cita.format('medium', 'es-AR'); // '16 sept 2026, 5:30 p. m.'
cita.format('medium', 'es-CO'); // '16/09/2026, 5:30 p. m.'
cita.format('long', 'es-PE'); // '16 de setiembre de 2026 a las 5:30 p. m.'
cita.date.format('short', 'es-PR'); // '09/16/26'
```

Le premier jour de la semaine varie lui aussi dans le monde hispanophone. L’étiquette générique `'es-419'` commence le lundi, contrairement au Mexique ou à la Colombie :

| Étiquettes | Début et heure | Convention régionale |
|---|---|---|
| `'es'`, `'es-ES'` | `1`, `17:30` | Semaine commençant le lundi, horloge sur 24 heures et septembre abrégé en *sept*. |
| `'es-MX'`, `'es-US'` | `7`, `5:30 p.m.` | Semaine commençant le dimanche et indicateur 12 heures sans espace. |
| `'es-AR'`, `'es-CL'` | `1`, `5:30 p. m.` | Semaine commençant le lundi et indicateur espacé, avec dates courtes à tirets au Chili. |
| `'es-CO'`, `'es-PE'` | `7`, `5:30 p. m.` | Semaine commençant le dimanche, dates moyennes numériques en Colombie et *setiembre* au Pérou. |
| `'es-PR'` | `7`, `5:30 p. m.` | Semaine commençant le dimanche et ordre numérique américain mois/jour/année. |

Fixez le lundi avec [`startOf('week', 'monday')`](/api/calendar-date/#startof) (mot-clé anglais `'monday'`) lors du regroupement de rapports hebdomadaires afin que Madrid et Mexico tombent dans la même semaine :

```js
import { date } from 'native-dates';

const wed = date('2026-11-18');

wed.locale('es-ES').startOf('week').toString(); // '2026-11-16'
wed.locale('es-MX').startOf('week').toString(); // '2026-11-15'
wed.locale('es-MX').startOf('week', 'monday').toString(); // '2026-11-16'
```

## Prépositions, minuscules et jours de la semaine

Les dates longues en espagnol relient les éléments par *de*, *del* et *a las*. Entourez ces mots littéraux de crochets dans les motifs de jetons pour éviter que des lettres nues ne lèvent [`unknownFormat`](/api/errors/#units-zones-and-formats) :

```js
import { datetime } from 'native-dates';

const ev = datetime('2026-11-16T18:30:00', 'Europe/Madrid').locale('es-ES');

ev.format('D [de] MMMM [de] YYYY'); // '16 de noviembre de 2026'
ev.format('dddd, D [de] MMMM [a las] HH:mm');
// 'lunes, 16 de noviembre a las 18:30'
```

Les mois, les jours de la semaine et les marqueurs AM/PM restent en minuscules en espagnol. Mettez uniquement le premier caractère en majuscule lorsqu’une date formatée ouvre un titre.

Les initiales d’une seule lettre répètent *M* pour *martes* et *miércoles*. Le jeton `'dd'` sur deux lettres évite d’emblée cette collision, et [`configure()`](/api/configure/) vous laisse personnaliser mercredi ou *1.º* pour le premier du mois :

```js
import { configure, date, weekdayNames } from 'native-dates';

const s = date('2026-05-01').format('full', 'es'); // 'viernes, 1 de mayo de 2026'
s[0].toUpperCase() + s.slice(1); // 'Viernes, 1 de mayo de 2026'
weekdayNames('narrow', 1, 'es-MX'); // ['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do']

configure({
  weekdayNames: { es: { narrow: { tue: 'M', wed: 'X' } } },
  ordinals: { es: (day) => (day === 1 ? '1.º' : day) },
});
date('2026-05-06').format('dd', 'es-MX'); // 'X'
date('2026-05-01').format('Do [de] MMMM', 'es-AR'); // '1.º de mayo'
```

## Analyser les dates et les mois en espagnol

Avec [le plugin `loose`](/plugins/loose/), les dates numériques suivent automatiquement la locale active. L’Espagne et le Chili lisent jour en premier d’office, tandis que Porto Rico lit mois en premier :

```js
import '@native-dates/plugins/loose';
import { date, datetime, dayMonth, monthDay, time, yearMonth } from 'native-dates';

date('06/11/2026', { loose: true, locale: 'es' })?.toString(); // '2026-11-06'
date('16-09-2026', { loose: true, locale: 'es-CL' })?.toString(); // '2026-09-16'
date('06/11/2026', { loose: true, locale: 'es-PR' })?.toString(); // '2026-06-11'
```

Les dates en toutes lettres, les prépositions, les jours de la semaine en tête, la variante péruvienne *setiembre* et les heures espacées sur 12 heures s’analysent aussi en mode souple, tandis que [`dayMonth()`](/api/month-day-fn/#daymonth) numérique fonctionne dans le noyau sans plugin :

```js
date('16 de noviembre de 2026', { loose: true, locale: 'es' })?.toString(); // '2026-11-16'
date('mar, 16 jun 2026', { loose: true, locale: 'es' })?.toString(); // '2026-06-16'
datetime('el 16 de noviembre de 2026 a las 14:30', {
  loose: true,
  locale: 'es',
  zone: 'Europe/Madrid',
})?.hour; // 14
time('5:30 p. m.', { loose: true, locale: 'es-MX' })?.toString(); // '17:30:00'
dayMonth('16/11').toString(); // '11-16'
monthDay('16 set.', { loose: true, locale: 'es-PE' })?.toString(); // '09-16'
yearMonth('enero de 2026', { loose: true, locale: 'es' })?.toString(); // '2026-01'
```

## Fuseaux horaires et passages à l’heure d’été à minuit

La majeure partie du Mexique reste à UTC-6 toute l’année, hors villes frontalières du nord et Quintana Roo. L’abréviation `'CST'` suit la locale active — elle correspond à Chicago par défaut et à La Havane à Cuba :

```js
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-07-15T12:00', 'Mexico City').format('HH:mm Z'); // '12:00 -06:00'
datetime('2026-07-15T12:00', 'CST').format('HH:mm Z'); // '12:00 -05:00'
datetime('2026-07-15T12:00', { zone: 'CST', locale: 'es-CU' }).zone; // 'America/Havana'
datetime('2026-07-15T12:00', 'Tijuana').format('HH:mm Z'); // '12:00 -07:00'
```

[Le plugin `zones`](/plugins/zones/) résout directement les grandes villes hispanophones (par leur nom IANA en anglais comme `'Mexico City'`, `'Tijuana'` ou `'San Juan'`, ainsi que des alias locaux comme `'CDMX'`) et les abréviations latino-américaines comme `'COT'`. `'San Juan'` se résout sur Porto Rico avec `'es-PR'` et sur l’Argentine ailleurs :

```js
datetime('2026-07-15T12:00', 'CDMX').zone; // 'America/Mexico_City'
datetime('2026-07-15T12:00', 'COT').zone; // 'America/Bogota'
datetime('2026-07-15T12:00', 'San Juan').zone; // 'America/Argentina/San_Juan'
datetime('2026-07-15T12:00', { zone: 'San Juan', locale: 'es-PR' }).zone; // 'America/Puerto_Rico'
```

Le Chili et Cuba passent à l’heure d’été à minuit, en sautant directement de 00:00 à 01:00. Appeler [`at('00:00', zone)`](/api/calendar-date/#at) ou `startOf('day')` tombe proprement sur 01:00 de cette même date :

```js
import { date } from 'native-dates';

const spring = date('2026-09-06').at('00:00', 'America/Santiago');

spring.format('YYYY-MM-DD HH:mm Z'); // '2026-09-06 01:00 -03:00'
spring.hoursInDay; // 23
```

## Expressions relatives

L’espagnol dispose de cinq expressions relatives de jour consécutives, d’*anteayer* (avant-hier) à *pasado mañana* (après-demain). [`CalendarDate`](/api/calendar-date/) renvoie directement ces expressions, tandis que [`DateTime`](/api/date-time/) compte les heures écoulées :

```js
import { date, datetime, today } from 'native-dates';

const ref = date('2026-11-16');

ref.minus(2, 'days').from(ref, 'es'); // 'anteayer'
ref.plus(2, 'days').from(ref, 'es'); // 'pasado mañana'
datetime('2026-11-14T12:00Z').from('2026-11-16T12:00Z', 'es'); // 'hace 2 días'
date('2026-11-18').from(today('America/Bogota'), 'es-CO');
```

Sur un serveur partagé, passez [`today(zone)`](/api/date-fn/#today) au lieu d’appeler [`fromNow()`](/api/calendar-date/#fromnow) afin que le basculement à minuit entre *hoy* et *mañana* suive le fuseau horaire local de l’utilisateur.
