---
source: 21708b5b4a6f
title: المناطق الزمنية
lede: اعرض اللحظات الزمنية في أي منطقة زمنية من IANA، وتنقّل بسلاسة عبر انتقالات التوقيت الصيفي.
---

يجمع كائن [`DateTime`](/api/date-time/) بين أمرين: توقيت وقوع اللحظة الزمنية والمنطقة الزمنية التي تقرؤها بها. يمنحك تغيير المنطقة الزمنية عرضًا آخر للحظة نفسها، بينما تتولّى بيئة التشغيل كل إزاحة UTC وكل انتقال للتوقيت الصيفي.

## ربط لحظة زمنية بمنطقة زمنية

مرّر اسم منطقة زمنية من IANA مثل `'America/New_York'`، أو `'UTC'`، أو إزاحة ثابتة عند إنشاء لحظة زمنية:

```js
import { date, datetime } from 'native-dates';

const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
const eastCoast = datetime('2026-11-16T12:30', 'America/New_York');
const audit = datetime('2026-11-16T17:30:00Z', 'UTC');

standup.zone; // 'America/Los_Angeles'
standup.offset; // '-08:00'
```

عند حذف المنطقة الزمنية، تستخدم اللحظات الزمنية قيمتك الافتراضية المضبوطة، وترجع افتراضيًا إلى المنطقة الزمنية المحلية لبيئة التشغيل.

اضبط منطقة زمنية افتراضية على مستوى التطبيق مرة واحدة عند بدء التشغيل عبر [`configure()`](/api/configure/):

```js
import { configure, now } from 'native-dates';

configure({ zone: 'Europe/Berlin' });
now().zone; // 'Europe/Berlin'
```

## عرض اللحظة نفسها في مدينة أخرى

استدعِ [`in()`](/api/date-time/#in) لعرض اللحظة نفسها في مدينة أخرى. تتحدّث خصائص التقويم والساعة المحلية لتطابق المنطقة الزمنية المستهدفة، بينما يبقى الطابع الزمني الأساسي مطابقًا تمامًا:

```js
import { date } from 'native-dates';

const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
const berlin = standup.in('Europe/Berlin');
const tokyo = standup.in('Asia/Tokyo');

berlin.format('time', 'en-US'); // '6:30 PM'
tokyo.day; // 17
berlin.equals(standup); // true
```

## الإزاحة تحدّد اللحظة لا المنطقة الزمنية

تنتهي النصوص الواردة من قواعد البيانات وواجهات API غالبًا بحرف `Z` أو بإزاحة رقمية. تثبّت هذه اللاحقة توقيت وقوع اللحظة، بينما يظل كائن `DateTime` الجديد يستخدم المنطقة الزمنية التي طلبتها:

```js
import { datetime } from 'native-dates';

const created = datetime('2026-03-07T14:00:00Z', 'America/New_York');
const berlin = datetime('2026-03-07T16:00:00+02:00', 'Europe/Berlin');

created.zone; // 'America/New_York'
created.hour; // 9
berlin.hour; // 15
```

تظهر أهمية الاحتفاظ باسم منطقة IANA الحقيقي فور إضافة أيام أو أشهر تعبر تغيّر التوقيت الصيفي.

فالإزاحة الثابتة لا تتبدّل مع الفصول، في حين تعرف منطقة IANA كل قاعدة انتقال محلية.

:::note[العمل بتوقيت UTC]
مرّر `'UTC'` كمنطقة زمنية عندما تريد حساب الخصائص والعمليات التقويمية بتوقيت UTC. أمّا طرق التحويل إلى نص مثل [`toString()`](/api/date-time/#tostring) فتكتب دائمًا نصوص UTC بغض النظر عن منطقة العرض. راجع [التخزين والإرسال](/guides/storing-and-sending/).
:::

## انتقالات التوقيت الصيفي

تختلف وحدات التقويم عن وحدات الساعة عند تبدّل التوقيت. ففي 8 مارس 2026، تقدّم نيويورك الساعة من 2:00 صباحًا إلى 3:00 صباحًا، ليصبح طول ذلك الأحد 23 ساعة فقط.

إضافة يوم واحد تحافظ على موعد الساعة 9:00 صباحًا بالتوقيت المحلي، بينما تحسب إضافة 24 ساعة مرور 24 ساعة فعلية:

```js
import { datetime } from 'native-dates';

const saturday = datetime('2026-03-07T09:00', 'America/New_York');

saturday.plus(1, 'day').text; // 'Mar 8, 2026, 9:00 AM EDT'
saturday.plus(24, 'hours').text; // 'Mar 8, 2026, 10:00 AM EDT'
saturday.plus(1, 'day').hoursInDay; // 23
```

:::warning[الأوقات المتخطّاة عند تقديم الساعة]
عندما تقفز الساعة من 2:00 صباحًا إلى 3:00 صباحًا، لا تقع الأوقات المحلية مثل 2:30 صباحًا أصلًا في تلك المنطقة الزمنية. وعند طلب وقت محلي متخطّى، يتقدّم الوقت بمقدار الفجوة بدل رمي خطأ.
:::

```js
const skipped = datetime('2026-03-08T02:30', 'America/New_York');
skipped.text; // 'Mar 8, 2026, 3:30 AM EDT'
```

:::details[التحكم في فجوات تقديم الساعة وتكرار تأخيرها]
مرّر خيار إزالة اللبس `disambiguation` إلى [`datetime()`](/api/datetime-fn/) أو `at()` عندما تتطلب الجدولة أو التدقيق قاعدة أخرى عند الفجوات والأوقات المتكرّرة. القيمة الافتراضية هي `'compatible'`، ويقبل الخيار أيضًا `'earlier'` أو `'later'` أو `'reject'`:

```js
const fallBack = datetime('2026-11-01T01:30', {
  zone: 'America/New_York',
  disambiguation: 'later',
});
fallBack.offset; // '-05:00'

datetime('2026-03-08T02:30', {
  zone: 'America/New_York',
  disambiguation: 'reject',
}); // يرمي RangeError [invalidDateTime]
```
:::

## أسماء المدن والاختصارات

تقبل النواة أسماء IANA القياسية و`'UTC'` والإزاحات الثابتة. استورد إضافة [`@native-dates/plugins/zones`](/plugins/zones/) للبحث بأسماء مدن IANA بالإنجليزية (مع الأسماء البديلة المضمّنة) والاختصارات الإقليمية والأسماء البديلة المخصّصة.

```js
import '@native-dates/plugins/zones';
import { configure, datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'los angeles').zone; // 'America/Los_Angeles'
datetime('2026-11-16T09:30', 'Beijing').zone; // 'Asia/Shanghai'
datetime('2026-11-16T09:30', 'PT').zone; // 'America/Los_Angeles'
datetime('2026-11-16T09:30', { zone: 'CST', locale: 'zh-CN' }).zone; // 'Asia/Shanghai'

configure({ zoneAliases: { hq: 'Europe/Berlin' } });
datetime('2026-11-16T09:30', 'hq').zone; // 'Europe/Berlin'
```

تتبع الاختصارات المشتركة مثل `CST` و`IST` إقليم الإعداد المحلي النشط، وتُربَط المدن الكبرى مثل Beijing وMumbai وOsaka بمناطقها مباشرةً بفضل الأسماء البديلة المضمّنة دون حاجة إلى تعريفها يدويًا.
