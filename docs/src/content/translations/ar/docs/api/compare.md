---
source: a03fe5ee9f3b
title: compare()
lede: فرز القيم واختيار الحدود الدنيا والعليا عبر التواريخ واللحظات الزمنية والأوقات والمدد والنطاقات.
---

## الفرز والترتيب

:::entry
### `compare()` :kind[function]

```js signature
compare(a, b): -1 | 0 | 1
```

ترتّب قيمتين من النوع نفسه لاستخدامها مع `Array.prototype.sort()`، وتُرجع عددًا سالبًا أو صفرًا أو موجبًا. تعمل عبر اللحظات الزمنية، وطوابع عصر Unix الزمنية، والتواريخ التقويمية، وأوقات الساعة، والمدد الزمنية، وقيم [السنة والشهر](/api/year-month/)، و[النطاقات](/api/ranges/).

يمكن أن يكون أي من الوسيطين أيضًا سلسلة ISO خامًا، أو كائن `Date` أصليًا في JavaScript، أو طابعًا زمنيًا بالمللي ثانية منذ عصر Unix (ويُحوَّل الأخيران إلى `DateTime`). وعند المقارنة مع وقت ساعة يُقرأ العدد بوصفه ساعة، بينما ترمي مقارنة نوعين مختلفين خطأ `TypeError`.

```js title="sort.js"
import { compare, date, datetime, hours, minutes } from 'native-dates';

const dates = [date('2026-12-01'), date('2026-05-10'), date('2026-08-20')];
dates.sort(compare).map(String); // ['2026-05-10', '2026-08-20', '2026-12-01']

const moments = [
  datetime('2026-11-16T18:00', 'Europe/Berlin'),
  datetime('2026-11-16T08:00', 'America/Los_Angeles'),
];
moments.sort(compare)[0].zone; // 'America/Los_Angeles'

compare(1794840000000, datetime('2026-11-16T18:00Z')); // -1

const spans = [hours(2), minutes(45), minutes(90)].sort(compare);
spans[0].minutes; // 45
```

**المعاملات**

```params
- name: a
  type: Point | Duration | YearMonth | Range
  required: true
  description: القيمة الأولى المُنَمَّطة، أو سلسلة ISO، أو كائن `Date`، أو طابع زمني بالمللي ثانية منذ عصر Unix للمقارنة.
- name: b
  type: Point | Duration | YearMonth | Range
  required: true
  description: القيمة الثانية من النوع نفسه، أو مدخل خام يطابق نوع `a`.
```

**القيمة المُرجَعة**

```returns
type: -1 | 0 | 1
description: القيمة `-1` عندما تسبق القيمة الأولى، و`0` عند التساوي، و`1` عندما تأتي لاحقًا.
```

تُفرَز النطاقات من النوع نفسه حسب نقطة البداية أولًا، ويُفصَل التعادل حسب نقطة النهاية:

```js
import { compare, dateRange } from 'native-dates';

const windows = [
  dateRange('2026-11-10', '2026-11-20'),
  dateRange('2026-11-10', '2026-11-14'),
  dateRange('2026-11-01', '2026-11-05'),
];

windows.sort(compare).map(String);
// ['2026-11-01/2026-11-05', '2026-11-10/2026-11-14', '2026-11-10/2026-11-20']
```
:::

:::note[مقارنة اللحظات الزمنية عبر المناطق الزمنية]
ترتّب `compare()` قيم [`DateTime`](/api/date-time/) حسب لحظتها الزمنية الدقيقة لا حسب أرقام ساعتها المحلية. فيأتي اجتماع الساعة 9:00 صباحًا في نيويورك قبل اجتماع الساعة 8:00 صباحًا في اليوم نفسه في لوس أنجلوس.
:::

## اختيار النقاط الحدّية

اعثر على القيمة الدنيا أو العليا ضمن مجموعة من التواريخ أو اللحظات الزمنية أو أوقات الساعة أو قيم [`YearMonth`](/api/year-month/). تقبل كلتا الدالتين المساعدتين وسائط متعددة أو مصفوفة واحدة غير فارغة.

:::entry
### `earliest()` :kind[function]

```js signature
earliest(...points): DateTime | CalendarDate | Time | YearMonth
earliest(points): DateTime | CalendarDate | Time | YearMonth
```

تُرجع أقدم قيمة من وسيط واحد أو أكثر أو من مصفوفة غير فارغة من النوع نفسه، مع تحويل كائنات `Date` الأصلية في JavaScript أو مدخلات المللي ثانية منذ عصر Unix إلى كائن [`DateTime`](/api/date-time/). يرمي تمرير مصفوفة فارغة خطأ `RangeError`.

**المعاملات**

```params
- name: points
  type: Point[] | YearMonth[]
  required: true
  description: قيمة واحدة أو أكثر من التواريخ أو اللحظات الزمنية أو طوابع عصر Unix أو أوقات الساعة أو قيم السنة والشهر من النوع نفسه.
```

**القيمة المُرجَعة**

```returns
type: DateTime | CalendarDate | Time | YearMonth
description: القيمة الأسبق ترتيبًا؛ وتحتفظ اللحظات المتساوية بالعنصر الأسبق في القائمة.
```

```js
import { date, earliest, time } from 'native-dates';

earliest(date('2026-11-20'), date('2026-11-04'), date('2026-11-16')).toString(); // '2026-11-04'
earliest([time('5:30pm'), time('9:00am'), time('12:15pm')]).toString(); // '09:00:00'
earliest(1794850200000, 1794840000000).epochMilliseconds; // 1794840000000
```
:::

:::entry
### `latest()` :kind[function]

```js signature
latest(...points): DateTime | CalendarDate | Time | YearMonth
latest(points): DateTime | CalendarDate | Time | YearMonth
```

تُرجع أحدث قيمة من وسيط واحد أو أكثر أو من مصفوفة غير فارغة من النوع نفسه، مع تحويل كائنات `Date` الأصلية في JavaScript أو مدخلات المللي ثانية منذ عصر Unix إلى كائن `DateTime`. يرمي تمرير مصفوفة فارغة خطأ `RangeError`.

**المعاملات**

```params
- name: points
  type: Point[] | YearMonth[]
  required: true
  description: قيمة واحدة أو أكثر من التواريخ أو اللحظات الزمنية أو أوقات الساعة أو قيم السنة والشهر من النوع نفسه.
```

**القيمة المُرجَعة**

```returns
type: DateTime | CalendarDate | Time | YearMonth
description: القيمة الأحدث ترتيبًا؛ وتحتفظ اللحظات المتساوية بالعنصر الأسبق في القائمة.
```

اجمع بين [`earliest()`](#earliest) و`latest()` لتقييد قيمة بين حدّين:

```js
import { date, earliest, latest } from 'native-dates';

const minDate = date('2026-11-01');
const maxDate = date('2026-11-30');
const picked = date('2026-12-12');

const clamped = earliest(maxDate, latest(minDate, picked));
clamped.toString(); // '2026-11-30'
```
:::
