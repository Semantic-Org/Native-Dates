---
source: 7c459605683f
title: الإسبانية
lede: تعامل مع تنسيقات التواريخ الإسبانية الإقليمية وأعراف الساعة في إسبانيا والأمريكتين.
---

يعتمد الوسم العام `'es'` بداية الأسبوع يوم الاثنين ونظام 24 ساعة كما في إسبانيا. أما التطبيقات الموجّهة لأمريكا اللاتينية أو الولايات المتحدة فينبغي أن تمرّر وسمًا إقليميًا مثل `'es-MX'` (انظر [التوطين](/guides/localization/)).

## إسبانيا وأمريكا اللاتينية والولايات المتحدة

تستخدم إسبانيا نظام 24 ساعة، بينما تستخدم أمريكا اللاتينية والإسبانية الأمريكية نظام 12 ساعة مع اختلاف المسافات في لاحقتَي صباحًا ومساءً وفواصل التاريخ وصيغة «setiembre» البيروفية:

```js
import { datetime } from 'native-dates';

const cita = datetime('2026-09-16T17:30:00', 'UTC');

cita.format('medium', 'es-ES'); // '16 sept 2026, 17:30'
cita.format('medium', 'es-MX'); // '16 sep 2026, 5:30 p.m.'
cita.format('medium', 'es-AR'); // '16 sept 2026, 5:30 p. m.'
cita.format('medium', 'es-CO'); // '16/09/2026, 5:30 p. m.'
cita.format('long', 'es-PE'); // '16 de setiembre de 2026 a las 5:30 p. m.'
cita.date.format('short', 'es-PR'); // '09/16/26'
```

ينقسم أول أيام الأسبوع أيضًا عبر العالم الناطق بالإسبانية. يبدأ الوسم العام `'es-419'` يوم الاثنين، خلافًا للمكسيك وكولومبيا:

| الوسوم | البداية والساعة | الأعراف الإقليمية |
|---|---|---|
| `'es'`، `'es-ES'` | `1`، `17:30` | بداية الأسبوع يوم الاثنين، ونظام 24 ساعة، واختصار سبتمبر بصيغة «sept». |
| `'es-MX'`، `'es-US'` | `7`، `5:30 p.m.` | بداية الأسبوع يوم الأحد ولاحقة نظام 12 ساعة دون مسافة داخلية. |
| `'es-AR'`، `'es-CL'` | `1`، `5:30 p. m.` | بداية الأسبوع يوم الاثنين ولاحقة بمسافة داخلية، مع شرطات في التواريخ المختصرة في تشيلي. |
| `'es-CO'`، `'es-PE'` | `7`، `5:30 p. m.` | بداية الأسبوع يوم الأحد، وتواريخ متوسطة رقمية في كولومبيا، وصيغة «setiembre» في بيرو. |
| `'es-PR'` | `7`، `5:30 p. m.` | بداية الأسبوع يوم الأحد وترتيب رقمي أمريكي (شهر/يوم/سنة). |

