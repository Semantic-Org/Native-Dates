---
source: 1ff5dd8e887b
title: Coréen
lede: Analysez les dates coréennes à points et formatez les jours de la semaine ainsi que les fêtes lunaires.
---

Définissez la locale `'ko-KR'` (voir [Localisation](/guides/localization/)) pour formater les dates en coréen. Les préréglages coréens affichent des points espacés terminés par un point final comme `'2026. 11. 16.'` et placent *오전* ou *오후* avant l’heure.

## Dates à points et chaînes en coréen

Les dates coréennes à points espacés avec point final et les chaînes avec unités en hangul s’analysent directement dans le noyau sans plugin :

```js
import { date, datetime, yearMonth } from 'native-dates';

date('2026. 11. 16.').toString(); // '2026-11-16'
date('2026년 11월 16일').toString(); // '2026-11-16'
datetime('2026. 11. 16. 14:30', 'Asia/Seoul').toString(); // '2026-11-16T05:30:00.000Z'
yearMonth('2026년 11월').toString(); // '2026-11'
```

Importez [le plugin `loose`](/plugins/loose/) avec une locale coréenne pour lire les dates courtes année en premier sur deux chiffres, les heures avec *오전* / *오후* et les mois-jours en hangul :

```js
import '@native-dates/plugins/loose';
import { date, monthDay, time } from 'native-dates';

date('26. 5. 5.', { loose: true, locale: 'ko' })?.toString(); // '2026-05-05'
date('12.11.26', { loose: true, locale: 'ko' })?.toString(); // '2012-11-26'
time('오후 2:30', { loose: true, locale: 'ko' })?.toString(); // '14:30:00'
monthDay('11월 16일', { loose: true })?.toString(); // '11-16'
```

Passez toujours `locale: 'ko'` pour lire des années sur deux chiffres, car `'12.11.26'` s’interprète comme le 11 décembre 2026 dans un environnement en anglais américain :

| Entrée | Résultat | Traitement |
|---|---|---|
| `'2026. 11. 16.'`, `'2026년 11월 16일'` | Analysé dans le noyau | Passez directement sans plugin. |
| `'26. 5. 5.'`, `'12.11.26'`, `'오후 2:30'` | Analysé en mode souple | Importez le plugin `loose` et passez `{ loose: true, locale: 'ko' }`. |

## Jours entre parenthèses et ordre AM/PM

Le préréglage `'full'` affiche le nom complet du jour comme *화요일* pour mardi. `'llll'` et les options de jour court placent le jour sur un caractère entre parenthèses et relient les plages par un tilde :

```js
import { date, dateRange } from 'native-dates';

const holiday = date('2026-05-05').locale('ko-KR');

holiday.format('llll'); // '2026년 5월 5일 (화)'
holiday.format({ month: 'long', day: 'numeric', weekday: 'short' });
// '5월 5일 (화)'

const week = dateRange('2026-11-16', '2026-11-20');
week.format({ month: 'long', day: 'numeric', weekday: 'short' }, 'ko-KR');
// '11월 16일 (월)~20일 (금)'
```

Le hangul traverse les motifs de jetons sans crochets. Les jetons de mois court et de jour ordinal incluent déjà *월* et *일*, et `'ddd'` formate le jour sur un seul caractère :

```js
import { datetime } from 'native-dates';

const slot = datetime('2026-05-05T14:05:00', 'Asia/Seoul').locale('ko-KR');

slot.format('YYYY. MM. DD. (ddd)'); // '2026. 05. 05. (화)'
slot.format('YYYY년 M월 D일 A h시 m분'); // '2026년 5월 5일 오후 2시 5분'
slot.format('MMM Do (dd)'); // '5월 5일 (화)'
```

Le coréen place *오전* (AM) et *오후* (PM) avant l’heure. Passez `'ko-KR-u-hc-h23'` pour faire passer les préréglages sur 12 heures au format 24 heures :

```js
slot.format('medium'); // '2026. 5. 5. 오후 2:05'
slot.format('medium', 'ko-KR-u-hc-h23'); // '2026. 5. 5. 14:05'
```

## Heure normale de Corée et alias de fuseaux horaires

