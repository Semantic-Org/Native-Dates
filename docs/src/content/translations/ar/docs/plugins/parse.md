---
source: 8dc73060ce55
title: parse
lede: "حلّل نصوص التاريخ والوقت ذات التنسيق الثابت بدقة صارمة باستخدام أنماط الرموز مع `{ format }`."
---

## التحليل باستخدام نمط تنسيق

تحلّل النواة نصوص ISO 8601 الصارمة افتراضيًا، بينما تقرأ [`@native-dates/plugins/loose`](/plugins/loose/) النصوص الحرّة وفق الإعداد المحلي النشط. ويضيف استيراد هذه الإضافة الخيار `{ format }` لتحليل النصوص ذات التنسيق الثابت مثل ملفات البنوك وسجلات الخادم.

```js title="parse.js"
import '@native-dates/plugins/parse';
import { date, datetime, monthDay, time, yearMonth } from 'native-dates';

date('24112026', { format: 'DDMMYYYY' }).toString(); // '2026-11-24'
datetime('24/Nov/2026:12:40:01 -0500', {
  format: 'DD/MMM/YYYY:HH:mm:ss ZZ',
  zone: 'America/New_York',
  locale: 'en-US',
}).toString(); // '2026-11-24T17:40:01.000Z'
time('1430', { format: 'HHmm' }).toString(); // '14:30:00'
yearMonth('11/2026', { format: 'MM/YYYY' }).toString(); // '2026-11'
monthDay('29/02', { format: 'DD/MM' }).toString(); // '02-29'
```

