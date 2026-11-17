---
title: weekdays
kind: plugin
lede: Two-letter weekdays for the `dd` token in languages that write them by hand.
import: import '@native-dates/plugins/weekdays'
size: weekdays
updated: 2026-11-16
---

## Two-letter weekdays by language

The `dd` token prints the shortest weekday: `Mo Tu We` in English. Core reads it from the runtime's own names, which is right for most languages. A few have a two-letter form that the runtime does not carry, and core prints the single-letter form there, which can repeat a letter. Importing this plugin gives those languages the rows Moment.js and Day.js print.

```js title="weekdays.js"
import '@native-dates/plugins/weekdays';
import { date, weekdayNames } from 'native-dates';

const monday = date('2026-11-16');

monday.format('dd', 'tr'); // 'Pt'
monday.format('dd', 'id'); // 'Sn'
monday.format('dd', 'sw'); // 'J3'
weekdayNames('narrow', 'monday', 'tr'); // ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz']
```

Every other language, and every other token, is unchanged.

## Languages covered

Each row runs Monday to Sunday. The middle column is what core prints without the plugin.

| Language | Without the plugin | With the plugin |
|---|---|---|
| Azerbaijani `az` | `1 2 3 4 5 6 7` | `BE ÇA Çə CA Cü Şə Bz` |
| Hungarian `hu` | `H K Sz Cs P Sz V` | `h k sze cs p szo v` |
| Armenian `hy` | `Ե Ե Չ Հ Ո Շ Կ` | `երկ երք չրք հնգ ուրբ շբթ կրկ` |
| Indonesian `id` | `S S R K J S M` | `Sn Sl Rb Km Jm Sb Mg` |
| Javanese `jv` | `S S R K J S A` | `Sn Sl Rb Km Jm Sp Mg` |
| Khmer `km` | `ច អ ព ព ស ស អ` | `ច អ ព ព្រ សុ ស អា` |
| Latvian `lv` | `P O T C P S S` | `P O T C Pk S Sv` |
| Māori `mi` | `M T W T P Rh Rt` | `Ma Tū We Tāi Pa Hā Ta` |
| Burmese `my` | `တ အ ဗ က သ စ တ` | `လာ ဂါ ဟူး ကြာ သော နေ နွေ` |
| Occitan `oc` | `M T W T F S S` | `dl dm dc dj dv ds dg` |
| Pashto `ps` | `M T W T F S S` | `د س چ پ ج ش ی` |
| Portuguese `pt` | `S T Q Q S S D` | `2ª 3ª 4ª 5ª 6ª Sá Do` |
| Brazilian Portuguese `pt-BR` | `S T Q Q S S D` | `2ª 3ª 4ª 5ª 6ª sá do` |
| Swahili `sw` | `M T W T F S S` | `J3 J4 J5 Al Ij J1 J2` |
| Turkish `tr` | `P S Ç P C C P` | `Pt Sa Ça Pe Cu Ct Pz` |
| Urdu `ur` | `M T W T F S S` | `پیر منگل بدھ جمعرات جمعہ ہفتہ اتوار` |
| Yoruba `yo` | `A Ì Ọ Ọ Ẹ À À` | `Aj Ìs Ọr Ọb Ẹt Àb Àì` |

A regional tag reads its language's row unless it has one of its own, so `tr-TR` and `sw-KE` are covered.

## Adding or changing a row

The plugin exports its table. Set a row once at startup, before the first value is formatted, as seven names from Monday to Sunday separated by spaces:

```js
import { weekdays } from '@native-dates/plugins/weekdays';

weekdays.gd = 'Lu Mà Ci Ar Ha Sa Dò';
weekdays.pt = 'S T Q Q S S D';
```
