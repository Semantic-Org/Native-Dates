---
title: weekdays
kind: plugin
lede: Two-letter weekdays for the `dd` token in languages that write them by hand.
import: import '@native-dates/plugins/weekdays'
size: weekdays
updated: 2026-11-16
---

## Two-letter weekdays by language

The `dd` token prints the shortest weekday: `Mo Tu We` in English. Core reads it from the runtime's own names, which is right for most languages: two letters where the language abbreviates that way, and otherwise the single letters its calendars head their columns with, such as `S T Q Q S S D` in Portuguese and `P S Ç P C C P` in Turkish. A few less widely used languages write a two-letter form that the runtime does not carry. Importing this plugin gives those languages the rows Moment.js and Day.js print.

```js title="weekdays.js"
import '@native-dates/plugins/weekdays';
import { date, weekdayNames } from 'native-dates';

const monday = date('2026-11-16');

monday.format('dd', 'sw'); // 'J3'
monday.format('dd', 'my'); // 'လာ'
monday.format('dd', 'az'); // 'BE'
weekdayNames('narrow', 'monday', 'sw'); // ['J3', 'J4', 'J5', 'Al', 'Ij', 'J1', 'J2']
```

Every other language, and every other token, is unchanged.

## Languages covered

Each row runs Monday to Sunday. The middle column is what core prints without the plugin.

| Language | Without the plugin | With the plugin |
|---|---|---|
| Azerbaijani `az` | `B.E. Ç.A. Ç. C.A. C. Ş. B.` | `BE ÇA Çə CA Cü Şə Bz` |
| Armenian `hy` | `Ե Ե Չ Հ Ո Շ Կ` | `երկ երք չրք հնգ ուրբ շբթ կրկ` |
| Javanese `jv` | `S S R K J S A` | `Sn Sl Rb Km Jm Sp Mg` |
| Khmer `km` | `ច អ ព ព ស ស អ` | `ច អ ព ព្រ សុ ស អា` |
| Latvian `lv` | `P O T C P S S` | `P O T C Pk S Sv` |
| Māori `mi` | `M T W T P Rh Rt` | `Ma Tū We Tāi Pa Hā Ta` |
| Burmese `my` | `တ အ ဗ က သ စ တ` | `လာ ဂါ ဟူး ကြာ သော နေ နွေ` |
| Occitan `oc` | `diluns dimars dimècres …` | `dl dm dc dj dv ds dg` |
| Swahili `sw` | `Jumatatu Jumanne Jumatano …` | `J3 J4 J5 Al Ij J1 J2` |
| Yoruba `yo` | `A Ì Ọ Ọ Ẹ À À` | `Aj Ìs Ọr Ọb Ẹt Àb Àì` |

A regional tag reads its language's row unless it has one of its own, so `sw-KE` and `az-AZ` are covered.

## Adding or changing a row

The plugin exports its table. Set a row once at startup, before the first value is formatted, as seven names from Monday to Sunday separated by spaces:

```js
import { weekdays } from '@native-dates/plugins/weekdays';

weekdays.gd = 'Lu Mà Ci Ar Ha Sa Dò';
weekdays.pt = '2ª 3ª 4ª 5ª 6ª Sá Do';
```
