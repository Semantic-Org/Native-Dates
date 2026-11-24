---
source: be45ccc1b61a
title: loose
lede: تحليل اختياري يراعي الإعداد المحلي ويُرجع null عند تعذّر قراءة النصوص غير الموثوقة من النماذج وملفات CSV والتغذيات القديمة.
---

## التحليل المرن الاختياري

تحلّل كل دالة مصنعية نصوص ISO 8601 الصارمة افتراضيًا وترمي خطأً عند المدخلات المختلّة. يفعّل استيراد هذه الإضافة الخيار `{ loose: true }` للتعامل مع نصوص المستخدمين غير الموثوقة وأعمدة CSV وترويسات الشبكة القديمة.

```js title="loose.js"
import '@native-dates/plugins/loose';
import { date, datetime, duration, time } from 'native-dates';

date('September 6, 2026', { loose: true })?.toString(); // '2026-09-06'
datetime('Sat, 06 Sep 2026 14:30:00 GMT', { loose: true })?.toString();
// '2026-09-06T14:30:00.000Z'
time('September 6, 2026 5:30 PM', { loose: true })?.toString(); // '17:30:00'
duration('2h', { loose: true })?.toString(); // 'PT2H'
```

يبقى التحليل الصارم هو السلوك الافتراضي عند عدم تفعيل الوضع المرن؛ فاستيراد الإضافة لا يغيّر أي استدعاء قائم في مشروعك.

## القراءة وفق الإعداد المحلي النشط

يستطيع الوضع المرن قراءة التواريخ وأوقات الساعة نفسها التي يطبعها `Intl` للإعداد المحلي النشط. تُستمد أسماء الأشهر وعلامات الصباح والمساء وعبارات فترات اليوم وترتيب اليوم والشهر الرقمي من بيئة التشغيل، وتُحوَّل الأرقام المكتوبة بأي نظام كتابة تلقائيًا.

يتبع الإعداد المحلي النشط الأولوية نفسها المعتمدة في التنسيق: خيار `locale` في الاستدعاء، ثم [`configure()`](/api/configure/)، ثم الإعداد الافتراضي لبيئة التشغيل.

```js locale="en-US" label="English"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'en-US' });

date('06/11/2026', { loose: true })?.toString(); // '2026-06-11'
date('September 6, 2026', { loose: true })?.toString(); // '2026-09-06'
time('9:10 in the evening', { loose: true })?.toString(); // '21:10:00'
datetime('Sep 6, 2026, 5:30 PM', {
  loose: true,
  zone: 'America/New_York',
})?.hour; // 17
```

```js locale="fr" label="Français"
import '@native-dates/plugins/loose';
import { configure, date, datetime, monthDay } from 'native-dates';

configure({ locale: 'fr' });

date('06/11/2026', { loose: true })?.toString(); // '2026-11-06'
date('1er mai 2026', { loose: true })?.toString(); // '2026-05-01'
monthDay('1er mai', { loose: true })?.toString(); // '05-01'
datetime('16 novembre 2026 à 14:30', {
  loose: true,
  zone: 'Europe/Paris',
})?.hour; // 14
```

```js locale="es" label="Español"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'es' });

date('06/11/2026', { loose: true })?.toString(); // '2026-11-06'
date('16 de noviembre de 2026', { loose: true })?.toString(); // '2026-11-16'
time('9:10 de la noche', { loose: true })?.toString(); // '21:10:00'
datetime('16 nov 2026, 14:30', {
  loose: true,
  zone: 'Europe/Madrid',
})?.hour; // 14
```

```js locale="pt-BR" label="Português"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'pt-BR' });

date('06/11/2026', { loose: true })?.toString(); // '2026-11-06'
date('16 de novembro de 2026', { loose: true })?.toString(); // '2026-11-16'
time('9:10 da noite', { loose: true })?.toString(); // '21:10:00'
datetime('16 de novembro de 2026 às 14:30', {
  loose: true,
  zone: 'America/Sao_Paulo',
})?.hour; // 14
```

```js locale="zh-CN" label="中文"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'zh-CN' });

date('2026/11/16', { loose: true })?.toString(); // '2026-11-16'
date('2026年11月16日', { loose: true })?.toString(); // '2026-11-16'
time('晚上9:10', { loose: true })?.toString(); // '21:10:00'
datetime('2026年11月16日 下午2:30', {
  loose: true,
  zone: 'Asia/Shanghai',
})?.hour; // 14
```

