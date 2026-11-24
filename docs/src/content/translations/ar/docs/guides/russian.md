---
source: 621cb0fa9e99
title: الروسية
lede: نسّق إعراب الأشهر وصيغ الجمع بالروسية، وحلّل التواريخ المفصولة بنقاط والمناطق الزمنية الإقليمية.
---

مرّر الوسم `'ru'` لتنسيق التواريخ بالروسية (انظر [التوطين](/guides/localization/)). تتولى بيانات `Intl` المدمجة حالات إعراب الأشهر وصيغ الجمع الثلاثية للمدد دون أي ملفات إعدادات محلية.

## حالات إعراب الأشهر ولاحقة السنة «г.»

تضع القوالب الجاهزة الشهر في حالة الإضافة (المجرور) بجانب رقم اليوم، وتبقيه في حالة الرفع في تواريخ السنة والشهر المنفردة، وتلحق لاحقة السنة «г.»:

```js
import { date, yearMonth } from 'native-dates';

const release = date('2026-11-16').locale('ru');

release.format('long'); // '16 ноября 2026 г.'
release.format('medium'); // '16 нояб. 2026 г.'
yearMonth('2026-11').format('long', 'ru'); // 'ноябрь 2026 г.'
```

تحذف أنماط الرموز المخصّصة لاحقة «г.» للحصول على تسميات واجهة موجزة. وبعد رمز اليوم مباشرة، يتحوّل `MMMM` و`MMM` من حالة الرفع «май» إلى حالة الإضافة «мая»:

```js
const may = date('2026-05-06').locale('ru');

may.format('MMMM YYYY'); // 'май 2026'
may.format('D MMMM YYYY'); // '6 мая 2026'
may.format('D MMM'); // '6 мая'
date('2026-03-08').format('D MMM', 'ru'); // '8 мар.'
```

تحافظ اللواحق الإعرابية الحرفية مثل `-го` بين اليوم والشهر على حالة الإضافة في `MMMM`، سواء وُضعت بين أقواس مربعة أم دونها:

```js
may.format('D-го MMMM'); // '6-го мая'
```

## أيام الأسبوع والأحرف الصغيرة وأرقام الأيام

تكتب الروسية أسماء الأشهر وأيام الأسبوع بأحرف صغيرة، ويبدأ الأسبوع يوم الاثنين بحيث تساوي `weekStart` القيمة `1`.

تتشابه الحروف الأولى المنفردة لأيام الأسبوع في الروسية، لذا يُرجع كلٌّ من النمط المضغوط والنمط المختصر اختصارات من حرفين من «пн» إلى «вс» بدءًا من الاثنين حتى الأحد:

```js
import { date, weekdayNames } from 'native-dates';

weekdayNames('narrow', undefined, 'ru');
// ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']
date('2026-11-16').format('dddd, D MMMM', 'ru'); // 'понедельник, 16 ноября'
```

لا تضع التواريخ الروسية نقطة بعد رقم اليوم، لذا يُخرج `Do` رقمًا عاديًا. يمكنك تخصيص الأعداد الترتيبية أو أيام الأسبوع بأحرف كبيرة في [`configure()`](/api/configure/):

```js
import { configure, date } from 'native-dates';

configure({
  weekdayNames: { ru: { short: { mon: 'Пн', fri: 'Пт' } } },
  ordinals: { ru: (day) => `${day}-е` },
});

date('2026-11-16').format('ddd, Do MMMM', 'ru'); // 'Пн, 16-е ноября'
```

## صيغ جمع المدد والتواريخ النسبية

تستخدم الروسية ثلاث صيغ لعدّ الوحدات: لـ 1 و21، ولـ 2 إلى 4، ولـ 5 إلى 20. يختار تنسيق [`Duration`](/api/duration/) الصيغة المناسبة تلقائيًا:

```js
import { days, duration } from 'native-dates';

days(1).format('long', 'ru'); // '1 день'
days(2).format('long', 'ru'); // '2 дня'
days(5).format('long', 'ru'); // '5 дней'
days(21).format('long', 'ru'); // '21 день'
duration({ days: 2, hours: 5, minutes: 21 }).format('long', 'ru');
// '2 дня 5 часов 21 минута'
```

