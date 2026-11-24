---
source: 91937c1bc2c8
title: yearMonth()
lede: قراءة سلسلة سنة وشهر بصيغة ISO أو تاريخ انتهاء بطاقة أو أعداد أو تاريخ في كائن YearMonth.
---

## قراءة السنة والشهر

:::entry
### `yearMonth()` :kind[function]

```js signature
yearMonth(input, options?): YearMonth
yearMonth(input, zone?): YearMonth
yearMonth(year, month): YearMonth
```

تُنشئ كائن [`YearMonth`](/api/year-month/) من سلسلة بترتيب السنة أولًا، أو من عددَي السنة والشهر الذي يبدأ عدّه من 1، أو من كائن حقول، أو من أي تاريخ أو طابع زمني بعد إسقاط يومه. ترمي المدخلات المفقودة خطأ `TypeError` بدلًا من الرجوع افتراضيًا إلى الشهر الحالي.

```js title="billing.js"
import { datetime, yearMonth } from 'native-dates';

const fromIso = yearMonth('2026-11');
const fromNumbers = yearMonth(2026, 11);
const fromFields = yearMonth({ year: 2026, month: 11 });
const fromDate = yearMonth('2026-11-16');
const fromInstant = yearMonth(datetime('2026-11-01T02:00:00Z'), 'America/Los_Angeles');

fromNumbers.toString(); // '2026-11'
fromInstant.toString(); // '2026-10'
```

**المعاملات**

```params
- name: input
  type: YearMonthInput | number | string
  required: true
  description: سلسلة سنة وشهر بصيغة ISO، أو كائن حقول، أو تاريخ أو طابع زمني، أو السنة التقويمية (`year`).
- name: options
  type: Zone | ReadOptions | number | string
  description: المنطقة الزمنية أو كائن خيارات عند قراءة طابع زمني أو سلسلة في الوضع المرن، أو رقم الشهر (`month`) من 1 إلى 12.
  options:
    - name: zone
      type: Zone
      description: المنطقة الزمنية المستخدَمة لتحديد الشهر التقويمي لسلسلة لحظة زمنية أو كائن `DateTime` أو `Date`.
    - name: locale
      type: Locale
      description: وسم الإعداد المحلي BCP 47 المحمول على كائن `YearMonth` المُرجَع وكل قيمة مشتقّة منه.
    - name: loose
      type: boolean
      default: 'false'
      description: "قراءة أسماء الأشهر الإنجليزية أو الموطّنة مثل `'février 2026'` وإرجاع `null` عند تعذّر قراءة المدخل مع `@native-dates/plugins/loose`."
```

**القيمة المُرجَعة**

```returns
type: YearMonth
description: كائن `YearMonth` بلا يوم، أو `null` عندما يعجز الوضع المرن عن قراءة `input`.
```

عند تحميل [إضافة `loose`](/plugins/loose/)، يحلّل الوضع المرن أسماء الأشهر بالإنجليزية أو وفق `locale` النشط مقترنة بسنة من أربعة أرقام، ويُرجع `null` عند تعذّر قراءة السلسلة:

```js
import { yearMonth } from 'native-dates';
import '@native-dates/plugins/loose';

yearMonth('Nov 2026', { loose: true })?.toString(); // '2026-11'
yearMonth('février 2026', { loose: true, locale: 'fr' })?.toString(); // '2026-02'
yearMonth('not-a-month', { loose: true }); // null
```
:::

:::entry
### `monthYear()` :kind[function]

```js signature
monthYear(input, options?): YearMonth
monthYear(month, year): YearMonth
```

تقرأ السلاسل والأعداد بترتيب الشهر أولًا بالصيغة المطبوعة على بطاقات الدفع، مثل `'11/26'`. تُضاف السنوات المكونة من رقمين من 0 إلى 99 إلى [`YearMonth.century`](/api/year-month/#properties) التي تساوي 2000 افتراضيًا.

تظل سلاسل ISO المكتوبة بصيغة `'2026-11'` تُقرأ بترتيب السنة أولًا في كلتا الدالتين، فتنتقل القيم المحوَّلة إلى نصوص ذهابًا وإيابًا بسلامة تامة.

**المعاملات**

```params
- name: input
  type: YearMonthInput | number | string
  required: true
  description: "سلسلة انتهاء صلاحية بطاقة مثل `'11/26'`، أو أي قيمة من نوع `YearMonthInput`، أو رقم الشهر (`month`) من 1 إلى 12."
- name: options
  type: Zone | ReadOptions | number | string
  description: المنطقة الزمنية، أو خيارات القراءة بما فيها `locale`، أو السنة (`year`) من رقمين أو أربعة أرقام عند تمرير عددين.
```

**القيمة المُرجَعة**

```returns
type: YearMonth
description: كائن `YearMonth`، أو `null` عندما يعجز الوضع المرن عن قراءة `input`.
```

```js
import { monthYear } from 'native-dates';

monthYear('11/26').toString(); // '2026-11'
monthYear('05/2028').toString(); // '2028-05'
monthYear(11, 26).toString(); // '2026-11'
monthYear('2026-11').toString(); // '2026-11'
```
:::

## المدخلات المقبولة

تمتدّ الأشهر من 1 ليناير حتى 12 لديسمبر في الأعداد والسلاسل وكائنات الحقول كافة.

| المدخل | مثال | طريقة القراءة |
|---|---|---|
| سلسلة بترتيب السنة أولًا | `'2026-11'`، `'2026/11'`، `'2026年11月'` | تقرأ سنة من 4 أرقام وشهرًا من رقم أو رقمين عبر أي فاصل غير الأحرف اللاتينية أو النقطتين الرأسيتين. |
| سلسلة انتهاء بطاقة | `monthYear('11/26')`، `monthYear('11.2026')` | تقرأ الشهر أولًا عبر `/` أو `-` أو `.` وتوسّع السنوات ذات الرقمين باستخدام `YearMonth.century`. |
| عددان | `yearMonth(2026, 11)`، `monthYear(11, 26)` | تقبل عددين صحيحين بترتيب السنة ثم الشهر أو الشهر ثم السنة. |
| كائن حقول | `{ year: 2026, month: 11 }` | تقرأ حقول التقويم التي يبدأ عدّها من 1 وترفض الأشهر خارج النطاق من 1 إلى 12. |
| تاريخ أو طابع زمني | `'2026-11-16'`، `datetime(...)`، `new Date()` | تستخرج الشهر التقويمي في المنطقة الزمنية الممرَّرة أو الافتراضية المضبوطة وتُسقط اليوم. |
| اسم شهر في الوضع المرن | `'Nov 2026'`، `'février 2026'` | تقرأ أسماء الأشهر الإنجليزية أو الخاصة بالإعداد المحلي النشط مقترنة بسنة من 4 أرقام في الوضع المرن. |
| قيمة Temporal | `Temporal.PlainYearMonth`، `Temporal.PlainDate` | تغلّف قيم Temporal القياسية وفق ISO 8601 مباشرة. |

:::tip[قراءة الشهر الحالي]
اقرأ الشهر التقويمي النشط في أي منطقة زمنية عبر [`today()`](/api/date-fn/#today)، مثل `today('Asia/Tokyo').yearMonth`.
:::
