---
source: 1ff5dd8e887b
title: الكورية
lede: حلّل التواريخ الكورية المفصولة بنقاط ونسّق أيام الأسبوع والأعياد القمرية.
---

مرّر الوسم `'ko-KR'` لتنسيق التواريخ بالكورية (انظر [التوطين](/guides/localization/)). تطبع القوالب الجاهزة الكورية نقاطًا متبوعة بمسافة مع نقطة ختامية مثل `'2026. 11. 16.'`، وتضع «오전» أو «오후» قبل الساعة.

## التواريخ المفصولة بنقاط والسلاسل الكورية

تحلّل النواة التواريخ الكورية المفصولة بنقاط ومسافات مع نقطة ختامية، وسلاسل وحدات الهانغل مباشرة دون إضافات:

```js
import { date, datetime, yearMonth } from 'native-dates';

date('2026. 11. 16.').toString(); // '2026-11-16'
date('2026년 11월 16일').toString(); // '2026-11-16'
datetime('2026. 11. 16. 14:30', 'Asia/Seoul').toString(); // '2026-11-16T05:30:00.000Z'
yearMonth('2026년 11월').toString(); // '2026-11'
```

استورد [الإضافة المرنة](/plugins/loose/) مع إعداد محلي كوري لقراءة التواريخ المختصرة بسنة من رقمين بترتيب السنة أولًا، وأوقات «오전» و«오후»، وتواريخ الشهر واليوم بالهانغل:

```js
import '@native-dates/plugins/loose';
import { date, monthDay, time } from 'native-dates';

date('26. 5. 5.', { loose: true, locale: 'ko' })?.toString(); // '2026-05-05'
date('12.11.26', { loose: true, locale: 'ko' })?.toString(); // '2012-11-26'
time('오후 2:30', { loose: true, locale: 'ko' })?.toString(); // '14:30:00'
monthDay('11월 16일', { loose: true })?.toString(); // '11-16'
```

مرّر `locale: 'ko'` دائمًا عند قراءة السنوات المكوّنة من رقمين، لأن `'12.11.26'` تُقرأ بوصفها 11 ديسمبر 2026 في بيئة تشغيل مضبوطة على الإنجليزية الأمريكية:

| المدخل | النتيجة | طريقة المعالجة |
|---|---|---|
| `'2026. 11. 16.'`، `'2026년 11월 16일'` | يُحلَّل في النواة | مرّره مباشرة دون إضافة. |
| `'26. 5. 5.'`، `'12.11.26'`، `'오후 2:30'` | يُحلَّل في الوضع المرن | استورد الإضافة المرنة ومرّر `{ loose: true, locale: 'ko' }`. |

## أيام الأسبوع بين أقواس وترتيب صباحًا ومساءً

يطبع القالب الجاهز `'full'` أسماء أيام الأسبوع الكاملة مثل «화요일» للثلاثاء. أما `'llll'` وخيارات يوم الأسبوع المختصر فتضع أيام الأسبوع من حرف واحد بين قوسين وتربط النطاقات بعلامة مدّ:

```js
import { date, dateRange } from 'native-dates';

const holiday = date('2026-05-05').locale('ko-KR');

holiday.format('llll'); // '2026년 5월 5일 (화)'
holiday.format({ month: 'long', day: 'numeric', weekday: 'short' });
// '5월 5일 (화)'

const week = dateRange('2026-11-16', '2026-11-20');
week.format({ month: 'long', day: 'numeric', weekday: 'short' }, 'ko-KR');
// '11월 16일 (월)~20일 (금)'
```

تمرّ أحرف الهانغل عبر أنماط الرموز دون أقواس مربعة. تتضمّن رموز الشهر المختصر واليوم الترتيبي حرفَي «월» و«일» بالفعل، بينما ينسّق `'ddd'` يوم الأسبوع من حرف واحد:

```js
import { datetime } from 'native-dates';

const slot = datetime('2026-05-05T14:05:00', 'Asia/Seoul').locale('ko-KR');

slot.format('YYYY. MM. DD. (ddd)'); // '2026. 05. 05. (화)'
slot.format('YYYY년 M월 D일 A h시 m분'); // '2026년 5월 5일 오후 2시 5분'
slot.format('MMM Do (dd)'); // '5월 5일 (화)'
```

تضع الكورية «오전» لصباحًا و«오후» لمساءً قبل الساعة. مرّر `'ko-KR-u-hc-h23'` لتحويل قوالب نظام 12 ساعة الجاهزة إلى نظام 24 ساعة:

```js
slot.format('medium'); // '2026. 5. 5. 오후 2:05'
slot.format('medium', 'ko-KR-u-hc-h23'); // '2026. 5. 5. 14:05'
```

## توقيت كوريا القياسي والأسماء البديلة للمناطق

