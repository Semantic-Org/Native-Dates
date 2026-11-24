---
source: f8fde894143d
title: Arabe
lede: Formatez les dates en arabe selon les calendriers régionaux et les chiffres arabes orientaux ou occidentaux.
---

Définissez une étiquette de pays comme `'ar-EG'` ou `'ar-SA'` (voir [Localisation](/guides/localization/)) plutôt que le code nu `'ar'`. Le système de chiffres, le nom des mois grégoriens et le début de semaine varient d’un pays arabophone à l’autre.

## Chiffres orientaux et occidentaux

Les Émirats arabes unis, les pays du Maghreb et le code nu `'ar'` produisent des chiffres occidentaux, tandis que l’Égypte, l’Arabie saoudite, le Levant et l’Irak produisent des chiffres arabes orientaux.

Ajoutez `-u-nu-latn` ou `-u-nu-arab` à l’étiquette de locale lorsque vous souhaitez un seul système de chiffres pour tous les utilisateurs :

```js
import { date } from 'native-dates';

const invoice = date('2026-11-16');

invoice.format('long', 'ar-EG'); // '١٦ نوفمبر ٢٠٢٦'
invoice.format('long', 'ar-AE'); // '16 نوفمبر 2026'
invoice.format('long', 'ar-EG-u-nu-latn'); // '16 نوفمبر 2026'
invoice.format('long', 'ar-MA-u-nu-arab'); // '١٦ نونبر ٢٠٢٦'
```

Les motifs de jetons produisent toujours des chiffres ASCII tout en localisant les noms de mois et de jours. Les préréglages numériques insèrent des marques droite-à-gauche `\u200F` avant les barres obliques ; préférez donc `'YYYY-MM-DD'` dans les assertions, les CSV et les URL :

```js
invoice.format('YYYY-MM-DD', 'ar-EG'); // '2026-11-16'
invoice.format('dddd، D MMMM YYYY', 'ar-SA'); // 'الاثنين، 16 نوفمبر 2026'
invoice.format('short', 'ar-EG'); // '١٦\u200F/١١\u200F/٢٠٢٦'
```

## Dates hégiriennes et noms de mois régionaux

Les moteurs modernes utilisent le calendrier grégorien par défaut pour `'ar-SA'`. Ajoutez `'-u-ca-islamic-umalqura'` à l’étiquette de locale passée avec un préréglage pour formater les dates officielles du calendrier hégirien Umm al-Qura, comme le 1er chawwal 1447 de l’Hégire :

```js
import { date } from 'native-dates';

const eid = date('2026-03-20');

eid.format('long', 'ar-SA'); // '٢٠ مارس ٢٠٢٦'
eid.format('long', 'ar-SA-u-ca-islamic-umalqura'); // '١ شوال ١٤٤٧ هـ'
eid.format('D MMMM YYYY', 'ar-SA-u-ca-islamic-umalqura'); // '20 مارس 2026'
```

