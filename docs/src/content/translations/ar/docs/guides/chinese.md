---
source: 1f74e099bd7a
title: الصينية
lede: تعامل مع تنسيقات التواريخ الإقليمية والتقويم القمري في الأسواق الناطقة بالصينية.
---

مرّر وسمًا إقليميًا مثل `'zh-CN'` أو `'zh-TW'` لتنسيق التواريخ بالصينية (انظر [التوطين](/guides/localization/)). يحدّد كل إقليم نظام الكتابة وترتيب التاريخ ونظام الساعة وبداية الأسبوع الخاصة به.

## توقيت الصين القياسي واختصار CST

مرّر `'Asia/Shanghai'` لتوقيت بكين. وخلافًا لإزاحة <bdi>UTC+8</bdi> الثابتة، يُخرج هذا المعرّف أسماء المنطقة الموطّنة مثل «中国标准时间» ويحتفظ بإزاحات التوقيت الصيفي التاريخية في الصين بين عامَي 1986 و1991:

```js
import { datetime } from 'native-dates';

const release = datetime('2026-11-16T09:30:00Z', 'Asia/Shanghai').locale('zh-CN');

release.format('YYYY-MM-DD HH:mm zzzz'); // '2026-11-16 17:30 中国标准时间'
datetime('1988-07-15T00:00:00Z', 'Asia/Shanghai').offset; // '+09:00'
```

مع [إضافة المناطق الزمنية](/plugins/zones/)، يتبع الاختصار `'CST'` الإعداد المحلي النشط، فيُحلّ إلى شنغهاي في البر الرئيسي للصين وإلى تايبيه في تايوان. كما تُحلّ أسماء المدن الرئيسية في البر الرئيسي بالإنجليزية (مثل `'Beijing'` و`'Shenzhen'`) تلقائيًا، بينما تبقى `'Urumqi'` على توقيت شينجيانغ (<bdi>UTC+6</bdi>):

```js
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T09:30:00Z', { zone: 'CST', locale: 'zh-CN' }).zone; // 'Asia/Shanghai'
datetime('2026-11-16T09:30:00Z', { zone: 'CST', locale: 'zh-TW' }).zone; // 'Asia/Taipei'
datetime('2026-11-16T09:30:00Z', 'Beijing').zone; // 'Asia/Shanghai'
datetime('2026-11-16T09:30:00Z', 'Shenzhen').format('HH:mm', 'zh-CN'); // '17:30'
datetime('2026-11-16T09:30:00Z', 'Urumqi').offset; // '+06:00'
```

## الفروق الإقليمية

يختلف البر الرئيسي للصين وتايوان وهونغ كونغ وماكاو وسنغافورة في نظام الساعة الافتراضي وترتيب التاريخ المختصر ومقاطع أيام الأسبوع وأول أيام الأسبوع:

| وسم الإعداد المحلي | التاريخ المختصر | بداية الأسبوع | نظام الساعة الافتراضي وأعراف أيام الأسبوع |
|---|---|---|---|
| `zh-CN` | `2026/11/16` | الاثنين | نظام 24 ساعة افتراضيًا، مع صيغ الصينية المبسّطة `周一` إلى `周日` من الاثنين إلى الأحد. |
| `zh-TW` | `2026/11/16` | الأحد | نظام 12 ساعة مع `上午` و`下午` لصباحًا ومساءً، وصيغ الصينية التقليدية `週一` لأيام الأسبوع. |
| `zh-HK` | `16/11/2026` | الأحد | نظام 12 ساعة وتواريخ مختصرة بترتيب اليوم أولًا، وهو السلوك نفسه في ماكاو. |
| `zh-SG` | `16/11/26` | الأحد | نظام 12 ساعة وأيام أسبوع مبسّطة تبدأ بـ `周` وتواريخ بترتيب اليوم أولًا بسنة من رقمين. |

تُعرَض اللحظة نفسها بالقالب الجاهز المحلي لكل إقليم:

```js
import { datetime } from 'native-dates';

const meeting = datetime('2026-11-16T17:05:00+08:00', 'Asia/Shanghai');

meeting.format('medium', 'zh-CN'); // '2026年11月16日 17:05'
meeting.format('medium', 'zh-TW'); // '2026年11月16日 下午5:05'
meeting.date.format('short', 'zh-HK'); // '16/11/2026'
meeting.date.format('short', 'zh-SG'); // '16/11/26'
```

