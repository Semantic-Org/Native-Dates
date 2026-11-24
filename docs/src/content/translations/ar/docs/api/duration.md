---
source: 05899a15dfff
title: Duration
lede: مدة زمنية عبر الوحدات التقويمية ووحدات الساعة.
---

## إنشاء كائن Duration

حلّل عبارات المدة بالإنجليزية وسلاسل ISO 8601 باستخدام [`duration()`](/api/duration-fn/)، أو استدعِ دوال الوحدات المساعدة مثل [`hours()`](/api/duration-fn/#hours)، أو قِس المدة الفاصلة بين تاريخين أو وقتين. الكائنات غير قابلة للتعديل، لذلك تُرجع كل طريقة قيمة جديدة.

```js title="create.js"
import { date, days, duration, hours } from 'native-dates';

const breakTime = duration('1h 30m');
const trial = days(14);
const timeout = hours(1.5);
const quarter = date('2026-01-01').until('2026-04-01');
```

:::note[تبقى الحقول كما كُتبت]
عند إنشاء مدة من 90 دقيقة تبقى قيمة `minutes` تساوي `90` بدل تحويلها إلى ساعة و30 دقيقة. كذلك تبقى الأيام التقويمية منفصلة عن الساعات عبر تبدّلات التوقيت الصيفي إلى أن تستدعي [`balance()`](#balance).
:::

## الخصائص

تعكس الخصائص أعداد الوحدات المخزّنة في كائن المدة.

| الخاصية | النوع | الوصف |
|---|---|---|
| `text` | `string` | المدة منسّقة وفق الإعداد المحلي بالنمط الطويل، مثل `'1 hour, 30 minutes'`. |
| `years`، `months`، `weeks`، `days` | `number` | أعداد الوحدات التقويمية بإشارتها المخزّنة في هذه المدة. |
| `hours`، `minutes`، `seconds` | `number` | أعداد وحدات الساعة بإشارتها. |
| `milliseconds`، `microseconds`، `nanoseconds` | `number` | أعداد الوحدات الأصغر من الثانية بإشارتها. |
| `sign` | `number` | الاتجاه العام للمدة: `1` أو `0` أو `-1`. |
| `anchor` | `TemporalValue` | نقطة البداية التي سجّلتها [`until()`](/api/date-time/#until) أو [`since()`](/api/date-time/#since)، أو `undefined` في المدد المستقلة. |

## العمليات الحسابية والإشارة

اجمع المدد، أو اضربها في معامل، أو اعكس إشارتها. يجب أن تشترك جميع الحقول غير الصفرية في المدة في الإشارة نفسها.

:::entry
### `plus()` :kind[method]

```js signature
dur.plus(other, unit?): Duration
dur.add(other, unit?): Duration
```

تضيف مدة أخرى وتُرجع كائن `Duration` جديدًا. تُجمع الوحدات التقويمية حقلًا بحقل، بينما تندمج وحدات الساعة معًا بسلاسة، وتعمل `add()` اسمًا بديلًا.

**المعاملات**

```params
- name: other
  type: DurationInput
  required: true
  description: عدد مقترن بـ `unit`، أو كائن `Duration`، أو عبارة مدة بالإنجليزية أو سلسلة ISO 8601، أو كائن حقول، أو عدد بالمللي ثانية.
- name: unit
  type: Unit
  description: اسم الوحدة بالإنجليزية عندما يكون `other` رقمًا، مثل `'minutes'` أو `'days'`.
```

**القيمة المُرجَعة**

```returns
type: Duration
description: كائن `Duration` جديد يجمع المدتين.
```

```js
hours(2).plus(30, 'minutes').toString(); // 'PT2H30M'
days(1).plus('6h').toString(); // 'P1DT6H'
```
:::

:::entry
### `minus()` :kind[method]

```js signature
dur.minus(other, unit?): Duration
dur.subtract(other, unit?): Duration
```

تطرح مدة أخرى، مع الاستلاف بين السنوات والأشهر أو بين الأسابيع والأيام عند الحاجة. يرمي طرح وحدات غير متوافقة ومتعاكسة الإشارة (مثل الأيام ناقص الساعات) خطأ `RangeError`، وتعمل `subtract()` اسمًا بديلًا.

**المعاملات**

```params
- name: other
  type: DurationInput
  required: true
  description: عدد مقترن بـ `unit`، أو كائن `Duration`، أو عبارة مدة بالإنجليزية أو سلسلة ISO 8601، أو كائن حقول، أو عدد بالمللي ثانية.
- name: unit
  type: Unit
  description: اسم الوحدة بالإنجليزية عندما يكون `other` رقمًا.
```

**القيمة المُرجَعة**

```returns
type: Duration
description: كائن `Duration` جديد بعد طرح `other`.
```

```js
import { months, weeks, years } from 'native-dates';

hours(2).minus('30m').toString(); // 'PT1H30M'
years(1).minus(months(1)).toString(); // 'P11M'
weeks(1).minus(days(1)).toString(); // 'P6D'
```
:::

:::entry
### `times()` :kind[method]

```js signature
dur.times(factor): Duration
```

تضرب كل حقل في رقم، وترحّل الأجزاء الكسرية إلى الوحدات الأصغر.

**المعاملات**

```params
- name: factor
  type: number
  required: true
  description: معامل الضرب، بما في ذلك الأعداد الكسرية والسالبة.
```

**القيمة المُرجَعة**

```returns
type: Duration
description: كائن `Duration` جديد بعد الضرب.
```

```js
hours(1).times(1.5).toString(); // 'PT1H30M'
days(1).times(3).toString(); // 'P3D'
```
:::

:::entry
### `abs()` :kind[method]

```js signature
dur.abs(): Duration
```

تُرجع نسخة جديدة تكون جميع حقولها موجبة.

```js
duration('-1h 30m').abs().toString(); // 'PT1H30M'
```
:::

:::entry
### `negated()` :kind[method]

```js signature
dur.negated(): Duration
```

تعكس إشارة كل حقل في المدة.

```js
hours(2).negated().toString(); // '-PT2H'
```
:::

## الموازنة والتقريب والإجمالي

رحّل الوحدات الأصغر إلى وحدات أكبر، أو قرّب المدة إلى دقة محدّدة، أو عبّر عن المدة الكاملة برقم واحد.

:::warning[تحويل الأشهر والسنوات إلى أيام]
تُوازَن مدد الأشهر والسنوات الخالصة ويُحسَب إجماليها وتُقارَن فيما بينها على أساس 12 شهرًا في السنة. أما تحويلها إلى أسابيع أو أيام أو وحدات ساعة فيتطلّب تاريخ بداية مسجّلًا عبر [`until()`](/api/calendar-date/#until) أو [`since()`](/api/calendar-date/#since)، لأن عدد أيام الأشهر التقويمية يختلف من شهر إلى آخر.
:::

:::entry
### `balance()` :kind[method]

```js signature
dur.balance(largestUnit?): Duration
```

ترحّل الفائض من الوحدات الأصغر إلى الوحدات الأكبر. افتراضيًا، ترحّل المدد المستقلة وحدات الساعة حتى الساعات، وترحّل الأشهر إلى سنوات، بينما تتوازن المدد المقاسة حتى الأيام ما لم تمرّر وحدة هدف أكبر.

**المعاملات**

```params
- name: largestUnit
  type: Unit
  description: أكبر وحدة بالإنجليزية لترحيل القيم إليها، مثل `'hour'` أو `'day'` أو `'week'`.
```

**القيمة المُرجَعة**

```returns
type: Duration
description: كائن `Duration` جديد ومتوازن.
```

```js
import { minutes, months } from 'native-dates';

minutes(150).balance().toString(); // 'PT2H30M'
months(18).balance().toString(); // 'P1Y6M'
duration('36h').balance('day').toString(); // 'P1DT12H'
duration('10d').balance('week').toString(); // 'P1W3D'
```
:::

:::entry
### `total()` :kind[method]

```js signature
dur.total(unit): number
dur.as(unit): number
```

تُرجع إجمالي المدة برقم عشري واحد في الوحدة المطلوبة. يتوفر لها الاسم البديل [`as()`](#as) لتسهيل سلاسل الاستدعاءات.

**المعاملات**

```params
- name: unit
  type: Unit
  required: true
  description: اسم الوحدة الهدف بالإنجليزية للتعبير عن إجمالي المدة، مثل `'hours'` أو `'days'`.
```

**القيمة المُرجَعة**

```returns
type: number
description: إجمالي المدة بوحدة `unit`، بما في ذلك الجزء الكسري.
```

```js
import { months } from 'native-dates';

minutes(90).total('hours'); // 1.5
months(18).total('years'); // 1.5
date('2026-01-01').until('2026-04-01').total('days'); // 90
```
:::

:::entry
### `as()` :kind[method]

```js signature
dur.as(unit): number
```

اسم بديل قابل للتسلسل للطريقة [`total()`](#total) يحوّل المدة إلى قيمة رقمية بالوحدة المحدّدة بالإنجليزية.

```js
hours(36).as('days'); // 1.5
date('2026-11-01').until('2026-11-16').as('days'); // 15
```
:::

:::entry
### `round()` :kind[method]

```js signature
dur.round(smallestUnit): Duration
```

تقرّب المدة إلى أقرب وحدة صحيحة، مع حسم حالات المنتصف بالتقريب بعيدًا عن الصفر.

**المعاملات**

```params
- name: smallestUnit
  type: Unit
  required: true
  description: أصغر وحدة بالإنجليزية تُحفظ بعد التقريب، مثل `'minute'` أو `'hour'`.
```

**القيمة المُرجَعة**

```returns
type: Duration
description: كائن `Duration` جديد بعد التقريب.
```

```js
minutes(90).round('hour').toString(); // 'PT2H'
duration('1h 20m').round('hour').toString(); // 'PT1H'
```
:::

## مقارنة المدد

تُقارَن المدد حسب إجمالي مدتها لا حسب طريقة كتابة حقولها، فمدة 60 دقيقة تساوي ساعة واحدة.

:::entry
### `equals()` :kind[method]

```js signature
dur.equals(other): boolean
```

تُرجع `true` عندما تمثّل المدتان المدة الإجمالية نفسها.

**المعاملات**

```params
- name: other
  type: DurationInput
  required: true
  description: كائن `Duration` آخر أو أي مدخل تقبله `duration()` بما في ذلك عبارات المدة بالإنجليزية.
```

**القيمة المُرجَعة**

```returns
type: boolean
description: "`true` إذا كانت المدتان متساويتين في إجمالي المدة."
```

```js
import { months, years } from 'native-dates';

hours(1).equals(minutes(60)); // true
years(1).equals(months(12)); // true
```
:::

:::entry
### `compare()` :kind[method]

```js signature
dur.compare(other): number
```

ترتّب هذه المدة مقابل مدة أخرى حسب إجمالي المدة لأغراض الفرز.

**المعاملات**

```params
- name: other
  type: DurationInput
  required: true
  description: المدة المراد المقارنة بها (كائن `Duration` أو أي مدخل تقبله `duration()`، بما في ذلك عبارات المدة بالإنجليزية).
```

**القيمة المُرجَعة**

```returns
type: number
description: "`-1` عندما تكون أقصر، أو `0` عند التساوي، أو `1` عندما تكون أطول."
```

```js
hours(1).compare(minutes(90)); // -1
date('2026-01-01').until('2026-02-01').compare(days(31)); // 0
```
:::

### فحوصات الإشارة

فحوصات بلا معاملات للتحقق من المدد الصفرية أو السالبة:

| الطريقة | النوع | الوصف |
|---|---|---|
| `isZero()` | `boolean` | ما إذا كانت جميع الوحدات في المدة تساوي صفرًا. |
| `isNegative()` | `boolean` | ما إذا كانت المدة سالبة. |

## التنسيق والتحويل

:::entry
### `format()` :kind[method]

```js signature
dur.format(style?, locale?): string
```

تنسّق المدة وفق الإعداد المحلي النشط باستخدام `Intl.DurationFormat`. يُرحَّل فائض وحدات الساعة تلقائيًا حتى الساعات، وتبقى الوحدات الأصغر من الثانية مخفية متى وُجدت وحدات أكبر.

**المعاملات**

```params
- name: style
  type: "'long' | 'short' | 'narrow' | 'digital'"
  default: "'long'"
  description: نمط عرض تسميات الوحدات (`'long'` أو `'short'` أو `'narrow'`)، أو `'digital'` لعرض مؤقّت مفصول بنقطتين.
- name: locale
  type: string
  description: وسم إعداد محلي BCP 47 يتجاوز الإعداد المحلي لهذه المدة أو الإعداد العام لهذا الاستدعاء فقط.
```

**القيمة المُرجَعة**

```returns
type: string
description: سلسلة نصية للمدة منسّقة وفق الإعداد المحلي.
```

```js
const span = duration('2h 30m');

span.format('long', 'en-US'); // '2 hours, 30 minutes'
span.format('short', 'en-US'); // '2 hr, 30 min'
span.format('narrow', 'en-US'); // '2h 30m'
span.format('digital', 'en-US'); // '2:30:00'
```
:::

:::entry
### `locale()` :kind[method]

```js signature
dur.locale(): Locale | undefined
dur.locale(tag): Duration
```

تقرأ الإعداد المحلي المحفوظ مع هذه المدة، أو تُرجع نسخة منسّقة بإعداد محلي آخر عبر المعاينات النصية والقوالب الجاهزة وسلاسل العمليات الحسابية. يؤدي تمرير وسم فارغ إلى مسح الإعداد المحلي المحفوظ، وتعمل [`lang()`](#lang) اسمًا بديلًا.

**المعاملات**

```params
- name: tag
  type: Locale | null | undefined
  description: وسم إعداد محلي BCP 47 يُحفظ مع النسخة الجديدة، أو `null` لمسح الوسم الحالي.
```

**القيمة المُرجَعة**

```returns
type: Duration | Locale | undefined
description: الوسم النشط عند الاستدعاء بلا معاملات، أو كائن `Duration` جديد يحمل `tag`.
```

```js
import { days } from 'native-dates';

const wait = days(2).locale('ar');

wait.locale(); // 'ar'
wait.text; // 'يومان'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
dur.lang(): Locale | undefined
dur.lang(tag): Duration
```

اسم بديل مختصر للطريقة [`locale()`](#locale) يقرأ وسم الإعداد المحلي BCP 47 على هذه المدة أو يربطها بوسم جديد.
:::

:::entry
### `toFields()` :kind[method]

```js signature
dur.toFields(): DurationFields
```

تُرجع كائنًا عاديًا يضم حقول الوحدات غير الصفرية فقط بأسمائها الجمعية بالإنجليزية.

```js
duration('1h 30m').toFields(); // { hours: 1, minutes: 30 }
```
:::

:::entry
### `toString()` :kind[method]

```js signature
dur.toString(): string
dur.toJSON(): string
```

تُرجع سلسلة المدة بصيغة ISO 8601. وتُرجع `toJSON()` السلسلة نفسها عند التسلسل باستخدام `JSON.stringify()`.

**القيمة المُرجَعة**

```returns
type: string
description: سلسلة مدة بصيغة ISO 8601، مثل `'PT1H30M'`.
```

```js
const ttl = duration('1h 30m');

ttl.toString(); // 'PT1H30M'
JSON.stringify({ ttl }); // '{"ttl":"PT1H30M"}'
```
:::

:::entry
### `toMilliseconds()` :kind[method]

```js signature
dur.toMilliseconds(): number
```

تُرجع إجمالي المدة بالمللي ثانية. ترمي مدد الأشهر أو السنوات غير المرتبطة بتاريخ بداية خطأ `RangeError`.

```js
hours(2).toMilliseconds(); // 7200000
```
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
dur.toTemporal(): Temporal.Duration
```

تُرجع كائن `Temporal.Duration` الأساسي.
:::

:::entry
### `valueOf()` :kind[method]

```js signature
dur.valueOf(): number
```

تُرجع إجمالي المدة بالمللي ثانية كي تعمل المدد ثابتة القياس أو المرتبطة بتاريخ بداية مع المؤقّتات وعوامل المقارنة الرقمية.
:::