ثبّت يوم الاثنين عبر [`startOf('week', 'monday')`](/api/calendar-date/#startof) عند تجميع تقارير قواعد البيانات الأسبوعية لتقع مدريد ومكسيكو سيتي في المجموعة الأسبوعية نفسها:

```js
import { date } from 'native-dates';

const wed = date('2026-11-18');

wed.locale('es-ES').startOf('week').toString(); // '2026-11-16'
wed.locale('es-MX').startOf('week').toString(); // '2026-11-15'
wed.locale('es-MX').startOf('week', 'monday').toString(); // '2026-11-16'
```

## حروف الجر والأحرف الصغيرة وأيام الأسبوع

تربط التواريخ الإسبانية الطويلة أجزاءها بكلمات «de» و«del» و«a las». ضع الروابط الحرفية بين أقواس مربعة داخل أنماط الرموز حتى لا ترمي الأحرف المجردة الخطأ [`unknownFormat`](/api/errors/#units-zones-and-formats):

```js
import { datetime } from 'native-dates';

const ev = datetime('2026-11-16T18:30:00', 'Europe/Madrid').locale('es-ES');

ev.format('D [de] MMMM [de] YYYY'); // '16 de noviembre de 2026'
ev.format('dddd, D [de] MMMM [a las] HH:mm');
// 'lunes, 16 de noviembre a las 18:30'
```

تبقى أسماء الأشهر وأيام الأسبوع ولواحق صباحًا ومساءً بأحرف صغيرة في الإسبانية. كبّر الحرف الأول فقط عندما يفتتح التاريخ المنسّق عنوانًا.

يتكرر الحرف «M» في الاختصارات المضغوطة من حرف واحد بين «martes» و«miércoles». يتفادى الرمز `'dd'` المكوّن من حرفين هذا التضارب تلقائيًا، ويتيح لك [`configure()`](/api/configure/) تخصيص يوم الأربعاء أو صيغة «1.º» لليوم الأول من الشهر:

```js
import { configure, date, weekdayNames } from 'native-dates';

const s = date('2026-05-01').format('full', 'es'); // 'viernes, 1 de mayo de 2026'
s[0].toUpperCase() + s.slice(1); // 'Viernes, 1 de mayo de 2026'
weekdayNames('narrow', 1, 'es-MX'); // ['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do']

configure({
  weekdayNames: { es: { narrow: { tue: 'M', wed: 'X' } } },
  ordinals: { es: (day) => (day === 1 ? '1.º' : day) },
});
date('2026-05-06').format('dd', 'es-MX'); // 'X'
date('2026-05-01').format('Do [de] MMMM', 'es-AR'); // '1.º de mayo'
```

## تحليل التواريخ والأشهر الإسبانية

مع [الإضافة المرنة](/plugins/loose/)، تتبع التواريخ الرقمية الإعداد المحلي النشط تلقائيًا؛ فتقرأ إسبانيا وتشيلي بترتيب اليوم أولًا، بينما تقرأ بورتوريكو بترتيب الشهر أولًا:

```js
import '@native-dates/plugins/loose';
import { date, datetime, dayMonth, monthDay, time, yearMonth } from 'native-dates';

date('06/11/2026', { loose: true, locale: 'es' })?.toString(); // '2026-11-06'
date('16-09-2026', { loose: true, locale: 'es-CL' })?.toString(); // '2026-09-16'
date('06/11/2026', { loose: true, locale: 'es-PR' })?.toString(); // '2026-06-11'
```

تُحلّل أيضًا التواريخ الكاملة المكتوبة بالكلمات وكلمات الربط وأيام الأسبوع البادئة وصيغة «setiembre» البيروفية وأوقات نظام 12 ساعة ذات المسافات في الوضع المرن، بينما تعمل [`dayMonth()`](/api/month-day-fn/#daymonth) الرقمية في النواة دون إضافات:

```js
date('16 de noviembre de 2026', { loose: true, locale: 'es' })?.toString(); // '2026-11-16'
date('mar, 16 jun 2026', { loose: true, locale: 'es' })?.toString(); // '2026-06-16'
datetime('el 16 de noviembre de 2026 a las 14:30', {
  loose: true,
  locale: 'es',
  zone: 'Europe/Madrid',
})?.hour; // 14
time('5:30 p. m.', { loose: true, locale: 'es-MX' })?.toString(); // '17:30:00'
dayMonth('16/11').toString(); // '11-16'
monthDay('16 set.', { loose: true, locale: 'es-PE' })?.toString(); // '09-16'
yearMonth('enero de 2026', { loose: true, locale: 'es' })?.toString(); // '2026-01'
```

## المناطق الزمنية وقفزات التوقيت الصيفي عند منتصف الليل

يبقى معظم المكسيك على <bdi>UTC-6</bdi> طوال العام باستثناء المدن الحدودية الشمالية وولاية كينتانا رو. ويتبع الاختصار `'CST'` الإعداد المحلي النشط، فيُحلّ إلى شيكاغو افتراضيًا وإلى هافانا في كوبا:

```js
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-07-15T12:00', 'Mexico City').format('HH:mm Z'); // '12:00 -06:00'
datetime('2026-07-15T12:00', 'CST').format('HH:mm Z'); // '12:00 -05:00'
datetime('2026-07-15T12:00', { zone: 'CST', locale: 'es-CU' }).zone; // 'America/Havana'
datetime('2026-07-15T12:00', 'Tijuana').format('HH:mm Z'); // '12:00 -07:00'
```

تحلّ [إضافة المناطق الزمنية](/plugins/zones/) أسماء المدن الكبرى في العالم الناطق بالإسبانية (مثل `'Mexico City'` بالإنجليزية و`'Tijuana'` والاختصار `'CDMX'`) واختصارات أمريكا اللاتينية مثل `'COT'` تلقائيًا. وتُحلّ `'San Juan'` إلى بورتوريكو مع `'es-PR'` وإلى الأرجنتين في غير ذلك:

```js
datetime('2026-07-15T12:00', 'CDMX').zone; // 'America/Mexico_City'
datetime('2026-07-15T12:00', 'COT').zone; // 'America/Bogota'
datetime('2026-07-15T12:00', 'San Juan').zone; // 'America/Argentina/San_Juan'
datetime('2026-07-15T12:00', { zone: 'San Juan', locale: 'es-PR' }).zone; // 'America/Puerto_Rico'
```

تبدأ تشيلي وكوبا التوقيت الصيفي عند منتصف الليل، فتقفز الساعة مباشرة من <bdi>00:00</bdi> إلى <bdi>01:00</bdi>. ويستقرّ استدعاء [`at('00:00', zone)`](/api/calendar-date/#at) أو `startOf('day')` بسلاسة عند <bdi>01:00</bdi> في اليوم نفسه:

```js
import { date } from 'native-dates';

const spring = date('2026-09-06').at('00:00', 'America/Santiago');

spring.format('YYYY-MM-DD HH:mm Z'); // '2026-09-06 01:00 -03:00'
spring.hoursInDay; // 23
```

## الوقت النسبي

تخصّ الإسبانية خمسة أيام متتالية بتعبيرات أيام نسبية تبدأ من «anteayer» ليومين مضيا حتى «pasado mañana» ليومين قادمين. تُرجع [`CalendarDate`](/api/calendar-date/) تعبيرات الأيام النسبية هذه، بينما تعدّ [`DateTime`](/api/date-time/) الساعات المنقضية:

```js
import { date, datetime, today } from 'native-dates';

const ref = date('2026-11-16');

ref.minus(2, 'days').from(ref, 'es'); // 'anteayer'
ref.plus(2, 'days').from(ref, 'es'); // 'pasado mañana'
datetime('2026-11-14T12:00Z').from('2026-11-16T12:00Z', 'es'); // 'hace 2 días'
date('2026-11-18').from(today('America/Bogota'), 'es-CO');
```

على الخوادم المشتركة، مرّر [`today(zone)`](/api/date-fn/#today) بدلًا من [`fromNow()`](/api/calendar-date/#fromnow) حتى يتبع انتقال منتصف الليل بين «hoy» و«mañana» المنطقة الزمنية المحلية للمستخدم.
