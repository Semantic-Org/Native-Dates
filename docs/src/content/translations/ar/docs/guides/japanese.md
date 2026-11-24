---
source: e095c0bff2bd
title: اليابانية
lede: نسّق الحقب الإمبراطورية وأيام الأسبوع بين أقواس باليابانية مع معالجة التواريخ بالشرطة المائلة وبداية الأسبوع يوم الأحد.
---

مرّر الوسم `'ja-JP'` لتنسيق التواريخ باليابانية (انظر [التوطين](/guides/localization/)). تبقى السنوات الميلادية افتراضية، بينما يحوّل الوسم `'ja-u-ca-japanese'` القوالب الجاهزة إلى الحقب الإمبراطورية عند الحاجة.

## الحقب الإمبراطورية والسنة الأولى

مرّر `'ja-u-ca-japanese'` لتنسيق التواريخ الإمبراطورية الرسمية، مثل العام 31 من حقبة هيسي في 30 أبريل 2019 والسنة الأولى من حقبة ريوا «元年» في اليوم التالي:

```js
import { date } from 'native-dates';

date('2019-04-30').format('long', 'ja-u-ca-japanese'); // '平成31年4月30日'
date('2019-05-01').format('long', 'ja-u-ca-japanese'); // '令和元年5月1日'
date('2026-11-16').format('short', 'ja-u-ca-japanese'); // 'R8/11/16'
date('2026-11-16').format('llll', 'ja-u-ca-japanese'); // '令和8年11月16日(月)'
```

تقرأ أنماط الرموز مثل `'YYYY年M月D日'` وخاصية `year` السنوات الميلادية دائمًا، حتى عند إرفاق إعداد محلي للحقبة الإمبراطورية. استخدم القوالب الجاهزة أو كائنات الخيارات عندما تريد أسماء الحقب:

```js
const reiwa = date('2026-11-16').locale('ja-u-ca-japanese');

reiwa.year; // 2026
reiwa.format('long'); // '令和8年11月16日'
reiwa.format('YYYY年M月D日'); // '2026年11月16日'
```

