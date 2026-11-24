---
source: 50f6c5cb4f97
title: datetime()
lede: إنشاء كائن DateTime من طابع زمني أو سلسلة نصية أو كائن Date أو كائن حقول، أو قراءة اللحظة الحالية.
---

## قراءة اللحظات الزمنية

:::entry
### `datetime()` :kind[function]

```js signature
datetime(input, zone?): DateTime
datetime(input, options?): DateTime
```

تقرأ سلسلة نصية أو طابعًا زمنيًا أو كائن حقول أو تاريخًا تقويميًا في كائن [`DateTime`](/api/date-time/) معروض ضمن منطقة زمنية. أغفل المنطقة الزمنية لاستخدام [الإعداد الافتراضي المضبوط](/api/configure/) أو المنطقة الزمنية المحلية لبيئة التشغيل.

```js title="read.js"
import { date, datetime } from 'native-dates';

const fromUtc = datetime('2026-11-16T17:30:00Z', 'America/Los_Angeles');
const fromWall = datetime('2026-11-16 09:30', 'Europe/Berlin');
const fromZone = datetime('2026-11-16T09:30[America/New_York]');
const fromEpoch = datetime(1794850200000, 'UTC');
const fromDate = datetime(date('2026-11-16'), 'America/New_York');
```

**المعاملات**

```params
- name: input
  type: DateTimeInput
  required: true
  description: سلسلة ISO، أو عدد مللي ثانية منذ عصر Unix، أو كائن `Date`، أو كائن حقول، أو تاريخ تقويمي، أو قيمة Temporal.
- name: zoneOrOptions
  type: Zone | ReadOptions
  description: "سلسلة منطقة زمنية مثل `'Europe/Berlin'` أو `'UTC'`، أو كائن خيارات."
  options:
    - name: zone
      type: Zone
      description: المنطقة الزمنية لعرض اللحظة الزمنية فيها، مع تجاوز أي منطقة زمنية بين قوسين معقوفين في `input`.
    - name: locale
      type: Locale
      description: وسم الإعداد المحلي BCP 47 المحمول على كائن `DateTime` المُرجَع وكل قيمة مشتقّة منه.
    - name: loose
      type: boolean
      default: 'false'
      description: تحليل سلاسل التواريخ غير الرسمية وإرجاع `null` عند تعذّر قراءة المدخل مع `@native-dates/plugins/loose`.
    - name: dayFirst
      type: boolean
      description: "تجاوز ترتيب التاريخ الرقمي للإعداد المحلي النشط لسلاسل مثل `'07/09/2026'` في الوضع المرن."
```

**القيمة المُرجَعة**

```returns
type: DateTime
description: كائن `DateTime` في المنطقة الزمنية المعتمَدة، أو `null` عندما يعجز الوضع المرن عن قراءة `input`.
```

عند استيراد [`@native-dates/plugins/loose`](/plugins/loose/)، يقرأ الوضع المرن التواريخ والأوقات غير الرسمية وفق الإعداد المحلي النشط، ويرجع افتراضيًا إلى محلّل المحرّك للصيغ الآلية، ويُرجع `null` عند تعذّر قراءة المدخل:

```js
import { datetime } from 'native-dates';
import '@native-dates/plugins/loose';

datetime('Mon, 16 Nov 2026 17:30:00 GMT', { zone: 'America/New_York', loose: true });
datetime('not a timestamp', { loose: true }); // null
```
:::

### المدخلات المقبولة

يُنتج كل مدخل كائنًا غير قابل للتعديل معروضًا في المنطقة الزمنية المستهدفة:

