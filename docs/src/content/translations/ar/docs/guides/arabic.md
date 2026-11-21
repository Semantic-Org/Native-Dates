---
source: '05f88ed299ac'
reviewed: false
title: التواريخ والأوقات بالعربية
lede: تعامل مع الأرقام المشرقية والغربية وأسماء الأشهر الإقليمية وتقويم أم القرى الهجري وصيغ الجمع الست وتغييرات التوقيت الرمضاني عبر الأقاليم العربية.
---

بعد ضبط الإعداد المحلي وفق دليل [التدويل](/guides/internationalization/)، تواجه التطبيقات العربية نظامي أرقام وأربع مجموعات أشهر إقليمية والتقويم الهجري وست صيغ للجمع.

## الأرقام المشرقية والغربية

تُخرج الإمارات ودول المغرب العربي والوسم العام `'ar'` الأرقام الغربية، بينما تُخرج مصر والسعودية والشام والعراق الأرقام العربية المشرقية.

أضف الامتداد `-u-nu-latn` أو `-u-nu-arab` لتوحيد شكل الأرقام لدى جميع المستخدمين:

```js
import { date } from 'native-dates';

const invoice = date('2026-11-16');
invoice.format('long', 'ar-EG'); // '١٦ نوفمبر ٢٠٢٦'
invoice.format('long', 'ar-AE'); // '16 نوفمبر 2026'
invoice.format('long', 'ar-EG-u-nu-latn'); // '16 نوفمبر 2026'
invoice.format('long', 'ar-MA-u-nu-arab'); // '١٦ نونبر ٢٠٢٦'
```

تُخرج قوالب الرموز أرقام ASCII دائمًا مع تعريب الكلمات، بينما تُدرج القوالب الرقمية محرف `\u200F` الخفي قبل الشرطات. اعتمد `'YYYY-MM-DD'` في الاختبارات وملفات CSV والروابط:

```js
invoice.format('YYYY-MM-DD', 'ar-EG'); // '2026-11-16'
invoice.format('dddd، D MMMM YYYY', 'ar-SA'); // 'الاثنين، 16 نوفمبر 2026'
invoice.format('short', 'ar-EG'); // '١٦\u200F/١١\u200F/٢٠٢٦'
```

## التواريخ الهجرية والأشهر الإقليمية

تعتمد المحركات الحديثة التقويم الميلادي افتراضيًا للوسم `'ar-SA'`. مرّر `-u-ca-islamic-umalqura` مع قالب جاهز لتنسيق التاريخ الهجري وفق تقويم أم القرى:

```js
import { date } from 'native-dates';

const eid = date('2026-03-20');
eid.format('long', 'ar-SA'); // '٢٠ مارس ٢٠٢٦'
eid.format('long', 'ar-SA-u-ca-islamic-umalqura'); // '١ شوال ١٤٤٧ هـ'
eid.format('D MMMM YYYY', 'ar-SA-u-ca-islamic-umalqura'); // '20 مارس 2026'
```

تبقى قوالب الرموز والتواريخ الجزئية ميلادية لأن الشهر الشمسي يمتد عبر شهرين هجريين، لذا ثبّت يومًا محددًا عبر `on()` أولًا:

```js
import { yearMonth } from 'native-dates';

const march = yearMonth('2026-03');
march.format('long', 'ar-SA-u-ca-islamic-umalqura'); // 'مارس ٢٠٢٦'
march.on(1).format('long', 'ar-SA-u-ca-islamic-umalqura'); // '١٢ رمضان ١٤٤٧ هـ'
march.on(20).format('long', 'ar-SA-u-ca-islamic-umalqura'); // '١ شوال ١٤٤٧ هـ'
```

تنقسم أسماء الأشهر الميلادية ونظام الساعة إلى أربع عائلات إقليمية، لذا مرّر رمز الدولة بدل الوسم العام `'ar'`:

| الإقليم | أمثلة للوسوم | السلوك في المخرجات |
|---|---|---|
| مصر والخليج والسودان | `'ar-EG'`, `'ar-SA'`, `'ar-AE'` | أشهر شائعة مثل يناير ويوليو ونوفمبر مع نظام ١٢ ساعة ولاحقتي ص وم. |
| المشرق والعراق | `'ar-LB'`, `'ar-JO'`, `'ar-IQ'`, `'ar-SY'` | أشهر سريانية مثل كانون الثاني وتموز وتشرين الثاني مع نظام ١٢ ساعة. |
| المغرب | `'ar-MA'` | صيغ مغربية مثل ماي ويوليوز وغشت وشتنبر ونونبر ودجنبر مع نظام ٢٤ ساعة. |
| الجزائر وتونس | `'ar-DZ'`, `'ar-TN'` | صيغ مغاربية مثل جانفي وفيفري وجوان وجويلية وأوت مع نظام ١٢ ساعة. |

```js
import { datetime } from 'native-dates';

const july = datetime('2026-07-16T14:30', 'UTC');
july.format('long', 'ar-EG'); // '١٦ يوليو ٢٠٢٦ في ٢:٣٠ م'
july.format('long', 'ar-LB'); // '١٦ تموز ٢٠٢٦ في ٢:٣٠ م'
july.format('long', 'ar-MA'); // '16 يوليوز 2026 في 14:30'
july.format('long', 'ar-DZ'); // '16 جويلية 2026 في 2:30 م'
```