```js locale="ja" label="日本語"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'ja' });

date('2026/11/16', { loose: true })?.toString(); // '2026-11-16'
date('2026年11月16日', { loose: true })?.toString(); // '2026-11-16'
time('午後2:30', { loose: true })?.toString(); // '14:30:00'
datetime('2026年11月16日 14:30', {
  loose: true,
  zone: 'Asia/Tokyo',
})?.hour; // 14
```

```js locale="ko" label="한국어"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'ko' });

date('26. 5. 5.', { loose: true })?.toString(); // '2026-05-05'
date('2026년 11월 16일', { loose: true })?.toString(); // '2026-11-16'
time('오후 2:30', { loose: true })?.toString(); // '14:30:00'
datetime('2026년 11월 16일 오후 2:30', {
  loose: true,
  zone: 'Asia/Seoul',
})?.hour; // 14
```

```js locale="ru" label="Русский"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'ru' });

date('16.11.2026', { loose: true })?.toString(); // '2026-11-16'
date('16 ноября 2026 г.', { loose: true })?.toString(); // '2026-11-16'
time('9:10 вечера', { loose: true })?.toString(); // '21:10:00'
datetime('16 нояб. 2026 г., 14:30', {
  loose: true,
  zone: 'Europe/Moscow',
})?.hour; // 14
```

```js locale="ar-EG" label="العربية"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'ar-EG' });

date('١٦‏/١١‏/٢٠٢٦', { loose: true })?.toString(); // '2026-11-16'
date('١٦ نوفمبر ٢٠٢٦', { loose: true })?.toString(); // '2026-11-16'
time('٢:٣٠ م', { loose: true })?.toString(); // '14:30:00'
datetime('١٦ نوفمبر ٢٠٢٦، ٢:٣٠ م', {
  loose: true,
  zone: 'Africa/Cairo',
})?.hour; // 14
```

تقرأ الإعدادات المحلية التي تعتمد ترتيب السنة أولًا، مثل الكورية، السنوات المكوّنة من رقمين في البداية، لذا يُقرأ النص `'26. 5. 5.'` بوصفه 5 مايو 2026 بالكورية. وتُتخطّى كلمات الربط واللواحق الترتيبية وأسماء أيام الأسبوع البادئة في التواريخ الكاملة والتواريخ الجزئية على السواء.

## إرجاع null عند البيانات التالفة

عند تفعيل الوضع المرن، تُرجع النصوص غير المقروءة والحقول الفارغة والقيم الناقصة والتواريخ التقويمية المستحيلة مثل 30 فبراير القيمة `null` بدل رمي خطأ. بذلك تفحص معالجات النماذج ونصوص الاستيراد النتيجة مباشرةً دون إحاطة كل حقل بكتلة `try`.

```js
const submitted = date('TBD', { loose: true }); // null
const rolled = date('2026-02-30', { loose: true }); // null
const missing = datetime(undefined, { loose: true }); // null
```

تقبل الدوال المصنعية الخاصة بـ [النطاقات](/api/ranges/) والتواريخ الجزئية ([`YearMonth`](/api/year-month/) و[`MonthDay`](/api/month-day/)) الخيار نفسه:

```js
import { dateRange, monthDay, yearMonth } from 'native-dates';

dateRange('Sep 1 2026', 'Sep 7 2026', { loose: true })?.toString(); // '2026-09-01/2026-09-07'
yearMonth('ноябрь 2026 г.', { loose: true, locale: 'ru' })?.toString(); // '2026-11'
monthDay('1er mai', { loose: true, locale: 'fr' })?.toString(); // '05-01'
dateRange('TBD', '2026-09-07', { loose: true }); // null
```

تُرجع التواريخ غير المكتملة التي تفتقر إلى السنة أو اليوم القيمة `null` في دوال `date()` و`datetime()` بدل اختراع قيمة افتراضية. استعمل دالة مصنعية لتاريخ جزئي عندما يتوفر شهر وسنة فقط أو شهر ويوم فقط.

كما تُرفض السنوات المكوّنة من رقمين إلى جانب اسم شهر غير إنجليزي، واختصارات الأشهر الملتبسة، والساعات التي تتجاوز 12 مع `AM` أو `PM`، وأوقات الساعة المجرّدة الممرّرة إلى [`datetime()`](/api/datetime-fn/). وتُرجع رموز المناطق الزمنية المجهولة بالأحرف الكبيرة والساعات المجرّدة مثل `'14h'` القيمة `null`.

:::note[البيانات التالفة تُرجع null، أما الخيارات الخاطئة فتظل ترمي خطأ]
يتعامل الوضع المرن مع بيانات الإدخال غير المقروءة فحسب. أما تمرير منطقة زمنية غير معروفة مثل `'Mars/Olympus'` فهو خطأ في شيفرة التطبيق وليس في إدخال المستخدم، ولذلك يظل يرمي خطأً على الفور.
:::

