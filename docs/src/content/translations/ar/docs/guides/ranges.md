---
source: 8e9d9ff9bd0c
title: النطاقات
lede: تعامل مع الامتدادات المحصورة بين تاريخين أو وقتين أو لحظتين زمنيتين، من فحص التداخل إلى تنسيق الفترات.
---

يمثّل [النطاق](/api/ranges/) امتدادًا له بداية ونهاية، مثل حجز فندقي أو ساعات عمل أو اجتماع مجدول. ولكل نوع من أنواع الوقت صنف نطاق مستقل بحيث تبقى الأيام التقويمية تقويمية ولا تلتقط نطاقات الساعة تاريخًا وهميًا.

## إنشاء النطاقات

أنشئ نطاقًا مباشرةً عبر الدوال المصنعية [`dateRange()`](/api/range-fn/) أو [`timeRange()`](/api/range-fn/#timerange) أو [`datetimeRange()`](/api/range-fn/#datetimerange). تقبل كل دالة مصنعية طرفي البداية والنهاية، أو بداية ومدة زمنية، أو نص فترة واحدًا:

```js
import { dateRange, datetimeRange, timeRange } from 'native-dates';

const sprint = dateRange('2026-05-01', '2 weeks');
const trip = dateRange('2026-09-01', '2026-09-07');
const hours = timeRange('9am - 5pm');
const meeting = datetimeRange('2026-09-01T09:00', '90m', 'America/New_York');
```

وعندما يكون لديك بالفعل تاريخ أو وقت أو لحظة زمنية، استدعِ [`for()`](/api/ranges/#to) أو [`to()`](/api/ranges/#to) أو [`range()`](/api/ranges/#range) عليها مباشرةً في سلسلة استدعاءات:

```js
import { today } from 'native-dates';

const upcoming = today().for(2, 'weeks');
const thisMonth = today().range('month');
```

## تواريخ شاملة وساعات نصف مفتوحة

نطاقات التواريخ التقويمية شاملة ليومها الأخير، لأن من 1 سبتمبر إلى 7 سبتمبر تعني الأيام السبعة كلها. أمّا نطاقات اللحظات الزمنية ونطاقات الأوقات فهي فترات نصف مفتوحة تستبعد حدّها الأعلى (غير شامل) كي لا تتصادم المواعيد المتتالية:

```js
import { dateRange, timeRange } from 'native-dates';

dateRange('2026-09-01', '2026-09-07').duration.days; // 7

const first = timeRange('9:00am', '10:00am');
const second = timeRange('10:00am', '11:00am');
first.overlaps(second); // false
```

وعندما ينتهي نطاق أوقات في ساعة أبكر من بدايته، يلتفّ عبر منتصف الليل لتغطية النوبات الليلية أو الأماكن المفتوحة حتى الفجر:

```js
const nightShift = timeRange('22:00', '06:00');

nightShift.contains('02:30'); // true
nightShift.duration.hours; // 8
```

## الاحتواء والتداخل

تحقق مما إذا كانت نقطة أو نطاق فرعي يقع داخل نطاق عبر [`contains()`](/api/ranges/#contains)، أو اختبر نطاقين مقابل بعضهما عبر [`overlaps()`](/api/ranges/#overlaps) و[`intersection()`](/api/ranges/#intersection):

```js
import { dateRange } from 'native-dates';

const booking = dateRange('2026-11-10', '2026-11-18');
const holiday = dateRange('2026-11-15', '2026-11-22');

booking.contains('2026-11-14'); // true
booking.overlaps(holiday); // true
booking.intersection(holiday).toString(); // '2026-11-15/2026-11-18'
```

تُرجع `intersection()` القيمة `null` عندما لا يتداخل النطاقان.

## التنقل والعدّ وتقسيم النطاقات

استدعِ [`every()`](/api/ranges/#every) للانتقال عبر خطوات النطاق وجمع كل تاريخ أو وقت أو لحظة زمنية على امتداده. وعلى نطاق التواريخ، استدعِ [`count()`](/api/ranges/#count) لعدّ الأيام أو أيام العمل أو أيام عطلة نهاية الأسبوع أو يوم أسبوع محدّد (بأسماء الفئات وأيام الأسبوع بالإنجليزية مثل `'weekdays'` و`'mondays'`):

```js
import { dateRange } from 'native-dates';

const sprint = dateRange('2026-05-01', '2 weeks');

sprint.every('week').map(String); // ['2026-05-01', '2026-05-08']
sprint.count(); // 14
sprint.count('weekdays'); // 10
sprint.count('mondays'); // 2
```

استدعِ [`split()`](/api/ranges/#split) عندما تريد نطاقات فرعية بدل نقاط منفردة، مثل تقسيم نوبة عمل إلى فترات حجز أو تقسيم دورة عمل (sprint) إلى شرائح أسبوعية:

```js
import { timeRange } from 'native-dates';

const morning = timeRange('9:00am', '12:00pm');
const slots = morning.split(30, 'minutes');

slots.length; // 6
slots[0].toString(); // '09:00:00/09:30:00'
```

## التنسيق والتحويل إلى نص

يدمج تنسيق النطاق بقالب جاهز الأشهر والسنوات المشتركة وفق قواعد الإعداد المحلي في بيئة التشغيل. ومرّر نمط رموز عندما تريد تنسيق الطرفين صراحةً:

```js
import { dateRange, timeRange } from 'native-dates';

const week = dateRange('2026-09-01', '2026-09-07');

week.format('medium', 'en-US'); // 'Sep 1 – 7, 2026'
week.format('YYYY-MM-DD'); // '2026-09-01 – 2026-09-07'
timeRange('9:00am', '5:00pm').format('short', 'en-US'); // '9:00 AM – 5:00 PM'
```

يوفّر كل نطاق مدّته عبر `.duration` ويكتب نص فترة ISO 8601 عبر [`toString()`](/api/ranges/#tostring). ويعيد تمرير ذلك النص إلى الدالة المصنعية نفسها بناء النطاق مطابقًا:

```js
const raw = week.toString(); // '2026-09-01/2026-09-07'
dateRange(raw).equals(week); // true
```
