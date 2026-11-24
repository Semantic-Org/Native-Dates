---
source: 09d43cd55ced
title: YearMonth
lede: سنة وشهر تقويميان بلا يوم، لدورات الفوترة وتواريخ انتهاء البطاقات ومنتقيات الأشهر.
---

## إنشاء كائن YearMonth

أنشئ كائنًا من سلسلة ISO، أو من رقمي السنة والشهر، أو من تاريخ موجود باستخدام [`yearMonth()`](/api/year-month-fn/)، أو اقرأ سلاسل انتهاء البطاقات بترتيب الشهر أولًا عبر [`monthYear()`](/api/year-month-fn/#monthyear). الكائنات غير قابلة للتعديل، لذلك تُرجع كل طريقة تُعدِّل القيمة كائنًا جديدًا.

```js title="create.js"
import { monthYear, yearMonth } from 'native-dates';

const billing = yearMonth('2026-11');
const quarterEnd = yearMonth(2026, 12);
const expiry = monthYear('11/26');
```

اقرأ السنة والشهر من أي [تاريخ تقويمي](/api/calendar-date/) أو [لحظة زمنية](/api/date-time/) عبر الخاصية `yearMonth`، أو حوّل داخل سلسلة استدعاءات باستخدام `as('yearMonth')`:

```js
import { date, datetime, today } from 'native-dates';

date('2026-11-16').yearMonth.toString(); // '2026-11'
datetime('2026-11-01T02:00:00Z', 'America/Los_Angeles').as('yearMonth').toString(); // '2026-10'
const currentMonth = today().yearMonth;
```

## الخصائص

تقرأ الخصائص السنة والشهر وفق ISO والحدود التقويمية المحيطة بهما.

| الخاصية | النوع | الوصف |
|---|---|---|
| `text` | `string` | الشهر والسنة منسّقان وفق الإعداد المحلي، مثل `'Nov 2026'`. |
| `year`، `month` | `number` | السنة التقويمية والشهر بعدّ يبدأ من 1 حتى 12. |
| `quarter` | `number` | الربع التقويمي من 1 إلى 4. |
| `daysInMonth`، `daysInYear` | `number` | عدد أيام هذا الشهر من 28 إلى 31، وعدد أيام هذه السنة (365 أو 366). |
| `start`، `end` | [`CalendarDate`](/api/calendar-date/) | أول يوم تقويمي في هذا الشهر وآخره. |
| `YearMonth.century` | `number` | القرن الأساسي المضاف إلى السنوات المكوّنة من رقمين في [`monthYear()`](/api/year-month-fn/#monthyear)، وقيمته الافتراضية `2000`. |

## العمليات الحسابية والحقول

انتقل للأمام أو للخلف بالأشهر أو الأرباع أو السنوات، أو استبدل الحقول، أو اختر يومًا محدّدًا في الشهر.

:::note[وحدات الأشهر والسنوات فقط]
ترمي الوحدات الأصغر من الشهر خطأ `RangeError` لأن السنة والشهر لا يحملان يومًا. استدعِ [`on()`](#on) لتحديد يوم أولًا عندما تحتاج إلى عمليات حسابية بالأسابيع أو الأيام.
:::

:::entry
### `plus()` :kind[method]

```js signature
ym.plus(amount, unit?): YearMonth
ym.add(amount, unit?): YearMonth
```

تنتقل للأمام بالسنوات أو الأرباع أو الأشهر وتُرجع كائن `YearMonth` جديدًا. يتوفر لها الاسم البديل `add()`.

**المعاملات**

```params
- name: amount
  type: DurationInput
  required: true
  description: عدد مقترن بـ `unit`، أو كائن `Duration`، أو عبارة مدة بالإنجليزية أو سلسلة ISO 8601، أو كائن حقول.
- name: unit
  type: Unit
  description: اسم وحدة شهر أو ربع أو سنة بالإنجليزية عندما يكون `amount` رقمًا.
```

**القيمة المُرجَعة**

```returns
type: YearMonth
description: كائن `YearMonth` جديد بعد التقدّم على التقويم.
```

```js
const billing = yearMonth('2026-11');

billing.plus(3, 'months').toString(); // '2027-02'
billing.plus('1 year').toString(); // '2027-11'
```
:::

:::entry
### `minus()` :kind[method]

```js signature
ym.minus(amount, unit?): YearMonth
ym.subtract(amount, unit?): YearMonth
```

تنتقل للخلف بالسنوات أو الأرباع أو الأشهر وتُرجع كائنًا جديدًا. تقبل المدخلات نفسها التي تقبلها [`plus()`](#plus)، وتعمل `subtract()` اسمًا بديلًا.

**المعاملات**

```params
- name: amount
  type: DurationInput
  required: true
  description: عدد مقترن بـ `unit`، أو كائن `Duration`، أو عبارة مدة بالإنجليزية أو سلسلة ISO 8601، أو كائن حقول.
- name: unit
  type: Unit
  description: اسم وحدة شهر أو ربع أو سنة بالإنجليزية عندما يكون `amount` رقمًا.
```

**القيمة المُرجَعة**

```returns
type: YearMonth
description: كائن `YearMonth` جديد بعد التراجع على التقويم.
```

```js
yearMonth('2026-11').minus(1, 'year').toString(); // '2025-11'
```
:::

:::entry
### `set()` :kind[method]

```js signature
ym.set(fields): YearMonth
ym.set(unit, value): YearMonth
```

تُرجع كائن `YearMonth` جديدًا بعد استبدال السنة أو الشهر أو كليهما. ترمي الأشهر الخارجة عن النطاق والوحدات الأصغر من الشهر خطأ `RangeError`.

**المعاملات**

```params
- name: fields
  type: Partial<YearMonthFields> | Unit
  required: true
  description: كائن يضمّ حقل `year` أو `month`، أو اسم وحدة واحد بالإنجليزية.
- name: value
  type: number
  description: قيمة عددية صحيحة عند تمرير اسم وحدة.
```

**القيمة المُرجَعة**

```returns
type: YearMonth
description: كائن `YearMonth` جديد بالحقول التقويمية المحدّثة.
```

```js
const billing = yearMonth('2026-11');

billing.set('month', 2).toString(); // '2026-02'
billing.set({ year: 2028, month: 2 }).daysInMonth; // 29
```
:::

:::entry
### `on()` :kind[method]

```js signature
ym.on(day): CalendarDate
```

تضع رقم يوم صحيحًا من 1 إلى 31 داخل هذا الشهر وتُرجع كائن [`CalendarDate`](/api/calendar-date/). يُقيَّد اليوم 31 بآخر يوم في الأشهر الأقصر مثل فبراير أو أبريل، بينما ترمي الأرقام الخارجة عن 1 إلى 31 خطأ `RangeError`.

**المعاملات**

```params
- name: day
  type: number | string
  required: true
  description: رقم يوم صحيح في الشهر من 1 إلى 31.
```

**القيمة المُرجَعة**

```returns
type: CalendarDate
description: كائن `CalendarDate` المقابل لذلك اليوم من الشهر.
```

```js
yearMonth('2026-11').on(15).toString(); // '2026-11-15'
yearMonth('2026-02').on(31).toString(); // '2026-02-28'
yearMonth('2028-02').on(31).toString(); // '2028-02-29'
```
:::

## المقارنة والاحتواء

قارن بين قيم السنة والشهر زمنيًا أو تحقّق مما إذا كان يوم تقويمي يقع داخل الشهر. ترمي عوامل المقارنة مثل `<` خطأ، بينما تُفرز المصفوفات بسلاسة باستخدام [`compare()`](/api/compare/) و[الدوال المساعدة للحدود](/api/compare/#earliest).

:::entry
### `compare()` :kind[method]

```js signature
ym.compare(other): -1 | 0 | 1
```

ترتّب هذه السنة والشهر مقابل قيمة أخرى، وتُرجع رقمًا سالبًا أو صفرًا أو موجبًا لأغراض الفرز. عند تمرير تاريخ كامل أو طابع زمني تجري المقارنة مع الشهر الذي يقع فيه.

**المعاملات**

```params
- name: other
  type: YearMonthInput
  required: true
  description: كائن `YearMonth` آخر أو أي مدخل تقبله `yearMonth()`.
```

**القيمة المُرجَعة**

```returns
type: -1 | 0 | 1
description: "`-1` عندما يكون أقدم، و`0` عند التساوي، و`1` عندما يكون أحدث."
```

```js
yearMonth('2026-05').compare('2026-11'); // -1
yearMonth('2026-11').compare('2026-11-16'); // 0
```
:::

:::entry
### `equals()` :kind[method]

```js signature
ym.equals(other): boolean
```

تُرجع `true` عندما تمثّل القيمتان السنة والشهر نفسيهما.

```js
yearMonth('2026-11').equals(yearMonth(2026, 11)); // true
```
:::

:::entry
### `isBefore()` :kind[method]

```js signature
ym.isBefore(other): boolean
```

تُرجع `true` عندما تسبق هذه السنة وهذا الشهر القيمة الأخرى.

```js
yearMonth('2026-10').isBefore('2026-11'); // true
```
:::

:::entry
### `isAfter()` :kind[method]

```js signature
ym.isAfter(other): boolean
```

تُرجع `true` عندما تأتي هذه السنة وهذا الشهر بعد القيمة الأخرى.

```js
yearMonth('2026-12').isAfter('2026-11'); // true
```
:::

:::entry
### `contains()` :kind[method]

```js signature
ym.contains(day): boolean
ym.includes(day): boolean
```

تُرجع `true` عندما يقع التاريخ التقويمي أو الطابع الزمني المعطى داخل هذه السنة وهذا الشهر. يتوفر لها الاسم البديل `includes()`.

**المعاملات**

```params
- name: day
  type: CalendarDateInput
  required: true
  description: سلسلة تاريخ، أو `CalendarDate`، أو `DateTime`، أو كائن حقول، أو `Date`.
```

**القيمة المُرجَعة**

```returns
type: boolean
description: "`true` عندما يقع `day` داخل هذا الشهر."
```

```js
const nov = yearMonth('2026-11');

nov.contains('2026-11-16'); // true
nov.contains('2026-12-01'); // false
```
:::

:::entry
### `isPast()` :kind[method]

```js signature
ym.isPast(zone?): boolean
```

تُرجع `true` بمجرد أن يصبح هذا الشهر كاملًا أقدم من شهر اليوم في المنطقة الزمنية الممرَّرة أو المضبوطة.

```js
yearMonth('2020-01').isPast('UTC'); // true
```
:::

:::entry
### `isFuture()` :kind[method]

```js signature
ym.isFuture(zone?): boolean
```

تُرجع `true` ما دام هذا الشهر لا يزال بعد شهر اليوم في المنطقة الزمنية الممرَّرة أو المضبوطة.

```js
yearMonth('2099-01').isFuture('UTC'); // true
```
:::

:::entry
### `isLeapYear()` :kind[method]

```js signature
ym.isLeapYear(): boolean
```

تُرجع `true` عندما تتكوّن السنة التقويمية لهذا الشهر من 366 يومًا.

```js
yearMonth('2028-02').isLeapYear(); // true
yearMonth('2026-02').isLeapYear(); // false
```
:::

## قياس المدد

:::entry
### `until()` :kind[method]

```js signature
ym.until(other): Duration
ym.until(other, unit): number
```

تقيس المدة من هذا الشهر إلى شهر آخر، وتُرجع مدة سالبة عندما يكون الهدف أقدم. يحتفظ كائن [`Duration`](/api/duration/) المُرجَع ببداية هذا الشهر حتى يمكن حساب إجمالي الأشهر والسنوات بأي وحدة.

**المعاملات**

```params
- name: other
  type: YearMonthInput
  required: true
  description: السنة والشهر الهدف لقياس المدة نحوهما.
- name: unit
  type: Unit
  description: اسم الوحدة بالإنجليزية لإرجاع إجمالي المدة برقم عشري.
```

**القيمة المُرجَعة**

```returns
type: Duration | number
description: كائن `Duration` من السنوات والأشهر، أو رقم عند تمرير `unit`.
```

```js
const start = yearMonth('2026-03');

start.until('2027-06').toString(); // 'P1Y3M'
start.until('2027-06', 'months'); // 15
```
:::

:::entry
### `since()` :kind[method]

```js signature
ym.since(other): Duration
ym.since(other, unit): number
```

تقيس المدة المنقضية منذ سنة وشهر أقدم. مرّر اسم وحدة بالإنجليزية للحصول على الإجمالي بقيمة رقمية.

```js
yearMonth('2026-11').since('2026-05', 'months'); // 6
```
:::

## التنسيق والتحويل

:::entry
### `format()` :kind[method]

```js signature
ym.format(spec?, locale?): string
```

تنسّق السنة والشهر باستخدام القوالب الجاهزة المسمّاة، أو كائنات خيارات `Intl`، أو أنماط الرموز المضمّنة مثل `'MM/YY'`. تستبعد كائنات الخيارات المشتركة مفاتيح اليوم والساعة والمنطقة الزمنية تلقائيًا.

تطبع القوالب الجاهزة القياسية والموطَّنة السنة والشهر فقط، وتعمل التنسيقات المخصّصة المسجّلة في [`configure()`](/api/configure/) هنا أيضًا. راجع [التنسيق](/guides/formatting/) للاطلاع على جداول القوالب الجاهزة والرموز الكاملة.

**المعاملات**

```params
- name: spec
  type: FormatSpec
  default: "'medium'"
  description: اسم قالب جاهز مثل `'medium'` أو `'long'`، أو كائن خيارات `Intl`، أو نمط رموز.
- name: locale
  type: Locale
  description: وسم إعداد محلي BCP 47 يتجاوز الإعداد المحلي لهذا الشهر أو الإعداد العام لهذا الاستدعاء فقط.
```

**القيمة المُرجَعة**

```returns
type: string
description: سلسلة نصية منسّقة للشهر والسنة.
```

```js
const nov = yearMonth('2026-11');

nov.format('short', 'en-US'); // '11/2026'
nov.format('medium', 'en-US'); // 'Nov 2026'
nov.format('long', 'en-US'); // 'November 2026'
nov.format('L', 'en-US'); // '11/2026'
nov.format('MM/YY'); // '11/26'
```
:::

:::entry
### `locale()` :kind[method]

```js signature
ym.locale(): Locale | undefined
ym.locale(tag): YearMonth
```

تقرأ الإعداد المحلي المحفوظ مع هذا الشهر، أو تُرجع نسخة منسّقة بإعداد محلي آخر عبر المعاينات النصية والقوالب الجاهزة وكل قيمة مشتقّة منه. يؤدي تمرير وسم فارغ إلى مسح الإعداد المحلي المحفوظ، وتعمل [`lang()`](#lang) اسمًا بديلًا.

**المعاملات**

```params
- name: tag
  type: Locale | null | undefined
  description: وسم إعداد محلي BCP 47 يُحفظ مع النسخة الجديدة، أو `null` لمسح الوسم الحالي.
```

**القيمة المُرجَعة**

```returns
type: YearMonth | Locale | undefined
description: الوسم النشط عند الاستدعاء بلا معاملات، أو كائن `YearMonth` جديد يحمل `tag`.
```

```js
const may = yearMonth('2026-05').locale('ru');

may.locale(); // 'ru'
may.format('long'); // 'май 2026 г.'
may.on(1).format('long'); // '1 мая 2026 г.'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
ym.lang(): Locale | undefined
ym.lang(tag): YearMonth
```

اسم بديل مختصر للطريقة [`locale()`](#locale) يقرأ وسم الإعداد المحلي BCP 47 على هذا الشهر أو يربطه بوسم جديد.
:::

:::entry
### `as()` :kind[method]

```js signature
ym.as('yearMonth'): YearMonth
```

تُرجع هذا الكائن عند طلب `'yearMonth'` في سلاسل التحويل العامة، وترمي خطأ `RangeError` للأنواع الأخرى.
:::

:::entry
### `toString()` :kind[method]

```js signature
ym.toString(): string
ym.toJSON(): string
```

تُرجع سلسلة السنة والشهر بصيغة ISO 8601، بما يطابق حقول إدخال الأشهر في نماذج HTML. وتُرجع `toJSON()` السلسلة نفسها لتسلسل JSON.

**القيمة المُرجَعة**

```returns
type: string
description: سلسلة سنة وشهر بصيغة ISO 8601، مثل `'2026-11'`.
```

```js
yearMonth(2026, 11).toString(); // '2026-11'
JSON.stringify({ billing: yearMonth(2026, 11) }); // '{"billing":"2026-11"}'
```
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
ym.toTemporal(): Temporal.PlainYearMonth
```

تُرجع كائن `Temporal.PlainYearMonth` الأساسي.
:::

:::entry
### `valueOf()` :kind[method]

```js signature
ym.valueOf(): never
```

ترمي خطأ `RangeError` حتى لا تحوّل العوامل الرقمية قيمة السنة والشهر إلى رقم. ضيّق نوع القيم غير المعروفة باستخدام [`isYearMonth()`](/api/kind-of/#isyearmonth) أو [`kindOf()`](/api/kind-of/).
:::
