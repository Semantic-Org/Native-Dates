---
source: e681c4b680b0
title: monthDay()
lede: قراءة سلسلة شهر ويوم أو أعداد أو حقول أو تاريخ في كائن MonthDay.
---

## قراءة الشهر واليوم

:::entry
### `monthDay()` :kind[function]

```js signature
monthDay(input, options?): MonthDay
monthDay(input, zone?): MonthDay
monthDay(month, day): MonthDay
```

تُنشئ كائن [`MonthDay`](/api/month-day/) من سلسلة بترتيب الشهر أولًا، أو من عددين يبدأ عدّهما من 1، أو من كائن حقول، أو من تاريخ موجود. يُقبَل 29 فبراير حتى تبقى أعياد الميلاد والذكريات السنوية الواقعة في اليوم الكبيس سليمة.

```js title="birthday.js"
import { datetime, monthDay } from 'native-dates';

const fromIso = monthDay('10-17');
const fromSlash = monthDay('10/17');
const fromNumbers = monthDay(2, 29);
const fromFields = monthDay({ month: 10, day: 17 });
const fromInstant = monthDay(datetime('2026-10-18T02:00:00Z'), 'America/Los_Angeles');

fromNumbers.toString(); // '02-29'
fromInstant.toString(); // '10-17'
```

**المعاملات**

```params
- name: input
  type: MonthDayInput | number | string
  required: true
  description: سلسلة بترتيب الشهر أولًا، أو كائن حقول، أو تاريخ أو طابع زمني، أو رقم الشهر (`month`) من 1 إلى 12.
- name: options
  type: Zone | MonthDayOptions | number | string
  description: المنطقة الزمنية أو كائن خيارات، أو عدد صحيح لليوم (`day`) من 1 إلى 31 عند تمرير عددين.
  options:
    - name: zone
      type: Zone
      description: المنطقة الزمنية المستخدَمة لقراءة الشهر واليوم من سلسلة لحظة زمنية أو كائن `DateTime` أو `Date`.
    - name: locale
      type: Locale
      description: وسم الإعداد المحلي BCP 47 المحمول على كائن `MonthDay` المُرجَع وكل قيمة مشتقّة منه.
    - name: dayFirst
      type: boolean
      default: 'false'
      description: قراءة سلاسل الشرطة المائلة أو النقطة أو السلاسل المفصولة بشرطة التي تتضمن رقمًا من خانة واحدة بترتيب اليوم أولًا، على غرار `dayMonth()`.
    - name: loose
      type: boolean
      default: 'false'
      description: "قراءة أسماء الأشهر الإنجليزية أو الموطّنة مثل `'17 février'` وإرجاع `null` عند تعذّر قراءة المدخل مع `@native-dates/plugins/loose`."
```

**القيمة المُرجَعة**

```returns
type: MonthDay
description: كائن `MonthDay` بلا سنة، أو `null` عندما يعجز الوضع المرن عن قراءة `input`.
```

عند تحميل [إضافة `loose`](/plugins/loose/)، يحلّل الوضع المرن أسماء الأشهر بالإنجليزية أو وفق `locale` النشط ويُرجع `null` عند تعذّر قراءة المدخل:

```js
import { monthDay } from 'native-dates';
import '@native-dates/plugins/loose';

monthDay('Oct 17', { loose: true })?.toString(); // '10-17'
monthDay('17 février', { loose: true, locale: 'fr' })?.toString(); // '02-17'
monthDay('whenever', { loose: true }); // null
```
:::

:::entry
### `dayMonth()` :kind[function]

```js signature
dayMonth(input, options?): MonthDay
dayMonth(day, month): MonthDay
```

تقرأ السلاسل والأعداد بترتيب اليوم أولًا كما يكتبها معظم العالم، مثل `'17/10'`. يقرأ استدعاء هذه الدالة المصنعية بترتيب اليوم أولًا دائمًا بغضّ النظر عن الإعدادات العامة.

تظل سلاسل ISO المفصولة بشرطة والمكوّنة من خانتين للشهر وخانتين لليوم مثل `'10-17'` تُقرأ بترتيب الشهر أولًا في كلتا الدالتين؛ ما يضمن عودة مخرجات JSON إلى القيمة نفسها في كل مكان.

**المعاملات**

```params
- name: input
  type: MonthDayInput | number | string
  required: true
  description: "سلسلة بترتيب اليوم أولًا مثل `'17/10'`، أو أي قيمة من نوع `MonthDayInput`، أو عدد صحيح لليوم (`day`) من 1 إلى 31."
- name: options
  type: Zone | MonthDayOptions | number | string
  description: المنطقة الزمنية، أو خيارات القراءة بما فيها `locale`، أو رقم الشهر (`month`) من 1 إلى 12 عند تمرير عددين.
```

**القيمة المُرجَعة**

```returns
type: MonthDay
description: كائن `MonthDay`، أو `null` عندما يعجز الوضع المرن عن قراءة `input`.
```

```js
import { dayMonth } from 'native-dates';

dayMonth('17/10').toString(); // '10-17'
dayMonth('06.05').toString(); // '05-06'
dayMonth(17, 10).toString(); // '10-17'
dayMonth('10-17').toString(); // '10-17'
```
:::

## المدخلات المقبولة

لا تُمرَّر السلاسل الرقمية الخالية من السنة أبدًا إلى محلّل `Date` الأصلي؛ ما يتجنّب افتراض سنة غير كبيسة أو ترحيل الأيام غير الصالحة إلى الشهر التالي.

| المدخل | مثال | طريقة القراءة |
|---|---|---|
| سلسلة شهر ويوم بصيغة ISO | `'10-17'`، `'--10-17'` | تقرأ شهرًا ويومًا من خانتين لكل منهما بترتيب الشهر أولًا في كلٍّ من [`monthDay()`](#monthday) و[`dayMonth()`](#daymonth). |
| سلسلة زوج رقمي | `'10/17'`، `'17.10'`، `'5-6'` | تقرأ عبر `/` أو `.` أو `-` بترتيب الشهر أولًا في `monthDay()` وبترتيب اليوم أولًا في `dayMonth()`. |
| عددان | `monthDay(10, 17)`، `dayMonth(17, 10)` | تقبل عددين صحيحين بترتيب الشهر ثم اليوم أو اليوم ثم الشهر. |
| كائن حقول | `{ month: 10, day: 17 }` | تقرأ الحقول التي يبدأ عدّها من 1 وترفض الأزواج المستحيلة مثل 31 أبريل. |
| تاريخ أو طابع زمني | `'1990-10-17'`، `datetime(...)`، `new Date()` | تستخرج الشهر واليوم التقويميين في المنطقة الزمنية الممرَّرة أو المضبوطة وتُسقط السنة. |
| اسم شهر في الوضع المرن | `'Oct 17'`، `'17 février'` | تقرأ أسماء الأشهر الإنجليزية أو الخاصة بالإعداد المحلي النشط والأعداد الترتيبية بأي ترتيب في الوضع المرن. |
| قيمة Temporal | `Temporal.PlainMonthDay`، `Temporal.PlainDate` | تغلّف قيم Temporal القياسية وفق ISO 8601 مباشرة. |

:::tip[قراءة الشهر واليوم الحاليين]
اقرأ الشهر واليوم الحاليين في أي منطقة زمنية عبر [`today()`](/api/date-fn/#today)، مثل `today('Europe/Berlin').monthDay`.
:::
