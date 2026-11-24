---
source: f8fde894143d
title: العربية
lede: اضبط التواريخ العربية عبر الوسوم الإقليمية والتقويم الهجري والأرقام المشرقية أو الغربية.
---

مرّر وسم دولة مثل `'ar-EG'` أو `'ar-SA'` بدل الوسم العام `'ar'` (انظر [التوطين](/guides/localization/)). تختلف الأرقام وأسماء الأشهر الميلادية وبداية الأسبوع ونظام الساعة بين الإعدادات المحلية العربية.

## الأرقام المشرقية والغربية

يُخرج الوسم العام `'ar'` ووسوم الإمارات ودول المغرب العربي الأرقام الغربية (من 0 إلى 9)، بينما تُخرج وسوم مصر والسعودية والشام والعراق الأرقام المشرقية.

ألحق الامتداد `-u-nu-latn` أو `-u-nu-arab` بوسم الإعداد المحلي لتوحيد نظام الأرقام لدى جميع المستخدمين:

```js
import { date } from 'native-dates';

const invoice = date('2026-11-16');

invoice.format('long', 'ar-EG'); // '١٦ نوفمبر ٢٠٢٦'
invoice.format('long', 'ar-AE'); // '16 نوفمبر 2026'
invoice.format('long', 'ar-EG-u-nu-latn'); // '16 نوفمبر 2026'
invoice.format('long', 'ar-MA-u-nu-arab'); // '١٦ نونبر ٢٠٢٦'
```

تُخرج أنماط الرموز أرقام ASCII دائمًا مع توطين أسماء الأشهر والأيام، بينما تُدرج القوالب الرقمية الجاهزة محرف الاتجاه الخفي `\u200F` قبل الشرطات المائلة. اعتمد `'YYYY-MM-DD'` في الاختبارات وملفات CSV والروابط لتجنّب هذه المحارف الخفية:

```js
invoice.format('YYYY-MM-DD', 'ar-EG'); // '2026-11-16'
invoice.format('dddd، D MMMM YYYY', 'ar-SA'); // 'الاثنين، 16 نوفمبر 2026'
invoice.format('short', 'ar-EG'); // '١٦\u200F/١١\u200F/٢٠٢٦'
```

## التواريخ الهجرية والأشهر الإقليمية

تعتمد المحركات الحديثة التقويم الميلادي افتراضيًا حتى مع `'ar-SA'`. ألحق `'-u-ca-islamic-umalqura'` بوسم الإعداد المحلي عند التنسيق بقالب جاهز لإخراج التاريخ الهجري وفق تقويم أم القرى، مثل 1 شوال 1447 هـ:

```js
import { date } from 'native-dates';

const eid = date('2026-03-20');

eid.format('long', 'ar-SA'); // '٢٠ مارس ٢٠٢٦'
eid.format('long', 'ar-SA-u-ca-islamic-umalqura'); // '١ شوال ١٤٤٧ هـ'
eid.format('D MMMM YYYY', 'ar-SA-u-ca-islamic-umalqura'); // '20 مارس 2026'
```

