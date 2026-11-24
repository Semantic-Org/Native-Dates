---
source: 68d49ce6b3ea
title: monthNames()
lede: إرجاع مصفوفات موطّنة لأسماء الأشهر وأيام الأسبوع لترويسات التقويم والقوائم.
---

## تسميات التقويم

تقرأ كلتا الدالتين المساعدتين من جداول `Intl` المخزّنة مؤقتًا في النواة وتُرجعان مصفوفة جديدة في كل استدعاء؛ فيستطيع المستدعي تحويل القائمة أو تقطيعها أو عكسها بحرية دون تعديل حالة مشتركة.

:::entry
### `monthNames()` :kind[function]

```js signature
monthNames(style?, locale?): string[]
```

تُرجع مصفوفة من 12 اسمًا موطّنًا لأشهر التقويم الميلادي من يناير حتى ديسمبر. وترجع افتراضيًا إلى الأسماء الكاملة وفق [الإعداد المحلي المضبوط](/api/configure/).

**المعاملات**

```params
- name: style
  type: "'long' | 'short'"
  default: "'long'"
  description: "الأسماء الكاملة للأشهر مثل `'January'` أو المختصرة مثل `'Jan'`."
- name: locale
  type: Locale
  description: وسم الإعداد المحلي BCP 47 الذي يتجاوز الإعداد الافتراضي المضبوط.
```

**القيمة المُرجَعة**

```returns
type: string[]
description: اثنتا عشرة تسمية للأشهر مرتبة من الفهرس `0` ليناير حتى `11` لديسمبر.
```

```js title="months.js"
import { monthNames } from 'native-dates';

monthNames('short', 'en-US');
// ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

monthNames('long', 'fr-FR').slice(0, 3);
// ['janvier', 'février', 'mars']
```
:::

:::entry
### `weekdayNames()` :kind[function]

```js signature
weekdayNames(style?, firstDay?, locale?): string[]
```

تُرجع مصفوفة من 7 تسميات موطّنة لأيام الأسبوع مُدوَّرة لتبدأ بيوم `firstDay`، أو بإعداد `weekStart` المضبوط في [إعدادات التطبيق](/api/configure/)، أو باليوم الأول في الأسبوع وفق الإعداد المحلي النشط.

تتّبع حدود الأسابيع في [`startOf('week')`](/api/calendar-date/#startof) ونطاقات الأسابيع قاعدة اليوم الأول نفسها، فتتطابق ترويسات التقويم دائمًا مع شبكات الأسابيع. وتنطبق هنا أيضًا تسميات أيام الأسبوع المخصّصة المضبوطة عبر [`configure()`](/api/configure/).

**المعاملات**

```params
- name: style
  type: "'short' | 'long' | 'narrow'"
  default: "'short'"
  description: "تسميات مختصرة مثل `'Mon'`، أو أسماء طويلة كاملة مثل `'Monday'`، أو ترويسات مضغوطة من حرفين أو حرف واحد مثل `'Mo'`."
- name: firstDay
  type: DayOfWeek
  description: اسم يوم البداية بالإنجليزية من أيام الأسبوع أو رقم ISO من 1 ليوم الاثنين حتى 7 ليوم الأحد.
- name: locale
  type: Locale
  description: وسم الإعداد المحلي BCP 47 الذي يتجاوز الإعداد الافتراضي المضبوط.
```

**القيمة المُرجَعة**

```returns
type: string[]
description: سبع تسميات لأيام الأسبوع تبدأ بـ `firstDay` أو `weekStart` المضبوط أو اليوم الأول في الإعداد المحلي.
```

```js
import { date, weekdayNames } from 'native-dates';

weekdayNames('short', undefined, 'en-US');
// ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

weekdayNames('narrow', undefined, 'en-US');
// ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

weekdayNames('narrow', undefined, 'pt-BR');
// ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

weekdayNames('short', 'monday', 'en-US');
// ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const daysInGrid = date('2026-11-18', { locale: 'en-US' }).range('week').every('day');
daysInGrid[0].format({ weekday: 'short' }); // 'Sun'
```
:::
