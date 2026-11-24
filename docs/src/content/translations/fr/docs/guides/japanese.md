---
source: e095c0bff2bd
title: Japonais
lede: Formatez les ères impériales et les jours entre parenthèses en japonais, et gérez les dates à barres obliques ainsi que les semaines commençant le dimanche.
---

Définissez la locale `'ja-JP'` (voir [Localisation](/guides/localization/)) pour formater les dates en japonais. Les années grégoriennes restent utilisées par défaut, tandis que `'ja-u-ca-japanese'` fait basculer les préréglages vers les ères impériales à la demande.

## Ères impériales et premières années d’ère

Passez `'ja-u-ca-japanese'` pour formater les dates impériales officielles, comme Heisei 31 le 30 avril 2019 et la première année de l’ère Reiwa (*元年*) le lendemain :

```js
import { date } from 'native-dates';

date('2019-04-30').format('long', 'ja-u-ca-japanese'); // '平成31年4月30日'
date('2019-05-01').format('long', 'ja-u-ca-japanese'); // '令和元年5月1日'
date('2026-11-16').format('short', 'ja-u-ca-japanese'); // 'R8/11/16'
date('2026-11-16').format('llll', 'ja-u-ca-japanese'); // '令和8年11月16日(月)'
```

Les motifs de jetons comme `'YYYY年M月D日'` et la propriété `year` lisent toujours l’année grégorienne, même avec une locale impériale attachée. Utilisez des préréglages ou des objets d’options lorsque vous souhaitez afficher les noms d’ères :

```js
const reiwa = date('2026-11-16').locale('ja-u-ca-japanese');

reiwa.year; // 2026
reiwa.format('long'); // '令和8年11月16日'
reiwa.format('YYYY年M月D日'); // '2026年11月16日'
```

