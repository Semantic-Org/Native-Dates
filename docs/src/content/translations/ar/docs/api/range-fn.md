---
source: 7f0f623e1e92
title: dateRange()
lede: إنشاء كائن DateRange أو DateTimeRange أو TimeRange من طرفين أو مدة أو سلسلة فترة نصية.
---

## إنشاء النطاقات

تُنشئ الدوال المصنعية المستقلة كائنات [النطاقات](/api/ranges/) من مدخلات خام أو أزواج أطراف أو سلاسل فترات مفردة. وإذا كان لديك كائن نقطة مُنَمَّط بالفعل، استدعِ [`to()`](/api/ranges/#to) أو [`range()`](/api/ranges/#range) عليه مباشرة.

:::entry
### `dateRange()` :kind[function]

```js signature
dateRange(start, end, options?): DateRange
dateRange(interval, options?): DateRange
```

تُنشئ كائن [`DateRange`](/api/ranges/#daterange) شاملًا للحدّين يمتدّ بين تاريخين تقويميين. وعندما يكون الوسيط الثاني عبارة مدة بالإنجليزية مثل `'7 days'`، يقع اليوم الأخير بعد تاريخ البداية بستة أيام بحيث يغطي النطاق سبعة أيام إجمالًا.

```js title="dates.js"
import { dateRange, days } from 'native-dates';

const fromEnds = dateRange('2026-09-01', '2026-09-07');
const fromLength = dateRange('2026-09-01', days(7));
const fromInterval = dateRange('2026-09-01/2026-09-07');

fromEnds.duration.days; // 7
fromLength.toString(); // '2026-09-01/2026-09-07'
fromInterval.equals(fromEnds); // true
```

**المعاملات**

```params
- name: start
  type: CalendarDateInput | string
  required: true
  description: مدخل تاريخ البداية، أو سلسلة فترة كاملة عند إغفال `end`.
- name: end
  type: CalendarDateInput | DurationInput | ReadOptions
  description: تاريخ النهاية الشامل، أو مقدار المدة الزمنية، أو كائن خيارات عندما يكون `start` سلسلة فترة.
- name: options
  type: Zone | ReadOptions
  description: المنطقة الزمنية أو خيارات القراءة المطبَّقة عند تحليل الطرفين.
  options:
    - name: zone
      type: Zone
      description: المنطقة الزمنية المستخدَمة لاستخراج الأيام التقويمية من سلاسل اللحظات الزمنية أو كائنات `Date`.
    - name: locale
      type: Locale
      description: وسم الإعداد المحلي BCP 47 المحمول على النطاق المُرجَع وطرفيه.
    - name: loose
      type: boolean
      default: 'false'
      description: تحليل سلاسل التواريخ غير الرسمية وإرجاع `null` عند تعذّر قراءة المدخل مع `@native-dates/plugins/loose`.
    - name: dayFirst
      type: boolean
      description: تجاوز ترتيب التاريخ الرقمي للإعداد المحلي النشط في الوضع المرن.
```

**القيمة المُرجَعة**

```returns
type: DateRange
description: كائن `DateRange` شامل للحدّين، أو `null` عندما يعجز الوضع المرن عن قراءة أحد الطرفين.
```
:::

:::entry
### `datetimeRange()` :kind[function]

```js signature
datetimeRange(start, end, options?): DateTimeRange
datetimeRange(interval, options?): DateTimeRange
```

تُنشئ كائن [`DateTimeRange`](/api/ranges/#datetimerange) بفترة نصف مفتوحة تشمل لحظة البداية مع استبعاد الحدّ الأعلى. وإذا خلا مدخل النهاية من منطقة زمنية صريحة، يُقرأ في المنطقة الزمنية للحظة البداية.

**المعاملات**

```params
- name: start
  type: DateTimeInput | string
  required: true
  description: مدخل لحظة البداية، أو سلسلة فترة عند إغفال `end`.
- name: end
  type: DateTimeInput | DurationInput | ReadOptions
  description: لحظة النهاية مع استبعاد الحدّ الأعلى، أو مقدار المدة الزمنية، أو كائن خيارات لسلسلة فترة.
- name: options
  type: Zone | ReadOptions
  description: المنطقة الزمنية أو خيارات القراءة مثل `zone` أو `locale` أو `loose` لكلا الطرفين.
```

**القيمة المُرجَعة**

```returns
type: DateTimeRange
description: كائن `DateTimeRange` نصف مفتوح مع استبعاد الحدّ الأعلى، أو `null` عندما يعجز الوضع المرن عن قراءة أحد الطرفين.
```

```js
import { datetimeRange } from 'native-dates';

const meeting = datetimeRange('2026-09-01T09:00', '90m', 'America/New_York');
meeting.end.format('short', 'en-US'); // '9/1/26, 10:30 AM'

const zoned = datetimeRange('2026-09-01T09:00[America/New_York]/2026-09-01T10:30[America/New_York]');
zoned.start.zone; // 'America/New_York'
```
:::

:::entry
### `timeRange()` :kind[function]

```js signature
timeRange(start, end, options?): TimeRange
timeRange(interval, options?): TimeRange
```

تُنشئ كائن [`TimeRange`](/api/ranges/#timerange) بفترة نصف مفتوحة بين وقتين من اليوم، مع استبعاد الحدّ الأعلى. وعندما يسبق وقت النهاية وقت البداية على الساعة، يلتفّ النطاق عبر منتصف الليل.

**المعاملات**

```params
- name: start
  type: TimeInput | string
  required: true
  description: مدخل وقت البداية، أو سلسلة فترة عند إغفال `end`.
- name: end
  type: TimeInput | DurationInput | ReadOptions
  description: وقت النهاية مع استبعاد الحدّ الأعلى، أو مدة بوحدات الساعة، أو كائن خيارات لسلسلة فترة.
- name: options
  type: Zone | ReadOptions
  description: المنطقة الزمنية أو خيارات القراءة مثل `zone` أو `locale` أو `loose` عند استخراج الأوقات من الطوابع الزمنية.
```

**القيمة المُرجَعة**

```returns
type: TimeRange
description: كائن `TimeRange` نصف مفتوح مع استبعاد الحدّ الأعلى، أو `null` عندما يعجز الوضع المرن عن قراءة أحد الطرفين.
```

```js
import { timeRange } from 'native-dates';

const office = timeRange('9am - 5pm');
const overnight = timeRange('22:00', '8h');

office.toString(); // '09:00:00/17:00:00'
overnight.toString(); // '22:00:00/06:00:00'
```
:::

## سلاسل الفترات والوضع المرن

تنقسم سلاسل الفترات المفردة عند الشرطة المائلة في ISO أو عند فواصل النطاق المحاطة بمسافات، مع إبقاء الشرطات المائلة داخل أسماء مناطق IANA الموضوعة بين قوسين معقوفين دون مساس.

| الصيغة | مثال | طريقة القراءة |
|---|---|---|
| فترة ISO بشرطة مائلة | `'2026-09-01/2026-09-07'`، `'09:00/17:00'` | تقسم عند `/` خارج أسماء المناطق الزمنية الموضوعة بين قوسين معقوفين، بمطابقة مخرجات [`toString()`](/api/ranges/#tostring). |
| شرطة أو شرطة متوسطة محاطة بمسافات | `'9am - 5pm'`، `'2026/09/01 - 2026/09/07'` | تقسم عند `-` أو `–` المحاطة بمسافات أولًا، ما يُبقي شرطات التواريخ وشرطاتها المائلة سليمة. |
| الفاصل الإنجليزي `to` | `'2026-09-01 to 2026-09-07'` | تقسم عند ` to ` المحاطة بمسافات. |
| بداية ومدة | `dateRange('2026-09-01', '7d')`، `timeRange('9am', '90m')` | تقرأ الوسيط الثاني كمدة عندما يكون كائن [`Duration`](/api/duration/) أو حقول مدة أو عبارة مدة بالإنجليزية. |

عند تحميل [إضافة `loose`](/plugins/loose/)، يحلّل الوضع المرن الطرفين غير الرسميين ويُرجع `null` عندما يتعذّر قراءة أحدهما:

```js
import { dateRange } from 'native-dates';
import '@native-dates/plugins/loose';

dateRange('Sep 1, 2026 to Sep 7, 2026', { loose: true })?.toString();
// '2026-09-01/2026-09-07'

dateRange('not a range', { loose: true }); // null
```
