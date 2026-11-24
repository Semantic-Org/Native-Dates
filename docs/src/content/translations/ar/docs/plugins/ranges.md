---
source: c784c44bf2d7
title: ranges
lede: اطرح النطاقات المتداخلة وادمج النطاقات المتجاورة عبر جميع أنواع النطاقات.
---

## عمليات المجموعات على النطاقات

توفّر [النطاقات](/api/ranges/) الأساسية فحص الاحتواء والتداخل والتقاطع. ويضيف استيراد هذه الإضافة طريقتَي `subtract()` و`union()` على `DateRange` و`DateTimeRange` و`TimeRange`، ويصدّر الدالة `mergeRanges()` لدمج قوائم النطاقات.

```js title="ranges.js"
import { mergeRanges } from '@native-dates/plugins/ranges';
import { dateRange, timeRange } from 'native-dates';

const trip = dateRange('2026-11-01', '2026-11-10');
trip.subtract('2026-11-04/2026-11-06').map(String);
// ['2026-11-01/2026-11-03', '2026-11-07/2026-11-10']

dateRange('2026-11-01', '2026-11-05').union('2026-11-06/2026-11-10')?.toString();
// '2026-11-01/2026-11-10'

mergeRanges([
  timeRange('22:00', '02:00'),
  timeRange('01:00', '06:00'),
  timeRange('10:00', '12:00'),
]).map(String);
// ['10:00:00/12:00:00', '22:00:00/06:00:00']
```

يحتفظ كل صنف نطاق بقاعدة طرفيه الخاصة؛ فنطاقات التواريخ التقويمية شاملة للحدّين، بينما تستبعد نطاقات التواريخ والأوقات ونطاقات الأوقات نقطة النهاية.

## طرق الكائنات

:::entry
### `subtract()` :kind[method]

```js signature
range.subtract(other): Range[]
```

تطرح الامتداد الذي يغطّيه `other` من هذا النطاق وتُرجع مصفوفة تضم صفرًا أو نطاقًا واحدًا أو نطاقين متبقيين من النوع نفسه. وتحتفظ النطاقات المُرجَعة بالإعداد المحلي والمنطقة الزمنية للكائن المستدعى.

يُرجع طرح نطاق منفصل أو فارغ النطاقَ الأصلي داخل مصفوفة من عنصر واحد. أما استدعاء `subtract()` على نطاق تواريخ وأوقات فارغ أو نطاق أوقات فارغ فيُرجع مصفوفة فارغة.

**المعاملات**

```params
- name: other
  type: Range | string
  required: true
  description: كائن نطاق أو سلسلة فترة من النوع نفسه لطرحه.
```

**القيمة المُرجَعة**

```returns
type: Array<DateRange | DateTimeRange | TimeRange>
description: مصفوفة مرتّبة من النطاقات المتبقية من النوع نفسه.
```

```js
import '@native-dates/plugins/ranges';
import { dateRange, datetimeRange, timeRange } from 'native-dates';

dateRange('2026-11-01', '2026-11-10').subtract('2026-11-01/2026-11-03').map(String);
// ['2026-11-04/2026-11-10']

const day = datetimeRange('2026-11-02T09:00', '2026-11-02T17:00', 'America/New_York');
day.subtract('2026-11-02T12:00/2026-11-02T13:00').map((part) => `${part.start.hour}-${part.end.hour}`);
// ['9-12', '13-17']

timeRange('22:00', '06:00').subtract('23:00 - 02:00').map(String);
// ['22:00:00/23:00:00', '02:00:00/06:00:00']
```
:::

:::entry
### `union()` :kind[method]

```js signature
range.union(other): Range | null
```

تدمج هذا النطاق مع نطاق متداخل معه أو مجاور له مباشرةً من النوع نفسه، وتُرجع `null` إذا فصلت بينهما فجوة. وتحتفظ النطاقات المُرجَعة بالإعداد المحلي والمنطقة الزمنية للكائن المستدعى.

يُعدّ نطاقا `DateRange` متجاورَين عندما يبدأ الثاني في اليوم التالي مباشرةً لنهاية الأول. أما نطاقا `DateTimeRange` أو `TimeRange` فيُعدّان متجاورَين عندما ينتهي أحدهما عند بداية الآخر تمامًا، بينما لا تُحدث النطاقات الفارغة أي تغيير.

