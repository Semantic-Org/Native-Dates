---
source: 62b87452c7ee
title: DateTime
lede: لحظة زمنية محدّدة تُعرَض ضمن منطقة زمنية.
---

## إنشاء DateTime

أنشئ كائنًا من قيمة موجودة عبر [`datetime()`](/api/datetime-fn/)، أو اقرأ اللحظة الحالية عبر [`now()`](/api/datetime-fn/#now)، أو اجمع بين تاريخ تقويمي ووقت اليوم باستخدام [`at()`](/api/calendar-date/#at). كائنات `DateTime` غير قابلة للتعديل، لذلك تُرجع كل طريقة تعدّل القيمة كائنًا جديدًا.

```js title="create.js"
import { date, datetime, now } from 'native-dates';

const fromUtc = datetime('2026-11-16T17:30:00Z', 'America/Los_Angeles');
const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
const current = now();
```

مرّر منطقة زمنية لعرض اللحظة الزمنية ضمنها، أو احذفها لاستخدام المنطقة الافتراضية المضبوطة عبر [`configure()`](/api/configure/):

```js
const event = datetime('2026-11-16T17:30:00Z', 'America/New_York');
event.zone; // 'America/New_York'
event.hour; // 12
```

:::note[الإزاحة تحدّد اللحظة لا المنطقة الزمنية]
اللاحقة `Z` أو الإزاحة الرقمية في النص المُدخل تحدّد متى وقعت اللحظة الزمنية، بينما يعتمد الكائن المنطقة الزمنية التي تمرّرها أو المنطقة الافتراضية المضبوطة. مرّر `'UTC'` بوصفها المنطقة الزمنية عندما تريد قراءة حقول UTC وإجراء العمليات الحسابية عليها.
:::

## الخصائص

تقرأ الخصائص التاريخ والوقت ضمن المنطقة الزمنية للكائن.

| الخاصية | النوع | الوصف |
|---|---|---|
| `text` | `string` | التاريخ والوقت والاسم المختصر للمنطقة الزمنية منسّقة حسب الإعداد المحلي، مثل `'Nov 16, 2026, 9:30 AM PST'`. |
| `year`، `month`، `day` | `number` | السنة التقويمية، والشهر (1–12)، ويوم الشهر (1–31). |
| `hour`، `minute`، `second` | `number` | حقول الساعة بنظام 24 ساعة (0–23، 0–59، 0–59). |
| `millisecond`، `microsecond`، `nanosecond` | `number` | حقول أجزاء الثانية (0–999). |
| `zone` | `string` | معرّف منطقة IANA القياسي أو إزاحة ثابتة، مثل `'America/Los_Angeles'` أو `'UTC'`. |
| `offset` | `string` | إزاحة UTC الفعّالة في هذه اللحظة، مثل `'-08:00'`. |
| `epochSeconds` | `number` | عدد الثواني الكاملة منذ عصر Unix، مع التقريب للأسفل (`Math.floor`). |
| `epochMilliseconds` | `number` | عدد المللي ثانية منذ عصر Unix. |
| `epochNanoseconds` | `bigint` | العدد الدقيق للنانوثانية منذ عصر Unix. |
| `date` | [`CalendarDate`](/api/calendar-date/) | التاريخ التقويمي في هذه المنطقة الزمنية. |
| `time` | [`Time`](/api/time/) | وقت اليوم في هذه المنطقة الزمنية. |
| `yearMonth` | [`YearMonth`](/api/year-month/) | السنة والشهر التقويميان في هذه المنطقة الزمنية. |
| `monthDay` | [`MonthDay`](/api/month-day/) | الشهر واليوم التقويميان في هذه المنطقة الزمنية. |
| `dayOfWeek` | `number` | رقم يوم الأسبوع وفق معيار ISO، من 1 ليوم الاثنين حتى 7 ليوم الأحد. |
| `weekStart` | `number` | اليوم الأول في أسابيع هذه اللحظة من 1 إلى 7، وفقًا لـ [`configure()`](/api/configure/) أو إعدادها المحلي. |
| `quarter` | `number` | الربع التقويمي من السنة (1–4). |
| `weekOfYear`، `dayOfYear` | `number` | رقم الأسبوع وفق ISO (1–53) ويوم السنة (1–366). |
| `daysInMonth`، `daysInYear`، `hoursInDay` | `number` | عدد أيام الشهر الحالي والسنة الحالية، وعدد ساعات اليوم التقويمي المحلي. |

## المنطقة الزمنية والحقول

اعرض اللحظة الزمنية نفسها في منطقة زمنية أخرى، أو استبدل حقول التقويم والساعة الفردية.

:::entry
### `in()` :kind[method]

```js signature
dt.in(zone): DateTime
```

تُرجع كائن `DateTime` جديدًا يمثّل اللحظة الزمنية نفسها في منطقة زمنية أخرى. تتحدّث خصائص التقويم والساعة المحلية لتوافق المنطقة المستهدفة، بينما يبقى الطابع الزمني الأساسي دون تغيير.

**المعاملات**

```params
- name: zone
  type: Zone
  required: true
  description: اسم منطقة زمنية من IANA مثل `'Europe/Berlin'`، أو إزاحة UTC ثابتة، أو `'UTC'`.
```

**القيمة المُرجَعة**

```returns
type: DateTime
description: كائن `DateTime` جديد يمثّل اللحظة نفسها ضمن `zone`.
```

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
const berlin = standup.in('Europe/Berlin');

berlin.hour; // 18
berlin.equals(standup); // true
```
:::

:::entry
### `at()` :kind[method]

```js signature
dt.at(time): DateTime
```

تُرجع كائن `DateTime` جديدًا في اليوم نفسه والمنطقة الزمنية نفسها مع استبدال وقت اليوم.

**المعاملات**

```params
- name: time
  type: TimeInput
  required: true
  description: نص وقت مثل `'9:30am'`، أو كائن `Time`، أو كائن حقول، أو كائن `Date`.
```

**القيمة المُرجَعة**

```returns
type: DateTime
description: كائن `DateTime` جديد في التاريخ نفسه عند وقت `time`.
```

```js
const morning = datetime('2026-11-16T09:30', 'America/Los_Angeles');
const wrapUp = morning.at('5:00pm');

wrapUp.hour; // 17
```
:::

:::entry
### `set()` :kind[method]

```js signature
dt.set(fields): DateTime
dt.set(unit, value): DateTime
```

تُرجع كائن `DateTime` جديدًا بعد استبدال حقل أو أكثر من حقول التقويم أو الساعة في المنطقة الزمنية الحالية. ترمي التواريخ الخارجة عن النطاق مثل 30 فبراير خطأ `RangeError` بدل الانتقال إلى الشهر التالي. وعند تحديث `month` أو `year` دون `day`، يُقيَّد اليوم المتجاوز بآخر يوم صالح في الشهر المستهدف.

**المعاملات**

```params
- name: fields
  type: DateTimeFields | Unit
  required: true
  description: كائن يضم حقول تقويم أو ساعة، أو اسم وحدة واحد بالإنجليزية عند تمرير `value`.
- name: value
  type: number
  description: قيمة عددية صحيحة للوحدة المحدّدة `unit`.
```

**القيمة المُرجَعة**

```returns
type: DateTime
description: كائن `DateTime` جديد في المنطقة الزمنية نفسها بالحقول المحدَّثة.
```

```js
const cutoff = datetime('2026-11-16T09:30', 'America/New_York');

cutoff.set('hour', 17);
cutoff.set({ month: 12, day: 1, hour: 0, minute: 0 });
```
:::

## العمليات الحسابية والتقريب

إضافة الأيام أو الأسابيع أو الأشهر أو السنوات تحافظ على وقت اليوم نفسه عبر انتقالات التوقيت الصيفي، بينما تحسب إضافة الساعات أو الدقائق أو الثواني الزمن المنقضي بدقة.

:::entry
### `plus()` :kind[method]

```js signature
dt.plus(amount, unit?): DateTime
dt.add(amount, unit?): DateTime
```

تتقدّم بمقدار مدة زمنية وتُرجع كائن `DateTime` جديدًا في المنطقة الزمنية نفسها. لها اسم بديل هو `add()`.

**المعاملات**

```params
- name: amount
  type: DurationInput
  required: true
  description: عدد مقترن بـ `unit`، أو كائن `Duration`، أو عبارة مدة بالإنجليزية، أو كائن حقول، أو عدد بالمللي ثانية.
- name: unit
  type: Unit
  description: اسم الوحدة بالإنجليزية عندما يكون `amount` رقمًا، مثل `'days'` أو `'hours'`.
```

**القيمة المُرجَعة**

```returns
type: DateTime
description: كائن `DateTime` جديد في المنطقة الزمنية نفسها.
```

```js
// عطلة الانتقال إلى التوقيت الصيفي في نيويورك (8 مارس يضم 23 ساعة)
const sat = datetime('2026-03-07T09:00', 'America/New_York');

sat.plus(1, 'day').hour; // 9
sat.plus(24, 'hours').hour; // 10
sat.plus('1h 30m').format('time', 'en-US'); // '10:30 AM'
```
:::

:::entry
### `minus()` :kind[method]

```js signature
dt.minus(amount, unit?): DateTime
dt.subtract(amount, unit?): DateTime
```

تتراجع بمقدار مدة زمنية في المنطقة الزمنية نفسها. تقبل المدخلات نفسها التي تقبلها [`plus()`](#plus)، ولها اسم بديل هو `subtract()`.

**المعاملات**

```params
- name: amount
  type: DurationInput
  required: true
  description: عدد مقترن بـ `unit`، أو كائن `Duration`، أو عبارة مدة بالإنجليزية، أو مدة ISO، أو كائن حقول.
- name: unit
  type: Unit
  description: اسم الوحدة بالإنجليزية عندما يكون `amount` رقمًا.
```

**القيمة المُرجَعة**

```returns
type: DateTime
description: كائن `DateTime` جديد في المنطقة الزمنية نفسها.
```

```js
const deadline = datetime('2026-11-16T17:00', 'America/New_York');

deadline.minus(48, 'hours');
deadline.minus({ weeks: 1, days: 2 });
```
:::

:::entry
### `startOf()` :kind[method]

```js signature
dt.startOf(unit, firstDay?): DateTime
```

تنتقل إلى بداية وحدة تقويمية أو زمنية في هذه المنطقة الزمنية. تبدأ حدود الأسبوع من `firstDay`، أو من خيار `weekStart` المضبوط عبر [`configure()`](/api/configure/)، أو من الإعداد المحلي النشط لهذه اللحظة.

**المعاملات**

```params
- name: unit
  type: Unit
  required: true
  description: اسم وحدة تقويمية أو زمنية بالإنجليزية من `'year'` حتى `'millisecond'`.
- name: firstDay
  type: DayOfWeek
  description: اليوم الأول في الأسبوع عند استخدام وحدة الأسبوع، باسم يوم من أيام الأسبوع بالإنجليزية مثل `'sunday'` أو رقم ISO مثل `7`.
```

**القيمة المُرجَعة**

```returns
type: DateTime
description: كائن `DateTime` جديد عند بداية الوحدة `unit`.
```

```js
const wed = datetime('2026-11-18T14:45:12', 'America/New_York').locale('en-US');

wed.startOf('day').format('time'); // '12:00 AM'
wed.startOf('week').day; // 15
wed.startOf('week', 'monday').day; // 16
```
:::

:::entry
### `endOf()` :kind[method]

```js signature
dt.endOf(unit, firstDay?): DateTime
```

تنتقل إلى آخر مللي ثانية في وحدة تقويمية أو زمنية ضمن هذه المنطقة الزمنية.

**المعاملات**

```params
- name: unit
  type: Unit
  required: true
  description: اسم وحدة تقويمية أو زمنية بالإنجليزية من `'year'` حتى `'nanosecond'`.
- name: firstDay
  type: DayOfWeek
  description: اليوم الأول في الأسبوع عندما تكون `unit` هي `'week'`.
```

**القيمة المُرجَعة**

```returns
type: DateTime
description: كائن `DateTime` جديد عند آخر مللي ثانية من الوحدة `unit`.
```

```js
const nov = datetime('2026-11-18T14:45', 'UTC');

nov.endOf('month').toString(); // '2026-11-30T23:59:59.999Z'
```
:::

:::entry
### `startOfNext()` :kind[method]

```js signature
dt.startOfNext(unit, firstDay?): DateTime
```

تتقدّم إلى بداية الوحدة التقويمية أو الزمنية التالية للوحدة التي تضمّ هذه اللحظة، ضمن المنطقة الزمنية نفسها. النتيجة دائمًا لحظة لاحقة، لذلك عند منتصف الليل يبدأ اليوم التالي عند منتصف الليل الذي يليه.

مرّر اسم يوم من أيام الأسبوع بالإنجليزية بدل اسم الوحدة للحصول على بداية اليوم التالي الذي يحمل ذلك الاسم، أما [`next()`](#next) فتُرجع اليوم نفسه مع الإبقاء على وقت اليوم كما هو.

**المعاملات**

```params
- name: unit
  type: Unit | Exclude<DayOfWeek, number>
  required: true
  description: اسم وحدة تقويمية أو زمنية بالإنجليزية من `'year'` حتى `'nanosecond'`، أو اسم يوم أسبوع بالإنجليزية مثل `'wednesday'`.
- name: firstDay
  type: DayOfWeek
  description: اليوم الأول في الأسبوع عندما تكون `unit` هي `'week'`.
```

**القيمة المُرجَعة**

```returns
type: DateTime
description: كائن `DateTime` جديد عند بداية الوحدة التالية لـ `unit`، أو بداية يوم الأسبوع المحدّد التالي.
```

```js
const standup = datetime('2026-11-16T09:30', 'America/New_York');

standup.startOfNext('month').text; // 'Dec 1, 2026, 12:00 AM EST'
standup.startOfNext('hour').text; // 'Nov 16, 2026, 10:00 AM EST'
standup.startOfNext('wednesday').text; // 'Nov 18, 2026, 12:00 AM EST'
standup.next('wednesday').text; // 'Nov 18, 2026, 9:30 AM EST'
```
:::

:::entry
### `startOfPrevious()` :kind[method]

```js signature
dt.startOfPrevious(unit, firstDay?): DateTime
```

تتراجع إلى بداية الوحدة التقويمية أو الزمنية السابقة للوحدة التي تضمّ هذه اللحظة، ضمن المنطقة الزمنية نفسها. تمرير اسم يوم من أيام الأسبوع بالإنجليزية بدل الوحدة يُرجع بداية اليوم السابق بذلك الاسم، بينما تُبقي [`previous()`](#previous) على وقت اليوم.

**المعاملات**

```params
- name: unit
  type: Unit | Exclude<DayOfWeek, number>
  required: true
  description: اسم وحدة تقويمية أو زمنية بالإنجليزية من `'year'` حتى `'nanosecond'`، أو اسم يوم أسبوع بالإنجليزية مثل `'wednesday'`.
- name: firstDay
  type: DayOfWeek
  description: اليوم الأول في الأسبوع عندما تكون `unit` هي `'week'`.
```

**القيمة المُرجَعة**

```returns
type: DateTime
description: كائن `DateTime` جديد عند بداية الوحدة السابقة لـ `unit`، أو بداية يوم الأسبوع المحدّد السابق.
```

```js
const standup = datetime('2026-11-16T09:30', 'America/New_York');

standup.startOfPrevious('day').text; // 'Nov 15, 2026, 12:00 AM EST'
standup.startOfPrevious('month').text; // 'Oct 1, 2026, 12:00 AM EDT'
standup.startOfPrevious('wednesday').text; // 'Nov 11, 2026, 12:00 AM EST'
```
:::

:::entry
### `next()` :kind[method]

```js signature
dt.next(target): DateTime
```

تتقدّم إلى يوم الأسبوع المحدّد التالي أو إلى قيمة [`MonthDay`](/api/month-day/) التالية عند وقت اليوم نفسه. إذا كانت اللحظة تقع أصلًا في ذلك اليوم أو التاريخ السنوي، تتقدّم إلى الموعد الذي يليه.

**المعاملات**

```params
- name: target
  type: DayOfWeek | MonthDay
  required: true
  description: اسم يوم من أيام الأسبوع بالإنجليزية مثل `'friday'`، أو رقم ISO من 1 إلى 7، أو كائن `MonthDay` متكرّر سنويًا.
```

**القيمة المُرجَعة**

```returns
type: DateTime
description: كائن `DateTime` جديد في التاريخ المطابق التالي عند الوقت المحلي نفسه.
```

```js
import { datetime, monthDay } from 'native-dates';

const mon = datetime('2026-11-16T09:30', 'America/Los_Angeles');

mon.next('friday').day; // 20
mon.next('monday').day; // 23
mon.next(monthDay('12-25')).month; // 12
```
:::

:::entry
### `previous()` :kind[method]

```js signature
dt.previous(target): DateTime
```

تتراجع إلى أحدث يوم أسبوع محدّد أو قيمة [`MonthDay`](/api/month-day/) قبل هذا التاريخ مع الإبقاء على وقت اليوم نفسه.

**المعاملات**

```params
- name: target
  type: DayOfWeek | MonthDay
  required: true
  description: اسم يوم أسبوع بالإنجليزية، أو اختصاره من ثلاثة أحرف، أو رقم ISO من 1 إلى 7، أو كائن `MonthDay` متكرّر سنويًا.
```

**القيمة المُرجَعة**

```returns
type: DateTime
description: كائن `DateTime` جديد في التاريخ المطابق السابق عند الوقت المحلي نفسه.
```

```js
const mon = datetime('2026-11-16T09:30', 'America/Los_Angeles');

mon.previous('friday').day; // 13
mon.previous(monthDay('10-31')).month; // 10
```
:::

:::entry
### `round()` :kind[method]

```js signature
dt.round(unit): DateTime
dt.round(increment, unit): DateTime
```

تقرّب اللحظة الزمنية إلى أقرب وحدة أو مضاعف خطوة، مع تقريب القيم الواقعة في المنتصف تمامًا للأعلى.

**المعاملات**

```params
- name: increment
  type: number | Unit
  required: true
  description: حجم الخطوة التي تقسم الوحدة الأكبر التالية دون باقٍ، أو اسم الوحدة المستهدفة `unit` عند التقريب إلى `1`.
- name: unit
  type: Unit
  description: اسم الوحدة بالإنجليزية المراد تقريبها، من `'day'` حتى `'nanosecond'`.
```

**القيمة المُرجَعة**

```returns
type: DateTime
description: كائن `DateTime` جديد مقرَّب في المنطقة الزمنية نفسها.
```

```js
const stamp = datetime('2026-11-16T09:23:40', 'UTC');

stamp.round('hour').toString(); // '2026-11-16T09:00:00.000Z'
stamp.round(15, 'minutes').toString(); // '2026-11-16T09:30:00.000Z'
```
:::

:::entry
### `floor()` :kind[method]

```js signature
dt.floor(unit): DateTime
dt.floor(increment, unit): DateTime
```

تقرّب للأسفل إلى بداية وحدة أو مضاعف خطوة. تقبل المعاملات نفسها التي تقبلها [`round()`](#round).

```js
datetime('2026-11-16T09:29:00Z').floor(15, 'minutes').toString(); // '2026-11-16T09:15:00.000Z'
```
:::

:::entry
### `ceil()` :kind[method]

```js signature
dt.ceil(unit): DateTime
dt.ceil(increment, unit): DateTime
```

تقرّب للأعلى إلى الوحدة أو مضاعف الخطوة التالي. تقبل المعاملات نفسها التي تقبلها [`round()`](#round).

```js
datetime('2026-11-16T09:01:00Z').ceil(15, 'minutes').toString(); // '2026-11-16T09:15:00.000Z'
```
:::

## مقارنة اللحظات الزمنية

تفحص المقارنات متى وقعت كل لحظة زمنية، حتى لو اختلفت المنطقة الزمنية بين القيمتين.

:::warning[المقارنة باستخدام ===]
يتحقّق عامل `===` في JavaScript مما إذا كان متغيّران يشيران إلى الكائن نفسه في الذاكرة. استدعِ [`equals()`](#equals) للتحقّق مما إذا كان كائنا `DateTime` يمثّلان اللحظة الزمنية نفسها.
:::

:::entry
### `equals()` :kind[method]

```js signature
dt.equals(other): boolean
```

تُرجع `true` عندما تمثّل القيمتان اللحظة الزمنية نفسها بدقة، بغض النظر عن منطقتيهما الزمنيتين.

**المعاملات**

```params
- name: other
  type: DateTimeInput
  required: true
  description: كائن `DateTime` آخر أو أي قيمة مدخلة تقبلها `datetime()`.
```

**القيمة المُرجَعة**

```returns
type: boolean
description: "قيمة منطقية تكون `true` إذا كانت القيمتان تشيران إلى اللحظة الزمنية نفسها."
```

```js
const ny = datetime('2026-11-16T12:00', 'America/New_York');
const utc = datetime('2026-11-16T17:00Z', 'UTC');

ny.equals(utc); // true
```
:::

:::entry
### `isBefore()` :kind[method]

```js signature
dt.isBefore(other): boolean
```

تُرجع `true` إذا كانت هذه اللحظة الزمنية تسبق اللحظة الأخرى.

```js
datetime('2026-11-16T16:59Z').isBefore('2026-11-16T17:00Z'); // true
```
:::

:::entry
### `isAfter()` :kind[method]

```js signature
dt.isAfter(other): boolean
```

تُرجع `true` إذا كانت هذه اللحظة الزمنية تلي اللحظة الأخرى.

```js
datetime('2026-11-16T17:01Z').isAfter('2026-11-16T17:00Z'); // true
```
:::

:::entry
### `isSame()` :kind[method]

```js signature
dt.isSame(other, unit?, firstDay?): boolean
```

تتحقّق مما إذا كانت لحظة أخرى تقع في الوحدة التقويمية أو الزمنية نفسها عند عرض القيمتين ضمن المنطقة الزمنية لهذا الكائن. واستدعاء `isSame()` دون وحدة يفحص التساوي التام بين اللحظتين.

**المعاملات**

```params
- name: other
  type: DateTimeInput
  required: true
  description: اللحظة الزمنية المراد المقارنة بها، معروضةً ضمن المنطقة الزمنية لهذا الكائن.
- name: unit
  type: Unit
  description: اسم الوحدة التقويمية أو الزمنية بالإنجليزية للمقارنة، مثل `'day'` أو `'month'`.
- name: firstDay
  type: DayOfWeek
  description: اليوم الأول في الأسبوع عندما تكون `unit` هي `'week'`.
```

**القيمة المُرجَعة**

```returns
type: boolean
description: "قيمة منطقية تكون `true` عندما تقع اللحظتان في الوحدة `unit` نفسها ضمن هذه المنطقة الزمنية."
```

```js
const la = datetime('2026-11-16T09:30', 'America/Los_Angeles');
const lateUtc = datetime('2026-11-17T02:00Z', 'UTC');

la.isSame(lateUtc, 'day'); // true (الساعة 6:00 م يوم 16 نوفمبر في لوس أنجلوس)
lateUtc.isSame(la, 'day'); // false (17 نوفمبر مقابل 16 نوفمبر بتوقيت UTC)
```
:::

### دوال التحقّق التقويمية

فحوصات بلا معاملات تُقيَّم ضمن المنطقة الزمنية للكائن:

| الطريقة | النوع | الوصف |
|---|---|---|
| `isPast()`، `isFuture()` | `boolean` | ما إذا كانت هذه اللحظة تسبق الوقت الحالي أو تليه. |
| `isToday()`، `isTomorrow()`، `isYesterday()` | `boolean` | ما إذا كان التاريخ التقويمي المحلي يطابق اليوم أو الغد أو الأمس في هذه المنطقة الزمنية. |
| `isWeekday()`، `isWeekend()` | `boolean` | يوم عمل مقابل عطلة نهاية الأسبوع وفق الإعداد المحلي النشط، مثل السبت والأحد في `en-US` أو الجمعة والسبت في `ar-SA`. |
| `isLeapYear()` | `boolean` | ما إذا كانت السنة المحلية سنة كبيسة. |

## قياس الزمن

:::entry
### `until()` :kind[method]

```js signature
dt.until(other): Duration
dt.until(other, unit): number
```

تقيس الزمن من هذه اللحظة إلى لحظة أخرى، وتُرجع مدة سالبة إذا كانت اللحظة المستهدفة أسبق. مرّر اسم وحدة بالإنجليزية للحصول على المدة الإجمالية رقمًا واحدًا بدل كائن [`Duration`](/api/duration/).

**المعاملات**

```params
- name: other
  type: DateTimeInput
  required: true
  description: اللحظة المستهدفة المراد القياس نحوها.
- name: unit
  type: Unit
  description: اسم الوحدة بالإنجليزية لحساب المدة الإجمالية فيها بصيغة عدد عشري.
```

**القيمة المُرجَعة**

```returns
type: Duration | number
description: كائن `Duration` محسوب بالأيام ووحدات الساعة، أو رقم عند تمرير `unit`.
```

```js
const doors = datetime('2026-11-16T08:00', 'America/Los_Angeles');
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

doors.until(standup).format('long', 'en-US'); // '1 hour, 30 minutes'
doors.until(standup, 'hours'); // 1.5
```
:::

:::entry
### `since()` :kind[method]

```js signature
dt.since(other): Duration
dt.since(other, unit): number
```

تقيس الزمن المنقضي منذ لحظة سابقة. مرّر اسم وحدة بالإنجليزية للحصول على المدة الإجمالية رقمًا.

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.since('2026-11-16T08:00', 'minutes'); // 90
```
:::

:::entry
### `to()` :kind[method]

```js signature
dt.to(end): DateTimeRange
dt.to(count, unit): DateTimeRange
dt.for(length): DateTimeRange
dt.for(count, unit): DateTimeRange
```

تُنشئ نطاق [`DateTimeRange`](/api/ranges/#datetimerange) يمثّل فترة نصف مفتوحة تبدأ من هذه اللحظة الزمنية وتمتد حتى اللحظة النهائية أو حتى اكتمال المدة المحدّدة (مع استبعاد الحدّ الأعلى). ترمي `RangeError` إذا سبقت النهايةُ البدايةَ. استدعِ `for()` لتمرير مدة صريحة (مع رفض اللحظات النهائية والأرقام الخالية من الوحدة).

**المعاملات**

```params
- name: end
  type: DateTimeInput | DurationInput | number
  required: true
  description: اللحظة النهائية المستهدفة، أو مدة زمنية، أو عدد `count` مقترن بـ `unit`.
- name: unit
  type: Unit
  description: اسم الوحدة بالإنجليزية عندما يكون المعامل الأول عددًا، مثل `'hours'` أو `'days'`.
```

**القيمة المُرجَعة**

```returns
type: DateTimeRange
description: نطاق `DateTimeRange` يمثّل فترة نصف مفتوحة في المنطقة الزمنية لهذا الكائن.
```

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.to('2026-11-16T10:00').duration.minutes; // 30
standup.for(2, 'hours').end.hour; // 11
```
:::

:::entry
### `range()` :kind[method]

```js signature
dt.range(unit, firstDay?): DateTimeRange
```

تُرجع نطاق [`DateTimeRange`](/api/ranges/#datetimerange) يمثّل فترة نصف مفتوحة للوحدة التقويمية أو الزمنية التي تضمّ هذه اللحظة، من بدايتها حتى بداية الوحدة التالية (مع استبعاد الحدّ الأعلى).

**المعاملات**

```params
- name: unit
  type: Unit
  required: true
  description: اسم وحدة تقويمية أو زمنية بالإنجليزية من `'year'` حتى `'nanosecond'`.
- name: firstDay
  type: DayOfWeek
  description: اليوم الأول في الأسبوع عندما تكون `unit` هي `'week'`.
```

**القيمة المُرجَعة**

```returns
type: DateTimeRange
description: نطاق `DateTimeRange` يمثّل فترة نصف مفتوحة تغطّي الوحدة `unit` في هذه المنطقة الزمنية.
```

```js
const event = datetime('2026-11-16T14:45', 'UTC');

event.range('day').toString();
// '2026-11-16T00:00:00.000Z/2026-11-17T00:00:00.000Z'
```
:::

## التنسيق والتحويل

:::entry
### `format()` :kind[method]

```js signature
dt.format(spec?, locale?): string
```

تنسّق التاريخ والوقت ضمن منطقتهما الزمنية النشطة باستخدام قوالب جاهزة مضمّنة، أو أسماء مخصّصة من [`configure()`](/api/configure/)، أو كائنات خيارات `Intl`، أو أنماط الرموز.

القوالب الجاهزة الموطّنة من `'LT'` حتى `'llll'` مضمّنة إلى جانب الأقواس المعقوفة `[brackets]` للنصوص الحرفية. راجع [التنسيق](/guides/formatting/) للاطلاع على المرجع الكامل للقوالب الجاهزة وأنماط الرموز.

**المعاملات**

```params
- name: spec
  type: FormatSpec
  default: "'medium'"
  description: اسم قالب جاهز مضمّن أو مضبوط، أو كائن خيارات `Intl`، أو نمط رموز.
- name: locale
  type: string
  description: وسم إعداد محلي BCP 47 يتجاوز الإعداد المحلي لهذه اللحظة أو الإعداد الافتراضي في هذا الاستدعاء وحده.
```

**القيمة المُرجَعة**

```returns
type: string
description: نص منسّق ضمن المنطقة الزمنية للكائن.
```

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.format('medium', 'en-US'); // 'Nov 16, 2026, 9:30 AM'
standup.format('full', 'en-US'); // 'Monday, November 16, 2026 at 9:30 AM'
standup.format('LLL', 'en-US'); // 'November 16, 2026 at 9:30 AM'
standup.format('text', 'en-US'); // 'Nov 16, 2026, 9:30 AM PST'
standup.format('YYYY-MM-DD HH:mm'); // '2026-11-16 09:30'
standup.format('MMM D [at] h:mm a', 'en-US'); // 'Nov 16 at 9:30 am'
standup.format(
  { weekday: 'short', hour: '2-digit', minute: '2-digit' },
  'de-DE',
); // 'Mo., 09:30'
```
:::

:::entry
### `from()` :kind[method]

```js signature
dt.from(other?, locale?): string
dt.formatRelative(other?, locale?): string
```

تنسّق المسافة الزمنية من لحظة أخرى إلى هذه اللحظة في عبارة وقت نسبي موطّنة عبر `Intl.RelativeTimeFormat`، مثل `'3 hours ago'` أو `'in 2 days'`.

عند حذف المعامل الأول تُقارَن اللحظة باللحظة الحالية، وتعمل [`formatRelative()`](#formatrelative) اسمًا بديلًا لها. تُرجع مسافة الصفر بالثواني `'now'`، بينما تستخدم الأيام والأشهر والسنوات أعدادًا رقمية بدل كلمات تقويمية مثل «أمس».

**المعاملات**

```params
- name: other
  type: DateTimeInput
  description: اللحظة المرجعية للقياس منها، وتُفسَّر في المنطقة الزمنية لهذا الكائن إذا لم تحمل منطقة زمنية، وتُستخدم اللحظة الحالية افتراضيًا.
- name: locale
  type: Locale
  description: وسم إعداد محلي BCP 47 يتجاوز الإعداد المحلي لهذه اللحظة أو الإعداد الافتراضي في هذا الاستدعاء وحده.
```

**القيمة المُرجَعة**

```returns
type: string
description: عبارة وقت نسبي موطّنة.
```

```js
const anchor = datetime('2026-11-16T12:00', 'UTC');

anchor.from(anchor, 'en-US'); // 'now'
anchor.minus(3, 'hours').from(anchor, 'en-US'); // '3 hours ago'
anchor.minus(23, 'hours').from(anchor, 'en-US'); // '1 day ago'
anchor.plus(45, 'minutes').from(anchor, 'en-US'); // 'in 1 hour'
anchor.minus(3, 'hours').from(anchor, 'es'); // 'hace 3 horas'
```
:::

:::entry
### `fromNow()` :kind[method]

```js signature
dt.fromNow(locale?): string
```

تنسّق مدى بُعد هذه اللحظة عن اللحظة الراهنة في عبارة موطّنة، وهي مكافئة لاستدعاء [`from()`](#from) دون لحظة مرجعية.

**المعاملات**

```params
- name: locale
  type: Locale
  description: وسم إعداد محلي BCP 47 يتجاوز الإعداد المحلي لهذه اللحظة أو الإعداد الافتراضي في هذا الاستدعاء وحده.
```

**القيمة المُرجَعة**

```returns
type: string
description: عبارة وقت نسبي موطّنة مقيسة من اللحظة الحالية.
```

```js
now().minus(5, 'minutes').fromNow('en-US'); // '5 minutes ago'
now().plus(2, 'hours').fromNow('en-US'); // 'in 2 hours'
```
:::

:::entry
### `formatRelative()` :kind[method]

```js signature
dt.formatRelative(other?, locale?): string
```

اسم بديل لـ [`from()`](#from) ينسّق المسافة الزمنية من `other`، أو من اللحظة الحالية عند حذفها، في عبارة موطّنة.
:::

:::entry
### `locale()` :kind[method]

```js signature
dt.locale(): Locale | undefined
dt.locale(tag): DateTime
```

تقرأ الإعداد المحلي المحمول على هذه اللحظة، أو تُرجع نسخة تنسّق القيم وتبدأ الأسابيع بإعداد محلي آخر عبر القوالب الجاهزة وحدود الأسابيع وكل القيم المشتقة منها. تُطبَّع الوسوم ذات الشرطة السفلية وترويسات `Accept-Language` تلقائيًا، ويمسح الوسم الفارغ الإعداد المحمول، وتعمل [`lang()`](#lang) اسمًا بديلًا لها.

**المعاملات**

```params
- name: tag
  type: Locale | null | undefined
  description: وسم إعداد محلي، أو مصفوفة وسوم، أو ترويسة `Accept-Language` لحمله إلى القيم المشتقة، أو `null` لمسحه.
```

**القيمة المُرجَعة**

```returns
type: DateTime | Locale | undefined
description: الوسم النشط عند الاستدعاء بلا معاملات، أو كائن `DateTime` جديد يحمل `tag`.
```

```js
const standup = datetime('2026-11-16T09:30', 'Europe/Berlin').locale('es-ES');

standup.locale(); // 'es-ES'
standup.plus(1, 'week').date.format('long'); // '23 de noviembre de 2026'
standup.locale(null).locale(); // undefined
```
:::

:::entry
### `lang()` :kind[method]

```js signature
dt.lang(): Locale | undefined
dt.lang(tag): DateTime
```

اسم بديل مختصر لـ [`locale()`](#locale) يقرأ وسم الإعداد المحلي BCP 47 على هذه اللحظة أو يرفقه بها.
:::

:::entry
### `as()` :kind[method]

```js signature
dt.as('datetime'): DateTime
dt.as('date'): CalendarDate
dt.as('time'): Time
dt.as('yearMonth'): YearMonth
dt.as('monthDay'): MonthDay
```

تحوّل هذه اللحظة إلى نوع آخر داخل سلسلة استدعاءات دون التوقف لقراءة خاصية، بما في ذلك قيم [`YearMonth`](/api/year-month/) و[`MonthDay`](/api/month-day/) ضمن منطقتها الزمنية النشطة.

**المعاملات**

```params
- name: kind
  type: "'datetime' | 'date' | 'time' | 'yearMonth' | 'monthDay'"
  required: true
  description: النوع المستهدف لتحويل هذه اللحظة إليه ضمن منطقتها الزمنية النشطة.
```

**القيمة المُرجَعة**

```returns
type: DateTime | CalendarDate | Time | YearMonth | MonthDay
description: القيمة المحوَّلة ضمن المنطقة الزمنية لهذا الكائن.
```

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.in('Asia/Tokyo').as('date').toString(); // '2026-11-17'
standup.in('Asia/Tokyo').as('time').toString(); // '02:30:00'
standup.as('yearMonth').toString(); // '2026-11'
standup.as('monthDay').toString(); // '11-16'
```
:::

:::entry
### `toString()` :kind[method]

```js signature
dt.toString(): string
dt.toJSON(): string
```

تُرجع اللحظة الزمنية بصيغة نص ISO 8601 بتوقيت UTC، مناسب لقواعد البيانات وعناوين URL وحمولات الشبكة. وتُرجع `toJSON()` النص نفسه عند استدعاء `JSON.stringify()`.

**القيمة المُرجَعة**

```returns
type: string
description: طابع زمني بصيغة ISO 8601 بتوقيت UTC، مثل `'2026-11-16T17:30:00.000Z'`.
```

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.toString(); // '2026-11-16T17:30:00.000Z'
JSON.stringify({ standup }); // '{"standup":"2026-11-16T17:30:00.000Z"}'
```
:::

:::entry
### `toJSDate()` :kind[method]

```js signature
dt.toJSDate(): Date
```

تُرجع كائن `Date` أصليًا في JavaScript يمثّل اللحظة الزمنية نفسها.
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
dt.toTemporal(): Temporal.ZonedDateTime
```

تُرجع كائن `Temporal.ZonedDateTime` الأساسي.
:::

:::entry
### `valueOf()` :kind[method]

```js signature
dt.valueOf(): number
```

تُرجع عدد المللي ثانية منذ عصر Unix حتى يتسنى طرح قيمتي `DateTime` أو مقارنتهما بالعوامل الرقمية.
:::
