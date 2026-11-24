---
source: 6f9a2cfc4ed9
title: duration()
lede: إنشاء كائن Duration من عبارة مدة بالإنجليزية أو سلسلة مدة ISO 8601 أو عدد ووحدة أو دوال الوحدات المساعدة.
---

## إنشاء المدد الزمنية

:::entry
### `duration()` :kind[function]

```js signature
duration(input, unit?): Duration
duration(input, options?): Duration
```

تُنشئ كائن [`Duration`](/api/duration/) من عدد ووحدة، أو عبارة مدة بالإنجليزية، أو سلسلة مدة ISO 8601، أو كائن حقول، أو عدد بالمللي ثانية. تبقى الحقول كما كُتبت حتى تستدعي [`balance()`](/api/duration/#balance)، فتبقى 90 دقيقة كما هي بدلًا من تحويلها إلى ساعة ونصف.

```js title="lengths.js"
import { duration } from 'native-dates';

const phrase = duration('1h 30m');
const words = duration('2 weeks and 3 days');
const iso = duration('PT1H30M');
const count = duration(90, 'minutes');
const spilled = duration(1.5, 'days');
const fields = duration({ hours: 1, minutes: 30 });
const ms = duration(1500);

spilled.days; // 1
spilled.hours; // 12
ms.seconds; // 0
ms.milliseconds; // 1500
```

**المعاملات**

```params
- name: input
  type: DurationInput
  required: true
  description: عدد مقترن بـ `unit`، أو عبارة مدة بالإنجليزية، أو سلسلة ISO 8601، أو كائن حقول، أو كائن `Duration`، أو عدد بالمللي ثانية.
- name: unitOrOptions
  type: "Unit | { locale?: Locale, loose?: boolean }"
  description: اسم الوحدة بالإنجليزية عندما يكون `input` عددًا، أو كائن خيارات.
  options:
    - name: locale
      type: Locale
      description: وسم الإعداد المحلي BCP 47 المحمول على كائن `Duration` المُرجَع وكل قيمة مشتقّة منه.
    - name: loose
      type: boolean
      default: 'false'
      description: إرجاع `null` عند تعذّر قراءة المدخل مع `@native-dates/plugins/loose`.
```

**القيمة المُرجَعة**

```returns
type: Duration
description: كائن `Duration` يحتفظ بالحقول كما كُتبت، أو `null` عندما يعجز الوضع المرن عن قراءة `input`.
```

عند استيراد [`@native-dates/plugins/loose`](/plugins/loose/)، يُرجع الوضع المرن `null` بدلًا من رمي خطأ عندما يتعذّر تحليل النص الذي أدخله المستخدم بوصفه مدة زمنية:

```js
import { duration } from 'native-dates';
import '@native-dates/plugins/loose';

duration('45 mins', { loose: true })?.minutes; // 45
duration('soon', { loose: true }); // null
```
:::

### المدخلات المقبولة

| المدخل | مثال | طريقة القراءة |
|---|---|---|
| عدد ووحدة | `duration(90, 'minutes')`، `duration(1.5, 'days')` | تقرن عددًا أو سلسلة رقمية بوحدة بالإنجليزية، مع ترحيل الكسور إلى الوحدة الأصغر التالية. |
| عبارة مدة بالإنجليزية | `'1h 30m'`، `'2 weeks and 3 days'`، `'-15m'` | تقرأ مقادير مفصولة بمسافات أو فواصل أو الكلمة `and` بأسماء الوحدات الإنجليزية الكاملة أو اختصاراتها. |
| سلسلة ISO 8601 | `'PT1H30M'`، `'P2W3D'` | تحلّل سلاسل المدد القياسية وفق ISO 8601. |
| كائن حقول | `{ hours: 1, minutes: 30 }` | تقرأ مفاتيح الوحدات بصيغتَي المفرد أو الجمع بشرط أن تشترك كل الحقول غير الصفرية في إشارة واحدة. |
| مللي ثانية | `duration(1500)`، `duration(0)` | تعامل العدد المجرّد أو السلسلة الرقمية بلا وحدة بوصفهما مللي ثانية. |
| كائن Duration أو Temporal | `hours(2)`، `Temporal.Duration` | تُرجع كائن `Duration` موجودًا دون تغيير أو تغلّف كائن `Temporal.Duration`. |

:::note[الوحدات الكسرية وتوحيد الإشارة]
تُرحَّل المقادير الكسرية إلى وحدات أصغر ثابتة، فيصبح `duration(1.5, 'days')` يومًا واحدًا و12 ساعة. ولأن الأشهر ليس لها عدد ثابت من الأيام، ترمي الأشهر الكسرية خطأ `RangeError`، شأنها شأن العبارات ذات الإشارات المختلطة مثل `'1h -30m'`.
:::

## دوال الوحدات المساعدة

تبني دوال الوحدات المساعدة مددًا أحادية الوحدة تُقرأ بسلاسة داخل استدعاءات الحساب والتعبيرات. تقبل كل دالة عددًا موجبًا أو سالبًا أو سلسلة رقمية.

```js
import { days, hours, minutes, today } from 'native-dates';

const reminder = today().plus(days(3)).at('9:00am');
const block = hours(1).plus(minutes(30));

block.format('short', 'en-US'); // '1 hr, 30 min'
```

:::entry
### `years()` :kind[function]

```js signature
years(count): Duration
```

تُنشئ مدة للعدد المحدّد من السنوات، مع ترحيل كسور السنوات إلى أشهر.
:::

:::entry
### `months()` :kind[function]

```js signature
months(count): Duration
```

تُنشئ مدة لعدد صحيح من الأشهر التقويمية.
:::

:::entry
### `weeks()` :kind[function]

```js signature
weeks(count): Duration
```

تُنشئ مدة للعدد المحدّد من الأسابيع، مع ترحيل الكسور إلى أيام.
:::

:::entry
### `days()` :kind[function]

```js signature
days(count): Duration
```

تُنشئ مدة للعدد المحدّد من الأيام التقويمية، مع ترحيل الكسور إلى ساعات.
:::

:::entry
### `hours()` :kind[function]

```js signature
hours(count): Duration
```

تُنشئ مدة للعدد المحدّد من الساعات، مع ترحيل الكسور إلى دقائق.
:::

:::entry
### `minutes()` :kind[function]

```js signature
minutes(count): Duration
```

تُنشئ مدة للعدد المحدّد من الدقائق، مع ترحيل الكسور إلى ثوانٍ.
:::

:::entry
### `seconds()` :kind[function]

```js signature
seconds(count): Duration
```

تُنشئ مدة للعدد المحدّد من الثواني، مع ترحيل الكسور إلى مللي ثانية.
:::

:::entry
### `milliseconds()` :kind[function]

```js signature
milliseconds(count): Duration
```

تُنشئ مدة للعدد المحدّد من المللي ثانية، مع ترحيل الكسور نزولًا إلى الميكرو ثانية والنانو ثانية.
:::