**المعاملات**

```params
- name: other
  type: Range | string
  required: true
  description: كائن نطاق أو سلسلة فترة من النوع نفسه لدمجه مع النطاق الحالي.
```

**القيمة المُرجَعة**

```returns
type: DateRange | DateTimeRange | TimeRange | null
description: "نطاق مدمج من النوع نفسه، أو `null` عند وجود فجوة تفصل بينهما."
```

```js
import '@native-dates/plugins/ranges';
import { dateRange, timeRange } from 'native-dates';

dateRange('2026-11-01', '2026-11-05').union('2026-11-06/2026-11-10')?.toString();
// '2026-11-01/2026-11-10'

dateRange('2026-11-01', '2026-11-05').union('2026-11-07/2026-11-10');
// null

timeRange('22:00', '06:00').union('06:00 - 08:00')?.toString();
// '22:00:00/08:00:00'
```
:::

## دمج المجموعات

:::entry
### `mergeRanges()` :kind[function]

```js signature
mergeRanges(ranges): Range[]
```

تفرز أي بنية قابلة للتكرار من نطاقات متحدة النوع وتدمج كل النطاقات المتداخلة أو المتجاورة في أقل عدد ممكن من النطاقات المنفصلة. وتُستبعَد نطاقات التواريخ والأوقات ونطاقات الأوقات الفارغة من النتيجة.

يرمي تمرير نطاقات من أنواع مختلطة خطأ `TypeError` بالرمز `conflictingRanges`، ويرمي تمرير عناصر ليست نطاقات خطأ `TypeError` بالرمز `invalidRange`.

**المعاملات**

```params
- name: ranges
  type: Iterable<DateRange> | Iterable<DateTimeRange> | Iterable<TimeRange>
  required: true
  description: مصفوفة أو Set أو أي بنية قابلة للتكرار من نطاقات تشترك في النوع نفسه.
```

**القيمة المُرجَعة**

```returns
type: Array<DateRange | DateTimeRange | TimeRange>
description: أصغر مصفوفة مرتّبة من النطاقات غير المتداخلة من النوع نفسه.
```

```js
import { mergeRanges } from '@native-dates/plugins/ranges';
import { dateRange, datetimeRange } from 'native-dates';

mergeRanges([
  dateRange('2026-11-12', '2026-11-15'),
  dateRange('2026-11-01', '2026-11-05'),
  dateRange('2026-11-06', '2026-11-08'),
]).map(String);
// ['2026-11-01/2026-11-08', '2026-11-12/2026-11-15']

mergeRanges([
  datetimeRange('2026-11-02T11:00', '2026-11-02T12:00', 'UTC'),
  datetimeRange('2026-11-02T09:00', '2026-11-02T11:00', 'UTC'),
]).map((part) => part.duration.hours);
// [3]
```
:::

## نطاقات الأوقات الليلية

تلتفّ نطاقات `TimeRange` الليلية عبر منتصف الليل بسلاسة داخل `subtract()` و`union()` و`mergeRanges()`. وتلتحم الأجزاء المتجاورة التي تلتقي عند منتصف الليل مجددًا في نطاق ليلي واحد.

```js
import '@native-dates/plugins/ranges';
import { timeRange } from 'native-dates';

timeRange('22:00', '06:00').subtract('01:00 - 03:00').map(String);
// ['22:00:00/01:00:00', '03:00:00/06:00:00']

timeRange('22:00', '00:00').union('00:00 - 06:00')?.toString();
// '22:00:00/06:00:00'
```

:::note[تغطية اليوم كاملًا لمدة 24 ساعة]
يُعدّ كائن `TimeRange` المتساوي في وقت البداية والنهاية فارغًا، لذا لا يستطيع كائن `TimeRange` واحد تمثيل 24 ساعة كاملة. ويرمي استدعاء `union()` أو `mergeRanges()` على نطاقات أوقات تغطّي اليوم كاملًا خطأ `RangeError` بالرمز `unsupportedUnion`.
:::
