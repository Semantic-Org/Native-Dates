---
source: 6291509fd7f2
title: الأشهر والأيام
lede: خزّن شهرًا بلا يوم، أو تاريخ ميلاد متكرّرًا بلا سنة.
---

في JavaScript القياسية، يضطرك تخزين تاريخ انتهاء بطاقة إلى إضافة يوم «1» وهمي في نهايته، ويضطرك تخزين عيد ميلاد بلا سنة ميلاد إلى اختيار سنة كبيسة وهمية مثل 2000. يحتفظ نوعا [`YearMonth`](/api/year-month/) و[`MonthDay`](/api/month-day/) بالأجزاء الموجودة فعلًا دون غيرها.

## أشهر الفوترة وتواريخ انتهاء البطاقات

استخدم [`yearMonth()`](/api/year-month-fn/) لنصوص ISO أو رقمي السنة والشهر، واستخدم [`monthYear()`](/api/year-month-fn/#monthyear) لتواريخ انتهاء البطاقات مثل <bdi>11/28</bdi>:

```js
import { monthYear, yearMonth } from 'native-dates';

const billing = yearMonth('2026-11');
const expiry = monthYear('11/28');

billing.daysInMonth; // 30
billing.quarter; // 4
expiry.isPast('UTC'); // false
```

تحقق من وقوع تاريخ داخل شهر عبر [`contains()`](/api/year-month/#contains)، وتقدّم بالأشهر أو الأرباع عبر [`plus()`](/api/year-month/#plus)، واختر يومًا بعينه عبر [`on()`](/api/year-month/#on):

```js
billing.contains('2026-11-16'); // true
billing.plus(3, 'months').toString(); // '2027-02'
yearMonth('2026-02').on(31).toString(); // '2026-02-28'
yearMonth('2028-02').on(31).toString(); // '2028-02-29'
```

يُقيَّد اليوم 31 تلقائيًا بآخر يوم في الأشهر الأقصر، بما في ذلك 29 فبراير في السنوات الكبيسة.

## أعياد الميلاد والعطلات السنوية

استخدم [`monthDay()`](/api/month-day-fn/) للنصوص المكتوبة بترتيب الشهر أولًا، و[`dayMonth()`](/api/month-day-fn/#daymonth) للنصوص المكتوبة بترتيب اليوم أولًا. يحدّد اسم الدالة الترتيب، فيحمل <bdi>05/10</bdi> المعنى نفسه في كل مكان:

```js
import { dayMonth, monthDay } from 'native-dates';

const birthday = monthDay('10/17');
const european = dayMonth('17/10');

birthday.equals(european); // true
birthday.in(2027).toString(); // '2027-10-17'
```

اعثر على الموعد القادم أو الأقرب في الماضي انطلاقًا من اليوم أو من أي تاريخ مرجعي عبر [`next()`](/api/month-day/#next) و[`previous()`](/api/month-day/#previous):

```js
birthday.next('2026-05-01').toString(); // '2026-10-17'
birthday.next('2026-10-17').toString(); // '2027-10-17'
birthday.previous('2026-10-17').toString(); // '2025-10-17'
```

ينتقل 29 فبراير إلى 28 فبراير في السنوات غير الكبيسة. استدعِ [`fallsOn()`](/api/month-day/#fallson) للتحقق مما إذا كان تاريخ معيّن يطابقه:

```js
const leapDay = monthDay(2, 29);

leapDay.in(2027).toString(); // '2027-02-28'
leapDay.fallsOn('2027-02-28'); // true
leapDay.fallsOn('2028-02-28'); // false
leapDay.fallsOn('2028-02-29'); // true
```

## الانتقال بين الأشهر والأيام والتواريخ الكاملة

اقرأ الخاصيتين `.yearMonth` أو `.monthDay` من أي تاريخ أو لحظة زمنية، أو استدعِ [`as()`](/api/date-time/#as) وسط سلسلة استدعاءات:

```js
import { date, datetime } from 'native-dates';

const invoice = date('2026-11-16');
invoice.yearMonth.toString(); // '2026-11'
invoice.monthDay.toString(); // '11-16'

datetime('2026-11-01T02:00:00Z', 'America/Los_Angeles').as('yearMonth').toString();
// '2026-10'
```

وفي الاتجاه المعاكس، استدعِ `on()` مع رقم يوم على كائن سنة وشهر، أو [`in()`](/api/month-day/#in) مع رقم سنة على كائن شهر ويوم، لتحصل على تاريخ تقويمي كامل.

## التنسيق والتخزين

يدعم كلا النوعين التنسيق عبر `.text` و[`format()`](/api/year-month/#format)، ويتحوّلان إلى نص ISO عبر [`toString()`](/api/year-month/#tostring):

```js
import { monthDay, yearMonth } from 'native-dates';

yearMonth('2026-11').format('long', 'en-US'); // 'November 2026'
yearMonth('2026-05').format('long', 'ru'); // 'май 2026 г.'
monthDay('10-17').format('long', 'en-US'); // 'October 17'

yearMonth('2026-11').toString(); // '2026-11'
monthDay('10/17').toString(); // '10-17'
```

تُخزَّن نصوص مثل <bdi>2026-11</bdi> و<bdi>10-17</bdi> بوضوح في قواعد البيانات وروابط URL، وتُحلَّل مباشرةً مجدّدًا عبر `yearMonth()` و`monthDay()`.
