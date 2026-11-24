---
source: e011cab2c85c
title: configure()
lede: قراءة أو تحديث الإعدادات الافتراضية على مستوى العملية للمنطقة الزمنية والإعداد المحلي وبداية الأسبوع والتنسيقات وأسماء الرموز والإضافات.
---

## الإعدادات الافتراضية العامة

:::entry
### `configure()` :kind[function]

```js signature
configure(settings?): ActiveSettings
```

تحدّث واحدًا أو أكثر من الإعدادات الافتراضية على مستوى العملية وتُرجع لقطة للإعدادات النشطة. استدعِها بلا وسائط لقراءة الإعدادات الحالية دون تعديلها.

تحتفظ الخصائص المُغفَلة بقيمها الحالية. مرّر `null` لأي إعداد لاستعادة الإعداد الافتراضي لبيئة التشغيل أو القيمة المضمّنة.

```js title="setup.js"
import { configure, date, datetime } from 'native-dates';

configure({
  zone: 'Europe/Berlin',
  locale: 'de-DE',
});

datetime('2026-11-16T17:30:00Z').zone; // 'Europe/Berlin'
date('2026-11-18').startOf('week').toString(); // '2026-11-16'
configure().weekStart; // undefined

configure({ weekStart: 'sunday' });
date('2026-11-18').startOf('week').toString(); // '2026-11-15'
configure().weekStart; // 7

// إعادة الضبط إلى المنطقة الزمنية والإعداد المحلي لبيئة التشغيل وبداية الأسبوع وفق الإعداد المحلي
configure({ zone: null, locale: null, weekStart: null });
```

**المعاملات**

```params
- name: settings
  type: Settings
  description: الإعدادات الافتراضية على مستوى العملية المطلوب تحديثها؛ وتبقى المفاتيح المُغفَلة دون تغيير.
  options:
    - name: zone
      type: Zone | null
      description: المنطقة الزمنية الافتراضية للدوال المصنعية و`now()`؛ ويعيد تمرير `null` الضبط إلى المنطقة الزمنية المحلية لبيئة التشغيل.
    - name: locale
      type: Locale | null
      description: وسم الإعداد المحلي الافتراضي أو قائمة وسوم أو ترويسة `Accept-Language` للتنسيق وحدود الأسابيع وعطلات نهاية الأسبوع والإضافات؛ ويعيد تمرير `null` أو `''` الضبط إلى الإعداد المحلي لبيئة التشغيل.
    - name: weekStart
      type: DayOfWeek | null
      description: اليوم الأول في الأسبوع لحدود الأسابيع و`weekdayNames()`، باسم يوم من أيام الأسبوع بالإنجليزية أو رقم من 1 ليوم الاثنين حتى 7 ليوم الأحد؛ ويتبع عدم ضبطه أو تمرير `null` الإعداد المحلي النشط.
    - name: weekdayNames
      type: "Record<Locale, { narrow?, short?, long? }> | null"
      description: تسميات مخصّصة لأيام الأسبوع مفهرسة بوسم الإعداد المحلي وعرض التسمية (`narrow` أو `short` أو `long`) واسم اليوم بالإنجليزية؛ وتتراكب الوسوم الإقليمية فوق وسم لغتها الأساسي، بينما تستعيد القيمة الفارغة أسماء بيئة التشغيل.
    - name: ordinals
      type: "Record<Locale, (day: number) => string | number> | null"
      description: دالة تنسيق مخصّصة ليوم الشهر في الرمز `Do` مفهرسة بوسم الإعداد المحلي؛ ويعيد تمرير `null` اللواحق الإنجليزية المضمّنة وعلامات اليوم الخاصة بكل إعداد محلي.
    - name: formats
      type: "Record<string, string | Intl.DateTimeFormatOptions> | null"
      description: تنسيقات مخصّصة قابلة لإعادة الاستخدام تُمرَّر إلى `format(name)`، حيث تكون كل قيمة نمط رموز أو كائن خيارات `Intl`؛ وتأخذ الأسماء المخصّصة الأولوية على القوالب الجاهزة المضمّنة، بينما يمسحها تمرير `null`.
    - name: dayFirst
      type: boolean | null
      description: الترتيب الرقمي الافتراضي للتاريخ في استدعاءات الوضع المرن التي تغفل `dayFirst` و`locale` على مستوى الاستدعاء؛ ويتبع عدم ضبطه أو تمرير `null` الإعداد المحلي النشط.
    - name: zoneAliases
      type: Record<string, Zone | null> | null
      description: أسماء مخصّصة مقترنة بمناطق زمنية عبر `@native-dates/plugins/zones`؛ ويمسح تمرير `null` لمفتاح واحد أو للخريطة كاملة الأسماء البديلة.
```

