---
source: d8be401b7194
title: المدد الزمنية
lede: أنشئ مددًا زمنية عبر دوال الوحدات المساعدة أو عبارات مقروءة، وقِس المدد الفاصلة ونسّقها.
---

يمثّل كائن [`Duration`](/api/duration/) مدة زمنية، مثل 90 دقيقة أو أسبوعين. يمكنك إنشاؤه مباشرةً للعمليات الحسابية على التواريخ، أو الحصول عليه عند قياس الفارق بين قيمتين.

## إنشاء كائن Duration

أنشئ مدة زمنية عبر دوال الوحدات المساعدة مثل [`hours()`](/api/duration-fn/#hours)، أو مرّر عبارة مدة بالإنجليزية أو نص ISO 8601 أو كائن حقول إلى [`duration()`](/api/duration-fn/):

```js
import { days, duration, hours } from 'native-dates';

const call = hours(1.5);
const trial = days(14);
const turnaround = duration('2 weeks, 3 days');
const iso = duration('PT1H30M');
const window = duration({ hours: 2, minutes: 45 });
```

اقرأ أعداد الوحدات مباشرةً من الكائن. تنتقل الكسور العشرية تلقائيًا إلى الوحدة الأصغر التالية، بينما تبقى الأعداد الصحيحة في الوحدة التي كتبتها:

```js
call.hours; // 1
call.minutes; // 30

const ninety = duration(90, 'minutes');
ninety.hours; // 0
ninety.minutes; // 90
```

## القياس بين قيمتين

استدعِ [`until()`](/api/date-time/#until) أو [`since()`](/api/date-time/#since) بين تاريخين أو وقتين أو قيمتي [`YearMonth`](/api/year-month/) أو لحظتين زمنيتين لقياس المدة الفاصلة بينهما:

```js
import { datetime } from 'native-dates';

const opened = datetime('2026-11-16T08:00', 'America/Los_Angeles');
const resolved = datetime('2026-11-16T10:30', 'America/Los_Angeles');

const elapsed = opened.until(resolved);
elapsed.hours; // 2
elapsed.minutes; // 30
```

وعندما تحتاج رقمًا واحدًا للحسابات أو أشرطة التقدّم، مرّر الوحدة المستهدفة كمعامل ثانٍ:

```js
opened.until(resolved, 'hours'); // 2.5
resolved.since(opened, 'minutes'); // 150
```

كما يوفّر كل [نطاق](/api/ranges/) مدّته مباشرةً عبر الخاصية `.duration`:

```js
import { dateRange, timeRange } from 'native-dates';

dateRange('2026-11-01', '2026-11-07').duration.days; // 7
timeRange('9:00am', '5:30pm').duration.hours; // 8
```

## موازنة الوحدات وحساب الإجمالي

تبقى القيم في الوحدات التي أدخلتها بها حتى تطلب خلاف ذلك. استدعِ [`balance()`](/api/duration/#balance) لترحيل الفائض إلى الوحدات الأكبر:

```js
import { hours, minutes, months } from 'native-dates';

minutes(90).balance().toFields(); // { hours: 1, minutes: 30 }
months(18).balance().toFields(); // { years: 1, months: 6 }
hours(36).balance('day').toFields(); // { days: 1, hours: 12 }
```

عند استدعاء `balance()` بلا معاملات، ترحّل المدد المستقلة الأشهر إلى سنوات، ووحدات الساعة حتى الساعات، وتترك الأيام كما هي كي لا تنزاح حدود التوقيت الصيفي.

مرّر `'day'` أو `'week'` عندما تريد أيامًا ثابتة من 24 ساعة أو أسابيع من 7 أيام.

استدعِ [`total()`](/api/duration/#total) أو اسمها البديل [`as()`](/api/duration/#as) لاختزال المدة كاملةً إلى رقم عشري واحد بوحدة واحدة:

```js
import { duration } from 'native-dates';

const shift = duration('7h 30m');

shift.total('hours'); // 7.5
shift.as('minutes'); // 450
```

:::note[الإجمالي بالأشهر والسنوات]
تُحسب إجماليات السنوات والأشهر وتُوازَن بينها مباشرةً بمعدل 12 شهرًا في السنة. أمّا التحويل بين الأيام والأشهر فيتطلب تاريخًا تقويميًا مرجعيًا، وهو ما تتذكره المدد الناتجة من `until()` و`since()` تلقائيًا.
:::

```js
import { date, months } from 'native-dates';

months(18).total('years'); // 1.5

const span = date('2026-01-15').until('2026-04-15');
span.total('months'); // 3
span.total('days'); // 90
```

## تنسيق المدد الزمنية

تضبط كل مدة خاصية `.text` على صيغتها الطويلة الموطّنة. استدعِ [`format()`](/api/duration/#format) مع اسم قالب جاهز للحصول على إخراج طويل أو مختصر أو مضغوط أو رقمي:

```js
import { duration } from 'native-dates';

const flight = duration({ hours: 2, minutes: 30 });

flight.text; // '2 hours, 30 minutes'
flight.format('long', 'en-US'); // '2 hours, 30 minutes'
flight.format('short', 'en-US'); // '2 hr, 30 min'
flight.format('narrow', 'en-US'); // '2h 30m'
flight.format('digital', 'en-US'); // '2:30:00'
```

مرّر وسم إعداد محلي كمعامل ثانٍ لتغيير لغة أسماء الوحدات، أو استدعِ [`toString()`](/api/duration/#tostring) عندما تحتاج نص ISO 8601 لحمولة API.