| المدخل | مثال | طريقة القراءة |
|---|---|---|
| سلسلة ISO مع إزاحة | `'2026-11-16T17:30:00Z'`، `'2026-11-16 12:30-05:00'` | تثبّت اللحظة الدقيقة وتعرضها في المنطقة الزمنية المستهدفة. |
| سلسلة مع منطقة زمنية بين قوسين معقوفين | `'2026-11-16T09:30[America/New_York]'` | تحتفظ بالمنطقة الزمنية داخل القوسين ما لم يتجاوزها وسيط منطقة زمنية ثانٍ. |
| تاريخ ووقت محليان | `'2026-11-16T09:30'`، `'2026年11月16日 14:30'` | تقرأ تاريخًا بترتيب السنة أولًا ووقت يوم مباشرة في المنطقة الزمنية المستهدفة. |
| سلسلة تاريخ أو [CalendarDate](/api/calendar-date/) | `'2026-11-16'`، `date(2026, 11, 16)` | تبدأ عند بداية ذلك اليوم التقويمي في المنطقة الزمنية المستهدفة. |
| عدد مللي ثانية أو كائن Date | `1794850200000`، `new Date()` | تحوّل طابع Unix الزمني إلى المنطقة الزمنية المستهدفة، مع إسقاط كسور المللي ثانية مثل `Date`. |
| كائن حقول | `{ year: 2026, month: 11, day: 16, hour: 9 }` | تقرأ حقول التقويم التي يبدأ عدّها من 1 وحقول الساعة التي يبدأ عدّها من 0 في المنطقة الزمنية المستهدفة، وترفض التواريخ المستحيلة. |
| كائن DateTime أو Temporal | `dt`، `Temporal.Instant`، `Temporal.ZonedDateTime` | تحتفظ بالمنطقة الزمنية الموجودة ما لم يُمرَّر وسيط منطقة زمنية صريح. |

:::note[القيم المفقودة لا تتحول أبدًا إلى اللحظة الحالية]
ترمي القيم المفقودة مثل `undefined` أو `null` خطأً حتى لا يتحول عمود فارغ في قاعدة البيانات إلى التاريخ والوقت الحاليين بالخطأ. استدعِ [`now()`](#now) عندما تريد قراءة الساعة الحية.
:::

## اللحظة الحالية واليوم

اقرأ الساعة الحية أو أنشئ حدود استعلام لليوم الحالي في أي منطقة زمنية.

:::entry
### `now()` :kind[function]

```js signature
now(zone?): DateTime
```

تُرجع اللحظة الحالية بدقة المللي ثانية في المنطقة الزمنية المحدّدة أو الإعداد الافتراضي المضبوط. تطابق دقة المللي ثانية `Date.now()`، فتنتقل الطوابع الزمنية عبر حمولات JSON ذهابًا وإيابًا دون تغيير.

**المعاملات**

```params
- name: zone
  type: Zone
  description: "المنطقة الزمنية لعرض اللحظة الحالية فيها، مثل `'Asia/Tokyo'` أو `'UTC'`."
```

**القيمة المُرجَعة**

```returns
type: DateTime
description: كائن `DateTime` للمللي ثانية الحالية في `zone`.
```

```js
import { now } from 'native-dates';

const local = now();
const tokyo = now('Asia/Tokyo');
const utc = now('UTC');
```
:::

:::entry
### `startOfToday()` :kind[function]

```js signature
startOfToday(zone?): DateTime
```

تُرجع بداية اليوم الحالي في المنطقة الزمنية المحدّدة، مطابقة لبداية اليوم التقويمي المحلي. وهي مفيدة كحدّ أدنى عند الاستعلام عن الأحداث أو السجلات المُنشأة اليوم.

**المعاملات**

```params
- name: zone
  type: Zone
  description: المنطقة الزمنية المطلوب قياس يومها الحالي.
```

**القيمة المُرجَعة**

```returns
type: DateTime
description: كائن `DateTime` عند بداية اليوم الحالي في `zone`.
```

```js
import { startOfToday } from 'native-dates';

const opens = startOfToday('America/New_York');
opens.hour; // 0
opens.minute; // 0
```
:::

:::entry
### `endOfToday()` :kind[function]

```js signature
endOfToday(zone?): DateTime
```

تُرجع آخر مللي ثانية في اليوم الحالي ضمن المنطقة الزمنية المحدّدة.

**المعاملات**

```params
- name: zone
  type: Zone
  description: المنطقة الزمنية المطلوب قياس يومها الحالي.
```

**القيمة المُرجَعة**

```returns
type: DateTime
description: كائن `DateTime` عند الساعة `23:59:59.999` من تاريخ اليوم في `zone`.
```

```js
import { endOfToday } from 'native-dates';

const cutoff = endOfToday('America/New_York');
cutoff.hour; // 23
cutoff.millisecond; // 999
```
:::
