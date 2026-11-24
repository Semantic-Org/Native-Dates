---
source: 436c0292465a
title: MonthDay
lede: شهر ويوم تقويميان بلا سنة، لأعياد الميلاد والذكريات السنوية والعطلات الدورية.
---

## إنشاء كائن MonthDay

أنشئ كائنًا بترتيب الشهر أولًا باستخدام [`monthDay()`](/api/month-day-fn/) أو بترتيب اليوم أولًا باستخدام [`dayMonth()`](/api/month-day-fn/#daymonth). الكائنات غير قابلة للتعديل، لذلك تُرجع كل طريقة قيمة جديدة.

```js title="create.js"
import { dayMonth, monthDay } from 'native-dates';

const birthday = monthDay(10, 17);
const fromIso = monthDay('10-17');
const european = dayMonth('17/10');
```

اقرأ الشهر واليوم من أي [تاريخ تقويمي](/api/calendar-date/) أو [لحظة زمنية](/api/date-time/) عبر الخاصية `monthDay`، أو حوّل داخل سلسلة استدعاءات باستخدام `as('monthDay')`:

```js
import { date, datetime, today } from 'native-dates';

date('1990-10-17').monthDay.toString(); // '10-17'
datetime('2026-10-18T02:00:00Z', 'America/Los_Angeles').as('monthDay').toString(); // '10-17'
const currentMonthDay = today().monthDay;
```

## الخصائص

تقرأ الخصائص الشهر ويوم الشهر بعدّ يبدأ من 1.

| الخاصية | النوع | الوصف |
|---|---|---|
| `text` | `string` | الشهر واليوم منسّقان وفق الإعداد المحلي، مثل `'Oct 17'`. |
| `month`، `day` | `number` | الشهر التقويمي من 1 إلى 12، ويوم الشهر من 1 إلى 31. |

## تعيين السنة والانتقال للأمام وللخلف

اجمع شهرًا ويومًا سنويين مع سنة للحصول على تاريخ محدّد، أو انتقل للأمام أو للخلف إلى أقرب موعد يطابقهما.

:::entry
### `in()` :kind[method]

```js signature
md.in(year): CalendarDate
```

تضع هذا الشهر واليوم في سنة تقويمية وتُرجع كائن [`CalendarDate`](/api/calendar-date/). يقع 29 فبراير على 28 فبراير في السنوات البسيطة التي لا تضم يومًا كبيسًا.

**المعاملات**

```params
- name: year
  type: number | string
  required: true
  description: سنة تقويمية كاملة، مثل `2027`.
```

**القيمة المُرجَعة**

```returns
type: CalendarDate
description: كائن `CalendarDate` الذي يقع فيه هذا الشهر واليوم خلال `year`.
```

```js
const birthday = monthDay(10, 17);
const leapDay = monthDay(2, 29);

birthday.in(2027).toString(); // '2027-10-17'
leapDay.in(2027).toString(); // '2027-02-28'
leapDay.in(2028).toString(); // '2028-02-29'
```
:::

:::entry
### `next()` :kind[method]

```js signature
md.next(day?): CalendarDate
```

تُرجع الموعد القادم بعد تاريخ مرجعي، وترجع افتراضيًا إلى [`today()`](/api/date-fn/#today). وإذا صادف التاريخ المرجعي هذا الشهر واليوم نفسيهما، تتقدّم الطريقة إلى السنة التالية.

تقبل التواريخ التقويمية واللحظات الزمنية أيضًا كائن شهر ويوم مباشرة في [`d.next(md)`](/api/calendar-date/#next) و[`dt.next(md)`](/api/date-time/#next).

**المعاملات**

```params
- name: day
  type: CalendarDateInput
  default: today()
  description: تاريخ البداية للعدّ منه نحو الأمام.
```

**القيمة المُرجَعة**

```returns
type: CalendarDate
description: أقرب كائن `CalendarDate` قادم بعد `day`.
```

```js
import { date, monthDay } from 'native-dates';

const birthday = monthDay(10, 17);

birthday.next('2026-05-01').toString(); // '2026-10-17'
birthday.next('2026-10-17').toString(); // '2027-10-17'
date('2026-11-16').next(birthday).toString(); // '2027-10-17'
```
:::

:::entry
### `previous()` :kind[method]

```js signature
md.previous(day?): CalendarDate
md.last(day?): CalendarDate
```

تُرجع أحدث موعد سابق قبل تاريخ مرجعي، وترجع افتراضيًا إلى [`today()`](/api/date-fn/#today). وتقبل التواريخ التقويمية واللحظات الزمنية أيضًا كائن شهر ويوم مباشرة في `previous()`. يتوفر لها الاسم البديل `last()`.

**المعاملات**

```params
- name: day
  type: CalendarDateInput
  default: today()
  description: التاريخ المرجعي للعدّ منه نحو الخلف.
```

**القيمة المُرجَعة**

```returns
type: CalendarDate
description: أحدث كائن `CalendarDate` سابق قبل `day`.
```

```js
import { date, monthDay } from 'native-dates';

const birthday = monthDay(10, 17);

birthday.previous('2026-10-17').toString(); // '2025-10-17'
date('2026-11-16').previous(birthday).toString(); // '2026-10-17'
```
:::

:::entry
### `after()` :kind[method]

```js signature
md.after(day): CalendarDate
```

تُرجع الموعد القادم بعد تاريخ مرجعي مطلوب. تتصرّف مثل [`next()`](#next) دون الرجوع افتراضيًا إلى اليوم.

**المعاملات**

```params
- name: day
  type: CalendarDateInput
  required: true
  description: التاريخ المرجعي للتقدّم بعده.
```

**القيمة المُرجَعة**

```returns
type: CalendarDate
description: أول موعد `CalendarDate` يقع بعد `day`.
```

```js
monthDay(2, 29).after('2026-03-01').toString(); // '2027-02-28'
```
:::

:::entry
### `before()` :kind[method]

```js signature
md.before(day): CalendarDate
```

تُرجع أحدث موعد سابق قبل تاريخ مرجعي مطلوب. تتصرّف مثل [`previous()`](#previous) دون الرجوع افتراضيًا إلى اليوم.

```js
monthDay(10, 17).before('2026-10-01').toString(); // '2025-10-17'
```
:::

## المطابقة والتساوي

بما أن الشهر واليوم يتكرّران كل سنة ولا يمثّلان تاريخًا واحدًا بعينه، فلا تنطبق عليهما طرق الترتيب مثل `isBefore()`.

:::tip[الاختيار بين equals وfallsOn]
استخدم [`fallsOn()`](#fallson) للتحقق مما إذا كان تاريخ تقويمي يوافق موعد هذه المناسبة في تلك السنة، لأن 29 فبراير يُحسَم إلى 28 فبراير في السنوات البسيطة. واقتصر على [`equals()`](#equals) عندما تريد التحقق من تطابق رقمي الشهر واليوم بالضبط.
:::

:::entry
### `fallsOn()` :kind[method]

```js signature
md.fallsOn(day): boolean
md.isOn(day): boolean
```

تُرجع `true` عندما يوافق التاريخ المعطى موعد هذا الشهر واليوم في سنة ذلك التاريخ. ففي السنة البسيطة يوافق 29 فبراير يوم 28 فبراير، بينما في السنة الكبيسة لا يوافق إلا 29 فبراير. يتوفر لها الاسم البديل `isOn()`.

**المعاملات**

```params
- name: day
  type: CalendarDateInput
  required: true
  description: سلسلة تاريخ، أو `CalendarDate`، أو `DateTime`، أو كائن حقول، أو `Date`.
```

**القيمة المُرجَعة**

```returns
type: boolean
description: "`true` عندما يوافق `day` موعد هذا الشهر واليوم في تلك السنة."
```

```js
const leapDay = monthDay(2, 29);

leapDay.fallsOn('2027-02-28'); // true
leapDay.fallsOn('2028-02-28'); // false
leapDay.fallsOn('2028-02-29'); // true
```
:::

:::entry
### `equals()` :kind[method]

```js signature
md.equals(other): boolean
```

تُرجع `true` عندما تحمل القيمتان رقمي الشهر واليوم نفسيهما بالضبط، مع استخراج الشهر واليوم تلقائيًا عند تمرير تاريخ كامل أو طابع زمني.

ترمي السلاسل الملتبسة المفصولة بشرطة مائلة أو نقطة مثل `'05/10'` خطأ `RangeError`. حلّلها أولًا باستخدام [الدوال المصنعية بترتيب الشهر أولًا أو اليوم أولًا](/api/month-day-fn/) قبل المقارنة.

**المعاملات**

```params
- name: other
  type: MonthDayInput
  required: true
  description: كائن `MonthDay` آخر، أو سلسلة ISO مثل `'10-17'`، أو كائن حقول، أو قيمة تاريخ.
```

**القيمة المُرجَعة**

```returns
type: boolean
description: "`true` عندما تحمل القيمتان الشهر واليوم نفسيهما."
```

```js
const birthday = monthDay(10, 17);

birthday.equals('10-17'); // true
birthday.equals('1990-10-17'); // true
monthDay(2, 29).equals('2027-02-28'); // false
```
:::

:::entry
### `isToday()` :kind[method]

```js signature
md.isToday(zone?): boolean
```

تُرجع `true` عندما يوافق هذا الشهر واليوم تاريخ اليوم في المنطقة الزمنية الممرَّرة أو المضبوطة.

```js
import { today } from 'native-dates';

today('UTC').monthDay.isToday('UTC'); // true
```
:::

:::entry
### `isTomorrow()` :kind[method]

```js signature
md.isTomorrow(zone?): boolean
```

تُرجع `true` عندما يوافق هذا الشهر واليوم تاريخ الغد في المنطقة الزمنية الممرَّرة أو المضبوطة.

```js
import { tomorrow } from 'native-dates';

tomorrow('UTC').monthDay.isTomorrow('UTC'); // true
```
:::

:::entry
### `isYesterday()` :kind[method]

```js signature
md.isYesterday(zone?): boolean
```

تُرجع `true` عندما يوافق هذا الشهر واليوم تاريخ الأمس في المنطقة الزمنية الممرَّرة أو المضبوطة.

```js
import { yesterday } from 'native-dates';

yesterday('UTC').monthDay.isYesterday('UTC'); // true
```
:::

## التنسيق والتحويل

:::entry
### `format()` :kind[method]

```js signature
md.format(spec?, locale?): string
```

تنسّق الشهر واليوم بترتيب الإعداد المحلي نفسه، أو باستخدام نمط رموز مضمّن مثل `'MMM Do'`. تتجاهل كائنات الخيارات المشتركة مفاتيح السنة والساعة والمنطقة الزمنية تلقائيًا.

تعمل التنسيقات المخصّصة المسجّلة في [`configure()`](/api/configure/) هنا أيضًا، وتنسّق الإعدادات المحلية غير الميلادية أسماء الأشهر الميلادية حتى تبقى التواريخ السنوية ثابتة. راجع [التنسيق](/guides/formatting/) للاطلاع على جميع خيارات القوالب الجاهزة والرموز.

**المعاملات**

```params
- name: spec
  type: FormatSpec
  default: "'medium'"
  description: اسم قالب جاهز مثل `'short'` أو `'long'`، أو كائن خيارات `Intl`، أو نمط رموز.
- name: locale
  type: Locale
  description: وسم إعداد محلي BCP 47 يتجاوز الإعداد المحلي لهذه القيمة أو الإعداد العام لهذا الاستدعاء فقط.
```

**القيمة المُرجَعة**

```returns
type: string
description: سلسلة نصية منسّقة للشهر واليوم.
```

```js
const oct17 = monthDay(10, 17);

oct17.format('short', 'en-US'); // '10/17'
oct17.format('short', 'en-GB'); // '17/10'
oct17.format('medium', 'en-US'); // 'Oct 17'
oct17.format('long', 'en-US'); // 'October 17'
oct17.format('MMM Do', 'en-US'); // 'Oct 17th'
```
:::

:::entry
### `locale()` :kind[method]

```js signature
md.locale(): Locale | undefined
md.locale(tag): MonthDay
```

تقرأ الإعداد المحلي المحفوظ مع هذا الشهر واليوم، أو تُرجع نسخة منسّقة بإعداد محلي آخر عبر المعاينات النصية والقوالب الجاهزة وكل تاريخ مشتقّ منهما. يؤدي تمرير وسم فارغ إلى مسح الإعداد المحلي المحفوظ، وتعمل [`lang()`](#lang) اسمًا بديلًا.

**المعاملات**

```params
- name: tag
  type: Locale | null | undefined
  description: وسم إعداد محلي BCP 47 يُحفظ مع النسخة الجديدة، أو `null` لمسح الوسم الحالي.
```

**القيمة المُرجَعة**

```returns
type: MonthDay | Locale | undefined
description: الوسم النشط عند الاستدعاء بلا معاملات، أو كائن `MonthDay` جديد يحمل `tag`.
```

```js
const labourDay = monthDay(5, 1).locale('ru');

labourDay.locale(); // 'ru'
labourDay.format('long'); // '1 мая'
labourDay.in(2026).format('long'); // '1 мая 2026 г.'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
md.lang(): Locale | undefined
md.lang(tag): MonthDay
```

اسم بديل مختصر للطريقة [`locale()`](#locale) يقرأ وسم الإعداد المحلي BCP 47 على هذا الشهر واليوم أو يربطهما بوسم جديد.
:::

:::entry
### `as()` :kind[method]

```js signature
md.as('monthDay'): MonthDay
```

تُرجع هذا الكائن عند طلب `'monthDay'` في سلاسل التحويل العامة، وترمي خطأ `RangeError` للأنواع الأخرى.
:::

:::entry
### `toString()` :kind[method]

```js signature
md.toString(): string
md.toJSON(): string
```

تُرجع سلسلة الشهر واليوم بصيغة ISO من رقمين `'MM-DD'`، والتي تعود للتحليل بترتيب الشهر أولًا دون لبس عبر كلتا [الدالتين المصنعيتين للشهر واليوم](/api/month-day-fn/). وتُرجع `toJSON()` السلسلة نفسها لتسلسل JSON.

**القيمة المُرجَعة**

```returns
type: string
description: سلسلة شهر ويوم بصيغة ISO، مثل `'10-17'`.
```

```js
monthDay(5, 6).toString(); // '05-06'
JSON.stringify({ birthday: monthDay(10, 17) }); // '{"birthday":"10-17"}'
```
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
md.toTemporal(): Temporal.PlainMonthDay
```

تُرجع كائن `Temporal.PlainMonthDay` الأساسي.
:::

:::entry
### `valueOf()` :kind[method]

```js signature
md.valueOf(): never
```

ترمي خطأ `RangeError` حتى لا تحوّل العوامل الرقمية قيمة الشهر واليوم إلى رقم. ضيّق نوع القيم غير المعروفة باستخدام [`isMonthDay()`](/api/kind-of/#ismonthday) أو [`kindOf()`](/api/kind-of/).
:::