## المناطق الزمنية في النصوص المرنة

تحدّد النصوص التي تحمل علامة UTC أو إزاحة رقمية لحظة زمنية دقيقة وتحوّلها إلى المنطقة الزمنية الهدف أو المضبوطة. أما النصوص الخالية من الإزاحة فتحافظ على التاريخ والوقت المكتوبَين حرفيًا وتضعهما مباشرةً في المنطقة الزمنية الهدف.

```js
datetime('Sat, 06 Sep 2026 14:30:00 GMT', {
  loose: true,
  zone: 'America/New_York',
})?.hour; // 10

datetime('September 6, 2026 5:30 PM', {
  loose: true,
  zone: 'America/Los_Angeles',
})?.hour; // 17
```

يُحلَّل اختصار المنطقة الزمنية الوارد بعد وقت الساعة بالقواعد نفسها المطبّقة على خيار `zone`. استورد [`@native-dates/plugins/zones`](/plugins/zones/) لقراءة اختصارات تتجاوز `UTC` و`GMT` ومعرّفات IANA القياسية، بما في ذلك الرموز المرتبطة بالإعداد المحلي مثل `CST` في الإعدادات المحلية الصينية.

## التواريخ الرقمية بترتيب اليوم أولًا

تتبع التواريخ الرقمية المفصولة بشرطات مائلة أو نقاط أو شرطات ترتيب الإعداد المحلي النشط تلقائيًا. مرّر `dayFirst` في الاستدعاء أو اضبطه عبر [`configure()`](/api/configure/) عندما يستخدم الإدخال ترتيبًا يختلف عن الإعداد المحلي النشط.

```js
import { configure } from 'native-dates';

date('07.09.2026', { loose: true, locale: 'en-US' })?.toString(); // '2026-07-09'
date('07.09.2026', { loose: true, locale: 'de-DE' })?.toString(); // '2026-09-07'
date('07.09.2026', { loose: true, locale: 'en-US', dayFirst: true })?.toString(); // '2026-09-07'

configure({ dayFirst: true });
date('7/9/26', { loose: true })?.toString(); // '2026-09-07'
date('07.09.2026', { loose: true, dayFirst: false })?.toString(); // '2026-07-09'
configure({ dayFirst: null });
```

مرّر `dayFirst: null` إلى `configure()` للعودة إلى اتباع الإعداد المحلي النشط. وتقرأ الدوال المصنعية للتواريخ الجزئية مثل [`monthDay()`](/api/month-day-fn/) الأزواج الرقمية دائمًا بالترتيب الذي يدلّ عليه اسمها بغض النظر عن الإعداد المحلي.

## قواعد الساعة والأشهر الإقليمية

تُحلَّل الساعات المفصولة بنقطة مثل `'14.30'` في الإعدادات المحلية التي تستخدم النقطة في الساعة فحسب، مثل الفنلندية والدنماركية، وتُرجع `null` في سواها. كما تُحلَّل الثواني المفصولة بنقطة بعد تاريخ، بينما تظل السلاسل المستقلة المكوّنة من ثلاثة أجزاء مفصولة بنقاط تواريخ.

تزيح عبارات فترات اليوم مثل الإنجليزية *in the evening* والكورية *밤* ساعات نظام 12 ساعة مع ترك أوقات نظام 24 ساعة كما هي. ولا تُقرأ أدوات الربط بين التاريخ والوقت قطّ على أنها `AM` أو `PM`؛ فالأداة الويلزية *am* التي تعني «في الساعة» تُبقي `14:30` كما هي، بينما يُقرأ النص الإنجليزي `'AM 12:30'` بوصفه نصف ساعة بعد منتصف الليل (`00:30`).

تُحلَّل صيغ الأشهر المُعرَبة والمقترنة بلواحق في التواريخ الكاملة تلقائيًا، بما في ذلك العبرية والباسكية. ويجب أن يطابق اختصار الشهر شهرًا واحدًا بعينه، لذا يُحلَّل الاختصار الفرنسي *juil* إلى يوليو بينما يُرجع *jui* القيمة `null`.

```js label="الساعات المفصولة بنقطة"
datetime('16.11.2026 klo 14.30.15', {
  loose: true,
  locale: 'fi',
  zone: 'UTC',
})?.toString(); // '2026-11-16T14:30:15.000Z'
time('14.30', { loose: true, locale: 'fi' })?.toString(); // '14:30:00'
time('14.30', { loose: true, locale: 'de' }); // null
time('14.30.15', { loose: true, locale: 'fi' }); // null
```

