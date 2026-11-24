---
source: bb49ea92ac08
title: time()
lede: إنشاء كائن Time من سلسلة ساعة بنظام 12 ساعة أو 24 ساعة أو من أعداد أو حقول أو طابع زمني.
---

## قراءة أوقات الساعة

:::entry
### `time()` :kind[function]

```js signature
time(input, options?): Time
time(input, zone?): Time
time(hour, minute?, second?): Time
```

تُنشئ كائن [`Time`](/api/time/) من سلسلة ساعة، أو من أجزاء ساعة بأعداد صحيحة، أو من كائن حقول، أو من طابع زمني. ترمي المدخلات المفقودة (مثل `null` أو `undefined` أو عند إغفالها) خطأ `TypeError` بدلًا من الرجوع افتراضيًا إلى وقت الساعة الحالي.

```js title="clock.js"
import { datetime, time } from 'native-dates';

const morning = time('9am');
const closing = time('5:30pm');
const iso = time('17:30:00');
const fromNumbers = time(9, 30);
const fromFields = time({ hour: 17, minute: 30, millisecond: 250 });
const fromInstant = time('2026-11-16T17:30:00Z', 'America/New_York');
const fromMoment = time(datetime('2026-11-16T17:30:00Z'), 'Europe/Berlin');
const fromTemporal = time(Temporal.PlainTime.from('08:15'));

closing.toString(); // '17:30:00'
fromInstant.toString(); // '12:30:00'
fromMoment.toString(); // '18:30:00'
```

**المعاملات**

```params
- name: input
  type: TimeInput | number
  required: true
  description: سلسلة ساعة، أو كائن حقول، أو وقت أو طابع زمني موجود، أو الساعة (`hour`) بنظام 24 ساعة من 0 إلى 23.
- name: options
  type: Zone | ReadOptions | number
  description: المنطقة الزمنية أو كائن خيارات عند قراءة طابع زمني أو سلسلة في الوضع المرن، أو الدقائق (`minute`) من 0 إلى 59.
  options:
    - name: zone
      type: Zone
      description: المنطقة الزمنية المستخدَمة لاستخراج وقت اليوم من سلسلة لحظة زمنية أو كائن `DateTime` أو `Date`.
    - name: locale
      type: Locale
      description: وسم الإعداد المحلي BCP 47 المحمول على كائن `Time` المُرجَع وكل قيمة مشتقّة منه.
    - name: loose
      type: boolean
      default: 'false'
      description: قراءة سلاسل التاريخ والوقت غير الرسمية وإرجاع `null` عند تعذّر قراءة المدخل مع `@native-dates/plugins/loose`.
    - name: dayFirst
      type: boolean
      description: تجاوز ترتيب التاريخ الرقمي للإعداد المحلي النشط عندما يحلّل الوضع المرن سلسلة تحتوي على تاريخ ووقت.
- name: second
  type: number
  description: عدد صحيح للثواني (`second`) من 0 إلى 59 عند تمرير أعداد؛ وتُكتب أجزاء الثانية في سلسلة نصية أو كائن حقول.
```

**القيمة المُرجَعة**

```returns
type: Time
description: كائن `Time` يمثّل وقت يوم، أو `null` عندما يعجز الوضع المرن عن قراءة `input`.
```

عند تحميل [إضافة `loose`](/plugins/loose/)، يحلّل الوضع المرن الأوقات المصحوبة بفترات اليوم الموطّنة، والأوقات المفصولة بنقطة في الإعدادات المحلية التي تستخدمها، وسلاسل الطوابع الزمنية غير الرسمية، ويُرجع `null` عند تعذّر قراءة المدخل:

```js
import { time } from 'native-dates';
import '@native-dates/plugins/loose';

time('오후 2:30', { loose: true, locale: 'ko' })?.toString(); // '14:30:00'
time('14.30', { loose: true, locale: 'fi' })?.toString(); // '14:30:00'
time('Mon, 16 Nov 2026 17:30:00 GMT', {
  zone: 'America/New_York',
  loose: true,
})?.toString(); // '12:30:00'
time('whenever', { loose: true }); // null
```
:::

## المدخلات المقبولة

تقبل سلاسل نظام 12 ساعة قيم الساعات من 1 إلى 12 متبوعةً بعلامة AM أو PM الإنجليزية؛ حيث يمثّل منتصف الليل 12 AM والظهر 12 PM.

| المدخل | مثال | طريقة القراءة |
|---|---|---|
| سلسلة ساعة بنظام 12 ساعة | `'9am'`، `'5:30pm'`، `'12:15 a.m.'` | تقرأ الساعات من 1 إلى 12 مع `am` أو `pm` ودقائق وثوانٍ وكسور اختيارية. |
| سلسلة ساعة بنظام 24 ساعة | `'09:00'`، `'14h30'`، `'17:30:15.250'` | تقرأ سلاسل 24 ساعة بنقطتين رأسيتين أو الحرف `h` بين الساعة والدقيقة، حتى دقة النانو ثانية. |
| سلسلة لحظة زمنية ISO | `'2026-11-16T17:30:00Z'` | تقرأ وقت الساعة المحلي لتلك اللحظة في المنطقة الزمنية الممرَّرة أو الافتراضية المضبوطة. |
| أعداد الساعة | `time(9)`، `time(9, 30)`، `time(17, 30, 15)` | تقبل أعدادًا صحيحة للساعة، مع دقائق وثوانٍ اختيارية. |
| كائن حقول | `{ hour: 9, minute: 30, millisecond: 250 }` | تقرأ حقول الساعة بصيغتَي المفرد أو الجمع وترفض الأعداد الخارجة عن النطاق. |
| [DateTime](/api/date-time/) أو Temporal | `time(dt, 'Asia/Tokyo')`، `Temporal.PlainTime` | تستخرج وقت اليوم، مع نقل اللحظات الزمنية إلى المنطقة الزمنية المحدّدة عند تمريرها. |
| كائن Date في JavaScript | `time(jsDate, 'America/New_York')` | تقرأ وقت الساعة لتلك اللحظة في المنطقة الزمنية الممرَّرة أو الافتراضية المضبوطة. |

:::tip[قراءة وقت اليوم الحالي]
اقرأ الساعة الحية في أي منطقة زمنية عبر [`now()`](/api/datetime-fn/#now)، مثل `now('Europe/Berlin').time`.
:::
