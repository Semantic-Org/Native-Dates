---
source: af294e4ed659
title: date()
lede: إنشاء كائن CalendarDate من سلسلة تاريخ بترتيب السنة أولًا أو أعداد السنة والشهر واليوم أو كائن حقول أو اليوم الحالي.
---

## قراءة التواريخ التقويمية

:::entry
### `date()` :kind[function]

```js signature
date(input, options?): CalendarDate
date(input, zone?): CalendarDate
date(year, month, day): CalendarDate
```

تُنشئ كائن [`CalendarDate`](/api/calendar-date/) من سلسلة تاريخ بترتيب السنة أولًا، أو من ثلاثة أعداد يبدأ عدّها من 1، أو من كائن حقول، أو من تاريخ أو طابع زمني موجود. ترمي التواريخ المستحيلة مثل 30 فبراير خطأ `RangeError` بدلًا من الانتقال إلى مارس.

```js title="create.js"
import { date, datetime } from 'native-dates';

const fromIso = date('2026-11-16');
const fromSlashes = date('2026/11/6');
const fromNumbers = date(2026, 11, 16);
const fromFields = date({ year: 2026, month: 11, day: 16 });
const fromMoment = date(datetime('2026-11-17T02:00:00Z', 'America/Los_Angeles'));

fromSlashes.toString(); // '2026-11-06'
fromMoment.toString(); // '2026-11-16'
```

**المعاملات**

```params
- name: input
  type: CalendarDateInput | number
  required: true
  description: سلسلة تاريخ ISO، أو كائن حقول، أو تاريخ أو طابع زمني موجود، أو السنة (`year`) من 4 أرقام.
- name: options
  type: Zone | ReadOptions | number
  description: المنطقة الزمنية أو كائن خيارات عند قراءة طابع زمني أو سلسلة في الوضع المرن، أو رقم الشهر (`month`) من 1 إلى 12.
  options:
    - name: zone
      type: Zone
      description: المنطقة الزمنية المستخدَمة لتحديد اليوم التقويمي لسلسلة لحظة زمنية أو كائن `DateTime` أو `Date`.
    - name: locale
      type: Locale
      description: وسم الإعداد المحلي BCP 47 المحمول على كائن `CalendarDate` المُرجَع وكل قيمة مشتقّة منه.
    - name: loose
      type: boolean
      default: 'false'
      description: تحليل سلاسل التواريخ غير الرسمية وإرجاع `null` عند تعذّر قراءة المدخل مع `@native-dates/plugins/loose`.
    - name: dayFirst
      type: boolean
      description: "تجاوز ترتيب التاريخ الرقمي للإعداد المحلي النشط لسلاسل مثل `'07.09.2026'` في الوضع المرن."
- name: day
  type: number
  description: رقم اليوم في الشهر من 1 إلى 31 عند تمرير `year` و`month` و`day`.
```

**القيمة المُرجَعة**

```returns
type: CalendarDate
description: كائن `CalendarDate` بلا وقت ساعة أو منطقة زمنية، أو `null` عندما يعجز الوضع المرن عن قراءة `input`.
```

عند قراءة طابع زمني ISO أو كائن `Date` أصلي في JavaScript، مرّر منطقة زمنية لتحديد اليوم التقويمي للموقع الذي تريد استخراجه:

```js
date('2026-11-17T02:00:00Z', 'America/Los_Angeles').toString(); // '2026-11-16'
date('2026-11-17T02:00:00Z', 'Asia/Tokyo').toString(); // '2026-11-17'
```
:::

### المدخلات المقبولة

تمتدّ الأشهر دائمًا من 1 ليناير حتى 12 لديسمبر، بخلاف باني الصنف `Date` في JavaScript الذي يبدأ عدّ الأشهر فيه من 0. ترمي المدخلات التي تحتوي على سنة وشهر دون يوم خطأ `RangeError` بدلًا من افتراض اليوم الأول من الشهر؛ لذا استدعِ [`yearMonth()`](/api/year-month-fn/) لقيم السنة والشهر.

