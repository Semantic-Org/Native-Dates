---
source: f7719b9dc227
title: الانتقال من Moment
lede: انتقل من Moment وmoment-timezone إلى كائنات غير قابلة للتعديل بأنماط رموز مدمجة ودون حزم بيانات مناطق زمنية.
---

تولّت Moment و`moment-timezone` التعامل مع التواريخ في JavaScript لسنوات، لكن بثمنٍ من الكائنات القابلة للتعديل، وترقيم الأشهر بدءًا من الصفر، وحزم المناطق الزمنية الضخمة.

يزيل الانتقال إلى Native Dates استدعاءات النسخ الاحتياطي وتضخّم الحزمة، ويتيح لك تحديث المستودعات الكبيرة وحدةً بعد أخرى.

## كل قيمة غير قابلة للتعديل

تعدّل إضافة الأيام أو الانتقال إلى بداية الشهر في Moment الكائن نفسه في موضعه. وقد يؤدي تمرير تاريخ مشترك إلى دالة مساعدة إلى إفساد حالة المستدعي بصمت ما لم يتذكر الجميع نسخه أولًا.

كل قيمة هنا غير قابلة للتعديل. وتُرجع طرق مثل [`plus()`](/api/date-time/#plus) و[`in()`](/api/date-time/#in) كائنًا جديدًا دائمًا وتترك الأصلي دون مساس.

```js
import { date } from 'native-dates';

const start = date('2026-11-16');
const deadline = start.plus(7, 'days');

start.toString(); // '2026-11-16'
deadline.toString(); // '2026-11-23'
```

:::tip[احذف استدعاءات النسخ الاحتياطي]
يمكنك حذف كل استدعاء `.clone()` أثناء الانتقال. كما تتضمّن المكتبة بدائل غير قابلة للتعديل للجمع والطرح (`add()` و`subtract()`)، فتستمر مواضع الاستدعاء الحسابية القائمة بالعمل كما هي.
:::

## أنواع مخصّصة وأشهر يبدأ عدّها من 1

تغلّف Moment كل مفهوم في صنف واحد وترقّم الأشهر من 0 إلى 11، حيث يعني الشهر 10 نوفمبر. أما هنا، فـ `month` خاصية مباشرة يمتد عدّها من 1 إلى 12.

اختر [`date()`](/api/date-fn/) للأيام التقويمية، و[`datetime()`](/api/datetime-fn/) للحظات المرتبطة بمنطقة زمنية، والدوال المصنعية في النواة [لأوقات الساعة](/api/time-fn/) و[أشهر الفوترة](/api/year-month-fn/) و[أعياد الميلاد المتكررة](/api/month-day-fn/):

```js
import { date, datetime, monthDay, yearMonth } from 'native-dates';

const invoiceDate = date(2026, 11, 16);
invoiceDate.month; // 11، نوفمبر

const sentAt = datetime('2026-11-16T17:30:00Z', 'America/New_York');
sentAt.hour; // 12

const billing = yearMonth('2026-11');
const birthday = monthDay('10/17');
```

## بلا بيانات مناطق زمنية مضمّنة

تُضمّن `moment-timezone` نسختها الخاصة من قاعدة بيانات IANA وترسلها إلى المتصفح.

أما النواة هنا فتقرأ قواعد المناطق الزمنية مباشرة من محرّكَي `Temporal` و`Intl` في بيئة التشغيل. وتعمل كل منطقة IANA تلقائيًا، بينما تضيف [`@native-dates/plugins/zones`](/plugins/zones/) حلّ أسماء المدن بالإنجليزية والاختصارات عندما يمرّر المستدعون أسماء مثل `'Berlin'` أو `'Pacific Time'`.

```js
import { datetime } from 'native-dates';

const kickoff = datetime('2026-11-16T09:30', 'America/Los_Angeles');

kickoff.in('Europe/London').format('short', 'en-GB'); // '16/11/2026, 17:30'
kickoff.in('Asia/Tokyo').format('short', 'en-US'); // '11/17/26, 2:30 AM'
```

## أنماط الرموز والقوالب الجاهزة والنطاقات في النواة

تعمل [أنماط الرموز](/guides/formatting/#token-patterns) الخاصة بـ Moment، والقوالب الجاهزة الموطّنة من `'LT'` إلى `'llll'`، والعبارات النسبية، و[النطاقات](/api/ranges/) جميعها في النواة دون أي إضافات:

```js
import { dateRange, datetime } from 'native-dates';

const kickoff = datetime('2026-11-16T09:30', 'America/Los_Angeles');
kickoff.format('YYYY-MM-DD HH:mm'); // '2026-11-16 09:30'
kickoff.format('LLL', 'en-US'); // 'November 16, 2026 at 9:30 AM'
kickoff.from('2026-11-16T07:30-08:00', 'en-US'); // 'in 2 hours'

const quarter = dateRange('2026-10-01', '2026-12-31');
quarter.contains('2026-11-16'); // true
quarter.overlaps(dateRange('2026-12-15', '2027-01-15')); // true
```

## مرجع المقارنة السريع

| Moment | Native Dates | ملاحظات |
|---|---|---|
| `moment()` | `now()` أو `today()` | تمييز صريح بين اللحظة الزمنية الحالية واليوم التقويمي |
| `moment.tz(str, zone)` | `datetime(str, zone)` | مدمجة في النواة دون بيانات مناطق زمنية مضمّنة |
| `m.clone().add(7, 'days')` | `d.plus(7, 'days')` | غير قابلة للتعديل دائمًا، ويعمل الاسم البديل `add()` أيضًا |
| `m.tz('Europe/Berlin')` | `dt.in('Europe/Berlin')` | يعرض اللحظة نفسها في منطقة زمنية أخرى |
| `m.month()`، `m.date()` | `d.month`، `d.day` | خصائص مباشرة مع ترقيم الأشهر من 1 إلى 12 |
| `m.day()`، `m.isoWeekday()` | `d.dayOfWeek` | ترقيم ISO من 1 يوم الاثنين إلى 7 يوم الأحد، مع `'E'` للأرقام من 1 إلى 7 و`'d'` من 0 إلى 6 |
| `m.unix()`، `m.valueOf()` | `dt.epochSeconds`، `dt.epochMilliseconds` | كل عدّاد منذ عصر Unix (1970) يصرّح بوحدته |
| `b.diff(a, 'hours', true)` | `a.until(b, 'hours')` | المجموع الكسري بالوحدة المطلوبة |
| `moment.duration(2, 'h')` | `hours(2)` أو `duration('2h')` | دوال مساعدة للمدد الزمنية في النواة |
| `m.format('LLL')` | `dt.format('LLL')` | قوالب جاهزة موطّنة من `'LT'` إلى `'llll'` دون ملفات إعدادات محلية |
| `m.format('YYYY-MM-DD HH:mm')` | `dt.format('YYYY-MM-DD HH:mm')` | [أنماط الرموز](/guides/formatting/#token-patterns) |
| `m.isBetween(a, b)` | `dateRange(a, b).contains(d)` | [النطاقات](/api/ranges/) مع `to()` و`for()` و`overlaps()` |
| `m.fromNow()`، `m.from(other)` | `dt.fromNow()`، `dt.from(other)` | [عبارات الوقت النسبي](/guides/formatting/#relative-phrases) |
| تحليل السلاسل غير المتوافقة مع ISO | `{ format }` أو `{ loose: true }` | حمّل [`@native-dates/plugins/parse`](/plugins/parse/) لأنماط التنسيق الثابتة، أو [`@native-dates/plugins/loose`](/plugins/loose/) للمدخلات الموطّنة وغير الرسمية |

## الانتقال التدريجي

نادرًا ما ينتقل مشروع كبير بالكامل في طلب سحب واحد. استدعِ [`toJSDate()`](/api/date-time/#tojsdate) عند الحدود التي لا تزال تتوقع كائن `Date` قياسيًا، ومرّر كائنات `Date` مجددًا إلى [`datetime()`](/api/datetime-fn/) عند الدخول.

```js
import { datetime } from 'native-dates';

const sentAt = datetime('2026-11-16T17:30:00Z', 'America/New_York');
const legacy = sentAt.toJSDate();
const restored = datetime(legacy, 'America/New_York');
```

وعندما لا تزال الدوال المساعدة اللاحقة تستدعي دوال القراءة التراثية مثل `getFullYear()` مباشرة على القيم، استورد إضافة [`legacy-date`](/plugins/legacy-date/).

تستخرج دوال القراءة الحقول في المنطقة الزمنية الخاصة بالقيمة مع الإبقاء على ترقيم الأشهر بدءًا من الصفر للتوافق الفوري. أما دوال الضبط المُعدِّلة فترمي خطأ فورًا حتى تنكشف التعديلات الموضعية الخفية أثناء الاختبارات.

```js
import '@native-dates/plugins/legacy-date';
import { datetime } from 'native-dates';

const dt = datetime('2026-11-16T09:30', 'America/Los_Angeles');

dt.getFullYear(); // 2026
dt.getMonth(); // 10، مطابقةً لـ Date.prototype.getMonth()
dt.getHours(); // 9، بتوقيت America/Los_Angeles
```
