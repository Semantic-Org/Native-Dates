---
source: 3e14665094ab
title: Time
lede: وقت من اليوم بلا تاريخ تقويمي ولا منطقة زمنية.
---

## إنشاء Time

حلّل نصوص الساعة بنظام 12 ساعة أو 24 ساعة، أو مرّر رقمي الساعة والدقيقة، أو حوّل قيمة موجودة عبر [`time()`](/api/time-fn/). كائنات `Time` غير قابلة للتعديل، لذلك تُرجع كل طريقة تعدّل القيمة كائنًا جديدًا.

```js title="create.js"
import { time } from 'native-dates';

const morning = time('9:30am');
const evening = time('17:30');
const alarm = time(6, 45);
```

استخرج وقت اليوم المحلي من أي كائن [`DateTime`](/api/date-time/) عبر خاصيته `time`:

```js
import { datetime, now } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
standup.time.toString(); // '09:30:00'
const currentClock = now().time;
```

## الخصائص

تقرأ الخصائص حقول الساعة بنظام 24 ساعة من الساعات حتى النانوثانية.

| الخاصية | النوع | الوصف |
|---|---|---|
| `text` | `string` | وقت اليوم منسّقًا حسب الإعداد المحلي، مثل `'9:30 AM'`. |
| `hour`، `minute`، `second` | `number` | حقول الساعة بنظام 24 ساعة (0–23، 0–59، 0–59). |
| `millisecond`، `microsecond`، `nanosecond` | `number` | حقول أجزاء الثانية (0–999). |

## التركيب والحقول

أسنِد وقت اليوم إلى تاريخ تقويمي، أو استبدل حقول الساعة الفردية.

:::entry
### `on()` :kind[method]

```js signature
t.on(date, zone?): DateTime
```