[`YearMonth`](/api/year-month/) ne possède pas de numéro de jour et formate donc selon l’ère en vigueur le 1er du mois. Pour une transition en cours de mois comme janvier 1989 (de Shōwa 64 à Heisei 1), sélectionnez d’abord un jour avec [`on()`](/api/year-month/#on) :

```js
import { yearMonth } from 'native-dates';

const jan1989 = yearMonth('1989-01');

jan1989.format('long', 'ja-u-ca-japanese'); // '昭和64年1月'
jan1989.on(8).format('long', 'ja-u-ca-japanese'); // '平成元年1月8日'
```

## Jours entre parenthèses et format 12 heures

Les préréglages japonais standards diffèrent par leurs séparateurs et le style des jours de la semaine :

| Préréglage | Sortie | Style et usage courant |
|---|---|---|
| `'medium'` | `'2026/11/16'` | Notation compacte à barres obliques pour les tableaux et champs de formulaire. |
| `'long'` | `'2026年11月16日'` | Date standard année-mois-jour en kanji, sans jour de la semaine. |
| `'full'` | `'2026年11月16日月曜日'` | Ajoute le jour complet comme lundi (*月曜日*) sans espace ni parenthèses. |
| `'llll'` | `'2026年11月16日(月)'` | Style d’interface courant avec le kanji unique de lundi (*月*) entre parenthèses demi-chasse. |

Le jeton `'ddd'` renvoie un kanji de jour nu comme *月*, ce qui vous laisse l’entourer de parenthèses pleine chasse. Les jetons de mois long et de jour ordinal ajoutent déjà *月* et *日* ; associez donc des jetons numériques de mois et de jour aux kanji littéraux :

```js
import { date } from 'native-dates';

const day = date('2026-11-16').locale('ja-JP');

day.format('YYYY年M月D日（ddd）'); // '2026年11月16日（月）'
day.format('MMMMDo(ddd)'); // '11月16日(月)'
day.format({ month: 'long', day: 'numeric', weekday: 'short' }); // '11月16日(月)'
```

L’heure utilise par défaut le format 24 heures. Passez `hour12: true` pour obtenir la notation japonaise comptée à partir de 0 (*午前0:30* et *午後0:30*), ou utilisez `'Ah:mm'` pour compter de 1 à 12 :

```js
import { datetime } from 'native-dates';

const midnight = datetime('2026-11-16T00:30', 'Asia/Tokyo').locale('ja-JP');

midnight.format('time'); // '0:30'
midnight.format({ hour: 'numeric', minute: '2-digit', hour12: true }); // '午前0:30'
midnight.format('Ah:mm'); // '午前12:30'
```

## Dates à barres obliques et saisie en japonais

Les dates en kanji année en premier, les barres obliques et les points issus de CSV ou de formulaires japonais s’analysent directement dans le noyau sans plugin :

```js
import { date, datetime, yearMonth } from 'native-dates';

date('2026年11月16日').toString(); // '2026-11-16'
date('2026/1/5').toString(); // '2026-01-05'
datetime('2026年11月16日 9:30', 'Asia/Tokyo').toString(); // '2026-11-16T00:30:00.000Z'
yearMonth('2026年11月').toString(); // '2026-11'
```

Avec [le plugin `loose`](/plugins/loose/), les chiffres et la ponctuation pleine chasse, les heures avec *午前* / *午後* et les mois-jours en kanji se lisent sans normalisation manuelle :

```js
import '@native-dates/plugins/loose';
import { date, monthDay, time } from 'native-dates';

date('２０２６／１１／１６', { loose: true })?.toString(); // '2026-11-16'
time('午後2:30', { loose: true, locale: 'ja' })?.toString(); // '14:30:00'
monthDay('11月16日', { loose: true })?.toString(); // '11-16'
```

Les chaînes d’ère comme `'令和8年11月16日'` nécessitent encore une entrée structurée. Lorsqu’un formulaire recueille séparément l’ère et l’année, passez un `Temporal.PlainDate` japonais directement à [`date()`](/api/date-fn/) sans conversion préalable :

```js
const reiwaInput = Temporal.PlainDate.from({
  calendar: 'japanese',
  era: 'reiwa',
  eraYear: 8,
  month: 11,
  day: 16,
});

date(reiwaInput).toString(); // '2026-11-16'
```

## Fuseaux horaires et début de semaine

Le noyau accepte `'Asia/Tokyo'` et les décalages fixes. Avec [le plugin `zones`](/plugins/zones/), l’abréviation `'JST'` et les grandes villes japonaises (par leur nom en anglais comme `'Osaka'` ou leur alias natif comme `'東京'`) se résolvent directement :

```js
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'JST').zone; // 'Asia/Tokyo'
datetime('2026-11-16T09:30', 'Osaka').zone; // 'Asia/Tokyo'
datetime('2026-11-16T09:30', '東京').zone; // 'Asia/Tokyo'
```

Les locales japonaises font commencer la semaine le dimanche, comme les calendriers muraux. Passez le mot-clé anglais `'monday'` ou fixez `weekStart` pour des plannings professionnels commençant le lundi :

```js
import { date, weekdayNames } from 'native-dates';

const wed = date('2026-11-18').locale('ja-JP');

wed.weekStart; // 7
wed.startOf('week').toString(); // '2026-11-15'
wed.startOf('week', 'monday').toString(); // '2026-11-16'
weekdayNames('short', undefined, 'ja-JP');
// ['日', '月', '火', '水', '木', '金', '土']
weekdayNames('short', 'monday', 'ja-JP');
// ['月', '火', '水', '木', '金', '土', '日']
```

## Plages et expressions relatives

Les préréglages de plage relient les dates à barres obliques ou les heures en kanji par un tilde pleine chasse. Passez un motif de jetons à [`format()`](/api/ranges/#format) lorsque les deux bornes doivent afficher une date en kanji et le jour de la semaine :

```js
import { dateRange, timeRange } from 'native-dates';

const span = dateRange('2026-11-16', '2026-11-20').locale('ja-JP');

span.format('long'); // '2026/11/16～2026/11/20'
span.format('M月D日(ddd)'); // '11月16日(月) – 11月20日(金)'
timeRange('09:00', '17:30').format('short', 'ja-JP'); // '9時00分～17時30分'
```

[`CalendarDate`](/api/calendar-date/) renvoie les expressions relatives de jour jusqu’à *一昨日* (avant-hier) et *明後日* (après-demain). [`DateTime`](/api/date-time/) produit toujours des unités chiffrées afin qu’un écart en heures ne se transforme jamais en jour calendaire trompeur :

```js
import { date, datetime, duration } from 'native-dates';

const baseDate = date('2026-11-16').locale('ja-JP');
baseDate.minus(2, 'days').from(baseDate); // '一昨日'
baseDate.plus(2, 'days').from(baseDate); // '明後日'

const baseTime = datetime('2026-11-16T12:00', 'Asia/Tokyo').locale('ja-JP');
baseTime.minus(1, 'day').from(baseTime); // '1 日前'
duration({ hours: 2, minutes: 30 }).format('long', 'ja-JP'); // '2 時間 30 分'
```

:::tip[Espaces et point de code du tilde pleine chasse]
Les expressions relatives et les durées japonaises placent des espaces demi-chasse autour des nombres selon les données standards du moteur. Les préréglages de plage émettent le tilde pleine chasse `U+FF5E` et non le tiret ondulé `U+301C` : vérifiez ce point de code dans vos assertions.
:::
