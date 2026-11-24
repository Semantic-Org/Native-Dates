---
source: 9606dd7fa967
title: النطاقات
lede: نطاقات بين تاريخين أو لحظتين زمنيتين أو وقتين من اليوم، مع فحص الاحتواء والتداخل والتدرّج بالخطوات.
---

## أصناف النطاقات

أنشئ النطاقات مباشرة عبر [دوال النطاقات المصنعية](/api/range-fn/) (`dateRange()`، `datetimeRange()`، `timeRange()`)، أو سلسِل [`to()`](#to) و[`for()`](#to) و[`range()`](#range) انطلاقًا من نقطة قائمة. جميع كائنات النطاقات غير قابلة للتعديل.

:::note[نطاقات التواريخ الشاملة مقابل نطاقات التواريخ والأوقات ونطاقات الأوقات نصف المفتوحة]
تشمل نطاقات التواريخ التقويمية يومها الأخير، لأن الفترة من 1 سبتمبر إلى 7 سبتمبر تعني الأيام السبعة كلها. أما نطاقات التواريخ والأوقات (`DateTimeRange`) ونطاقات الأوقات (`TimeRange`) فتكون نصف مفتوحة لا تشمل حدّها النهائي، كي تتلامس الحصص المتتالية دون تداخل.
:::

:::entry
### `DateRange` :kind[class]

```js signature
new DateRange(start, end, options?)
new DateRange(interval, options?)
```

يمتد بين [تاريخين تقويميين](/api/calendar-date/) ويشمل كلا الحدّين. يرمي تمرير تاريخ نهاية أقدم من تاريخ البداية خطأ `RangeError`.

يمكن تكرار `DateRange` كسولًا يومًا بيوم عبر حلقة `for...of` أو صيغة النشر (`...`)، ليُنتج كل تاريخ تقويمي من البداية حتى النهاية.

```js title="ranges.js"
import { dateRange } from 'native-dates';

const trip = dateRange('2026-09-01', '2026-09-07');
const week = dateRange('2026-09-01', '7 days');

trip.duration.days; // 7
week.toString(); // '2026-09-01/2026-09-07'
for (const day of trip) {
  day.toString(); // '2026-09-01', '2026-09-02', ...
}
[...dateRange('2026-09-01', '2026-09-03')].map(String); // ['2026-09-01', '2026-09-02', '2026-09-03']
```
:::

:::entry
### `DateTimeRange` :kind[class]

```js signature
new DateTimeRange(start, end, options?)
new DateTimeRange(interval, options?)
```

يمتد بين [لحظتين زمنيتين](/api/date-time/)، فيشمل البداية ولا يشمل النهاية. إذا لم يحمل مدخل النهاية منطقة زمنية صريحة، يُقرأ في المنطقة الزمنية للحظة البداية، وترمي الحدود المعكوسة خطأ `RangeError`.

```js
import { datetimeRange } from 'native-dates';

const block = datetimeRange('2026-09-01T09:00', '2026-09-01T10:30', 'America/New_York');
const standup = datetimeRange('2026-09-01T09:00', '30m', 'America/New_York');

standup.duration.minutes; // 30
block.end.hour; // 10
```
:::

:::entry
### `TimeRange` :kind[class]

```js signature
new TimeRange(start, end, options?)
new TimeRange(interval, options?)
```

يمتد بين [وقتين من اليوم](/api/time/)، فيشمل البداية ولا يشمل النهاية. وعندما يكون وقت النهاية أسبق على الساعة من وقت البداية، يلتفّ النطاق عبر منتصف الليل لتمثيل المناوبات والساعات الليلية.

```js
import { timeRange } from 'native-dates';

const dayShift = timeRange('9:00am', '5:00pm');
const nightShift = timeRange('22:00', '06:00');

dayShift.duration.hours; // 8
nightShift.duration.hours; // 8
```
:::

## الخصائص

يوفّر كل نطاق تسميته المنسّقة، ونقطتي طرفيه بنوعهما، ووسم نوعه، ومدته المقاسة.

| الخاصية | النوع | الوصف |
|---|---|---|
| `text` | `string` | نص النطاق منسّقًا وفق الإعداد المحلي، مثل `'Sep 1 – 7, 2026'`. |
| `start`، `end` | `CalendarDate \| DateTime \| Time` | نقطتا البداية والنهاية المطابقتان لصنف النطاق. |
| `kind` | `'date' \| 'datetime' \| 'time'` | وسم يحدّد نوع النقاط التي يحملها النطاق. |
| `duration` | [`Duration`](/api/duration/) | المدة الكاملة المرتبطة بنقطة البداية `start`، مع احتساب اليوم الأخير في نطاقات التواريخ وعبور منتصف الليل في نطاقات الأوقات الليلية. |

## البناء من نقطة

:::entry
### `to()` :kind[method]

```js signature
d.to(end, unit?): DateRange
d.through(end, unit?): DateRange
d.for(length, unit?): DateRange
dt.to(end, unit?): DateTimeRange
dt.for(length, unit?): DateTimeRange
t.to(end, unit?): TimeRange
t.for(length, unit?): TimeRange
```

تبني نطاقًا من هذه النقطة حتى نقطة نهاية أو على امتداد مدة. في [التاريخ التقويمي](/api/calendar-date/)، يؤدي تمرير مدة مقدارها 7 أيام إلى نهاية تقع بعد 6 أيام من يوم البداية لأن كلا الحدّين مشمولان.

استخدم `for()` لبناء نطاق من مدة صريحة (حيث ترفض نقاط النهاية والأرقام بلا وحدة). كما يوفّر التاريخ التقويمي `through()` اسمًا بديلًا للطريقة `to()` لأن نطاقه يشمل اليوم الأخير.

**المعاملات**

```params
- name: end
  type: Point | DurationInput | number
  required: true
  description: نقطة نهاية من النوع نفسه، أو مدخل مدة (يشمل عبارات المدة بالإنجليزية)، أو عدد رقمي مقترن بـ `unit`.
- name: unit
  type: Unit
  description: اسم الوحدة بالإنجليزية عندما يكون المعامل الأول عددًا رقميًا.
```

**القيمة المُرجَعة**

```returns
type: DateRange | DateTimeRange | TimeRange
description: نطاق يطابق نوع النقطة المستدعاة.
```

```js
import { date, datetime, time } from 'native-dates';

date('2026-09-01').for(7, 'days').toString(); // '2026-09-01/2026-09-07'
datetime('2026-09-01T09:00Z', 'UTC').for(90, 'minutes').toString(); // '2026-09-01T09:00:00.000Z/2026-09-01T10:30:00.000Z'
time('9:00am').to('5:00pm').toString(); // '09:00:00/17:00:00'
```
:::

:::entry
### `range()` :kind[method]

```js signature
d.range(unit, firstDay?): DateRange
dt.range(unit, firstDay?): DateTimeRange
```

تُرجع الوحدة التقويمية أو وحدة الساعة الكاملة التي تحيط بتاريخ أو لحظة زمنية. تمتد نطاقات التواريخ من أول يوم في الوحدة حتى آخر يوم فيها، بينما تمتد نطاقات اللحظات الزمنية من بداية الوحدة حتى بداية الوحدة التالية.

**المعاملات**

```params
- name: unit
  type: Unit
  required: true
  description: اسم الوحدة المحيطة بالإنجليزية، مثل `'week'` أو `'month'` أو `'day'`.
- name: firstDay
  type: DayOfWeek
  description: اسم أول يوم في الأسبوع بالإنجليزية عندما تكون `unit` تساوي `'week'`، متجاوزًا `configure()` والإعداد المحلي النشط.
```

**القيمة المُرجَعة**

```returns
type: DateRange | DateTimeRange
description: النطاق المحيط للوحدة `unit`.
```

```js
import { date, datetime } from 'native-dates';

date('2026-11-18', { locale: 'en-US' }).range('week').toString(); // '2026-11-15/2026-11-21'
date('2026-11-18').range('week', 'monday').toString(); // '2026-11-16/2026-11-22'
date('2026-02-10').range('month').toString(); // '2026-02-01/2026-02-28'
datetime('2026-11-16T14:20Z', 'UTC').range('hour').toString(); // '2026-11-16T14:00:00.000Z/2026-11-16T15:00:00.000Z'
```
:::

## الاحتواء والتداخل

:::entry
### `contains()` :kind[method]

```js signature
range.contains(value): boolean
range.includes(value): boolean
```

تتحقّق مما إذا وقعت نقطة أو نطاق آخر من النوع نفسه داخل هذا النطاق. تشمل نطاقات التواريخ نقطة النهاية `end`، بينما تستبعدها نطاقات اللحظات الزمنية ونطاقات الأوقات، وتطابق نطاقات الأوقات التي تعبر منتصف الليل الأوقات على جانبي منتصف الليل. يتوفر لها الاسم البديل `includes()`.

**المعاملات**

```params
- name: value
  type: Point | Range
  required: true
  description: نقطة أو نطاق من النوع نفسه.
```

**القيمة المُرجَعة**

```returns
type: boolean
description: "`true` عندما تقع `value` داخل هذا النطاق."
```

```js
const stay = dateRange('2026-09-01', '2026-09-07');
stay.contains('2026-09-07'); // true

const night = timeRange('22:00', '06:00');
night.contains('23:30'); // true
night.contains('02:15'); // true
night.contains('06:00'); // false
```
:::

:::entry
### `overlaps()` :kind[method]

```js signature
range.overlaps(other): boolean
```

تُرجع `true` عندما يشترك نطاقان من النوع نفسه في يوم واحد أو لحظة واحدة على الأقل. لا تتداخل الحصص المتتالية من اللحظات الزمنية أو الأوقات عندما تنتهي الأولى عند بداية الثانية.

**المعاملات**

```params
- name: other
  type: Range | string
  required: true
  description: كائن نطاق أو سلسلة فترة من النوع نفسه.
```

**القيمة المُرجَعة**

```returns
type: boolean
description: "`true` عندما يشترك النطاقان في وقت أو يوم واحد على الأقل."
```

```js
const firstSlot = timeRange('09:00', '10:00');
const nextSlot = timeRange('10:00', '11:00');

firstSlot.overlaps(nextSlot); // false
dateRange('2026-09-01', '2026-09-05').overlaps('2026-09-05/2026-09-10'); // true
```
:::

:::entry
### `intersection()` :kind[method]

```js signature
range.intersection(other): Range | null
```

تُرجع نطاقًا جديدًا يغطّي الجزء المشترك بين النطاقين فقط، أو `null` إذا كانا منفصلين. يرمي تقاطع نطاقي أوقات (يعبر أحدهما على الأقل منتصف الليل) يلتقيان في جزأين منفصلين خطأ `RangeError`.

**المعاملات**

```params
- name: other
  type: Range | string
  required: true
  description: كائن نطاق أو سلسلة فترة من النوع نفسه.
```

**القيمة المُرجَعة**

```returns
type: DateRange | DateTimeRange | TimeRange | null
description: نطاق التقاطع من النوع نفسه، أو `null` عند عدم وجود تداخل.
```

```js
const a = dateRange('2026-09-01', '2026-09-10');
const b = dateRange('2026-09-05', '2026-09-15');

a.intersection(b)?.toString(); // '2026-09-05/2026-09-10'
a.intersection('2026-09-20/2026-09-25'); // null
```
:::

:::entry
### `equals()` :kind[method]

```js signature
range.equals(other): boolean
```

تُرجع `true` عندما تتساوى نقطتا البداية والنهاية في النطاقين. كما تُفرز مصفوفات النطاقات زمنيًا باستخدام [`compare()`](/api/compare/).

```js
dateRange('2026-09-01', '2026-09-07').equals('2026-09-01/2026-09-07'); // true
```
:::

:::entry
### `isEmpty()` :kind[method]

```js signature
range.isEmpty(): boolean
```

تُرجع `true` عندما تتطابق نقطتا البداية والنهاية في نطاق تواريخ وأوقات أو نطاق أوقات. وتُرجع `false` دائمًا في [`DateRange`](#daterange) لأن التاريخ التقويمي الواحد يمتد يومًا كاملًا.

```js
timeRange('09:00', '09:00').isEmpty(); // true
dateRange('2026-09-01', '2026-09-01').isEmpty(); // false
```
:::

## التدرّج والتقسيم والمناطق الزمنية

:::entry
### `every()` :kind[method]

```js signature
range.every(step): Point[]
range.every(count, unit): Point[]
```

تسير للأمام انطلاقًا من `start` بوحدة أو مدة موجبة وتُرجع كل نقطة داخل النطاق. تُحسب الخطوات من نقطة البداية لا بسلسلة إضافات متراكمة، ولذلك يقع التدرّج الشهري بدءًا من 31 يناير على آخر يوم في كل شهر.

وللمرور على [`DateRange`](#daterange) كسولًا يومًا بيوم دون حجز مصفوفة في الذاكرة، كرّره مباشرة عبر `for...of` أو صيغة النشر (`...`).

**المعاملات**

```params
- name: step
  type: Unit | DurationInput | number
  required: true
  description: اسم وحدة بالإنجليزية مثل `'day'`، أو مدخل مدة (يشمل عبارات المدة بالإنجليزية)، أو عدد رقمي مقترن بـ `unit`.
- name: unit
  type: Unit
  description: اسم الوحدة بالإنجليزية عندما يكون `step` رقمًا.
```

**القيمة المُرجَعة**

```returns
type: Array<CalendarDate | DateTime | Time>
description: مصفوفة مرتّبة من النقاط الواقعة داخل النطاق.
```

```js
dateRange('2026-01-31', '2026-04-30').every('month').map(String);
// ['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30']

timeRange('22:00', '02:00').every(1, 'hour').map(String);
// ['22:00:00', '23:00:00', '00:00:00', '01:00:00']
```
:::

:::entry
### `count()` :kind[method]

```js signature
dateRange.count(kind?): number
```

تعدّ الأيام التقويمية داخل [`DateRange`](#daterange) دون إنشاء كائنات تاريخ وسيطة. مرّر بالإنجليزية `'days'` (الافتراضي)، أو `'weekdays'` (أيام العمل)، أو `'weekends'` (أيام عطلة نهاية الأسبوع)، أو اسم يوم من أيام الأسبوع بالإنجليزية بصيغة الجمع أو المفرد أو الاختصار مثل `'mondays'` أو `'monday'` أو `'mon'`. تتبع `'weekdays'` و`'weekends'` أيام عطلة نهاية الأسبوع في الإعداد المحلي النشط.

**المعاملات**

```params
- name: kind
  type: string
  default: "'days'"
  description: قيمة بالإنجليزية مثل `'days'` أو `'weekdays'` أو `'weekends'`، أو اسم يوم من أيام الأسبوع مثل `'mondays'` أو `'monday'` أو `'mon'`.
```

**القيمة المُرجَعة**

```returns
type: number
description: عدد الأيام التقويمية المطابقة داخل النطاق.
```

```js
const sprint = dateRange('2026-05-01', '2 weeks');

sprint.count(); // 14
sprint.count('weekdays'); // 10
sprint.count('weekends'); // 4
sprint.count('mondays'); // 2
```
:::

:::entry
### `split()` :kind[method]

```js signature
range.split(step): Range[]
range.split(count, unit): Range[]
range.splitBy(step): Range[]
range.splitBy(count, unit): Range[]
```

تقسّم النطاق إلى نطاقات فرعية متجاورة بمقدار الخطوة المحدّدة، مع تقييد الجزء الأخير بنهاية النطاق. تقبل معاملات الخطوة نفسها التي تقبلها [`every()`](#every)، ويتوفر لها الاسم البديل `splitBy()`.

```js
dateRange('2026-09-01', '2026-09-10').split(4, 'days').map(String);
// ['2026-09-01/2026-09-04', '2026-09-05/2026-09-08', '2026-09-09/2026-09-10']
```
:::

:::entry
### `in()` :kind[method]

```js signature
dateRange.in(zone?): DateTimeRange
dtRange.in(zone): DateTimeRange
```

تحوّل [`DateRange`](#daterange) الشامل للحدّين إلى [`DateTimeRange`](#datetimerange) نصف مفتوح يبدأ من منتصف ليل يوم البداية (`start`) حتى منتصف ليل اليوم التالي ليوم النهاية (`end`) بحدّ علوي غير شامل، بما يطابق حدود الاستعلام المعتمدة على الطوابع الزمنية. أما على نطاق التواريخ والأوقات، فتنقل كلتا نقطتي الطرف إلى المنطقة الزمنية الهدف.

يرمي استدعاء `in()` على نطاق أوقات خطأ `RangeError` لأن أوقات اليوم بلا تاريخ تقويمي.

**المعاملات**

```params
- name: zone
  type: Zone
  description: منطقة IANA الهدف، أو إزاحة ثابتة، أو `'UTC'`، مع الرجوع افتراضيًا إلى المنطقة الزمنية المضبوطة عند الاستدعاء على `DateRange`.
```

**القيمة المُرجَعة**

```returns
type: DateTimeRange
description: نطاق تواريخ وأوقات نصف مفتوح في المنطقة الزمنية `zone`.
```

```js
dateRange('2026-09-01', '2026-09-03').in('UTC').toString();
// '2026-09-01T00:00:00.000Z/2026-09-04T00:00:00.000Z'
```
:::

## التنسيق والتحويل

:::entry
### `format()` :kind[method]

```js signature
range.format(spec?, locale?): string
```

تنسّق النطاق باستخدام تنسيق النطاقات الموطَّن في `Intl` للقوالب الجاهزة وكائنات الخيارات، فتدمج التواريخ أو الأشهر المشتركة تلقائيًا. أما أنماط الرموز فتنسّق كل طرف على حدة وتربطهما بـ `' – '`.

تعمل التنسيقات المخصّصة المسجّلة في [`configure()`](/api/configure/) هنا أيضًا. راجع [التنسيق](/guides/formatting/) لتفاصيل القوالب الجاهزة والرموز.

**المعاملات**

```params
- name: spec
  type: FormatSpec
  description: اسم قالب جاهز، أو كائن `Intl.DateTimeFormatOptions`، أو نمط رموز.
- name: locale
  type: Locale
  description: وسم إعداد محلي BCP 47 يتجاوز الإعداد المحلي لهذا النطاق أو الإعداد العام لهذا الاستدعاء فقط.
```

**القيمة المُرجَعة**

```returns
type: string
description: سلسلة نصية منسّقة للنطاق.
```

```js
const trip = dateRange('2026-09-01', '2026-09-07');

trip.format('medium', 'en-US'); // 'Sep 1 – 7, 2026'
trip.format('YYYY-MM-DD'); // '2026-09-01 – 2026-09-07'
timeRange('22:00', '06:00').format('HH:mm'); // '22:00 – 06:00'
```
:::

:::entry
### `locale()` :kind[method]

```js signature
range.locale(): Locale | undefined
range.locale(tag): Range
```

تقرأ الإعداد المحلي المحفوظ مع هذا النطاق، أو تُرجع نسخة منسّقة بإعداد محلي آخر عبر المعاينات النصية والقوالب الجاهزة ونقطتي الطرف والنطاقات الفرعية. يؤدي تمرير وسم فارغ إلى مسح الإعداد المحلي المحفوظ، وتعمل [`lang()`](#lang) اسمًا بديلًا.

**المعاملات**

```params
- name: tag
  type: Locale | null | undefined
  description: وسم إعداد محلي BCP 47 يُحفظ مع النسخة الجديدة، أو `null` لمسح الوسم الحالي.
```

**القيمة المُرجَعة**

```returns
type: Range | Locale | undefined
description: الوسم النشط عند الاستدعاء بلا معاملات، أو نطاق جديد من النوع نفسه يحمل `tag`.
```

```js
const stay = dateRange('2026-09-01', '2026-09-07').locale('de-DE');

stay.locale(); // 'de-DE'
stay.format('medium'); // '01.–07.09.2026'
stay.duration.text; // '7 Tage'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
range.lang(): Locale | undefined
range.lang(tag): Range
```

اسم بديل مختصر للطريقة [`locale()`](#locale) يقرأ وسم الإعداد المحلي BCP 47 على هذا النطاق أو يربطه بوسم جديد.
:::

:::entry
### `as()` :kind[method]

```js signature
range.as('duration'): Duration
```

تُرجع مدة النطاق عند طلب `'duration'` في سلاسل الاستدعاءات، وترمي خطأ `RangeError` للأنواع الأخرى.

```js
dateRange('2026-09-01', '2026-09-07').as('duration').days; // 7
```
:::

:::entry
### `toString()` :kind[method]

```js signature
range.toString(): string
range.toJSON(): string
```

تُرجع سلسلة الفترة بصيغة ISO 8601 على الشكل `'start/end'`، والتي تقبلها [دوال النطاقات المصنعية](/api/range-fn/) مباشرة عند إعادة التحليل. وتُرجع `toJSON()` السلسلة نفسها لتسلسل JSON.

```js
dateRange('2026-09-01', '2026-09-07').toString(); // '2026-09-01/2026-09-07'
timeRange('9am', '5pm').toJSON(); // '09:00:00/17:00:00'
```
:::

:::entry
### `valueOf()` :kind[method]

```js signature
range.valueOf(): never
```

ترمي خطأ `RangeError` حتى لا تحوّل العوامل الرقمية النطاق إلى رقم.

ضيّق نوع القيم غير المعروفة أثناء التشغيل باستخدام [`kindOf()`](/api/kind-of/) أو [دوال فحص نوع النطاقات](/api/kind-of/#type-guards) المُصدَّرة:

```js
import { dateRange, isDateRange, isDateTimeRange, isTimeRange } from 'native-dates';

const stay = dateRange('2026-09-01', '2026-09-07');
isDateRange(stay); // true
isDateTimeRange(stay); // false
isTimeRange(stay); // false
```
:::
