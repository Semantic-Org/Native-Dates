---
source: df57e2243cc3
title: CalendarDate
lede: تاريخ تقويمي بلا وقت من اليوم ولا منطقة زمنية.
---

## إنشاء CalendarDate

أنشئ كائنًا من نص ISO أو من أرقام السنة والشهر واليوم أو من قيمة موجودة عبر [`date()`](/api/date-fn/)، أو اقرأ اليوم الحالي عبر [`today()`](/api/date-fn/#today). وتعمل الدالتان المساعدتان [`tomorrow()`](/api/date-fn/#tomorrow) و[`yesterday()`](/api/date-fn/#yesterday) بالطريقة نفسها، وتُرجع كل طريقة كائنًا جديدًا غير قابل للتعديل.

```js title="create.js"
import { date, today, tomorrow } from 'native-dates';

const birthday = date('2026-05-10');
const launch = date(2026, 11, 16);
const current = today();
const nextDay = tomorrow('America/New_York');
```

لأن التاريخ التقويمي بلا ساعة ولا منطقة زمنية، يبقى 10 مايو هو 10 مايو لكل مستخدم أينما كان. ويمكنك أيضًا استخراج التاريخ التقويمي المحلي من أي كائن [`DateTime`](/api/date-time/):

```js
import { datetime } from 'native-dates';

const flight = datetime('2026-11-16T23:30:00Z', 'Asia/Tokyo');
flight.date.toString(); // '2026-11-17'
```

## الخصائص

تقرأ الخصائص حقول تقويم ISO مباشرةً.

| الخاصية | النوع | الوصف |
|---|---|---|
| `text` | `string` | التاريخ التقويمي منسّقًا حسب الإعداد المحلي، مثل `'Nov 16, 2026'`. |
| `year`، `month`، `day` | `number` | السنة التقويمية، والشهر (1–12)، ويوم الشهر (1–31). |
| `yearMonth` | [`YearMonth`](/api/year-month/) | السنة والشهر التقويميان بعد إسقاط اليوم. |
| `monthDay` | [`MonthDay`](/api/month-day/) | الشهر واليوم التقويميان بعد إسقاط السنة. |
| `dayOfWeek` | `number` | رقم يوم الأسبوع وفق معيار ISO، من 1 ليوم الاثنين حتى 7 ليوم الأحد. |
| `weekStart` | `number` | اليوم الأول في أسابيع هذا التاريخ من 1 إلى 7، وفقًا لـ [`configure()`](/api/configure/) أو إعداده المحلي. |
| `quarter` | `number` | الربع التقويمي من السنة (1–4). |
| `weekOfYear`، `dayOfYear` | `number` | رقم الأسبوع وفق ISO (1–53) ويوم السنة (1–366). |
| `daysInMonth`، `daysInYear` | `number` | عدد الأيام في الشهر الحالي (28–31) والسنة الحالية (365 أو 366). |

## التركيب والحقول

ألحِق وقت يوم ومنطقة زمنية بالتاريخ لإنشاء لحظة زمنية محدّدة، أو استبدل حقول التقويم الفردية.

:::entry
### `at()` :kind[method]

```js signature
d.at(time?, zone?): DateTime
```

تجمع هذا التاريخ التقويمي مع وقت يوم في منطقة زمنية وتُرجع كائن [`DateTime`](/api/date-time/). وعند حذف الوقت يُضبط افتراضيًا على منتصف الليل في بداية اليوم.

**المعاملات**

```params
- name: time
  type: TimeInput
  default: "'00:00'"
  description: نص وقت مثل `'9:30am'`، أو كائن `Time`، أو كائن حقول، أو كائن `Date`.
- name: zone
  type: Zone
  description: اسم منطقة زمنية من IANA، أو إزاحة UTC ثابتة، أو `'UTC'`، وتُستخدم المنطقة المضبوطة افتراضيًا.
```

**القيمة المُرجَعة**

```returns
type: DateTime
description: كائن `DateTime` جديد في هذا التاريخ عند وقت `time` ضمن `zone`.
```

```js
const day = date('2026-11-16');

day.at('9:30am', 'America/Los_Angeles').toString(); // '2026-11-16T17:30:00.000Z'
day.at(undefined, 'UTC').toString(); // '2026-11-16T00:00:00.000Z'
```
:::

:::entry
### `set()` :kind[method]

```js signature
d.set(fields): CalendarDate
d.set(unit, value): CalendarDate
```

تُرجع كائن `CalendarDate` جديدًا بعد استبدال حقل تقويمي أو أكثر. ترمي التواريخ الخارجة عن النطاق مثل 30 فبراير خطأ `RangeError` بدل الانتقال إلى الشهر التالي. وعند تحديث `month` أو `year` دون `day`، يُقيَّد اليوم المتجاوز بآخر يوم صالح في الشهر المستهدف.

**المعاملات**

```params
- name: fields
  type: DateTimeFields | DateUnit
  required: true
  description: كائن يضم حقول `year` أو `month` أو `day`، أو اسم وحدة تقويمية واحد بالإنجليزية.
- name: value
  type: number
  description: قيمة عددية صحيحة للوحدة المحدّدة `unit`.
```

**القيمة المُرجَعة**

```returns
type: CalendarDate
description: كائن `CalendarDate` جديد بالحقول التقويمية المحدَّثة.
```

```js
const due = date('2026-11-16');

due.set('day', 1).toString(); // '2026-11-01'
due.set({ month: 12, day: 31 }).toString(); // '2026-12-31'
```
:::

## العمليات الحسابية وحدود الوحدات

تنقّل عبر الوحدات التقويمية، أو اضبط التاريخ على حدودها، أو انتقل إلى يوم أسبوع مجاور. ترمي وحدات الساعة مثل الساعات والدقائق خطأ `RangeError` لأن التاريخ التقويمي بلا ساعة.

:::note[التقييد بآخر يوم في الشهر]
إضافة الأشهر أو السنوات تُقيِّد النتيجة بآخر يوم صالح في الشهر المستهدف بدل تجاوز الشهر إلى الشهر التالي. فإضافة شهر واحد إلى 31 يناير تصل إلى 28 فبراير، أو 29 فبراير في السنة الكبيسة.
:::

:::entry
### `plus()` :kind[method]

```js signature
d.plus(amount, unit?): CalendarDate
d.add(amount, unit?): CalendarDate
```

تتقدّم بالسنوات أو الأرباع أو الأشهر أو الأسابيع أو الأيام وتُرجع كائن `CalendarDate` جديدًا. لها اسم بديل هو `add()`.

**المعاملات**

```params
- name: amount
  type: DurationInput
  required: true
  description: عدد مقترن بـ `unit`، أو كائن `Duration`، أو عبارة مدة بالإنجليزية، أو كائن حقول.
- name: unit
  type: DateUnit
  description: اسم وحدة تقويمية بالإنجليزية عندما يكون `amount` رقمًا، مثل `'days'` أو `'months'`.
```

**القيمة المُرجَعة**

```returns
type: CalendarDate
description: كائن `CalendarDate` جديد مُزاح إلى الأمام على التقويم.
```

```js
const billing = date('2026-01-31');

billing.plus(1, 'month').toString(); // '2026-02-28'
billing.plus('2 weeks').toString(); // '2026-02-14'
```
:::

:::entry
### `minus()` :kind[method]

```js signature
d.minus(amount, unit?): CalendarDate
d.subtract(amount, unit?): CalendarDate
```

تتراجع بمقدار مدة تقويمية. تقبل المدخلات نفسها التي تقبلها [`plus()`](#plus)، ولها اسم بديل هو `subtract()`.

**المعاملات**

```params
- name: amount
  type: DurationInput
  required: true
  description: عدد مقترن بـ `unit`، أو كائن `Duration`، أو عبارة مدة بالإنجليزية، أو كائن حقول.
- name: unit
  type: DateUnit
  description: اسم وحدة تقويمية بالإنجليزية عندما يكون `amount` رقمًا.
```

**القيمة المُرجَعة**

```returns
type: CalendarDate
description: كائن `CalendarDate` جديد مُزاح إلى الخلف على التقويم.
```

```js
const launch = date('2026-03-01');

launch.minus(1, 'day').toString(); // '2026-02-28'
launch.minus({ weeks: 2, days: 1 }).toString(); // '2026-02-14'
```
:::

:::entry
### `startOf()` :kind[method]

```js signature
d.startOf(unit, firstDay?): CalendarDate
```

تُرجع اليوم الأول من الوحدة التقويمية التي تضمّ هذا التاريخ. تبدأ حدود الأسبوع من `firstDay`، أو من خيار `weekStart` المضبوط عبر [`configure()`](/api/configure/)، أو من الإعداد المحلي النشط لهذا التاريخ.

**المعاملات**

```params
- name: unit
  type: DateUnit
  required: true
  description: اسم وحدة تقويمية بالإنجليزية من `'year'` حتى `'day'`.
- name: firstDay
  type: DayOfWeek
  description: اليوم الأول في الأسبوع عند استخدام وحدة الأسبوع، باسم يوم من أيام الأسبوع بالإنجليزية مثل `'sunday'` أو رقم ISO مثل `7`.
```

**القيمة المُرجَعة**

```returns
type: CalendarDate
description: اليوم التقويمي الأول في الوحدة `unit`.
```

```js
const wed = date('2026-11-18', { locale: 'en-US' });

wed.startOf('month').toString(); // '2026-11-01'
wed.startOf('quarter').toString(); // '2026-10-01'
wed.startOf('week').toString(); // '2026-11-15'
wed.startOf('week', 'monday').toString(); // '2026-11-16'
```
:::

:::entry
### `endOf()` :kind[method]

```js signature
d.endOf(unit, firstDay?): CalendarDate
```

تُرجع اليوم الأخير من الوحدة التقويمية التي تضمّ هذا التاريخ.

**المعاملات**

```params
- name: unit
  type: DateUnit
  required: true
  description: اسم وحدة تقويمية بالإنجليزية من `'year'` حتى `'day'`.
- name: firstDay
  type: DayOfWeek
  description: اليوم الأول في الأسبوع عندما تكون `unit` هي `'week'`.
```

**القيمة المُرجَعة**

```returns
type: CalendarDate
description: اليوم التقويمي الأخير في الوحدة `unit`.
```

```js
date('2026-02-10').endOf('month').toString(); // '2026-02-28'
date('2028-02-10').endOf('month').toString(); // '2028-02-29'
```
:::

:::entry
### `startOfNext()` :kind[method]

```js signature
d.startOfNext(unit, firstDay?): CalendarDate
```

تُرجع اليوم الأول من الوحدة التقويمية التالية للوحدة التي تضمّ هذا التاريخ. النتيجة دائمًا تاريخ لاحق، لذلك من 1 ديسمبر يبدأ الشهر التالي في 1 يناير.

مرّر اسم يوم من أيام الأسبوع بالإنجليزية بدل اسم الوحدة للحصول على اليوم التالي الذي يحمل ذلك الاسم، وهو التاريخ نفسه الذي تُرجعه [`next()`](#next).

**المعاملات**

```params
- name: unit
  type: DateUnit | Exclude<DayOfWeek, number>
  required: true
  description: اسم وحدة تقويمية بالإنجليزية من `'year'` حتى `'day'`، أو اسم يوم أسبوع بالإنجليزية مثل `'wednesday'`.
- name: firstDay
  type: DayOfWeek
  description: اليوم الأول في الأسبوع عندما تكون `unit` هي `'week'`.
```

**القيمة المُرجَعة**

```returns
type: CalendarDate
description: اليوم التقويمي الأول في الوحدة التالية لـ `unit`، أو يوم الأسبوع المحدّد التالي.
```

```js
const mon = date('2026-11-16', { locale: 'en-US' });

mon.startOfNext('month').toString(); // '2026-12-01'
mon.startOfNext('quarter').toString(); // '2027-01-01'
mon.startOfNext('week').toString(); // '2026-11-22'
mon.startOfNext('wednesday').toString(); // '2026-11-18'
```
:::

:::entry
### `startOfPrevious()` :kind[method]

```js signature
d.startOfPrevious(unit, firstDay?): CalendarDate
```

تُرجع اليوم الأول من الوحدة التقويمية السابقة للوحدة التي تضمّ هذا التاريخ. وتمرير اسم يوم من أيام الأسبوع بالإنجليزية بدل الوحدة يُرجع أحدث يوم بذلك الاسم، كما تفعل [`previous()`](#previous).

**المعاملات**

```params
- name: unit
  type: DateUnit | Exclude<DayOfWeek, number>
  required: true
  description: اسم وحدة تقويمية بالإنجليزية من `'year'` حتى `'day'`، أو اسم يوم أسبوع بالإنجليزية مثل `'wednesday'`.
- name: firstDay
  type: DayOfWeek
  description: اليوم الأول في الأسبوع عندما تكون `unit` هي `'week'`.
```

**القيمة المُرجَعة**

```returns
type: CalendarDate
description: اليوم التقويمي الأول في الوحدة السابقة لـ `unit`، أو يوم الأسبوع المحدّد السابق.
```

```js
const mon = date('2026-11-16');

mon.startOfPrevious('month').toString(); // '2026-10-01'
mon.startOfPrevious('year').toString(); // '2025-01-01'
mon.startOfPrevious('wednesday').toString(); // '2026-11-11'
```
:::

:::entry
### `next()` :kind[method]

```js signature
d.next(target): CalendarDate
```

تتقدّم إلى يوم الأسبوع المحدّد التالي أو إلى قيمة [`MonthDay`](/api/month-day/) التالية بعد هذا التاريخ. وإذا كان التاريخ يقع أصلًا في ذلك اليوم أو التاريخ السنوي، تتقدّم إلى الموعد الذي يليه.

**المعاملات**

```params
- name: target
  type: DayOfWeek | MonthDay
  required: true
  description: اسم يوم من أيام الأسبوع بالإنجليزية مثل `'friday'`، أو رقم ISO من 1 إلى 7، أو كائن `MonthDay` متكرّر سنويًا.
```

**القيمة المُرجَعة**

```returns
type: CalendarDate
description: كائن `CalendarDate` جديد في اليوم المطابق التالي.
```

```js
import { date, monthDay } from 'native-dates';

const mon = date('2026-11-16');

mon.next('friday').toString(); // '2026-11-20'
mon.next('monday').toString(); // '2026-11-23'
mon.next(monthDay('12-25')).toString(); // '2026-12-25'
```
:::

:::entry
### `previous()` :kind[method]

```js signature
d.previous(target): CalendarDate
```

تتراجع إلى أحدث يوم أسبوع محدّد أو قيمة [`MonthDay`](/api/month-day/) قبل هذا التاريخ. وإذا كان التاريخ يقع أصلًا في ذلك اليوم أو التاريخ السنوي، تتراجع إلى الموعد الأسبق.

**المعاملات**

```params
- name: target
  type: DayOfWeek | MonthDay
  required: true
  description: اسم يوم أسبوع بالإنجليزية، أو اختصاره من ثلاثة أحرف، أو رقم ISO من 1 إلى 7، أو كائن `MonthDay` متكرّر سنويًا.
```

**القيمة المُرجَعة**

```returns
type: CalendarDate
description: كائن `CalendarDate` جديد في اليوم المطابق السابق.
```

```js
date('2026-11-16').previous('friday').toString(); // '2026-11-13'
date('2026-11-16').previous(monthDay('10-31')).toString(); // '2026-10-31'
```
:::

## مقارنة التواريخ

قارن التواريخ التقويمية مباشرةً أو مرّر أي مدخل تقبله [`date()`](/api/date-fn/).

:::warning[تجنّب عوامل المقارنة الرقمية]
التاريخ التقويمي ليس طابعًا زمنيًا، لذلك ترمي العوامل الرقمية خطأ `RangeError` بدل تحويله ضمنيًا إلى مللي ثانية. قارن التواريخ باستخدام طرق مثل [`isBefore()`](#isbefore)، أو رتّب المصفوفات باستخدام [`compare()`](/api/compare/).
:::

:::entry
### `equals()` :kind[method]

```js signature
d.equals(other): boolean
```

تُرجع `true` عندما تمثّل القيمتان السنة التقويمية والشهر واليوم نفسها.

**المعاملات**

```params
- name: other
  type: CalendarDateInput
  required: true
  description: كائن `CalendarDate` آخر أو أي قيمة مدخلة تقبلها `date()`.
```

**القيمة المُرجَعة**

```returns
type: boolean
description: "قيمة منطقية تكون `true` إذا كانت القيمتان تمثّلان اليوم التقويمي نفسه."
```

```js
const due = date('2026-11-16');

due.equals('2026-11-16'); // true
due.equals(date(2026, 11, 16)); // true
```
:::

:::entry
### `isBefore()` :kind[method]

```js signature
d.isBefore(other): boolean
```

تُرجع `true` إذا كان هذا التاريخ أسبق على التقويم من التاريخ الآخر.

```js
date('2026-11-15').isBefore('2026-11-16'); // true
```
:::

:::entry
### `isAfter()` :kind[method]

```js signature
d.isAfter(other): boolean
```

تُرجع `true` إذا كان هذا التاريخ لاحقًا على التقويم للتاريخ الآخر.

```js
date('2026-11-17').isAfter('2026-11-16'); // true
```
:::

:::entry
### `isSame()` :kind[method]

```js signature
d.isSame(other, unit?, firstDay?): boolean
```

تتحقّق مما إذا كان تاريخ آخر يقع في الوحدة التقويمية نفسها، مثل الشهر نفسه أو الأسبوع نفسه. واستدعاء `isSame()` دون وحدة يتحقّق مما إذا كانت القيمتان تمثّلان اليوم نفسه بالضبط.

**المعاملات**

```params
- name: other
  type: CalendarDateInput
  required: true
  description: التاريخ التقويمي المراد المقارنة به.
- name: unit
  type: DateUnit
  description: اسم الوحدة التقويمية بالإنجليزية للمقارنة، من `'year'` حتى `'day'`.
- name: firstDay
  type: DayOfWeek
  description: اليوم الأول في الأسبوع عندما تكون `unit` هي `'week'`.
```

**القيمة المُرجَعة**

```returns
type: boolean
description: "قيمة منطقية تكون `true` عندما يقع التاريخان في الوحدة `unit` نفسها."
```

```js
const wed = date('2026-09-09', { locale: 'en-US' });

wed.isSame('2026-09-30', 'month'); // true
wed.isSame('2026-09-06', 'week'); // true
wed.isSame('2026-09-06', 'week', 'monday'); // false
```
:::

### دوال التحقّق التقويمية

تقبل فحوصات الأيام النسبية منطقة زمنية اختيارية لأن تحديد أي يوم تقويمي هو «اليوم» يعتمد على موقعك. وعند حذفها تستخدم المنطقة الافتراضية من [`configure()`](/api/configure/).

| الطريقة | النوع | الوصف |
|---|---|---|
| `isToday(zone?)`، `isTomorrow(zone?)`، `isYesterday(zone?)` | `boolean` | ما إذا كان هذا التاريخ يطابق اليوم أو الغد أو الأمس في المنطقة المحدّدة أو المضبوطة. |
| `isPast(zone?)`، `isFuture(zone?)` | `boolean` | ما إذا كان هذا التاريخ أسبق من اليوم أو لاحقًا له في المنطقة المحدّدة أو المضبوطة. |
| `isWeekday()`، `isWeekend()` | `boolean` | يوم عمل مقابل عطلة نهاية الأسبوع وفق الإعداد المحلي النشط، مثل السبت والأحد في `en-US` أو الجمعة والسبت في `ar-SA`. |
| `isLeapYear()` | `boolean` | ما إذا كانت سنة هذا التاريخ تضم 366 يومًا. |

## قياس المدد والنطاقات

:::entry
### `until()` :kind[method]

```js signature
d.until(other): Duration
d.until(other, unit): number
```

تقيس المدة التقويمية من هذا التاريخ إلى تاريخ آخر، وتُرجع مدة سالبة إذا كان التاريخ المستهدف أسبق. يحتفظ كائن [`Duration`](/api/duration/) المُرجَع بتاريخ البداية هذا حتى يمكن حساب إجمالي الأشهر والسنوات بدقة.

**المعاملات**

```params
- name: other
  type: CalendarDateInput
  required: true
  description: التاريخ المستهدف المراد القياس نحوه.
- name: unit
  type: Unit
  description: اسم الوحدة بالإنجليزية لحساب المدة الإجمالية فيها بصيغة عدد عشري.
```

**القيمة المُرجَعة**

```returns
type: Duration | number
description: كائن `Duration` محسوب بالأيام، أو رقم عند تمرير `unit`.
```

```js
const start = date('2026-01-01');

start.until('2027-04-05').toString(); // 'P459D'
start.until('2027-04-05').balance('year').toString(); // 'P1Y3M4D'
start.until('2027-04-05', 'days'); // 459
start.until('2026-07-01').total('months'); // 6
```
:::

:::entry
### `since()` :kind[method]

```js signature
d.since(other): Duration
d.since(other, unit): number
```

تقيس المدة التقويمية المنقضية منذ تاريخ سابق. مرّر اسم وحدة بالإنجليزية للحصول على المدة الإجمالية رقمًا.

```js
date('2026-11-16').since('2026-11-02', 'weeks'); // 2
```
:::

:::entry
### `to()` :kind[method]

```js signature
d.to(end): DateRange
d.to(count, unit): DateRange
d.through(end): DateRange
d.through(count, unit): DateRange
d.for(length): DateRange
d.for(count, unit): DateRange
```

تُنشئ نطاق [`DateRange`](/api/ranges/#daterange) شاملًا للحدّين يبدأ من هذا التاريخ ويمتد حتى تاريخ النهاية أو بمقدار المدة المحدّدة، بحيث يشمل يوم البداية ويوم النهاية معًا. لها اسم بديل هو `through()`؛ واستدعِ `for()` لتمرير مدة صريحة (مع رفض تواريخ النهاية والأرقام الخالية من الوحدة).

**المعاملات**

```params
- name: end
  type: CalendarDateInput | DurationInput | number
  required: true
  description: التاريخ النهائي المشمول، أو مدة تقويمية، أو عدد `count` مقترن بـ `unit`.
- name: unit
  type: DateUnit
  description: اسم وحدة تقويمية بالإنجليزية عندما يكون المعامل الأول عددًا، مثل `'days'` أو `'weeks'`.
```

**القيمة المُرجَعة**

```returns
type: DateRange
description: نطاق `DateRange` شامل للحدّين يبدأ من هذا التاريخ.
```

```js
date('2026-11-01').to('2026-11-07').duration.days; // 7
date('2026-11-01').for(7, 'days').toString(); // '2026-11-01/2026-11-07'
```
:::

:::entry
### `range()` :kind[method]

```js signature
d.range(unit, firstDay?): DateRange
```

تُرجع نطاق [`DateRange`](/api/ranges/#daterange) شاملًا للحدّين يغطّي جميع أيام الوحدة التقويمية التي تضمّ هذا التاريخ، من يومها الأول حتى يومها الأخير.

**المعاملات**

```params
- name: unit
  type: DateUnit
  required: true
  description: اسم وحدة تقويمية بالإنجليزية من `'year'` حتى `'day'`.
- name: firstDay
  type: DayOfWeek
  description: اليوم الأول في الأسبوع عندما تكون `unit` هي `'week'`.
```

**القيمة المُرجَعة**

```returns
type: DateRange
description: نطاق `DateRange` شامل للحدّين من بداية الوحدة `unit` حتى نهايتها.
```

```js
date('2026-02-10').range('month').toString(); // '2026-02-01/2026-02-28'
date('2026-11-18', { locale: 'en-US' }).range('week').toString(); // '2026-11-15/2026-11-21'
date('2026-11-18').range('week', 'monday').toString(); // '2026-11-16/2026-11-22'
```
:::

:::entry
### `every()` :kind[method]

```js signature
d.every(step, zone?): DateTime[]
d.every(count, unit, zone?): DateTime[]
```

تسير عبر هذا اليوم التقويمي بخطوة موجبة في المنطقة الزمنية المحدّدة أو المضبوطة، وتُرجع مصفوفة من لحظات [`DateTime`](/api/date-time/) تبدأ عند منتصف الليل. وتُنتِج أيام انتقال التوقيت الصيفي 23 أو 25 نقطة ساعية تلقائيًا.

**المعاملات**

```params
- name: step
  type: Unit | DurationInput | number
  required: true
  description: اسم وحدة بالإنجليزية مثل `'hour'`، أو مدة مثل `'30m'`، أو عدد مقترن بـ `unit`.
- name: unit
  type: Unit
  description: اسم الوحدة بالإنجليزية عندما يكون المعامل الأول عددًا.
- name: zone
  type: Zone
  description: المنطقة الزمنية لحدود اليوم، وتُستخدم المنطقة المضبوطة افتراضيًا.
```

**القيمة المُرجَعة**

```returns
type: DateTime[]
description: مصفوفة لحظات زمنية على امتداد هذا اليوم التقويمي في `zone`.
```

```js
const slots = date('2026-11-16').every(6, 'hours', 'UTC');

slots.length; // 4
slots[1].toString(); // '2026-11-16T06:00:00.000Z'
```
:::

:::entry
### `split()` :kind[method]

```js signature
d.split(step, zone?): DateTimeRange[]
d.split(count, unit, zone?): DateTimeRange[]
d.splitBy(step, zone?): DateTimeRange[]
d.splitBy(count, unit, zone?): DateTimeRange[]
```

تقسّم هذا اليوم التقويمي إلى فترات نصف مفتوحة متتالية من نوع [`DateTimeRange`](/api/ranges/#datetimerange) في المنطقة الزمنية المحدّدة أو المضبوطة. لها اسم بديل هو `splitBy()`.

**المعاملات**

```params
- name: step
  type: Unit | DurationInput | number
  required: true
  description: اسم وحدة بالإنجليزية، أو مدة، أو عدد مقترن بـ `unit`.
- name: unit
  type: Unit
  description: اسم الوحدة بالإنجليزية عندما يكون المعامل الأول عددًا.
- name: zone
  type: Zone
  description: المنطقة الزمنية لحدود اليوم، وتُستخدم المنطقة المضبوطة افتراضيًا.
```

**القيمة المُرجَعة**

```returns
type: DateTimeRange[]
description: شرائح `DateTimeRange` متتالية تغطّي هذا اليوم في `zone`.
```

```js
const halves = date('2026-11-16').split(12, 'hours', 'UTC');

halves.map(String);
// ['2026-11-16T00:00:00.000Z/2026-11-16T12:00:00.000Z', '2026-11-16T12:00:00.000Z/2026-11-17T00:00:00.000Z']
```
:::

## التنسيق والتحويل

:::entry
### `format()` :kind[method]

```js signature
d.format(spec?, locale?): string
```

تنسّق التاريخ باستخدام قوالب جاهزة مضمّنة، أو أسماء مخصّصة من [`configure()`](/api/configure/)، أو كائنات خيارات، أو أنماط الرموز.

القوالب الجاهزة الموطّنة من `'L'` حتى `'LLLL'` مضمّنة، وتتجاهل كائنات الخيارات مفاتيح الساعة والمنطقة الزمنية تلقائيًا. راجع [التنسيق](/guides/formatting/) للاطلاع على المرجع الكامل للقوالب الجاهزة وأنماط الرموز.

**المعاملات**

```params
- name: spec
  type: FormatSpec
  default: "'medium'"
  description: اسم قالب جاهز مضمّن أو مضبوط، أو كائن خيارات `Intl`، أو نمط رموز.
- name: locale
  type: string
  description: وسم إعداد محلي BCP 47 يتجاوز الإعداد المحلي لهذا التاريخ أو الإعداد الافتراضي في هذا الاستدعاء وحده.
```

**القيمة المُرجَعة**

```returns
type: string
description: نص التاريخ المنسّق.
```

```js
const day = date('2026-11-16');

day.format('short', 'en-US'); // '11/16/26'
day.format('medium', 'en-US'); // 'Nov 16, 2026'
day.format('long', 'en-US'); // 'November 16, 2026'
day.format('full', 'en-US'); // 'Monday, November 16, 2026'
day.format('L', 'en-US'); // '11/16/2026'
day.format('YYYY-MM-DD'); // '2026-11-16'
day.format('ddd, MMM D', 'en-US'); // 'Mon, Nov 16'
day.format({ weekday: 'long' }, 'en-US'); // 'Monday'
```
:::

:::entry
### `from()` :kind[method]

```js signature
d.from(other?, locale?): string
d.formatRelative(other?, locale?): string
```

تنسّق المسافة التقويمية من تاريخ آخر إلى هذا التاريخ في عبارة وقت نسبي موطّنة عبر `Intl.RelativeTimeFormat`، مثل `'yesterday'` أو `'in 3 weeks'`.

عند حذف المعامل الأول يُقارَن التاريخ بـ [`today()`](/api/date-fn/#today)، وتعمل [`formatRelative()`](#formatrelative) اسمًا بديلًا لها. تستخدم المسافات الأقل من سبعة أيام كلمات طبيعية مثل «أمس» و«اليوم» و«غدًا» (وكذلك «أول أمس» و«بعد الغد» عند التنسيق بالإعداد المحلي العربي `ar` عبر `Intl.RelativeTimeFormat`)، بينما تستخدم الأسابيع والأشهر والسنوات أعدادًا رقمية.

**المعاملات**

```params
- name: other
  type: CalendarDateInput
  description: التاريخ التقويمي المرجعي للقياس منه، ويُستخدم `today()` افتراضيًا في المنطقة الزمنية النشطة.
- name: locale
  type: Locale
  description: وسم إعداد محلي BCP 47 يتجاوز الإعداد المحلي لهذا التاريخ أو الإعداد الافتراضي في هذا الاستدعاء وحده.
```

**القيمة المُرجَعة**

```returns
type: string
description: عبارة وقت نسبي موطّنة.
```

```js
const anchor = date('2026-11-16');

date('2026-11-15').from(anchor, 'en-US'); // 'yesterday'
date('2026-11-16').from(anchor, 'en-US'); // 'today'
date('2026-11-17').from(anchor, 'en-US'); // 'tomorrow'
date('2026-11-30').from(anchor, 'en-US'); // 'in 2 weeks'
date('2026-11-15').from(anchor, 'de'); // 'gestern'
```
:::

:::entry
### `fromNow()` :kind[method]

```js signature
d.fromNow(locale?): string
```

تنسّق مدى بُعد هذا التاريخ عن اليوم في عبارة موطّنة، وهي مكافئة لاستدعاء [`from()`](#from) دون تاريخ مرجعي.

**المعاملات**

```params
- name: locale
  type: Locale
  description: وسم إعداد محلي BCP 47 يتجاوز الإعداد المحلي لهذا التاريخ أو الإعداد الافتراضي في هذا الاستدعاء وحده.
```

**القيمة المُرجَعة**

```returns
type: string
description: عبارة وقت نسبي موطّنة مقيسة من اليوم.
```

```js
today().minus(1, 'day').fromNow('en-US'); // 'yesterday'
today().plus(3, 'days').fromNow('en-US'); // 'in 3 days'
```
:::

:::entry
### `formatRelative()` :kind[method]

```js signature
d.formatRelative(other?, locale?): string
```

اسم بديل لـ [`from()`](#from) ينسّق المسافة التقويمية من `other`، أو من اليوم عند حذفها، في عبارة موطّنة.
:::

:::entry
### `locale()` :kind[method]

```js signature
d.locale(): Locale | undefined
d.locale(tag): CalendarDate
```

تقرأ الإعداد المحلي المحمول على هذا التاريخ، أو تُرجع نسخة تنسّق التواريخ وتبدأ الأسابيع بإعداد محلي آخر عبر القوالب الجاهزة وحدود الأسابيع وكل القيم المشتقة منها. تُطبَّع الوسوم ذات الشرطة السفلية وترويسات `Accept-Language` تلقائيًا، ويمسح الوسم الفارغ الإعداد المحمول، وتعمل [`lang()`](#lang) اسمًا بديلًا لها.

**المعاملات**

```params
- name: tag
  type: Locale | null | undefined
  description: وسم إعداد محلي، أو مصفوفة وسوم، أو ترويسة `Accept-Language` لحمله إلى القيم المشتقة، أو `null` لمسحه.
```

**القيمة المُرجَعة**

```returns
type: CalendarDate | Locale | undefined
description: الوسم النشط عند الاستدعاء بلا معاملات، أو كائن `CalendarDate` جديد يحمل `tag`.
```

```js
const trip = date('2026-05-15').locale('fr-FR');

trip.locale(); // 'fr-FR'
trip.format('long'); // '15 mai 2026'
trip.to('2026-05-19').format('long'); // '15–19 mai 2026'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
d.lang(): Locale | undefined
d.lang(tag): CalendarDate
```

اسم بديل مختصر لـ [`locale()`](#locale) يقرأ وسم الإعداد المحلي BCP 47 على هذا التاريخ أو يرفقه به.
:::

:::entry
### `as()` :kind[method]

```js signature
d.as('date'): CalendarDate
d.as('datetime', zone?): DateTime
d.as('yearMonth'): YearMonth
d.as('monthDay'): MonthDay
```

تحوّل هذا التاريخ إلى نوع آخر داخل سلسلة استدعاءات، بما في ذلك [`YearMonth`](/api/year-month/) و[`MonthDay`](/api/month-day/). ويُرجع التحويل إلى لحظة زمنية منتصف الليل عند بداية هذا التاريخ في المنطقة الزمنية المحدّدة أو المضبوطة.

**المعاملات**

```params
- name: kind
  type: "'date' | 'datetime' | 'yearMonth' | 'monthDay'"
  required: true
  description: النوع المستهدف لتحويل هذا التاريخ التقويمي إليه.
- name: zone
  type: Zone
  description: المنطقة الزمنية المستخدَمة عند التحويل إلى `'datetime'`، وتُستخدم المنطقة المضبوطة افتراضيًا.
```

**القيمة المُرجَعة**

```returns
type: CalendarDate | DateTime | YearMonth | MonthDay
description: القيمة المحوَّلة.
```

```js
const due = date('2026-11-16');

due.as('datetime', 'UTC').toString(); // '2026-11-16T00:00:00.000Z'
due.as('yearMonth').toString(); // '2026-11'
due.as('monthDay').toString(); // '11-16'
```
:::

:::entry
### `toString()` :kind[method]

```js signature
d.toString(): string
d.toJSON(): string
```

تُرجع التاريخ بصيغة نص ISO 8601 على النمط `YYYY-MM-DD`. وتُرجع `toJSON()` النص نفسه عند استدعاء `JSON.stringify()`.

**القيمة المُرجَعة**

```returns
type: string
description: نص تاريخ بصيغة ISO 8601، مثل `'2026-11-16'`.
```

```js
const due = date('2026-11-16');

due.toString(); // '2026-11-16'
JSON.stringify({ due }); // '{"due":"2026-11-16"}'
```
:::

:::entry
### `toJSDate()` :kind[method]

```js signature
d.toJSDate(zone?): Date
```

تُرجع كائن `Date` أصليًا في JavaScript عند منتصف الليل في هذا التاريخ ضمن المنطقة الزمنية المحدّدة أو المضبوطة.
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
d.toTemporal(): Temporal.PlainDate
```

تُرجع كائن `Temporal.PlainDate` الأساسي.
:::

:::entry
### `valueOf()` :kind[method]

```js signature
d.valueOf(): never
```

ترمي `RangeError` حتى لا تحوّل العوامل الرقمية التاريخ التقويمي ضمنيًا إلى رقم.
:::
