---
source: a8aba5e485f9
title: legacy-date
lede: دوال قراءة وتنسيق متوافقة مع Date.prototype على DateTime للانتقال التدريجي دون تعديل الكائن.
---

## الانتقال التدريجي من استدعاءات Date

استورد هذه الإضافة مرة واحدة لإلحاق دوال قراءة فقط بالنموذج الأولي لـ [`DateTime`](/api/date-time/). عندئذٍ تستطيع الدوال المساعدة والمنسّقات والمكوّنات القائمة التي تتوقع دوال `Date` الأصلية استقبال كائن `DateTime` مباشرةً بينما تنقل الشيفرة ملفًا تلو الآخر.

```js title="legacy-date.js"
import '@native-dates/plugins/legacy-date';
import { datetime } from 'native-dates';

const moment = datetime('2026-09-06T14:30:15.250', 'America/New_York');

moment.getFullYear(); // 2026
moment.getMonth(); // 8 (سبتمبر، يبدأ العدّ من 0 مثل Date)
moment.getDate(); // 6
moment.getHours(); // 14 (في America/New_York، لا المنطقة الزمنية لنظام التشغيل)
moment.getUTCHours(); // 18
```

تقرأ تواريخ JavaScript الأصلية الحقول المحلية دائمًا وفق المنطقة الزمنية لنظام تشغيل الجهاز. أما `DateTime` فيقيّم كل دالة قراءة محلية وكل دالة تنسيق حسب الإعداد المحلي داخل منطقته `zone` الخاصة.

:::warning[الأشهر تبدأ من 0 والأحد = 0]
تُبقي دوال القراءة القديمة على الترقيم الأصلي حتى لا تتعطل الاستدعاءات القائمة بصمت. تمتد `getMonth()` من 0 إلى 11، وتُرجع `getDay()` القيمة 0 ليوم الأحد، بينما تبدأ الخصائص الأساسية في المكتبة عدّ الأشهر من 1 وأيام الأسبوع من الاثنين.
:::

## دوال القراءة المرتبطة بالمنطقة الزمنية وUTC

تتوفر جميع دوال القراءة القياسية على كل كائن `DateTime`.

| الدالة | القيمة المُرجَعة | السلوك على DateTime |
|---|---|---|
| `getTime()` | `number` | عدد المللي ثانية منذ عصر Unix، وهو مطابق لـ `dt.epochMilliseconds`. |
| `getFullYear()` | `number` | السنة التقويمية من 4 أرقام في `dt.zone`. |
| `getMonth()` | `number` | الشهر بترقيم يبدأ من الصفر: من 0 ليناير إلى 11 لديسمبر في `dt.zone`. |
| `getDate()` | `number` | يوم الشهر من 1 إلى 31 في `dt.zone`. |
| `getDay()` | `number` | يوم الأسبوع من 0 للأحد إلى 6 للسبت في `dt.zone`. |
| `getHours()`، `getMinutes()`، `getSeconds()`، `getMilliseconds()` | `number` | حقول الساعة محسوبةً في `dt.zone`. |
| `getTimezoneOffset()` | `number` | الإزاحة بالدقائق غرب UTC لـ `dt.zone`، مثل `240` للإزاحة `-04:00` أو `-330` للإزاحة `+05:30`. |
| `getUTCFullYear()`، `getUTCMonth()`، `getUTCDate()`، `getUTCDay()` | `number` | الحقول التقويمية بتوقيت UTC مع بدء الأشهر من الصفر والأحد بوصفه 0. |
| `getUTCHours()`، `getUTCMinutes()`، `getUTCSeconds()`، `getUTCMilliseconds()` | `number` | حقول الساعة بتوقيت UTC. |

```js
const kolkata = datetime('2026-01-06T09:00', 'Asia/Kolkata');

kolkata.getTimezoneOffset(); // -330
kolkata.getHours(); // 9
kolkata.getUTCHours(); // 3
```

## دوال السلاسل النصية والإعداد المحلي

تطابق دوال السلاسل النصية القديمة المخرجات الأصلية مع اعتماد المنطقة الزمنية الخاصة بالكائن افتراضيًا عند التنسيق حسب الإعداد المحلي.

| الدالة | القيمة المُرجَعة | السلوك على DateTime |
|---|---|---|
| `toISOString()` | `string` | طابع زمني بتوقيت UTC بدقة المللي ثانية، حتى عندما يحمل الكائن أجزاءً أدقّ من المللي ثانية. |
| `toLocaleString(locales?, options?)` | `string` | التاريخ والوقت منسّقَين في `dt.zone` ووفق [`dt.locale()`](/api/date-time/#locale) ما لم يُتجاوز ذلك. |
| `toLocaleDateString(locales?, options?)` | `string` | جزء التاريخ منسّقًا في `dt.zone` ووفق `dt.locale()` ما لم يُتجاوز ذلك. |
| `toLocaleTimeString(locales?, options?)` | `string` | جزء الوقت منسّقًا في `dt.zone` ووفق `dt.locale()` ما لم يُتجاوز ذلك. |

```js
const flight = datetime('2026-09-06T14:30:15.250', 'America/New_York');

flight.toISOString(); // '2026-09-06T18:30:15.250Z'
flight.toLocaleDateString('en-US'); // '9/6/2026'
flight.toLocaleTimeString('en-US'); // '2:30:15 PM'
flight.toLocaleTimeString('en-US', { timeZone: 'UTC' }); // '6:30:15 PM'
```

## دوال الضبط المُعدِّلة ترمي خطأً عند استدعائها

كائنات `DateTime` غير قابلة للتعديل، لذلك ترمي كل دالة من دوال الضبط المُعدِّلة خطأً وتوجّه المستدعي إلى [`set()`](/api/date-time/#set) أو [`plus()`](/api/date-time/#plus).

| المجموعة | الدوال المحجوبة | البديل غير القابل للتعديل |
|---|---|---|
| عصر Unix | `setTime()` | مرّر المللي ثانية منذ عصر Unix إلى [`datetime()`](/api/datetime-fn/). |
| الحقول المحلية | `setFullYear()`، `setMonth()`، `setDate()`، `setHours()`، `setMinutes()`، `setSeconds()`، `setMilliseconds()` | استبدل الحقول في `dt.zone` باستخدام [`dt.set()`](/api/date-time/#set). |
| حقول UTC | `setUTCFullYear()`، `setUTCMonth()`، `setUTCDate()`، `setUTCHours()`، `setUTCMinutes()`، `setUTCSeconds()`، `setUTCMilliseconds()` | انتقل إلى UTC أولًا عبر [`dt.in('UTC').set()`](/api/date-time/#in). |

```js
const reminder = datetime('2026-09-06T14:30Z');

try {
  reminder.setHours(9);
} catch (err) {
  err.code; // 'immutable'
}

const updated = reminder.set('hour', 9);
updated.hour; // 9
```

## متى تستخدم toJSDate بدلًا من هذه الإضافة

لا يحاكي `DateTime` أبدًا نتيجة `instanceof Date` ولا وسم الكائن الأصلي. عندما تمرّر طابعًا زمنيًا إلى مكتبة رسوم بيانية أو مشغّل قاعدة بيانات أو أداة تحقق تفحص هوية الكائن أو تعدّل نسختها في موضعها، استدعِ [`toJSDate()`](/api/date-time/#tojsdate) من القلب الأساسي بدلًا من ذلك:

```js
const nativeDate = datetime('2026-09-06T14:30Z').toJSDate();
nativeDate instanceof Date; // true
```
