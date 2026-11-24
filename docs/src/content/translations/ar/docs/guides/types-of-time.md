---
source: 8bfe5a8d41c8
title: أنواع الوقت
lede: اختر النوع المناسب ليوم تقويمي، أو وقت اليوم، أو لحظة زمنية محدّدة، أو تاريخ جزئي، أو نطاق، أو مدة زمنية.
---

يستخدم كائن `Date` المدمج في JavaScript نوعًا واحدًا لكل شيء، سواء أردت تاريخ ميلاد شخص أو منبّهًا للساعة 9:30 صباحًا أو الثانية الدقيقة التي سُجّل فيها طلب شراء.

يستقلّ كل مفهوم بنوع خاص به حتى لا تتعامل إلا مع الحقول الموجودة فيه فعلًا:

- **[`CalendarDate`](/api/calendar-date/)** ليوم على التقويم، مثل 10 مايو 2026
- **[`Time`](/api/time/)** لوقت اليوم، مثل 9:30 صباحًا
- **[`DateTime`](/api/date-time/)** للحظة زمنية محدّدة في منطقة زمنية
- **[`Duration`](/api/duration/)** لمدة زمنية، مثل ساعتين أو 3 أسابيع
- **[`YearMonth`](/api/year-month/)** و**[`MonthDay`](/api/month-day/)** لشهر بلا يوم، أو يوم متكرّر بلا سنة
- **[النطاقات](/api/ranges/)** لامتداد محصور بين تاريخين أو وقتين أو لحظتين زمنيتين

## CalendarDate

استخدم [`CalendarDate`](/api/calendar-date/) عندما يقع الحدث في يوم تقويمي لا في ثانية بعينها: أعياد الميلاد، وتواريخ الاستحقاق، والعطلات الرسمية، أو القيم الواردة من منتقي التواريخ.

