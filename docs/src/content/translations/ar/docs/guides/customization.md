---
source: 97915c43145b
title: التخصيص
lede: اضبط الإعدادات الافتراضية على مستوى التطبيق، ووسّع Native Dates بتنسيقات مخصّصة أو إضافات اختيارية.
---

تتبع Native Dates افتراضيًا المنطقة الزمنية المحلية والإعداد المحلي لبيئة التشغيل. استخدم [`configure()`](/api/configure/) والإضافات الاختيارية عندما يحتاج تطبيقك إلى قيم افتراضية ثابتة أو تنسيقات مسمّاة أو ميزات إضافية للتحليل والمناطق الزمنية.

## الإعدادات الافتراضية للتطبيق

استدعِ [`configure()`](/api/configure/) عند بدء التشغيل لضبط المنطقة الزمنية أو الإعداد المحلي أو يوم بداية الأسبوع (بأسماء أيام الأسبوع بالإنجليزية مثل `'monday'`) افتراضيًا على مستوى التطبيق. تحافظ المفاتيح غير الممرّرة على قيمتها الحالية، وتُعيد قيمة `null` الإعداد الافتراضي لبيئة التشغيل:

```js title="main.js"
import { configure, date, now } from 'native-dates';

configure({
  zone: 'America/New_York',
  locale: 'en-US',
  weekStart: 'monday',
});

now().zone; // 'America/New_York'
date('2026-11-18').startOf('week').toString(); // '2026-11-16'
```

ما يزال بإمكان الاستدعاءات الفردية تمرير منطقتها الزمنية أو [`locale()`](/api/date-time/#locale) أو يوم بداية الأسبوع الخاص بها لتجاوز القيمة الافتراضية.

:::warning[اضبط الإعدادات مرة واحدة عند بدء تشغيل الخوادم]
تشترك عملية JavaScript بأكملها في الإعدادات الافتراضية العامة. على الخادم متعدّد المستخدمين، أرفق المنطقة الزمنية والإعداد المحلي لكل طلب بالقيمة مباشرةً بدل تعديل `configure()` مع كل طلب.
:::

## التنسيقات المسمّاة

سجّل تنسيقات مسمّاة ضمن `formats` ومرّر أسماءها إلى [`format()`](/guides/formatting/). يقبل كل مدخل نمط رموز أو كائن خيارات `Intl`:

```js title="main.js"
import { configure, date, datetime } from 'native-dates';

configure({
  formats: {
    invoice: 'YYYY-MM-DD',
    receipt: { weekday: 'long', month: 'long', day: 'numeric' },
  },
});

date('2026-11-06').format('invoice'); // '2026-11-06'
const placed = datetime('2026-11-06T09:05', 'Europe/Berlin');
placed.format('receipt'); // 'Friday, November 6'
```

تعمل التنسيقات المسمّاة مع التواريخ والأوقات والتواريخ الجزئية والنطاقات، بينما تقتصر المدد الزمنية على قوالبها الجاهزة المدمجة فقط. تتقدّم الأسماء المخصّصة على القوالب الجاهزة المدمجة، لذا فإن تسجيل `'short'` يتجاوز القالب القياسي في التطبيق بأكمله.

## تثبيت الإضافات

تتوفر الإضافات الاختيارية للبحث بأسماء المدن، والتحليل بالوضع المرن، وخصائص `Date` التقليدية ضمن [`@native-dates/plugins`](/plugins/):

```bash
npm i @native-dates/plugins
```

استورد كل مسار فرعي مرة واحدة عند بدء التشغيل لتفعيله:

```js title="main.js"
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { date, datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'Berlin').zone; // 'Europe/Berlin'
date('Nov 16, 2026', { loose: true }); // CalendarDate(2026-11-16)
```

يمكن للإضافات أيضًا تسجيل خياراتها الخاصة في [`configure()`](/api/configure/) فور تحميلها. تضيف إضافة `zones` الخيار `zoneAliases` للأسماء البديلة المخصّصة، وتضيف إضافة `loose` الخيار `dayFirst` لتحديد ترتيب اليوم أولًا في التواريخ الرقمية:

```js title="main.js"
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { configure, date, now } from 'native-dates';

configure({
  zoneAliases: { hq: 'Europe/Berlin' },
  dayFirst: true,
});

now('hq').zone; // 'Europe/Berlin'
date('07.09.2026', { loose: true }).toString(); // '2026-09-07'
```

تصفّح [نظرة عامة على الإضافات](/plugins/) لمعرفة حجم حزمة كل مسار فرعي، أو اقرأ [كتابة إضافة](/guides/writing-a-plugin/) لتطوير إضافتك الخاصة.

## تخصيص أسماء أيام الأسبوع والأعداد الترتيبية

تأتي أسماء الأشهر وأيام الأسبوع من بيانات `Intl` في بيئة التشغيل. وعندما يتطلب التصميم اختصارات مخصّصة أو أعدادًا ترتيبية للأيام، تجاوزها بخياري `weekdayNames` (باستخدام مفاتيح أيام الأسبوع بالإنجليزية) و`ordinals`:

```js title="main.js"
import { configure, date } from 'native-dates';

configure({
  weekdayNames: {
    en: { short: { tue: 'Tues', thu: 'Thurs' } },
  },
  ordinals: {
    fr: (day) => (day === 1 ? '1er' : day),
  },
});

date('2026-11-03').format('ddd', 'en-US'); // 'Tues'
date('2026-11-01').format('Do MMMM', 'fr'); // '1er novembre'
```

مرّر `null` لأي من المفتاحين للعودة إلى القيم الافتراضية لبيئة التشغيل والمكتبة. اقرأ تاليًا [التوطين](/guides/localization/) للتعامل مع لغات المستخدمين وحدود الأسابيع وأنظمة التقويم.