لا يحمل [`YearMonth`](/api/year-month/) يومًا محددًا، لذا ينسّق وفق الحقبة السارية في اليوم الأول من الشهر. وفي الأشهر التي شهدت انتقالًا في منتصفها مثل يناير 1989 بين شووا 64 وهيسي 1، حدّد يومًا عبر [`on()`](/api/year-month/#on) أولًا:

```js
import { yearMonth } from 'native-dates';

const jan1989 = yearMonth('1989-01');

jan1989.format('long', 'ja-u-ca-japanese'); // '昭和64年1月'
jan1989.on(8).format('long', 'ja-u-ca-japanese'); // '平成元年1月8日'
```

## أيام الأسبوع بين أقواس ونظام 12 ساعة

تختلف القوالب الجاهزة اليابانية القياسية في فواصلها وأسلوب عرض أيام الأسبوع:

| القالب الجاهز | المخرجات | الأسلوب والاستخدام الشائع |
|---|---|---|
| `'medium'` | `'2026/11/16'` | صيغة مدمجة بالشرطات المائلة للجداول وحقول النماذج. |
| `'long'` | `'2026年11月16日'` | تاريخ قياسي بالكانجي بترتيب السنة ثم الشهر ثم اليوم دون يوم الأسبوع. |
| `'full'` | `'2026年11月16日月曜日'` | يلحق اسم يوم الأسبوع الكامل مثل الاثنين «月曜日» دون مسافات أو أقواس. |
| `'llll'` | `'2026年11月16日(月)'` | أسلوب واجهات شائع يعرض رمز الاثنين «月» من مقطع كانجي واحد بين قوسين نصف عرض. |

يُرجع الرمز `'ddd'` مقطع كانجي مجردًا ليوم الأسبوع مثل «月» لتتمكن من إحاطته بأقواس كاملة العرض. ولأن رموز الشهر الطويل واليوم الترتيبي تلحق «月» و«日» بالفعل، فاقرن الرموز الرقمية للشهر واليوم بمقاطع الكانجي الحرفية:

```js
import { date } from 'native-dates';

const day = date('2026-11-16').locale('ja-JP');

day.format('YYYY年M月D日（ddd）'); // '2026年11月16日（月）'
day.format('MMMMDo(ddd)'); // '11月16日(月)'
day.format({ month: 'long', day: 'numeric', weekday: 'short' }); // '11月16日(月)'
```

يُعرض الوقت بنظام 24 ساعة افتراضيًا. مرّر `hour12: true` للعدّ الياباني الذي يبدأ من الصفر مثل «午前0:30» و«午後0:30»، أو استخدم `'Ah:mm'` للعدّ من 1 إلى 12:

```js
import { datetime } from 'native-dates';

const midnight = datetime('2026-11-16T00:30', 'Asia/Tokyo').locale('ja-JP');

midnight.format('time'); // '0:30'
midnight.format({ hour: 'numeric', minute: '2-digit', hour12: true }); // '午前0:30'
midnight.format('Ah:mm'); // '午前12:30'
```

## التواريخ بالشرطة المائلة والمدخلات اليابانية

تحلّل النواة تواريخ الكانجي بترتيب السنة أولًا والتواريخ المفصولة بشرطات مائلة أو نقاط من ملفات CSV والنماذج اليابانية مباشرة دون إضافات:

```js
import { date, datetime, yearMonth } from 'native-dates';

date('2026年11月16日').toString(); // '2026-11-16'
date('2026/1/5').toString(); // '2026-01-05'
datetime('2026年11月16日 9:30', 'Asia/Tokyo').toString(); // '2026-11-16T00:30:00.000Z'
yearMonth('2026年11月').toString(); // '2026-11'
```

مع [الإضافة المرنة](/plugins/loose/)، تُقرأ الأرقام وعلامات الترقيم كاملة العرض، وأوقات «午前» و«午後»، وتواريخ الشهر واليوم بالكانجي دون تطبيع يدوي:

```js
import '@native-dates/plugins/loose';
import { date, monthDay, time } from 'native-dates';

date('２０２６／１１／１６', { loose: true })?.toString(); // '2026-11-16'
time('午後2:30', { loose: true, locale: 'ja' })?.toString(); // '14:30:00'
monthDay('11月16日', { loose: true })?.toString(); // '11-16'
```

لا تزال سلاسل الحقب مثل `'令和8年11月16日'` تتطلب إدخالًا مُهيكلًا. عندما يجمع النموذج الحقبة والسنة منفصلتَين، مرّر `Temporal.PlainDate` بالتقويم الياباني مباشرة إلى [`date()`](/api/date-fn/) دون تحويل التقويم أولًا:

```js
const reiwaInput = Temporal.PlainDate.from({
  calendar: 'japanese',
  era: 'reiwa',
  eraYear: 8,
  month: 11,
  day: 16,
});

date(reiwaInput).toString(); // '2026-11-16'
```

## المناطق الزمنية وبداية الأسبوع

تقبل النواة معرّف `'Asia/Tokyo'` والإزاحات الثابتة. ومع [إضافة المناطق الزمنية](/plugins/zones/)، يُحلّ الاختصار `'JST'` وأسماء المدن اليابانية الكبرى بالإنجليزية (مثل `'Osaka'`) والأسماء اليابانية المضمّنة (مثل `'東京'`) تلقائيًا:

```js
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'JST').zone; // 'Asia/Tokyo'
datetime('2026-11-16T09:30', 'Osaka').zone; // 'Asia/Tokyo'
datetime('2026-11-16T09:30', '東京').zone; // 'Asia/Tokyo'
```

تبدأ الإعدادات المحلية اليابانية الأسبوع يوم الأحد كما في التقاويم الجدارية. مرّر `'monday'` أو ثبّت `weekStart` عند بناء جداول الأعمال التي تبدأ يوم الاثنين:

```js
import { date, weekdayNames } from 'native-dates';

const wed = date('2026-11-18').locale('ja-JP');

wed.weekStart; // 7
wed.startOf('week').toString(); // '2026-11-15'
wed.startOf('week', 'monday').toString(); // '2026-11-16'
weekdayNames('short', undefined, 'ja-JP');
// ['日', '月', '火', '水', '木', '金', '土']
weekdayNames('short', 'monday', 'ja-JP');
// ['月', '火', '水', '木', '金', '土', '日']
```

## النطاقات والتعبيرات النسبية

تربط القوالب الجاهزة للنطاقات تواريخ الشرطة المائلة أو أوقات الكانجي بعلامة مدّ كاملة العرض. مرّر نمط رموز إلى [`format()`](/api/ranges/#format) عندما يحتاج الطرفان إلى تواريخ الكانجي وأيام الأسبوع:

```js
import { dateRange, timeRange } from 'native-dates';

const span = dateRange('2026-11-16', '2026-11-20').locale('ja-JP');

span.format('long'); // '2026/11/16～2026/11/20'
span.format('M月D日(ddd)'); // '11月16日(月) – 11月20日(金)'
timeRange('09:00', '17:30').format('short', 'ja-JP'); // '9時00分～17時30分'
```

تُرجع [`CalendarDate`](/api/calendar-date/) تعبيرات الأيام النسبية الطبيعية حتى «一昨日» ليومين مضيا و«明後日» ليومين قادمين. أما [`DateTime`](/api/date-time/) فتُخرج وحدات معدودة دائمًا حتى لا تُقرأ فروق الساعات على أنها أيام تقويمية:

```js
import { date, datetime, duration } from 'native-dates';

const baseDate = date('2026-11-16').locale('ja-JP');
baseDate.minus(2, 'days').from(baseDate); // '一昨日'
baseDate.plus(2, 'days').from(baseDate); // '明後日'

const baseTime = datetime('2026-11-16T12:00', 'Asia/Tokyo').locale('ja-JP');
baseTime.minus(1, 'day').from(baseTime); // '1 日前'
duration({ hours: 2, minutes: 30 }).format('long', 'ja-JP'); // '2 時間 30 分'
```

:::tip[المسافات ونقاط ترميز علامة المدّ كاملة العرض]
تضع سلاسل الوقت النسبي والمدد اليابانية مسافات نصف عرض حول الأرقام وفق بيانات المحرك القياسية. وتُخرج قوالب النطاقات علامة المدّ كاملة العرض `U+FF5E` لا شرطة الموجة `U+301C`، لذا تحقّق من نقطة الترميز في الاختبارات.
:::