**القيمة المُرجَعة**

```returns
type: "{ zone, locale, weekStart, dayFirst, zoneAliases, weekdayNames, ordinals, formats }"
description: نسخة سطحية من الإعدادات النشطة بعد تطبيق التحديثات، مع القيمة `undefined` للمفاتيح غير المضبوطة.
```

تُغيّر إعدادات `weekdayNames` و`ordinals` ما تطبعه أنماط الرموز و[`weekdayNames()`](/api/month-names/#weekdaynames) دون الحاجة إلى إضافات:

```js
import { configure, date, weekdayNames } from 'native-dates';

configure({
  weekdayNames: { lv: { narrow: { fri: 'Pk', sun: 'Sv' } } },
  ordinals: { fr: (day) => (day === 1 ? '1er' : day) },
});

date('2026-11-01').format('Do MMMM', 'fr'); // '1er novembre'
weekdayNames('narrow', 'monday', 'lv'); // ['P', 'O', 'T', 'C', 'Pk', 'S', 'Sv']

configure({ weekdayNames: null, ordinals: null });
```

تمنح التنسيقات المُسمّاة التطبيقَ قوالبه الجاهزة الخاصة على كل نوع ينسّق تاريخًا أو وقتًا:

```js
import { configure, date, datetime } from 'native-dates';

configure({
  formats: {
    invoice: 'YYYY-MM-DD',
    receipt: { weekday: 'long', month: 'long', day: 'numeric' },
  },
});

date('2026-11-06').format('invoice'); // '2026-11-06'
datetime('2026-11-06T09:05', 'Europe/Berlin').format('receipt'); // 'Friday, November 6'

configure({ formats: null });
```

توسّع الإضافات دالة `configure()` بخياراتها الخاصة بمجرد استيرادها. ويرمي ضبط خيار إضافة قبل استيرادها خطأ `RangeError`:

```js
import { configure, date, now } from 'native-dates';
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';

configure({
  dayFirst: true,
  zoneAliases: { hq: 'Europe/Berlin' },
});

date('07.09.2026', { loose: true })?.toString(); // '2026-09-07'
now('hq').zone; // 'Europe/Berlin'

configure({ dayFirst: null });
```
:::

:::warning[اضبط الإعدادات مرة واحدة عند بدء التشغيل على الخوادم]
يحدّث الإعداد العام حالة مشتركة على مستوى عملية JavaScript بالكامل. اضبط القيم الافتراضية مرة واحدة عند إقلاع الخادم، ثم أرفق المنطقة الزمنية و[`locale()`](/api/date-time/#locale) الخاصين بكل مستخدم بالقيمة داخل معالجات الطلبات. انظر [التوطين](/guides/localization/).
:::

## دالة يوم الأسبوع المساعدة

حوّل اسم اليوم بالإنجليزية إلى رقمه باستخدام ترقيم ISO نفسه المعتمَد في بقية المكتبة.

:::entry
### `dayOfWeek()` :kind[function]

```js signature
dayOfWeek(day): number
```

تحوّل اسم يوم من أيام الأسبوع بالإنجليزية، أو اختصارًا من ثلاثة أحرف بالإنجليزية، أو رقم ISO إلى عدد صحيح من 1 ليوم الاثنين حتى 7 ليوم الأحد. ترمي الأسماء غير المعروفة أو الأعداد الخارجة عن هذا النطاق خطأ `RangeError`.

**المعاملات**

```params
- name: day
  type: DayOfWeek
  required: true
  description: "اسم يوم من أيام الأسبوع بالإنجليزية مثل `'monday'`، أو اختصار بالإنجليزية لا يتأثر بحالة الأحرف مثل `'Fri'`، أو عدد صحيح من 1 إلى 7."
```

**القيمة المُرجَعة**

```returns
type: number
description: رقم اليوم في الأسبوع من 1 ليوم الاثنين حتى 7 ليوم الأحد.
```

```js
import { dayOfWeek } from 'native-dates';

dayOfWeek('monday'); // 1
dayOfWeek('Fri'); // 5
dayOfWeek('sunday'); // 7
dayOfWeek(3); // 3
```
:::
