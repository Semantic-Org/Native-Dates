---
source: ec38498f1427
title: العمليات الحسابية على التواريخ
lede: أضف مددًا زمنية، وحاذِ القيم إلى حدود التقويم، وتنقّل عبر أيام الأسبوع أو النطاقات دون تعديل القيم الأصلية.
---

كل تاريخ ووقت ولحظة زمنية في Native Dates غير قابل للتعديل. تُرجع الطرق التي تُزيح القيمة أو تقرّبها كائنًا جديدًا دائمًا وتترك الأصل دون مساس.

## الجمع والطرح

استدعِ [`plus()`](/api/date-time/#plus) أو [`minus()`](/api/date-time/#minus) للتقدّم أو الرجوع في الزمن:

```js
import { date } from 'native-dates';

const created = date('2026-11-16');
const due = created.plus(2, 'weeks');

created.toString(); // '2026-11-16'
due.toString(); // '2026-11-30'
```

تقبل كلتا الطريقتين عددًا ووحدة، أو عبارة مدة بالإنجليزية، أو كائن حقول، أو كائن [`Duration`](/api/duration/). كما يعمل الاسمان القياسيان [`add()`](/api/date-time/#plus) و[`subtract()`](/api/date-time/#minus) كأسماء بديلة:

```js
import { datetime, hours } from 'native-dates';

const kickoff = datetime('2026-11-16T09:00', 'America/New_York');

kickoff.plus(2, 'weeks');
kickoff.plus('1h 30m');
kickoff.plus({ days: 2, hours: 4 });
kickoff.minus(hours(3));
```

:::tip[يجب أن تطابق الوحدات نوع القيمة]
يرفض التاريخ التقويمي وحدات الساعة (كالساعات والدقائق) لأنه بلا وقت يوم. ويرفض وقت الساعة وحدات التقويم مثل الأيام لأنه يلتفّ عند منتصف الليل. ادمجهما أولًا عبر [`at()`](/api/calendar-date/#at) عندما تجمع حساباتك بين النوعين.
:::

## نهايات الأشهر والتوقيت الصيفي

عند إضافة أشهر أو سنوات، يُقيَّد الناتج بآخر يوم صالح في الشهر المستهدف بدل تجاوزه إلى الشهر التالي. فإضافة شهر إلى 31 يناير تصل إلى 28 فبراير، أو 29 فبراير في السنة الكبيسة:

```js
import { date } from 'native-dates';

date('2026-01-31').plus(1, 'month').toString(); // '2026-02-28'
date('2028-01-31').plus(1, 'month').toString(); // '2028-02-29'
```

على كائن [`DateTime`](/api/date-time/)، تحافظ وحدات التقويم على وقت اليوم المحلي عبر تغيّرات التوقيت الصيفي، بينما تحسب وحدات الساعة الساعات والدقائق المنقضية بدقة:

```js
import { datetime } from 'native-dates';

const saturday = datetime('2026-03-07T09:00', 'America/New_York');

saturday.plus(1, 'day').text; // 'Mar 8, 2026, 9:00 AM EDT'
saturday.plus(24, 'hours').text; // 'Mar 8, 2026, 10:00 AM EDT'
```

راجع دليل [المناطق الزمنية](/guides/time-zones/) لتفاصيل أوفى حول انتقالات تقديم الساعة وتأخيرها.

## المحاذاة إلى حدود الوحدات

استدعِ [`startOf()`](/api/date-time/#startof) و[`endOf()`](/api/date-time/#endof) للانتقال إلى بداية أو نهاية سنة أو ربع سنة أو شهر أو أسبوع أو يوم أو وحدة ساعة.

على التاريخ التقويمي، نهاية الشهر هي آخر يوم فيه. أمّا على اللحظة الزمنية، فنهاية الوحدة هي آخر مللي ثانية فيها:

```js
import { date, datetime } from 'native-dates';

const midMonth = date('2026-11-18');
midMonth.startOf('month').toString(); // '2026-11-01'
midMonth.endOf('month').toString(); // '2026-11-30'

const stamp = datetime('2026-11-18T14:20', 'UTC');
stamp.endOf('day').toString(); // '2026-11-18T23:59:59.999Z'
```

تبدأ الأسابيع في أول يوم يحدّده الإعداد المحلي النشط، مثل الأحد في `'en-US'` أو الاثنين في `'de-DE'`. مرّر اسم يوم الأسبوع بالإنجليزية كمعامل ثانٍ لاستدعاء واحد، أو اضبط بداية عامة عبر [`configure()`](/api/configure/):

```js
const wednesday = date('2026-11-18');

wednesday.locale('en-US').startOf('week').toString(); // '2026-11-15'
wednesday.locale('de-DE').startOf('week').toString(); // '2026-11-16'
wednesday.startOf('week', 'monday').toString(); // '2026-11-16'
```

استدعِ [`startOfNext()`](/api/date-time/#startofnext) أو [`startOfPrevious()`](/api/date-time/#startofprevious) للوصول إلى بداية الوحدة التالية أو السابقة للوحدة الحالية. تنتقل كلتاهما دائمًا إلى الوحدة المجاورة، لذا فإن استدعاء `startOfNext('month')` في 1 ديسمبر يُرجع 1 يناير:

```js
const invoiced = date('2026-11-16');

invoiced.startOfNext('month').toString(); // '2026-12-01'
invoiced.startOfNext('quarter').toString(); // '2027-01-01'
invoiced.startOfPrevious('month').toString(); // '2026-10-01'
```

## تقريب أوقات الساعة

استدعِ [`round()`](/api/date-time/#round) على لحظة زمنية أو وقت ساعة للتقريب إلى أقرب وحدة أو خطوة محدّدة، أو استخدم التقريب للأسفل والأعلى في اتجاه واحد:

```js
import { time } from 'native-dates';

const logged = time('9:23am');

logged.round('hour').format('short', 'en-US'); // '9:00 AM'
logged.round(15, 'minutes').format('short', 'en-US'); // '9:30 AM'
logged.floor(15, 'minutes').format('short', 'en-US'); // '9:15 AM'
logged.ceil(15, 'minutes').format('short', 'en-US'); // '9:30 AM'
```

يجب أن تقسم خطوة التقريب مثل 5 أو 10 أو 15 أو 30 دقيقة الوحدة الأكبر منها مباشرةً دون باقٍ.

## التنقل حسب يوم الأسبوع أو التاريخ المتكرّر

استدعِ [`next()`](/api/calendar-date/#next) أو [`previous()`](/api/calendar-date/#previous) على تاريخ أو لحظة زمنية مع اسم يوم الأسبوع بالإنجليزية للانتقال إلى يوم الأسبوع القادم أو السابق. إذا صادف التاريخ ذلك اليوم فعلًا، يتقدّم أو يرجع سبعة أيام كاملة:

```js
import { date } from 'native-dates';

const monday = date('2026-11-16');

monday.next('friday').toString(); // '2026-11-20'
monday.next('monday').toString(); // '2026-11-23'
monday.previous('friday').toString(); // '2026-11-13'
```

مرّر كائن [`MonthDay`](/api/month-day/) للانتقال مباشرةً إلى الموعد القادم أو السابق لعيد ميلاد أو عطلة سنوية:

```js
import { monthDay } from 'native-dates';

const birthday = monthDay('10/17');
monday.next(birthday).toString(); // '2027-10-17'
```

تحافظ `next()` على وقت اليوم في اللحظة الزمنية. مرّر اسم يوم الأسبوع بالإنجليزية إلى `startOfNext()` إذا أردت بداية ذلك اليوم:

```js
import { datetime } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'America/New_York');

standup.next('wednesday').text; // 'Nov 18, 2026, 9:30 AM EST'
standup.startOfNext('wednesday').text; // 'Nov 18, 2026, 12:00 AM EST'
```

## بناء النطاقات والتنقل عبرها

أنشئ [نطاقًا](/guides/ranges/) عبر [`dateRange()`](/api/range-fn/#daterange) أو استدعِ [`for()`](/api/ranges/#to) و[`to()`](/api/ranges/#to) مباشرةً في سلسلة استدعاءات على نقطة قائمة. تنقّل عبر خطواته أو قسّمه إلى نطاقات فرعية أصغر:

```js
import { dateRange } from 'native-dates';

const sprint = dateRange('2026-11-02', '2 weeks');

sprint.end.toString(); // '2026-11-15'
sprint.every('week').map(String); // ['2026-11-02', '2026-11-09']
sprint.split(1, 'week').length; // 2
```