يوم الأحد يُنهي الأسبوع الجاري في البر الرئيسي للصين، بينما يبدأ أسبوعًا جديدًا في تايوان وهونغ كونغ وسنغافورة. مرّر `'monday'` إلى [`startOf()`](/api/calendar-date/#startof) لتوحيد مفاتيح التقارير الأسبوعية المشتركة:

```js
import { date } from 'native-dates';

const sunday = date('2026-11-15');

sunday.locale('zh-CN').range('week').toString(); // '2026-11-09/2026-11-15'
sunday.locale('zh-HK').range('week').toString(); // '2026-11-15/2026-11-21'
sunday.locale('zh-HK').startOf('week', 'monday').toString(); // '2026-11-09'
```

في الصينية المبسّطة، يطبع النمط `'Ah:mm'` لفظ «上午» أو «下午». مرّر `dayPeriod: 'short'` للحصول على فترات اليوم الطبيعية مثل ما قبل الفجر «凌晨» والصباح «早上» والظهر «中午» والمساء «晚上»:

```js
import { time } from 'native-dates';

const night = time('20:30').locale('zh-CN');

night.format('short'); // '20:30'
night.format('Ah:mm'); // '下午8:30'
night.format({
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  dayPeriod: 'short',
}); // '晚上8:30'
```

## أنماط التنسيق وتحليل المدخلات

تعامل أنماط الرموز الأحرف اللاتينية وحدها بوصفها رموزًا، لذا لا تحتاج مقاطع «年» و«月» و«日» وعلامات الترقيم الصينية إلى أقواس مربعة. يكتب `'MMMM'` أسماء الأشهر بمقاطع هان مثل «十一月»، بينما يطبع `'dd'` اختصارًا مضغوطًا لليوم:

```js
import { datetime } from 'native-dates';

const slot = datetime('2026-11-06T14:05:00+08:00', 'Asia/Shanghai').locale('zh-CN');

slot.format('YYYY年M月D日 ddd HH:mm'); // '2026年11月6日 周五 14:05'
slot.format('MMMDo / MMMMDo'); // '11月6日 / 十一月6日'
slot.format('dd / ddd / dddd'); // '五 / 周五 / 星期五'
slot.format('ddd', 'zh-TW'); // '週五'
```

تحلّل الدوال المصنعية في النواة تواريخ هان بترتيب السنة أولًا والتواريخ المفصولة بشرطات مائلة أو نقاط مباشرة، فتعيد قراءة القالب الطويل دون أي إضافات. أما لتواريخ هونغ كونغ المفصولة بشرطات مائلة بترتيب اليوم أولًا، أو الأرقام كاملة العرض، أو أوقات فترات اليوم، أو اختصار CST داخل السلسلة النصية، فحمّل [الإضافة المرنة](/plugins/loose/):

```js
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { date, datetime, monthDay, time, yearMonth } from 'native-dates';

date('2026年11月16日').toString(); // '2026-11-16'
yearMonth('2026年11月').toString(); // '2026-11'
date('16/11/2026', { loose: true, locale: 'zh-HK' })?.toString(); // '2026-11-16'
date('２０２６年１１月１６日', { loose: true })?.toString(); // '2026-11-16'
time('下午5:05', { loose: true, locale: 'zh-TW' })?.toString(); // '17:05:00'
time('晚上9:10', { loose: true, locale: 'zh-CN' })?.toString(); // '21:10:00'
time('凌晨12:00', { loose: true, locale: 'zh-TW' })?.toString(); // '00:00:00'
monthDay('11月16日', { loose: true })?.toString(); // '11-16'
datetime('2026年11月16日 14:30 CST', {
  loose: true,
  locale: 'zh-CN',
  zone: 'UTC',
})?.toString(); // '2026-11-16T06:30:00.000Z'
```

يقرأ الوضع المرن كلًا من «上午» و«下午» وكلمات فترات اليوم مثل «凌晨» و«中午» و«晚上» في `'zh-CN'` و`'zh-TW'`.

## التقويم القمري الصيني وتقويم مينغو

مرّر `'zh-CN-u-ca-chinese'` عند تنسيق تاريخ أو لحظة زمنية لتطبع القوالب الجاهزة سنوات الدورة الستينية والشهر الأول «正月» والأشهر الكبيسة مثل «闰六月».

تقرأ أنماط الرموز الحقول الميلادية دائمًا. وترجع التواريخ الجزئية افتراضيًا إلى التقويم الميلادي لعدم احتوائها على يوم، بينما يتوافق وسم تقويم مينغو التايواني `'zh-TW-u-ca-roc'` مع الأشهر الميلادية:

```js
import { date, yearMonth } from 'native-dates';

date('2026-02-17').format('long', 'zh-CN-u-ca-chinese'); // '2026丙午年正月初一'
date('2025-07-25').format('medium', 'zh-CN-u-ca-chinese'); // '2025年闰六月初一'
date('2026-02-17').format('YYYY-MM-DD', 'zh-CN-u-ca-chinese'); // '2026-02-17'
yearMonth('2026-02').format('long', 'zh-CN-u-ca-chinese'); // '2026年2月'
yearMonth('2026-11').format('long', 'zh-TW-u-ca-roc'); // '民國115年11月'
```

## الوقت النسبي

تعدّ [`CalendarDate`](/api/calendar-date/) الأيام التقويمية، فتُرجع «前天» ليومين مضيا و«后天» ليومين قادمين. أما [`DateTime`](/api/date-time/) فتعدّ الثواني المنقضية حتى لا تُقرأ 23 ساعة مضت على أنها أمس:

```js
import { date, datetime, today } from 'native-dates';

const base = date('2026-11-16');
date('2026-11-14').from(base, 'zh-CN'); // '前天'
date('2026-11-18').from(base, 'zh-CN'); // '后天'

const anchor = datetime('2026-11-16T12:00:00+08:00', 'Asia/Shanghai');
anchor.minus(2, 'days').from(anchor, 'zh-CN'); // '2天前'
date('2026-11-18').from(today('Asia/Shanghai'), 'zh-CN');
```

على الخوادم المضبوطة على UTC، تقع [`fromNow()`](/api/calendar-date/#fromnow) دون معاملات بين منتصف الليل و<bdi>8:00</bdi> صباحًا بتوقيت بكين في يوم UTC السابق، لذا مرّر [`today('Asia/Shanghai')`](/api/date-fn/#today) صراحةً.