يبقى تحليل ISO الصارم هو الافتراضي كلما أغفلت خيار التنسيق. ويرمي استدعاء أي دالة مصنعية مع `{ format }` قبل استيراد هذه الإضافة خطأ [`missingPlugin`](/api/errors/#plugins).

## المطابقة الصارمة والتنسيقات المسمّاة

تعتمد الأنماط على [مفردات الرموز](/guides/formatting/#token-patterns) نفسها في النواة. تتطلب الرموز ذات العرض الثابت عدد الأرقام المحدّد بالضبط، ويجب أن يطابق النص الحرفي السلسلة كاملةً مع مراعاة حالة الأحرف.

ترمي التواريخ المستحيلة مثل 30 فبراير وأيام الأسبوع غير المتطابقة خطأً بدل الانتقال إلى تاريخ لاحق. كما تُرفض الرموز المكرّرة وحقول نظامي 12 ساعة و24 ساعة المتعارضة بالطريقة نفسها.

```js
import { configure, date, dateRange } from 'native-dates';

date('Tue 2026-11-24', { format: 'ddd YYYY-MM-DD', locale: 'en-US' }).toString();
// '2026-11-24'
date('6/9/26', { format: 'D/M/YY' }).toString(); // '2026-09-06'

configure({ formats: { bank: 'DDMMYYYY' } });
date('24112026', { format: 'bank' }).toString(); // '2026-11-24'
dateRange('24112026', '30112026', { format: 'bank' }).toString();
// '2026-11-24/2026-11-30'
configure({ formats: null });
```

تعمل الأنماط المسمّاة المسجّلة في [`configure()`](/api/configure/) للتحليل والتنسيق معًا. وتمرّر دوال النطاقات المصنعية خيار التنسيق إلى كلا الطرفين، بما في ذلك عند تمرير مدة زمنية كوسيط ثانٍ.

## الأسماء الموطّنة والأعداد الترتيبية

تتبع أسماء الأشهر وأيام الأسبوع وفترات اليوم والأعداد الترتيبية الإعداد المحلي النشط. وتُطابَق صيغ الأشهر المستقلة والمُعرَبة معًا دون حساسية لحالة الأحرف، فتُحلَّل التواريخ الروسية واليونانية من دون قواعد إضافية.

يتبع الإعداد المحلي النشط الأولوية نفسها المعتمدة في التنسيق: خيار الاستدعاء، ثم [`configure()`](/api/configure/)، ثم الإعداد الافتراضي لبيئة التشغيل. مرّر إعدادًا محليًا صريحًا متى جاء النص بلغة ثابتة كسجلات الخادم الإنجليزية.

```js
import { date, time, yearMonth } from 'native-dates';

date('November 24th, 2026', { format: 'MMMM Do, YYYY', locale: 'en-US' }).toString();
// '2026-11-24'
date('6 ноября 2026', { format: 'D MMMM YYYY', locale: 'ru' }).toString();
// '2026-11-06'
date('6. November 2026', { format: 'Do MMMM YYYY', locale: 'de' }).toString();
// '2026-11-06'
date('2026年11月6日', { format: 'YYYY[年]M[月]Do', locale: 'ja' }).toString();
// '2026-11-06'
yearMonth('février 2026', { format: 'MMMM YYYY', locale: 'fr' }).toString();
// '2026-02'
time('9:05:12.5 pm', { format: 'h:mm:ss.S a', locale: 'en-US' }).toString();
// '21:05:12.500'
```

تتحقّق الرموز الترتيبية الإنجليزية من اللاحقة الدقيقة فترفض `'24st'`، بينما تُطبَّق [أسماء أيام الأسبوع](/api/configure/) المخصّصة المسجّلة في إعدادات التطبيق تلقائيًا.

## أسابيع ISO والتواريخ الترتيبية

تتحوّل أنماط اليوم الترتيبي في السنة وأسابيع ISO مباشرةً إلى تواريخ تقويمية أو لحظات زمنية. وعند اقتران `YYYY` برمز أسبوع، يقرأ سنة أسبوع ISO بدل السنة التقويمية التي تطبعها `format()`، ولذلك يُحلَّل النص `'2026-W01-1'` إلى 29 ديسمبر 2025.

تُفحَص السنوات الكبيسة والسنوات ذات 52 أو 53 أسبوعًا بدقة صارمة، ويؤدي إغفال يوم الأسبوع مع أسبوع ISO إلى اختيار يوم الاثنين.

```js
import { date } from 'native-dates';

date('2026-328', { format: 'YYYY-DDDD' }).toString(); // '2026-11-24'
date('2026-W48-2', { format: 'YYYY-[W]WW-E' }).toString(); // '2026-11-24'
date('2026-W48', { format: 'YYYY-[W]WW' }).toString(); // '2026-11-23'
date('2026-W01-1', { format: 'YYYY-[W]WW-E' }).toString(); // '2025-12-29'
```

## المناطق الزمنية والطوابع الزمنية

تثبّت الأنماط التي تتضمّن رمز إزاحة لحظة زمنية دقيقة وتحوّلها إلى المنطقة الزمنية الهدف. وتفسّر رموز `z` المضمَّنة معرّفات IANA، ومع تحميل [`@native-dates/plugins/zones`](/plugins/zones/) تفسّر أيضًا أسماء المدن بالإنجليزية والاختصارات مثل `JST`، لكنها لا تفسّر تسميات الإزاحة العامة مثل <bdi>GMT+2</bdi>.

تبقى المنطقة الزمنية المضمَّنة على النتيجة ما لم تمرّر خيار منطقة هدف للتحويل إليها. وإذا حمل النص إزاحةً واسم منطقة زمنية يتعارضان في تلك اللحظة، يرمي التحليل خطأً.

```js
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('24 Nov 2026 15:45 JST', {
  format: 'DD MMM YYYY HH:mm z',
  locale: 'en-US',
}).zone; // 'Asia/Tokyo'

datetime('24 Nov 2026 15:45 JST', {
  format: 'DD MMM YYYY HH:mm z',
  zone: 'UTC',
  locale: 'en-US',
}).toString(); // '2026-11-24T06:45:00.000Z'

datetime('1795542001', { format: 'X', zone: 'UTC' }).toString();
// '2026-11-24T17:40:01.000Z'
datetime('24112026', { format: 'DDMMYYYY', zone: 'America/New_York' }).toString();
// '2026-11-24T05:00:00.000Z'
```

تُحلَّل طوابع عصر Unix عبر `X` للثواني الصحيحة و`x` للمللي ثانية. وعند تمرير نمط تاريخ فقط إلى [دالة التاريخ والوقت المصنعية](/api/datetime-fn/)، تبدأ اللحظة الناتجة عند بداية ذلك اليوم في المنطقة الزمنية الهدف.

## الدمج مع الوضع المرن

حمّل [`@native-dates/plugins/loose`](/plugins/loose/) إلى جانب هذه الإضافة لإرجاع `null` بدل رمي خطأ عندما لا يطابق النص النمط المطلوب. وتُرجع القيم الفارغة والأرقام والتواريخ المستحيلة وانتقالات التوقيت الصيفي المرفوضة القيمة `null` من الدوال المصنعية، بينما تمرّ كائنات التاريخ والوقت الجاهزة دون تغيير.

```js
import '@native-dates/plugins/loose';
import { date, datetime } from 'native-dates';

date('not-a-date', { format: 'DDMMYYYY', loose: true }); // null
date('30022026', { format: 'DDMMYYYY', loose: true }); // null
datetime('08/03/2026 02:30', {
  format: 'DD/MM/YYYY HH:mm',
  zone: 'America/New_York',
  disambiguation: 'reject',
  loose: true,
}); // null
```

:::note[البيانات التالفة تُرجع null، أما الأنماط غير الصالحة فتظل ترمي خطأً]
يحوّل الوضع المرن النصوص غير المطابقة فقط إلى `null`. أما النمط الفارغ أو الناقص فيرمي [`unknownFormat`](/api/errors/#units-zones-and-formats)، ويرمي الرمز الذي لا يحمله النوع الهدف [`unsupportedToken`](/api/errors/#units-zones-and-formats).
:::

## الرموز المدعومة

تتبع الرموز مفردات التنسيق نفسها، مع قصّ المسافات البادئة واللاحقة تلقائيًا ما لم يبدأ النمط نفسه بمسافة أو ينتهِ بها.

| الرمز | مثال | ما يطابقه |
|---|---|---|
| `YYYY` | `'2026'` | سنة تقويمية من 4 أرقام، أو سنة أسبوع ISO عند اقترانها بـ `W` أو `WW`. |
| `YY` | `'26'` | سنة من رقمين: تُقرأ الأرقام من 69 إلى 99 بوصفها 1969 إلى 1999، ومن 00 إلى 68 بوصفها 2000 إلى 2068. |
| `M`، `MM` | `'9'`، `'09'` | رقم الشهر من 1 إلى 12، بلا حشو أو محشوًا بصفر إلى رقمين. |
| `MMM`، `MMMM` | `'Nov'`، `'November'` | اسم الشهر الميلادي الموطّن المختصر أو الكامل، بما في ذلك الصيغ المُعرَبة. |
| `D`، `DD` | `'6'`، `'06'` | يوم الشهر من 1 إلى 31، بلا حشو أو محشوًا بصفر إلى رقمين. |
| `Do` | `'24th'`، `'6.'` | يوم الشهر بلاحقة ترتيبية بالإنجليزية أو علامة اليوم في الإعداد المحلي النشط. |
| `DDD`، `DDDD` | `'1'`، `'328'` | اليوم الترتيبي في السنة وفق ISO من 1 إلى 366، بلا حشو أو محشوًا بأصفار إلى 3 أرقام. |
| `W`، `WW` | `'5'`، `'48'` | رقم أسبوع ISO في السنة من 1 إلى 53، بلا حشو أو محشوًا بصفر إلى رقمين. |
| `E` | `'2'` | يوم الأسبوع وفق ISO من 1 ليوم الاثنين إلى 7 ليوم الأحد. |
| `d` | `'0'` | يوم الأسبوع من 0 ليوم الأحد إلى 6 ليوم السبت. |
| `dd`، `ddd`، `dddd` | `'Tu'`، `'Tue'`، `'Tuesday'` | أقصر اسم موطّن ليوم الأسبوع، أو المختصر، أو الكامل. |
| `H`، `HH` | `'9'`، `'09'` | الساعة بنظام 24 ساعة من 0 إلى 23، بلا حشو أو محشوة بصفر إلى رقمين. |
| `h`، `hh` | `'9'`، `'09'` | الساعة بنظام 12 ساعة من 1 إلى 12، بلا حشو أو محشوة بصفر إلى رقمين. |
| `m`، `mm` | `'5'`، `'05'` | الدقيقة من 0 إلى 59، بلا حشو أو محشوة بصفر إلى رقمين. |
| `s`، `ss` | `'8'`، `'08'` | الثانية من 0 إلى 59، بلا حشو أو محشوة بصفر إلى رقمين. |
| `S`، `SS`، `SSS` | `'5'`، `'25'`، `'250'` | كسور الثانية بالأعشار أو أجزاء المئة أو المللي ثانية. |
| `A`، `a` | `'PM'`، `'pm'` | رمز `AM` أو `PM` بالإنجليزية دون حساسية لحالة الأحرف، أو رمز فترة اليوم في الإعداد المحلي النشط. |
| `Z`، `ZZ` | `'-05:00'`، `'-0500'` | إزاحة UTC مع نقطتين أو بدونهما، أو `Z` لتوقيت UTC. |
| `z`، `zz` | `'UTC'`، `'JST'` | معرّف منطقة IANA بلا مسافات، أو اسم مدينة بالإنجليزية أو اختصار عند تحميل `@native-dates/plugins/zones`. لا يحلّل تسميات الإزاحة مثل `'GMT+2'`. |
| `X`، `x` | `'1795542001'` | طابع عصر Unix بالثواني الصحيحة أو المللي ثانية، بما في ذلك القيم السالبة. |
| `[text]` | `'[W]'` | نص حرفي معزول يُطابَق مع مراعاة حالة الأحرف. ويمرّ الحرف `T` المنفرد دون عزل أيضًا. |

لا يمكن تحليل الرموز المخصّصة للتنسيق فقط مثل أرباع السنة وأسماء المناطق الزمنية الطويلة، فترمي خطأ [`unknownFormat`](/api/errors/#units-zones-and-formats). وترمي الأنماط التي تفتقر إلى حقول مطلوبة للنوع الهدف الخطأ نفسه، بينما ترمي الرموز التي لا يحملها النوع الهدف خطأ [`unsupportedToken`](/api/errors/#units-zones-and-formats).

## خيارات الدوال المصنعية

:::entry
### `datetime()` :kind[function]

```js signature
datetime(input, { format, zone?, locale?, disambiguation?, loose? }): DateTime
date(input, { format, locale?, loose? }): CalendarDate
time(input, { format, locale?, loose? }): Time
yearMonth(input, { format, locale?, loose? }): YearMonth
monthYear(input, { format, locale?, loose? }): YearMonth
monthDay(input, { format, locale?, loose? }): MonthDay
dayMonth(input, { format, locale?, loose? }): MonthDay
dateRange(start, end, { format, locale?, loose? }): DateRange
datetimeRange(start, end, { format, zone?, locale?, disambiguation?, loose? }): DateTimeRange
timeRange(start, end, { format, locale?, loose? }): TimeRange
```

تحلّل النصوص وفق نمط رموز أو تنسيق مسمّى عبر جميع دوال التواريخ والأوقات والتواريخ الجزئية والنطاقات المصنعية. وتمرّ قيم التاريخ والوقت وكائنات `Date` و`Temporal` المحلَّلة مسبقًا كما هي بعد التحقق من صحة النمط، بينما تُرفض الأرقام.

**المعاملات**

```params
- name: format
  type: string
  required: true
  description: "نمط رموز مثل `'DDMMYYYY'` أو نمط مسمّى مسجّل في `configure({ formats })`."
- name: zone
  type: Zone
  description: المنطقة الزمنية المعتمدة لتفسير نصوص التاريخ والوقت المحليين أو تحويل إزاحات UTC وطوابع عصر Unix.
- name: locale
  type: Locale
  description: وسم الإعداد المحلي وفق BCP 47 المحمول على القيمة والمعتمد لأسماء الأشهر وأيام الأسبوع وفترات اليوم والأعداد الترتيبية.
- name: disambiguation
  type: Disambiguation
  default: "'compatible'"
  description: "آلية إزالة اللبس في فجوات التوقيت الصيفي وأوقاته المتكرّرة. يرمي `'reject'` خطأ `invalidDateTime`، أو يُرجع `null` في الوضع المرن."
- name: loose
  type: boolean
  default: "false"
  description: "خيار يتطلب `@native-dates/plugins/loose` لإرجاع `null` بدل رمي خطأ عندما لا يطابق المدخل التنسيق."
```

**القيمة المُرجَعة**

```returns
type: DateTime | CalendarDate | Time | YearMonth | MonthDay | Range
description: "الكائن المحلَّل، أو `null` عند ضبط `{ loose: true }` في دالة مصنعية وعدم مطابقة المدخل."
```

```js
date('24112026', { format: 'DDMMYYYY' }).toString(); // '2026-11-24'
yearMonth('202611', { format: 'YYYYMM' }).toString(); // '2026-11'
timeRange('0930', '1700', { format: 'HHmm' }).toString(); // '09:30:00/17:00:00'
```
:::