تجمع وقت اليوم هذا مع تاريخ تقويمي في منطقة زمنية وتُرجع كائن [`DateTime`](/api/date-time/). وهي المقابل المباشر لاستدعاء [`at()`](/api/calendar-date/#at) على كائن [`CalendarDate`](/api/calendar-date/).

**المعاملات**

```params
- name: date
  type: CalendarDateInput
  required: true
  description: نص تاريخ ISO، أو كائن `CalendarDate`، أو `DateTime`، أو كائن حقول، أو كائن `Date`.
- name: zone
  type: Zone
  description: اسم منطقة زمنية من IANA، أو إزاحة UTC ثابتة، أو `'UTC'`، وتُستخدم المنطقة المضبوطة افتراضيًا.
```

**القيمة المُرجَعة**

```returns
type: DateTime
description: كائن `DateTime` جديد في تاريخ `date` عند هذا الوقت ضمن `zone`.
```

```js
const opens = time('9:30am');

opens.on('2026-11-16', 'America/New_York').toString(); // '2026-11-16T14:30:00.000Z'
```
:::

:::entry
### `set()` :kind[method]

```js signature
t.set(fields): Time
t.set(unit, value): Time
```

تُرجع كائن `Time` جديدًا بعد استبدال حقل ساعة أو أكثر. ترمي القيم الخارجة عن النطاق مثل الدقيقة 75 خطأ `RangeError`.

**المعاملات**

```params
- name: fields
  type: DateTimeFields | Unit
  required: true
  description: كائن يضم حقول ساعة، أو اسم وحدة واحد بالإنجليزية عند تمرير `value`.
- name: value
  type: number
  description: قيمة عددية صحيحة للوحدة المحدّدة `unit`.
```

**القيمة المُرجَعة**

```returns
type: Time
description: كائن `Time` جديد بحقول الساعة المحدَّثة.
```

```js
const reminder = time('9:30am');

reminder.set('minute', 45).toString(); // '09:45:00'
reminder.set({ hour: 17, minute: 0 }).toString(); // '17:00:00'
```
:::

## العمليات الحسابية والتقريب

أضف وحدات الساعة أو اطرحها، أو اضبط الوقت على حدود الوحدات، أو قرّبه إلى مضاعف خطوة. ترمي الوحدات التقويمية مثل الأيام والأسابيع خطأ `RangeError` لأن وقت اليوم بلا تاريخ.

:::note[الالتفاف حول منتصف الليل]
تلتفّ العمليات الحسابية على الساعة حول دورة 24 ساعة مثل قرص الساعة، فإضافة ساعتين إلى 23:00 تُرجع 01:00. اجمع الوقت مع تاريخ باستخدام [`on()`](#on) أولًا عندما تريد أن يؤدّي عبور منتصف الليل إلى الانتقال إلى اليوم التقويمي التالي.
:::

:::entry
### `plus()` :kind[method]

```js signature
t.plus(amount, unit?): Time
t.add(amount, unit?): Time
```

تتقدّم على ساعة 24 ساعة وتُرجع كائن `Time` جديدًا مع الالتفاف بعد منتصف الليل عند اللزوم. لها اسم بديل هو `add()`.

**المعاملات**

```params
- name: amount
  type: DurationInput
  required: true
  description: عدد مقترن بـ `unit`، أو كائن `Duration`، أو عبارة مدة بالإنجليزية، أو كائن حقول، أو عدد بالمللي ثانية.
- name: unit
  type: Unit
  description: اسم وحدة ساعة بالإنجليزية عندما يكون `amount` رقمًا، مثل `'hours'` أو `'minutes'`.
```

**القيمة المُرجَعة**

```returns
type: Time
description: كائن `Time` جديد ضمن دورة 24 ساعة.
```

```js
time('9:00am').plus(90, 'minutes').toString(); // '10:30:00'
time('23:00').plus('2h').toString(); // '01:00:00'
```
:::

:::entry
### `minus()` :kind[method]

```js signature
t.minus(amount, unit?): Time
t.subtract(amount, unit?): Time
```

تتراجع على ساعة 24 ساعة مع الالتفاف قبل منتصف الليل عند اللزوم. تقبل المدخلات نفسها التي تقبلها [`plus()`](#plus)، ولها اسم بديل هو `subtract()`.

**المعاملات**

```params
- name: amount
  type: DurationInput
  required: true
  description: عدد مقترن بـ `unit`، أو كائن `Duration`، أو عبارة مدة بالإنجليزية، أو كائن حقول، أو عدد بالمللي ثانية.
- name: unit
  type: Unit
  description: اسم وحدة ساعة بالإنجليزية عندما يكون `amount` رقمًا.
```

**القيمة المُرجَعة**

```returns
type: Time
description: كائن `Time` جديد ضمن دورة 24 ساعة.
```

```js
time('00:30').minus(45, 'minutes').toString(); // '23:45:00'
```
:::

:::entry
### `startOf()` :kind[method]

```js signature
t.startOf(unit): Time
```

تُصفّر جميع حقول الساعة الأصغر من الوحدة المحدّدة.

**المعاملات**

```params
- name: unit
  type: Unit
  required: true
  description: اسم وحدة ساعة بالإنجليزية من `'hour'` حتى `'nanosecond'`.
```

**القيمة المُرجَعة**

```returns
type: Time
description: كائن `Time` جديد عند بداية الوحدة `unit`.
```

```js
time('14:37:22').startOf('hour').toString(); // '14:00:00'
```
:::

:::entry
### `endOf()` :kind[method]

```js signature
t.endOf(unit): Time
```

تنتقل إلى آخر مللي ثانية في وحدة الساعة المحدّدة.

**المعاملات**

```params
- name: unit
  type: Unit
  required: true
  description: اسم وحدة ساعة بالإنجليزية من `'hour'` حتى `'nanosecond'`.
```

**القيمة المُرجَعة**

```returns
type: Time
description: كائن `Time` جديد عند آخر مللي ثانية من الوحدة `unit`.
```

```js
time('14:37:22').endOf('hour').toString(); // '14:59:59.999'
```
:::

:::entry
### `startOfNext()` :kind[method]

```js signature
t.startOfNext(unit): Time
```

تتقدّم إلى بداية وحدة الساعة التالية للوحدة التي تضمّ هذا الوقت، مع الالتفاف حول منتصف الليل. تنتقل دائمًا إلى الوحدة التالية، لذلك فإن استدعاء `startOfNext('hour')` على `14:00:00` يُرجع `15:00:00`.

**المعاملات**

```params
- name: unit
  type: Unit
  required: true
  description: اسم وحدة ساعة بالإنجليزية من `'hour'` حتى `'nanosecond'`.
```

**القيمة المُرجَعة**

```returns
type: Time
description: كائن `Time` جديد عند بداية الوحدة التالية لـ `unit`.
```

```js
time('14:37:22').startOfNext('hour').toString(); // '15:00:00'
time('23:37:22').startOfNext('hour').toString(); // '00:00:00'
```
:::

:::entry
### `startOfPrevious()` :kind[method]

```js signature
t.startOfPrevious(unit): Time
```

تتراجع إلى بداية وحدة الساعة السابقة للوحدة التي تضمّ هذا الوقت، مع الالتفاف حول منتصف الليل.

**المعاملات**

```params
- name: unit
  type: Unit
  required: true
  description: اسم وحدة ساعة بالإنجليزية من `'hour'` حتى `'nanosecond'`.
```

**القيمة المُرجَعة**

```returns
type: Time
description: كائن `Time` جديد عند بداية الوحدة السابقة لـ `unit`.
```

```js
time('14:37:22').startOfPrevious('hour').toString(); // '13:00:00'
time('00:15:00').startOfPrevious('hour').toString(); // '23:00:00'
```
:::

:::entry
### `round()` :kind[method]

```js signature
t.round(unit): Time
t.round(increment, unit): Time
```

تقرّب وقت اليوم إلى أقرب وحدة ساعة أو مضاعف خطوة، مع تقريب القيم الواقعة في المنتصف تمامًا للأعلى.

**المعاملات**

```params
- name: increment
  type: number | Unit
  required: true
  description: حجم الخطوة التي تقسم الوحدة الأكبر التالية دون باقٍ، أو اسم الوحدة المستهدفة `unit` عند التقريب إلى `1`.
- name: unit
  type: Unit
  description: اسم وحدة الساعة بالإنجليزية المراد تقريبها، من `'hour'` حتى `'nanosecond'`.
```

**القيمة المُرجَعة**

```returns
type: Time
description: كائن `Time` جديد مقرَّب.
```

```js
const checkin = time('14:36:00');

checkin.round('hour').toString(); // '15:00:00'
checkin.round(15, 'minutes').toString(); // '14:30:00'
```
:::

:::entry
### `floor()` :kind[method]

```js signature
t.floor(unit): Time
t.floor(increment, unit): Time
```

تقرّب للأسفل إلى بداية وحدة ساعة أو مضاعف خطوة. تقبل المعاملات نفسها التي تقبلها [`round()`](#round).

```js
time('14:29').floor(15, 'minutes').toString(); // '14:15:00'
```
:::

:::entry
### `ceil()` :kind[method]

```js signature
t.ceil(unit): Time
t.ceil(increment, unit): Time
```

تقرّب للأعلى إلى وحدة الساعة أو مضاعف الخطوة التالي. تقبل المعاملات نفسها التي تقبلها [`round()`](#round).

```js
time('14:01').ceil(15, 'minutes').toString(); // '14:15:00'
```
:::

## مقارنة الأوقات

ترتّب المقارنات أوقات الساعة ضمن يوم واحد من منتصف الليل حتى نهاية اليوم. ترمي عوامل المقارنة مثل `<` خطأ `RangeError`، لذلك قارن القيم بالطرق المخصّصة أو عبر [`compare()`](/api/compare/).

:::entry
### `equals()` :kind[method]

```js signature
t.equals(other): boolean
```

تُرجع `true` عندما تمثّل القيمتان وقت اليوم نفسه بدقة.

**المعاملات**

```params
- name: other
  type: TimeInput
  required: true
  description: كائن `Time` آخر أو أي قيمة مدخلة تقبلها `time()`.
```

**القيمة المُرجَعة**

```returns
type: boolean
description: "قيمة منطقية تكون `true` إذا تطابقت القيمتان حتى مستوى النانوثانية."
```

```js
time('5:30pm').equals('17:30'); // true
```
:::

:::entry
### `isBefore()` :kind[method]

```js signature
t.isBefore(other): boolean
```

تُرجع `true` إذا كان هذا الوقت أسبق خلال اليوم من الوقت الآخر.

```js
time('9:00am').isBefore('5:00pm'); // true
```
:::

:::entry
### `isAfter()` :kind[method]

```js signature
t.isAfter(other): boolean
```

تُرجع `true` إذا كان هذا الوقت لاحقًا خلال اليوم للوقت الآخر.

```js
time('5:00pm').isAfter('9:00am'); // true
```
:::

:::entry
### `isSame()` :kind[method]

```js signature
t.isSame(other, unit?): boolean
```

تتحقّق مما إذا كان وقت آخر يقع ضمن وحدة الساعة نفسها، مثل الساعة نفسها أو الدقيقة نفسها. واستدعاء `isSame()` دون وحدة يفحص التساوي التام.

**المعاملات**

```params
- name: other
  type: TimeInput
  required: true
  description: وقت اليوم المراد المقارنة به.
- name: unit
  type: Unit
  description: اسم وحدة الساعة بالإنجليزية للمقارنة، مثل `'hour'` أو `'minute'`.
```

**القيمة المُرجَعة**

```returns
type: boolean
description: "قيمة منطقية تكون `true` عندما يشترك الوقتان في الوحدة `unit` نفسها."
```

```js
time('9:05am').isSame('9:45am', 'hour'); // true
time('9:05am').isSame('10:05am', 'hour'); // false
```
:::

## قياس المدد والنطاقات

:::entry
### `until()` :kind[method]

```js signature
t.until(other): Duration
t.until(other, unit): number
```

تقيس المدة (موجبة أو سالبة) من هذا الوقت إلى وقت آخر ضمن اليوم نفسه، وتُرجع مدة سالبة إذا كان الوقت المستهدف أسبق خلال اليوم. مرّر اسم وحدة بالإنجليزية للحصول على المدة الإجمالية رقمًا.

**المعاملات**

```params
- name: other
  type: TimeInput
  required: true
  description: وقت اليوم المستهدف المراد القياس نحوه.
- name: unit
  type: Unit
  description: اسم وحدة الساعة بالإنجليزية لحساب المدة الإجمالية فيها بصيغة عدد عشري.
```

**القيمة المُرجَعة**

```returns
type: Duration | number
description: كائن `Duration` موازَن حتى الساعات، أو رقم عند تمرير `unit`.
```

```js
const opens = time('9:00am');
const closes = time('5:30pm');

opens.until(closes).format('long', 'en-US'); // '8 hours, 30 minutes'
opens.until(closes, 'hours'); // 8.5
time('22:00').until('02:00', 'hours'); // -20
```
:::

:::entry
### `since()` :kind[method]

```js signature
t.since(other): Duration
t.since(other, unit): number
```

تقيس المدة المنقضية منذ وقت أسبق في اليوم نفسه. مرّر اسم وحدة بالإنجليزية للحصول على المدة الإجمالية رقمًا.

```js
time('5:00pm').since('9:00am', 'hours'); // 8
```
:::

:::entry
### `to()` :kind[method]

```js signature
t.to(end): TimeRange
t.to(count, unit): TimeRange
t.for(length): TimeRange
t.for(count, unit): TimeRange
```

تُنشئ نطاق [`TimeRange`](/api/ranges/#timerange) يمثّل فترة نصف مفتوحة تبدأ من هذا الوقت وتمتد حتى الوقت النهائي أو حتى اكتمال المدة المحدّدة (مع استبعاد الحدّ الأعلى). إذا سبق وقت النهاية وقت البداية، يلتفّ النطاق عبر منتصف الليل. استدعِ `for()` لتمرير مدة صريحة (مع رفض أوقات النهاية والأرقام الخالية من الوحدة).

**المعاملات**

```params
- name: end
  type: TimeInput | DurationInput | number
  required: true
  description: وقت النهاية، أو مدة بوحدات الساعة، أو عدد `count` مقترن بـ `unit`.
- name: unit
  type: Unit
  description: اسم وحدة الساعة بالإنجليزية عندما يكون المعامل الأول عددًا، مثل `'hours'` أو `'minutes'`.
```

**القيمة المُرجَعة**

```returns
type: TimeRange
description: نطاق `TimeRange` يمثّل فترة نصف مفتوحة تبدأ من هذا الوقت.
```

```js
time('9:00am').to('5:00pm').duration.hours; // 8
time('9:00am').for(90, 'minutes').end.toString(); // '10:30:00'
time('22:00').to('06:00').duration.hours; // 8
```
:::

## التنسيق والتحويل

:::entry
### `format()` :kind[method]

```js signature
t.format(spec?, locale?): string
```

تنسّق وقت اليوم باستخدام قوالب جاهزة مضمّنة، أو أسماء مخصّصة من [`configure()`](/api/configure/)، أو كائنات خيارات، أو أنماط الرموز.

القالبان الجاهزان الموطّنان `'LT'` و`'LTS'` مضمّنان، وتتجاهل كائنات الخيارات مفاتيح التاريخ والمنطقة الزمنية تلقائيًا. راجع [التنسيق](/guides/formatting/) للاطلاع على المرجع الكامل للقوالب الجاهزة وأنماط الرموز.

**المعاملات**

```params
- name: spec
  type: FormatSpec
  default: "'short'"
  description: اسم قالب جاهز مضمّن أو مضبوط، أو كائن خيارات `Intl`، أو نمط رموز.
- name: locale
  type: string
  description: وسم إعداد محلي BCP 47 يتجاوز الإعداد المحلي لهذا الوقت أو الإعداد الافتراضي في هذا الاستدعاء وحده.
```

**القيمة المُرجَعة**

```returns
type: string
description: نص الوقت المنسّق.
```

```js
const afternoon = time('17:30:15');

afternoon.format('short', 'en-US'); // '5:30 PM'
afternoon.format('LTS', 'en-US'); // '5:30:15 PM'
afternoon.format('HH:mm:ss'); // '17:30:15'
afternoon.format('h:mm a'); // '5:30 pm'
afternoon.format({ hour12: false }, 'en-US'); // '17:30'
```
:::

:::entry
### `locale()` :kind[method]

```js signature
t.locale(): Locale | undefined
t.locale(tag): Time
```

تقرأ الإعداد المحلي المحمول على هذا الوقت، أو تُرجع نسخة تُنسَّق بإعداد محلي آخر عبر المعاينات النصية والقوالب الجاهزة وكل قيمة مشتقة منه. يمسح الوسم الفارغ الإعداد المحلي المحمول، وتعمل [`lang()`](#lang) اسمًا بديلًا لها.

**المعاملات**

```params
- name: tag
  type: Locale | null | undefined
  description: وسم إعداد محلي BCP 47 لحمله إلى القيم المشتقة، أو `null` لمسح وسم موجود.
```

**القيمة المُرجَعة**

```returns
type: Time | Locale | undefined
description: الوسم النشط عند الاستدعاء بلا معاملات، أو كائن `Time` جديد يحمل `tag`.
```

```js
const closing = time('17:30').locale('ko-KR');

closing.locale(); // 'ko-KR'
closing.text; // '오후 5:30'
closing.on('2026-05-01', 'Asia/Seoul').locale(); // 'ko-KR'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
t.lang(): Locale | undefined
t.lang(tag): Time
```

اسم بديل مختصر لـ [`locale()`](#locale) يقرأ وسم الإعداد المحلي BCP 47 على هذا الوقت أو يرفقه به.
:::

:::entry
### `toString()` :kind[method]

```js signature
t.toString(): string
t.toJSON(): string
```

تُرجع نص الوقت بصيغة ISO 8601 بنظام 24 ساعة، مع تضمين أرقام أجزاء الثانية في مجموعات من ثلاثة أرقام عند وجود قيم غير صفرية فقط. وتُرجع `toJSON()` النص نفسه عند استدعاء `JSON.stringify()`.

**القيمة المُرجَعة**

```returns
type: string
description: نص وقت بصيغة ISO 8601، مثل `'17:30:00'` أو `'17:30:15.250'`.
```

```js
time('5:30pm').toString(); // '17:30:00'
time('17:30:15.25').toString(); // '17:30:15.250'
JSON.stringify({ opens: time('9am') }); // '{"opens":"09:00:00"}'
```
:::

:::entry
### `as()` :kind[method]

```js signature
t.as('time'): Time
```

تُرجع كائن `Time` هذا عند طلب `'time'` في سلاسل التحويل العامة، وترمي `RangeError` لأي نوع آخر.
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
t.toTemporal(): Temporal.PlainTime
```

تُرجع كائن `Temporal.PlainTime` الأساسي.
:::

:::entry
### `valueOf()` :kind[method]

```js signature
t.valueOf(): never
```

ترمي `RangeError` حتى لا تحوّل العوامل الرقمية وقت اليوم ضمنيًا إلى رقم.
:::
