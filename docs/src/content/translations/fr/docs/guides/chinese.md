---
source: 1f74e099bd7a
title: Chinois
lede: Adaptez les formats de date régionaux et les calendriers lunaires dans l’ensemble des marchés sinophones.
---

Définissez une étiquette régionale comme `'zh-CN'` ou `'zh-TW'` comme détaillé dans [Localisation](/guides/localization/). Chaque région fixe sa propre écriture, l’ordre des dates, le cycle horaire et le premier jour de la semaine.

## Heure normale de Chine et abréviation CST

Passez `'Asia/Shanghai'` pour l’heure de Pékin. Contrairement à un décalage fixe UTC+8, cet identifiant formate le nom localisé du fuseau horaire (*中国标准时间*) et conserve les décalages d’heure d’été appliqués en Chine entre 1986 et 1991 :

```js
import { datetime } from 'native-dates';

const release = datetime('2026-11-16T09:30:00Z', 'Asia/Shanghai').locale('zh-CN');

release.format('YYYY-MM-DD HH:mm zzzz'); // '2026-11-16 17:30 中国标准时间'
datetime('1988-07-15T00:00:00Z', 'Asia/Shanghai').offset; // '+09:00'
```

Avec [le plugin `zones`](/plugins/zones/), l’abréviation `'CST'` suit la locale active : elle se résout sur Shanghai en Chine continentale et sur Taipei à Taïwan. Les grandes villes chinoises (par leur nom en anglais comme `'Beijing'`, `'Shenzhen'` ou `'Urumqi'`, ainsi que des alias natifs comme `'北京'`) se résolvent directement, tandis qu’Urumqi reste sur l’heure du Xinjiang en UTC+6 :

```js
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T09:30:00Z', { zone: 'CST', locale: 'zh-CN' }).zone; // 'Asia/Shanghai'
datetime('2026-11-16T09:30:00Z', { zone: 'CST', locale: 'zh-TW' }).zone; // 'Asia/Taipei'
datetime('2026-11-16T09:30:00Z', 'Beijing').zone; // 'Asia/Shanghai'
datetime('2026-11-16T09:30:00Z', 'Shenzhen').format('HH:mm', 'zh-CN'); // '17:30'
datetime('2026-11-16T09:30:00Z', 'Urumqi').offset; // '+06:00'
```

## Différences régionales

La Chine continentale, Taïwan, Hong Kong, Macao et Singapour diffèrent par leur horloge par défaut, l’ordre des dates courtes, les caractères des jours de la semaine et le début de semaine :

| Étiquette de locale | Date courte | Début de semaine | Horloge par défaut et jours de la semaine |
|---|---|---|---|
| `zh-CN` | `2026/11/16` | Lundi | Horloge sur 24 heures par défaut, jours simplifiés de `周一` à `周日` (lundi à dimanche). |
| `zh-TW` | `2026/11/16` | Dimanche | Horloge sur 12 heures avec `上午` et `下午` pour AM/PM, jours traditionnels en `週一`. |
| `zh-HK` | `16/11/2026` | Dimanche | Horloge sur 12 heures et dates courtes jour/mois/année, partagées avec Macao. |
| `zh-SG` | `16/11/26` | Dimanche | Horloge sur 12 heures, jours simplifiés en `周` et dates jour/mois/année sur deux chiffres. |

Le même instant s’affiche selon le préréglage propre à chaque région :

```js
import { datetime } from 'native-dates';

const meeting = datetime('2026-11-16T17:05:00+08:00', 'Asia/Shanghai');

meeting.format('medium', 'zh-CN'); // '2026年11月16日 17:05'
meeting.format('medium', 'zh-TW'); // '2026年11月16日 下午5:05'
meeting.date.format('short', 'zh-HK'); // '16/11/2026'
meeting.date.format('short', 'zh-SG'); // '16/11/26'
```