```js label="فترات اليوم"
time('밤 11:30', { loose: true, locale: 'ko' })?.toString(); // '23:30:00'
time('밤 1:30', { loose: true, locale: 'ko' })?.toString(); // '01:30:00'
time('14:30 nachmittags', { loose: true, locale: 'de' })?.toString(); // '14:30:00'
```

```js label="أدوات الربط"
time('am 14:30', { loose: true, locale: 'cy' })?.toString(); // '14:30:00'
time('am 12:30', { loose: true, locale: 'cy' })?.toString(); // '12:30:00'
time('AM 12:30', { loose: true, locale: 'en-US' })?.toString(); // '00:30:00'
```

```js label="صيغ الأشهر"
date('2026(e)ko azaroaren 16(a)', {
  loose: true,
  locale: 'eu',
})?.toString(); // '2026-11-16'
date('6 juil 2026', { loose: true, locale: 'fr' })?.toString(); // '2026-07-06'
date('6 jui 2026', { loose: true, locale: 'fr' }); // null
```

## خيارات الدوال المصنعية

:::entry
### `datetime()` :kind[function]

```js signature
datetime(input, { loose: true, zone?, locale?, dayFirst?, disambiguation? }): DateTime | null
date(input, { loose: true, zone?, locale?, dayFirst? }): CalendarDate | null
time(input, { loose: true, zone?, locale?, dayFirst? }): Time | null
duration(input, { loose: true, locale? }): Duration | null
yearMonth(input, { loose: true, zone?, locale? }): YearMonth | null
monthDay(input, { loose: true, zone?, locale?, dayFirst? }): MonthDay | null
dateRange(start, end, { loose: true, zone?, locale?, dayFirst? }): DateRange | null
```

توسّع الإضافة جميع الدوال المصنعية بتحليل احتياطي يراعي الإعداد المحلي مع إرجاع `null` عند تعذّر القراءة. أما استدعاء بناة الأصناف مثل `new DateTime()` مع `{ loose: true }` فيفعّل التحليل الاحتياطي لكنه يظل يرمي خطأً إذا تعذّرت قراءة المدخل.

**المعاملات**

```params
- name: loose
  type: boolean
  default: "false"
  description: "تفعيل قراءة النصوص غير الرسمية وفق الإعداد المحلي النشط، والرجوع إلى تحليل `Date` في بيئة التشغيل للصيغ الآلية، وإرجاع `null` عند تعذّر القراءة."
- name: dayFirst
  type: boolean
  description: "تجاوز ترتيب التاريخ الرقمي في الإعداد المحلي النشط لنصوص مثل `'07.09.2026'`."
- name: zone
  type: Zone
  description: "المنطقة الزمنية المعتمدة لتفسير نصوص التاريخ والوقت المحليين أو عرض اللحظات الزمنية."
- name: locale
  type: Locale
  description: "وسم الإعداد المحلي وفق BCP 47 المحمول على القيمة والمعتمد لأسماء الأشهر وعبارات فترات اليوم ونمط الساعة وترتيب التاريخ."
- name: disambiguation
  type: Disambiguation
  default: "'compatible'"
  description: "آلية إزالة اللبس في فجوات التوقيت الصيفي وأوقاته المتكررة؛ الخيار `'reject'` يُرجع `null` في الوضع المرن."
```

**القيمة المُرجَعة**

```returns
type: DateTime | CalendarDate | Time | Duration | YearMonth | MonthDay | Range | null
description: "الكائن المحلَّل، أو `null` عند تعذّر قراءة `input`."
```

```js
date('Sept 6, 2026', { loose: true })?.toString(); // '2026-09-06'
date('2026-09', { loose: true }); // null
yearMonth('2026-09', { loose: true })?.toString(); // '2026-09'
```
:::

:::entry
### `configure()` :kind[function]

```js signature
configure({ dayFirst }): Settings
```

يضبط الترتيب الافتراضي للتواريخ الرقمية في استدعاءات الوضع المرن التي لا تحدّد `dayFirst` ولا `locale` في الاستدعاء نفسه. وهو غير مضبوط افتراضيًا حتى يتبع الوضع المرن الإعداد المحلي النشط.

**المعاملات**

```params
- name: dayFirst
  type: boolean | null
  description: "تثبيت التواريخ الرقمية المرنة على ترتيب اليوم أولًا (`true`) أو الشهر أولًا (`false`)، أو تمرير `null` لاتباع الإعداد المحلي النشط."
```
:::