## بداية الأسبوع وعطلة نهاية الأسبوع

يبدأ الأسبوع يوم السبت في مصر والأردن وقطر والجزائر، ويوم الأحد في السعودية واليمن، ويوم الاثنين في الإمارات والمغرب وتونس ولبنان.

تتبع `weekStart` وحدود الأسبوع وأسماء الأيام كل وسم تلقائيًا، بينما يُفضّل تمرير `startOf('week', 'monday')` صراحة في التجميعات العابرة للدول:

```js
import { date, weekdayNames } from 'native-dates';

const wed = date('2026-11-18');
wed.locale('ar-EG').startOf('week').toString(); // '2026-11-14' — السبت
wed.locale('ar-SA').startOf('week').toString(); // '2026-11-15' — الأحد
wed.locale('ar-AE').startOf('week').toString(); // '2026-11-16' — الاثنين
weekdayNames('narrow', undefined, 'ar-EG')[0]; // 'س'
```

:::warning[عطلة الجمعة والسبت]
تفحص `isWeekend()` يومي السبت والأحد وفق معيار ISO دائمًا بصرف النظر عن الإعداد المحلي. في أسواق عطلة الجمعة والسبت مثل السعودية ومصر وقطر والأردن، افحص `dayOfWeek` مباشرة لأن الأحد يوم عمل.
:::

```js
const fri = date('2026-11-20').locale('ar-SA');
const sun = date('2026-11-22').locale('ar-SA');
fri.isWeekend(); // false
sun.isWeekend(); // true

const isLocalWeekend = (d) => d.dayOfWeek === 5 || d.dayOfWeek === 6;
isLocalWeekend(fri); // true
isLocalWeekend(sun); // false
```

## صيغ الجمع الست واتجاه النص

تصرف العربية ست فئات للجمع تشمل الصفر والمفرد والمثنى مثل `'يومان'` وجمع القلة والأعداد المركبة والمئات في المدد ودالة `from()`:

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

قد تعكس المتصفحات موضع الإشارات في تواريخ ISO أو إزاحات UTC داخل الفقرات العربية، لذا اعزل السلاسل التقنية داخل `<bdi>`:

```html
<p dir="rtl">
  موعد الصيانة: ١٠–١٦ نوفمبر ٢٠٢٦ عند الساعة <bdi>09:00 +03:00</bdi>
</p>
```

## تحليل المدخلات والمناطق الزمنية

يرفض المحللان الأرقام المشرقية، فحوّلها إلى ASCII أولًا ومرّر `dayFirst: true` للشرطات. تتطلب التواريخ الكاملة المرنة أشهرًا إنجليزية، بينما تطابق `yearMonth()` الأشهر العربية المفردة:

```js
import '@native-dates/plugins/loose';
import { date, yearMonth } from 'native-dates';

const toAscii = (s) =>
  s.replace(/[٠-٩۰-۹]/g, (d) => d.codePointAt(0) - (d <= '٩' ? 0x0660 : 0x06f0));
date('٢٠٢٦-١١-١٦', { loose: true }); // null
date(toAscii('٢٠٢٦-١١-١٦')).toString(); // '2026-11-16'
date('06/11/2026', { loose: true, dayFirst: true }).toString(); // '2026-11-06'
yearMonth('نوفمبر 2026', { loose: true, locale: 'ar-EG' }).toString(); // '2026-11'
yearMonth('تشرين الثاني 2026', { loose: true, locale: 'ar-LB' }); // null
```

تحل [إضافة المناطق الزمنية](/plugins/zones/) الرياض والقاهرة ودبي وقطر والدار البيضاء مباشرة، بينما تُعرَّف مكة وجدة وأبوظبي والدوحة والمنامة والرباط عبر `zoneAliases`:

```js
import '@native-dates/plugins/zones';
import { configure, date, datetime } from 'native-dates';

configure({
  zoneAliases: {
    makkah: 'Asia/Riyadh',
    doha: 'Asia/Qatar',
    'abu dhabi': 'Asia/Dubai',
    rabat: 'Africa/Casablanca',
  },
});
datetime('2026-11-16T09:00', 'Doha').zone; // 'Asia/Qatar'
```

جدوِل المواعيد بمعرّف IANA كامل بدل الإزاحة الثابتة، إذ تؤخر `'Africa/Casablanca'` الساعة في رمضان وتقدّم القاهرة ساعتها منتصف الليل إلى 01:00:

```js
datetime('2026-02-14T12:00', 'Africa/Casablanca').offset; // '+01:00'
datetime('2026-03-01T12:00', 'Africa/Casablanca').offset; // '+00:00' — رمضان
datetime('2026-03-25T12:00', 'Africa/Casablanca').offset; // '+01:00'

const cairoSpring = date('2026-04-24').at('00:00', 'Africa/Cairo');
cairoSpring.hour; // 1
cairoSpring.hoursInDay; // 23
```