أنشئ تاريخًا تقويميًا باستدعاء [`today()`](/api/date-fn/#today) أو [`date()`](/api/date-fn/):

```js
import { date, today } from 'native-dates';

const birthday = date('2026-05-10');
const due = today().plus(2, 'weeks');

birthday.month; // 5
birthday.day; // 10
```

لأن التاريخ التقويمي بلا ساعة ولا منطقة زمنية، يبقى 10 مايو هو 10 مايو لكل مستخدم أينما كان.

## Time

استخدم [`Time`](/api/time/) لوقت اليوم غير المرتبط بتاريخ محدّد، مثل ساعات عمل المتاجر أو تذكير يومي.

```js
import { time } from 'native-dates';

const opens = time('9:00am');
const closes = opens.plus(8, 'hours');

closes.hour; // 17
closes.format('short', 'en-US'); // '5:00 PM'
```

تعود إضافة الساعات بعد منتصف الليل إلى بداية دورة الـ 24 ساعة بسلاسة؛ إذ لا يرتبط وقت اليوم بتقويم يتقدّم يومه.

## DateTime

استخدم [`DateTime`](/api/date-time/) عندما يقع الحدث في لحظة زمنية فعلية: اجتماع، أو موعد إقلاع رحلة، أو طابع زمني من قاعدة بياناتك.

أنشئ لحظة زمنية عبر [`now()`](/api/datetime-fn/#now) أو [`datetime()`](/api/datetime-fn/)، أو أرفق وقت يوم بتاريخ تقويمي:

```js
import { date, datetime, now } from 'native-dates';

const current = now();
const created = datetime('2026-11-16T17:30:00Z');
const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
```

تحمل كل لحظة زمنية توقيت وقوعها والمنطقة الزمنية التي تعرضها بها. استدعِ [`in()`](/api/date-time/#in) لعرض اللحظة نفسها في مدينة أخرى:

```js
standup.in('Europe/Berlin').format('time', 'en-US'); // '6:30 PM'
```

## Duration

استخدم [`Duration`](/api/duration/) لتمثيل مدة زمنية. أنشئ مدةً عبر دوال الوحدات المساعدة مثل [`hours()`](/api/duration-fn/#hours)، أو مرّر عبارة مدة بالإنجليزية إلى [`duration()`](/api/duration-fn/):

```js
import { days, duration, hours } from 'native-dates';

const call = hours(1.5);
const trial = days(14);
const turnaround = duration('2 weeks, 3 days');
```

ويُرجع قياس الفارق بين قيمتين كائن مدة زمنية أيضًا:

```js
const opens = time('9:00am');
const lunch = time('12:30pm');

opens.until(lunch).format('long', 'en-US'); // '3 hours, 30 minutes'
```

## YearMonth

استخدم [`YearMonth`](/guides/months-and-days/#billing-months-and-card-expiries) عندما تتكوّن القيمة من سنة وشهر بلا يوم، مثل شهر فوترة أو تاريخ انتهاء بطاقة أو حقل إدخال شهري.

```js
import { monthYear, yearMonth } from 'native-dates';

const billing = yearMonth('2026-11');
const expiry = monthYear('11/28');

billing.daysInMonth; // 30
billing.on(15); // كائن CalendarDate لتاريخ 2026-11-15
```

يحسب هذا النوع بالأشهر والسنوات، وتختار [`on()`](/api/year-month/#on) أي يوم داخل ذلك الشهر ككائن تاريخ تقويمي.

## MonthDay

استخدم [`MonthDay`](/guides/months-and-days/#birthdays-and-annual-holidays) لتاريخ متكرّر بلا سنة، مثل عيد ميلاد أو عطلة سنوية.

```js
import { monthDay } from 'native-dates';

const birthday = monthDay('10/17');

birthday.in(2026); // كائن CalendarDate لتاريخ 2026-10-17
birthday.fallsOn('2026-10-17'); // true
```

ينتقل 29 فبراير إلى 28 فبراير تلقائيًا في السنوات غير الكبيسة عند استدعاء [`fallsOn()`](/api/month-day/#fallson) أو [`in()`](/api/month-day/#in).

## النطاقات

استخدم [النطاقات](/guides/ranges/) لتمثيل امتداد محصور بين تاريخين أو وقتين أو لحظتين زمنيتين. أنشئ نطاقًا مباشرةً باستدعاء [`dateRange()`](/api/range-fn/#daterange) أو [`timeRange()`](/api/range-fn/#timerange) أو [`datetimeRange()`](/api/range-fn/#datetimerange):

```js
import { dateRange, timeRange } from 'native-dates';

const sprint = dateRange('2026-11-02', '2026-11-15');
const shift = timeRange('9:00am', '5:00pm');

sprint.contains('2026-11-10'); // true
shift.duration.hours; // 8
```

تشمل نطاقات التواريخ يومها الأخير، بينما تستبعد نطاقات اللحظات الزمنية ونطاقات الأوقات حدّها الأعلى (فترة نصف مفتوحة) كي لا تتداخل المواعيد المتتالية.

## الانتقال بين الأنواع

تترابط هذه الأنواع مباشرةً عند إضافة أجزاء أو إسقاطها. أرفق وقت يوم بتاريخ تقويمي عبر [`at()`](/api/calendar-date/#at) لتحصل على لحظة زمنية، أو كوّن نطاقًا بدءًا من نقطة قائمة عبر [`for()`](/api/ranges/#to) أو [`to()`](/api/ranges/#to):

```js
const reminder = today().plus(1, 'day').at('9:00am');
const upcoming = today().for(2, 'weeks');
```

وفي الاتجاه المعاكس، اقرأ خصائص الأجزاء مباشرةً من أي لحظة زمنية أو تاريخ، أو استدعِ [`as()`](/api/date-time/#as) ضمن سلسلة استدعاءات:

```js
reminder.date; // كائن CalendarDate للغد
reminder.time; // كائن Time للساعة 09:00:00
reminder.yearMonth; // كائن YearMonth
reminder.monthDay; // كائن MonthDay
reminder.in('Asia/Tokyo').as('time'); // كائن Time في طوكيو
```

:::tip[DateTime أم CalendarDate؟]
اسأل نفسك هل سيغيّر تبديل المنطقة الزمنية ما يراه المستخدم. مكالمة الساعة 9:30 صباحًا في لوس أنجلوس تصبح 6:30 مساءً في برلين، لذا مكانها `DateTime`. أمّا عيد ميلاد في 10 مايو فيبقى 10 مايو في كل مكان، لذا مكانه `CalendarDate`.
:::
