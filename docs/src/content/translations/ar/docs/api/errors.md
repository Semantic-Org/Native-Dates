---
source: 91f647c820ea
title: الأخطاء
lede: كل مدخل غير صالح أو عملية غير مدعومة ترمي كائن Error قياسيًا يحمل رمز خطأ ثابتًا مقروءًا برمجيًا.
---

## بنية الخطأ

تفشل الاستدعاءات غير الصالحة فورًا بدلًا من إرجاع كائنات تاريخ معطوبة أو قيم `NaN` تفسد العمليات الحسابية اللاحقة. كل خطأ مرمي هو خطأ JavaScript قياسي يحمل خاصيتين إضافيتين:

- **`error.code`** تحمل معرّفًا ثابتًا بصيغة camelCase مثل `'invalidDate'` أو `'unknownZone'`.
- **`error.at`** تكرّر المدخل المُسبِّب للخطأ أو هدف العملية كنص، مثل `'2026-02-30'`.

ترمي أنواع الوسائط الخاطئة والأنواع المتعارضة خطأ `TypeError`، بينما ترمي التواريخ المستحيلة والسلاسل غير المقروءة والوحدات أو المناطق الزمنية غير المعروفة والعمليات غير المدعومة خطأ `RangeError`.

```js title="catch.js"
import { date } from 'native-dates';

try {
  date('2026-02-30');
} catch (error) {
  error instanceof RangeError; // true
  error.code; // 'invalidDate'
  error.at; // '2026-02-30'
}
```

في وضع التطوير (`NODE_ENV !== 'production'`)، تتضمّن `error.message` سطرًا ثانيًا يحمل تلميحًا تشخيصيًا بالإنجليزية يشرح كيفية تصحيح الاستدعاء. وتحذف بناءات الإنتاج التي يُضبط فيها `NODE_ENV` على `'production'` نصوص التلميح تلقائيًا مع بقاء `error.code` و`error.at` ثابتين برمجيًا دون تغيير.

## التعامل مع المدخلات غير الموثوقة

افحص `error.code` عندما تريد رسائل تحقق مخصّصة لحالات فشل محدّدة، وأعِد رمي الأخطاء غير المتوقعة:

```js
import { datetime } from 'native-dates';

function parseTimestamp(raw, zone) {
  try {
    return datetime(raw, zone);
  } catch (error) {
    if (error.code === 'invalidDateTime') {
      return null;
    }
    throw error;
  }
}

parseTimestamp('not-a-date', 'UTC'); // null
```

عند قراءة حقول نماذج كتبها المستخدم أو معاملات استعلام أو خلايا CSV حيث يُفترض أن يُرجع النص غير المقروء `null`، استورد [`@native-dates/plugins/loose`](/plugins/loose/) وفعّل الوضع المرن:

```js
import { date, duration } from 'native-dates';
import '@native-dates/plugins/loose';

date('2026-02-30', { loose: true }); // null
duration('whenever', { loose: true }); // null
```

:::tip[أخطاء البيانات مقابل أخطاء الشيفرة في الوضع المرن]
يُرجع الوضع المرن `null` فقط عندما يتعذّر قراءة قيمة المدخل نفسها. أما أخطاء خيارات الاستدعاء في شيفرتك، مثل منطقة زمنية غير معروفة أو نطاق معكوس، فتظل ترمي خطأً لتبقى العلل البرمجية ظاهرة.
:::

## رموز TypeError

تشير أخطاء النوع إلى فقدان مدخل مطلوب، أو وجود نوع JavaScript خاطئ، أو انتماء القيمة إلى مفهوم زمني مختلف عمّا هو متوقع.

