---
source: 450f88efed26
title: الانتقال من Day.js
lede: استعِض عن كائنات dayjs وسلاسل الإضافات بأنواع مخصّصة ومناطق زمنية مدمجة في النواة.
---

تغلّف Day.js تاريخ JavaScript في كائن `dayjs()` واحد، وتضيف المناطق الزمنية وتوقيت UTC والنطاقات والمدد الزمنية عبر إضافات منفصلة. يحافظ الانتقال إلى Native Dates على الأسلوب الخفيف وغير القابل للتعديل، مع منح الأيام التقويمية وأوقات الساعة واللحظات الزمنية والتواريخ الجزئية والنطاقات والمدد أنواعها الخاصة في النواة.

## اختر date() أو datetime()

في Day.js، يمرّ كلٌّ من تاريخ الميلاد والطابع الزمني القادم من API عبر `dayjs()`.

أما هنا، فتستخدم الأيام التقويمية [`date()`](/api/date-fn/) أو [`today()`](/api/date-fn/#today)، بينما تتوفّر دوال مصنعية مخصّصة للتواريخ الجزئية في النواة [لأشهر الفوترة](/api/year-month-fn/) و[أعياد الميلاد المتكررة](/api/month-day-fn/).

وتستخدم اللحظات الزمنية الفعلية [`datetime()`](/api/datetime-fn/) أو [`now()`](/api/datetime-fn/#now):

```js
import { date, datetime, monthDay, now, today, yearMonth } from 'native-dates';

const current = now(); // بديل dayjs() لطابع زمني
const due = today().plus(2, 'weeks'); // بديل dayjs().add(2, 'week') ليوم تقويمي
const created = datetime('2026-11-16T17:30:00Z');
const birthday = date('2026-05-10');
const billing = yearMonth('2026-11');
const recurring = monthDay('05-10');
```

تعمل أسماء الجمع والطرح القياسية (`add()` و`subtract()`) بوصفها أسماء بديلة إذا كانت شيفرتك تستدعيها بالفعل. ويرمي تمرير قيمة فارغة إلى أي دالة مصنعية خطأ بدل إرجاع اللحظة الحالية بصمت، ما يكشف حقول API المفقودة مبكرًا.

## الأشهر تبدأ من 1

ترث Day.js ترقيم الأشهر الذي يبدأ من الصفر حيث يناير هو 0، وتقرأ `.date()` يوم الشهر. أما هنا، فالحقول التقويمية خصائص مباشرة وتُرقّم الأشهر من 1 إلى 12.

```js
import { date } from 'native-dates';

const d = date('2026-11-16');

d.year; // 2026
d.month; // 11، نوفمبر
d.day; // 16
d.dayOfWeek; // 1، الاثنين
```

:::warning[راجع أرقام الأشهر وأيام الأسبوع]
ترقّم Day.js الأشهر من 0 إلى 11 وتبدأ أيام الأسبوع بالأحد عند 0. أما هنا، فيمتد `month` من 1 إلى 12، ويمتد `dayOfWeek` من 1 يوم الاثنين إلى 7 يوم الأحد. وفي أنماط الرموز، يطبع `'E'` ترقيم ISO من 1 إلى 7 بينما يحتفظ `'d'` بترقيم Day.js من 0 إلى 6.
:::

## المناطق الزمنية والمدد والنطاقات مدمجة في النواة

تتطلب Day.js إضافات منفصلة قبل أن تتمكن من تحويل التواريخ والأوقات بين المدن، أو إنشاء المدد الزمنية، أو التحقق من وقوع تاريخ داخل نطاق. وتضمّ النواة هنا مناطق IANA الزمنية و[المدد الزمنية](/api/duration/) و[النطاقات](/api/ranges/) دون أي إعداد إضافي.

```js
import { dateRange, datetime, duration, hours } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
const berlin = standup.in('Europe/Berlin'); // بديل .tz('Europe/Berlin')

const span = duration('1h 30m').plus(hours(0.5));
span.total('minutes'); // 120

const november = dateRange('2026-11-01', '2026-11-30');
november.contains('2026-11-16'); // true
dateRange('2026-11-01', '2026-11-15').overlaps(november); // true
```

بدلًا من تمرير أقواس الشمول إلى `isBetween()`، تشمل نطاقات التواريخ طرفَي البداية والنهاية معًا، بينما تستثني نطاقات اللحظات والأوقات حدّ النهاية تلقائيًا.

## القوالب الجاهزة وأنماط الرموز

تدعم النواة قوالب `Intl` الجاهزة وأسماء التنسيقات الموطّنة في Day.js و[أنماط الرموز](/guides/formatting/#token-patterns) المخصّصة مباشرة على [`format()`](/api/date-time/#format) دون ملفات إعدادات محلية أو إضافات:

```js
import { datetime } from 'native-dates';

const dt = datetime('2026-11-16T17:30:00Z', 'America/New_York');

dt.format('medium', 'en-US'); // 'Nov 16, 2026, 12:30 PM'
dt.format('LLL', 'en-US'); // 'November 16, 2026 at 12:30 PM'
dt.format('YYYY-MM-DD HH:mm'); // '2026-11-16 12:30'
```

## الإضافات الاختيارية

تقتصر [`@native-dates/plugins`](/plugins/) على ثلاث إضافات اختيارية: تحليل النصوص غير المتوافقة مع ISO، وحلّ أسماء مدن IANA بالإنجليزية والاختصارات، ودوال القراءة التراثية لـ `Date`. استورد كل مسار فرعي مرة واحدة عند بدء التشغيل:

```js
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { date, datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'Berlin').zone; // 'Europe/Berlin'
date('Nov 16, 2026', { loose: true }); // CalendarDate(2026-11-16)
```

## مرجع المقارنة السريع

| Day.js | Native Dates | ملاحظات |
|---|---|---|
| `dayjs()` | `now()` أو `today()` | اختر اللحظة الحالية (تاريخًا ووقتًا) أو اليوم التقويمي |
| `d.month()`، `d.date()` | `d.month`، `d.day` | خصائص مباشرة مع ترقيم الأشهر من 1 إلى 12 |
| `d.day()`، `d.isoWeekday()` | `d.dayOfWeek` | ترقيم ISO من 1 يوم الاثنين إلى 7 يوم الأحد، مع `'E'` للأرقام من 1 إلى 7 و`'d'` من 0 إلى 6 |
| `d.unix()`، `d.valueOf()` | `dt.epochSeconds`، `dt.epochMilliseconds` | كل عدّاد منذ عصر Unix (1970) يصرّح بوحدته |
| `d.add(2, 'day')` | `d.plus(2, 'days')` | تعمل أيضًا الأسماء البديلة `add()` و`subtract()` |
| `dayjs.tz(x, zone)` | `datetime(x, zone)` | في النواة دون إضافة `timezone` |
| `d.tz(zone)` | `dt.in(zone)` | يعرض اللحظة نفسها في منطقة IANA أخرى |
| `dayjs.utc(x)` | `datetime(x, 'UTC')` | في النواة دون إضافة `utc` |
| `b.diff(a, 'day', true)` | `a.until(b, 'days')` | المجموع الكسري بالوحدة المطلوبة |
| `dayjs.duration(90, 'm')` | `minutes(90)` أو `duration('90m')` | في النواة دون إضافة `duration` |
| `d.format('LLL')` | `dt.format('LLL')` | قوالب جاهزة موطّنة من `'LT'` إلى `'llll'` |
| `d.format('YYYY-MM-DD HH:mm')` | `dt.format('YYYY-MM-DD HH:mm')` | [أنماط الرموز](/guides/formatting/#token-patterns) في النواة |
| `d.isBetween(a, b)` | `dateRange(a, b).contains(d)` | [النطاقات](/api/ranges/) مع `to()` و`for()` و`overlaps()` |
| `d.fromNow()`، `d.from(other)` | `d.fromNow()`، `d.from(other)` | في النواة دون إضافة `relativeTime` |
| `customParseFormat` | `{ loose: true }` | توفّرها [`@native-dates/plugins/loose`](/plugins/loose/) |
