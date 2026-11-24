---
source: 326d94af83a9
title: التحليل
lede: اقرأ نصوص ISO والمدد الزمنية والنطاقات ومدخلات المستخدمين المرنة دون تخمين صامت.
---

تحلّل النواة المدخلات القياسية غير الغامضة مباشرةً إلى النوع الذي تطلبه:

- [`datetime()`](/api/datetime-fn/) للحظات الزمنية وطوابع عصر Unix بالمللي ثانية والطوابع الزمنية
- [`date()`](/api/date-fn/) للأيام التقويمية بلا ساعة ولا منطقة زمنية
- [`time()`](/api/time-fn/) لأوقات اليوم بنظامي 24 ساعة و12 ساعة
- [`duration()`](/api/duration-fn/) لعبارات المدة بالإنجليزية ومدد ISO 8601
- [`yearMonth()`](/api/year-month-fn/) و[`monthDay()`](/api/month-day-fn/) لأشهر الفوترة وتواريخ انتهاء البطاقات وأعياد الميلاد المتكرّرة
- [`dateRange()`](/api/range-fn/#daterange) و[`datetimeRange()`](/api/range-fn/#datetimerange) و[`timeRange()`](/api/range-fn/#timerange) للفترات وأزواج البداية والنهاية

## تواريخ ISO والطوابع الزمنية

مرّر إلى `date()` نص تاريخ بترتيب السنة أولًا، أو ثلاثة أرقام للسنة والشهر واليوم، أو كائن حقول. تقبل النصوص المكتوبة بترتيب السنة أولًا أرقام الأشهر والأيام ذات الرقم الواحد أو الرقمين مع أي فاصل غير الحروف اللاتينية أو النقطتين؛ فتُقرأ التواريخ الصينية واليابانية والكورية والتواريخ المفصولة بنقاط ومسافات مباشرةً في النواة.

تبدأ الأشهر من 1 إلى 12. وترمي التواريخ التقويمية المستحيلة مثل 30 فبراير ونصوص الأسابيع أو الأرباع في ISO مثل `'2026-W05-1'` خطأً بدل التخمين.

```js
import { date } from 'native-dates';

date('2026-11-16');
date('2026/11/6');
date('2026年11月16日');
date('2026. 11. 16.');
date(2026, 11, 16);
date({ year: 2026, month: 11, day: 16 });
```

مرّر نصوص ISO 8601 أو كائنات حقول إلى `datetime()`. يحدّد الحرف `Z` أو الإزاحة الرقمية في النهاية اللحظة الزمنية الدقيقة، بينما يُقرأ النص الخالي من الإزاحة كتوقيت محلي في المنطقة الزمنية المستهدفة.

```js
import { datetime } from 'native-dates';

datetime('2026-11-16T17:30:00Z', 'America/Los_Angeles'); // 9:30 AM PST
datetime('2026-11-16T09:30', 'America/Los_Angeles'); // 9:30 AM PST
datetime('2026-11-16T09:30[Europe/Berlin]'); // 9:30 AM CET
datetime({ year: 2026, month: 11, day: 16, hour: 9, minute: 30 }, 'Europe/Berlin');
```

عند تمرير طابع زمني ذي إزاحة إلى `date()` أو `time()`، يُستخرج يومه التقويمي أو ساعته المحلية في المنطقة الزمنية التي تطلبها:

```js
import { time } from 'native-dates';

date('2026-11-17T01:30:00Z', 'America/Los_Angeles'); // 2026-11-16
date('2026-11-17T01:30:00Z', 'Asia/Tokyo'); // 2026-11-17
time('2026-11-17T01:30:00Z', 'America/Los_Angeles'); // 17:30:00
```

## أوقات الساعة والمدد الزمنية

مرّر إلى `time()` أوقات ISO بنظام 24 ساعة، أو نصوص الساعة والدقيقة مثل `'14h30'`، أو نصوص نظام 12 ساعة، أو معاملات رقمية، أو كائن حقول. وما تزال الساعة المنفردة مثل `'14h'` ترمي خطأً كي تبقى المدد الزمنية غير ملتبسة.

```js
import { time } from 'native-dates';

time('09:30');
time('14h30');
time('9:30am');
time('5:15 PM');
time(17, 15, 30);
time({ hour: 9, minute: 30 });
```

مرّر إلى `duration()` عبارات مدة بالإنجليزية، أو نصوص مدد ISO 8601، أو عددًا ووحدة، أو كائن حقول.

```js
import { duration } from 'native-dates';

duration('1h 30m');
duration('2 weeks and 3 days');
duration('PT90M');
duration(90, 'minutes');
duration({ hours: 1, minutes: 30 });
```

## التواريخ الجزئية والنطاقات

مرّر نصوص السنة والشهر بصيغة ISO إلى [`yearMonth()`](/api/year-month-fn/)، أو اقرأ تواريخ انتهاء البطاقات التي تبدأ بالشهر عبر [`monthYear()`](/api/year-month-fn/#monthyear):

```js
import { dayMonth, monthDay, monthYear, yearMonth } from 'native-dates';

yearMonth('2026-11');
monthYear('11/28'); // YearMonth(2028-11)

monthDay('10/17');
dayMonth('17/10'); // MonthDay(10-17)
```

تعمل التواريخ المتكرّرة بلا سنة بالطريقة نفسها عبر [`monthDay()`](/api/month-day-fn/) و[`dayMonth()`](/api/month-day-fn/#daymonth). وللامتدادات، تقرأ [الدوال المصنعية للنطاقات](/api/range-fn/) طرفين أو نص فترة واحدًا:

```js
import { dateRange, timeRange } from 'native-dates';

dateRange('2026-11-01/2026-11-07');
timeRange('9am - 5pm');
```

## طوابع عصر Unix وكائنات Date وTemporal

تقبل `datetime()` طوابع عصر Unix بالمللي ثانية وكائنات `Date` القياسية في JavaScript وكائنات [Temporal](/guides/temporal/) مباشرةً.

يرمي تمرير رقم مجرّد إلى دالة مصنعية لتاريخ خطأً لغموضه؛ حوّل مللي ثواني عصر Unix إلى لحظة زمنية في منطقة زمنية أولًا، ثم اقرأ يومها التقويمي.

```js
import { date, datetime } from 'native-dates';

const fromEpoch = datetime(1794850200000, 'UTC');
const fromJSDate = datetime(new Date('2026-11-16T17:30:00Z'));
const localDay = date(new Date('2026-11-16T17:30:00Z'), 'America/Los_Angeles');
```

## لماذا ترمي النصوص الغامضة خطأً

بينما لا يحتمل النص الذي يبدأ بسنة من 4 أرقام سوى قراءة واحدة، يعني `'03/05/2026'` يوم 5 مارس في الولايات المتحدة ويوم 3 مايو في أوروبا وأمريكا اللاتينية. ترفض النواة النصوص الرقمية الغامضة بدل تخمين الشهر الخطأ في بيئة الإنتاج.

:::warning[القيم الفارغة لا ترجع افتراضيًا إلى اللحظة الحالية]
يرمي تمرير قيمة فارغة إلى أي دالة مصنعية خطأً بدل إرجاع التاريخ أو اللحظة الزمنية الحالية، كي لا يتنكّر حقل مفقود من واجهة API في صورة «اليوم». استدعِ [`now()`](/api/datetime-fn/#now) أو [`today()`](/api/date-fn/#today) عندما تريد اللحظة الزمنية أو التاريخ الحالي.
:::

## مدخلات المستخدم عبر إضافة loose

عند تحليل نصوص حرّة من مدخلات المستخدمين أو ملفات CSV أو ترويسات RFC 2822، استورد إضافة [`@native-dates/plugins/loose`](/plugins/loose/) ومرّر `{ loose: true }`. يقرأ الوضع المرن التواريخ وأوقات الساعة بالطريقة التي يكتبها بها الإعداد المحلي النشط، بما في ذلك أسماء الأشهر الموطّنة وكلمات فترات اليوم والساعات المفصولة بنقطة والأرقام خارج نطاق ASCII.

```js
import '@native-dates/plugins/loose';
import { date, datetime, monthDay, time, yearMonth } from 'native-dates';

date('Nov 16, 2026', { loose: true }); // 2026-11-16
date('16 de noviembre de 2026', { loose: true, locale: 'es' }); // 2026-11-16
datetime('Mon, 16 Nov 2026 17:30:00 GMT', { loose: true });
time('오후 2:30', { loose: true, locale: 'ko' }); // 14:30:00
yearMonth('Nov 2026', { loose: true }); // 2026-11
monthDay('17 février', { loose: true, locale: 'fr' }); // 02-17
```

تتبع التواريخ الرقمية المفصولة بشرطة مائلة أو نقطة ترتيب الإعداد المحلي النشط. مرّر `dayFirst` في الاستدعاء أو اضبطه في [إعدادات التطبيق](/api/configure/) عندما يستخدم المدخل ترتيبًا مختلفًا عن الإعداد المحلي النشط.

```js
date('03/05/2026', { loose: true, locale: 'en-US' }); // 2026-03-05
date('03/05/2026', { loose: true, locale: 'fr' }); // 2026-05-03
date('03/05/2026', { loose: true, locale: 'en-US', dayFirst: true }); // 2026-05-03
```

في الوضع المرن، تُرجع المدخلات غير القابلة للقراءة القيمة `null` بدل رمي خطأ عبر كل دالة مصنعية ونطاق. أمّا قيم الخيارات غير الصالحة مثل اسم منطقة زمنية مجهول فتظل ترمي خطأً.

```js
import { duration } from 'native-dates';

date('not a date', { loose: true }); // null
duration('soon', { loose: true }); // null
```

وعندما تتبع المدخلات تنسيقًا ثابتًا غير ISO مثل تصديرات CSV (`'24112026'`) أو سجلات الخادم أو تواريخ الأسابيع والأيام الترتيبية في السنة، استورد [`@native-dates/plugins/parse`](/plugins/parse/) ومرّر `{ format }` لمطابقة الرموز بدقة حتمية بدل التحليل التخميني.

```js
import '@native-dates/plugins/parse';
import { date, datetime } from 'native-dates';

date('24112026', { format: 'DDMMYYYY' }); // 2026-11-24
datetime('24/Nov/2026:12:40:01 -0500', { format: 'DD/MMM/YYYY:HH:mm:ss ZZ' });
```