| المدخل | مثال | طريقة القراءة |
|---|---|---|
| سلسلة تاريخ بترتيب السنة أولًا | `'2026-11-16'`، `'2026/11/6'`، `'2026年11月16日'` | تقرأ سنة من 4 أرقام وشهرًا ويومًا بأي فاصل عدا الأحرف اللاتينية أو النقطتين الرأسيتين. |
| سلسلة تاريخ ووقت محليين | `'2026-11-16T09:30'` | تحتفظ بالتاريخ التقويمي وتُسقط وقت اليوم. |
| سلسلة لحظة زمنية ISO | `'2026-11-17T02:00:00Z'` | تقرأ اليوم التقويمي لتلك اللحظة في المنطقة الزمنية الممرَّرة أو الافتراضية المضبوطة. |
| السنة والشهر واليوم | `date(2026, 11, 16)` | تقبل ثلاثة أعداد صحيحة مع `1` ليناير حتى `12` لديسمبر. |
| كائن حقول | `{ year: 2026, month: 11, day: 16 }` | تقرأ حقول التقويم التي يبدأ عدّها من 1 وترفض التواريخ المستحيلة. |
| [DateTime](/api/date-time/) | `date(dt, 'Asia/Tokyo')` | تستخرج التاريخ التقويمي في المنطقة الزمنية المحدّدة، أو في `dt.zone` عند إغفالها. |
| كائن Date في JavaScript | `date(jsDate, 'America/Los_Angeles')` | تقرأ اليوم التقويمي لذلك الطابع الزمني في المنطقة الزمنية الممرَّرة أو الافتراضية المضبوطة. |
| قيمة Temporal | `Temporal.PlainDate`، `Temporal.Instant` | تقرأ التواريخ البسيطة من أي تقويم بصفتها يوم ISO نفسه، وتنقل اللحظات الزمنية إلى المنطقة الزمنية المستهدفة. |

:::note[تعتمد الطوابع الزمنية على المنطقة الزمنية]
تشير سلسلة ISO المنتهية بالحرف `Z` أو بإزاحة UTC إلى لحظة واحدة قد تقع في يومين تقويميين مختلفين حول العالم. مرّر منطقة زمنية صريحة عند استخراج اليوم التقويمي لمستخدم على الخادم.
:::

## الأيام التقويمية النسبية

يعتمد تاريخ اليوم على موقعك على الأرض. تقبل كل دالة مساعدة أدناه منطقة زمنية اختيارية وترجع افتراضيًا إلى [الإعداد الافتراضي المضبوط](/api/configure/).

:::entry
### `today()` :kind[function]

```js signature
today(zone?): CalendarDate
```

تُرجع التاريخ التقويمي لليوم في المنطقة الزمنية المحدّدة أو الإعداد الافتراضي المضبوط. ففي ساعة متأخرة من المساء في الأمريكتين، تكون آسيا وأوقيانوسيا قد عبرتا منتصف الليل إلى اليوم التقويمي التالي.

**المعاملات**

```params
- name: zone
  type: Zone
  description: "المنطقة الزمنية المطلوب قراءة تاريخها التقويمي الحالي، مثل `'Asia/Tokyo'` أو `'America/Los_Angeles'`."
```

**القيمة المُرجَعة**

```returns
type: CalendarDate
description: كائن `CalendarDate` لليوم الحالي في `zone`.
```

```js
import { datetime, today } from 'native-dates';

const inLosAngeles = today('America/Los_Angeles');
const inTokyo = today('Asia/Tokyo');

// عند 02:00 بتوقيت UTC في 17 نوفمبر، لا تزال لوس أنجلوس في 16 نوفمبر بينما دخلت طوكيو في 17 نوفمبر
const moment = '2026-11-17T02:00:00Z';
datetime(moment, 'America/Los_Angeles').date.toString(); // '2026-11-16'
datetime(moment, 'Asia/Tokyo').date.toString(); // '2026-11-17'
```
:::

:::entry
### `tomorrow()` :kind[function]

```js signature
tomorrow(zone?): CalendarDate
```

تُرجع التاريخ التقويمي لغدٍ في المنطقة الزمنية المحدّدة، أي يومًا تقويميًا واحدًا بعد [`today(zone)`](#today).

**المعاملات**

```params
- name: zone
  type: Zone
  description: المنطقة الزمنية المطلوب التقدّم في تقويمها يومًا بعد اليوم الحالي.
```

**القيمة المُرجَعة**

```returns
type: CalendarDate
description: كائن `CalendarDate` لغدٍ في `zone`.
```

```js
import { tomorrow } from 'native-dates';

const nextDay = tomorrow();
const londonTomorrow = tomorrow('Europe/London');
```
:::

:::entry
### `yesterday()` :kind[function]

```js signature
yesterday(zone?): CalendarDate
```

تُرجع التاريخ التقويمي لأمس في المنطقة الزمنية المحدّدة، أي يومًا تقويميًا واحدًا قبل [`today(zone)`](#today).

**المعاملات**

```params
- name: zone
  type: Zone
  description: المنطقة الزمنية المطلوب الرجوع في تقويمها يومًا قبل اليوم الحالي.
```

**القيمة المُرجَعة**

```returns
type: CalendarDate
description: كائن `CalendarDate` لأمس في `zone`.
```

```js
import { yesterday } from 'native-dates';

const priorDay = yesterday();
const londonYesterday = yesterday('Europe/London');
```
:::