على [`DateTime`](/api/date-time/)، تعدّ [`from()`](/api/date-time/#from) الساعات والدقائق المنقضية حتى تبقى 22 ساعة قبل منتصف الليل بصيغة عددية.

أما على [`CalendarDate`](/api/calendar-date/)، فتقارن الأيام التقويمية وتُرجع تعبيرات الأيام النسبية الطبيعية بالروسية حتى «позавчера» ليومين مضيا و«послезавтра» ليومين قادمين:

```js
import { date, datetime } from 'native-dates';

const day = date('2026-11-16').locale('ru');
day.minus(2, 'days').from(day); // 'позавчера'
day.minus(1, 'day').from(day); // 'вчера'
day.plus(2, 'days').from(day); // 'послезавтра'

const moment = datetime('2026-11-16T12:00:00Z', 'Europe/Moscow').locale('ru');
moment.minus(1, 'minute').from(moment); // '1 минуту назад'
moment.plus(2, 'days').from(moment); // 'через 2 дня'
```

## تحليل التواريخ المفصولة بنقاط وأسماء الأشهر الروسية

تقبل النواة السلاسل بترتيب السنة أولًا مثل `'2026.11.16'`. ومع [الإضافة المرنة](/plugins/loose/)، تقرأ الإعدادات المحلية الروسية التواريخ المفصولة بنقاط بترتيب اليوم أولًا، وأسماء الأشهر بحالات إعرابها، ولاحقة السنة «г.» تلقائيًا:

```js
import '@native-dates/plugins/loose';
import { date, datetime } from 'native-dates';

date('16.11.2026', { loose: true, locale: 'ru' })?.toString(); // '2026-11-16'
date('06.11.2026', { loose: true, locale: 'ru' })?.toString(); // '2026-11-06'
date('16 ноября 2026 г.', { loose: true, locale: 'ru' })?.toString(); // '2026-11-16'
datetime('16.11.2026, 14:30', {
  zone: 'Europe/Moscow',
  locale: 'ru',
  loose: true,
})?.hour; // 14
```

تقرأ النواة أزواج اليوم والشهر، والشهر والسنة المفصولة بنقاط مباشرة، ويطابق الوضع المرن أسماء الأشهر الروسية في حالتَي الرفع والإضافة في التواريخ الجزئية:

```js
import { dayMonth, monthDay, monthYear, yearMonth } from 'native-dates';

dayMonth('06.11').toString(); // '11-06'
monthYear('11.2026').toString(); // '2026-11'
monthDay('16 ноября', { loose: true, locale: 'ru' })?.toString(); // '11-16'
yearMonth('ноябрь 2026 г.', { loose: true, locale: 'ru' })?.toString(); // '2026-11'
```

## المناطق الزمنية في روسيا والدول المجاورة

تمتد روسيا عبر إحدى عشرة منطقة زمنية دون تغييرات موسمية للساعة، كما وحّدت كازاخستان توقيتها على <bdi>UTC+5</bdi> في عام 2024. وتحفظ معرّفات IANA الكاملة انتقالات الإزاحة التاريخية في كل منطقة.

مع [إضافة المناطق الزمنية](/plugins/zones/)، تُحلّ أسماء مدن IANA بالإنجليزية والمراكز الروسية والكازاخستانية الكبرى واختصارات موسكو مباشرة دون الحاجة إلى تعريف أسماء بديلة:

| المدخل | الحالة الافتراضية | طريقة الحلّ |
|---|---|---|
| `'Europe/Moscow'`، `'Asia/Almaty'` | يعمل في النواة | تعمل معرّفات IANA الكاملة تلقائيًا وتحتفظ بقواعد الإزاحة التاريخية. |
| `'Moscow'`، `'Yekaterinburg'`، `'Minsk'` | يعمل مع الإضافة | تطابق أسماء المدن بالإنجليزية الواردة في معرّفات IANA بأي حالة أحرف مع إضافة المناطق الزمنية. |
| `'MSK'`، `'мск'`، `'SPB'`، `'Kazan'`، `'Astana'` | يعمل مع الإضافة | تُحلّ الاختصارات الإقليمية المضمّنة (مثل `'MSK'` و`'мск'` و`'SPB'`) والتهجئات البديلة وأسماء المدن مثل `'Kazan'` و`'Astana'` والأسماء السيريلية مباشرة. |

```js
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T12:00:00Z', 'MSK').format('HH:mm', 'ru'); // '15:00'
datetime('2026-11-16T12:00:00Z', 'мск').zone; // 'Europe/Moscow'
datetime('2026-11-16T12:00:00Z', 'SPB').zone; // 'Europe/Moscow'
datetime('2026-11-16T12:00:00Z', 'Astana').offset; // '+05:00'
datetime('16 ноября 2026 14:30 мск', {
  loose: true,
  locale: 'ru',
  zone: 'UTC',
})?.toString(); // '2026-11-16T11:30:00.000Z'
```