Le noyau accepte `'Asia/Seoul'` et les décalages fixes. Importez [le plugin `zones`](/plugins/zones/) pour résoudre directement l’abréviation `'KST'` et les villes coréennes (par leur nom en anglais comme `'Busan'` ou leur alias natif en hangul comme `'서울'`), y compris les abréviations intégrées dans une chaîne analysée en mode souple :

```js
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T14:30', 'KST').zone; // 'Asia/Seoul'
datetime('2026-11-16T14:30', '서울').zone; // 'Asia/Seoul'
datetime('2026-11-16T14:30', 'Busan').zone; // 'Asia/Seoul'
datetime('2026. 11. 16. 14:30 KST', { loose: true, zone: 'UTC' })?.toString();
// '2026-11-16T05:30:00.000Z'
```

Les noms courts de fuseaux horaires coréens affichent `GMT+9`, tandis que `'zzz'` produit le nom complet en coréen *한국 표준시*. Comme les serveurs réglés en UTC restent sur la veille jusqu’à 8 h 59 en Corée, passez `'Asia/Seoul'` à [`today()`](/api/date-fn/#today) :

```js
import { datetime, today } from 'native-dates';

const meeting = datetime('2026-11-16T05:30:00Z', 'Asia/Seoul').locale('ko-KR');

meeting.text; // '2026년 11월 16일 오후 2:30 GMT+9'
meeting.format('A h:mm zzz'); // '오후 2:30 한국 표준시'
today('Asia/Seoul');
```

## Calendriers commençant le dimanche et semaines ouvrées dès le lundi

La locale `'ko-KR'` fait commencer la semaine le dimanche, comme les calendriers muraux. Les semaines de travail, les règlements comptables et `weekOfYear` ISO comptent à partir du lundi :

```js
import { date, weekdayNames } from 'native-dates';

const sun = date('2026-11-15').locale('ko-KR');

sun.weekStart; // 7
sun.startOf('week').toString(); // '2026-11-15'
sun.weekOfYear; // 46
weekdayNames('short', undefined, 'ko-KR');
// ['일', '월', '화', '수', '목', '금', '토']
weekdayNames('short', 'monday', 'ko-KR');
// ['월', '화', '수', '목', '금', '토', '일']
```

Passez le mot-clé anglais `'monday'` à chaque appel, fixez le premier jour dans la [configuration](/api/configure/), ou utilisez `'ko-KR-u-fw-mon'` pour garder le texte coréen avec des semaines commençant le lundi :

```js
const wed = date('2026-11-18').locale('ko-KR-u-fw-mon');

wed.weekStart; // 1
wed.startOf('week').toString(); // '2026-11-16'
```

## Dates relatives et fêtes lunaires

En coréen, les dates calendaires renvoient *그저께* pour avant-hier et *모레* pour après-demain. [`DateTime`](/api/date-time/) renvoie *지금* à zéro seconde et des unités chiffrées au-delà :

```js
import { date, datetime } from 'native-dates';

const day = date('2026-11-16').locale('ko-KR');
day.minus(2, 'days').from(day); // '그저께'
day.plus(2, 'days').from(day); // '모레'

const moment = datetime('2026-11-16T12:00', 'Asia/Seoul').locale('ko-KR');
moment.minus(2, 'days').from(moment); // '2일 전'
```

Passez `'ko-KR-u-ca-dangi'` pour Seollal, Chuseok et les anniversaires lunaires, y compris les mois intercalaires comme *윤6월*. Les préréglages courts affichent le numéro de cycle 1–60 au lieu d’une année ; préférez donc `'long'` ou des options mois-jour :

```js
const chuseok = date('2026-09-25');
const leapDay = date('2025-07-25');

chuseok.format('long', 'ko-KR-u-ca-dangi'); // '병오년 8월 15일'
chuseok.format({ month: 'long', day: 'numeric' }, 'ko-KR-u-ca-dangi'); // '8월 15일'
leapDay.format('long', 'ko-KR-u-ca-dangi'); // '을사년 윤6월 1일'
```

:::tip[Formater des dates lunaires récurrentes]
[`MonthDay`](/api/month-day/) et [`YearMonth`](/api/year-month/) restent grégoriens même avec une étiquette de locale lunaire. Formatez plutôt les anniversaires et fêtes lunaires à partir de la [`CalendarDate`](/api/calendar-date/) grégorienne de l’année concernée.
:::