تبقى أنماط الرموز والتواريخ الجزئية (`YearMonth` و`MonthDay`) على التقويم الميلادي لأن الشهر الشمسي يمتد عبر شهرين هجريين. ثبّت يومًا محددًا عبر [`on()`](/api/year-month/#on) أولًا:

```js
import { yearMonth } from 'native-dates';

const march = yearMonth('2026-03');

march.format('long', 'ar-SA-u-ca-islamic-umalqura'); // 'مارس ٢٠٢٦'
march.on(1).format('long', 'ar-SA-u-ca-islamic-umalqura'); // '١٢ رمضان ١٤٤٧ هـ'
march.on(20).format('long', 'ar-SA-u-ca-islamic-umalqura'); // '١ شوال ١٤٤٧ هـ'
```

تتوزع مخرجات `Intl` لأسماء الأشهر الميلادية ونظام الساعة على أربع عائلات إقليمية:

| الإقليم | أمثلة للوسوم | السلوك في المخرجات |
|---|---|---|
| مصر والخليج والسودان | `ar-EG, ar-SA` | أشهر شائعة (يناير، يوليو، نوفمبر) مع نظام 12 ساعة ولاحقتَي ص وم. |
| المشرق والعراق | `ar-LB, ar-IQ` | أشهر مشرقية (كانون الثاني، تموز، تشرين الثاني) مع نظام 12 ساعة. |
| المغرب | `ar-MA` | صيغ مغربية (ماي، يوليوز، غشت، شتنبر، نونبر، دجنبر) مع نظام 24 ساعة. |
| الجزائر وتونس | `ar-DZ, ar-TN` | صيغ مغاربية (جانفي، فيفري، جوان، جويلية، أوت) مع نظام 12 ساعة. |

```js
import { datetime } from 'native-dates';

const july = datetime('2026-07-16T14:30', 'UTC');

july.format('long', 'ar-EG'); // '١٦ يوليو ٢٠٢٦ في ٢:٣٠ م'
july.format('long', 'ar-LB'); // '١٦ تموز ٢٠٢٦ في ٢:٣٠ م'
july.format('long', 'ar-MA'); // '16 يوليوز 2026 في 14:30'
july.format('long', 'ar-DZ'); // '16 جويلية 2026 في 2:30 م'
```

## بداية الأسبوع وعطلة نهاية الأسبوع

يتغيّر أول أيام الأسبوع تلقائيًا حسب وسم الدولة: السبت في مصر والأردن وقطر والجزائر، والأحد في السعودية واليمن، والاثنين في الإمارات والمغرب وتونس ولبنان.

تتبع `weekStart` وحدود الأسبوع وترويسات أيام الأسبوع كل وسم تلقائيًا، ويمكنك تمرير `'monday'` صراحةً عند تجميع تقارير عابرة للدول:

```js
import { date, weekdayNames } from 'native-dates';

const wed = date('2026-11-18');

wed.locale('ar-EG').startOf('week').toString(); // '2026-11-14'
wed.locale('ar-SA').startOf('week').toString(); // '2026-11-15'
wed.locale('ar-AE').startOf('week').toString(); // '2026-11-16'
weekdayNames('narrow', undefined, 'ar-EG')[0]; // 'س'
```

تتبع [`isWeekend()`](/api/calendar-date/#calendar-predicates) و[`isWeekday()`](/api/calendar-date/#calendar-predicates) الإعداد المحلي النشط أيضًا. ففي أسواق عطلة الجمعة والسبت مثل السعودية ومصر، تُرجع `isWeekend()` القيمة `true` ليوم الجمعة، وتُرجع `isWeekday()` القيمة `true` ليوم الأحد:

```js
const fri = date('2026-11-20').locale('ar-SA');
const sun = date('2026-11-22').locale('ar-SA');

fri.isWeekend(); // true
sun.isWeekend(); // false
sun.isWeekday(); // true
```

## صيغ الجمع الست واتجاه النص

تتعامل [`Duration`](/api/duration/) و[`from()`](/api/date-time/#from) مع صيغ الجمع العربية الست عبر `Intl` تلقائيًا (الصفر، والمفرد، والمثنى، و3 إلى 10، و11 إلى 99، والمئات). وتُخرج التواريخ التقويمية عبارات مثل «بعد الغد» بدل العدّ الرقمي الذي تستخدمه `DateTime`:

```js
import { datetime, days } from 'native-dates';

days(1).format('long', 'ar-EG'); // 'يوم'
days(2).format('long', 'ar-EG'); // 'يومان'
days(5).format('long', 'ar-EG'); // '٥ أيام'
days(15).format('long', 'ar-EG'); // '١٥ يومًا'
days(100).format('long', 'ar-EG'); // '١٠٠ يوم'

const anchor = datetime('2026-11-16T09:00', 'Asia/Riyadh');
anchor.plus(2, 'days').from(anchor, 'ar-SA'); // 'خلال يومين'
anchor.date.plus(2, 'days').from(anchor.date, 'ar-SA'); // 'بعد الغد'
```

قد تعيد المتصفحات ترتيب الإشارات في تواريخ ISO أو إزاحات UTC داخل الفقرات العربية، لذا اعزل الطوابع الزمنية التقنية داخل `<bdi>`:

```html
<p dir="rtl">
  موعد الصيانة: ١٠–١٦ نوفمبر ٢٠٢٦ عند الساعة <bdi>09:00 +03:00</bdi>
</p>
```

## تحليل المدخلات والمناطق الزمنية

مع [الإضافة المرنة](/plugins/loose/)، تقرأ الإعدادات المحلية العربية التواريخ المفصولة بشرطات مائلة بترتيب اليوم أولًا، والأرقام المشرقية مع محارف الاتجاه، وأوقات «ص» و«م»، وأسماء الأشهر الميلادية القياسية والمشرقية متعددة الكلمات تلقائيًا:

```js
import '@native-dates/plugins/loose';
import { date, time, yearMonth } from 'native-dates';

date('06/11/2026', { loose: true, locale: 'ar-EG' })?.toString(); // '2026-11-06'
date('١٦‏/١١‏/٢٠٢٦', { loose: true, locale: 'ar-EG' })?.toString(); // '2026-11-16'
date('16 تشرين الثاني 2026', { loose: true, locale: 'ar-LB' })?.toString(); // '2026-11-16'
time('٢:٣٠ م', { loose: true, locale: 'ar-EG' })?.toString(); // '14:30:00'
yearMonth('تشرين الثاني 2026', { loose: true, locale: 'ar-LB' })?.toString(); // '2026-11'
```

تحلّ [إضافة المناطق الزمنية](/plugins/zones/) أسماء المدن الكبرى في الخليج وشمال أفريقيا بالإنجليزية (مثل `'Makkah'` و`'Doha'`) إلى جانب الاختصارات الإقليمية مثل `'GST'` مباشرة. ومع الإعداد المحلي `'ar-SA'`، يُحلّ الاختصار `'AST'` إلى الرياض:

```js
import '@native-dates/plugins/zones';
import { date, datetime } from 'native-dates';

datetime('2026-11-16T09:00', 'Makkah').zone; // 'Asia/Riyadh'
datetime('2026-11-16T09:00', 'Doha').zone; // 'Asia/Qatar'
datetime('2026-11-16T09:00', { zone: 'AST', locale: 'ar-SA' }).zone; // 'Asia/Riyadh'
```

جدوِل المواعيد بمعرّفات IANA الكاملة بدل الإزاحات الثابتة؛ إذ تعود `'Africa/Casablanca'` إلى <bdi>UTC+0</bdi> خلال شهر رمضان، وتقفز `'Africa/Cairo'` عند بدء التوقيت الصيفي في منتصف الليل مباشرة من <bdi>00:00</bdi> إلى <bdi>01:00</bdi> فيصبح ذلك اليوم 23 ساعة:

```js
datetime('2026-02-14T12:00', 'Africa/Casablanca').offset; // '+01:00'
datetime('2026-03-01T12:00', 'Africa/Casablanca').offset; // '+00:00'
datetime('2026-03-25T12:00', 'Africa/Casablanca').offset; // '+01:00'

const cairoSpring = date('2026-04-24').at('00:00', 'Africa/Cairo');
cairoSpring.hour; // 1
cairoSpring.hoursInDay; // 23
```
