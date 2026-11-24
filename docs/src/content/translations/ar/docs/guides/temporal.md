---
source: f19636049929
title: العمل مع Temporal
lede: كيف ترتبط Native Dates بواجهة Temporal في JavaScript وتتكامل مع كائناتها الأصلية.
---

تغلّف Native Dates واجهتَي `Temporal` و`Intl` المدمجتَين في JavaScript.

توفّر Temporal وحدات أساسية دقيقة للتقويم والمناطق الزمنية عبر كائنات خيارات صريحة، بينما تغلّف Native Dates الاستخدامات اليومية بطرق موجزة وتتكامل بسلاسة مع كائنات Temporal الأصلية.

## كيف ترتبط الأنواع بـ Temporal

يغلّف كل صنف أساسي نوعًا واحدًا من `Temporal` ويعيده إليك متى احتجت إلى تحكّم منخفض المستوى:

| النوع | ما يغلّفه | ما تضيفه Native Dates |
|---|---|---|
| [`DateTime`](/api/date-time/) | `Temporal.ZonedDateTime` | يقرأ لحظات ISO والإزاحات وكائنات `Date` وأرقام عصر Unix في نوع واحد مرتبط بمنطقة زمنية ويحوّله نصيًا إلى UTC |
| [`CalendarDate`](/api/calendar-date/) | `Temporal.PlainDate` | يقترن بـ `at(time, zone)` وينسّق القوالب الجاهزة وأنماط الرموز مباشرة |
| [`Time`](/api/time/) | `Temporal.PlainTime` | يقرأ سلاسل نظام 12 ساعة مثل `'9:30am'` إلى جانب أوقات ISO بنظام 24 ساعة |
| [`Duration`](/api/duration/) | `Temporal.Duration` | يحلّل عبارات المدة بالإنجليزية مثل `'1h 30m'`، ويرحّل الوحدات الكسرية، ويحتفظ بنقاط الارتكاز من `until()` |
| [`YearMonth`](/api/year-month/) | `Temporal.PlainYearMonth` | صنف مدمج لأشهر الفوترة وتواريخ انتهاء البطاقات مع [`monthYear()`](/api/year-month-fn/#monthyear) و`on()` |
| [`MonthDay`](/api/month-day/) | `Temporal.PlainMonthDay` | صنف مدمج لأعياد الميلاد والمواعيد المتكررة مع [`dayMonth()`](/api/month-day-fn/#daymonth) و`fallsOn()` و`next()` |

لا تشمل مواصفات Temporal النطاقات، لذا تضيف النواة [`DateRange` و`DateTimeRange` و`TimeRange`](/api/ranges/) فوق أزواج نقطتَي البداية والنهاية للتحقق من الاحتواء والتداخل والتنقل بالخطوات.

## تمرير كائنات Temporal

تقبل كل دالة مصنعية وطريقة حسابية وعملية مقارنة كائنات `Temporal` الأصلية مباشرة.

```js
import { date, datetime, time, yearMonth } from 'native-dates';

const instant = Temporal.Instant.from('2026-11-16T17:30:00Z');
const standup = datetime(instant, 'America/Los_Angeles');

const plainDate = Temporal.PlainDate.from('2026-11-16');
date(plainDate).plus(Temporal.Duration.from({ weeks: 2 }));

const plainTime = Temporal.PlainTime.from('09:30');
time(plainTime).format('short', 'en-US'); // '9:30 AM'

const ym = yearMonth(Temporal.PlainYearMonth.from('2026-11'));
ym.daysInMonth; // 30
```

يحافظ تمرير `Temporal.ZonedDateTime` إلى [`datetime()`](/api/datetime-fn/) على منطقته الزمنية ما لم تمرّر منطقة جديدة. أما تمرير `Temporal.Instant` أو تاريخ ووقت بلا منطقة فيضعه في المنطقة التي تحدّدها أو في منطقتك الافتراضية المضبوطة.

تتحوّل قيم `Temporal` وسلاسلها التي تستخدم تقويمات غير ISO مثل الياباني أو الفارسي إلى اليوم نفسه في تقويم ISO دون الحاجة إلى استدعاء `withCalendar()` أولًا.

تقبل المقارنات وقياسات المدد الفاصلة مدخلات `Temporal` مباشرة أيضًا:

```js
const berlin = Temporal.ZonedDateTime.from('2026-11-16T18:30:00+01:00[Europe/Berlin]');
standup.equals(berlin); // true
```

## استخراج الكائن الأصلي عبر toTemporal()

استدعِ [`toTemporal()`](/api/date-time/#totemporal) على أي قيمة للوصول إلى كائن `Temporal` الأساسي بداخلها.

استخدمها عند استدعاء مكتبات خارجية تتوقع كائنات `Temporal` أو عند التعامل مع أنظمة تقويم غير ISO.

```js
import { date } from 'native-dates';

const d = date('2026-11-16');
const plain = d.toTemporal(); // Temporal.PlainDate

const japanese = plain.withCalendar('japanese');
japanese.era; // 'reiwa'
japanese.eraYear; // 8
```

:::note[استخراج مباشر بلا نسخ]
يحتفظ كل كائن بنسخة Temporal أصلية في داخله، لذا تُرجع `toTemporal()` ذلك الكائن مباشرة دون إعادة تحليل أو تخصيص نسخة جديدة.
:::

## حزمة التوافق لبيئات التشغيل الأقدم

توفّر الإصدارات الحالية من Chrome وEdge وFirefox وNode 26 وما بعده وDeno وBun واجهة `Temporal` أصليًا، لذا لا تتضمّن النواة أي شيفرة لحزمة توافق (polyfill).

أما في Safari أو المتصفحات الأقدم أو Node 24 و25، فحمّل `@native-dates/polyfill` مع `temporal-polyfill` عند بدء التشغيل. راجع [دعم Safari وإصدارات Node الأقدم](/guides/installation/#supporting-safari-and-older-node) للإعداد وخيارات التحميل المتزامن.