| الرمز | المصدر | السبب |
|---|---|---|
| `missingDateTime` | `datetime()`، `DateTime` | المدخل يساوي `null` أو `undefined`. |
| `missingDate` | `date()`، `CalendarDate` | المدخل يساوي `null` أو `undefined`. |
| `missingTime` | `time()`، `Time` | المدخل يساوي `null` أو `undefined`. |
| `missingYearMonth` | `yearMonth()`، `monthYear()`، `YearMonth` | المدخل يساوي `null` أو `undefined`. |
| `missingMonthDay` | `monthDay()`، `dayMonth()`، `MonthDay` | المدخل يساوي `null` أو `undefined`. |
| `invalidDateTime` | `datetime()`، `DateTime` | المدخل من نوع غير مدعوم مثل قيمة منطقية. |
| `invalidDate` | `date()`، `CalendarDate` | المدخل عدد واحد مجرّد أو نوع غير مدعوم. |
| `invalidTime` | `time()`، `Time` | المدخل من نوع غير مدعوم. |
| `invalidYearMonth` | `yearMonth()`، `monthYear()`، `YearMonth` | المدخل عدد واحد أو نوع غير مدعوم. |
| `invalidMonthDay` | `monthDay()`، `dayMonth()`، `MonthDay` | المدخل عدد واحد أو نوع غير مدعوم. |
| `invalidDuration` | `duration()`، `Duration`، `plus()`، `minus()` | المدخل `null` أو `undefined` أو نوع غير مدعوم، أو وحدة مُمرَّرة مع مدة لها وحدات بالفعل. |
| `unsupportedCalendar` | `yearMonth()`، `monthDay()`، `YearMonth`، `MonthDay` | المدخل كائن `Temporal.PlainYearMonth` أو `PlainMonthDay` بتقويم غير ISO. |
| `invalidPoint` | `compare()`، `earliest()`، `latest()` | القيمة ليست `DateTime` ولا `CalendarDate` ولا `Time` ولا `YearMonth` ولا `Date` ولا طابع عصر Unix ولا نقطة Temporal ولا سلسلة قابلة للتحليل. |
| `conflictingKinds` | `compare()`، `earliest()`، `latest()` | مقارنة قيم من أنواع مختلفة، مثل `CalendarDate` مع `DateTime`. |
| `conflictingRanges` | `DateRange`، `DateTimeRange`، `TimeRange` | تمرير نطاق من نوع إلى باني صنف أو دالة مصنعية لنطاق من نوع آخر. |

## رموز RangeError

تشير أخطاء النطاق إلى تعذّر تحليل قيمة، أو خروجها عن الحدود الصالحة، أو طلب وحدة أو منطقة زمنية أو عملية غير مدعومة.

### التحليل والقيم

| الرمز | المصدر | السبب |
|---|---|---|
| `invalidDateTime` | `datetime()`، `DateTime` | تعذّر تحليل السلسلة كتاريخ ووقت، أو احتواء الحقول على قيم خارج النطاق مثل 30 فبراير. |
| `invalidDate` | `date()`، `CalendarDate` | تعذّر تحليل السلسلة كتاريخ، أو تمرير أعداد كسرية، أو خروج الحقول عن النطاق. |
| `missingDay` | `date()`، `CalendarDate` | إغفال وسيط `day` في الاستدعاء الرقمي `(year, month)`. |
| `invalidTime` | `time()`، `Time` | تعذّر تحليل السلسلة كوقت ساعة، أو خروج قيمة نظام 12 ساعة عن النطاق من 1 إلى 12، أو خروج حقول الساعة عن النطاق. |
| `invalidYearMonth` | `yearMonth()`، `monthYear()`، `YearMonth` | تعذّر تحليل السلسلة كسنة وشهر، أو تمرير أعداد كسرية، أو خروج الشهر عن النطاق من 1 إلى 12. |
| `invalidMonthDay` | `monthDay()`، `dayMonth()`، `MonthDay` | تعذّر تحليل السلسلة كشهر ويوم، أو تمرير فاصل ملتبس إلى `equals()`، أو خروج الحقول عن النطاق. |
| `invalidYear` | `MonthDay.in()` | السنة المُمرَّرة إلى `in()` ليست عددًا صحيحًا أو تقع خارج نطاق السنوات المدعوم في Temporal. |
| `invalidDay` | `YearMonth.on()` | اليوم المُمرَّر إلى `on()` ليس عددًا صحيحًا من 1 إلى 31. |
| `invalidDuration` | `duration()`، `Duration` | عبارة مدة بالإنجليزية فارغة أو غير قابلة للتحليل، أو سلسلة ISO 8601 غير صالحة، أو حقول مدة خارج النطاق. |
| `invalidNumber` | `datetime()`، `duration()`، دوال الوحدات المساعدة | المدخل الرقمي هو `NaN` أو `Infinity` أو `-Infinity` أو كائن `Date` غير صالح. |
| `conflictingSigns` | `duration()`، `Duration`، `minus()` | خلط وحدات موجبة وسالبة لا يمكن الاستلاف بينها بوضوح، مثل `'1h -30m'` أو طرح ساعات من أيام غير مرتكزة على تاريخ. |
| `invalidFraction` | `duration()`، `months()`، `times()` | تعذّر تحويل كسور الأشهر أو النانو ثانية إلى وحدة ثابتة أصغر. |

### الوحدات والمناطق الزمنية والتنسيقات