Les motifs de jetons et les dates partielles restent grégoriens car un même mois solaire chevauche deux mois hégiriens. Ancrez d’abord un jour précis avec [`on()`](/api/year-month/#on) :

```js
import { yearMonth } from 'native-dates';

const march = yearMonth('2026-03');

march.format('long', 'ar-SA-u-ca-islamic-umalqura'); // 'مارس ٢٠٢٦'
march.on(1).format('long', 'ar-SA-u-ca-islamic-umalqura'); // '١٢ رمضان ١٤٤٧ هـ'
march.on(20).format('long', 'ar-SA-u-ca-islamic-umalqura'); // '١ شوال ١٤٤٧ هـ'
```

Les noms de mois grégoriens et les horloges sur 12 ou 24 heures se répartissent en quatre familles régionales :

| Région | Exemples d’étiquettes | Comportement en sortie |
|---|---|---|
| Égypte, Golfe, Soudan | `ar-EG, ar-SA` | Mois égyptiens et du Golfe comme يناير, يوليو, نوفمبر avec horloge sur 12 heures (ص / م pour AM et PM). |
| Levant et Irak | `ar-LB, ar-IQ` | Mois levantins comme كانون الثاني, تموز, تشرين الثاني avec horloge sur 12 heures. |
| Maroc | `ar-MA` | Mois marocains comme ماي, يوليوز, غشت, شتنبر, نونبر, دجنبر avec horloge sur 24 heures. |
| Algérie et Tunisie | `ar-DZ, ar-TN` | Mois maghrébins comme جانفي, فيفري, جوان, جويلية, أوت avec horloge sur 12 heures. |

```js
import { datetime } from 'native-dates';

const july = datetime('2026-07-16T14:30', 'UTC');

july.format('long', 'ar-EG'); // '١٦ يوليو ٢٠٢٦ في ٢:٣٠ م'
july.format('long', 'ar-LB'); // '١٦ تموز ٢٠٢٦ في ٢:٣٠ م'
july.format('long', 'ar-MA'); // '16 يوليوز 2026 في 14:30'
july.format('long', 'ar-DZ'); // '16 جويلية 2026 في 2:30 م'
```

## Débuts de semaine et week-ends

La semaine commence le samedi en Égypte, en Jordanie, au Qatar et en Algérie, le dimanche en Arabie saoudite et au Yémen, et le lundi aux Émirats arabes unis, au Maroc, en Tunisie et au Liban.

La propriété `weekStart`, les bornes de semaine et les en-têtes de jours suivent automatiquement chaque étiquette ; pour les agrégations multi-pays, passez explicitement le mot-clé anglais `'monday'` :

```js
import { date, weekdayNames } from 'native-dates';

const wed = date('2026-11-18');

wed.locale('ar-EG').startOf('week').toString(); // '2026-11-14'
wed.locale('ar-SA').startOf('week').toString(); // '2026-11-15'
wed.locale('ar-AE').startOf('week').toString(); // '2026-11-16'
weekdayNames('narrow', undefined, 'ar-EG')[0]; // 'س'
```

[`isWeekend()`](/api/calendar-date/#calendar-predicates) et [`isWeekday()`](/api/calendar-date/#calendar-predicates) suivent eux aussi la locale active. Dans les pays où le week-end tombe le vendredi et le samedi, comme l’Arabie saoudite et l’Égypte, le vendredi est un jour de week-end et le dimanche est un jour ouvré :

```js
const fri = date('2026-11-20').locale('ar-SA');
const sun = date('2026-11-22').locale('ar-SA');

fri.isWeekend(); // true
sun.isWeekend(); // false
sun.isWeekday(); // true
```

## Pluriels à six formes et texte droite-à-gauche

L’arabe utilise six formes de pluriel selon la quantité : zéro, un, deux (comme *يومان*), 3 à 10, 11 à 99 et centaines. [`Duration`](/api/duration/) et [`from()`](/api/date-time/#from) choisissent automatiquement la bonne forme, et les dates calendaires produisent *بعد الغد* pour après-demain :

```js
import { datetime, days } from 'native-dates';

days(1).format('long', 'ar-EG'); // 'يوم'
days(2).format('long', 'ar-EG'); // 'يومان'
days(5).format('long', 'ar-EG'); // '٥ أيام'
days(15).format('long', 'ar-EG'); // '١٥ يومًا'
days(100).format('long', 'ar-EG'); // '١٠٠ يوم'

const anchor = datetime('2026-11-16T09:00', 'Asia/Riyadh');
anchor.plus(2, 'days').from(anchor, 'ar-SA'); // 'خلال يومين'
anchor.date.plus(2, 'days').from(anchor.date, 'ar-SA'); // 'بعد الغد'
```

Dans un paragraphe droite-à-gauche, les navigateurs peuvent réordonner les signes d’une date ISO ou d’un décalage UTC ; enveloppez donc les horodatages techniques dans `<bdi>` :

```html
<p dir="rtl">
  موعد الصيانة: ١٠–١٦ نوفمبر ٢٠٢٦ عند الساعة <bdi>09:00 +03:00</bdi>
</p>
```

## Analyse des entrées et fuseaux horaires

Avec [le plugin `loose`](/plugins/loose/), les locales arabes lisent automatiquement les dates à barres obliques jour en premier, les chiffres arabes orientaux accompagnés de marques de direction, les heures avec *ص* / *م*, ainsi que les noms de mois standards et levantins en plusieurs mots :

```js
import '@native-dates/plugins/loose';
import { date, time, yearMonth } from 'native-dates';

date('06/11/2026', { loose: true, locale: 'ar-EG' })?.toString(); // '2026-11-06'
date('١٦‏/١١‏/٢٠٢٦', { loose: true, locale: 'ar-EG' })?.toString(); // '2026-11-16'
date('16 تشرين الثاني 2026', { loose: true, locale: 'ar-LB' })?.toString(); // '2026-11-16'
time('٢:٣٠ م', { loose: true, locale: 'ar-EG' })?.toString(); // '14:30:00'
yearMonth('تشرين الثاني 2026', { loose: true, locale: 'ar-LB' })?.toString(); // '2026-11'
```

[Le plugin `zones`](/plugins/zones/) résout directement les grandes villes du Golfe et d’Afrique du Nord (par leur nom en anglais comme `'Makkah'` ou `'Doha'`) ainsi que les abréviations régionales comme `'GST'`. Avec `'ar-SA'`, `'AST'` se résout sur Riyad :

```js
import '@native-dates/plugins/zones';
import { date, datetime } from 'native-dates';

datetime('2026-11-16T09:00', 'Makkah').zone; // 'Asia/Riyadh'
datetime('2026-11-16T09:00', 'Doha').zone; // 'Asia/Qatar'
datetime('2026-11-16T09:00', { zone: 'AST', locale: 'ar-SA' }).zone; // 'Asia/Riyadh'
```

Planifiez avec des identifiants IANA complets plutôt qu’avec des décalages fixes. `'Africa/Casablanca'` recule d’une heure pendant le ramadan, et Le Caire passe à l’heure d’été à minuit en sautant directement à 01:00 :

```js
datetime('2026-02-14T12:00', 'Africa/Casablanca').offset; // '+01:00'
datetime('2026-03-01T12:00', 'Africa/Casablanca').offset; // '+00:00'
datetime('2026-03-25T12:00', 'Africa/Casablanca').offset; // '+01:00'

const cairoSpring = date('2026-04-24').at('00:00', 'Africa/Cairo');
cairoSpring.hour; // 1
cairoSpring.hoursInDay; // 23
```