تقبل النواة معرّف `'Asia/Seoul'` والإزاحات الثابتة. استورد [إضافة المناطق الزمنية](/plugins/zones/) لحلّ الاختصار `'KST'` وأسماء المدن الكورية بالإنجليزية (مثل `'Busan'`) وأسماء الهانغل المضمّنة (مثل `'서울'`) تلقائيًا، بما في ذلك الاختصارات داخل السلاسل النصية في الوضع المرن:

```js
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T14:30', 'KST').zone; // 'Asia/Seoul'
datetime('2026-11-16T14:30', '서울').zone; // 'Asia/Seoul'
datetime('2026-11-16T14:30', 'Busan').zone; // 'Asia/Seoul'
datetime('2026. 11. 16. 14:30 KST', { loose: true, zone: 'UTC' })?.toString();
// '2026-11-16T05:30:00.000Z'
```

تطبع أسماء المنطقة المختصرة بالكورية <bdi>GMT+9</bdi>، بينما يُخرج `'zzz'` الاسم الكوري الكامل «한국 표준시». ولأن خوادم UTC تبقى في تاريخ الأمس حتى <bdi>8:59</bdi> صباحًا بتوقيت كوريا، مرّر `'Asia/Seoul'` إلى [`today()`](/api/date-fn/#today):

```js
import { datetime, today } from 'native-dates';

const meeting = datetime('2026-11-16T05:30:00Z', 'Asia/Seoul').locale('ko-KR');

meeting.text; // '2026년 11월 16일 오후 2:30 GMT+9'
meeting.format('A h:mm zzz'); // '오후 2:30 한국 표준시'
today('Asia/Seoul');
```

## تقاويم تبدأ بالأحد وأسابيع عمل تبدأ بالاثنين

يبدأ الإعداد المحلي `'ko-KR'` الأسبوع يوم الأحد كما في التقاويم الجدارية، بينما تعدّ أسابيع العمل الكورية والتسويات المالية ورقم أسبوع ISO (`weekOfYear`) من يوم الاثنين:

```js
import { date, weekdayNames } from 'native-dates';

const sun = date('2026-11-15').locale('ko-KR');

sun.weekStart; // 7
sun.startOf('week').toString(); // '2026-11-15'
sun.weekOfYear; // 46
weekdayNames('short', undefined, 'ko-KR');
// ['일', '월', '화', '수', '목', '금', '토']
weekdayNames('short', 'monday', 'ko-KR');
// ['월', '화', '수', '목', '금', '토', '일']
```

مرّر `'monday'` في كل استدعاء، أو ثبّت يوم البداية في [التهيئة](/api/configure/)، أو استخدم `'ko-KR-u-fw-mon'` للحصول على النصوص الكورية مع أسابيع تبدأ بالاثنين:

```js
const wed = date('2026-11-18').locale('ko-KR-u-fw-mon');

wed.weekStart; // 1
wed.startOf('week').toString(); // '2026-11-16'
```

## التواريخ النسبية والأعياد القمرية

تُرجع التواريخ التقويمية الكورية تعبيرات الأيام النسبية مثل «그저께» ليومين مضيا و«모레» ليومين قادمين. أما [`DateTime`](/api/date-time/) فتُرجع «지금» عند تساوي اللحظتين (صفر ثانية) ووحدات معدودة في غير ذلك:

```js
import { date, datetime } from 'native-dates';

const day = date('2026-11-16').locale('ko-KR');
day.minus(2, 'days').from(day); // '그저께'
day.plus(2, 'days').from(day); // '모레'

const moment = datetime('2026-11-16T12:00', 'Asia/Seoul').locale('ko-KR');
moment.minus(2, 'days').from(moment); // '2일 전'
```

مرّر `'ko-KR-u-ca-dangi'` لأعياد سولال وتشوسوك وأعياد الميلاد القمرية، بما في ذلك الأشهر الكبيسة مثل «윤6월». تطبع القوالب المختصرة رقم الدورة من 1 إلى 60 بدل السنة، لذا فضّل `'long'` أو خيارات الشهر واليوم:

```js
const chuseok = date('2026-09-25');
const leapDay = date('2025-07-25');

chuseok.format('long', 'ko-KR-u-ca-dangi'); // '병오년 8월 15일'
chuseok.format({ month: 'long', day: 'numeric' }, 'ko-KR-u-ca-dangi'); // '8월 15일'
leapDay.format('long', 'ko-KR-u-ca-dangi'); // '을사년 윤6월 1일'
```

:::tip[تنسيق التواريخ القمرية المتكررة]
يبقى [`MonthDay`](/api/month-day/) و[`YearMonth`](/api/year-month/) على التقويم الميلادي حتى عند تمرير وسم إعداد محلي قمري. نسّق أعياد الميلاد والأعياد القمرية من [`CalendarDate`](/api/calendar-date/) الميلادي الخاص بتلك السنة بدلًا من ذلك.
:::