| الرمز | المصدر | السبب |
|---|---|---|
| `unknownUnit` | الحساب والحدود والتقريب و`set()` و`duration()` | اسم وحدة بالإنجليزية أو اختصار غير معروف. |
| `unknownDayOfWeek` | `dayOfWeek()`، `next()`، `previous()`، حدود الأسابيع، `configure()` | اسم يوم بالإنجليزية غير معروف، أو رقم يوم في الأسبوع خارج النطاق من 1 إلى 7. |
| `unknownSetting` | `configure()` | مفتاح إعداد مُمرَّر إلى `configure()` غير معروف. |
| `unknownWidth` | `configure()` | إدخال `weekdayNames` يحدّد عرض تسمية غير `narrow` أو `short` أو `long`، أو يُغفل عرض التسمية. |
| `unknownZone` | الدوال المصنعية، `in()`، `configure()` | معرّف منطقة زمنية IANA غير معروف، أو منطقة ليست سلسلة نصية، أو إزاحة UTC غير صالحة الصيغة. |
| `invalidZoneAliases` | `configure()` | قيمة `zoneAliases` ليست كائنًا عاديًا ولا `null`. |
| `unknownLocale` | `locale()`، الدوال المصنعية، `format()`، `monthNames()`، `weekdayNames()`، `configure()` | احتواء وسم الإعداد المحلي أو قائمة الوسوم أو ترويسة `Accept-Language` على وسم غير صالح. |
| `unknownFormat` | `format()`، `monthNames()`، `weekdayNames()` | مواصفة تنسيق أو خيارات `Intl` غير صالحة، أو نمط مدة أو تسمية غير مدعوم، أو رموز غير معروفة أو ملتصقة خارج `[brackets]`. |
| `unsupportedToken` | `format()` | طلب نمط الرموز حقلًا لا تحمله القيمة، مثل `HH` على `CalendarDate` أو `YYYY` على `Time`. |
| `unknownKind` | `as()`، `DateRange.count()` | النوع المستهدف غير مدعوم لدى الكائن المستقبِل. |

### الحساب والقياس

| الرمز | المصدر | السبب |
|---|---|---|
| `unsupportedUnit` | `CalendarDate`، `Time`، `YearMonth` | استخدام وحدات الساعة على `CalendarDate`، أو وحدات التقويم على `Time`، أو وحدات أصغر من الشهر على `YearMonth`. |
| `cannotAdd` | `plus()`، `add()` | تجاوز الجمع نطاق التواريخ القابل للتمثيل في Temporal. |
| `cannotSubtract` | `minus()`، `subtract()` | تجاوز الطرح نطاق التواريخ القابل للتمثيل في Temporal. |
| `cannotSet` | `set()` | قيمة الحقل كسرية أو خارج النطاق لذلك الشهر التقويمي أو وحدة الساعة. |
| `cannotRound` | `round()`، `floor()`، `ceil()`، `Time.startOf()`، `Time.startOfNext()`، `Time.startOfPrevious()` | وحدة تقريب غير مدعومة، أو مقدار خطوة لا يقسم الوحدة التالية قسمة صحيحة. |
| `missingAnchor` | `Duration.balance()`، `total()`، `compare()` | احتياج مدة غير مرتكزة إلى تاريخ بداية تقويمي لتحويل الأشهر أو السنوات إلى أسابيع أو أيام أو وحدات ساعة. |
| `cannotBalance` | `Duration.balance()` | تجاوز موازنة المدة للحدود أو فشل التقريب في Temporal. |
| `cannotTotal` | `Duration.total()`، `until()`، `since()` | تجاوز حساب المدة الإجمالية للحدود أو استخدام وحدة غير مدعومة. |
| `missingPoints` | `earliest()`، `latest()` | الاستدعاء دون وسائط أو بمصفوفة فارغة. |
| `unsupportedComparison` | `CalendarDate`، `Time`، `YearMonth`، `MonthDay`، النطاقات | التحويل الرقمي عبر `valueOf()`، أو العامل الأحادي `+`، أو العوامل `-` أو `<` أو `>` على نوع بلا رقم عصر Unix. |

### النطاقات

| الرمز | المصدر | السبب |
|---|---|---|
| `invalidRange` | `DateRange`، `DateTimeRange`، `to()` | وقوع نهاية النطاق (`end`) قبل بدايته (`start`). |
| `invalidStep` | `every()`، `split()` | مدة الخطوة المُمرَّرة إلى `every()` أو `split()` تساوي صفرًا أو سالبة. |
| `unsupportedIntersection` | `TimeRange.intersection()` | تداخل نطاقَي أوقات يعبر أحدهما على الأقل منتصف الليل في نافذتين منفصلتين. |
| `unsupportedZone` | `TimeRange.in()` | استدعاء `in()` على `TimeRange`، وهو نوع بلا تاريخ تقويمي يوضَع في منطقة زمنية. |

### الإضافات

| الرمز | المصدر | السبب |
|---|---|---|
| `missingPlugin` | الدوال المصنعية، `configure()` | استخدام `loose` أو `dayFirst` أو `zoneAliases` قبل استيراد الإضافة المطابقة. |
| `immutable` | دوال الضبط القديمة على `DateTime` | استدعاء دالة ضبط مُعدِّلة من دوال `Date` مثل `setHours()` عند تحميل [`@native-dates/plugins/legacy-date`](/plugins/legacy-date/). |