Le dimanche clôt la semaine en cours en Chine continentale, alors qu’il en ouvre une nouvelle à Taïwan, à Hong Kong et à Singapour. Passez le mot-clé anglais `'monday'` à [`startOf()`](/api/calendar-date/#startof) pour garder alignées vos clés de rapports hebdomadaires :

```js
import { date } from 'native-dates';

const sunday = date('2026-11-15');

sunday.locale('zh-CN').range('week').toString(); // '2026-11-09/2026-11-15'
sunday.locale('zh-HK').range('week').toString(); // '2026-11-15/2026-11-21'
sunday.locale('zh-HK').startOf('week', 'monday').toString(); // '2026-11-09'
```

En chinois simplifié, `'Ah:mm'` affiche *上午* ou *下午*. Passez `dayPeriod: 'short'` pour obtenir des périodes naturelles comme avant l’aube (*凌晨*), le matin (*早上*), midi (*中午*) et le soir (*晚上*) :

```js
import { time } from 'native-dates';

const night = time('20:30').locale('zh-CN');

night.format('short'); // '20:30'
night.format('Ah:mm'); // '下午8:30'
night.format({
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  dayPeriod: 'short',
}); // '晚上8:30'
```

## Motifs de jetons et analyse des entrées

Les motifs de jetons ne traitent que les lettres latines comme jetons : *年*, *月*, *日* et la ponctuation chinoise ne nécessitent aucun crochet. `'MMMM'` écrit les mois en caractères chinois comme *十一月*, tandis que `'dd'` affiche le jour en un caractère :

```js
import { datetime } from 'native-dates';

const slot = datetime('2026-11-06T14:05:00+08:00', 'Asia/Shanghai').locale('zh-CN');

slot.format('YYYY年M月D日 ddd HH:mm'); // '2026年11月6日 周五 14:05'
slot.format('MMMDo / MMMMDo'); // '11月6日 / 十一月6日'
slot.format('dd / ddd / dddd'); // '五 / 周五 / 星期五'
slot.format('ddd', 'zh-TW'); // '週五'
```

Les fonctions fabriques du noyau analysent directement les dates en caractères chinois année en premier, les barres obliques et les points, assurant l’aller-retour avec le préréglage `'long'` sans plugin. Pour les dates de Hong Kong avec barres obliques jour en premier, les chiffres pleine chasse, les heures avec période de la journée ou l’abréviation CST dans la chaîne, chargez [le plugin `loose`](/plugins/loose/) :

```js
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { date, datetime, monthDay, time, yearMonth } from 'native-dates';

date('2026年11月16日').toString(); // '2026-11-16'
yearMonth('2026年11月').toString(); // '2026-11'
date('16/11/2026', { loose: true, locale: 'zh-HK' })?.toString(); // '2026-11-16'
date('２０２６年１１月１６日', { loose: true })?.toString(); // '2026-11-16'
time('下午5:05', { loose: true, locale: 'zh-TW' })?.toString(); // '17:05:00'
time('晚上9:10', { loose: true, locale: 'zh-CN' })?.toString(); // '21:10:00'
time('凌晨12:00', { loose: true, locale: 'zh-TW' })?.toString(); // '00:00:00'
monthDay('11月16日', { loose: true })?.toString(); // '11-16'
datetime('2026年11月16日 14:30 CST', {
  loose: true,
  locale: 'zh-CN',
  zone: 'UTC',
})?.toString(); // '2026-11-16T06:30:00.000Z'
```

Le mode souple lit aussi bien *上午* / *下午* que les périodes de la journée comme *凌晨*, *中午* et *晚上* pour `'zh-CN'` et `'zh-TW'`.

## Calendriers lunaire chinois et Minguo

Passez `'zh-CN-u-ca-chinese'` lors du formatage d’une date ou d’un instant pour que les préréglages affichent les années du cycle sexagésimal, le premier mois *正月* et les mois intercalaires comme *闰六月*.

Les motifs de jetons lisent toujours les champs grégoriens. Les dates partielles se replient sur le calendrier grégorien faute de numéro de jour, tandis que l’étiquette Minguo de Taïwan `'zh-TW-u-ca-roc'` reste alignée sur les mois grégoriens :

```js
import { date, yearMonth } from 'native-dates';

date('2026-02-17').format('long', 'zh-CN-u-ca-chinese'); // '2026丙午年正月初一'
date('2025-07-25').format('medium', 'zh-CN-u-ca-chinese'); // '2025年闰六月初一'
date('2026-02-17').format('YYYY-MM-DD', 'zh-CN-u-ca-chinese'); // '2026-02-17'
yearMonth('2026-02').format('long', 'zh-CN-u-ca-chinese'); // '2026年2月'
yearMonth('2026-11').format('long', 'zh-TW-u-ca-roc'); // '民國115年11月'
```

## Expressions relatives

[`CalendarDate`](/api/calendar-date/) compte les jours calendaires et renvoie *前天* pour avant-hier et *后天* pour après-demain. [`DateTime`](/api/date-time/) compte les secondes écoulées afin qu’un écart de 23 heures ne s’affiche jamais comme « hier » :

```js
import { date, datetime, today } from 'native-dates';

const base = date('2026-11-16');
date('2026-11-14').from(base, 'zh-CN'); // '前天'
date('2026-11-18').from(base, 'zh-CN'); // '后天'

const anchor = datetime('2026-11-16T12:00:00+08:00', 'Asia/Shanghai');
anchor.minus(2, 'days').from(anchor, 'zh-CN'); // '2天前'
date('2026-11-18').from(today('Asia/Shanghai'), 'zh-CN');
```

Sur les serveurs réglés en UTC, [`fromNow()`](/api/calendar-date/#fromnow) sans argument tombe sur le jour UTC précédent entre minuit et 8 h 00 (heure de Pékin) : passez donc explicitement [`today('Asia/Shanghai')`](/api/date-fn/#today).
